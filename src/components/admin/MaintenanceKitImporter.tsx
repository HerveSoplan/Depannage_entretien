//MaintenanceKitImporter.tsx
import React, { useState, useEffect } from 'react';
import {Upload, CheckCircle, XCircle, AlertCircle, ArrowRight, ArrowLeft} from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { Input } from '../common/Input';

interface MaintenanceKitImporterProps {
  onImport: (kitMetadata: KitMetadata, tasksData: any[]) => Promise<ImportResult>;
  onClose?: () => void;
}

interface KitMetadata {
  machineType: string;
  kitNumber: string;
  serviceNumber: number;
  kitId: string;
  nom: string;
}

interface ImportResult {
  success: number;
  errors: string[];
  duplicates: number;
  sections?: { section: string; count: number }[];
}

export function MaintenanceKitImporter({ onImport, onClose }: MaintenanceKitImporterProps) {
  const [step, setStep] = useState(1);
  const [machineType, setMachineType] = useState('');
  const [kitNumber, setKitNumber] = useState('');
  const [serviceNumber, setServiceNumber] = useState('1');
  const [generatedTitle, setGeneratedTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Générer le titre automatiquement
  useEffect(() => {
    if (machineType && kitNumber && serviceNumber) {
      setGeneratedTitle(`Kit Entretien ${machineType}-${kitNumber}-Service (${serviceNumber})`);
    } else {
      setGeneratedTitle('-');
    }
  }, [machineType, kitNumber, serviceNumber]);

  const parseCSVLine = (line: string, separator: string): string[] => {
    const result: string[] = [];
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
  };

  const detectSeparator = (line: string): string => {
    const semicolonCount = (line.match(/;/g) || []).length;
    const commaCount = (line.match(/,/g) || []).length;
    return semicolonCount > commaCount ? ';' : ',';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return;

      const separator = detectSeparator(lines[0]);
      const headers = parseCSVLine(lines[0], separator).map(h => h.replace(/^["']|["']$/g, '').trim());
      
      const data = lines.slice(1).map(line => {
        const values = parseCSVLine(line, separator).map(v => v.replace(/^["']|["']$/g, '').trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setCsvData(data);
      
      // Mapping automatique des colonnes du CSV vers les champs de la base
      const autoMapping: Record<string, string> = {};
      const mappingRules: Record<string, string[]> = {
        'Section': ['section', 'Section'],
        'ID': ['id', 'ID', 'Id'],
        'Description': ['description', 'Description'],
        'Module': ['module', 'Module'],
        'Etat': ['etat', 'Etat', 'état', 'État'],
        'RefPiece': ['refpiece', 'RefPiece', 'Ref', 'Reference'],
        'Quantite': ['quantite', 'Quantite', 'Qte', 'Qty'],
      };

      Object.entries(mappingRules).forEach(([dbField, possibleNames]) => {
        const matchingHeader = headers.find(h => 
          possibleNames.some(name => 
            h.toLowerCase() === name.toLowerCase()
          )
        );
        if (matchingHeader) {
          autoMapping[dbField] = matchingHeader;
        }
      });

      setColumnMapping(autoMapping);
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      // Transformer les données selon le mapping
      const mappedData = csvData.map(row => {
        const mapped: any = {};
        Object.entries(columnMapping).forEach(([targetCol, sourceCol]) => {
          mapped[targetCol] = row[sourceCol];
        });
        return mapped;
      });

      // Filtrer les lignes vides
      const validData = mappedData.filter(row => {
        return row.Section && row.ID && row.Description;
      });

      if (validData.length === 0) {
        setImportResult({
          success: 0,
          errors: ['Aucune donnée valide trouvée dans le fichier'],
          duplicates: 0,
        });
        return;
      }

      // Créer les métadonnées du kit
      const kitId = `kit_${machineType.toLowerCase().replace(/\s+/g, '')}_${kitNumber}_${serviceNumber}`;
      const kitMetadata: KitMetadata = {
        machineType,
        kitNumber,
        serviceNumber: parseInt(serviceNumber),
        kitId,
        nom: generatedTitle,
      };

      const result = await onImport(kitMetadata, validData);
      setImportResult(result);
      setStep(4);
    } catch (error) {
      setImportResult({
        success: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
        duplicates: 0,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const isStep1Valid = machineType && kitNumber && serviceNumber;
  const isStep2Valid = file && csvData.length > 0;
  const isStep3Valid = columnMapping.Section && columnMapping.ID && columnMapping.Description;

  const dbColumns = [
    { key: 'Section', label: 'Section', required: true },
    { key: 'ID', label: 'ID', required: true },
    { key: 'Description', label: 'Description', required: true },
    { key: 'Module', label: 'Module', required: false },
    { key: 'Etat', label: 'État', required: false },
    { key: 'RefPiece', label: 'Réf. Pièce', required: false },
    { key: 'Quantite', label: 'Quantité', required: false },
  ];

  return (
    <Card className="space-y-6">
      {/* Header avec étapes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Import Kit d'Entretien
        </h3>
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                  step >= s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-20 h-1 mx-2 ${
                    step > s ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Étape 1 : Métadonnées */}
      {step === 1 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Informations du Kit d'Entretien</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type de machine <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={machineType}
              onChange={(e) => setMachineType(e.target.value)}
              placeholder="Ex: V 300, DMS 300, AMS"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de kit <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={kitNumber}
              onChange={(e) => setKitNumber(e.target.value)}
              placeholder="Ex: 2150025306"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Numéro de service <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={serviceNumber}
              onChange={(e) => setServiceNumber(e.target.value)}
              placeholder="Ex: 1"
              min="1"
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre généré automatiquement :
            </label>
            <p className="text-blue-900 font-medium">{generatedTitle}</p>
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={!isStep1Valid}
            className="w-full flex items-center justify-center gap-2"
          >
            Suivant
            <ArrowRight size={20} />
          </Button>
        </div>
      )}

      {/* Étape 2 : Upload CSV */}
      {step === 2 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Upload du fichier CSV</h4>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload-kit"
            />
            <label htmlFor="csv-upload-kit" className="cursor-pointer">
              <Upload className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-sm text-gray-600">
                {file ? file.name : 'Cliquez pour sélectionner un fichier CSV'}
              </p>
              {csvData.length > 0 && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {csvData.length} lignes détectées
                </p>
              )}
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setStep(1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Retour
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!isStep2Valid}
              className="flex-1 flex items-center justify-center gap-2"
            >
              Suivant
              <ArrowRight size={20} />
            </Button>
          </div>
        </div>
      )}

      {/* Étape 3 : Mapping */}
      {step === 3 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Correspondance des colonnes CSV</h4>
          
          <div className="space-y-2">
            {dbColumns.map(col => (
              <div key={col.key} className="flex items-center gap-3">
                <label className="w-1/3 text-sm font-medium text-gray-700">
                  {col.label} {col.required && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={columnMapping[col.key] || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, [col.key]: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Non mappé --</option>
                  {Object.keys(csvData[0] || {}).map(header => (
                    <option key={header} value={header}>{header}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setStep(2)}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Retour
            </Button>
            <Button
              onClick={handleImport}
              disabled={!isStep3Valid || isImporting}
              className="flex-1"
            >
              {isImporting ? 'Import en cours...' : `Importer ${csvData.length} tâches`}
            </Button>
          </div>
        </div>
      )}

      {/* Étape 4 : Résultat */}
      {step === 4 && importResult && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Résultat de l'import</h4>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-medium">Kit créé : {generatedTitle}</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-medium">{importResult.success} tâches importées avec succès</span>
            </div>
            
            {importResult.sections && importResult.sections.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="font-medium text-gray-900 mb-2">Détails par section :</p>
                {importResult.sections.map((section, index) => (
                  <div key={index} className="text-sm text-gray-700">
                    • {section.section} : {section.count} tâches
                  </div>
                ))}
              </div>
            )}

            {importResult.duplicates > 0 && (
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle size={20} />
                <span>{importResult.duplicates} doublons détectés</span>
              </div>
            )}
            {importResult.errors.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle size={20} />
                  <span className="font-medium">{importResult.errors.length} erreurs</span>
                </div>
                <div className="pl-7 text-sm text-red-600 max-h-40 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <div key={index}>• {error}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                setStep(1);
                setMachineType('');
                setKitNumber('');
                setServiceNumber('1');
                setFile(null);
                setCsvData([]);
                setColumnMapping({});
                setImportResult(null);
              }}
              className="flex-1"
            >
              Importer un autre kit
            </Button>
            {onClose && (
              <Button variant="secondary" onClick={onClose}>
                Fermer
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
