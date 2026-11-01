import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface CSVImporterProps {
  onImport: (data: any[], options: ImportOptions) => Promise<ImportResult>;
  columns: { key: string; label: string; required?: boolean; aliases?: string[] }[];
  tableName: string;
}

interface ImportOptions {
  duplicateStrategy: 'ignore' | 'update' | 'reject';
}

interface ImportResult {
  success: number;
  errors: string[];
  duplicates: number;
}

export function CSVImporter({ onImport, columns, tableName }: CSVImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);

  // ✅ AJOUT : On stocke les en-têtes séparément pour être sûr de les avoir
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [encoding, setEncoding] = useState<string>('UTF-8');
  const [separator, setSeparator] = useState<string>('auto'); // 'auto', ',', ';', '\t'

  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [duplicateStrategy, setDuplicateStrategy] = useState<'ignore' | 'update' | 'reject'>('update');
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);

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
    const tabCount = (line.match(/\t/g) || []).length;

    if (tabCount > semicolonCount && tabCount > commaCount) return '\t';
    return semicolonCount > commaCount ? ';' : ',';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    // Reset previous states when new file is selected
    setColumnMapping({});
    setImportResult(null);
    setCsvHeaders([]); // Reset headers

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;

      if (!text) {
        alert("Fichier vide");
        return;
      }

      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length === 0) {
        alert("Le fichier ne contient aucune ligne.");
        return;
      }

      const detectedSep = detectSeparator(lines[0]);
      const actualSeparator = separator === 'auto' ? detectedSep : separator;

      // Nettoyage des en-têtes
      const headers = parseCSVLine(lines[0], actualSeparator).map(h => h.replace(/^["']|["']$/g, '').trim());

      // ✅ CORRECTION ICI : On sauvegarde les headers dans l'état
      setCsvHeaders(headers);

      const data = lines.slice(1).map(line => {
        const values = parseCSVLine(line, actualSeparator).map(v => v.replace(/^["']|["']$/g, '').trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      setCsvData(data);

      // Tentative de mappage automatique
      autoMapColumns(headers);
    };
    reader.readAsText(selectedFile, encoding);
  };

  // ✅ NOUVELLE FONCTION : Essayer de deviner les colonnes automatiquement
  const autoMapColumns = (headers: string[]) => {
    console.log('🔍 AutoMap - Headers reçus:', headers);
    console.log('🔍 AutoMap - Colonnes attendues:', columns);

    const newMapping: Record<string, string> = {};
    const usedHeaders = new Set<string>(); // Track which headers have been used

    // First pass: exact matches only (highest priority)
    columns.forEach(col => {
      if (!col.label || !col.key) return;

      const exactMatch = headers.find(h => {
        if (!h || usedHeaders.has(h)) return false;

        const lowerH = h.toLowerCase();
        const lowerLabel = col.label.toLowerCase();
        const lowerKey = col.key.toLowerCase();

        // Exact match with label or key
        return lowerH === lowerLabel || lowerH === lowerKey;
      });

      if (exactMatch) {
        console.log(`✅ AutoMap - Exact match: "${col.key}" ← "${exactMatch}"`);
        newMapping[col.key] = exactMatch;
        usedHeaders.add(exactMatch);
      }
    });

    // Second pass: alias exact matches
    columns.forEach(col => {
      if (!col.label || !col.key || newMapping[col.key]) return; // Skip if already mapped

      const aliasMatch = headers.find(h => {
        if (!h || usedHeaders.has(h)) return false;

        const lowerH = h.toLowerCase();

        // Check for exact alias match
        return col.aliases && col.aliases.some(alias =>
          alias && lowerH === alias.toLowerCase()
        );
      });

      if (aliasMatch) {
        console.log(`✅ AutoMap - Alias exact match: "${col.key}" ← "${aliasMatch}"`);
        newMapping[col.key] = aliasMatch;
        usedHeaders.add(aliasMatch);
      }
    });

    // Third pass: partial matches (lowest priority)
    columns.forEach(col => {
      if (!col.label || !col.key || newMapping[col.key]) return; // Skip if already mapped

      const partialMatch = headers.find(h => {
        if (!h || usedHeaders.has(h)) return false;

        const lowerH = h.toLowerCase();
        const lowerKey = col.key.toLowerCase();

        // Partial match: header contains key or vice versa
        if (lowerH.includes(lowerKey) || lowerKey.includes(lowerH)) return true;

        // Partial match with aliases
        if (col.aliases && col.aliases.some(alias =>
          alias && (lowerH.includes(alias.toLowerCase()) || alias.toLowerCase().includes(lowerH))
        )) return true;

        return false;
      });

      if (partialMatch) {
        console.log(`✅ AutoMap - Partial match: "${col.key}" ← "${partialMatch}"`);
        newMapping[col.key] = partialMatch;
        usedHeaders.add(partialMatch);
      } else {
        console.log(`❌ AutoMap - Pas de match pour: "${col.key}" (label: "${col.label}")`);
      }
    });

    console.log('🔍 AutoMap - Mapping final:', newMapping);
    console.log('🔍 AutoMap - Nombre de colonnes mappées:', Object.keys(newMapping).length);

    setColumnMapping(newMapping);
  };

  // Recharger le fichier si le séparateur ou l'encodage change
  React.useEffect(() => {
    if (file) {
      // On simule un event pour réutiliser la logique de lecture
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;

        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        const detectedSep = detectSeparator(lines[0]);
        const actualSeparator = separator === 'auto' ? detectedSep : separator;

        const headers = parseCSVLine(lines[0], actualSeparator).map(h => h.replace(/^["']|["']$/g, '').trim());
        setCsvHeaders(headers);

        const data = lines.slice(1).map(line => {
          const values = parseCSVLine(line, actualSeparator).map(v => v.replace(/^["']|["']$/g, '').trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });
        setCsvData(data);
        autoMapColumns(headers);
      };
      reader.readAsText(file, encoding);
    }
  }, [separator, encoding, file]); // Dépendances pour rechargement auto


  const handleImport = async () => {
    // Vérification de sécurité
    if (Object.keys(columnMapping).length === 0) {
      alert("⚠️ Erreur : Vous n'avez fait correspondre aucune colonne.\n\nVeuillez utiliser la section 'Correspondance des colonnes' pour lier les colonnes de votre CSV aux champs de la base de données.");
      return;
    }

    const missingRequired = columns.filter(col => col.required && !columnMapping[col.key]);
    if (missingRequired.length > 0) {
      alert(`⚠️ Il manque des champs obligatoires : ${missingRequired.map(c => c.label).join(', ')}`);
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    try {
      const mappedData = csvData.map(row => {
        const mapped: any = {};
        Object.entries(columnMapping).forEach(([targetCol, sourceCol]) => {
          mapped[targetCol] = row[sourceCol] || '';
        });
        return mapped;
      });

      const validData = mappedData.filter(row => {
        return Object.values(row).some(val => val && String(val).trim() !== '');
      });

      if (validData.length === 0 && csvData.length > 0) {
        // Cas particulier : fichier avec header mais pas de données
        alert("Le fichier ne contient que les en-têtes. Il n'y a aucune donnée à importer.");
        setIsImporting(false);
        return;
      }

      const result = await onImport(validData, { duplicateStrategy });
      setImportResult(result);
    } catch (error) {
      console.error('Erreur import:', error);
      setImportResult({
        success: 0,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
        duplicates: 0,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const isValidMapping = columns.every(col =>
    !col.required || columnMapping[col.key]
  );

  return (
    <Card className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Import CSV - {tableName}
        </h3>

        <div className="mb-4 flex flex-wrap items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Encodage :</label>
            <select
              value={encoding}
              onChange={(e) => setEncoding(e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="UTF-8">UTF-8 (Standard)</option>
              <option value="ISO-8859-1">ISO-8859-1 (Excel FR)</option>
              <option value="windows-1252">Windows-1252 (Windows FR)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Séparateur :</label>
            <select
              value={separator}
              onChange={(e) => setSeparator(e.target.value)}
              className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="auto">Auto-détection</option>
              <option value=";">Point-virgule (;)</option>
              <option value=",">Virgule (,)</option>
              <option value="	">Tabulation (\t)</option>
            </select>
          </div>
        </div>

        {/* File Upload */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <Upload className="mx-auto text-gray-400 mb-2" size={48} />
            <p className="text-sm text-gray-600">
              {file ? file.name : 'Cliquez pour sélectionner un fichier CSV'}
            </p>
          </label>
        </div>
      </div>

      {/* Preview Data */}
      {csvData.length > 0 && (
        <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-40">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {csvHeaders.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {csvData.slice(0, 3).map((row, i) => (
                <tr key={i}>
                  {csvHeaders.map((h, j) => (
                    <td key={j} className="px-3 py-2 whitespace-nowrap text-gray-500">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Column Mapping */}
      {csvData.length > 0 || csvHeaders.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h4 className="font-bold text-blue-900 mb-3">📋 Correspondance des colonnes</h4>
          <p className="text-sm text-blue-700 mb-4">
            Reliez les colonnes de votre fichier CSV aux champs de l'application.
          </p>

          {Object.keys(columnMapping).length === 0 && (
            <div className="bg-yellow-100 text-yellow-800 text-sm p-2 rounded mb-3">
              ℹ️ J'ai essayé de deviner automatiquement, mais vérifiez ci-dessous.
            </div>
          )}

          <div className="space-y-3">
            {columns.map((col, index) => (
              <div key={`${col.key}-${index}`} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="sm:w-1/3 text-sm font-medium text-gray-800">
                  {col.label} {col.required && <span className="text-red-500 font-bold">*</span>}
                </label>
                <select
                  value={columnMapping[col.key] || ''}
                  onChange={(e) => setColumnMapping({ ...columnMapping, [col.key]: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Sélectionner une colonne CSV --</option>
                  {/* ✅ CORRECTION ICI : On utilise csvHeaders au lieu de Object.keys(csvData[0]) */}
                  {csvHeaders.map((header, headerIndex) => (
                    <option key={`${header}-${headerIndex}`} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Duplicate Strategy */}
      {csvData.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Gestion des doublons</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="dup-strat"
                value="ignore"
                checked={duplicateStrategy === 'ignore'}
                onChange={(e) => setDuplicateStrategy(e.target.value as any)}
              />
              <span className="text-sm text-gray-700">Ignorer les doublons</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="dup-strat"
                value="update"
                checked={duplicateStrategy === 'update'}
                onChange={(e) => setDuplicateStrategy(e.target.value as any)}
              />
              <span className="text-sm text-gray-700">Mettre à jour les doublons</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="dup-strat"
                value="reject"
                checked={duplicateStrategy === 'reject'}
                onChange={(e) => setDuplicateStrategy(e.target.value as any)}
              />
              <span className="text-sm text-gray-700">Refuser tout si doublon</span>
            </label>
          </div>
        </div>
      )}

      {/* Import Button */}
      {csvData.length > 0 && (
        <Button
          onClick={handleImport}
          disabled={!isValidMapping || isImporting}
          className="w-full"
        >
          {isImporting ? 'Import en cours...' : `Importer ${csvData.length} lignes`}
        </Button>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle size={20} />
            <span className="font-medium">{importResult.success} lignes importées avec succès</span>
          </div>
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
              <div className="pl-7 text-sm text-red-600 max-h-40 overflow-y-auto bg-red-50 p-2 rounded">
                {importResult.errors.map((error, index) => (
                  <div key={index} className="border-b border-red-100 pb-1 mb-1 last:border-0">• {error}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}