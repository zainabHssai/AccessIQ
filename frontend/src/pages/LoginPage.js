import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../App';
import { authAPI } from '../api';
import { useLang, LangToggle } from '../i18n';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const { t }     = useLang();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [shake,   setShake]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setShake(false);
    try {
      const res = await authAPI.login(form.email, form.password);
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/manager/dashboard');
    } catch (err) {
      const msg = err.response?.data?.error || t('error');
      setError(msg);
      setShake(true);
      setTimeout(() => setShake(false), 600);
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
            {t('login.headline').split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </h1>
          <p style={styles.sub}>{t('login.sub')}</p>
          <div style={styles.features}>
            {[t('login.feature1'), t('login.feature2'), t('login.feature3')].map(f => (
              <div key={f} style={styles.featureItem}>
                <span style={styles.featureDot}>●</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <LangToggle />
          </div>
          <h2 style={styles.cardTitle}>{t('login.title')}</h2>
          <p style={styles.cardSub}>{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit} style={shake ? styles.shake : {}}>
            <div className="form-group">
              <label className="form-label">{t('login.email')}</label>
              <input
                className="form-input"
                type="email" placeholder="vous@pwc.com"
                value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setError(''); }}
                style={error ? styles.inputError : {}}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('login.password')}</label>
              <input
                className="form-input"
                type="password" placeholder="••••••••"
                value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setError(''); }}
                style={error ? styles.inputError : {}}
                required
              />
            </div>

            {error && (
              <div style={styles.errorBanner}>
                <span style={{ fontSize: 15 }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button className="btn-primary" type="submit" disabled={loading}
              style={{ marginTop: 4, opacity: loading ? .7 : 1 }}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                    <span style={styles.spinner}/>{t('login.submitting')}
                  </span>
                : t('login.submit')
              }
            </button>
          </form>

          <div style={styles.divider}><span>{t('login.or')}</span></div>

          <p style={styles.registerLink}>
            {t('login.noAccount')}{' '}
            <Link to="/register" style={{ color: 'var(--pwc-orange)', fontWeight: 500 }}>
              {t('login.requestAccess')}
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

  errorBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(214,59,59,.07)', border: '1px solid rgba(214,59,59,.25)',
    borderRadius: 8, padding: '10px 14px', marginBottom: 14,
    fontSize: 13, color: '#c0392b', fontWeight: 500,
  },
  inputError: {
    borderColor: '#d63b3b',
    background: 'rgba(214,59,59,.03)',
  },
  spinner: {
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(255,255,255,.4)',
    borderTopColor: '#fff', borderRadius: '50%',
    animation: 'spin .7s linear infinite',
  },
  shake: {
    animation: 'shake .5s cubic-bezier(.36,.07,.19,.97)',
  },
};
