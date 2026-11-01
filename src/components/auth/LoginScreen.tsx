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
  UserPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  User,
  Phone,
  FileQuestion,
  HelpCircle
} from 'lucide-react';
import { auth, isLiveSupabaseActive } from '../../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (userData?: any) => void;
  onNavigateLegal?: () => void;
}

export function LoginScreen({ onLoginSuccess, onNavigateLegal }: LoginScreenProps) {
  // Mode : 'login' | 'demande' | 'success_demande'
  const [activeTab, setActiveTab] = useState<'login' | 'demande'>('login');
  
  // Champs Connexion
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showLegal, setShowLegal] = useState(false);

  // Champs Demande d'accès
  const [demandeEmail, setDemandeEmail] = useState('');
  const [demandeNom, setDemandeNom] = useState('');
  const [demandePrenom, setDemandePrenom] = useState('');
  const [demandeTelephone, setDemandeTelephone] = useState('');
  const [demandeRole, setDemandeRole] = useState('TECHNICIEN_CMS');
  const [demandeMotif, setDemandeMotif] = useState('');
  const [demandeSuccessData, setDemandeSuccessData] = useState<any>(null);

  // Détection des paramètres d'URL (liens d'invitation ou accès partagé)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        const inviteEmail = params.get('email');
        const inviteNom = params.get('nom');
        const invitePrenom = params.get('prenom');

        if (inviteEmail) {
          setEmail(inviteEmail);
          setDemandeEmail(inviteEmail);
        }
        if (inviteNom) setDemandeNom(inviteNom);
        if (invitePrenom) setDemandePrenom(invitePrenom);

        if (action === 'demande' || params.get('demande') === 'true' || params.get('invite')) {
          setActiveTab('demande');
        }
      }
    } catch (e) {
      console.warn('Erreur lecture paramètres URL:', e);
    }
  }, []);

  // Soumission Connexion
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Veuillez renseigner votre adresse email.');
      setLoading(false);
      return;
    }

    try {
      const res = await auth.signIn(cleanEmail, password || undefined);
      if (res?.user) {
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

  // Soumission Demande d'accès
  const handleSubmitDemande = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorCode(null);

    const cleanEmail = demandeEmail.trim();
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
      setError(err?.message || 'Erreur lors de l\'enregistrement de votre demande.');
    } finally {
      setLoading(false);
    }
  };

  // Connexion directe Administrateur maître
  const handleQuickAdmin = async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);
    try {
      const res = await auth.signIn('contact@appalacarte.fr');
      if (res?.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError('Erreur lors de la connexion administrateur.');
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
        <Card className="w-full max-w-lg shadow-xl border-blue-100 bg-white/95 backdrop-blur-sm p-6 sm:p-8">
          {/* Logo et en-tête */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-md mb-3">
              <Wrench className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Maintenance & Dépannage
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Portail professionnel certifié — Gestion des interventions & maintenance
            </p>
          </div>

          {/* Onglets de sélection : Connexion / Demande d'accès */}
          {!demandeSuccessData && (
            <div className="flex rounded-xl bg-gray-100 p-1 mb-6 border border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setError(null);
                  setErrorCode(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
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
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
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
            <div className="mb-5">
              {errorCode === 'USER_PENDING' ? (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-sm space-y-2 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <span>Demande en attente de validation</span>
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    Votre demande de connexion a bien été enregistrée pour votre adresse email. Elle est actuellement examinée par l'administrateur ou le responsable technique.
                  </p>
                  <p className="text-xs text-amber-700 italic">
                    Dès que votre accès sera validé, vous pourrez vous connecter immédiatement.
                  </p>
                </div>
              ) : errorCode === 'USER_NOT_FOUND' ? (
                <div className="p-4 bg-blue-50 border border-blue-300 rounded-xl text-blue-900 text-sm space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-blue-950">
                    <UserPlus className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span>Adresse non enregistrée</span>
                  </div>
                  <p className="text-xs text-blue-800">
                    Cette adresse email n'est pas encore enregistrée dans l'application. Formulez votre demande d'accès en un instant :
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
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* Écran de confirmation de demande d'accès réussie */}
          {demandeSuccessData ? (
            <div className="space-y-5 text-center py-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Demande d'accès enregistrée !
                </h3>
                <p className="text-xs text-gray-600 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Votre demande de connexion pour <strong className="text-gray-900">{demandeSuccessData.email}</strong> ({demandeSuccessData.prenom} {demandeSuccessData.nom}) a bien été transmise.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-2 text-slate-700">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Prochaine étape : Validation technique</span>
                </div>
                <p className="leading-relaxed">
                  L'administrateur (<span className="text-blue-600 font-medium">contact@appalacarte.fr</span>) ou le responsable technique valide chaque demande pour attribuer les droits d'accès correspondants (technicien, monteur, responsable).
                </p>
                <p className="text-gray-500">
                  Une fois approuvée, vous pourrez vous connecter directement avec votre adresse email.
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
            /* ================= FORMULAIRE DE CONNEXION ================= */
            <form onSubmit={handleSubmitLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@domaine.fr"
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Mot de passe
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Optionnel en mode démo / requis si configuré
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 mt-2"
              >
                <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              {/* Raccourci vers la demande d'accès */}
              <div className="pt-2 text-center">
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

              {/* Accès administrateur de référence */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickAdmin}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-all shadow-sm"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Accès direct Administrateur (contact@appalacarte.fr)</span>
                </button>
                <p className="text-[11px] text-gray-400">
                  Compte administrateur certifié — Accès complet et validation des utilisateurs
                </p>
              </div>
            </form>
          ) : (
            /* ================= FORMULAIRE DEMANDE D'ACCÈS ================= */
            <form onSubmit={handleSubmitDemande} className="space-y-3.5">
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-800 leading-relaxed mb-1">
                <strong>Demande unique de connexion :</strong> Renseignez votre identité et votre email. Votre compte sera validé par l'administrateur ou le responsable technique avant votre première connexion.
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
                      placeholder="Jean"
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
                    placeholder="jean.dupont@entreprise.fr"
                    className="pl-8 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    Téléphone (optionnel)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                    <Input
                      type="tel"
                      value={demandeTelephone}
                      onChange={(e) => setDemandeTelephone(e.target.value)}
                      placeholder="06 00 00 00 00"
                      className="pl-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Motif de la demande ou Société (optionnel)
                </label>
                <Input
                  type="text"
                  value={demandeMotif}
                  onChange={(e) => setDemandeMotif(e.target.value)}
                  placeholder="Ex : Équipe Maintenance Ouest, nouveau technicien..."
                  className="text-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 mt-3"
              >
                <span>{loading ? 'Envoi en cours...' : 'Envoyer ma demande d\'accès'}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setError(null);
                  }}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  Déjà validé(e) ? Retour à la connexion
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
