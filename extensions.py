"""
Extensions Flask partagées — importées dans app.py et les routes
pour éviter les imports circulaires.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db  = SQLAlchemy()
jwt = JWTManager()

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    """Vérifie si le token a été révoqué (logout)."""
    from models import JWTBlacklist
    jti = jwt_payload.get('jti')
    if not jti:
        return False
    return JWTBlacklist.query.filter_by(jti=jti).first() is not None
