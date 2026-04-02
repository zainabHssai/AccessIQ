"""
AccessIQ — PwC IAM Review Platform
Point d'entrée Flask
"""
import os
from flask import Flask, send_from_directory
from flask_cors import CORS

from config     import Config
from extensions import db, jwt
from models     import User
import bcrypt


def create_app():
    app = Flask(__name__, static_folder='static', template_folder='templates')
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    from routes.auth      import auth_bp
    from routes.campaigns import campaigns_bp
    from routes.mail      import mail_bp
    app.register_blueprint(auth_bp,      url_prefix='/api/auth')
    app.register_blueprint(campaigns_bp, url_prefix='/api/campaigns')
    app.register_blueprint(mail_bp,      url_prefix='/api/mail')

    with app.app_context():
        db.create_all()
        _migrate_db()
        _seed_admin()

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        static_dir = os.path.join(app.root_path, 'static')
        if path and os.path.exists(os.path.join(static_dir, path)):
            return send_from_directory(static_dir, path)
        index = os.path.join(static_dir, 'index.html')
        if os.path.exists(index):
            return send_from_directory(static_dir, 'index.html')
        return '<h2>AccessIQ Backend OK</h2>'

    return app


def _migrate_db():
    """Ajoute les colonnes manquantes sans détruire la DB existante."""
    migrations = [
        "ALTER TABLE account_reviews ADD COLUMN motif VARCHAR(300)",
    ]
    for sql in migrations:
        try:
            db.session.execute(db.text(sql))
            db.session.commit()
        except Exception:
            db.session.rollback()


def _seed_admin():
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
    port = int(os.environ.get('PORT', 5000))
    print(f"\n  AccessIQ — http://localhost:{port}\n")
    app.run(host='0.0.0.0', port=port)