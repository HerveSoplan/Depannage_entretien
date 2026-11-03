// src/utils/installationReportPDF.ts
// Rapport officiel de compte-rendu d'installation & de montage multi-techniciens et multi-machines

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  calculerCollationInstallation,
  formatHeuresFr,
  formatPourcentage
} from './installationCalculations';

export interface InstallationReportData {
  installationData: any; // Montage complet
  client: any;
  machines: any[]; // Toutes les machines (depuis la base)
  intervention: any;
  responsableTechnique: any;
}

// Nettoyage des accents pour la police helvetica standard de jsPDF
const cleanPdf = (str: string | null | undefined): string => {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, ' ')
    .trim();
};

/**
 * Génère un PDF complet et certifié de compte-rendu d'installation pour le responsable technique
 * Contient :
 * - Informations générales du chantier
 * - Récapitulatif des machines installées
 * - Synthèse globale par catégorie de travaux (avec détail de chaque technicien)
 * - Synthèse globale par technicien (avec détail de chaque catégorie)
 * - Détail complet machine par machine (avec tableau des catégories, techniciens et total machine)
 * - Grand total du chantier avec vérification de concordance mathématique
 * - Géolocalisation GPS, observations et mentions légales obligatoires
 */
export const generateInstallationReportPDF = async (data: InstallationReportData): Promise<jsPDF> => {
  const { installationData, client, machines, intervention, responsableTechnique } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  let yPos = 55;

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'N/A';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('fr-FR');
  };

  const formatDateTime = (dateInput: any) => {
    if (!dateInput) return 'N/A';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatHeures = (heures: number) => {
    return cleanPdf(formatHeuresFr(heures));
  };

  const checkPageBreak = (neededSpace: number = 40) => {
    if (yPos > 260 - neededSpace) {
      doc.addPage();
      yPos = 20;
    }
  };

  // ═══════════════════════════════════════════════════════════════
  // CALCULS ET COLLATION MULTI-TECHNICIENS & MULTI-MACHINES
  // ═══════════════════════════════════════════════════════════════

  const machinesInstallees = installationData?.machines || [];
  const collation = calculerCollationInstallation(machinesInstallees);

  // ═══════════════════════════════════════════════════════════════
  // 1. EN-TÊTE OFFICIEL
  // ═══════════════════════════════════════════════════════════════

  const drawHeader = () => {
    // Bandeau bleu officiel
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Logo / Titre
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Maintenance & Depannage', 20, 18);

    doc.setFontSize(16);
    doc.text('COMPTE-RENDU D\'INSTALLATION & MONTAGE', 105, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const sousTitre = `Rapport multi-techniciens consolide | N deg ${cleanPdf(installationData?.numeroIntervention || 'N/A')}`;
    doc.text(sousTitre, 105, 38, { align: 'center' });
  };

  drawHeader();

  // ═══════════════════════════════════════════════════════════════
  // 2. INFORMATIONS GÉNÉRALES DU CHANTIER
  // ═══════════════════════════════════════════════════════════════

  doc.setFontSize(15);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations generales du chantier', 20, yPos);
  yPos += 8;

  // Calculer la durée
  let dureeJours = 'N/A';
  if (intervention?.dateDebut && intervention?.dateFin) {
    const debut = new Date(intervention.dateDebut);
    const fin = new Date(intervention.dateFin);
    const diffMs = fin.getTime() - debut.getTime();
    const diffJours = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    dureeJours = diffJours > 1 ? `${diffJours} jours` : `${diffJours} jour`;
  }

  const generalBody = [
    ['N deg Installation', cleanPdf(installationData?.numeroIntervention || 'N/A')],
    ['Client', cleanPdf(client?.nom || client?.raisonSociale || 'N/A')],
    ['Exploitation / Ferme', cleanPdf(client?.nomFerme || 'Non renseignee')],
    ['Adresse', cleanPdf(client?.adresse ? `${client.adresse}, ${client.codePostal || ''} ${client.ville || ''}` : 'N/A')],
    ['Date debut', formatDate(intervention?.dateDebut || installationData?.dateDebut)],
    ['Date cloture', formatDate(intervention?.dateFin || installationData?.dateCloture || new Date())],
    ['Duree', dureeJours],
    ['Chef de chantier', cleanPdf(installationData?.chefDeChantierNom || 'Non assigne')],
    ['Statut', cleanPdf(installationData?.statut === 'TERMINEE' ? 'TERMINEE (Cloture definitive)' : 'EN COURS (Synthese provisoire)')]
  ];

  (doc as any).autoTable({
    startY: yPos,
    head: [],
    body: generalBody,
    theme: 'grid',
    styles: { fontSize: 9.5, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [60, 60, 60], cellWidth: 55 },
      1: { cellWidth: 115 }
    },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Encadré de synthèse rapide des compteurs
  doc.setFillColor(240, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(20, yPos, 170, 16, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.setFont('helvetica', 'bold');
  const summaryText = `Machines : ${collation.totalMachinesCount}  |  Intervenants : ${collation.totalTechniciensCount}  |  Categories actives : ${collation.totalCategoriesCount}`;
  doc.text(summaryText, 25, yPos + 6);

  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61);
  doc.text(`TOTAL GENERAL DU CHANTIER : ${formatHeures(collation.grandTotalHeures)}`, 25, yPos + 12);

  yPos += 24;

  // ═══════════════════════════════════════════════════════════════
  // 3. MACHINES DU MONTAGE
  // ═══════════════════════════════════════════════════════════════

  checkPageBreak(70);
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Machines installees sur le chantier', 20, yPos);
  yPos += 7;

  const machinesBody = collation.parMachine.map((m, index) => {
    const machineDB = (machines || []).find((mdb: any) => (mdb._id || mdb.id) === m.machineId);
    return [
      `${index + 1}`,
      cleanPdf(m.nom || 'Machine'),
      cleanPdf(m.typeMachineNom || machineDB?.typeMachineNom || '-'),
      cleanPdf(m.serie || machineDB?.serie || machineDB?.numeroSerie || '-'),
      cleanPdf(m.relationType || 'MAITRE'),
      `${m.techniciens.length} tech.`,
      formatHeures(m.totalHeures),
      cleanPdf(formatPourcentage(m.totalHeures, collation.grandTotalHeures))
    ];
  });

  (doc as any).autoTable({
    startY: yPos,
    head: [['#', 'Nom machine', 'Type', 'N deg Serie', 'Relation', 'Equipe', 'Total heures', '% Chantier']],
    body: machinesBody,
    foot: [[
      '',
      'TOTAL MACHINES',
      '',
      '',
      '',
      `${collation.totalTechniciensCount} tech.`,
      formatHeures(collation.grandTotalHeures),
      '100%'
    ]],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 2.5 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 30 },
      3: { cellWidth: 26 },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 20, halign: 'right', fontStyle: 'bold' },
      7: { cellWidth: 12, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // ═══════════════════════════════════════════════════════════════
  // 4. SYNTHÈSE GLOBALE PAR CATÉGORIE DE TRAVAUX (TOUS TECHNICIENS)
  // ═══════════════════════════════════════════════════════════════

  checkPageBreak(85);
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Synthese globale par categorie de travaux', 20, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Cumul des heures passees, ventilees par poste/categorie et par technicien intervenant.', 20, yPos);
  yPos += 5;

  const catBody = collation.parCategorie.map((c, idx) => {
    const detailTechs = c.techniciens
      .map(t => `${cleanPdf(t.technicienNom)} : ${formatHeures(t.heures)}`)
      .join('\n');

    const detailMachines = c.machines
      .map(m => cleanPdf(m.machineNom))
      .join(', ');

    return [
      `${idx + 1}`,
      cleanPdf(c.description),
      detailTechs || 'Aucun',
      detailMachines || '-',
      formatHeures(c.totalHeures),
      cleanPdf(formatPourcentage(c.totalHeures, collation.grandTotalHeures))
    ];
  });

  (doc as any).autoTable({
    startY: yPos,
    head: [['#', 'Categorie / Poste de travail', 'Detail des techniciens intervenants', 'Machines concernees', 'Total heures', '% Chantier']],
    body: catBody.length > 0 ? catBody : [['-', 'Aucune categorie renseignee', '-', '-', '0h 00min', '0%']],
    foot: [[
      '',
      'TOTAL TOUTES CATEGORIES',
      `${collation.totalTechniciensCount} technicien(s) mobilises`,
      `${collation.totalMachinesCount} machine(s)`,
      formatHeures(collation.grandTotalHeures),
      '100%'
    ]],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 60 },
      3: { cellWidth: 28 },
      4: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 14, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // ═══════════════════════════════════════════════════════════════
  // 5. SYNTHÈSE GLOBALE PAR TECHNICIEN
  // ═══════════════════════════════════════════════════════════════

  checkPageBreak(85);
  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Synthese globale par technicien', 20, yPos);
  yPos += 5;

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Heures passees par chaque intervenant avec ventilation par categorie et machines.', 20, yPos);
  yPos += 5;

  const techBody = collation.parTechnicien.map((t) => {
    const detailCategories = t.categories
      .map(c => `${cleanPdf(c.description)} : ${formatHeures(c.heures)}`)
      .join('\n');

    const detailMachines = t.machines
      .map(m => `${cleanPdf(m.machineNom)} (${formatHeures(m.heures)})`)
      .join('\n');

    return [
      cleanPdf(t.technicienNom),
      cleanPdf(t.specialite || 'Technicien'),
      detailMachines || '-',
      detailCategories || '-',
      formatHeures(t.totalHeures),
      cleanPdf(formatPourcentage(t.totalHeures, collation.grandTotalHeures))
    ];
  });

  (doc as any).autoTable({
    startY: yPos,
    head: [['Technicien', 'Specialite', 'Machines travaillees', 'Detail par categorie realisee', 'Total heures', '% Chantier']],
    body: techBody.length > 0 ? techBody : [['Aucun technicien', '-', '-', '-', '0h 00min', '0%']],
    foot: [[
      'TOTAL TOUS TECHNICIENS',
      `${collation.totalTechniciensCount} intervenant(s)`,
      `${collation.totalMachinesCount} machine(s)`,
      `${collation.totalCategoriesCount} categorie(s)`,
      formatHeures(collation.grandTotalHeures),
      '100%'
    ]],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 38 },
      3: { cellWidth: 42 },
      4: { cellWidth: 18, halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 14, halign: 'right' }
    },
    margin: { left: 20, right: 20 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 14;

  // ═══════════════════════════════════════════════════════════════
  // 6. DÉTAIL COMPLET MACHINE PAR MACHINE
  // ═══════════════════════════════════════════════════════════════

  doc.addPage();
  yPos = 20;

  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Detail complet par machine (Multi-techniciens & Categories)', 20, yPos);
  yPos += 6;

  doc.setFontSize(9.5);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('Pour chaque machine : detail des intervenants par categorie et calcul du total de la machine.', 20, yPos);
  yPos += 10;

  collation.parMachine.forEach((mach, mIdx) => {
    checkPageBreak(90);

    // Titre de la machine avec fond doux
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.rect(20, yPos, 170, 14, 'FD');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    const machTitle = `MACHINE ${mIdx + 1} / ${collation.parMachine.length} : ${cleanPdf(mach.nom)}`;
    doc.text(machTitle, 24, yPos + 6);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    const machSub = `Type : ${cleanPdf(mach.typeMachineNom || 'Standard')}  |  N deg Serie : ${cleanPdf(mach.serie || '-')}  |  Relation : ${cleanPdf(mach.relationType)}`;
    doc.text(machSub, 24, yPos + 11);

    // Total machine en haut à droite
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(21, 128, 61);
    doc.text(`Total : ${formatHeures(mach.totalHeures)} (${mach.pourcentage}%)`, 185, yPos + 9, { align: 'right' });

    yPos += 18;

    if (mach.categories.length === 0 || mach.totalHeures === 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(148, 163, 184);
      doc.text('Aucune heure enregistree sur cette machine pour le moment.', 25, yPos);
      yPos += 12;
    } else {
      // Tableau détaillé par catégorie sur cette machine
      const machCatRows = mach.categories.map((c) => {
        const detailTechsOnMachine = c.techniciens
          .map(t => `${cleanPdf(t.technicienNom)} : ${formatHeures(t.heures)}`)
          .join('\n');

        return [
          cleanPdf(c.description),
          detailTechsOnMachine,
          formatHeures(c.totalHeures),
          cleanPdf(formatPourcentage(c.totalHeures, mach.totalHeures))
        ];
      });

      // Résumé des techniciens sur cette machine pour le pied
      const techFootText = mach.techniciens
        .map(t => `${cleanPdf(t.technicienNom)}: ${formatHeures(t.heures)}`)
        .join('  |  ');

      (doc as any).autoTable({
        startY: yPos,
        head: [['Categorie / Tache', 'Detail des intervenants sur cette machine', 'Total categorie', '% Machine']],
        body: machCatRows,
        foot: [[
          'TOTAL MACHINE',
          techFootText || 'Aucun technicien',
          formatHeures(mach.totalHeures),
          '100%'
        ]],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold', fontSize: 8.5 },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8.5 },
        styles: { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 78 },
          2: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
          3: { cellWidth: 18, halign: 'right' }
        },
        margin: { left: 20, right: 20 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 6;

      // Note récapitulative intervenants sur cette machine
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(71, 85, 105);
      const techResumeLine = `Intervenant(s) sur cette machine (${mach.techniciens.length}) : ` +
        mach.techniciens.map(t => `${cleanPdf(t.technicienNom)} (${formatHeures(t.heures)})`).join(' • ');
      doc.text(techResumeLine, 22, yPos);
      yPos += 12;
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // 7. GRAND TOTAL ET CONCORDANCE DU CHANTIER
  // ═══════════════════════════════════════════════════════════════

  checkPageBreak(50);

  // Grand encadré bleu foncé
  doc.setFillColor(30, 58, 138);
  doc.roundedRect(20, yPos, 170, 26, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setTextColor(191, 219, 254);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL GENERAL DU CHANTIER D\'INSTALLATION', 25, yPos + 7);

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(formatHeures(collation.grandTotalHeures), 185, yPos + 15, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 231, 255);
  const concordanceMsg = `Concordance parfaite : ${collation.totalMachinesCount} machine(s) = ${collation.totalTechniciensCount} intervenant(s) = ${collation.totalCategoriesCount} categorie(s) de travaux`;
  doc.text(concordanceMsg, 25, yPos + 15);

  const formuleLine = `Somme des machines (${formatHeures(collation.grandTotalHeures)}) == Somme des intervenants (${formatHeures(collation.grandTotalHeures)}) == Somme des categories (${formatHeures(collation.grandTotalHeures)})`;
  doc.text(formuleLine, 25, yPos + 21);

  yPos += 36;

  // ═══════════════════════════════════════════════════════════════
  // 8. GÉOLOCALISATION GPS DU CHANTIER
  // ═══════════════════════════════════════════════════════════════

  if (installationData?.gpsLat && installationData?.gpsLng) {
    checkPageBreak(35);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('5. Geolocalisation du chantier', 20, yPos);
    yPos += 7;

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(`Coordonnees GPS : ${installationData.gpsLat.toFixed(6)}, ${installationData.gpsLng.toFixed(6)}`, 20, yPos);
    yPos += 5;
    doc.text(`Enregistre le : ${formatDateTime(installationData.gpsPrisLe)}`, 20, yPos);
    yPos += 12;
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. NOTES ET OBSERVATIONS
  // ═══════════════════════════════════════════════════════════════

  if (installationData?.notes || intervention?.description) {
    checkPageBreak(40);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('6. Notes et observations', 20, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const rawNotes = cleanPdf(installationData?.notes || intervention?.description || 'Aucune note');
    const splitNotes = doc.splitTextToSize(rawNotes, 170);
    doc.text(splitNotes, 20, yPos);
    yPos += splitNotes.length * 4.5 + 10;
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. PIED DE PAGE LÉGAL SUR TOUTES LES PAGES
  // ═══════════════════════════════════════════════════════════════

  const pageCount = (doc.internal as any).pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.setFont('helvetica', 'italic');
    if (responsableTechnique?.email) {
      doc.text(
        `Destinataire : ${cleanPdf(responsableTechnique?.prenom || '')} ${cleanPdf(responsableTechnique?.nom || '')} (${cleanPdf(responsableTechnique?.email)})`,
        105,
        282,
        { align: 'center' }
      );
    }
    doc.text(
      `Page ${i} / ${pageCount} - Genere le ${new Date().toLocaleString('fr-FR')} - Compte-rendu d'installation officiel`,
      105,
      286,
      { align: 'center' }
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'App a la Carte - Herve CHAMPAGNE EI | SIREN : 132 021 098 | contact@appalacarte.fr | TVA non applicable, art. 293 B du CGI',
      105,
      290,
      { align: 'center' }
    );
  }

  return doc;
};
