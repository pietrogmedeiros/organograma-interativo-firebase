const admin = require('firebase-admin');
const fs = require('fs');

// Carrega as credenciais do Firebase
const serviceAccount = require('./firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function seedFromCSV() {
    try {
        console.log('🚀 Iniciando migração do CSV para Firestore...');
        
        // Lê e converte o CSV
        const csvData = fs.readFileSync('./exemplo-colaboradores.csv', 'utf8');
        const lines = csvData.split('\n').filter(line => line.trim());
        
        console.log(`📄 Encontradas ${lines.length - 1} linhas de dados`);
        
        // Processa cada linha (pula o header)
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            if (values.length >= 5 && values[0]) {
                const colaborador = {
                    Colaborador: values[0],
                    Cargo: values[1],
                    Departamento: values[2],
                    'Superior imediato': values[3],
                    'Área': values[4]
                };
                
                // Cria ID único baseado no nome
                const docId = colaborador.Colaborador
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, '');
                
                await db.collection('colaboradores').doc(docId).set(colaborador);
                console.log(`✅ ${colaborador.Colaborador} adicionado`);
            }
        }
        
        console.log('\n🎉 Migração concluída com sucesso!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
}

seedFromCSV();