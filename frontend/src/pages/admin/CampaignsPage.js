import React, { useState, useEffect } from 'react';
import { campaignAPI, mailAPI } from '../../api';
import { useLang } from '../../i18n';

// ── Helpers ───────────────────────────────────
function riskBadge(a, t) {
  const s = { display:'inline-flex', padding:'3px 8px', borderRadius:20, fontSize:11, fontWeight:500, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' };
  const score = a.score ?? 0;
  const parts = [];
  if (a.orphelin_app) parts.push(t('risk.orphan'));
  if (a.orphelin_ad)  parts.push(t('risk.notProvisioned'));
  if (a.inactif)      parts.push(t('risk.inactive'));
  if (a.privilegie)   parts.push(t('risk.privileged'));
  if (parts.length === 0) return <span style={{ ...s, background:'rgba(26,158,95,.1)', color:'#1a9e5f' }}>{t('risk.ok')}</span>;
  // Couleur basée sur le score: ≥2 = rouge, 1 = orange
  const color = score >= 2 ? '#c0392b' : '#c97a0a';
  const bg    = score >= 2 ? 'rgba(192,57,43,.12)' : 'rgba(201,122,10,.10)';
  return <span style={{ ...s, background: bg, color }} title={parts.join(' + ')}>{parts.join(' + ')}</span>;
}

const DEC_LABELS = { 'Maintenir': 'dec.maintain', 'Révoquer': 'dec.revoke', 'Investiguer': 'dec.investigate' };
const DEC_COLORS = {
  'Maintenir':   { color:'#1a9e5f', bg:'rgba(26,158,95,.1)'  },
  'Révoquer':    { color:'#d63b3b', bg:'rgba(214,59,59,.1)'  },
  'Investiguer': { color:'#c97a0a', bg:'rgba(201,122,10,.1)' },
};

function decisionChip(d, t) {
  if (!d) return <span style={{ fontSize:12, color:'#bbb' }}>—</span>;
  const st = DEC_COLORS[d] || { color:'#646464', bg:'#f0f0f0' };
  const label = DEC_LABELS[d] ? t(DEC_LABELS[d]) : d;
  return <span style={{ display:'inline-flex', padding:'3px 8px', borderRadius:20, fontSize:11, fontWeight:500, background:st.bg, color:st.color }}>{label}</span>;
}

// ── Email Notify Button ───────────────────────
function EmailButton({ campaignId, managerEmail, managerNom }) {
  const { t } = useLang();
  const [status, setStatus] = useState('idle');
  const send = async () => {
    setStatus('sending');
    try {
      await mailAPI.notifyManager(campaignId, managerEmail, managerNom);
      setStatus('sent');
      setTimeout(() => setStatus('idle'), 3000);
    } catch { setStatus('error'); setTimeout(() => setStatus('idle'), 3000); }
  };
  const map = {
    idle:    { label: t('camp.mgrNotify'), bg:'rgba(232,76,46,.08)', color:'var(--pwc-orange)', border:'rgba(232,76,46,.2)' },
    sending: { label: t('sending'),        bg:'#f5f5f5',              color:'#aaa',              border:'#e2e2e2' },
    sent:    { label: t('sent'),           bg:'rgba(26,158,95,.08)',   color:'#1a9e5f',           border:'rgba(26,158,95,.2)' },
    error:   { label: t('error'),          bg:'rgba(214,59,59,.08)',   color:'#d63b3b',           border:'rgba(214,59,59,.2)' },
  };
  const st = map[status];
  return (
    <button onClick={send} disabled={status === 'sending'}
      style={{ padding:'5px 12px', borderRadius:7, border:`1px solid ${st.border}`, background:st.bg, color:st.color, fontSize:12, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>
      {st.label}
    </button>
  );
}

// ── New Campaign Modal ────────────────────────
function NewCampaignModal({ onClose, onCreated }) {
  const { t } = useLang();
  const [form, setForm] = useState({
    nom: '', description: '', inactivityDays: 120,
    sensitiveGroups: 'Domain Admins,Enterprise Admins', dateEcheance: '',
  });
  const [fileApp, setFileApp] = useState(null);
  const [fileAD,  setFileAD]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileApp) return setError(t('camp.fileApp'));
    if (!fileAD)  return setError(t('camp.fileAD'));
    setError(''); setLoading(true); setProgress(15);
    setProgressLabel(t('camp.sendingFiles'));

    const fd = new FormData();
    Object.entries(form).forEach(([k,v]) => fd.append(k, v));
    fd.append('fileApp', fileApp);
    fd.append('fileAD',  fileAD);

    try {
      setProgress(40); setProgressLabel(t('camp.analyzing'));
      const res = await campaignAPI.create(fd);
      setProgress(90); setProgressLabel(t('camp.savingLabel'));
      await new Promise(r => setTimeout(r, 300));
      setProgress(100);
      onCreated(res.data);
    } catch(err) {
      setError(err.response?.data?.error || t('error'));
      setLoading(false); setProgress(0);
    }
  };

  return (
    <div style={Mo.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={Mo.modal}>
        <div style={Mo.header}>
          <h2 style={Mo.title}>{t('camp.newCampaign')}</h2>
          <button onClick={onClose} style={Mo.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('camp.name')}</label>
            <input className="form-input" placeholder={t('camp.namePh')}
              value={form.nom} onChange={e => set('nom', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('camp.description')}</label>
            <textarea className="form-input" rows={2} placeholder={t('camp.descPh')}
              value={form.description} onChange={e => set('description', e.target.value)}
              style={{ resize: 'vertical' }} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('camp.inactivityDays')}</label>
              <input className="form-input" type="number" min={1} max={365}
                value={form.inactivityDays} onChange={e => set('inactivityDays', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('camp.deadline')}</label>
              <input className="form-input" type="date"
                value={form.dateEcheance} onChange={e => set('dateEcheance', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('camp.sensitiveGroups')}</label>
            <input className="form-input"
              value={form.sensitiveGroups} onChange={e => set('sensitiveGroups', e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('camp.fileApp')}</label>
            <label style={{ ...Mo.uploadZone, ...(fileApp ? Mo.uploadDone : {}) }}>
              <input type="file" accept=".xlsx,.xls" style={{ display:'none' }}
                onChange={e => setFileApp(e.target.files[0])} />
              <span style={{ fontSize: 20 }}>{fileApp ? '✓' : '📊'}</span>
              <span style={{ fontSize: 13, color: fileApp ? '#1a9e5f' : '#aaa' }}>
                {fileApp ? fileApp.name : t('camp.uploadApp')}
              </span>
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">{t('camp.fileAD')}</label>
            <label style={{ ...Mo.uploadZone, ...(fileAD ? Mo.uploadDone : {}) }}>
              <input type="file" accept=".xlsx,.xls" style={{ display:'none' }}
                onChange={e => setFileAD(e.target.files[0])} />
              <span style={{ fontSize: 20 }}>{fileAD ? '✓' : '🗂'}</span>
              <span style={{ fontSize: 13, color: fileAD ? '#1a9e5f' : '#aaa' }}>
                {fileAD ? fileAD.name : t('camp.uploadAD')}
              </span>
            </label>
          </div>

          {loading && (
            <div style={Mo.progress}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#646464', marginBottom:6 }}>
                <span>{progressLabel}</span><span>{progress}%</span>
              </div>
              <div style={Mo.progressBar}>
                <div style={{ ...Mo.progressFill, width: `${progress}%` }}/>
              </div>
            </div>
          )}

          {error && <div className="form-error" style={{ marginBottom: 12 }}>{error}</div>}

          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex:1 }}>{t('cancel')}</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex:2 }}>
              {loading ? t('camp.launching') : t('camp.launch')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Campaign Dashboard (Admin) ─────────────────
function CampaignDashboard({ campaign }) {
  const { t } = useLang();
  const [data,    setData]    = useState(null);
  const [accounts,setAccounts]= useState([]);
  const [tab,     setTab]     = useState('accounts');
  const [filter,  setFilter]  = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [notifyAllStatus, setNotifyAllStatus] = useState('idle');
  const [loading, setLoading] = useState(true);

  const handleNotifyAll = async () => {
    setNotifyAllStatus('sending');
    try {
      const r = await mailAPI.notifyAll(campaign.id);
      setNotifyAllStatus(`sent:${r.data.sent}`);
      setTimeout(() => setNotifyAllStatus('idle'), 4000);
    } catch { setNotifyAllStatus('error'); setTimeout(() => setNotifyAllStatus('idle'), 3000); }
  };

  useEffect(() => {
    Promise.all([
      campaignAPI.dashboard(campaign.id),
      campaignAPI.accounts(campaign.id),
    ]).then(([d, a]) => {
      setData(d.data);
      setAccounts(a.data);
    }).finally(() => setLoading(false));
  }, [campaign.id]);

  if (loading) return <div style={{ padding: 32, color: '#bbb' }}>{t('loading')}</div>;
  if (!data)   return null;

  const g = data.global;

  const filteredAccounts = accounts.filter(a => {
    const matchRisk =
      filter === 'orphan'   ? (a.orphelin_app || a.orphelin_ad) :
      filter === 'inactive' ? a.inactif :
      filter === 'priv'     ? a.privilegie :
      filter === 'pending'  ? !a.decision : true;
    const matchManager = managerFilter === 'all' || a.manager_nom === managerFilter;
    return matchRisk && matchManager;
  });

  const managerList = [...new Set(accounts.map(a => a.manager_nom).filter(Boolean))];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h2 style={{ fontSize:20, fontWeight:600, marginBottom:4 }}>{campaign.nom}</h2>
          <div style={{ fontSize:14, color:'#646464' }}>
            {t('camp.launched')} {campaign.date_lancement}
            {campaign.date_echeance && ` · ${t('camp.echeance')} ${campaign.date_echeance}`}
            {campaign.description && ` · ${campaign.description}`}
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleNotifyAll} disabled={notifyAllStatus === 'sending'}
            style={{ padding:'9px 16px', borderRadius:8, border:'1px solid rgba(232,76,46,.25)', background:'rgba(232,76,46,.06)', color:'var(--pwc-orange)', fontSize:13, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>
            {notifyAllStatus === 'sending' ? t('sending') :
             notifyAllStatus.startsWith('sent') ? `✓ ${notifyAllStatus.split(':')[1]} ${t('camp.emailsSent')}` :
             notifyAllStatus === 'error' ? t('error') : t('camp.notifyAll')}
          </button>
          <button onClick={() => campaignAPI.export(campaign.id)}
            style={{ padding:'9px 16px', borderRadius:8, border:'1px solid #e2e2e2', background:'#fff', color:'#646464', fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
            {t('camp.export')}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
        {[
          { key:'camp.kpiTotal',   val:g.total,              color:'#2d2d2d', pct: null },
          { key:'camp.kpiOrphan',  val:g.orphan_app+g.orphan_ad, color:'#d63b3b', pct:g.total },
          { key:'camp.kpiInactive',val:g.inactive,           color:'#c97a0a', pct:g.total },
          { key:'camp.kpiPriv',    val:g.privileged,         color:'#7c5cbf', pct:g.total },
          { key:'camp.kpiDecided', val:g.decided,            color:'#1a9e5f', pct:g.total },
        ].map(k => (
          <div key={k.key} style={{ background:'#fff', border:'1px solid #e2e2e2', borderRadius:10, padding:'16px 18px' }}>
            <div style={{ fontSize:10, color:'#aaa', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:8 }}>{t(k.key)}</div>
            <div style={{ fontSize:28, fontWeight:700, color:k.color, lineHeight:1 }}>{k.val}</div>
            {k.pct > 0 && <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>{Math.round(k.val/k.pct*100)}% {t('camp.ofTotal')}</div>}
            <div style={{ height:3, background:'#f0f0f0', borderRadius:2, marginTop:10, overflow:'hidden' }}>
              <div style={{ height:'100%', background:k.color, borderRadius:2, width: k.pct > 0 ? `${Math.round(k.val/k.pct*100)}%` : '100%', opacity:.6 }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Decisions summary */}
      <div style={{ display:'flex', gap:10, marginBottom:24 }}>
        {[
          { key:'camp.decMaintenir',   val:g.maintenir,       color:'#1a9e5f', bg:'rgba(26,158,95,.08)'  },
          { key:'camp.decRevoquer',    val:g.revoquer,        color:'#d63b3b', bg:'rgba(214,59,59,.08)'  },
          { key:'camp.decInvestiguer', val:g.investiguer,     color:'#c97a0a', bg:'rgba(201,122,10,.08)' },
          { key:'camp.decPending',     val:g.total-g.decided, color:'#aaa',    bg:'#f5f5f5' },
        ].map(d => (
          <div key={d.key} style={{ flex:1, background:d.bg, borderRadius:10, padding:'12px 16px', border:`1px solid ${d.color}22` }}>
            <div style={{ fontSize:22, fontWeight:700, color:d.color }}>{d.val}</div>
            <div style={{ fontSize:11, color:d.color, marginTop:3 }}>{t(d.key)}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, borderBottom:'1px solid #e2e2e2' }}>
        {[
          ['accounts',   t('camp.tabAccounts')],
          ['directions', t('camp.tabDirections')],
          ['managers',   t('camp.tabManagers')],
        ].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:'8px 16px', border:'none', background:'transparent', fontSize:13, cursor:'pointer', fontWeight: tab===key ? 600 : 400, color: tab===key ? 'var(--pwc-orange)' : '#646464', borderBottom: tab===key ? '2px solid var(--pwc-orange)' : '2px solid transparent', marginBottom:-1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Accounts */}
      {tab === 'accounts' && (
        <>
          <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
            {[
              ['all',      t('camp.filterAll')],
              ['pending',  t('camp.filterPending')],
              ['orphan',   t('camp.filterOrphan')],
              ['inactive', t('camp.filterInactive')],
              ['priv',     t('camp.filterPriv')],
            ].map(([key,label]) => (
              <button key={key} onClick={() => setFilter(key)}
                style={{ padding:'6px 14px', borderRadius:8, border:'1px solid #e2e2e2', background: filter===key ? 'var(--pwc-orange)':'#fff', color: filter===key ? '#fff':'#646464', fontSize:13, cursor:'pointer' }}>
                {label}
              </button>
            ))}
            <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:12, color:'#aaa' }}>{t('camp.manager')}</span>
              <select value={managerFilter} onChange={e => setManagerFilter(e.target.value)}
                style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e2e2e2', background:'#fff', color:'#2d2d2d', fontSize:13, cursor:'pointer', outline:'none' }}>
                <option value="all">{t('all')}</option>
                {managerList.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div style={{ background:'#fff', border:'1px solid #e2e2e2', borderRadius:12, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>{[
                  t('camp.colUser'), t('camp.colDirection'), t('camp.colProfile'),
                  t('camp.colLogon'), t('camp.colRisk'), t('camp.colManager'),
                  t('camp.colDecision'), t('camp.colMotif'),
                ].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:500, color:'#999', textTransform:'uppercase', letterSpacing:'.4px', borderBottom:'1px solid #e2e2e2', whiteSpace:'nowrap' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filteredAccounts.map(a => {
                  const rowBg = a.decision === 'Maintenir'   ? 'rgba(26,158,95,.04)'
                              : a.decision === 'Révoquer'    ? 'rgba(214,59,59,.04)'
                              : a.decision === 'Investiguer' ? 'rgba(201,122,10,.04)'
                              : 'transparent';
                  return (
                  <tr key={a.id} style={{ borderBottom:'1px solid #f5f5f5', background: rowBg }}>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ fontWeight:500, fontSize:13 }}>{a.nom_complet}</div>
                      <div style={{ fontSize:11, color:'#aaa', fontFamily:'monospace' }}>{a.account_id}</div>
                    </td>
                    <td style={{ padding:'11px 14px', color:'#646464', fontSize:13 }}>{a.direction||'—'}</td>
                    <td style={{ padding:'11px 14px', fontSize:12 }}>
                      <div>{a.profil_app}</div>
                      {a.profil_description && <div style={{ color:'#aaa', fontSize:11, marginTop:1 }}>{a.profil_description}</div>}
                    </td>
                    <td style={{ padding:'11px 14px', fontSize:12, fontFamily:'monospace', color:a.last_logon_ad==='Jamais'?'#d63b3b':'#646464' }}>{a.last_logon_ad||'—'}</td>
                    <td style={{ padding:'11px 14px' }}>{riskBadge(a, t)}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'#646464' }}>{a.manager_nom||'—'}</td>
                    <td style={{ padding:'11px 14px' }}>{decisionChip(a.decision, t)}</td>
                    <td style={{ padding:'11px 14px', fontSize:12, color:'#646464', fontStyle: a.motif ? 'italic' : 'normal', maxWidth:200 }}>
                      {a.motif || '—'}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Tab: By department */}
      {tab === 'directions' && (
        <div style={{ background:'#fff', border:'1px solid #e2e2e2', borderRadius:12, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{[
                t('camp.dirColDirection'), t('camp.dirColTotal'), t('camp.dirColRisks'),
                t('camp.dirColTreated'), t('camp.dirColMaintenir'), t('camp.dirColRevoquer'), t('camp.dirColRate'),
              ].map(h => (
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:500, color:'#999', textTransform:'uppercase', letterSpacing:'.4px', borderBottom:'1px solid #e2e2e2' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.by_direction.map(d => (
                <tr key={d.direction} style={{ borderBottom:'1px solid #f5f5f5' }}>
                  <td style={{ padding:'11px 14px', fontWeight:500 }}>{d.direction}</td>
                  <td style={{ padding:'11px 14px', color:'#646464' }}>{d.total}</td>
                  <td style={{ padding:'11px 14px' }}><span style={{ color:'#d63b3b', fontWeight:600 }}>{d.risk}</span></td>
                  <td style={{ padding:'11px 14px', color:'#646464' }}>{d.decided}/{d.total}</td>
                  <td style={{ padding:'11px 14px' }}><span style={{ color:'#1a9e5f', fontWeight:500 }}>{d.maintenir}</span></td>
                  <td style={{ padding:'11px 14px' }}><span style={{ color:'#d63b3b', fontWeight:500 }}>{d.revoquer}</span></td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:6, background:'#f0f0f0', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', background:'var(--pwc-orange)', borderRadius:3, width:`${d.total>0?Math.round(d.decided/d.total*100):0}%` }}/>
                      </div>
                      <span style={{ fontSize:12, color:'#646464', minWidth:32 }}>{d.total>0?Math.round(d.decided/d.total*100):0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: By manager */}
      {tab === 'managers' && (
        <div style={{ background:'#fff', border:'1px solid #e2e2e2', borderRadius:12, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>{[
                t('camp.mgrColManager'), t('camp.mgrColEmail'), t('camp.mgrColAccounts'),
                t('camp.mgrColRisks'), t('camp.mgrColTreated'), t('camp.mgrColProgress'), t('camp.mgrColAction'),
              ].map(h => (
                <th key={h} style={{ padding:'12px 14px', textAlign:'left', fontSize:12, fontWeight:500, color:'#999', textTransform:'uppercase', letterSpacing:'.4px', borderBottom:'1px solid #e2e2e2' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {data.by_manager.map(m => (
                <tr key={m.manager} style={{ borderBottom:'1px solid #f5f5f5' }}>
                  <td style={{ padding:'13px 14px', fontWeight:500, fontSize:14 }}>{m.manager}</td>
                  <td style={{ padding:'13px 14px', fontSize:13, color:'#646464', fontFamily:'monospace' }}>{m.email||'—'}</td>
                  <td style={{ padding:'13px 14px', color:'#646464', fontSize:14 }}>{m.total}</td>
                  <td style={{ padding:'13px 14px' }}><span style={{ color:'#d63b3b', fontWeight:600, fontSize:14 }}>{m.risk}</span></td>
                  <td style={{ padding:'13px 14px', color:'#646464', fontSize:14 }}>{m.decided}/{m.total}</td>
                  <td style={{ padding:'13px 14px', minWidth:160 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ flex:1, height:6, background:'#f0f0f0', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:'100%', background: m.decided===m.total&&m.total>0 ? '#1a9e5f' : 'var(--pwc-orange)', borderRadius:3, width:`${m.total>0?Math.round(m.decided/m.total*100):0}%`, transition:'width .5s ease' }}/>
                      </div>
                      <span style={{ fontSize:13, color:'#646464', minWidth:34 }}>{m.total>0?Math.round(m.decided/m.total*100):0}%</span>
                    </div>
                  </td>
                  <td style={{ padding:'13px 14px' }}>
                    {m.email && m.email !== '—' && (
                      <EmailButton campaignId={campaign.id} managerEmail={m.email} managerNom={m.manager} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Edit Campaign Modal ───────────────────────
function EditCampaignModal({ campaign, onClose, onUpdated }) {
  const { t } = useLang();
  const [form, setForm] = useState({
    nom: campaign.nom, description: campaign.description || '',
    dateEcheance: campaign.date_echeance || '',
  });
  const [reupload, setReupload] = useState(false);
  const [fileApp,  setFileApp]  = useState(null);
  const [fileAD,   setFileAD]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [progress, setProgress] = useState(0);
  const [error,    setError]    = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (reupload) {
        if (!fileApp || !fileAD) return setError(t('camp.bothFilesRequired'));
        setProgress(30);
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append('inactivityDays', campaign.inactivity_days);
        fd.append('sensitiveGroups', campaign.sensitive_groups || '');
        fd.append('fileApp', fileApp);
        fd.append('fileAD',  fileAD);
        setProgress(60);
        const r = await fetch(`/api/campaigns/${campaign.id}`, {
          method: 'PUT', body: fd,
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setProgress(100);
        onUpdated(data.campaign);
      } else {
        const r = await fetch(`/api/campaigns/${campaign.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify(form),
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        onUpdated(data.campaign);
      }
      onClose();
    } catch (err) {
      setError(err.message || t('error'));
      setLoading(false); setProgress(0);
    }
  };

  return (
    <div style={Mo.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={Mo.modal}>
        <div style={Mo.header}>
          <h2 style={Mo.title}>{t('camp.editTitle')}</h2>
          <button onClick={onClose} style={Mo.closeBtn}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('camp.name').replace(' *','')}</label>
            <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('camp.description')}</label>
            <textarea className="form-input" rows={2} value={form.description}
              onChange={e => set('description', e.target.value)} style={{ resize:'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('camp.deadline')}</label>
            <input className="form-input" type="date" value={form.dateEcheance}
              onChange={e => set('dateEcheance', e.target.value)} />
          </div>

          <div style={{ background:'#f9f9f9', border:'1px solid #e2e2e2', borderRadius:10, padding:'14px 16px', marginBottom:16 }}>
            <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:14 }}>
              <input type="checkbox" checked={reupload} onChange={e => setReupload(e.target.checked)}
                style={{ width:16, height:16 }} />
              {t('camp.reuploadCheckbox')}
            </label>
            {reupload && (
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:12, color:'#d63b3b', marginBottom:10 }}>
                  {t('camp.reuploadWarning')}
                </div>
                <label style={{ ...Mo.uploadZone, ...(fileApp ? Mo.uploadDone : {}), marginBottom:10 }}>
                  <input type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={e => setFileApp(e.target.files[0])} />
                  <span>{fileApp ? '✓ ' + fileApp.name : `📊 ${t('camp.newAppExtract')}`}</span>
                </label>
                <label style={{ ...Mo.uploadZone, ...(fileAD ? Mo.uploadDone : {}) }}>
                  <input type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={e => setFileAD(e.target.files[0])} />
                  <span>{fileAD ? '✓ ' + fileAD.name : `🗂 ${t('camp.newADExtract')}`}</span>
                </label>
              </div>
            )}
          </div>

          {loading && reupload && (
            <div style={Mo.progress}>
              <div style={Mo.progressBar}><div style={{ ...Mo.progressFill, width:`${progress}%` }}/></div>
            </div>
          )}
          {error && <div className="form-error" style={{ marginBottom:12 }}>{error}</div>}

          <div style={{ display:'flex', gap:10 }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex:1 }}>{t('cancel')}</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ flex:2 }}>
              {loading ? t('camp.updating') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Campaigns Page ───────────────────────
export default function CampaignsPage() {
  const { t } = useLang();
  const [campaigns,  setCampaigns]  = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [showModal,  setShowModal]  = useState(false);
  const [editModal,  setEditModal]  = useState(null);
  const [loading,    setLoading]    = useState(true);

  const load = () => {
    campaignAPI.list()
      .then(r => setCampaigns(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreated = (data) => {
    setShowModal(false);
    load();
    setSelected(data.campaign);
  };

  const handleUpdated = (updatedCampaign) => {
    setCampaigns(prev => prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
    if (selected?.id === updatedCampaign.id) setSelected(updatedCampaign);
    setEditModal(null);
    load();
  };

  const handleArchive = async (c, e) => {
    e.stopPropagation();
    await fetch(`/api/campaigns/${c.id}/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    load();
    if (selected?.id === c.id) setSelected(null);
  };

  const handleDelete = async (c, e) => {
    e.stopPropagation();
    if (!window.confirm(`${t('camp.editTitle').replace('Edit','Delete').replace('Modifier','Supprimer')} "${c.nom}" ?`)) return;
    await fetch(`/api/campaigns/${c.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    load();
    if (selected?.id === c.id) setSelected(null);
  };

  return (
    <div style={{ display:'flex', height:'100%', overflow:'hidden' }}>

      {/* Campaign list */}
      <div style={{ width:290, borderRight:'1px solid #e2e2e2', background:'#fff', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:11, fontWeight:600, color:'#aaa', textTransform:'uppercase', letterSpacing:'.6px' }}>
            {t('admin.campaigns')} ({campaigns.length})
          </span>
          <button onClick={() => setShowModal(true)}
            style={{ background:'var(--pwc-orange)', color:'#fff', border:'none', borderRadius:7, padding:'5px 12px', fontSize:12, fontWeight:500, cursor:'pointer' }}>
            + {t('camp.newCampaign')}
          </button>
        </div>

        <div style={{ flex:1, overflow:'auto' }}>
          {loading
            ? <div style={{ padding:20, color:'#bbb', fontSize:13 }}>{t('loading')}</div>
            : campaigns.length === 0
              ? <div style={{ padding:20, color:'#bbb', fontSize:13, lineHeight:1.6 }}>
                  {t('camp.noCampaigns').split('\n').map((l,i) => <span key={i}>{l}{i===0&&<br/>}</span>)}
                </div>
              : campaigns.map(c => (
                <div key={c.id}
                  style={{ padding:'13px 14px', borderBottom:'1px solid #f5f5f5', cursor:'pointer', background: selected?.id===c.id ? 'rgba(232,76,46,.05)':'transparent', borderLeft: selected?.id===c.id ? '3px solid var(--pwc-orange)':'3px solid transparent', opacity: c.statut === 'archivee' ? .55 : 1 }}
                  onClick={() => setSelected(c)}>

                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:2 }}>
                    <div style={{ fontWeight:500, fontSize:13, flex:1, marginRight:6 }}>{c.nom}</div>
                    <div style={{ display:'flex', gap:4, opacity: selected?.id===c.id ? 1 : 0, transition:'opacity .15s' }}>
                      <button title={t('camp.edit')} onClick={e => { e.stopPropagation(); setEditModal(c); }}
                        style={Btn.icon}>✎</button>
                      <button title={c.statut === 'archivee' ? t('camp.unarchive') : t('camp.archive')}
                        onClick={e => handleArchive(c, e)} style={Btn.icon}>
                        {c.statut === 'archivee' ? '↩' : '🗄'}
                      </button>
                      <button title={t('camp.delete')} onClick={e => handleDelete(c, e)}
                        style={{ ...Btn.icon, color:'#d63b3b' }}>✕</button>
                    </div>
                  </div>

                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <span style={{ fontSize:11, color:'#aaa' }}>{c.date_lancement}</span>
                    {c.statut === 'archivee' && (
                      <span style={{ fontSize:10, background:'#f0f0f0', color:'#aaa', padding:'1px 6px', borderRadius:10 }}>{t('camp.archived')}</span>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:6, alignItems:'center', marginBottom:5 }}>
                    <span style={{ fontSize:11, color:'#646464' }}>{c.decided}/{c.total} {t('camp.treated')}</span>
                    {c.risk_count > 0 && (
                      <span style={{ fontSize:10, background:'rgba(214,59,59,.1)', color:'#d63b3b', padding:'1px 6px', borderRadius:10 }}>
                        {c.risk_count} {t('camp.risks')}
                      </span>
                    )}
                  </div>
                  <div style={{ height:3, background:'#f0f0f0', borderRadius:2, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'var(--pwc-orange)', borderRadius:2, width:`${c.total>0?Math.round(c.decided/c.total*100):0}%`, transition:'width .4s' }}/>
                  </div>
                </div>
              ))
          }
        </div>
      </div>

      {/* Detail */}
      <div style={{ flex:1, overflow:'auto' }}>
        {!selected
          ? <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:'#bbb' }}>
              <div style={{ fontSize:40, marginBottom:16 }}>📋</div>
              <div style={{ fontWeight:600, marginBottom:8 }}>{t('camp.selectCampaign')}</div>
              <div style={{ fontSize:13, marginBottom:20 }}>{t('camp.selectOrCreate')}</div>
              <button onClick={() => setShowModal(true)} className="btn-primary" style={{ width:'auto', padding:'10px 24px' }}>
                + {t('camp.newCampaign')}
              </button>
            </div>
          : <CampaignDashboard key={selected.id} campaign={selected} />
        }
      </div>

      {showModal && <NewCampaignModal onClose={() => setShowModal(false)} onCreated={handleCreated} />}
      {editModal  && <EditCampaignModal campaign={editModal} onClose={() => setEditModal(null)} onUpdated={handleUpdated} />}
    </div>
  );
}

// ── Styles ────────────────────────────────────
const Btn = {
  icon: { background:'transparent', border:'1px solid #e2e2e2', borderRadius:5, width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, cursor:'pointer', color:'#646464', padding:0 },
};

const Mo = {
  overlay:     { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal:       { background:'#fff', borderRadius:16, padding:'28px 28px 24px', width:540, maxWidth:'95vw', maxHeight:'90vh', overflow:'auto', boxShadow:'0 8px 40px rgba(0,0,0,.15)' },
  header:      { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  title:       { fontSize:18, fontWeight:600 },
  closeBtn:    { background:'#f5f5f5', border:'none', borderRadius:7, width:28, height:28, cursor:'pointer', color:'#646464', fontSize:14 },
  uploadZone:  { display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'18px', border:'1.5px dashed #e2e2e2', borderRadius:10, cursor:'pointer', transition:'all .15s' },
  uploadDone:  { borderColor:'#1a9e5f', borderStyle:'solid', background:'rgba(26,158,95,.04)' },
  progress:    { marginBottom:12 },
  progressBar: { height:4, background:'#f0f0f0', borderRadius:2, overflow:'hidden' },
  progressFill:{ height:'100%', background:'var(--pwc-orange)', borderRadius:2, transition:'width .3s' },
};
