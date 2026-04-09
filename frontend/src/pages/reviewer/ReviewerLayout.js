import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { campaignAPI, profileAPI, motifAPI } from '../../api';

// ── Sidebar ──────────────────────────────────
function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const titre = user?.titre === 'responsable_app' ? 'Responsable App' : 'Manager';

  const navItem = (to, icon, label) => (
    <NavLink to={to} style={({ isActive }) => ({ ...S.navItem, ...(isActive ? S.navActive : {}) })}>
      <span style={S.navIcon}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside style={S.sidebar}>
      <div style={S.logoWrap}>
        <div style={S.logoMark}>A</div>
        <div>
          <div style={S.logoName}>AccessIQ</div>
          <div style={S.logoPwC}>PwC · {titre}</div>
        </div>
      </div>
      <div style={S.navSection}>
        <div style={S.navLabel}>Navigation</div>
        {navItem('/manager/dashboard', '◉', 'Mes campagnes')}
        {navItem('/manager/profile',   '👤', 'Mon profil')}
      </div>
      <div style={S.sidebarBottom}>
        <div style={S.userInfo}>
          <div style={S.userAvatar}>{user?.prenom?.[0]}{user?.nom?.[0]}</div>
          <div>
            <div style={S.userName}>{user?.prenom} {user?.nom}</div>
            <div style={S.userRole}>{titre}</div>
          </div>
        </div>
        <button onClick={handleLogout} style={S.logoutBtn}>Déconnexion</button>
      </div>
    </aside>
  );
}

