"""
routes/motifs.py — Motifs par campagne (décision "Maintenir")
Préfixe : /api/campaigns  (même préfixe que campaigns_bp)

GET    /api/campaigns/<id>/motifs        — liste des motifs de la campagne
POST   /api/campaigns/<id>/motifs        — ajouter un motif (admin)
PUT    /api/campaigns/<id>/motifs/<mid>  — modifier un motif (admin)
DELETE /api/campaigns/<id>/motifs/<mid>  — supprimer un motif (admin)
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from extensions import db
from models import CampaignMotif, Campaign
from routes.auth import get_current_user

motifs_bp = Blueprint('campaign_motifs', __name__)


@motifs_bp.route('/<int:camp_id>/motifs', methods=['GET'])
@jwt_required()
def list_motifs(camp_id):
    Campaign.query.get_or_404(camp_id)
    motifs = CampaignMotif.query.filter_by(campaign_id=camp_id).order_by(CampaignMotif.id).all()
    return jsonify([m.to_dict() for m in motifs])


@motifs_bp.route('/<int:camp_id>/motifs', methods=['POST'])
@jwt_required()
def create_motif(camp_id):
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès refusé'}), 403
    Campaign.query.get_or_404(camp_id)
    label = (request.json or {}).get('label', '').strip()
    if not label:
        return jsonify({'error': 'Label requis'}), 400
    if CampaignMotif.query.filter_by(campaign_id=camp_id, label=label).first():
        return jsonify({'error': 'Ce motif existe déjà pour cette campagne'}), 400
    m = CampaignMotif(campaign_id=camp_id, label=label)
    db.session.add(m)
    db.session.commit()
    return jsonify(m.to_dict()), 201


@motifs_bp.route('/<int:camp_id>/motifs/<int:motif_id>', methods=['PUT'])
@jwt_required()
def update_motif(camp_id, motif_id):
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès refusé'}), 403
    m = CampaignMotif.query.filter_by(id=motif_id, campaign_id=camp_id).first_or_404()
    label = (request.json or {}).get('label', '').strip()
    if not label:
        return jsonify({'error': 'Label requis'}), 400
    if CampaignMotif.query.filter(
        CampaignMotif.campaign_id == camp_id,
        CampaignMotif.label == label,
        CampaignMotif.id != motif_id
    ).first():
        return jsonify({'error': 'Ce motif existe déjà pour cette campagne'}), 400
    m.label = label
    db.session.commit()
    return jsonify(m.to_dict())


@motifs_bp.route('/<int:camp_id>/motifs/<int:motif_id>', methods=['DELETE'])
@jwt_required()
def delete_motif(camp_id, motif_id):
    current = get_current_user()
    if not current or current.role != 'admin':
        return jsonify({'error': 'Accès refusé'}), 403
    m = CampaignMotif.query.filter_by(id=motif_id, campaign_id=camp_id).first_or_404()
    db.session.delete(m)
    db.session.commit()
    return jsonify({'ok': True})
