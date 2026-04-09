import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { authAPI, motifAPI } from '../../api';
import { useLang, LangToggle } from '../../i18n';
import CampaignsPage from './CampaignsPage';

// ── Sidebar ──────────────────────────────────
function Sidebar({ pendingCount }) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItem = (to, icon, label, badge) => (
    <NavLink to={to} style={({ isActive }) => ({
      ...styles.navItem,
      ...(isActive ? styles.navActive : {}),
    })}>
      <span style={styles.navIcon}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && <span style={styles.navBadge}>{badge}</span>}
    </NavLink>
  );

  return (
    <aside style={styles.sidebar}>
      <div style={styles.logoWrap}>
        <div style={styles.logoMark}>A</div>
        <div>
          <div style={styles.logoName}>AccessIQ</div>
          <div style={styles.logoPwC}>PwC · Admin</div>
        </div>
      </div>

      <div style={styles.navSection}>
        <div style={styles.navLabel}>{t('navigation')}</div>
        {navItem('/admin/dashboard', '◉', t('admin.dashboard'))}
        {navItem('/admin/campaigns', '📋', t('admin.campaigns'))}
        {navItem('/admin/users',     '👥', t('admin.users'), pendingCount)}
        {navItem('/admin/motifs',    '🏷', t('admin.motifs'))}
      </div>

      <div style={styles.sidebarBottom}>
        <div style={styles.userInfo}>
          <div style={styles.userAvatar}>{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          <div>
            <div style={styles.userName}>{user?.prenom} {user?.nom}</div>
            <div style={styles.userRole}>{t('admin.role')}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <LangToggle style={{ flex: 1 }} />
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>{t('logout')}</button>
      </div>
    </aside>
  );
}

