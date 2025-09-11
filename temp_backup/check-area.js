const admin = require('firebase-admin');

let serviceAccount;
try { serviceAccount = require('./firebase-adminsdk.json'); }
catch (e) { console.error('Arquivo firebase-adminsdk.json não encontrado.'); process.exit(1); }

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

(async () => {
  console.log('🔎 Verificando documentos sem "Área"...');
  const snap = await db.collection('colaboradores').get();
  const missing = [];
  for (const doc of snap.docs) {
    const d = doc.data() || {};
    const area = (d['Área'] || d.Area || d.area || '').toString().trim();
    if (!area) missing.push({ id: doc.id, nome: d.Colaborador || d['Nome do Colaborador'] || d.Nome || '' });
  }
  console.log(`📊 Sem Área: ${missing.length} de ${snap.size}`);
  if (missing.length) {
    console.log('— Lista (id | nome):');
    missing.slice(0, 100).forEach(x => console.log(`${x.id} | ${x.nome}`));
    if (missing.length > 100) console.log(`... (+${missing.length - 100} restantes)`);
  }
  process.exit(0);
})().catch(e => { console.error('❌ Erro na verificação:', e); process.exit(1); });
