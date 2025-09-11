// Migrador CSV -> Firestore com foco no campo "Área"
// Uso: npm run migrate-csv -- /caminho/para/arquivo.csv

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const admin = require('firebase-admin');

function exitWith(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

// Resolve CSV path
const csvArg = process.argv[2];
if (!csvArg) {
  exitWith('Informe o caminho do CSV: npm run migrate-csv -- \/caminho\/arquivo.csv');
}
const csvPath = path.resolve(csvArg);
if (!fs.existsSync(csvPath)) {
  exitWith(`Arquivo CSV não encontrado: ${csvPath}`);
}

// Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = require('./firebase-adminsdk.json');
} catch (e) {
  exitWith('Arquivo firebase-adminsdk.json não encontrado na raiz do projeto.');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Heurística de normalização de cabeçalhos
function norm(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function mapHeaders(headers) {
  // Primeiro, tentamos match exato dos nomes mais comuns.
  const map = {};
  headers.forEach((h, i) => {
    const n = norm(h);
    if (/^(colaborador|nome( do)? colaborador|nome)$/.test(n)) map.nome = i;
    else if (/^(cargo|funcao)$/.test(n)) map.cargo = i;
    else if (n === 'area') map.area = i; // match exato já normalizado
    else if (/^(gestor|superior imediato|superior|chefe)$/.test(n)) map.gestor = i;
    else if (n === 'departamento') map.departamento = i; // opcional legado
  });

  // Se não achamos 'Área' por match exato, tentamos por inclusão
  if (map.area == null) {
    headers.forEach((h, i) => {
      if (map.area != null) return;
      const n = norm(h);
      // Considera variações como "Área (Unidade)", "Área de Negócio", etc.
      if (n.includes('area')) map.area = i;
    });
  }

  return map;
}

function buildDocId(nome) {
  return String(nome || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 200);
}

async function run() {
  console.log('🚀 Iniciando migração CSV -> Firestore');
  console.log('CSV:', csvPath);

  // Lê como Buffer e tenta decodificar em UTF-8 e Latin1, escolhendo a melhor
  const buf = fs.readFileSync(csvPath);
  const tryDecodes = ['utf8', 'latin1'];
  let raw = null;
  let chosenEncoding = 'utf8';
  for (const enc of tryDecodes) {
    const text = buf.toString(enc);
    // Preferir decodificação que não contenha caractere de substituição e reconheça "Área" ou "Departamento"
    const headerSample = text.split(/\r?\n/)[0] || '';
    const hasReplacement = headerSample.includes('\uFFFD') || headerSample.includes('�') || headerSample.includes('Ã');
    const normalized = headerSample.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const looksRight = /area|departamento|nome|cargo/.test(normalized);
    if (!hasReplacement && looksRight) {
      raw = text;
      chosenEncoding = enc;
      break;
    }
    // Mantém como fallback a última tentativa
    raw = text;
    chosenEncoding = enc;
  }
  console.log(`📑 Codificação escolhida: ${chosenEncoding}`);

  // Heurística simples: conta separadores na primeira linha
  const firstLine = raw.split(/\r?\n/)[0] || '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const delim = semiCount > commaCount ? ';' : ',';
  console.log(`🧪 Delimitador detectado: "${delim}"`);

  const records = [];

  const parser = parse(raw, {
    bom: true,
    columns: false,
    relax_quotes: true,
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: delim
  });

  let headerMap = null;
  let lineNo = 0;

  for await (const row of parser) {
    lineNo++;
    if (lineNo === 1) {
  // Loga os headers exatos para depuração
  console.log('🔎 Cabeçalhos lidos:', row);
  headerMap = mapHeaders(row);
      if (!headerMap || headerMap.nome == null) {
        exitWith('Cabeçalho inválido: não encontrei a coluna de nome do colaborador.');
      }
      if (headerMap.area == null && headerMap.departamento == null) {
        console.warn('⚠️ Não encontrei coluna "Área"; vou usar Departamento como fallback de origem e gravar em Área.');
      }
      console.log('🧭 Mapeamento de colunas:', headerMap);
      continue;
    }

    const nome = row[headerMap.nome] || '';
    const cargo = headerMap.cargo != null ? row[headerMap.cargo] || '' : '';
    const areaRaw = headerMap.area != null ? row[headerMap.area] || '' : '';
    const deptRaw = headerMap.departamento != null ? row[headerMap.departamento] || '' : '';
    const gestor = headerMap.gestor != null ? row[headerMap.gestor] || '' : '';

    if (!nome) continue;
    const area = String(areaRaw || deptRaw || '').trim();

    records.push({
      Colaborador: String(nome).trim(),
      Cargo: String(cargo).trim(),
      'Área': area,
      Gestor: String(gestor).trim()
    });
  }

  console.log(`📄 Linhas para importar: ${records.length}`);
  const col = db.collection('colaboradores');
  let ok = 0, fail = 0;

  for (const rec of records) {
    const id = buildDocId(rec.Colaborador);
    try {
      await col.doc(id).set(rec, { merge: true });
      ok++;
      if (ok % 50 === 0) console.log(`✅ ${ok} documentos gravados...`);
    } catch (e) {
      fail++;
      console.error(`❌ Falha ao gravar ${rec.Colaborador}:`, e.message);
    }
  }

  console.log(`\n✅ Concluído. Sucesso: ${ok} | Falhas: ${fail}`);
}

run().then(() => process.exit(0)).catch(e => {
  console.error('Erro geral:', e);
  process.exit(1);
});
