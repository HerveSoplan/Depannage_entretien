import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://syrznjjxyvbbkahaavdf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HNpoA0yU4CoUW1UrgrOekA_koP9dD4O';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseCSVLine(line, separator) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) return [];

  const headerLine = lines[0].replace(/^\uFEFF/, '').trim();
  const sep = (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length ? ';' : ',';
  const headers = parseCSVLine(headerLine, sep).map(h => h.replace(/^["']|["']$/g, '').trim());

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], sep).map(v => v.replace(/^["']|["']$/g, '').trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

const KIT_CONFIGS = [
  // V 300
  {
    filePath: 'D:/Aplli/Kit d\'entretien/Kit V 300/Kit Entretien V 300 Service (1).csv',
    kit_id: 'kit_v300_2150025306_1',
    machine_type: 'V 300',
    service_number: 1,
    kit_number: 2150025306
  },
  {
    filePath: 'D:/Aplli/Kit d\'entretien/Kit V 300/Kit Entretien V 300 Service (2).csv',
    kit_id: 'kit_v300_2150025307_2',
    machine_type: 'V 300',
    service_number: 2,
    kit_number: 2150025307
  },
  {
    filePath: 'D:/Aplli/Kit d\'entretien/Kit V 300/Kit Entretien V 300 Service (3).csv',
    kit_id: 'kit_v300_2150025308_3',
    machine_type: 'V 300',
    service_number: 3,
    kit_number: 2150025308
  },
  {
    filePath: 'D:/Aplli/Kit d\'entretien/Kit V 300/Kit Entretien V 300 Service (4).csv',
    kit_id: 'kit_v300_2150025309_4',
    machine_type: 'V 300',
    service_number: 4,
    kit_number: 2150025309
  },
  // VMS 2014
  {
    filePath: 'D:/Aplli/Kit d\'entretien/Kit VMS 2014/Kit Entretien VMS_2014_Service_1.csv',
    kit_id: 'kit_vms_2014_88835631_1',
    machine_type: 'VMS_2014',
    service_number: 1,
    kit_number: 88835631
  },
  {
    filePath: 'D:/Aplli/Kit d\'entretien/Kit VMS 2014/Kit Entretien VMS_2014_Service_2.csv',
    kit_id: 'kit_vms_2014_88835632_2',
    machine_type: 'VMS_2014',
    service_number: 2,
    kit_number: 88835632
  },
  {
    filePath: 'D:/Aplli/Kit d\'entretien/Kit VMS 2014/Kit Entretien VMS_2014_Service_3.csv',
    kit_id: 'kit_vms_2014_88835633_3',
    machine_type: 'VMS_2014',
    service_number: 3,
    kit_number: 88835633
  },
  {
    filePath: 'D:/Aplli/Kit d\'entretien/Kit VMS 2014/Kit Entretien VMS_2014_Service_4.csv',
    kit_id: 'kit_vms_2014_88835634_4',
    machine_type: 'VMS_2014',
    service_number: 4,
    kit_number: 88835634
  }
];

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'general';
}

async function run() {
  console.log('🚀 Début de préparation des tâches...');
  const allTasks = [];

  for (const config of KIT_CONFIGS) {
    if (!fs.existsSync(config.filePath)) {
      console.warn(`Fichier introuvable: ${config.filePath}`);
      continue;
    }

    const rows = parseCSV(config.filePath);
    console.log(`📁 ${path.basename(config.filePath)}: ${rows.length} lignes lues`);

    let order = 1;
    let currentSection = 'Général';

    for (const row of rows) {
      if (row.Section && row.Section.trim()) {
        currentSection = row.Section.trim();
      }

      const description = row.Description || row.description || row.task_label || '';
      if (!description && !row.ID) continue;

      const taskId = String(row.ID || row.Id || row.id || `T_${order}`).trim();
      const refPiece = row.RefPiece || row['Ref. Pièce'] || row.ref_piece || '';
      const quantite = row.Quantite || row['Qté'] || row.quantite || '';
      const module = row.Module || row.module || '';
      const etat = row.Etat || row.etat || '';

      allTasks.push({
        kit_id: config.kit_id,
        machine_type: config.machine_type,
        service_number: config.service_number,
        kit_number: config.kit_number,
        section_id: slugify(currentSection),
        section_title: currentSection,
        section: currentSection,
        task_id: taskId,
        id_tache: taskId,
        task_label: description,
        description: description,
        titre: description.slice(0, 100),
        module: module,
        etat: etat,
        ref_piece: refPiece,
        quantite: quantite,
        task_order: order,
        ordre: order,
        is_critical: false,
        estimated_duration: 5,
        actif: true,
        creator: 'admin'
      });

      order++;
    }
  }

  console.log(`\n📊 Total des tâches préparées: ${allTasks.length}`);

  // Sauvegarder dans un JSON pour fallback local / demoDb
  const jsonPath = path.join(process.cwd(), 'src', 'data', 'defaultTachesEntretien.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(allTasks, null, 2), 'utf-8');
  console.log(`💾 Fichier de sauvegarde créé: ${jsonPath}`);

  // Insérer dans Supabase par lots de 50
  console.log('\n📤 Insertion dans Supabase...');
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < allTasks.length; i += BATCH_SIZE) {
    const batch = allTasks.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from('taches_entretien').insert(batch).select();
    if (error) {
      console.error(`❌ Erreur sur le lot ${i} - ${i + batch.length}:`, error);
      break;
    }
    inserted += (data?.length || 0);
    process.stdout.write(`✅ Inséré: ${inserted}/${allTasks.length}\r`);
  }

  console.log(`\n🎉 Terminé ! Total inséré dans Supabase: ${inserted}/${allTasks.length}`);

  // Vérifier le compte final
  const { count: finalCount } = await supabase.from('taches_entretien').select('*', { count: 'exact', head: true });
  console.log(`🔍 Vérification Supabase: ${finalCount} tâches présentes dans taches_entretien`);
}

run().catch(console.error);
