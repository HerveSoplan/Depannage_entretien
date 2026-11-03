// src/utils/installationCalculations.ts
// Moteur de calcul, agrégation et collationnement multi-techniciens & multi-machines pour les installations de montage

export interface TechContribution {
  technicienId: string;
  technicienNom: string;
  specialite?: string;
  heures: number;
}

export interface MachineContribution {
  machineId: string;
  machineNom: string;
  heures: number;
}

export interface CategorieDetail {
  id?: string;
  description: string;
  totalHeures: number;
  techniciens: TechContribution[];
  machines: MachineContribution[];
  pourcentage: number;
}

export interface TechnicienDetail {
  technicienId: string;
  technicienNom: string;
  specialite?: string;
  totalHeures: number;
  categories: Array<{ description: string; heures: number }>;
  machines: MachineContribution[];
  pourcentage: number;
}

export interface MachineDetailCollation {
  id: string;
  machineId: string;
  nom: string;
  typeMachineNom: string;
  serie: string;
  relationType: 'MAITRE' | 'ESCLAVE';
  totalHeures: number;
  pourcentage: number;
  categories: Array<{
    description: string;
    totalHeures: number;
    techniciens: TechContribution[];
  }>;
  techniciens: TechContribution[];
}

export interface MatriceCell {
  technicienId: string;
  technicienNom: string;
  categorie: string;
  heures: number;
}

export interface InstallationCollation {
  grandTotalHeures: number;
  totalMachinesCount: number;
  totalTechniciensCount: number;
  totalCategoriesCount: number;
  parCategorie: CategorieDetail[];
  parTechnicien: TechnicienDetail[];
  parMachine: MachineDetailCollation[];
  matrice: {
    techniciens: Array<{ id: string; nom: string; specialite?: string; totalHeures: number }>;
    categories: Array<{ description: string; totalHeures: number }>;
    valeurs: Record<string, Record<string, number>>; // [techId][catDescription] = heures
  };
}

export const formatHeuresFr = (heures: number): string => {
  const safe = typeof heures === 'number' && !isNaN(heures) ? Math.max(0, heures) : 0;
  const h = Math.floor(safe);
  const m = Math.round((safe - h) * 60);
  return m > 0 ? `${h}h ${m.toString().padStart(2, '0')}min` : `${h}h 00min`;
};

export const formatPourcentage = (valeur: number, total: number): string => {
  if (!total || total <= 0) return '0%';
  const pct = Math.round((valeur / total) * 1000) / 10;
  return `${pct.toFixed(1)}%`;
};

/**
 * Calcule l'intégralité des sommes et ventilations croisées pour une installation
 * Règle d'or : Somme(Machines) === Somme(Techniciens) === Somme(Catégories) === Grand Total
 */
