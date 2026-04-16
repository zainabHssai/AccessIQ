"""
Modèles SQLAlchemy — toutes les tables de la base de données AccessIQ

Rôles :
  "admin"    — crée les campagnes, gère les utilisateurs
  "reviewer" — manager OU responsable app (même rôle technique,
               titre choisi à l'inscription)

Sécurité mots de passe (inspiré CyberArk) :
  - bcrypt cost 12
  - rotation forcée 90 jours
  - historique 5 derniers mots de passe (interdit de réutiliser)
  - lockout après 5 tentatives (15 min)
  - complexité validée backend
  - JWT blacklist pour révocation
"""
from datetime import datetime, timedelta
from extensions import db


# ─────────────────────────────────────────────
# TABLE : users
# ─────────────────────────────────────────────
class User(db.Model):
    __tablename__ = 'users'

    id            = db.Column(db.Integer, primary_key=True)
    email         = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    nom           = db.Column(db.String(100), nullable=False)
    prenom        = db.Column(db.String(100), nullable=False)

    # "admin" | "reviewer"
    role          = db.Column(db.String(20), nullable=False)

    # Titre affiché (manager / responsable_app) — même rôle technique
    titre         = db.Column(db.String(50), nullable=True)

    # Email mis à jour par le manager lui-même (prioritaire sur l'email AD)
    email_ad      = db.Column(db.String(150), nullable=True)

    # "pending" | "active" | "rejected"
    statut        = db.Column(db.String(20), default='pending')

    created_at    = db.Column(db.DateTime, default=datetime.utcnow)
    approved_at   = db.Column(db.DateTime, nullable=True)
    approved_by   = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # ── Sécurité mot de passe ──────────────────
    # Date du dernier changement
    password_changed_at  = db.Column(db.DateTime, default=datetime.utcnow)
    # Expiration dans 90 jours
    password_expires_at  = db.Column(db.DateTime,
                                     default=lambda: datetime.utcnow() + timedelta(days=90))
    # Forcer changement au prochain login (admin peut déclencher)
    must_change_password = db.Column(db.Boolean, default=False)

    # Anti brute-force
    failed_attempts = db.Column(db.Integer, default=0)
    locked_until    = db.Column(db.DateTime, nullable=True)

    # Relations
    password_history = db.relationship('PasswordHistory', backref='user',
                                       lazy=True, cascade='all, delete-orphan',
                                       order_by='PasswordHistory.created_at.desc()')

    @property
    def is_locked(self):
        if self.locked_until and self.locked_until > datetime.utcnow():
            return True
        return False

    @property
    def is_password_expired(self):
        if self.password_expires_at and self.password_expires_at < datetime.utcnow():
            return True
        return False

    @property
    def days_until_expiry(self):
        if not self.password_expires_at:
            return None
        delta = self.password_expires_at - datetime.utcnow()
        return max(0, delta.days)

    def to_dict(self):
        return {
            'id':                   self.id,
            'email':                self.email,
            'email_ad':             self.email_ad,
            'nom':                  self.nom,
            'prenom':               self.prenom,
            'role':                 self.role,
            'titre':                self.titre,
            'statut':               self.statut,
            'created_at':           self.created_at.strftime('%d/%m/%Y %H:%M'),
            'password_expires_at':  self.password_expires_at.strftime('%d/%m/%Y') if self.password_expires_at else None,
            'days_until_expiry':    self.days_until_expiry,
            'must_change_password': self.must_change_password,
            'is_locked':            self.is_locked,
        }



# ─────────────────────────────────────────────
# TABLE : password_history
# 5 derniers hashes — interdit de réutiliser
# ─────────────────────────────────────────────
class PasswordHistory(db.Model):
    __tablename__ = 'password_history'

    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    hash       = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────
