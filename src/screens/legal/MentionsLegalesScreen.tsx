import React from 'react';
import { ArrowLeft, ShieldCheck, Mail, Building, Server, Globe } from 'lucide-react';
import { APP_VERSION, APP_NAME } from '../../version';
import { Footer } from '../../components/common/Footer';

interface MentionsLegalesScreenProps {
  onBack?: () => void;
}

export function MentionsLegalesScreen({ onBack }: MentionsLegalesScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto px-4 py-8 w-full">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                window.history.back();
              }
            }}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </button>
          <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2.5 py-1 rounded-full">
            Version {APP_VERSION}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-blue-600 px-6 py-8 text-white">
            <h1 className="text-2xl font-bold mb-2">Mentions Légales</h1>
            <p className="text-blue-100 text-sm">
              Conformément aux dispositions des articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l'économie numérique (LCEN).
            </p>
          </div>

          <div className="p-6 md:p-8 space-y-8 text-gray-700 text-sm leading-relaxed">
            {/* 1. Éditeur de l'application */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b pb-2">
                <Building className="w-5 h-5 text-blue-600" />
                <h2>1. Éditeur de l'application</h2>
              </div>
              <ul className="space-y-1.5 pl-2">
                <li><strong className="text-gray-900">Nom commercial :</strong> App à la Carte</li>
                <li><strong className="text-gray-900">Entrepreneur individuel :</strong> Hervé CHAMPAGNE</li>
                <li><strong className="text-gray-900">Forme juridique :</strong> Entrepreneur individuel (EI)</li>
                <li><strong className="text-gray-900">SIREN :</strong> 132 021 098</li>
                <li><strong className="text-gray-900">SIRET :</strong> 132 021 098 00018</li>
                <li><strong className="text-gray-900">Immatriculation RNE :</strong> 26 octobre 2026 (Début d'activité : 21/10/2026)</li>
                <li><strong className="text-gray-900">Code APE / NAF :</strong> 6201Z — Programmation informatique</li>
                <li><strong className="text-gray-900">Adresse professionnelle :</strong> 173 rue de Courcelles, 75017 Paris, France</li>
                <li><strong className="text-gray-900">Société de domiciliation :</strong> HelloDom (SIREN : 878 831 312)</li>
                <li><strong className="text-gray-900">Directeur de la publication :</strong> Hervé CHAMPAGNE (EI)</li>
                <li><strong className="text-gray-900">Email de contact :</strong> <a href="mailto:contact@appalacarte.fr" className="text-blue-600 underline">contact@appalacarte.fr</a></li>
              </ul>
            </section>

            {/* 2. Régime Fiscal et TVA */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b pb-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h2>2. Régime Fiscal et TVA</h2>
              </div>
              <ul className="space-y-1.5 pl-2">
                <li><strong className="text-gray-900">Régime fiscal :</strong> Micro-BIC (Franchise en base de TVA)</li>
                <li><strong className="text-gray-900">Mention obligatoire TVA :</strong> « TVA non applicable, article 293 B du CGI »</li>
                <li><strong className="text-gray-900">Régime social :</strong> Micro-social simplifié (versement trimestriel)</li>
              </ul>
            </section>

            {/* 3. Hébergement */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b pb-2">
                <Server className="w-5 h-5 text-blue-600" />
                <h2>3. Hébergement & Infrastructure</h2>
              </div>
              <ul className="space-y-1.5 pl-2">
                <li><strong className="text-gray-900">Hébergeur de l'application :</strong> Vercel Inc.</li>
                <li><strong className="text-gray-900">Adresse de l'hébergeur :</strong> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
                <li><strong className="text-gray-900">Site internet de l'hébergeur :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">vercel.com</a></li>
                <li><strong className="text-gray-900">Gestion de domaine / DNS :</strong> OVHcloud (OVH SAS, 2 rue Kellermann, 59100 Roubaix, France)</li>
              </ul>
            </section>

            {/* 4. Propriété intellectuelle */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-base font-semibold text-gray-900 border-b pb-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2>4. Propriété intellectuelle et Protection des données</h2>
              </div>
              <p>
                L'ensemble des contenus, marques, logos, graphismes et logiciels composant l'application <strong className="text-gray-900">{APP_NAME}</strong> sont la propriété exclusive d'App à la Carte — Hervé CHAMPAGNE EI, sauf mention contraire expresse. Toute reproduction, distribution ou modification sans accord préalable est strictement interdite.
              </p>
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD 2016/679) et à la loi Informatique et Libertés, les données recueillies dans le cadre du fonctionnement de l'application sont strictement réservées à la gestion des interventions de maintenance et au suivi technique des équipements. Aucun profilage commercial ni revente de données n'est opéré.
              </p>
              <p>
                Pour toute question, réclamation ou exercice de vos droits d'accès, de rectification ou de suppression des données, contactez : <a href="mailto:contact@appalacarte.fr" className="text-blue-600 underline">contact@appalacarte.fr</a>.
              </p>
            </section>
          </div>
        </div>
      </div>

      <Footer onNavigateLegal={() => {}} />
    </div>
  );
}
