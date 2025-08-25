// update-specific-collaborator.js
const admin = require('firebase-admin');

// Carrega as credenciais do Firebase
const serviceAccount = require('./firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateCollaborator() {
    try {
        console.log('🔄 Atualizando colaborador...');
        
        const docId = 'guilherme-bauce-machado';
        const newCargo = 'GERENTE DE SUSTENTACAO E OPERACOES DE TI';
        
        // Primeiro, vamos verificar os dados atuais
        const docRef = db.collection('colaboradores').doc(docId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            console.error('❌ Colaborador não encontrado:', docId);
            process.exit(1);
        }
        
        const currentData = doc.data();
        console.log('📋 Dados atuais:');
        console.log('   Nome:', currentData.Colaborador);
        console.log('   Cargo atual:', currentData.Cargo);
        console.log('   Área:', currentData.Área);
        console.log('   Gestor:', currentData.Gestor);
        
        // Atualiza apenas o campo Cargo
        await docRef.update({
            Cargo: newCargo
        });
        
        console.log('✅ Cargo atualizado com sucesso!');
        console.log('🔄 Novo cargo:', newCargo);
        
        // Verifica a atualização
        const updatedDoc = await docRef.get();
        const updatedData = updatedDoc.data();
        console.log('\n📋 Dados após atualização:');
        console.log('   Nome:', updatedData.Colaborador);
        console.log('   Cargo:', updatedData.Cargo);
        console.log('   Área:', updatedData.Área);
        console.log('   Gestor:', updatedData.Gestor);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro ao atualizar colaborador:', error);
        process.exit(1);
    }
}

updateCollaborator();
