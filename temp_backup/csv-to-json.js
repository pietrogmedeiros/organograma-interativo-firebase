const fs = require('fs');

// Função para converter CSV para JSON
function csvToJson(csvFilePath, outputPath) {
    try {
        // Lê o arquivo CSV
        const csvData = fs.readFileSync(csvFilePath, 'utf8');
        const lines = csvData.split('\n').filter(line => line.trim());
        
        // Primeira linha são os headers
        const headers = lines[0].split(',').map(h => h.trim());
        console.log('Headers encontrados:', headers);
        
        const jsonData = [];
        
        // Processa cada linha (pula o header)
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            
            if (values.length >= headers.length && values[0]) {
                const obj = {};
                
                // Mapeia os headers para as propriedades esperadas
                obj.Colaborador = values[0] || '';
                obj.Cargo = values[1] || '';
                obj.Departamento = values[2] || '';
                obj['Superior imediato'] = values[3] || '';
                obj['Área'] = values[4] || '';
                
                jsonData.push(obj);
                console.log(`✅ Processado: ${obj.Colaborador}`);
            }
        }
        
        // Salva o JSON
        fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
        console.log(`\n🚀 Conversão concluída! ${jsonData.length} colaboradores salvos em ${outputPath}`);
        
        return jsonData;
        
    } catch (error) {
        console.error('❌ Erro na conversão:', error);
    }
}

// Executa a conversão
const csvFile = './exemplo-colaboradores.csv'; // ou o nome do seu arquivo CSV
const outputFile = './output.json';

csvToJson(csvFile, outputFile);