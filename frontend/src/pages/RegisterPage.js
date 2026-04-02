import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import { useLang, LangToggle } from '../i18n';

export default function RegisterPage() {
  const { t } = useLang();
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
    if (form.password !== form.confirm) return setError(t('reg.pwMismatch'));
    if (form.password.length < 8) return setError(t('reg.pwTooShort'));
    setLoading(true);
    try {
      await authAPI.register({
        nom: form.nom, prenom: form.prenom,
        email: form.email, password: form.password, titre: form.role,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || t('error'));
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.successIcon}>✓</div>
        <h2 style={styles.cardTitle}>{t('reg.successTitle')}</h2>
        <p style={styles.cardSub}>{t('reg.successText')}</p>
        <Link to="/login">
          <button className="btn-primary" style={{ marginTop: 8 }}>
            {t('reg.backToLogin')}
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={styles.header}>
            <div style={styles.logoMark}>A</div>
            <div>
              <div style={styles.logoName}>AccessIQ</div>
              <div style={styles.logoPwC}>PwC</div>
            </div>
          </div>
          <LangToggle />
        </div>

        <h2 style={styles.cardTitle}>{t('reg.title')}</h2>
        <p style={styles.cardSub}>{t('reg.subtitle')}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('reg.firstname')}</label>
              <input className="form-input" placeholder={t('reg.firstname')}
                value={form.prenom} onChange={e => set('prenom', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('reg.lastname')}</label>
              <input className="form-input" placeholder={t('reg.lastname')}
                value={form.nom} onChange={e => set('nom', e.target.value)} required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('reg.email')}</label>
            <input className="form-input" type="email" placeholder="vous@pwc.com"
              value={form.email} onChange={e => set('email', e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">{t('reg.role')}</label>
            <select className="form-input" value={form.role} onChange={e => set('role', e.target.value)}>
              <option value="manager">{t('reg.roleManager')}</option>
              <option value="responsable_app">{t('reg.roleRespo')}</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('reg.password')}</label>
              <input className="form-input" type="password" placeholder="Min. 8"
                value={form.password} onChange={e => set('password', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">{t('reg.confirm')}</label>
              <input className="form-input" type="password" placeholder="…"
                value={form.confirm} onChange={e => set('confirm', e.target.value)} required />
            </div>
          </div>

          {error && <div className="form-error" style={{ marginBottom: 14 }}>{error}</div>}

          <div style={styles.infoBox}>
            <span style={{ fontSize: 14 }}>ℹ</span>
            {t('reg.info')}
          </div>

          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 16 }}>
            {loading ? t('reg.submitting') : t('reg.submit')}
          </button>
        </form>

        <p style={styles.loginLink}>
          {t('reg.hasAccount')}{' '}
          <Link to="/login" style={{ color: 'var(--pwc-orange)', fontWeight: 500 }}>
            {t('reg.signIn')}
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
  header:   { display: 'flex', alignItems: 'center', gap: 10 },
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