// ── Dashboard Manager ─────────────────────────
function ManagerDashboard() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [accounts,  setAccounts]  = useState([]);
  const [filter,    setFilter]    = useState('all');
  const [viewMode,  setViewMode]  = useState('pending'); // 'pending' | 'treated'
  const [loading,   setLoading]   = useState(true);
  const [notif,     setNotif]     = useState(false);

  useEffect(() => {
    campaignAPI.myAssigned()
      .then(r => {
        setCampaigns(r.data);
        if (r.data.length > 0) {
          setNotif(true);
          setTimeout(() => setNotif(false), 5000);
          // Auto-select first campaign
          setSelected(r.data[0]);
          campaignAPI.myAccounts(r.data[0].id).then(a => setAccounts(a.data));
        }
      })
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  const loadCampaign = async (c) => {
    setSelected(c);
    setFilter('all');
    const r = await campaignAPI.myAccounts(c.id);
    setAccounts(r.data);
  };

  const handleDecision = async (accountId, decision, motif) => {
    await campaignAPI.saveDecision(selected.id, accountId, decision, motif);
    setAccounts(prev => prev.map(a =>
      a.id === accountId ? { ...a, decision: decision || null, motif: motif || null } : a
    ));
    setCampaigns(prev => prev.map(c =>
      c.id === selected.id
        ? { ...c, decided: c.decided + (decision ? 1 : -1) }
        : c
    ));
  };

  const pendingAccounts = accounts.filter(a => !a.decision);
  const treatedAccounts = accounts.filter(a =>  a.decision);
  const baseList        = viewMode === 'pending' ? pendingAccounts : treatedAccounts;
  const filtered = baseList.filter(a => {
    if (filter === 'orphan')   return a.orphelin_app || a.orphelin_ad;
    if (filter === 'inactive') return a.inactif;
    if (filter === 'priv')     return a.privilegie;
    return true;
  });

  const stats = {
    total:    accounts.length,
    orphan:   accounts.filter(a => a.orphelin_app || a.orphelin_ad).length,
    inactive: accounts.filter(a => a.inactif).length,
    priv:     accounts.filter(a => a.privilegie).length,
    decided:  accounts.filter(a => a.decision).length,
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', flexDirection:'column', gap:16, color:'#aaa' }}>
      <div style={{ width:32, height:32, border:'3px solid #f0f0f0', borderTopColor:'var(--pwc-orange)', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
      <span style={{ fontSize:14 }}>Chargement de vos campagnes…</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', flexDirection:'column' }}>

      {/* Notification banner */}
      {notif && campaigns.length > 0 && (
        <div style={{ background:'rgba(232,76,46,.08)', borderBottom:'1px solid rgba(232,76,46,.15)', padding:'12px 24px', display:'flex', alignItems:'center', gap:12, animation:'fadeIn .3s ease' }}>
          <span style={{ fontSize:18 }}>🔔</span>
          <div>
            <span style={{ fontWeight:500, fontSize:14, color:'var(--pwc-orange)' }}>Nouvelle campagne assignée — </span>
            <span style={{ fontSize:14, color:'#646464' }}>
              Vous avez {campaigns.reduce((s,c) => s + (c.total - c.decided), 0)} compte(s) en attente de décision.
            </span>
          </div>
          <button onClick={() => setNotif(false)} style={{ marginLeft:'auto', background:'transparent', border:'none', color:'#aaa', cursor:'pointer', fontSize:16 }}>✕</button>
        </div>
      )}

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

      {/* Liste des campagnes */}
      <div style={S.campList}>
        <div style={S.campListHeader}>Mes campagnes</div>
        {campaigns.length === 0
          ? <div style={S.empty}>Aucune campagne assignée pour l'instant.</div>
          : campaigns.map(c => (
            <div key={c.id}
              onClick={() => loadCampaign(c)}
              style={{ ...S.campItem, ...(selected?.id === c.id ? S.campItemActive : {}) }}>
              <div style={S.campItemName}>{c.nom}</div>
              <div style={S.campItemDate}>{c.date_lancement}</div>
              <div style={S.campItemMeta}>
                <span style={S.campItemProgress}>{c.decided}/{c.total} traités</span>
                {c.risk_count > 0 && <span style={S.campItemRisk}>{c.risk_count} risques</span>}
              </div>
              <div style={S.progressBarWrap}>
                <div style={{ ...S.progressBarFill, width: c.total > 0 ? `${Math.round(c.decided/c.total*100)}%` : '0%' }}/>
              </div>
            </div>
          ))
        }
      </div>

      {/* Détail campagne */}
      <div style={S.campDetail}>
        {!selected
          ? <div style={S.noSelection}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Sélectionnez une campagne</div>
              <div style={{ color: '#aaa', fontSize: 13 }}>Cliquez sur une campagne à gauche pour voir les comptes à traiter</div>
            </div>
          : <>
              {/* Header */}
              <div style={S.detailHeader}>
                <h2 style={S.detailTitle}>{selected.nom}</h2>
                <div style={S.detailSub}>Lancée le {selected.date_lancement} · {stats.decided}/{stats.total} décisions prises</div>
              </div>

              {/* KPIs */}
              <div style={S.kpiRow}>
                {[
                  { label:'À traiter',  val: stats.total - stats.decided, color:'var(--pwc-orange)' },
                  { label:'Orphelins',  val: stats.orphan,   color:'#d63b3b' },
                  { label:'Inactifs',   val: stats.inactive, color:'#c97a0a' },
                  { label:'Privilégiés',val: stats.priv,     color:'#7c5cbf' },
                  { label:'Traités',    val: stats.decided,  color:'#1a9e5f' },
                ].map(k => (
                  <div key={k.label} style={S.kpi}>
                    <div style={{ ...S.kpiVal, color: k.color }}>{k.val}</div>
                    <div style={S.kpiLabel}>{k.label}</div>
                  </div>
                ))}
              </div>

              {/* Onglets Pending / Traités */}
              <div style={{ display:'flex', gap:0, marginBottom:14, borderBottom:'1px solid #e2e2e2' }}>
                {[
                  ['pending', `À traiter (${pendingAccounts.length})`,  pendingAccounts.length > 0],
                  ['treated', `Traités (${treatedAccounts.length})`,     false],
                ].map(([key, label, hasDot]) => (
                  <button key={key} onClick={() => { setViewMode(key); setFilter('all'); }}
                    style={{ padding:'9px 18px', border:'none', background:'transparent', fontSize:14, fontWeight: viewMode===key ? 600 : 400, color: viewMode===key ? 'var(--pwc-orange)':'#646464', cursor:'pointer', borderBottom: viewMode===key ? '2px solid var(--pwc-orange)':'2px solid transparent', marginBottom:-1, display:'flex', alignItems:'center', gap:6 }}>
                    {hasDot && viewMode!=='pending' && <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--pwc-orange)', display:'inline-block' }}/>}
                    {label}
                  </button>
                ))}
              </div>

              {/* Filtres */}
              <div style={S.filterRow}>
                {[
                  ['all',      `Tous`],
                  ['orphan',   `Orphelins (${stats.orphan})`],
                  ['inactive', `Inactifs (${stats.inactive})`],
                  ['priv',     `Privilégiés (${stats.priv})`],
                ].map(([key, label]) => (
                  <button key={key} onClick={() => setFilter(key)}
                    style={{ ...S.filterBtn, ...(filter === key ? S.filterActive : {}) }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div style={S.tableWrap}>
                {filtered.length === 0
                  ? <div style={{ padding:32, textAlign:'center', color:'#bbb', fontSize:14 }}>
                      {viewMode === 'pending' ? '✓ Tous les comptes ont été traités !' : 'Aucun compte traité pour l\'instant.'}
                    </div>
                  : <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Utilisateur', 'Direction', 'Profil', 'Dernier logon', 'Risque', viewMode === 'treated' ? 'Décision prise' : 'Décision'].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(a => {
                          const rowBg = a.decision === 'Maintenir'   ? 'rgba(26,158,95,.06)'
                                      : a.decision === 'Révoquer'    ? 'rgba(214,59,59,.06)'
                                      : a.decision === 'Investiguer' ? 'rgba(201,122,10,.06)'
                                      : 'transparent';
                          return (
                          <tr key={a.id} style={{ background: rowBg, transition: 'background .2s' }}>
                            <td style={S.td}>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{a.nom_complet}</div>
                              <div style={{ fontSize: 11, color: '#aaa', fontFamily: 'monospace' }}>{a.account_id}</div>
                            </td>
                            <td style={{ ...S.td, color: '#646464', fontSize: 13 }}>{a.direction || '—'}</td>
                            <td style={{ ...S.td, fontSize: 12 }}>
                              <div>{a.profil_app}</div>
                              {a.profil_description && <div style={{ color: '#aaa', fontSize: 11, marginTop: 2 }}>{a.profil_description}</div>}
                            </td>
                            <td style={{ ...S.td, fontSize: 12, fontFamily: 'monospace', color: a.last_logon_ad === 'Jamais' ? '#d63b3b' : '#646464' }}>
                              {a.last_logon_ad || '—'}
                            </td>
                            <td style={S.td}>{riskBadge(a)}</td>
                            <td style={S.td}>
                              {viewMode === 'treated'
                                ? <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                      {decisionChip(a.decision)}
                                      <button onClick={() => handleDecision(a.id, '', '')}
                                        style={{ fontSize:11, color:'#bbb', background:'transparent', border:'1px solid #e2e2e2', borderRadius:5, padding:'3px 7px', cursor:'pointer' }}>
                                        Annuler
                                      </button>
                                    </div>
                                    {a.motif && <div style={{ fontSize:11, color:'#646464', fontStyle:'italic' }}>"{a.motif}"</div>}
                                  </div>
                                : <DecisionButtons value={a.decision} onChange={(dec, mot) => handleDecision(a.id, dec, mot)} />
                              }
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                }
              </div>
            </>
        }
      </div>
      </div>
    </div>
  );
}

// ── Decision Chip ─────────────────────────────
function decisionChip(d) {
  if (!d) return <span style={{ fontSize:13, color:'#bbb' }}>—</span>;
  const map = {
    'Maintenir':   { color:'#1a9e5f', bg:'rgba(26,158,95,.1)'   },
    'Révoquer':    { color:'#d63b3b', bg:'rgba(214,59,59,.1)'   },
    'Investiguer': { color:'#c97a0a', bg:'rgba(201,122,10,.1)'  },
  };
  const st = map[d] || { color:'#646464', bg:'#f0f0f0' };
  return <span style={{ display:'inline-flex', padding:'4px 10px', borderRadius:20, fontSize:12, fontWeight:500, background:st.bg, color:st.color }}>{d}</span>;
}

// ── Decision Buttons ──────────────────────────
const DECISION_META = {
  'Maintenir':   { color: '#1a9e5f', bg: 'rgba(26,158,95,.12)',  useCase: 'Le compte sera conservé. Une justification sera archivée dans le rapport de conformité.' },
  'Révoquer':    { color: '#d63b3b', bg: 'rgba(214,59,59,.12)',  useCase: 'L\'accès sera désactivé. Un ticket de révocation sera transmis au responsable IT.' },
  'Investiguer': { color: '#c97a0a', bg: 'rgba(201,122,10,.12)', useCase: 'Un audit approfondi sera déclenché. Le compte sera suspendu en attente de clarification.' },
};

function DecisionButtons({ value, onChange }) {
  const [pending,   setPending]   = useState(null);
  const [motifVal,  setMotifVal]  = useState('');
  const [motifs,    setMotifs]    = useState([]);

  useEffect(() => {
    motifAPI.list().then(r => setMotifs(r.data)).catch(() => {});
  }, []);

  const handleBtnClick = (key) => {
    if (value === key) {
      onChange('', '');
      return;
    }
    if (key === 'Maintenir') {
      // Ouvre le panneau de sélection du motif
      setPending('Maintenir');
      setMotifVal('');
    } else {
      // Révoquer / Investiguer → sauvegarde immédiate sans motif
      onChange(key, '');
    }
  };

  const handleConfirm = () => {
    if (!motifVal) return;
    onChange('Maintenir', motifVal);
    setPending(null);
    setMotifVal('');
  };

  const handleCancel = () => { setPending(null); setMotifVal(''); };

  const meta = DECISION_META['Maintenir'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', gap: 5 }}>
        {Object.entries(DECISION_META).map(([key, m]) => (
          <button key={key} onClick={() => handleBtnClick(key)}
            style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', border: 'none', transition: 'all .15s',
              background: value === key ? m.bg : pending === key ? m.bg : 'var(--pwc-light)',
              color:      value === key ? m.color : pending === key ? m.color : '#aaa',
              outline:    value === key ? `1.5px solid ${m.color}` : pending === key ? `1.5px dashed ${m.color}` : '1px solid #e2e2e2',
            }}>
            {key}
          </button>
        ))}
      </div>

      {/* Panneau motif (Maintenir uniquement) */}
      {pending === 'Maintenir' && (
        <div style={{ background: meta.bg, border: `1px solid ${meta.color}33`, borderRadius: 8, padding: '10px 12px', marginTop: 2 }}>
          <div style={{ fontSize: 11, color: meta.color, fontWeight: 600, marginBottom: 6 }}>
            Maintenir — {meta.useCase}
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select
              value={motifVal}
              onChange={e => setMotifVal(e.target.value)}
              style={{ flex: 1, padding: '5px 8px', borderRadius: 5, border: `1px solid ${meta.color}55`, fontSize: 12, outline: 'none', background: '#fff' }}>
              <option value="">Sélectionner un motif…</option>
              {motifs.map(m => <option key={m.id} value={m.label}>{m.label}</option>)}
            </select>
            <button onClick={handleConfirm} disabled={!motifVal}
              style={{ padding: '5px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: motifVal ? 'pointer' : 'not-allowed', background: meta.color, color: '#fff', border: 'none', opacity: motifVal ? 1 : .5 }}>
              ✓
            </button>
            <button onClick={handleCancel}
              style={{ padding: '5px 8px', borderRadius: 5, fontSize: 11, cursor: 'pointer', background: 'transparent', color: '#aaa', border: '1px solid #e2e2e2' }}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Risk Badge ────────────────────────────────
function riskBadge(a) {
  const score = a.score ?? 0;
  const parts = [];
  if (a.orphelin_app) parts.push('Orphelin');
  if (a.orphelin_ad)  parts.push('Non Provisionné');
  if (a.inactif)      parts.push('Inactif');
  if (a.privilegie)   parts.push('Privilégié');
  if (parts.length === 0) return <span style={{ ...S.badge, background: 'rgba(26,158,95,.1)', color: '#1a9e5f' }}>OK</span>;
  const color = score >= 2 ? '#c0392b' : '#c97a0a';
  const bg    = score >= 2 ? 'rgba(192,57,43,.12)' : 'rgba(201,122,10,.10)';
  return <span style={{ ...S.badge, background: bg, color, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={parts.join(' + ')}>{parts.join(' + ')}</span>;
}

// ── Profile Page ──────────────────────────────
function ProfilePage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ nom: user?.nom||'', prenom: user?.prenom||'', email_ad: user?.email_ad||'' });
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await profileAPI.update(form);
      // Mettre à jour le contexte Auth
      const token = localStorage.getItem('token');
      login(token, r.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch(err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: 32, maxWidth: 520 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>Mon profil</h2>

      {/* Carte identité */}
      <div style={{ background:'#fff', border:'1px solid #e2e2e2', borderRadius:12, padding:24, marginBottom:16 }}>
        <div style={{ display:'flex', gap:14, alignItems:'center', marginBottom:24 }}>
          <div style={{ width:52, height:52, borderRadius:13, background:'rgba(232,76,46,.1)', color:'var(--pwc-orange)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, fontWeight:700 }}>
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div>
            <div style={{ fontWeight:600, fontSize:16 }}>{user?.prenom} {user?.nom}</div>
            <div style={{ fontSize:13, color:'#aaa' }}>{user?.email}</div>
          </div>
        </div>

        {user?.days_until_expiry !== undefined && user.days_until_expiry <= 14 && (
          <div style={{ background:'rgba(201,122,10,.08)', border:'1px solid rgba(201,122,10,.2)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#c97a0a', marginBottom:20 }}>
            ⚠ Votre mot de passe expire dans {user.days_until_expiry} jour(s)
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input className="form-input" value={form.prenom} onChange={e => set('prenom', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email de notification (PwC)</label>
            <input className="form-input" type="email" placeholder="votre.nom@pwc.com"
              value={form.email_ad} onChange={e => set('email_ad', e.target.value)} />
            <div style={{ fontSize:12, color:'#aaa', marginTop:5 }}>
              Cet email sera utilisé pour vous notifier des nouvelles campagnes.
              Si vous le modifiez, les notifications seront envoyées à cette nouvelle adresse.
            </div>
          </div>

          {error && <div className="form-error" style={{ marginBottom:12 }}>{error}</div>}

          <div style={{ display:'flex', gap:10 }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex:1 }}>
              {loading ? 'Enregistrement…' : saved ? '✓ Enregistré' : 'Enregistrer'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/change-password')}>
              Changer le mot de passe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reviewer Layout ───────────────────────────
export default function ReviewerLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--pwc-light)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Routes>
          <Route path="dashboard" element={<ManagerDashboard />} />
          <Route path="profile"   element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
  );
}

// ── Styles ────────────────────────────────────
const S = {
  sidebar:     { width: 240, background: '#fff', borderRight: '1px solid #e2e2e2', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  logoWrap:    { padding: '22px 20px 18px', borderBottom: '1px solid #e2e2e2', display: 'flex', alignItems: 'center', gap: 10 },
  logoMark:    { width: 34, height: 34, borderRadius: 8, background: 'var(--pwc-orange)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 },
  logoName:    { fontWeight: 600, fontSize: 15 },
  logoPwC:     { fontSize: 11, color: '#bbb', letterSpacing: '.5px', marginTop: 1 },
  navSection:  { padding: '16px 12px 8px', flex: 1 },
  navLabel:    { fontSize: 11, fontWeight: 500, color: '#bbb', letterSpacing: '.8px', textTransform: 'uppercase', padding: '0 8px', marginBottom: 6 },
  navItem:     { display: 'flex', alignItems: 'center', gap: 9, padding: '10px 10px', borderRadius: 8, cursor: 'pointer', color: '#646464', fontSize: 14, textDecoration: 'none', marginBottom: 2 },
  navActive:   { background: 'rgba(232,76,46,.08)', color: 'var(--pwc-orange)' },
  navIcon:     { fontSize: 15, width: 20, textAlign: 'center' },
  sidebarBottom: { borderTop: '1px solid #e2e2e2', padding: 14 },
  userInfo:    { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 },
  userAvatar:  { width: 32, height: 32, borderRadius: 8, background: 'rgba(232,76,46,.1)', color: 'var(--pwc-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600 },
  userName:    { fontSize: 13, fontWeight: 500 },
  userRole:    { fontSize: 12, color: '#bbb' },
  logoutBtn:   { width: '100%', padding: 9, borderRadius: 7, border: '1px solid #e2e2e2', background: 'transparent', color: '#646464', fontSize: 13, cursor: 'pointer' },

  campList:       { width: 270, borderRight: '1px solid #e2e2e2', background: '#fff', overflow: 'auto', flexShrink: 0 },
  campListHeader: { padding: '16px 16px 10px', fontSize: 12, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.6px', borderBottom: '1px solid #f0f0f0' },
  campItem:       { padding: '16px 16px', borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background .15s' },
  campItemActive: { background: 'rgba(232,76,46,.05)', borderLeft: '3px solid var(--pwc-orange)' },
  campItemName:   { fontWeight: 500, fontSize: 14, marginBottom: 3 },
  campItemDate:   { fontSize: 12, color: '#aaa', marginBottom: 6 },
  campItemMeta:   { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  campItemProgress: { fontSize: 12, color: '#646464' },
  campItemRisk:   { fontSize: 11, background: 'rgba(214,59,59,.1)', color: '#d63b3b', padding: '2px 7px', borderRadius: 10, fontWeight: 500 },
  progressBarWrap: { height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', background: 'var(--pwc-orange)', borderRadius: 2, transition: 'width .5s ease' },
  empty:          { padding: 24, fontSize: 14, color: '#bbb', lineHeight: 1.7 },

  campDetail:   { flex: 1, overflow: 'auto', padding: 26 },
  noSelection:  { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb' },
  detailHeader: { marginBottom: 20 },
  detailTitle:  { fontSize: 21, fontWeight: 600, marginBottom: 4 },
  detailSub:    { fontSize: 14, color: '#646464' },

  kpiRow:  { display: 'flex', gap: 12, marginBottom: 20 },
  kpi:     { flex: 1, background: '#fff', border: '1px solid #e2e2e2', borderRadius: 10, padding: '14px 16px', textAlign: 'center' },
  kpiVal:  { fontSize: 28, fontWeight: 700, lineHeight: 1 },
  kpiLabel:{ fontSize: 12, color: '#aaa', marginTop: 4, textTransform: 'uppercase', letterSpacing: '.4px' },

  filterRow:   { display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  filterBtn:   { padding: '7px 14px', borderRadius: 8, border: '1px solid #e2e2e2', background: '#fff', color: '#646464', fontSize: 13, cursor: 'pointer' },
  filterActive:{ background: 'var(--pwc-orange)', color: '#fff', borderColor: 'var(--pwc-orange)' },

  tableWrap: { background: '#fff', border: '1px solid #e2e2e2', borderRadius: 12, overflow: 'hidden' },
  th:        { padding: '11px 14px', textAlign: 'left', fontSize: 12, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '.5px', borderBottom: '1px solid #e2e2e2', whiteSpace: 'nowrap' },
  td:        { padding: '13px 14px', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle' },
  badge:     { display: 'inline-flex', padding: '4px 9px', borderRadius: 20, fontSize: 12, fontWeight: 500 },
};
