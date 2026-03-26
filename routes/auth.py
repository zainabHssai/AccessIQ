"""
Routes d'authentification — sécurité renforcée

  POST /api/auth/register        — demande de compte (reviewer)
  POST /api/auth/login           — connexion → JWT
  POST /api/auth/logout          — révocation du token (blacklist)
  GET  /api/auth/me              — profil utilisateur connecté
  POST /api/auth/change-password — changer son mot de passe
  GET  /api/auth/pending         — (admin) comptes en attente
  POST /api/auth/approve         — (admin) approuver / refuser
  GET  /api/auth/users           — (admin) tous les utilisateurs
  POST /api/auth/force-reset     — (admin) forcer reset mdp d'un user
"""
import re
from datetime import datetime, timedelta
import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required,
    get_jwt_identity, get_jwt
)
from extensions import db
from models import User, PasswordHistory, JWTBlacklist

auth_bp = Blueprint('auth', __name__)

BCRYPT_COST      = 12
MAX_ATTEMPTS     = 5
LOCKOUT_MINUTES  = 15
PASSWORD_HISTORY = 5
PASSWORD_MAX_AGE = 90
MIN_LENGTH       = 12

def hash_pwd(plain):
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=BCRYPT_COST)).decode()

def check_pwd(plain, hashed):
    return bcrypt.checkpw(plain.encode(), hashed.encode())

def validate_complexity(pwd):
    if len(pwd) < MIN_LENGTH:
        return f'Minimum {MIN_LENGTH} caractères requis'
    if not re.search(r'[A-Z]', pwd):
        return 'Au moins une majuscule requise'
    if not re.search(r'[a-z]', pwd):
        return 'Au moins une minuscule requise'
    if not re.search(r'\d', pwd):
        return 'Au moins un chiffre requis'
    if not re.search(r'[!@#$%^&*()\-_=+\[\]{};:,.<>?]', pwd):
        return 'Au moins un caractère spécial requis'
    return None

def is_password_in_history(user, plain):
    for entry in user.password_history[:PASSWORD_HISTORY]:
        if check_pwd(plain, entry.hash):
            return True
    return False

def save_password(user, new_hash):
    history = PasswordHistory(user_id=user.id, hash=user.password_hash)
    db.session.add(history)
    old = PasswordHistory.query.filter_by(user_id=user.id)\
          .order_by(PasswordHistory.created_at.desc())\
          .offset(PASSWORD_HISTORY).all()
    for h in old:
        db.session.delete(h)
    user.password_hash        = new_hash
    user.password_changed_at  = datetime.utcnow()
    user.password_expires_at  = datetime.utcnow() + timedelta(days=PASSWORD_MAX_AGE)
    user.must_change_password  = False
    user.failed_attempts       = 0
    user.locked_until          = None

def get_current_user():
    uid = get_jwt_identity()
    return User.query.get(int(uid)) if uid else None

