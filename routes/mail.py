"""
Routes Email — utilise SendGrid API (fonctionne sur Railway)
"""
import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import User, Campaign, AccountReview

mail_bp = Blueprint('mail', __name__)

APP_URL = os.environ.get('APP_URL', 'http://localhost:3000')

def get_current_user():
    uid = get_jwt_identity()
    return User.query.get(int(uid)) if uid else None

def send_email(to_email, subject, html_body):
    """Envoie via SendGrid API."""
    api_key = os.environ.get('SENDGRID_API_KEY', '')

    if not api_key:
        print(f"\n📧 [EMAIL SIMULÉ]\n  À      : {to_email}\n  Sujet  : {subject}\n  Lien   : {APP_URL}/login\n")
        return True

    import urllib.request
    import urllib.error
    import json

    data = json.dumps({
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": os.environ.get('MAIL_FROM', 'accessiq@pwc.com'), "name": "AccessIQ PwC"},
        "subject": subject,
        "content": [{"type": "text/html", "value": html_body}]
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.sendgrid.com/v3/mail/send',
        data=data,
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        },
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            print(f"✅ Email envoyé à {to_email} — status {resp.status}")
            return True
    except urllib.error.HTTPError as e:
        print(f"❌ SendGrid error {e.code}: {e.read().decode()}")
        return False
    except Exception as e:
        print(f"❌ Erreur envoi email : {e}")
        return False

def build_email_html(manager_nom, campaign_nom, campaign_date, total, risk_count, login_url):
    return f"""
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8">
<style>
  body {{ font-family: Arial, sans-serif; background: #f4f4f4; margin:0; padding:0; }}
  .wrapper {{ max-width: 580px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }}
  .header {{ background: #2d2d2d; padding: 28px 32px; }}
  .logo {{ display:inline-block; width:36px; height:36px; background:#e84c2e; border-radius:8px; text-align:center; line-height:36px; color:#fff; font-weight:700; font-size:16px; }}
  .logo-text {{ display:inline-block; color:#fff; font-size:16px; font-weight:600; vertical-align:middle; margin-left:10px; }}
  .body {{ padding: 32px; }}
  .greeting {{ font-size:18px; font-weight:600; color:#2d2d2d; margin-bottom:12px; }}
  .text {{ font-size:15px; color:#646464; line-height:1.7; margin-bottom:20px; }}
  .camp-box {{ background:#fff8f0; border:1px solid rgba(232,76,46,.2); border-radius:10px; padding:16px 20px; margin-bottom:20px; }}
  .camp-name {{ font-weight:600; font-size:15px; color:#2d2d2d; margin-bottom:4px; }}
  .camp-date {{ font-size:13px; color:#646464; }}
  .stats {{ display:table; width:100%; margin:24px 0; }}
  .stat {{ display:table-cell; background:#f9f9f9; border-radius:10px; padding:16px; text-align:center; border:1px solid #eee; width:50%; }}
  .stat-val {{ font-size:28px; font-weight:700; color:#2d2d2d; }}
  .stat-risk {{ color:#e84c2e !important; }}
  .stat-label {{ font-size:12px; color:#aaa; margin-top:4px; }}
  .btn {{ display:block; background:#e84c2e; color:#fff; text-decoration:none; padding:14px 28px; border-radius:9px; font-size:15px; font-weight:600; text-align:center; margin:28px 0 0; }}
  .footer {{ background:#f9f9f9; border-top:1px solid #eee; padding:20px 32px; font-size:12px; color:#bbb; line-height:1.6; }}
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <span class="logo">A</span>
    <span class="logo-text">AccessIQ — PwC IAM Review Platform</span>
  </div>
  <div class="body">
    <div class="greeting">Bonjour {manager_nom},</div>
    <div class="text">
      Une nouvelle campagne de revue des accès a été lancée et vous avez des comptes à traiter.
      Votre participation est requise avant la date d'échéance.
    </div>
    <div class="camp-box">
      <div class="camp-name">📋 {campaign_nom}</div>
      <div class="camp-date">Lancée le {campaign_date}</div>
    </div>
    <table style="width:100%;border-spacing:8px;">
      <tr>
        <td style="background:#f9f9f9;border-radius:10px;padding:16px;text-align:center;border:1px solid #eee;">
          <div style="font-size:28px;font-weight:700;color:#2d2d2d;">{total}</div>
          <div style="font-size:12px;color:#aaa;margin-top:4px;">Comptes à traiter</div>
        </td>
        <td style="background:#f9f9f9;border-radius:10px;padding:16px;text-align:center;border:1px solid #eee;">
          <div style="font-size:28px;font-weight:700;color:#e84c2e;">{risk_count}</div>
          <div style="font-size:12px;color:#aaa;margin-top:4px;">Comptes à risque</div>
        </td>
      </tr>
    </table>
    <div class="text" style="margin-top:20px;">
      Pour chaque compte, vous devrez indiquer si l'accès doit être
      <strong>maintenu</strong>, <strong>révoqué</strong> ou <strong>investigué</strong>.
    </div>
    <a class="btn" href="{login_url}">Accéder à ma plateforme →</a>
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
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès admin requis'}), 403

    data          = request.json or {}
    campaign_id   = data.get('campaign_id')
    manager_email = data.get('manager_email')
    manager_nom   = data.get('manager_nom', 'Manager')

    if not campaign_id or not manager_email:
        return jsonify({'error': 'campaign_id et manager_email requis'}), 400

    camp = Campaign.query.get_or_404(campaign_id)
    accounts   = AccountReview.query.filter_by(campaign_id=campaign_id, manager_email=manager_email).all()
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
        to_email  = manager_email,
        subject   = f"[AccessIQ] Revue des accès requise — {camp.nom}",
        html_body = html,
    )
    return jsonify({'ok': ok, 'to': manager_email, 'total': total})


@mail_bp.route('/notify-all', methods=['POST'])
@jwt_required()
def notify_all_managers():
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès admin requis'}), 403

    data        = request.json or {}
    campaign_id = data.get('campaign_id')
    if not campaign_id:
        return jsonify({'error': 'campaign_id requis'}), 400

    camp     = Campaign.query.get_or_404(campaign_id)
    accounts = AccountReview.query.filter_by(campaign_id=campaign_id).all()

    managers = {}
    for a in accounts:
        if a.manager_email and a.manager_email not in managers:
            managers[a.manager_email] = {'email': a.manager_email, 'nom': a.manager_nom or 'Manager', 'total': 0, 'risk': 0}
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

    return jsonify({'sent': len(sent), 'failed': len(failed), 'emails': sent})