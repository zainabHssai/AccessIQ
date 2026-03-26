import os
from datetime import timedelta
from dotenv import load_dotenv

# Charge automatiquement le fichier .env au démarrage
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))

class Config:
    SECRET_KEY     = os.environ.get('SECRET_KEY',     'accessiq-pwc-dev-secret')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'accessiq-jwt-dev-secret')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    SQLALCHEMY_DATABASE_URI      = f"sqlite:///{os.path.join(BASE_DIR, 'accessiq.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    UPLOAD_FOLDER        = os.path.join(BASE_DIR, 'uploads')
    MAX_CONTENT_LENGTH   = 16 * 1024 * 1024

    # Email — lu depuis .env
    MAIL_SERVER   = os.environ.get('MAIL_SERVER',   'smtp.gmail.com')
    MAIL_PORT     = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
    MAIL_FROM     = os.environ.get('MAIL_FROM',     '')
    APP_URL       = os.environ.get('APP_URL',       'http://localhost:3000')
