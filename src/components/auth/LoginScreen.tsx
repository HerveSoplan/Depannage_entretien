import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Footer } from '../common/Footer';
import { MentionsLegalesScreen } from '../../screens/legal/MentionsLegalesScreen';
import { Shield, Wrench, User, Zap, Mail, KeyRound, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (userData?: any) => void;
}

const PRESET_PROFILES = [
  {
    id: 'user_admin',
    _id: 'user_admin',
    nom: 'CHAMPAGNE',
    prenom: 'Hervé',
    email: 'herve@appalacarte.fr',
    role: 'ADMINISTRATEUR',
    numeroTechnicien: '001',
    label: 'Administrateur',
    description: 'Accès complet et gestion du système',
    icon: Shield,
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
  },
  {
    id: 'user_resp',
    _id: 'user_resp',
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'resp.technique@appalacarte.fr',
    role: 'RESPONSABLE_TECHNIQUE',
    numeroTechnicien: '002',
    label: 'Responsable Technique',
    description: 'Supervision technique & validation',
    icon: Wrench,
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    id: 'user_cms',
    _id: 'user_cms',
    nom: 'Martin',
    prenom: 'Marc',
    email: 'tech.cms@appalacarte.fr',
    role: 'TECHNICIEN_CMS',
    numeroTechnicien: '010',
    label: 'Technicien CMS',
    description: 'Interventions CMS & protocoles',
    icon: User,
    color: 'text-teal-600 bg-teal-50 border-teal-200'
  },
  {
    id: 'user_vms',
    _id: 'user_vms',
    nom: 'Durand',
    prenom: 'Pierre',
    email: 'tech.vms@appalacarte.fr',
    role: 'TECHNICIEN_VMS',
    numeroTechnicien: '020',
    label: 'Technicien VMS',
    description: 'Interventions VMS & maintenance',
    icon: User,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200'
  }
];

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLegal, setShowLegal] = useState(false);

  const connectWithUser = (user: any) => {
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem('maintenance_authenticated', 'true');
      localStorage.setItem('maintenance_current_user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Erreur connexion:', err);
      setError('Erreur lors de la connexion. Veuillez réessayer.');
      setLoading(false);
    }
  };

  const handleQuickConnect = () => {
    connectWithUser(PRESET_PROFILES[0]);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim() || 'utilisateur@appalacarte.fr';
    const customUser = {
      id: 'usr_' + Date.now(),
      _id: 'usr_' + Date.now(),
      nom: cleanEmail.split('@')[0],
      prenom: 'Utilisateur',
      email: cleanEmail,
      role: 'ADMINISTRATEUR',
      numeroTechnicien: '099',
      actif: true
    };
    connectWithUser(customUser);
  };

  if (showLegal) {
    return <MentionsLegalesScreen onBack={() => setShowLegal(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 flex flex-col justify-between">
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <Card className="w-full max-w-lg shadow-xl border-blue-100 bg-white/95 backdrop-blur-sm p-6 sm:p-8">
          {/* Logo et en-tête */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-md mb-3">
              <Wrench className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Maintenance & Dépannage
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Plateforme professionnelle de maintenance et d'interventions
            </p>
          </div>

          {/* Bandeau d'information Mode sans mot de passe */}
          <div className="mb-6 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 leading-relaxed">
              <strong className="font-semibold block text-emerald-800">
                Connexion sans mot de passe ouverte
              </strong>
              L'accès à l'application est ouvert directement sans mot de passe. Vous pouvez vous connecter en 1 clic ci-dessous.
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Bouton principal : Connexion instantanée */}
          <Button
            type="button"
            onClick={handleQuickConnect}
            disabled={loading}
            className="w-full py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-5 h-5" />
            {loading ? 'Connexion en cours...' : 'Accès instantané sans mot de passe'}
          </Button>

          {/* Sélecteur de profils rapides */}
          <div className="my-6">
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-xs uppercase tracking-wider text-gray-400 font-medium">
                Ou choisissez un profil
              </span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
              {PRESET_PROFILES.map((profile) => {
                const Icon = profile.icon;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => connectWithUser(profile)}
                    disabled={loading}
                    className="p-3 text-left border rounded-xl hover:border-blue-400 hover:bg-blue-50/50 transition-all group flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className={`p-1.5 rounded-lg border ${profile.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="font-semibold text-xs text-gray-900 group-hover:text-blue-600">
                        {profile.label}
                      </div>
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">
                      {profile.prenom} {profile.nom}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connexion avec email libre */}
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-medium text-gray-700 mb-3">
              Ou connectez-vous avec votre adresse email :
            </p>
            <form onSubmit={handleCustomSubmit} className="space-y-3">
              <div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre.email@domaine.com"
                    className="pl-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mot de passe (optionnel)"
                    className="pl-9 text-sm text-gray-400"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-1 pl-1">
                  Non requis : aucun mot de passe n'est exigé actuellement.
                </p>
              </div>

              <Button
                type="submit"
                variant="secondary"
                disabled={loading}
                className="w-full text-sm font-medium mt-1"
              >
                Se connecter avec cet email
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Footer réglementaire visible hors connexion */}
      <Footer onNavigateLegal={() => setShowLegal(true)} />
    </div>
  );
}
