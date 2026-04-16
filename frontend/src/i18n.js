/**
 * AccessIQ — Internationalisation FR / EN
 * Usage :
 *   const { t, lang, setLang } = useLang();
 *   t('login.title')   → "Connexion"  (FR) | "Sign In"  (EN)
 */
import React, { createContext, useContext, useState } from 'react';

// ── Translations ─────────────────────────────────────────────────
const translations = {
  fr: {
    // ── Common ──
    loading:           'Chargement…',
    logout:            'Déconnexion',
    save:              'Enregistrer',
    saving:            'Enregistrement…',
    saved:             '✓ Enregistré',
    cancel:            'Annuler',
    confirm:           'Confirmer',
    all:               'Tous',
    none:              'Aucun',
    navigation:        'Navigation',
    sending:           'Envoi…',
    sent:              '✓ Envoyé',
    error:             '✕ Erreur',

    // ── Login ──
    'login.headline':  'Gouvernance des identités,\nsimplifiée.',
    'login.sub':       'Gérez vos campagnes de revue d\'accès, détectez les comptes à risque et pilotez les décisions de vos managers depuis une seule plateforme.',
    'login.feature1':  'Détection des comptes orphelins & inactifs',
    'login.feature2':  'Workflows d\'approbation multi-niveaux',
    'login.feature3':  'Rapports de conformité exportables',
    'login.title':     'Connexion',
    'login.subtitle':  'Entrez vos identifiants pour accéder à la plateforme',
    'login.email':     'Adresse email',
    'login.password':  'Mot de passe',
    'login.submit':    'Se connecter',
    'login.submitting':'Connexion…',
    'login.or':        'ou',
    'login.noAccount': 'Vous n\'avez pas de compte ?',
    'login.requestAccess': 'Demander un accès',

    // ── Register ──
    'reg.title':        'Demander un accès',
    'reg.subtitle':     'Votre demande sera examinée par un administrateur avant activation.',
    'reg.firstname':    'Prénom',
    'reg.lastname':     'Nom',
    'reg.email':        'Adresse email professionnelle',
    'reg.role':         'Rôle',
    'reg.roleManager':  'Manager — je valide les accès de mon équipe',
    'reg.roleRespo':    'Responsable applicatif — je gère une application',
    'reg.password':     'Mot de passe',
    'reg.confirm':      'Confirmer',
    'reg.submit':       'Envoyer la demande',
    'reg.submitting':   'Envoi en cours…',
    'reg.info':         'Après soumission, un administrateur recevra une notification et devra approuver votre compte avant que vous puissiez vous connecter.',
    'reg.hasAccount':   'Vous avez déjà un compte ?',
    'reg.signIn':       'Se connecter',
    'reg.successTitle': 'Demande envoyée !',
    'reg.successText':  'Votre demande de compte a bien été transmise à l\'administrateur. Vous recevrez un email dès que votre compte sera activé.',
    'reg.backToLogin':  'Retour à la connexion',
    'reg.pwMismatch':   'Les mots de passe ne correspondent pas',
    'reg.pwTooShort':   'Mot de passe trop court (min 12 caractères)',
    'reg.pwRule12':     'Au moins 12 caractères',
    'reg.pwRuleUpper':  'Une lettre majuscule',
    'reg.pwRuleLower':  'Une lettre minuscule',
    'reg.pwRuleDigit':  'Un chiffre',
    'reg.pwRuleSpecial':'Un caractère spécial',

    // ── Admin sidebar ──
    'admin.dashboard':  'Tableau de bord',
    'admin.campaigns':  'Campagnes',
    'admin.users':      'Utilisateurs',
    'admin.role':       'Administrateur',

    // ── Admin notifications ──
    'admin.newRequest':    'Nouvelle demande de compte reçue',
    'admin.newRequestSub': '— Un utilisateur attend votre validation.',

    // ── Users page ──
    'users.title':      'Utilisateurs',
    'users.subtitle':   'Gérez les comptes et validez les demandes d\'accès',
    'users.tabPending': 'En attente',
    'users.tabActive':  'Actifs',
    'users.tabRejected':'Refusés',
    'users.tabAll':     'Tous',
    'users.colUser':    'Utilisateur',
    'users.colEmail':   'Email',
    'users.colRole':    'Rôle',
    'users.colStatus':  'Statut',
    'users.colDate':    'Date',
    'users.colActions': 'Actions',
    'users.noUsers':    'Aucun utilisateur',
    'users.approve':    '✓ Approuver',
    'users.reject':     '✕ Refuser',
    'users.statusPending': 'En attente',
    'users.statusActive':  'Actif',
    'users.statusRejected':'Refusé',
    'users.roleAdmin':  'Admin',
    'users.roleRespo':  'Resp. App',
    'users.roleManager':'Manager',

    // ── Campaigns page ──
    'camp.newCampaign':   'Nouvelle campagne',
    'camp.name':          'Nom de la campagne *',
    'camp.namePh':        'ex: Revue accès Q1 2025 — SAP',
    'camp.description':   'Description',
    'camp.descPh':        'Objectif, périmètre…',
    'camp.inactivityDays':'Seuil inactivité (jours)',
    'camp.deadline':      'Date d\'échéance',
    'camp.sensitiveGroups':'Groupes sensibles (séparés par ,)',
    'camp.fileApp':       'Extract Application (.xlsx) *',
    'camp.fileAD':        'Extract Active Directory (.xlsx) *',
    'camp.uploadApp':     'Cliquez pour charger l\'extract Application',
    'camp.uploadAD':      'Cliquez pour charger l\'extract AD',
    'camp.launch':        'Lancer l\'analyse',
    'camp.launching':     'Analyse en cours…',
    'camp.sendingFiles':  'Envoi des fichiers…',
    'camp.analyzing':     'Analyse Python en cours…',
    'camp.savingLabel':   'Enregistrement…',
    'camp.edit':          'Modifier',
    'camp.archive':       'Archiver',
    'camp.unarchive':     'Désarchiver',
    'camp.delete':        'Supprimer',
    'camp.reupload':      'Ré-analyser avec de nouveaux fichiers',
    'camp.reuploadBtn':   'Mettre à jour les fichiers',
    'camp.saveChanges':   'Enregistrer les modifications',

    'camp.kpiTotal':    'Total comptes',
    'camp.kpiOrphan':   'Orphelins',
    'camp.kpiInactive': 'Inactifs',
    'camp.kpiPriv':     'Privilégiés',
    'camp.kpiDecided':  'Décisions prises',

    'camp.tabAccounts':   'Comptes',
    'camp.tabDirections': 'Par direction',
    'camp.tabManagers':   'Par manager',
    'camp.tabMotifs':     'Motifs',

    'camp.filterAll':     'Tous',
    'camp.filterPending': 'En attente',
    'camp.filterOrphan':  'Orphelins',
    'camp.filterInactive':'Inactifs',
    'camp.filterPriv':    'Privilégiés',

    'camp.notifyAll':  '✉ Notifier tous les managers',
    'camp.export':     '⬇ Exporter',
    'camp.exporting':  'Export en cours…',
    'camp.manager':    'Manager :',

    'camp.colUser':      'Utilisateur',
    'camp.colDirection': 'Direction',
    'camp.colProfile':   'Profil',
    'camp.colLogon':     'Dernier logon',
    'camp.colRisk':      'Risque',
    'camp.colManager':   'Manager',
    'camp.colDecision':  'Décision',
    'camp.colMotif':     'Motif',

    'camp.dirColDirection':  'Direction',
    'camp.dirColTotal':      'Total',
    'camp.dirColRisks':      'Risques',
    'camp.dirColTreated':    'Traités',
    'camp.dirColMaintenir':  'Maintenir',
    'camp.dirColRevoquer':   'Révoquer',
    'camp.dirColRate':       'Taux',

    'camp.mgrColManager':   'Manager',
    'camp.mgrColEmail':     'Email PwC',
    'camp.mgrColAccounts':  'Comptes',
    'camp.mgrColRisks':     'Risques',
    'camp.mgrColTreated':   'Traités',
    'camp.mgrColProgress':  'Progression',
    'camp.mgrColAction':    'Action',
    'camp.mgrNotify':       '✉ Notifier',

    'camp.decMaintenir':   'Maintenir',
    'camp.decRevoquer':    'Révoquer',
    'camp.decInvestiguer': 'Investiguer',
    'camp.decPending':     'En attente',

    'camp.launched':         'Lancée le',
    'camp.echeance':         'Échéance :',
    'camp.loading':          'Chargement…',
    'camp.noData':           '—',
    'camp.ofTotal':          'du total',
    'camp.emailsSent':       'emails envoyés',
    'camp.noCampaigns':      'Aucune campagne.\nCréez-en une avec le bouton +',
    'camp.selectCampaign':   'Sélectionnez une campagne',
    'camp.selectOrCreate':   'ou créez-en une nouvelle',
    'camp.archived':         'Archivée',
    'camp.editTitle':        'Modifier la campagne',
    'camp.updating':         'Mise à jour…',
    'camp.reuploadCheckbox': 'Corriger les fichiers Excel (re-analyser avec de nouveaux fichiers)',
    'camp.reuploadWarning':  '⚠ Attention : toutes les décisions existantes seront effacées.',
    'camp.bothFilesRequired':'Les deux fichiers sont requis pour re-analyser',
    'camp.newAppExtract':    'Nouvel extract Application',
    'camp.newADExtract':     'Nouvel extract AD',
    'camp.risks':            'risques',
    'camp.treated':          'traités',

    // ── Reviewer sidebar / dashboard ──
    'mgr.myCampaigns':   'Mes campagnes',
    'mgr.myProfile':     'Mon profil',
    'mgr.roleManager':   'Manager',
    'mgr.roleRespo':     'Responsable App',
    'mgr.noAssigned':    'Aucune campagne assignée pour l\'instant.',
    'mgr.launched':      'Lancée le',
    'mgr.treated':       'traités',
    'mgr.risks':         'risques',
    'mgr.toReview':      'À traiter',
    'mgr.orphans':       'Orphelins',
    'mgr.inactive':      'Inactifs',
    'mgr.privileged':    'Privilégiés',
    'mgr.reviewed':      'Traités',
    'mgr.decisionsOf':   'décisions prises',
    'mgr.tabPending':    'À traiter',
    'mgr.tabTreated':    'Traités',
    'mgr.decisionMade':  'Décision prise',
    'mgr.decision':      'Décision',
    'mgr.allTreated':    '✓ Tous les comptes ont été traités !',
    'mgr.noTreated':     'Aucun compte traité pour l\'instant.',
    'mgr.cancelDecision':'Annuler',
    'mgr.newCampaign':   'Nouvelle campagne assignée — ',
    'mgr.pendingAcc':    'compte(s) en attente de décision.',
    'mgr.selectCampaign':'Sélectionnez une campagne',
    'mgr.selectCampaignSub': 'Cliquez sur une campagne à gauche pour voir les comptes à traiter',
    'mgr.filterAll':     'Tous',
    'mgr.filterOrphan':  'Orphelins',
    'mgr.filterInactive':'Inactifs',
    'mgr.filterPriv':    'Privilégiés',
    'mgr.colUser':       'Utilisateur',
    'mgr.colDirection':  'Direction',
    'mgr.colProfile':    'Profil',
    'mgr.colLogon':      'Dernier logon',
    'mgr.colRisk':       'Risque',

    // ── Profile ──
    'profile.title':      'Mon profil',
    'profile.firstName':  'Prénom',
    'profile.lastName':   'Nom',
    'profile.notifEmail': 'Email de notification (PwC)',
    'profile.notifHint':  'Cet email sera utilisé pour vous notifier des nouvelles campagnes. Si vous le modifiez, les notifications seront envoyées à cette nouvelle adresse.',
    'profile.changePassword': 'Changer le mot de passe',
    'profile.pwExpiry':   'Votre mot de passe expire dans {n} jour(s)',

    // ── Risk badges ──
    'risk.orphan':        'Orphelin',
    'risk.notProvisioned':'Non Provisionné',
    'risk.multiRisk':     'Multi-risque',
    'risk.inactive':      'Inactif',
    'risk.privileged':    'Privilégié',
    'risk.ok':            'OK',

    // ── Decisions ──
    'dec.maintain':       'Maintenir',
    'dec.revoke':         'Révoquer',
    'dec.investigate':    'Investiguer',
    'dec.maintain.useCase':   'Le compte sera conservé. Une justification sera archivée dans le rapport de conformité.',
    'dec.revoke.useCase':     'L\'accès sera désactivé. Un ticket de révocation sera transmis au responsable IT.',
    'dec.investigate.useCase':'Un audit approfondi sera déclenché. Le compte sera suspendu en attente de clarification.',
    'dec.motifPlaceholder':   'Motif obligatoire…',
    'dec.selectMotif':        'Sélectionner un motif…',

    // ── Motifs admin ──
    'admin.motifs':             'Motifs',
    'motif.title':              'Motifs de décision',
    'motif.subtitle':           'Configurez les justifications proposées aux managers pour la décision "Maintenir"',
    'motif.addPlaceholder':     'Nouveau motif…',
    'motif.add':                'Ajouter',
    'motif.adding':             'Ajout…',
    'motif.noMotifs':           'Aucun motif configuré.',
    'motif.deleteConfirm':      'Supprimer ce motif ?',
    'motif.noMotifsHint':       'Ajoutez un premier motif avec le formulaire ci-dessus.',
    'motif.count':              'motif(s) configuré(s)',
  },

  en: {
    // ── Common ──
    loading:           'Loading…',
    logout:            'Sign out',
    save:              'Save',
    saving:            'Saving…',
    saved:             '✓ Saved',
    cancel:            'Cancel',
    confirm:           'Confirm',
    all:               'All',
    none:              'None',
    navigation:        'Navigation',
    sending:           'Sending…',
    sent:              '✓ Sent',
    error:             '✕ Error',

    // ── Login ──
    'login.headline':  'Identity governance,\nsimplified.',
    'login.sub':       'Manage your access review campaigns, detect risky accounts, and drive your managers\' decisions from a single platform.',
    'login.feature1':  'Detection of orphaned & inactive accounts',
    'login.feature2':  'Multi-level approval workflows',
    'login.feature3':  'Exportable compliance reports',
    'login.title':     'Sign In',
    'login.subtitle':  'Enter your credentials to access the platform',
    'login.email':     'Email address',
    'login.password':  'Password',
    'login.submit':    'Sign in',
    'login.submitting':'Signing in…',
    'login.or':        'or',
    'login.noAccount': 'Don\'t have an account?',
    'login.requestAccess': 'Request access',

    // ── Register ──
    'reg.title':        'Request Access',
    'reg.subtitle':     'Your request will be reviewed by an administrator before activation.',
    'reg.firstname':    'First name',
    'reg.lastname':     'Last name',
    'reg.email':        'Professional email address',
    'reg.role':         'Role',
    'reg.roleManager':  'Manager — I validate my team\'s access',
    'reg.roleRespo':    'Application Owner — I manage an application',
    'reg.password':     'Password',
    'reg.confirm':      'Confirm password',
    'reg.submit':       'Submit request',
    'reg.submitting':   'Submitting…',
    'reg.info':         'After submission, an administrator will receive a notification and must approve your account before you can sign in.',
    'reg.hasAccount':   'Already have an account?',
    'reg.signIn':       'Sign in',
    'reg.successTitle': 'Request sent!',
    'reg.successText':  'Your account request has been sent to the administrator. You will receive an email once your account is activated.',
    'reg.backToLogin':  'Back to sign in',
    'reg.pwMismatch':   'Passwords do not match',
    'reg.pwTooShort':   'Password too short (min 12 characters)',
    'reg.pwRule12':     'At least 12 characters',
    'reg.pwRuleUpper':  'One uppercase letter',
    'reg.pwRuleLower':  'One lowercase letter',
    'reg.pwRuleDigit':  'One digit',
    'reg.pwRuleSpecial':'One special character',

    // ── Admin sidebar ──
    'admin.dashboard':  'Dashboard',
    'admin.campaigns':  'Campaigns',
    'admin.users':      'Users',
    'admin.role':       'Administrator',

    // ── Admin notifications ──
    'admin.newRequest':    'New account request received',
    'admin.newRequestSub': '— A user is awaiting your approval.',

    // ── Users page ──
    'users.title':      'Users',
    'users.subtitle':   'Manage accounts and validate access requests',
    'users.tabPending': 'Pending',
    'users.tabActive':  'Active',
    'users.tabRejected':'Rejected',
    'users.tabAll':     'All',
    'users.colUser':    'User',
    'users.colEmail':   'Email',
    'users.colRole':    'Role',
    'users.colStatus':  'Status',
    'users.colDate':    'Date',
    'users.colActions': 'Actions',
    'users.noUsers':    'No users',
    'users.approve':    '✓ Approve',
    'users.reject':     '✕ Reject',
    'users.statusPending': 'Pending',
    'users.statusActive':  'Active',
    'users.statusRejected':'Rejected',
    'users.roleAdmin':  'Admin',
    'users.roleRespo':  'App Owner',
    'users.roleManager':'Manager',

    // ── Campaigns page ──
    'camp.newCampaign':   'New campaign',
    'camp.name':          'Campaign name *',
    'camp.namePh':        'e.g. Access Review Q1 2025 — SAP',
    'camp.description':   'Description',
    'camp.descPh':        'Objective, scope…',
    'camp.inactivityDays':'Inactivity threshold (days)',
    'camp.deadline':      'Deadline',
    'camp.sensitiveGroups':'Sensitive groups (comma-separated)',
    'camp.fileApp':       'Application extract (.xlsx) *',
    'camp.fileAD':        'Active Directory extract (.xlsx) *',
    'camp.uploadApp':     'Click to load the Application extract',
    'camp.uploadAD':      'Click to load the AD extract',
    'camp.launch':        'Start analysis',
    'camp.launching':     'Analysis in progress…',
    'camp.sendingFiles':  'Sending files…',
    'camp.analyzing':     'Python analysis in progress…',
    'camp.savingLabel':   'Saving…',
    'camp.edit':          'Edit',
    'camp.archive':       'Archive',
    'camp.unarchive':     'Unarchive',
    'camp.delete':        'Delete',
    'camp.reupload':      'Re-analyze with new files',
    'camp.reuploadBtn':   'Update files',
    'camp.saveChanges':   'Save changes',

    'camp.kpiTotal':    'Total accounts',
    'camp.kpiOrphan':   'Orphaned',
    'camp.kpiInactive': 'Inactive',
    'camp.kpiPriv':     'Privileged',
    'camp.kpiDecided':  'Decisions made',

    'camp.tabAccounts':   'Accounts',
    'camp.tabDirections': 'By department',
    'camp.tabManagers':   'By manager',
    'camp.tabMotifs':     'Motifs',

    'camp.filterAll':     'All',
    'camp.filterPending': 'Pending',
    'camp.filterOrphan':  'Orphaned',
    'camp.filterInactive':'Inactive',
    'camp.filterPriv':    'Privileged',

    'camp.notifyAll':  '✉ Notify all managers',
    'camp.export':     '⬇ Export',
    'camp.exporting':  'Exporting…',
    'camp.manager':    'Manager:',

    'camp.colUser':      'User',
    'camp.colDirection': 'Department',
    'camp.colProfile':   'Profile',
    'camp.colLogon':     'Last logon',
    'camp.colRisk':      'Risk',
    'camp.colManager':   'Manager',
    'camp.colDecision':  'Decision',
    'camp.colMotif':     'Reason',

    'camp.dirColDirection':  'Department',
    'camp.dirColTotal':      'Total',
    'camp.dirColRisks':      'Risks',
    'camp.dirColTreated':    'Reviewed',
    'camp.dirColMaintenir':  'Maintain',
    'camp.dirColRevoquer':   'Revoke',
    'camp.dirColRate':       'Rate',

    'camp.mgrColManager':   'Manager',
    'camp.mgrColEmail':     'PwC Email',
    'camp.mgrColAccounts':  'Accounts',
    'camp.mgrColRisks':     'Risks',
    'camp.mgrColTreated':   'Reviewed',
    'camp.mgrColProgress':  'Progress',
    'camp.mgrColAction':    'Action',
    'camp.mgrNotify':       '✉ Notify',

    'camp.decMaintenir':   'Maintain',
    'camp.decRevoquer':    'Revoke',
    'camp.decInvestiguer': 'Investigate',
    'camp.decPending':     'Pending',

    'camp.launched':         'Launched on',
    'camp.echeance':         'Deadline:',
    'camp.loading':          'Loading…',
    'camp.noData':           '—',
    'camp.ofTotal':          'of total',
    'camp.emailsSent':       'emails sent',
    'camp.noCampaigns':      'No campaigns.\nCreate one with the + button',
    'camp.selectCampaign':   'Select a campaign',
    'camp.selectOrCreate':   'or create a new one',
    'camp.archived':         'Archived',
    'camp.editTitle':        'Edit campaign',
    'camp.updating':         'Updating…',
    'camp.reuploadCheckbox': 'Update Excel files (re-analyze with new files)',
    'camp.reuploadWarning':  '⚠ Warning: all existing decisions will be erased.',
    'camp.bothFilesRequired':'Both files are required to re-analyze',
    'camp.newAppExtract':    'New Application extract',
    'camp.newADExtract':     'New AD extract',
    'camp.risks':            'risks',
    'camp.treated':          'reviewed',

    // ── Reviewer sidebar / dashboard ──
    'mgr.myCampaigns':   'My campaigns',
    'mgr.myProfile':     'My profile',
    'mgr.roleManager':   'Manager',
    'mgr.roleRespo':     'App Owner',
    'mgr.noAssigned':    'No campaigns assigned yet.',
    'mgr.launched':      'Launched on',
    'mgr.treated':       'reviewed',
    'mgr.risks':         'risks',
    'mgr.toReview':      'To review',
    'mgr.orphans':       'Orphaned',
    'mgr.inactive':      'Inactive',
    'mgr.privileged':    'Privileged',
    'mgr.reviewed':      'Reviewed',
    'mgr.decisionsOf':   'decisions made',
    'mgr.tabPending':    'To review',
    'mgr.tabTreated':    'Reviewed',
    'mgr.decisionMade':  'Decision made',
    'mgr.decision':      'Decision',
    'mgr.allTreated':    '✓ All accounts have been reviewed!',
    'mgr.noTreated':     'No accounts reviewed yet.',
    'mgr.cancelDecision':'Cancel',
    'mgr.newCampaign':   'New campaign assigned — ',
    'mgr.pendingAcc':    'account(s) pending decision.',
    'mgr.selectCampaign':'Select a campaign',
    'mgr.selectCampaignSub': 'Click on a campaign on the left to see accounts to review',
    'mgr.filterAll':     'All',
    'mgr.filterOrphan':  'Orphaned',
    'mgr.filterInactive':'Inactive',
    'mgr.filterPriv':    'Privileged',
    'mgr.colUser':       'User',
    'mgr.colDirection':  'Department',
    'mgr.colProfile':    'Profile',
    'mgr.colLogon':      'Last logon',
    'mgr.colRisk':       'Risk',

    // ── Profile ──
    'profile.title':      'My profile',
    'profile.firstName':  'First name',
    'profile.lastName':   'Last name',
    'profile.notifEmail': 'Notification email (PwC)',
    'profile.notifHint':  'This email will be used to notify you of new campaigns. If you change it, notifications will be sent to this new address.',
    'profile.changePassword': 'Change password',
    'profile.pwExpiry':   'Your password expires in {n} day(s)',

    // ── Risk badges ──
    'risk.orphan':        'Orphaned',
    'risk.notProvisioned':'Not Provisioned',
    'risk.multiRisk':     'Multi-risk',
    'risk.inactive':      'Inactive',
    'risk.privileged':    'Privileged',
    'risk.ok':            'OK',

    // ── Decisions ──
    'dec.maintain':       'Maintain',
    'dec.revoke':         'Revoke',
    'dec.investigate':    'Investigate',
    'dec.maintain.useCase':   'The account will be kept. A justification will be archived in the compliance report.',
    'dec.revoke.useCase':     'Access will be disabled. A revocation ticket will be sent to the IT owner.',
    'dec.investigate.useCase':'An in-depth audit will be triggered. The account will be suspended pending clarification.',
    'dec.motifPlaceholder':   'Reason required…',
    'dec.selectMotif':        'Select a reason…',

    // ── Motifs admin ──
    'admin.motifs':             'Motifs',
    'motif.title':              'Decision motifs',
    'motif.subtitle':           'Configure the justifications shown to managers for the "Maintain" decision',
    'motif.addPlaceholder':     'New motif…',
    'motif.add':                'Add',
    'motif.adding':             'Adding…',
    'motif.noMotifs':           'No motifs configured.',
    'motif.deleteConfirm':      'Delete this motif?',
    'motif.noMotifsHint':       'Add the first motif using the form above.',
    'motif.count':              'motif(s) configured',
  },
};

// ── Language Context ──────────────────────────────────────────────
export const LanguageContext = createContext(null);
export const useLang = () => useContext(LanguageContext);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'fr');

  const switchLang = (l) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  /** Translate a key. Supports {n} interpolation: t('profile.pwExpiry', { n: 5 }) */
  const t = (key, vars) => {
    let str = translations[lang]?.[key] ?? translations['fr']?.[key] ?? key;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, v);
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/** Petit bouton toggle FR | EN à placer dans les sidebars / pages */
export function LangToggle({ style }) {
  const { lang, setLang } = useLang();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderRadius: 6, overflow: 'hidden', border: '1px solid #e2e2e2', width: 'fit-content', ...style }}>
      {['fr', 'en'].map(l => (
        <button key={l} onClick={() => setLang(l)}
          style={{
            padding: '4px 10px', border: 'none', cursor: 'pointer', fontSize: 11,
            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.5px',
            background: lang === l ? 'var(--pwc-orange)' : 'transparent',
            color:      lang === l ? '#fff' : '#aaa',
            transition: 'all .15s',
          }}>
          {l}
        </button>
      ))}
    </div>
  );
}
