"""
Routes Email :
  POST /api/mail/notify-manager   — envoyer un email au manager avec lien
  POST /api/mail/notify-all       — envoyer à tous les managers d'une campagne
"""
import smtplib, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Campaign, AccountReview

mail_bp = Blueprint('mail', __name__)

def get_current_user():
    uid = get_jwt_identity()
    return User.query.get(int(uid)) if uid else None

APP_URL = os.environ.get('APP_URL', 'http://localhost:3000')

def send_email(to_email, subject, html_body):
    """Envoie un email via SMTP configuré dans config.py"""
    cfg = current_app.config
    if not cfg.get('MAIL_USERNAME') or not cfg.get('MAIL_PASSWORD'):
        # Mode dev : log sans envoyer
        print(f"\n📧 [EMAIL SIMULÉ]\n  À      : {to_email}\n  Sujet  : {subject}\n  Lien   : {APP_URL}/manager/dashboard\n")
        return True

    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From']    = cfg['MAIL_FROM']
    msg['To']      = to_email
    msg.attach(MIMEText(html_body, 'html'))

    try:
        with smtplib.SMTP(cfg['MAIL_SERVER'], cfg['MAIL_PORT']) as server:
            server.starttls()
            server.login(cfg['MAIL_USERNAME'], cfg['MAIL_PASSWORD'])
            server.sendmail(cfg['MAIL_FROM'], to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"Erreur envoi email : {e}")
        return False

def build_email_html(manager_nom, campaign_nom, campaign_date, total, risk_count, login_url):
    return f"""
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8">
<style>
  body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f4f4; margin:0; padding:0; }}
  .wrapper {{ max-width: 580px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }}
  .header {{ background: #2d2d2d; padding: 28px 32px; display: flex; align-items: center; gap: 14px; }}
  .logo {{ width:36px; height:36px; background:#e84c2e; border-radius:8px; display:inline-flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:16px; }}
  .logo-text {{ color:#fff; font-size:16px; font-weight:600; }}
  .logo-sub {{ color:#888; font-size:11px; letter-spacing:.5px; }}
  .body {{ padding: 32px; }}
  .greeting {{ font-size:18px; font-weight:600; color:#2d2d2d; margin-bottom:12px; }}
  .text {{ font-size:15px; color:#646464; line-height:1.7; margin-bottom:20px; }}
  .stats {{ display:flex; gap:12px; margin:24px 0; }}
  .stat {{ flex:1; background:#f9f9f9; border-radius:10px; padding:16px; text-align:center; border:1px solid #eee; }}
  .stat-val {{ font-size:28px; font-weight:700; color:#2d2d2d; }}
  .stat-label {{ font-size:12px; color:#aaa; margin-top:4px; }}
  .risk-val {{ color:#e84c2e !important; }}
  .btn {{ display:block; background:#e84c2e; color:#fff; text-decoration:none; padding:14px 28px; border-radius:9px; font-size:15px; font-weight:600; text-align:center; margin:28px 0 0; box-shadow:0 4px 14px rgba(232,76,46,.3); }}
  .footer {{ background:#f9f9f9; border-top:1px solid #eee; padding:20px 32px; font-size:12px; color:#bbb; line-height:1.6; }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <div class="logo">A</div>
    <div>
      <div class="logo-text">AccessIQ</div>
      <div class="logo-sub">PwC · IAM Review Platform</div>
    </div>
  </div>
  <div class="body">
    <div class="greeting">Bonjour {manager_nom},</div>
    <div class="text">
      Une nouvelle campagne de revue des accès a été lancée et vous avez des comptes à traiter.
      Votre participation est requise avant la date d'échéance.
    </div>
    <div style="background:#fff8f0;border:1px solid rgba(232,76,46,.2);border-radius:10px;padding:16px 20px;margin-bottom:8px;">
      <div style="font-weight:600;font-size:15px;color:#2d2d2d;margin-bottom:4px;">📋 {campaign_nom}</div>
      <div style="font-size:13px;color:#646464;">Lancée le {campaign_date}</div>
    </div>
    <div class="stats">
      <div class="stat">
        <div class="stat-val">{total}</div>
        <div class="stat-label">Comptes à traiter</div>
      </div>
      <div class="stat">
        <div class="stat-val risk-val">{risk_count}</div>
        <div class="stat-label">Comptes à risque</div>
      </div>
    </div>
    <div class="text">
      Pour chaque compte, vous devrez indiquer si l'accès doit être
      <strong>maintenu</strong>, <strong>révoqué</strong> ou <strong>investigué</strong>.
    </div>
    <a class="btn" href="{login_url}">
      Accéder à ma plateforme de revue →
    </a>
  </div>
  <div class="footer">
    Cet email est envoyé automatiquement par AccessIQ — PwC IAM Review Platform.<br>
    Si vous pensez avoir reçu ce message par erreur, contactez votre administrateur IAM.
  </div>
</div>
</body>
</html>
"""

