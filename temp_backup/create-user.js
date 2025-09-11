// create-user.js
const admin = require('firebase-admin');

// Carrega as credenciais do Firebase
const serviceAccount = require('./firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createTestUser() {
    try {
        console.log('🚀 Criando usuário de teste...');
        
        const userRecord = await admin.auth().createUser({
            email: 'admin@webcontinental.com',
            password: 'admin123',
            displayName: 'Administrador',
            emailVerified: true
        });
        
        console.log('✅ Usuário criado com sucesso!');
        console.log('📧 Email: admin@webcontinental.com');
        console.log('🔑 Senha: admin123');
        console.log('🆔 UID:', userRecord.uid);
        
        process.exit(0);
        
    } catch (error) {
        if (error.code === 'auth/email-already-exists') {
            console.log('⚠️ Usuário já existe!');
            console.log('📧 Email: admin@webcontinental.com');
            console.log('🔑 Senha: admin123');
        } else {
            console.error('❌ Erro ao criar usuário:', error);
        }
        process.exit(1);
    }
}

createTestUser();
