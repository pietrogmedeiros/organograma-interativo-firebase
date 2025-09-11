const admin = require('firebase-admin');

function exitWith(msg, code=1){ console.error(msg); process.exit(code); }

let serviceAccount;
try { serviceAccount = require('./firebase-adminsdk.json'); }
catch(e){ exitWith('Arquivo firebase-adminsdk.json não encontrado.'); }

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function buildId(nome){
  return String(nome||'')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,'-')
    .replace(/[^a-z0-9-]/g,'')
    .slice(0,200);
}

(async ()=>{
  const [nome, cargo='Analista', area='TESTE', gestor=''] = process.argv.slice(2);
  if(!nome) exitWith('Uso: npm run add-collaborator -- "Nome" [Cargo] [Área] [Gestor]');
  const doc = { Colaborador: nome, Cargo: cargo, 'Área': area, Gestor: gestor };
  const id = buildId(nome);
  await db.collection('colaboradores').doc(id).set(doc, { merge: true });
  console.log('✅ Colaborador criado/atualizado:', id, doc);
  process.exit(0);
})().catch(e=>{ console.error('❌ Erro:', e); process.exit(1); });