export function calculerCollationInstallation(machines: any[] = []): InstallationCollation {
  const catMap = new Map<string, {
    description: string;
    totalHeures: number;
    techMap: Map<string, TechContribution>;
    machMap: Map<string, MachineContribution>;
  }>();

  const techMap = new Map<string, {
    technicienId: string;
    technicienNom: string;
    specialite?: string;
    totalHeures: number;
    catMap: Map<string, number>;
    machMap: Map<string, MachineContribution>;
  }>();

  const machList: MachineDetailCollation[] = [];
  let grandTotal = 0;

  // 1. Parcours de toutes les machines
  machines.forEach((mach: any) => {
    let machTotal = 0;
    const machCatMap = new Map<string, {
      description: string;
      totalHeures: number;
      techs: Map<string, TechContribution>;
    }>();
    const machTechMap = new Map<string, TechContribution>();

    const heuresParTech = mach.heuresParTechnicien || [];

    heuresParTech.forEach((tech: any) => {
      const techId = tech.technicienId || tech.id || tech.technicienNom || 'tech-inconnu';
      const techNom = tech.technicienNom || tech.nom || 'Technicien';
      const specialite = tech.specialite || 'Technicien';

      let techTotalSurCetteMachine = 0;

      // Initialiser le technicien global si besoin
      if (!techMap.has(techId)) {
        techMap.set(techId, {
          technicienId: techId,
          technicienNom: techNom,
          specialite,
          totalHeures: 0,
          catMap: new Map(),
          machMap: new Map()
        });
      }
      const globalTech = techMap.get(techId)!;

      // Parcours des tâches du technicien sur cette machine
      (tech.taches || []).forEach((tach: any) => {
        const rawH = parseFloat(tach.heures);
        const h = !isNaN(rawH) && rawH > 0 ? Math.round(rawH * 100) / 100 : 0;
        if (h <= 0) return;

        const catDesc = (tach.description || tach.categorie || 'Autre tâche').trim();

        techTotalSurCetteMachine += h;
        machTotal += h;
        grandTotal += h;

        // Mise à jour de la catégorie sur cette machine
        if (!machCatMap.has(catDesc)) {
          machCatMap.set(catDesc, {
            description: catDesc,
            totalHeures: 0,
            techs: new Map()
          });
        }
        const machineCat = machCatMap.get(catDesc)!;
        machineCat.totalHeures = Math.round((machineCat.totalHeures + h) * 100) / 100;
        if (!machineCat.techs.has(techId)) {
          machineCat.techs.set(techId, { technicienId: techId, technicienNom: techNom, specialite, heures: 0 });
        }
        const mct = machineCat.techs.get(techId)!;
        mct.heures = Math.round((mct.heures + h) * 100) / 100;

        // Mise à jour de la catégorie globale
        if (!catMap.has(catDesc)) {
          catMap.set(catDesc, {
            description: catDesc,
            totalHeures: 0,
            techMap: new Map(),
            machMap: new Map()
          });
        }
        const globalCat = catMap.get(catDesc)!;
        globalCat.totalHeures = Math.round((globalCat.totalHeures + h) * 100) / 100;
        if (!globalCat.techMap.has(techId)) {
          globalCat.techMap.set(techId, { technicienId: techId, technicienNom: techNom, specialite, heures: 0 });
        }
        const gct = globalCat.techMap.get(techId)!;
        gct.heures = Math.round((gct.heures + h) * 100) / 100;

        const mKey = mach.id || mach.machineId || 'machine';
        if (!globalCat.machMap.has(mKey)) {
          globalCat.machMap.set(mKey, { machineId: mKey, machineNom: mach.nom || 'Machine', heures: 0 });
        }
        const gcm = globalCat.machMap.get(mKey)!;
        gcm.heures = Math.round((gcm.heures + h) * 100) / 100;

        // Mise à jour globale du technicien
        globalTech.totalHeures = Math.round((globalTech.totalHeures + h) * 100) / 100;
        const prevCatH = globalTech.catMap.get(catDesc) || 0;
        globalTech.catMap.set(catDesc, Math.round((prevCatH + h) * 100) / 100);

        if (!globalTech.machMap.has(mKey)) {
          globalTech.machMap.set(mKey, { machineId: mKey, machineNom: mach.nom || 'Machine', heures: 0 });
        }
        const gtm = globalTech.machMap.get(mKey)!;
        gtm.heures = Math.round((gtm.heures + h) * 100) / 100;
      });

      if (techTotalSurCetteMachine > 0) {
        machTechMap.set(techId, {
          technicienId: techId,
          technicienNom: techNom,
          specialite,
          heures: Math.round(techTotalSurCetteMachine * 100) / 100
        });
      }
    });

    machList.push({
      id: mach.id || mach.machineId || '',
      machineId: mach.machineId || mach.id || '',
      nom: mach.nom || 'Machine',
      typeMachineNom: mach.typeMachineNom || '',
      serie: mach.serie || '',
      relationType: mach.relationType || 'MAITRE',
      totalHeures: Math.round(machTotal * 100) / 100,
      pourcentage: 0, // sera calculé après grandTotal
      categories: Array.from(machCatMap.values()).map(mc => ({
        description: mc.description,
        totalHeures: mc.totalHeures,
        techniciens: Array.from(mc.techs.values())
      })).sort((a, b) => b.totalHeures - a.totalHeures),
      techniciens: Array.from(machTechMap.values()).sort((a, b) => b.heures - a.heures)
    });
  });

  grandTotal = Math.round(grandTotal * 100) / 100;

  // Calcul des pourcentages des machines
  machList.forEach(m => {
    m.pourcentage = grandTotal > 0 ? Math.round((m.totalHeures / grandTotal) * 1000) / 10 : 0;
  });

  // Liste des catégories globale avec pourcentages
  const parCategorie: CategorieDetail[] = Array.from(catMap.values())
    .map(c => ({
      description: c.description,
      totalHeures: c.totalHeures,
      techniciens: Array.from(c.techMap.values()).sort((a, b) => b.heures - a.heures),
      machines: Array.from(c.machMap.values()).sort((a, b) => b.heures - a.heures),
      pourcentage: grandTotal > 0 ? Math.round((c.totalHeures / grandTotal) * 1000) / 10 : 0
    }))
    .sort((a, b) => b.totalHeures - a.totalHeures);

  // Liste des techniciens globale avec pourcentages
  const parTechnicien: TechnicienDetail[] = Array.from(techMap.values())
    .map(t => ({
      technicienId: t.technicienId,
      technicienNom: t.technicienNom,
      specialite: t.specialite,
      totalHeures: t.totalHeures,
      categories: Array.from(t.catMap.entries()).map(([description, heures]) => ({ description, heures })).sort((a, b) => b.heures - a.heures),
      machines: Array.from(t.machMap.values()).sort((a, b) => b.heures - a.heures),
      pourcentage: grandTotal > 0 ? Math.round((t.totalHeures / grandTotal) * 1000) / 10 : 0
    }))
    .filter(t => t.totalHeures > 0)
    .sort((a, b) => b.totalHeures - a.totalHeures);

  // Matrice croisée Techniciens × Catégories
  const matriceValeurs: Record<string, Record<string, number>> = {};
  parTechnicien.forEach(t => {
    matriceValeurs[t.technicienId] = {};
    parCategorie.forEach(c => {
      matriceValeurs[t.technicienId][c.description] = 0;
    });
    t.categories.forEach(tc => {
      if (matriceValeurs[t.technicienId][tc.description] !== undefined) {
        matriceValeurs[t.technicienId][tc.description] = tc.heures;
      }
    });
  });

  return {
    grandTotalHeures: grandTotal,
    totalMachinesCount: machines.length,
    totalTechniciensCount: parTechnicien.length,
    totalCategoriesCount: parCategorie.length,
    parCategorie,
    parTechnicien,
    parMachine: machList,
    matrice: {
      techniciens: parTechnicien.map(t => ({
        id: t.technicienId,
        nom: t.technicienNom,
        specialite: t.specialite,
        totalHeures: t.totalHeures
      })),
      categories: parCategorie.map(c => ({
        description: c.description,
        totalHeures: c.totalHeures
      })),
      valeurs: matriceValeurs
    }
  };
}