@mail_bp.route('/notify-manager', methods=['POST'])
@jwt_required()
def notify_manager():
    """Envoie un email à un manager spécifique pour une campagne."""
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès admin requis'}), 403

    data        = request.json or {}
    campaign_id = data.get('campaign_id')
    manager_email = data.get('manager_email')
    manager_nom   = data.get('manager_nom', 'Manager')

    if not campaign_id or not manager_email:
        return jsonify({'error': 'campaign_id et manager_email requis'}), 400

    camp = Campaign.query.get_or_404(campaign_id)

    # Comptes de ce manager dans cette campagne
    accounts = AccountReview.query.filter_by(
        campaign_id=campaign_id,
        manager_email=manager_email
    ).all()

    total      = len(accounts)
    risk_count = sum(1 for a in accounts if a.score > 0)

    html = build_email_html(
        manager_nom   = manager_nom,
        campaign_nom  = camp.nom,
        campaign_date = camp.date_lancement.strftime('%d/%m/%Y'),
        total         = total,
        risk_count    = risk_count,
        login_url     = f"{APP_URL}/login",
    )

    ok = send_email(
        to_email = manager_email,
        subject  = f"[AccessIQ] Revue des accès requise — {camp.nom}",
        html_body= html,
    )

    return jsonify({'ok': ok, 'to': manager_email, 'total': total})


@mail_bp.route('/notify-all', methods=['POST'])
@jwt_required()
def notify_all_managers():
    """Envoie un email à TOUS les managers d'une campagne."""
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès admin requis'}), 403

    data        = request.json or {}
    campaign_id = data.get('campaign_id')
    if not campaign_id:
        return jsonify({'error': 'campaign_id requis'}), 400

    camp = Campaign.query.get_or_404(campaign_id)

    # Regrouper par email de manager
    accounts = AccountReview.query.filter_by(campaign_id=campaign_id).all()
    managers = {}
    for a in accounts:
        if a.manager_email and a.manager_email not in managers:
            managers[a.manager_email] = {
                'email': a.manager_email,
                'nom':   a.manager_nom or 'Manager',
                'total': 0, 'risk': 0,
            }
        if a.manager_email:
            managers[a.manager_email]['total'] += 1
            managers[a.manager_email]['risk']  += 1 if a.score > 0 else 0

    sent = []
    failed = []
    for m in managers.values():
        html = build_email_html(
            manager_nom   = m['nom'],
            campaign_nom  = camp.nom,
            campaign_date = camp.date_lancement.strftime('%d/%m/%Y'),
            total         = m['total'],
            risk_count    = m['risk'],
            login_url     = f"{APP_URL}/login",
        )
        ok = send_email(
            to_email  = m['email'],
            subject   = f"[AccessIQ] Revue des accès requise — {camp.nom}",
            html_body = html,
        )
        (sent if ok else failed).append(m['email'])

    return jsonify({
        'sent':   len(sent),
        'failed': len(failed),
        'emails': sent,
    })
