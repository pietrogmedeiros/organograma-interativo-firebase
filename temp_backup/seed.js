// seed.js
const admin = require('firebase-admin');

// ATENÇÃO: O próximo passo é sobre este arquivo JSON!
const serviceAccount = require('./firebase-adminsdk.json'); 
const data = require('./output.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const colaboradoresCollection = db.collection('colaboradores');

async function seedDatabase() {
  try {
    console.log('Iniciando a migração dos dados para o Firestore...');
    
    for (const colaborador of data) {
      // Usamos o nome como ID para evitar duplicatas e facilitar a busca
      // Substituímos espaços por hífens e colocamos em minúsculo
      const docId = colaborador.Colaborador.replace(/\s+/g, '-').toLowerCase(); 
      await colaboradoresCollection.doc(docId).set(colaborador);
      console.log(`✅  Colaborador "${colaborador.Colaborador}" adicionado.`);
    }

    console.log('\n🚀 Migração concluída com sucesso! Seus dados estão no Firestore.');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
  }
}

seedDatabase();