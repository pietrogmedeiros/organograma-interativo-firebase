// Script para remover o campo legado "Departamento" de todos os documentos da coleção 'colaboradores'
// Uso: npm run remove-departamento

const admin = require('firebase-admin');

let serviceAccount;
try {
  serviceAccount = require('./firebase-adminsdk.json');
} catch (e) {
  console.error('Arquivo firebase-adminsdk.json não encontrado na raiz do projeto.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function run() {
  console.log('🧹 Removendo campo legado "Departamento" dos documentos de colaboradores...');
  const col = db.collection('colaboradores');
  const snap = await col.get();
  console.log(`Documentos encontrados: ${snap.size}`);

  let ok = 0, fail = 0;
  for (const doc of snap.docs) {
    try {
      await col.doc(doc.id).update({ Departamento: admin.firestore.FieldValue.delete() });
      ok++;
      if (ok % 100 === 0) console.log(`✅ ${ok} documentos atualizados...`);
    } catch (e) {
      fail++;
      console.error(`❌ Falha ao atualizar ${doc.id}:`, e.message);
    }
  }
  console.log(`\nConcluído. Sucesso: ${ok} | Falhas: ${fail}`);
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