// ── Users Page ────────────────────────────────
function UsersPage({ onPendingChange }) {
  const { t } = useLang();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('pending');

  const load = async () => {
    try {
      const res = await authAPI.allUsers();
      setUsers(res.data);
      onPendingChange(res.data.filter(u => u.statut === 'pending').length);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (userId, action) => {
    await authAPI.approve(userId, action);
    load();
  };

  const filtered = users.filter(u =>
    tab === 'all'     ? true :
    tab === 'pending' ? u.statut === 'pending' :
    tab === 'active'  ? u.statut === 'active'  : u.statut === 'rejected'
  );

  const pending = users.filter(u => u.statut === 'pending').length;

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>{t('users.title')}</h1>
          <p style={styles.pageSub}>{t('users.subtitle')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {[
          { key: 'pending',  label: `${t('users.tabPending')} (${pending})` },
          { key: 'active',   label: t('users.tabActive') },
          { key: 'rejected', label: t('users.tabRejected') },
          { key: 'all',      label: t('users.tabAll') },
        ].map(tab_ => (
          <button key={tab_.key} onClick={() => setTab(tab_.key)}
            style={{ ...styles.tab, ...(tab === tab_.key ? styles.tabActive : {}) }}>
            {tab_.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableWrap}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#bbb' }}>{t('loading')}</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#bbb' }}>{t('users.noUsers')}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {[t('users.colUser'), t('users.colEmail'), t('users.colRole'), t('users.colStatus'), t('users.colDate'), t('users.colActions')].map(h => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ ...styles.avatar, background: u.role === 'admin' ? 'rgba(232,76,46,.12)' : 'rgba(45,45,45,.08)' }}>
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 13 }}>{u.prenom} {u.nom}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ ...styles.td, color: '#646464', fontSize: 13 }}>{u.email}</td>
                  <td style={styles.td}>
                    <span className={`badge badge-${u.role === 'admin' ? 'admin' : 'manager'}`}>
                      {u.role === 'admin' ? t('users.roleAdmin') : u.titre === 'responsable_app' ? t('users.roleRespo') : t('users.roleManager')}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span className={`badge badge-${u.statut}`}>
                      {u.statut === 'pending' ? t('users.statusPending') : u.statut === 'active' ? t('users.statusActive') : t('users.statusRejected')}
                    </span>
                  </td>
                  <td style={{ ...styles.td, color: '#646464', fontSize: 12 }}>{u.created_at}</td>
                  <td style={styles.td}>
                    {u.statut === 'pending' && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleAction(u.id, 'approve')} style={styles.btnApprove}>
                          {t('users.approve')}
                        </button>
                        <button onClick={() => handleAction(u.id, 'reject')} style={styles.btnReject}>
                          {t('users.reject')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Motif Config Page ─────────────────────────
function MotifConfigPage() {
  const { t } = useLang();
  const [motifs,  setMotifs]  = useState([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [error,   setError]   = useState('');

  const load = async () => {
    try {
      const r = await motifAPI.list();
      setMotifs(r.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setAdding(true); setError('');
    try {
      await motifAPI.create(input.trim());
      setInput('');
      load();
    } catch (err) {
      setError(err.response?.data?.error || t('error'));
    } finally { setAdding(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('motif.deleteConfirm'))) return;
    await motifAPI.delete(id);
    setMotifs(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div style={styles.page}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>{t('motif.title')}</h1>
          <p style={styles.pageSub}>{t('motif.subtitle')}</p>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} style={{ display:'flex', gap:8, marginBottom:20, maxWidth:520 }}>
        <input
          className="form-input"
          placeholder={t('motif.addPlaceholder')}
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex:1 }}
        />
        <button type="submit" className="btn-primary" disabled={adding || !input.trim()} style={{ whiteSpace:'nowrap' }}>
          {adding ? t('motif.adding') : t('motif.add')}
        </button>
      </form>
      {error && <div className="form-error" style={{ marginBottom:12 }}>{error}</div>}

      {/* Motifs list */}
      <div style={styles.tableWrap}>
        {loading ? (
          <div style={{ padding:32, textAlign:'center', color:'#bbb' }}>{t('loading')}</div>
        ) : motifs.length === 0 ? (
          <div style={{ padding:32, textAlign:'center', color:'#bbb' }}>{t('motif.noMotifs')}</div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <tbody>
              {motifs.map((m, i) => (
                <tr key={m.id} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ ...styles.td, fontWeight:400, fontSize:14 }}>{m.label}</td>
                  <td style={{ ...styles.td, width:80, textAlign:'right' }}>
                    <button onClick={() => handleDelete(m.id)}
                      style={{ padding:'4px 10px', borderRadius:6, border:'none', background:'rgba(214,59,59,.1)', color:'#d63b3b', fontSize:12, fontWeight:500, cursor:'pointer' }}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Admin Layout ──────────────────────────────
export default function AdminLayout() {
  const { t } = useLang();
  const [pendingCount,    setPendingCount]    = useState(0);
  const [prevPending,     setPrevPending]     = useState(0);
  const [showNewUserNotif,setShowNewUserNotif]= useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const r = await authAPI.pending();
        const count = r.data.length;
        setPendingCount(count);
        if (count > prevPending && prevPending >= 0) {
          setShowNewUserNotif(true);
          setTimeout(() => setShowNewUserNotif(false), 6000);
        }
        setPrevPending(count);
      } catch {}
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [prevPending]);

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--pwc-light)', flexDirection:'column' }}>

      {showNewUserNotif && (
        <div style={{ background:'rgba(232,76,46,.09)', borderBottom:'1px solid rgba(232,76,46,.18)', padding:'11px 24px', display:'flex', alignItems:'center', gap:12, animation:'fadeIn .3s ease', zIndex:100 }}>
          <span style={{ fontSize:17 }}>🔔</span>
          <span style={{ fontSize:14, fontWeight:500, color:'var(--pwc-orange)' }}>{t('admin.newRequest')}</span>
          <span style={{ fontSize:14, color:'#646464' }}>{t('admin.newRequestSub')}</span>
          <button onClick={() => setShowNewUserNotif(false)}
            style={{ marginLeft:'auto', background:'transparent', border:'none', color:'#aaa', cursor:'pointer', fontSize:16 }}>✕</button>
        </div>
      )}

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar pendingCount={pendingCount} />
        <main style={{ ...styles.main, display:'flex', flexDirection:'column' }}>
          <Routes>
            <Route path="dashboard" element={<CampaignsPage />} />
            <Route path="campaigns" element={<CampaignsPage />} />
            <Route path="users"     element={<UsersPage onPendingChange={setPendingCount} />} />
            <Route path="motifs"    element={<MotifConfigPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────
const styles = {
  sidebar: {
    width: 240, background: '#fff',
    borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column',
    flexShrink: 0,
  },
  logoWrap: { padding: '22px 20px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: { width: 32, height: 32, borderRadius: 8, background: 'var(--pwc-orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 },
  logoName: { fontWeight: 600, fontSize: 14 },
  logoPwC:  { fontSize: 10, color: '#bbb', letterSpacing: '.5px', marginTop: 1 },

  navSection: { padding: '16px 12px 8px', flex: 1 },
  navLabel:   { fontSize: 10, fontWeight: 500, color: '#bbb', letterSpacing: '.8px', textTransform: 'uppercase', padding: '0 8px', marginBottom: 6 },
  navItem:    { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', color: '#646464', fontSize: 13, textDecoration: 'none', marginBottom: 2, transition: 'all .15s' },
  navActive:  { background: 'rgba(232,76,46,.08)', color: 'var(--pwc-orange)' },
  navIcon:    { fontSize: 14, width: 18, textAlign: 'center' },
  navBadge:   { background: 'var(--pwc-orange)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 20 },

  sidebarBottom: { borderTop: '1px solid var(--border)', padding: 14 },
  userInfo: { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 },
  userAvatar: { width: 30, height: 30, borderRadius: 8, background: 'rgba(232,76,46,.1)', color: 'var(--pwc-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 },
  userName: { fontSize: 12, fontWeight: 500 },
  userRole: { fontSize: 11, color: '#bbb' },
  logoutBtn: { width: '100%', padding: '8px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: '#646464', fontSize: 12, cursor: 'pointer' },

  main: { flex: 1, overflow: 'auto' },
  page: { padding: 32 },
  pageHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 },
  pageTitle: { fontSize: 20, fontWeight: 600 },
  pageSub:   { fontSize: 13, color: '#646464', marginTop: 4 },

  tabs: { display: 'flex', gap: 4, marginBottom: 16 },
  tab: { padding: '7px 16px', borderRadius: 8, border: '1px solid var(--border)', background: '#fff', color: '#646464', fontSize: 13, cursor: 'pointer', transition: 'all .15s' },
  tabActive: { background: 'var(--pwc-orange)', color: '#fff', borderColor: 'var(--pwc-orange)' },

  tableWrap: { background: '#fff', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid var(--border)', background: '#fff' },
  td: { padding: '14px 16px', borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  tr: {},

  avatar: { width: 30, height: 30, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#646464' },

  btnApprove: { padding: '5px 12px', borderRadius: 6, border: 'none', background: 'rgba(26,158,95,.12)', color: '#1a9e5f', fontSize: 12, fontWeight: 500, cursor: 'pointer' },
  btnReject:  { padding: '5px 12px', borderRadius: 6, border: 'none', background: 'rgba(214,59,59,.12)', color: '#d63b3b', fontSize: 12, fontWeight: 500, cursor: 'pointer' },
};
