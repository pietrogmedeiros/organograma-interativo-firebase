// Atualiza o campo "Área" em TODOS os documentos, cruzando pelo nome a partir do CSV
// Uso: npm run update-area -- ./base_atualizada_colaboradores.csv

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const admin = require('firebase-admin');

function exitWith(msg, code = 1) { console.error(msg); process.exit(code); }

// Resolve CSV path
const csvArg = process.argv[2] || './base_atualizada_colaboradores.csv';
const csvPath = path.resolve(csvArg);
if (!fs.existsSync(csvPath)) exitWith(`Arquivo CSV não encontrado: ${csvPath}`);

// Firebase Admin SDK
let serviceAccount;
try { serviceAccount = require('./firebase-adminsdk.json'); }
catch (e) { exitWith('Arquivo firebase-adminsdk.json não encontrado na raiz do projeto.'); }

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function norm(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function mapHeaders(headers) {
  const map = {};
  headers.forEach((h, i) => {
    const n = norm(h).replace(/[^a-z0-9 ]/g,'');
    if (/^(colaborador|nome do colaborador|nome)$/.test(n)) map.nome = i;
    else if (/^(cargo|funcao)$/.test(n)) map.cargo = i;
    else if (n.includes('area')) map.area = i;
    else if (/^(gestor|superior imediato|superior|chefe)$/.test(n)) map.gestor = i;
    else if (n === 'departamento') map.departamento = i;
  });
  return map;
}

async function parseCsvToMap(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const rows = [];
  const parser = parse(raw, { bom: true, columns: false, trim: true, skip_empty_lines: true });
  for await (const row of parser) rows.push(row);
  if (rows.length === 0) exitWith('CSV vazio.');
  const headerMap = mapHeaders(rows[0]);
  if (headerMap.nome == null) exitWith('Cabeçalho inválido: coluna de nome não encontrada.');
  if (headerMap.area == null && headerMap.departamento == null) console.warn('⚠️ CSV sem "Área" nem "Departamento".');

  const mapByName = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const nome = String(row[headerMap.nome] || '').trim();
    if (!nome) continue;
    const area = String((headerMap.area != null ? row[headerMap.area] : row[headerMap.departamento]) || '').trim();
    const cargo = headerMap.cargo != null ? String(row[headerMap.cargo] || '').trim() : '';
    const gestor = headerMap.gestor != null ? String(row[headerMap.gestor] || '').trim() : '';
    mapByName.set(norm(nome), { area, cargo, gestor, nome });
  }
  return mapByName;
}

(async () => {
  console.log('🚀 Atualizando campo "Área" a partir do CSV');
  console.log('CSV:', csvPath);
  const mapByName = await parseCsvToMap(csvPath);
  console.log('📚 Registros no mapa:', mapByName.size);

  const col = db.collection('colaboradores');
  const snap = await col.get();
  console.log('🗄️ Documentos no Firestore:', snap.size);

  let ok = 0, miss = 0, unchanged = 0;
  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const nome = data.Colaborador || data['Nome do Colaborador'] || data.Nome || '';
    const key = norm(nome);
    if (!key) { miss++; continue; }
    const ref = mapByName.get(key);
    if (!ref || !ref.area) { miss++; continue; }
    const atual = (data['Área'] || data.Area || '').trim();
    if (atual === ref.area) { unchanged++; continue; }
    try {
      await doc.ref.set({ 'Área': ref.area }, { merge: true });
      ok++;
      if (ok % 100 === 0) console.log(`✅ ${ok} atualizados...`);
    } catch (e) {
      console.error(`❌ Falha ao atualizar ${nome} (${doc.id}):`, e.message);
    }
  }
  console.log(`\nConcluído. Atualizados: ${ok} | Sem mudança: ${unchanged} | Sem correspondência no CSV/sem área: ${miss}`);
  process.exit(0);
})().catch(e => { console.error('Erro geral:', e); process.exit(1); });