@auth_bp.route('/register', methods=['POST'])
def register():
    data   = request.json or {}
    email  = data.get('email', '').strip().lower()
    pwd    = data.get('password', '')
    nom    = data.get('nom', '').strip()
    prenom = data.get('prenom', '').strip()
    titre  = data.get('titre', 'manager')
    if not all([email, pwd, nom, prenom]):
        return jsonify({'error': 'Tous les champs sont obligatoires'}), 400
    if titre not in ('manager', 'responsable_app'):
        return jsonify({'error': 'Titre invalide'}), 400
    err = validate_complexity(pwd)
    if err:
        return jsonify({'error': err}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Cet email est déjà utilisé'}), 409
    user = User(
        email=email, password_hash=hash_pwd(pwd),
        nom=nom, prenom=prenom,
        role='reviewer', titre=titre, statut='pending',
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({'message': 'Demande envoyée. Un administrateur va valider votre compte.', 'user': user.to_dict()}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data  = request.json or {}
    email = data.get('email', '').strip().lower()
    pwd   = data.get('password', '')
    user  = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401
    if user.is_locked:
        remaining = int((user.locked_until - datetime.utcnow()).total_seconds() / 60) + 1
        return jsonify({'error': f'Compte bloqué. Réessayez dans {remaining} min.'}), 423
    if not check_pwd(pwd, user.password_hash):
        user.failed_attempts += 1
        if user.failed_attempts >= MAX_ATTEMPTS:
            user.locked_until    = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
            user.failed_attempts = 0
            db.session.commit()
            return jsonify({'error': f'Trop de tentatives. Compte bloqué {LOCKOUT_MINUTES} min.'}), 423
        db.session.commit()
        remaining = MAX_ATTEMPTS - user.failed_attempts
        return jsonify({'error': f'Mot de passe incorrect. {remaining} tentative(s) restante(s)'}), 401
    user.failed_attempts = 0
    user.locked_until    = None
    db.session.commit()
    if user.statut == 'pending':
        return jsonify({'error': 'Compte en attente de validation'}), 403
    if user.statut == 'rejected':
        return jsonify({'error': 'Votre demande a été refusée'}), 403
    if user.is_password_expired:
        return jsonify({'error': 'Mot de passe expiré. Veuillez le renouveler.', 'must_change_password': True, 'user_id': user.id}), 403
    token = create_access_token(identity=str(user.id))
    resp  = {'token': token, 'user': user.to_dict()}
    if user.days_until_expiry is not None and user.days_until_expiry <= 7:
        resp['warning'] = f'Votre mot de passe expire dans {user.days_until_expiry} jour(s).'
    if user.must_change_password:
        resp['must_change_password'] = True
    return jsonify(resp)

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    jti    = get_jwt().get('jti')
    exp_ts = get_jwt().get('exp')
    expires = datetime.utcfromtimestamp(exp_ts) if exp_ts else datetime.utcnow() + timedelta(hours=1)
    db.session.add(JWTBlacklist(jti=jti, expires_at=expires))
    JWTBlacklist.query.filter(JWTBlacklist.expires_at < datetime.utcnow()).delete()
    db.session.commit()
    return jsonify({'message': 'Déconnecté avec succès'})

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404
    data    = request.json or {}
    old_pwd = data.get('old_password', '')
    new_pwd = data.get('new_password', '')
    confirm = data.get('confirm_password', '')
    if not check_pwd(old_pwd, user.password_hash):
        return jsonify({'error': 'Mot de passe actuel incorrect'}), 400
    if new_pwd != confirm:
        return jsonify({'error': 'Les mots de passe ne correspondent pas'}), 400
    err = validate_complexity(new_pwd)
    if err:
        return jsonify({'error': err}), 400
    if is_password_in_history(user, new_pwd):
        return jsonify({'error': f'Ce mot de passe a déjà été utilisé récemment (historique {PASSWORD_HISTORY})'}), 400
    save_password(user, hash_pwd(new_pwd))
    db.session.commit()
    return jsonify({'message': 'Mot de passe mis à jour avec succès'})

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404
    return jsonify(user.to_dict())

@auth_bp.route('/pending', methods=['GET'])
@jwt_required()
def pending_users():
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès réservé à l\'administrateur'}), 403
    pending = User.query.filter_by(statut='pending').order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in pending])

@auth_bp.route('/approve', methods=['POST'])
@jwt_required()
def approve_user():
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès réservé à l\'administrateur'}), 403
    data    = request.json or {}
    user_id = data.get('user_id')
    action  = data.get('action')
    if action not in ('approve', 'reject'):
        return jsonify({'error': 'Action invalide'}), 400
    user = User.query.get(user_id)
    if not user or user.statut != 'pending':
        return jsonify({'error': 'Utilisateur introuvable ou déjà traité'}), 404
    user.statut      = 'active' if action == 'approve' else 'rejected'
    user.approved_at = datetime.utcnow()
    user.approved_by = current.id
    if action == 'approve':
        user.must_change_password = True
    db.session.commit()
    return jsonify({'message': 'Compte approuvé' if action == 'approve' else 'Compte refusé', 'user': user.to_dict()})

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def all_users():
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès réservé à l\'administrateur'}), 403
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])

@auth_bp.route('/force-reset', methods=['POST'])
@jwt_required()
def force_reset():
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès réservé à l\'administrateur'}), 403
    user_id = (request.json or {}).get('user_id')
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404
    user.must_change_password = True
    db.session.commit()
    return jsonify({'message': f'Reset forcé pour {user.email}'})


# ── UPDATE PROFILE ────────────────────────────
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Met à jour nom, prénom, et email AD du profil.
    Si l'email AD change, l'ancien est conservé pour garder
    le lien avec les campagnes existantes.
    """
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    data = request.json or {}

    if 'nom'    in data and data['nom'].strip():
        user.nom    = data['nom'].strip()
    if 'prenom' in data and data['prenom'].strip():
        user.prenom = data['prenom'].strip()

    # Mise à jour email AD (email de contact pour les notifications)
    if 'email_ad' in data:
        new_email_ad = data['email_ad'].strip().lower()
        if new_email_ad and new_email_ad != user.email_ad:
            # Mettre à jour aussi dans les AccountReview existants
            from models import AccountReview
            if user.email_ad:
                AccountReview.query.filter_by(manager_email=user.email_ad)\
                    .update({'manager_email': new_email_ad})
            user.email_ad = new_email_ad

    db.session.commit()
    return jsonify({'ok': True, 'user': user.to_dict()})
