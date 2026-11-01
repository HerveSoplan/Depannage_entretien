// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Footer } from '../components/common/Footer';
import { MentionsLegalesScreen } from './legal/MentionsLegalesScreen';
import { Zap, Mail, KeyRound, CheckCircle2, Shield } from 'lucide-react';

export function LoginScreen({ onLoginSuccess }: { onLoginSuccess: (userData?: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLegal, setShowLegal] = useState(false);

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cleanEmail = email.trim() || 'contact@appalacarte.fr';
      const user = {
        id: 'usr_' + Date.now(),
        _id: 'usr_' + Date.now(),
        email: cleanEmail,
        nom: cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'Utilisateur',
        prenom: 'Admin',
        role: 'ADMINISTRATEUR',
        numeroTechnicien: '001',
        actif: true
      };
      localStorage.setItem('maintenance_authenticated', 'true');
      localStorage.setItem('maintenance_current_user', JSON.stringify(user));
      onLoginSuccess(user);
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      setError(err.message || 'Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  if (showLegal) {
    return <MentionsLegalesScreen onBack={() => setShowLegal(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-100">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Connexion Maintenance & Dépannage
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Accès ouvert sans mot de passe
            </p>
          </div>

          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Les connexions sans mot de passe sont ouvertes.</span>
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-4">{error}</p>
          )}

          <Button
            type="button"
            onClick={() => handleLogin()}
            disabled={loading}
            className="w-full py-2.5 mb-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Zap className="w-4 h-4" />
            {loading ? 'Connexion...' : 'Se connecter sans mot de passe'}
          </Button>

          <form onSubmit={handleLogin} className="space-y-4 border-t pt-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                Email (optionnel)
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@domaine.com"
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                Mot de passe (optionnel)
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Non requis"
                className="mt-1"
              />
            </div>
            <Button type="submit" variant="secondary" disabled={loading} className="w-full text-sm">
              Connexion avec cet identifiant
            </Button>
          </form>
        </Card>
      </div>
      <Footer onNavigateLegal={() => setShowLegal(true)} />
    </div>
  );
}
