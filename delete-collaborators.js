// Remove colaboradores pelo campo 'Colaborador' e por possíveis variações de ID
// Uso: npm run delete-collaborators -- "Nome 1" "Nome 2" ...

const admin = require('firebase-admin');

function exitWith(msg, code = 1) { console.error(msg); process.exit(code); }

let serviceAccount;
try {
  serviceAccount = require('./firebase-adminsdk.json');
} catch (e) {
  exitWith('Arquivo firebase-adminsdk.json não encontrado na raiz do projeto.');
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function buildDocIdStrict(nome) {
  return String(nome || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 200);
}

function buildDocIdSimple(nome) {
  return String(nome || '').toLowerCase().replace(/\s+/g, '-');
}

function normName(s) {
  return String(s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

async function deleteForName(name) {
  const col = db.collection('colaboradores');
  // 0) Se o argumento for um ID válido, tentar deletar diretamente
  try {
    const directRef = col.doc(name);
    const directSnap = await directRef.get();
    if (directSnap.exists) {
      await directRef.delete();
      console.log(`🗑️  Deletado por ID direto: ${name}`);
      return 1;
    }
  } catch (e) {
    console.warn(`⚠️  Falha ao tentar deletar ID direto ${name}: ${e.message}`);
  }
  const idsToTry = [buildDocIdSimple(name), buildDocIdStrict(name)];
  let deleted = 0;

  // 1) Tenta por possíveis IDs
  for (const id of idsToTry) {
    try {
      const ref = col.doc(id);
      const snap = await ref.get();
      if (snap.exists) {
        await ref.delete();
        console.log(`🗑️  Deletado por ID: ${id} (nome: ${name})`);
        deleted++;
      }
    } catch (e) {
      console.warn(`⚠️  Falha ao tentar deletar ID ${id}: ${e.message}`);
    }
  }

  // 2) Deleta por query (Colaborador == name)
  try {
    const q = await col.where('Colaborador', '==', name).get();
    if (!q.empty) {
      for (const d of q.docs) {
        await col.doc(d.id).delete();
        console.log(`🗑️  Deletado por query: ${d.id} (Colaborador == ${name})`);
        deleted++;
      }
    }
  } catch (e) {
    console.warn(`⚠️  Falha na query para ${name}: ${e.message}`);
  }

  // 2b) Deleta por query (Nome do Colaborador == name)
  try {
    const q2 = await col.where('Nome do Colaborador', '==', name).get();
    if (!q2.empty) {
      for (const d of q2.docs) {
        await col.doc(d.id).delete();
        console.log(`🗑️  Deletado por query: ${d.id} (Nome do Colaborador == ${name})`);
        deleted++;
      }
    }
  } catch (e) {
    console.warn(`⚠️  Falha na query (Nome do Colaborador) para ${name}: ${e.message}`);
  }

  // 3) Fallback: varredura e deleção por nome normalizado
  try {
    const normTarget = normName(name);
    const snapAll = await col.get();
    for (const d of snapAll.docs) {
      const data = d.data() || {};
      const colab = data.Colaborador || data['Nome do Colaborador'] || data.Nome || '';
      if (normName(colab) === normTarget) {
        await col.doc(d.id).delete();
        console.log(`🗑️  Deletado por varredura: ${d.id} (Colaborador == ${colab})`);
        deleted++;
      }
    }
  } catch (e) {
    console.warn(`⚠️  Falha na varredura para ${name}: ${e.message}`);
  }

  return deleted;
}

async function run() {
  const names = process.argv.slice(2);
  if (!names.length) exitWith('Informe ao menos um nome: npm run delete-collaborators -- "Fulano" "Ciclano"');

  console.log('🔎 Nomes para excluir:', names);
  let total = 0;
  for (const n of names) {
    total += await deleteForName(n);
  }
  console.log(`\n✅ Remoção concluída. Registros deletados (somando tentativas por ID e por query): ${total}`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
