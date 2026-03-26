import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { authAPI } from '../api';

/**
 * Page de changement de mot de passe.
 * Affichée automatiquement si must_change_password = true
 * ou accessible depuis le profil.
 */
export default function ChangePasswordPage({ forced = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [form,    setForm]    = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Indicateur de force du mot de passe
  const strength = (() => {
    const p = form.new_password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[!@#$%^&*()\-_=+\[\]{};:,.<>?]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'][strength];
  const strengthColor = ['', '#d63b3b', '#d63b3b', '#c97a0a', '#1a9e5f', '#1a9e5f'][strength];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm_password)
      return setError('Les mots de passe ne correspondent pas');
    setLoading(true);
    try {
      await authAPI.changePassword(form.old_password, form.new_password, form.confirm_password);
      setSuccess(true);
      setTimeout(() => {
        if (forced) { logout(); navigate('/login'); }
        else navigate(-1);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors du changement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoMark}>A</div>
          <div>
            <div style={styles.logoName}>AccessIQ</div>
            <div style={styles.logoPwC}>PwC</div>
          </div>
        </div>

        {forced && (
          <div style={styles.warningBox}>
            <span style={{ fontSize: 16 }}>⚠</span>
            Vous devez changer votre mot de passe avant de continuer.
          </div>
        )}

        <h2 style={styles.title}>
          {forced ? 'Nouveau mot de passe requis' : 'Changer mon mot de passe'}
        </h2>
        <p style={styles.sub}>
          Le mot de passe doit contenir au moins 12 caractères, une majuscule,
          une minuscule, un chiffre et un caractère spécial.
          Il expire tous les 90 jours.
        </p>

        {success ? (
          <div style={styles.successBox}>
            <span style={{ fontSize: 20 }}>✓</span>
            Mot de passe mis à jour avec succès.
            {forced ? ' Vous allez être redirigé vers la connexion.' : ''}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Mot de passe actuel</label>
              <input className="form-input" type="password"
                placeholder="Votre mot de passe actuel"
                value={form.old_password}
                onChange={e => set('old_password', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Nouveau mot de passe</label>
              <input className="form-input" type="password"
                placeholder="Min. 12 caractères"
                value={form.new_password}
                onChange={e => set('new_password', e.target.value)} required />
              {form.new_password && (
                <div style={styles.strengthWrap}>
                  <div style={styles.strengthBar}>
                    <div style={{ ...styles.strengthFill, width: `${strength * 20}%`, background: strengthColor }}/>
                  </div>
                  <span style={{ fontSize: 11, color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le nouveau mot de passe</label>
              <input className="form-input" type="password"
                placeholder="Confirmez"
                value={form.confirm_password}
                onChange={e => set('confirm_password', e.target.value)} required />
            </div>

            {/* Règles de complexité */}
            <div style={styles.rules}>
              {[
                ['12 caractères minimum',           form.new_password.length >= 12],
                ['Une majuscule',                   /[A-Z]/.test(form.new_password)],
                ['Une minuscule',                   /[a-z]/.test(form.new_password)],
                ['Un chiffre',                      /\d/.test(form.new_password)],
                ['Un caractère spécial (!@#$…)',    /[!@#$%^&*()\-_=+\[\]{};:,.<>?]/.test(form.new_password)],
              ].map(([label, ok]) => (
                <div key={label} style={{ ...styles.rule, color: ok ? '#1a9e5f' : '#bbb' }}>
                  <span>{ok ? '✓' : '○'}</span> {label}
                </div>
              ))}
            </div>

            {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}

            <button className="btn-primary" type="submit" disabled={loading || strength < 4}>
              {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        )}
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
    border: '1px solid var(--border)', width: '100%', maxWidth: 480,
    boxShadow: '0 4px 24px rgba(0,0,0,.07)',
  },
  header:   { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 },
  logoMark: { width: 32, height: 32, borderRadius: 8, background: 'var(--pwc-orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 },
  logoName: { fontWeight: 600, fontSize: 14 },
  logoPwC:  { fontSize: 10, color: '#bbb', letterSpacing: '.5px' },
  warningBox: {
    background: 'rgba(201,122,10,.08)', border: '1px solid rgba(201,122,10,.25)',
    borderRadius: 8, padding: '12px 14px', marginBottom: 20,
    fontSize: 13, color: '#c97a0a', display: 'flex', gap: 8, alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: 600, marginBottom: 6 },
  sub:   { fontSize: 13, color: 'var(--pwc-grey)', marginBottom: 24, lineHeight: 1.6 },
  strengthWrap: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 },
  strengthBar:  { flex: 1, height: 4, background: '#eee', borderRadius: 2, overflow: 'hidden' },
  strengthFill: { height: '100%', borderRadius: 2, transition: 'width .3s, background .3s' },
  rules: { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 16, padding: '12px 14px', background: 'var(--pwc-light)', borderRadius: 8 },
  rule:  { fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' },
  successBox: {
    background: 'rgba(26,158,95,.08)', border: '1px solid rgba(26,158,95,.25)',
    borderRadius: 8, padding: '16px', fontSize: 14, color: '#1a9e5f',
    display: 'flex', gap: 10, alignItems: 'center',
  },
};
