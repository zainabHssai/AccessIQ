"""
routes/motifs.py — CRUD pour les motifs configurables par l'admin
GET  /api/motifs        — liste (accessible à tous les utilisateurs connectés)
POST /api/motifs        — créer un motif (admin seulement)
DELETE /api/motifs/<id> — supprimer un motif (admin seulement)
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from extensions import db
from models import MotifConfig
from routes.auth import get_current_user

motifs_bp = Blueprint('motifs', __name__)


@motifs_bp.route('', methods=['GET'])
@jwt_required()
def list_motifs():
    motifs = MotifConfig.query.order_by(MotifConfig.id).all()
    return jsonify([m.to_dict() for m in motifs])


@motifs_bp.route('', methods=['POST'])
@jwt_required()
def create_motif():
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès refusé'}), 403
    label = (request.json or {}).get('label', '').strip()
    if not label:
        return jsonify({'error': 'Label requis'}), 400
    if MotifConfig.query.filter_by(label=label).first():
        return jsonify({'error': 'Ce motif existe déjà'}), 400
    m = MotifConfig(label=label)
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201


@motifs_bp.route('/<int:motif_id>', methods=['DELETE'])
@jwt_required()
def delete_motif(motif_id):
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès refusé'}), 403
    m = MotifConfig.query.get_or_404(motif_id)
    db.session.delete(m)
    db.session.commit()
    return jsonify({'ok': True})
