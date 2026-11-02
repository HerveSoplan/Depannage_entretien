import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Footer } from '../common/Footer';
import { MentionsLegalesScreen } from '../../screens/legal/MentionsLegalesScreen';
import {
  Wrench,
  Mail,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  User,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import {
  auth,
  validatePassword,
  passwordRules,
  passwordErrorMessage,
  generateTemporaryPassword,
  getPasswordRequestEmail
} from '../../lib/supabase';
import { APP_NAME, APP_VERSION } from '../../version';

interface LoginScreenProps {
  onLoginSuccess: (userData?: any) => void;
  onNavigateLegal?: () => void;
  onContinueToApp?: () => void;
  currentUser?: any;
}

export function LoginScreen({
  onLoginSuccess,
  onNavigateLegal,
  onContinueToApp,
  currentUser
}: LoginScreenProps) {
  // Onglet / mode actif : 'login' | 'demande' | 'forgot_password' | 'change_password'
  const [activeTab, setActiveTab] = useState<'login' | 'demande' | 'forgot_password' | 'change_password'>('login');

  // Champs Connexion
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showLegal, setShowLegal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [passwordRequestEmail, setPasswordRequestEmail] = useState<string>(() => getPasswordRequestEmail());

  // Champs Changement obligatoire de mot de passe (première connexion ou réinitialisation)
  const [targetUserForPasswordChange, setTargetUserForPasswordChange] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Champs Mot de passe oublié
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [forgotTemporaryPassword, setForgotTemporaryPassword] = useState<string | null>(null);

  // Champs Demande d'accès
  const [demandeEmail, setDemandeEmail] = useState('');
  const [demandeNom, setDemandeNom] = useState('');
  const [demandePrenom, setDemandePrenom] = useState('');
  const [demandeTelephone, setDemandeTelephone] = useState('');
  const [demandeRole, setDemandeRole] = useState('TECHNICIEN_CMS');
  const [demandeMotif, setDemandeMotif] = useState('');
  const [demandeSuccessData, setDemandeSuccessData] = useState<any>(null);

  // Détection des paramètres d'URL (invitation, reset, etc.)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash || '';
        const action = params.get('action');
        const inviteEmail = params.get('email');
        const inviteNom = params.get('nom');
        const invitePrenom = params.get('prenom');
        const isRecovery = params.get('type') === 'recovery' || hash.includes('type=recovery');

        if (inviteEmail) {
          setEmail(inviteEmail);
          setDemandeEmail(inviteEmail);
          setForgotEmail(inviteEmail);
        }
        if (inviteNom) setDemandeNom(inviteNom);
        if (invitePrenom) setDemandePrenom(invitePrenom);

        if (isRecovery) {
          setActiveTab('change_password');
        } else if (action === 'demande' || params.get('demande') === 'true' || params.get('invite')) {
          setActiveTab('demande');
        } else if (action === 'forgot' || params.get('forgot') === 'true') {
          setActiveTab('forgot_password');
        }

        setPasswordRequestEmail(getPasswordRequestEmail());
      }
    } catch (e) {
      console.warn('Erreur lecture paramètres URL:', e);
    }
  }, []);

  // Copie d'un texte dans le presse-papier avec confirmation visuelle
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      alert(`Texte à copier :\n\n${text}`);
    }
  };

  // Connexion simplifiée par email et mot de passe (AUCUN accès sans mot de passe)
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail) {
      setError('Veuillez renseigner votre adresse email.');
      setLoading(false);
      return;
    }

    if (!cleanPassword) {
      setError('Le mot de passe est obligatoire pour vous connecter. Aucun accès n’est autorisé sans mot de passe.');
      setLoading(false);
      return;
    }

    try {
      const res: any = await auth.signIn(cleanEmail, cleanPassword);

      // Si mot de passe temporaire ou changement de mot de passe obligatoire requis
      if (res?.requirePasswordChange) {
        setTargetUserForPasswordChange(res.user);
        setActiveTab('change_password');
        setError(null);
        setErrorCode(null);
        return;
      }

      if (res?.user) {
        sessionStorage.removeItem('pending_auth_email');
        onLoginSuccess(res.user);
      } else {
        setError('Impossible de se connecter. Veuillez vérifier vos identifiants.');
      }
    } catch (err: any) {
      console.error('Erreur connexion:', err);
      setError(err?.message || 'Erreur lors de la connexion.');
      if (err?.code) {
        setErrorCode(err.code);
      }
    } finally {
      setLoading(false);
    }
  };

  // Soumission du nouveau mot de passe obligatoire
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!newPassword) {
      setError('Veuillez saisir votre nouveau mot de passe.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      setError(validation.errors[0] || 'Le mot de passe ne respecte pas les critères de sécurité.');
      setLoading(false);
      return;
    }

    try {
      const targetUser = targetUserForPasswordChange || email;
      const res = await auth.updatePassword(newPassword, targetUser);
      setPasswordChangeSuccess(true);

      setTimeout(() => {
        sessionStorage.removeItem('pending_auth_email');
        onLoginSuccess(res.user);
      }, 1200);
    } catch (err: any) {
      console.error('Erreur mise à jour mot de passe:', err);
      setError(passwordErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Soumission mot de passe oublié
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setForgotSuccessMessage(null);
    setForgotTemporaryPassword(null);

    const clean = forgotEmail.trim().toLowerCase();
    if (!clean) {
      setError('Veuillez renseigner votre adresse email.');
      setLoading(false);
      return;
    }

    try {
      const res = await auth.resetPasswordForEmail(clean);
      setForgotSuccessMessage(res.message);
      if (res.tempPassword) {
        setForgotTemporaryPassword(res.tempPassword);
      }
    } catch (err: any) {
      console.error('Erreur mot de passe oublié:', err);
      setError(err?.message || 'Erreur lors de la réinitialisation.');
    } finally {
      setLoading(false);
    }
  };

  // Soumission de la demande d'accès
  const handleSubmitDemande = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);

    const cleanEmail = demandeEmail.trim().toLowerCase();
    const cleanNom = demandeNom.trim();
    const cleanPrenom = demandePrenom.trim();

    if (!cleanEmail || !cleanNom || !cleanPrenom) {
      setError('Veuillez remplir votre nom, prénom et adresse email.');
      setLoading(false);
      return;
    }

    try {
      const res = await auth.requestAccess({
        email: cleanEmail,
        nom: cleanNom,
        prenom: cleanPrenom,
        telephone: demandeTelephone,
        role: demandeRole,
        motifDemande: demandeMotif
      });

      setDemandeSuccessData({
        email: cleanEmail,
        nom: cleanNom,
        prenom: cleanPrenom,
        message: res.message,
        status: res.status
      });
    } catch (err: any) {
      console.error('Erreur demande accès:', err);
      setError(err?.message || "Erreur lors de l'enregistrement de votre demande.");
    } finally {
      setLoading(false);
    }
  };

  if (showLegal) {
    return <MentionsLegalesScreen onBack={() => setShowLegal(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col justify-between">
      <div className="flex-1 flex items-center justify-center p-4 py-8 sm:py-12">
        <Card className="w-full max-w-md shadow-xl border-blue-100 bg-white/95 backdrop-blur-sm p-6 sm:p-8">
          {/* Logo et titre épurés */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-13 h-13 bg-blue-600 text-white rounded-2xl shadow-md mb-3 p-3">
              <Wrench className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {APP_NAME}
            </h1>
            <span className="inline-block text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1.5">
              v{APP_VERSION}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Portail professionnel — Accès sécurisé
            </p>
          </div>

          {/* Bandeau session active si l'utilisateur est déjà connecté */}
          {currentUser && (
            <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-blue-900 shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0 animate-pulse" />
                <span className="truncate">
                  Connecté : <strong>{currentUser.prenom} {currentUser.nom}</strong>
                </span>
              </div>
              {onContinueToApp && (
                <button
                  type="button"
                  onClick={onContinueToApp}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs whitespace-nowrap shadow-sm transition-colors"
                >
                  Accéder à l'application →
                </button>
              )}
            </div>
          )}

          {/* Deux onglets clairs : Connexion / Demande d'accès */}
          {!demandeSuccessData && activeTab !== 'change_password' && activeTab !== 'forgot_password' && (
            <div className="flex rounded-xl bg-gray-100 p-1 mb-5 border border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                  setErrorCode(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'login'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Se connecter</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('demande');
                  setError(null);
                  setErrorCode(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'demande'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Demande d'accès</span>
              </button>
            </div>
          )}

          {/* Messages d'erreur et alertes contextuelles */}
          {error && (
            <div className="mb-4">
              {errorCode === 'USER_PENDING' ? (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Demande en attente de validation</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    Votre compte a été enregistré et est en cours d'approbation par l'administrateur ou le responsable technique.
                  </p>
                </div>
              ) : errorCode === 'USER_NOT_FOUND' ? (
                <div className="p-3.5 bg-blue-50 border border-blue-300 rounded-xl text-blue-900 text-xs space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-blue-950">
                    <UserPlus className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Adresse non enregistrée</span>
                  </div>
                  <p className="text-blue-800">
                    Cette adresse email n'est pas encore enregistrée. Formulez votre demande d'accès en un clic :
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDemandeEmail(email);
                      setActiveTab('demande');
                      setError(null);
                    }}
                    className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Faire ma demande d'accès avec cet email</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* ================= ÉCRAN 1 : CHANGEMENT OBLIGATOIRE DE MOT DE PASSE ================= */}
          {activeTab === 'change_password' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-amber-600 text-white rounded-lg flex-shrink-0 mt-0.5">
                  <Lock size={18} />
                </div>
                <div className="text-xs text-amber-950 space-y-1">
                  <h3 className="font-bold text-sm text-amber-900">
                    Changement obligatoire du mot de passe
                  </h3>
                  <p className="text-amber-800 leading-relaxed">
                    {targetUserForPasswordChange?.prenom ? (
                      <>Bienvenue <strong>{targetUserForPasswordChange.prenom}</strong> ! </>
                    ) : null}
                    Pour votre sécurité, veuillez remplacer votre mot de passe temporaire par votre mot de passe personnel définitif avant d'accéder à l'application.
                  </p>
                </div>
              </div>

              {passwordChangeSuccess ? (
                <div className="p-5 bg-green-50 border border-green-200 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                  <h4 className="font-bold text-gray-900 text-sm">Mot de passe enregistré avec succès !</h4>
                  <p className="text-xs text-gray-600">
                    Votre nouveau mot de passe est actif. Accès à l'application en cours...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                      Nouveau mot de passe personnel *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nouveau mot de passe"
                        className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                        aria-label={showNewPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wider">
                      Confirmer le nouveau mot de passe *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirmer mot de passe"
                        className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                        aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Checklist dynamique de sécurité */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
                    <p className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                      Critères de sécurité requis :
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                      {passwordRules.map((rule) => {
                        const passed = rule.test(newPassword);
                        return (
                          <div
                            key={rule.id}
                            className={`flex items-center gap-1.5 ${
                              passed ? 'text-green-700 font-medium' : 'text-slate-500'
                            }`}
                          >
                            <span className="text-xs">{passed ? '✓' : '○'}</span>
                            <span>{rule.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <Button
                      type="submit"
                      disabled={loading || !newPassword || !confirmPassword}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md"
                    >
                      <CheckCircle2 size={16} />
                      <span>{loading ? 'Enregistrement...' : 'Enregistrer et accéder à l’application'}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setActiveTab('login');
                        setError(null);
                      }}
                      className="text-xs"
                    >
                      Annuler
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : activeTab === 'forgot_password' ? (
            /* ================= ÉCRAN 2 : MOT DE PASSE OUBLIÉ ================= */
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                  }}
                  className="p-1 text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Mot de passe oublié</h3>
                  <p className="text-xs text-gray-500">
                    Réinitialisez votre mot de passe temporaire
                  </p>
                </div>
              </div>

              {forgotSuccessMessage ? (
                <div className="space-y-3.5">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2.5 text-xs text-green-900">
                    <div className="flex items-center gap-2 font-bold text-green-950 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span>Réinitialisation réussie</span>
                    </div>
                    <p className="leading-relaxed">{forgotSuccessMessage}</p>

                    {forgotTemporaryPassword && (
                      <div className="p-3 bg-white border border-green-300 rounded-lg space-y-2 mt-2 shadow-xs">
                        <span className="text-gray-700 font-semibold block text-[11px]">
                          Votre mot de passe temporaire a été réactivé :
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                            {forgotTemporaryPassword}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(forgotTemporaryPassword, 'forgot-temp')}
                            className="text-[11px] text-blue-600 font-semibold underline flex items-center gap-1"
                          >
                            {copiedKey === 'forgot-temp' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                            <span>{copiedKey === 'forgot-temp' ? 'Copié !' : 'Copier'}</span>
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500 italic pt-0.5">
                          Règle : votre prénom en minuscule suivi de 2027. Connectez-vous avec ce mot de passe temporaire, l'application vous demandera immédiatement de définir votre mot de passe personnel définitif.
                        </p>
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      setEmail(forgotEmail);
                      if (forgotTemporaryPassword) {
                        setPassword(forgotTemporaryPassword);
                      }
                      setActiveTab('login');
                      setForgotSuccessMessage(null);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md"
                  >
                    <span>Se connecter avec le mot de passe temporaire</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Saisissez votre adresse email professionnelle. Votre mot de passe temporaire (prénom suivi de 2027) sera réactivé pour vous permettre de vous connecter et de choisir immédiatement votre nouveau mot de passe personnel.
                  </p>

                  {/* Encadré contact officiel pour demande de nouveau mot de passe */}
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5 text-xs text-blue-950">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900">
                      <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span>Contact officiel pour demande de mot de passe :</span>
                    </div>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Vous pouvez également adresser directement votre demande à l'administrateur technique :
                    </p>
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-blue-200">
                      <a
                        href={`mailto:${passwordRequestEmail}?subject=Demande%20de%20nouveau%20mot%20de%20passe%20-%20D%C3%A9pannage_entretien`}
                        className="font-mono font-bold text-blue-700 hover:underline"
                      >
                        {passwordRequestEmail}
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(passwordRequestEmail, 'forgot-contact-email')}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                      >
                        {copiedKey === 'forgot-contact-email' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                        <span>{copiedKey === 'forgot-contact-email' ? 'Copié !' : 'Copier'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                      Votre adresse email *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                      <Input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="technicien@entreprise.fr"
                        className="pl-9 text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <Button
                      type="submit"
                      disabled={loading || !forgotEmail.trim()}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md"
                    >
                      <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                      <span>{loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setActiveTab('login');
                        setError(null);
                      }}
                      className="text-xs"
                    >
                      Retour
                    </Button>
                  </div>
                </form>
              )}
            </div>
          ) : demandeSuccessData ? (
            /* ================= ÉCRAN 3 : CONFIRMATION DEMANDE D'ACCÈS ================= */
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Demande d'accès enregistrée
                </h3>
                <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto leading-relaxed">
                  Votre demande pour <strong className="text-gray-900">{demandeSuccessData.email}</strong> ({demandeSuccessData.prenom} {demandeSuccessData.nom}) a été transmise.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5 text-slate-700">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Validation et mot de passe temporaire</span>
                </div>
                <p className="leading-relaxed">
                  L'administrateur (<span className="text-blue-600 font-medium">contact@appalacarte.fr</span>) ou votre responsable technique valide chaque accès. Votre mot de passe temporaire initial sera <strong>votre prénom en minuscule suivi de 2027</strong> (ex : <span className="font-mono text-blue-700">{generateTemporaryPassword(demandeSuccessData.prenom)}</span>).
                </p>
              </div>

              <Button
                type="button"
                onClick={() => {
                  setDemandeSuccessData(null);
                  setActiveTab('login');
                  setEmail(demandeSuccessData.email);
                }}
                className="w-full py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <span>Retour à l'écran de connexion</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : activeTab === 'login' ? (
            /* ================= ÉCRAN 4 : FORMULAIRE DE CONNEXION SIMPLIFIÉ ================= */
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Adresse email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="technicien@entreprise.fr"
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mot de passe *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setActiveTab('forgot_password');
                      setError(null);
                    }}
                    className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe ou prénom2027"
                    className="w-full pl-9 pr-10 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5"
                    aria-label={showLoginPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                  Première connexion ? Utilisez votre mot de passe temporaire : <em>votre prénom en minuscule suivi de 2027</em> (ex : <span className="font-mono font-semibold text-blue-600">{generateTemporaryPassword(email ? email.split('@')[0].split('.')[0] : 'thomas')}</span>).
                </p>
              </div>

              <div className="pt-1">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 text-sm font-semibold shadow-md bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Note de sécurité stricte : aucun accès sans mot de passe */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 text-center flex items-center justify-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span>Accès strictement protégé par mot de passe (temporaire ou personnel).</span>
              </div>

              {/* Email de demande de nouveau mot de passe (paramétrable depuis DatabaseAdminScreen) */}
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-center space-y-1 shadow-xs">
                <div className="flex items-center justify-center gap-1.5 text-xs text-blue-900 font-semibold">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Demande de nouveau mot de passe :</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <a
                    href={`mailto:${passwordRequestEmail}?subject=Demande%20de%20nouveau%20mot%20de%20passe%20-%20D%C3%A9pannage_entretien`}
                    className="text-xs font-bold text-blue-700 hover:text-blue-900 underline"
                  >
                    {passwordRequestEmail}
                  </a>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(passwordRequestEmail, 'login-contact-email')}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-0.5"
                    title="Copier l'adresse email"
                  >
                    {copiedKey === 'login-contact-email' ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                    <span>{copiedKey === 'login-contact-email' ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-500">
                  Contactez cette adresse pour toute demande d'assistance ou de nouveau mot de passe
                </p>
              </div>

              {/* Lien vers la demande d'accès */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('demande');
                    setError(null);
                  }}
                  className="text-xs text-gray-500 hover:text-blue-600 font-medium transition-colors"
                >
                  Vous n'avez pas encore d'accès ?{' '}
                  <span className="text-blue-600 underline font-semibold">
                    Faire une demande de connexion
                  </span>
                </button>
              </div>
            </form>
          ) : (
            /* ================= ÉCRAN 5 : FORMULAIRE DEMANDE D'ACCÈS ================= */
            <form onSubmit={handleSubmitDemande} className="space-y-3.5">
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-800 leading-relaxed mb-1">
                <strong>Demande d'accès technicien :</strong> Renseignez votre identité. Dès validation par l'administrateur ou le responsable technique, votre mot de passe temporaire sera <strong>votre prénom en minuscule suivi de 2027</strong>.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Prénom *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                    <Input
                      type="text"
                      required
                      value={demandePrenom}
                      onChange={(e) => setDemandePrenom(e.target.value)}
                      placeholder="Thomas"
                      className="pl-8 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nom *
                  </label>
                  <Input
                    type="text"
                    required
                    value={demandeNom}
                    onChange={(e) => setDemandeNom(e.target.value)}
                    placeholder="DUPONT"
                    className="text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Adresse email professionnelle *
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <Input
                    type="email"
                    required
                    value={demandeEmail}
                    onChange={(e) => setDemandeEmail(e.target.value)}
                    placeholder="thomas.dupont@entreprise.fr"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rôle / Spécialité souhaitée
                </label>
                <select
                  value={demandeRole}
                  onChange={(e) => setDemandeRole(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-lg border border-gray-300 py-2 px-2.5 bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="TECHNICIEN_CMS">Technicien CMS</option>
                  <option value="TECHNICIEN_VMS">Technicien VMS</option>
                  <option value="CHEF_TECHNICIEN_CMS">Chef Technicien CMS</option>
                  <option value="CHEF_TECHNICIEN_VMS">Chef Technicien VMS</option>
                  <option value="RESPONSABLE_TECHNIQUE">Responsable Technique</option>
                  <option value="RESPONSABLE">Responsable / Supérieur</option>
                  <option value="CHEF_MONTEUR">Chef Monteur</option>
                  <option value="MONTEUR">Monteur</option>
                  <option value="MAGASINIER">Magasinier</option>
                  <option value="CLIENT">Client / Exploitant</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Motif de la demande ou Société (optionnel)
                </label>
                <Input
                  type="text"
                  value={demandeMotif}
                  onChange={(e) => setDemandeMotif(e.target.value)}
                  placeholder="Ex : Équipe Maintenance Ouest..."
                  className="text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 mt-2"
              >
                <span>{loading ? 'Envoi en cours...' : "Envoyer ma demande d'accès"}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                  }}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Déjà un compte ? Retour à la connexion
                </button>
              </div>
            </form>
          )}
        </Card>
      </div>

      {/* Footer réglementaire visible hors connexion */}
      <Footer onNavigateLegal={() => (onNavigateLegal ? onNavigateLegal() : setShowLegal(true))} />
    </div>
  );
}