# TABLE : jwt_blacklist
# Tokens révoqués (logout, changement de mdp)
# ─────────────────────────────────────────────
class JWTBlacklist(db.Model):
    __tablename__ = 'jwt_blacklist'

    id         = db.Column(db.Integer, primary_key=True)
    jti        = db.Column(db.String(64), unique=True, nullable=False)  # JWT ID
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────
# TABLE : campaigns
# ─────────────────────────────────────────────
class Campaign(db.Model):
    __tablename__ = 'campaigns'

    id               = db.Column(db.Integer, primary_key=True)
    nom              = db.Column(db.String(150), nullable=False)
    description      = db.Column(db.Text, nullable=True)
    date_lancement   = db.Column(db.DateTime, default=datetime.utcnow)
    date_echeance    = db.Column(db.DateTime, nullable=True)
    statut           = db.Column(db.String(30), default='en_cours')
    # "en_cours" | "terminee" | "archivee"

    inactivity_days  = db.Column(db.Integer, default=120)
    sensitive_groups = db.Column(db.Text, default='Domain Admins,Enterprise Admins')

    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    accounts = db.relationship('AccountReview', backref='campaign',
                               lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id':              self.id,
            'nom':             self.nom,
            'description':     self.description,
            'date_lancement':  self.date_lancement.strftime('%d/%m/%Y'),
            'date_echeance':   self.date_echeance.strftime('%d/%m/%Y') if self.date_echeance else None,
            'statut':          self.statut,
            'inactivity_days': self.inactivity_days,
            'total':           len(self.accounts),
            'decided':         sum(1 for a in self.accounts if a.decision),
            'risk_count':      sum(1 for a in self.accounts if a.score > 0),
        }



# ─────────────────────────────────────────────
# TABLE : account_reviews
# Chaque ligne = un compte analysé dans une campagne
# ─────────────────────────────────────────────
class AccountReview(db.Model):
    __tablename__ = 'account_reviews'

    id               = db.Column(db.Integer, primary_key=True)
    campaign_id      = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)

    # Infos compte
    account_id       = db.Column(db.String(100))
    user_id          = db.Column(db.String(50))
    nom_complet      = db.Column(db.String(200))
    profil_app       = db.Column(db.String(100))
    profil_description = db.Column(db.Text)
    statut_app       = db.Column(db.String(50))
    direction        = db.Column(db.String(100))
    nature_contact   = db.Column(db.String(50))
    job_title        = db.Column(db.String(150))

    # Manager
    manager_matricule= db.Column(db.String(50))
    manager_nom      = db.Column(db.String(150))
    manager_email    = db.Column(db.String(150))

    # Infos AD
    last_logon_ad    = db.Column(db.String(30))
    groupes_sensibles= db.Column(db.Text)
    d_sortie         = db.Column(db.String(30))

    # Risques
    orphelin_app     = db.Column(db.Boolean, default=False)
    orphelin_ad      = db.Column(db.Boolean, default=False)
    inactif          = db.Column(db.Boolean, default=False)
    privilegie       = db.Column(db.Boolean, default=False)
    score            = db.Column(db.Integer, default=0)
    libelle_risque   = db.Column(db.String(200))

    # Décision manager
    decision         = db.Column(db.String(50), nullable=True)
    # "Maintenir" | "Révoquer" | "Investiguer"
    motif            = db.Column(db.String(300), nullable=True)
    decision_by      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    decision_at      = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            'id':                self.id,
            'account_id':        self.account_id,
            'user_id':           self.user_id,
            'nom_complet':       self.nom_complet,
            'profil_app':        self.profil_app,
            'profil_description':self.profil_description,
            'statut_app':        self.statut_app,
            'direction':         self.direction,
            'nature_contact':    self.nature_contact,
            'job_title':         self.job_title,
            'manager_matricule': self.manager_matricule,
            'manager_nom':       self.manager_nom,
            'manager_email':     self.manager_email,
            'last_logon_ad':     self.last_logon_ad,
            'groupes_sensibles': self.groupes_sensibles,
            'd_sortie':          self.d_sortie,
            'orphelin_app':      self.orphelin_app,
            'orphelin_ad':       self.orphelin_ad,
            'inactif':           self.inactif,
            'privilegie':        self.privilegie,
            'score':             self.score,
            'libelle_risque':    self.libelle_risque,
            'decision':          self.decision,
            'motif':             self.motif,
            'decision_at':       self.decision_at.strftime('%d/%m/%Y %H:%M') if self.decision_at else None,
        }


# ─────────────────────────────────────────────
# TABLE : campaign_motifs
# Justifications configurées PAR CAMPAGNE
# pour la décision "Maintenir"
# ─────────────────────────────────────────────
class CampaignMotif(db.Model):
    __tablename__ = 'campaign_motifs'

    id          = db.Column(db.Integer, primary_key=True)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaigns.id'), nullable=False)
    label       = db.Column(db.String(200), nullable=False)
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint('campaign_id', 'label', name='uq_camp_motif'),)

    def to_dict(self):
        return {'id': self.id, 'label': self.label, 'campaign_id': self.campaign_id}
