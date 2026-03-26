import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', password: '', confirm: '', role: 'manager',
  });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Les mots de passe ne correspondent pas');
    if (form.password.length < 8) return setError('Mot de passe trop court (min 8 caractères)');
    setLoading(true);
    try {
      await authAPI.register({
        nom: form.nom, prenom: form.prenom,
        email: form.email, password: form.password, titre: form.role,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la demande');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.successIcon}>✓</div>
        <h2 style={styles.cardTitle}>Demande envoyée !</h2>
        <p style={styles.cardSub}>
          Votre demande de compte a bien été transmise à l'administrateur.
          Vous recevrez un email dès que votre compte sera activé.
        </p>
        <Link to="/login">
          <button className="btn-primary" style={{ marginTop: 8 }}>
            Retour à la connexion
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.logoMark}>A</div>
          <div>
            <div style={styles.logoName}>AccessIQ</div>
            <div style={styles.logoPwC}>PwC</div>
          </div>
        </div>

        <h2 style={styles.cardTitle}>Demander un accès</h2>
        <p style={styles.cardSub}>
          Votre demande sera examinée par un administrateur avant activation.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input className="form-input" placeholder="Prénom"
                value={form.prenom} onChange={e => set('prenom', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input className="form-input" placeholder="Nom"
                value={form.nom} onChange={e => set('nom', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adresse email professionnelle</label>
            <input className="form-input" type="email" placeholder="vous@pwc.com"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Rôle</label>
            <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="manager">Manager — je valide les accès de mon équipe</option>
              <option value="responsable_app">Responsable applicatif — je gère une application</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input className="form-input" type="password" placeholder="Min. 8 caractères"
                value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer</label>
              <input className="form-input" type="password" placeholder="Confirmez"
                value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
            </div>
          </div>

          {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}

          {/* Info box */}
          <div style={styles.infoBox}>
            <span style={{ fontSize: 14 }}>ℹ</span>
            Après soumission, un administrateur recevra une notification et
            devra approuver votre compte avant que vous puissiez vous connecter.
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? 'Envoi en cours…' : 'Envoyer la demande'}
          </button>
        </form>

        <p style={styles.loginLink}>
          Vous avez déjà un compte ?{' '}
          <Link to="/login" style={{ color: 'var(--pwc-orange)', fontWeight: 500 }}>
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--pwc-light)', padding: '32px 16px',
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '36px 32px',
    border: '1px solid var(--border)', width: '100%', maxWidth: 520,
    boxShadow: '0 4px 24px rgba(0,0,0,.07)',
  },
  header:   { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoMark: {
    width: 36, height: 36, borderRadius: 9,
    background: 'var(--pwc-orange)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 16,
  },
  logoName: { fontWeight: 600, fontSize: 15 },
  logoPwC:  { fontSize: 10, color: '#bbb', letterSpacing: '.5px', marginTop: 1 },
  cardTitle: { fontSize: 20, fontWeight: 600, marginBottom: 6 },
  cardSub:   { fontSize: 13, color: 'var(--pwc-grey)', marginBottom: 24, lineHeight: 1.5 },
  infoBox: {
    background: 'rgba(232,76,46,.06)', border: '1px solid rgba(232,76,46,.2)',
    borderRadius: 8, padding: '12px 14px',
    fontSize: 12, color: 'var(--pwc-grey)', lineHeight: 1.6,
    display: 'flex', gap: 8, alignItems: 'flex-start',
  },
  loginLink: { textAlign: 'center', fontSize: 13, color: 'var(--pwc-grey)', marginTop: 20 },
  successIcon: {
    width: 56, height: 56, borderRadius: '50%',
    background: 'rgba(26,158,95,.12)', color: 'var(--green)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, fontWeight: 700, margin: '0 auto 20px',
  },
};
