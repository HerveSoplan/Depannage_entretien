import jsPDF from 'jspdf';
import 'jspdf-autotable';
export { generateInstallationReportPDF } from './installationReportPDF';

export const generateInterventionPDF = async (data: {
  intervention: any;
  client: any;
  machines: any[];
  usedParts: any[];
}) => {
  const { intervention, client, machines, usedParts } = data;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPos = 55;

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

  const checkPageBreak = (neededSpace: number = 40) => {
    if (yPos > 260 - neededSpace) {
      doc.addPage();
      yPos = 20;
    }
  };

  // EN-TÊTE
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('Maintenance & Dépannage', 20, 20);
  
  doc.setFontSize(18);
  doc.text('RAPPORT D\'INTERVENTION', 105, 32, { align: 'center' });

  // INFORMATIONS GÉNÉRALES
  doc.setFontSize(16);
  doc.setTextColor(37, 99, 235);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations generales', 20, yPos);
  yPos += 10;

  const typeLabels: Record<string, string> = {
    DEPANNAGE: 'Depannage',
    MAINTENANCE: 'Maintenance',
    INSTALLATION: 'Installation',
    COMMISSIONING: 'Mise en service',
    AUTRE: 'Autre'
  };

  const generalBody = [
    ['N° Intervention', intervention?.numeroIntervention || intervention?.numero_intervention || 'N/A'],
    ['Type', typeLabels[intervention?.type] || intervention?.type || 'N/A'],
    ['Client', client?.nom || 'N/A'],
    ['Ferme', client?.nomFerme || 'N/A'],
    ['Adresse', client?.adresse ? `${client.adresse}, ${client.codePostal} ${client.ville}` : 'N/A'],
    ['Date debut', formatDateTime(intervention?.dateDebut)],
    ['Date fin', formatDateTime(intervention?.dateFin)],
    ['Duree', intervention?.duree ? `${intervention.duree} min` : 'N/A'],
    ['Technicien', intervention?.technicien || 'N/A']
  ];

  doc.autoTable({
    startY: yPos,
    head: [],
    body: generalBody,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [60, 60, 60], cellWidth: 55 },
      1: { cellWidth: 125 }
    },
    margin: { left: 20, right: 20 }
  });

  yPos = doc.lastAutoTable.finalY + 15;

  // MACHINES
  if (machines && machines.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235);
    doc.setFont('helvetica', 'bold');
    doc.text('Machines concernees', 20, yPos);
    yPos += 10;

    const machinesBody = machines.map((m: any) => [
      m.nom || 'Machine',
      m.numeroSerie || '-',
      m.compteur ? `${m.compteur}h` : '-'
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Nom', 'N° Serie', 'Compteur']],
      body: machinesBody,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 20, right: 20 }
    });

    yPos = doc.lastAutoTable.finalY + 15;
  }

  // DIAGNOSTIC
  if (intervention?.diagnostic) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Diagnostic', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const splitDiag = doc.splitTextToSize(intervention.diagnostic, 170);
    doc.text(splitDiag, 20, yPos);
    yPos += splitDiag.length * 5 + 10;
  }

  // ACTIONS RÉALISÉES
  if (intervention?.actionsRealisees) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Actions realisees', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const splitActions = doc.splitTextToSize(intervention.actionsRealisees, 170);
    doc.text(splitActions, 20, yPos);
    yPos += splitActions.length * 5 + 10;
  }

  // PIÈCES UTILISÉES
  if (usedParts && usedParts.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Pieces detachees utilisees', 20, yPos);
    yPos += 10;

    const partsBody = usedParts.map((p: any) => [
      p.designation || 'N/A',
      p.reference || '-',
      p.quantite?.toString() || '1',
      p.prixUnitaire ? `${p.prixUnitaire.toFixed(2)} EUR` : '-'
    ]);

    doc.autoTable({
      startY: yPos,
      head: [['Designation', 'Reference', 'Qte', 'Prix unit.']],
      body: partsBody,
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: 20, right: 20 }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    const total = usedParts.reduce((sum, p) => sum + (p.quantite * p.prixUnitaire), 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(`Total pieces : ${total.toFixed(2)} EUR`, 20, yPos);
    yPos += 15;
  }

  // RECOMMANDATIONS
  if (intervention?.recommandations) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text('Recommandations', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const splitReco = doc.splitTextToSize(intervention.recommandations, 170);
    doc.text(splitReco, 20, yPos);
    yPos += splitReco.length * 5 + 10;
  }

  // PIED DE PAGE
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text(
      `Page ${i} / ${pageCount} - Genere le ${new Date().toLocaleString('fr-FR')} - Maintenance & Dépannage`,
      105,
      290,
      { align: 'center' }
    );
  }

  return doc;
};
