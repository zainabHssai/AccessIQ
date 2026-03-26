import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { authAPI } from '../api';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await authAPI.login(form.email, form.password);
      login(res.data.token, res.data.user);
      // Redirection selon le rôle
      if (res.data.user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/manager/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <div style={styles.logoWrap}>
            <div style={styles.logoMark}>A</div>
            <div>
              <div style={styles.logoName}>AccessIQ</div>
              <div style={styles.logoPwC}>PwC IAM Review Platform</div>
            </div>
          </div>
          <h1 style={styles.headline}>
            Gouvernance des identités,<br />simplifiée.
          </h1>
          <p style={styles.sub}>
            Gérez vos campagnes de revue d'accès, détectez les comptes à risque
            et pilotez les décisions de vos managers depuis une seule plateforme.
          </p>
          <div style={styles.features}>
            {['Détection des comptes orphelins & inactifs', 'Workflows d\'approbation multi-niveaux', 'Rapports de conformité exportables'].map(f => (
              <div key={f} style={styles.featureItem}>
                <span style={styles.featureDot}>●</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Connexion</h2>
          <p style={styles.cardSub}>Entrez vos identifiants pour accéder à la plateforme</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Adresse email</label>
              <input
                className="form-input"
                type="email" placeholder="vous@pwc.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                className="form-input"
                type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <div style={styles.divider}><span>ou</span></div>

          <p style={styles.registerLink}>
            Vous n'avez pas de compte ?{' '}
            <Link to="/register" style={{ color: 'var(--pwc-orange)', fontWeight: 500 }}>
              Demander un accès
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { display: 'flex', minHeight: '100vh' },

  left: {
    flex: 1, background: 'var(--pwc-dark)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '60px 40px',
  },
  leftContent: { maxWidth: 440 },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 },
  logoMark: {
    width: 40, height: 40, borderRadius: 10,
    background: 'var(--pwc-orange)', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 18,
  },
  logoName: { color: '#fff', fontWeight: 600, fontSize: 16 },
  logoPwC:  { color: '#888', fontSize: 11, letterSpacing: '.5px', marginTop: 2 },
  headline: { color: '#fff', fontSize: 32, fontWeight: 600, lineHeight: 1.3, marginBottom: 16 },
  sub: { color: '#888', fontSize: 14, lineHeight: 1.7, marginBottom: 32 },
  features: { display: 'flex', flexDirection: 'column', gap: 10 },
  featureItem: { color: '#aaa', fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 },
  featureDot: { color: 'var(--pwc-orange)', fontSize: 8 },

  right: {
    width: 460, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '40px 32px', background: 'var(--pwc-light)',
  },
  card: {
    background: '#fff', borderRadius: 16, padding: '36px 32px',
    border: '1px solid var(--border)', width: '100%',
    boxShadow: '0 4px 24px rgba(0,0,0,.07)',
  },
  cardTitle: { fontSize: 22, fontWeight: 600, marginBottom: 6 },
  cardSub:   { fontSize: 13, color: 'var(--pwc-grey)', marginBottom: 28, lineHeight: 1.5 },
  divider: {
    textAlign: 'center', margin: '20px 0',
    borderTop: '1px solid var(--border)', position: 'relative',
  },
  registerLink: { textAlign: 'center', fontSize: 13, color: 'var(--pwc-grey)', marginTop: 8 },
  adminHint: {
    marginTop: 20, padding: '10px 14px', borderRadius: 8,
    background: 'var(--pwc-light)', fontSize: 11, color: '#bbb',
    fontFamily: 'var(--mono)',
  },
};
