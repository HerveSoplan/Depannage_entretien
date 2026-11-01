import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';
import { Footer } from '../common/Footer';
import { MentionsLegalesScreen } from '../../screens/legal/MentionsLegalesScreen';
import { Wrench, Mail, KeyRound, ArrowRight } from 'lucide-react';
import { auth, isLiveSupabaseActive } from '../../lib/supabase';

interface LoginScreenProps {
  onLoginSuccess: (userData?: any) => void;
  onNavigateLegal?: () => void;
}

export function LoginScreen({ onLoginSuccess, onNavigateLegal }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLegal, setShowLegal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auth.signIn('contact@appalacarte.fr');
      if (res?.user) {
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError('Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  if (showLegal) {
    return <MentionsLegalesScreen onBack={() => setShowLegal(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col justify-between">
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md shadow-xl border-blue-100 bg-white/95 backdrop-blur-sm p-6 sm:p-8">
          {/* Logo et en-tête */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 text-white rounded-2xl shadow-md mb-3">
              <Wrench className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Maintenance & Dépannage
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Portail professionnel de gestion d'interventions
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Formulaire de connexion standard */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder="contact@appalacarte.fr"
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Mot de passe
              </label>
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
          </form>

          {/* Accès rapide administrateur */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={handleQuickAdmin}
              disabled={loading}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              Accès direct Administrateur (contact@appalacarte.fr)
            </button>
          </div>
        </Card>
      </div>

      {/* Footer réglementaire visible hors connexion */}
      <Footer onNavigateLegal={() => (onNavigateLegal ? onNavigateLegal() : setShowLegal(true))} />
    </div>
  );
}
