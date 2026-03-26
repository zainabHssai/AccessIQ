"""
AccessIQ — PwC IAM Review Platform
Point d'entrée Flask

Lancer : python app.py
Accès  : http://localhost:5000
"""
import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from config    import Config
from extensions import db, jwt
from models    import User          # noqa — nécessaire pour que SQLAlchemy crée les tables
from routes.auth import auth_bp
import bcrypt


def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    app.config.from_object(Config)

    # Extensions
    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Dossier uploads
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    from routes.auth      import auth_bp
    from routes.campaigns import campaigns_bp
    from routes.mail      import mail_bp
    app.register_blueprint(auth_bp,      url_prefix='/api/auth')
    app.register_blueprint(campaigns_bp, url_prefix='/api/campaigns')
    app.register_blueprint(mail_bp,      url_prefix='/api/mail')

    # ── Création des tables + compte admin par défaut ──
    with app.app_context():
        db.create_all()
        _seed_admin()

    # ── Servir le frontend React (build) ──
    # Pour le dev, React tourne sur localhost:3000
    # En prod, on sert le build React depuis /static/
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        static_dir = os.path.join(app.root_path, 'static')
        if path and os.path.exists(os.path.join(static_dir, path)):
            return send_from_directory(static_dir, path)
        index = os.path.join(static_dir, 'index.html')
        if os.path.exists(index):
            return send_from_directory(static_dir, 'index.html')
        return '''
        <div style="font-family:sans-serif;padding:40px;max-width:500px;margin:auto">
          <h2>✅ AccessIQ Backend opérationnel</h2>
          <p style="color:#666">API disponible sur <code>/api/</code></p>
          <p style="color:#666;margin-top:16px">
            Lance le frontend React avec :<br>
            <code style="background:#f0f0f0;padding:4px 8px;border-radius:4px">
              cd frontend && npm start
            </code>
          </p>
          <hr style="margin:24px 0">
          <p style="font-size:13px;color:#999">Admin par défaut : <b>admin@accessiq.com</b> / <b>Admin1234!</b></p>
        </div>
        '''

    return app


def _seed_admin():
    """Crée le compte admin par défaut si aucun admin n'existe."""
    from models import User
    if not User.query.filter_by(role='admin').first():
        admin = User(
            email         = 'admin@accessiq.com',
            password_hash = bcrypt.hashpw(b'Admin1234!', bcrypt.gensalt()).decode(),
            nom           = 'Admin',
            prenom        = 'AccessIQ',
            role          = 'admin',
            statut        = 'active',
        )
        db.session.add(admin)
        db.session.commit()
        print("✅ Compte admin créé : admin@accessiq.com / Admin1234!")


if __name__ == '__main__':
    app = create_app()
    print("\n" + "═" * 52)
    print("  AccessIQ — PwC IAM Review Platform")
    print("  Backend  : http://localhost:5000")
    print("  Frontend : http://localhost:3000  (npm start)")
    print("═" * 52 + "\n")
    if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
