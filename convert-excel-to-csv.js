const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

function convertExcelToCsv(excelPath, csvPath) {
  try {
    console.log('🔄 Convertendo Excel para CSV...');
    console.log('📂 Arquivo de origem:', excelPath);
    
    // Lê o arquivo Excel
    const workbook = XLSX.readFile(excelPath);
    
    // Pega a primeira planilha
    const sheetName = workbook.SheetNames[0];
    console.log('📋 Planilha:', sheetName);
    
    const worksheet = workbook.Sheets[sheetName];
    
    // Converte para CSV
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    
    // Salva o arquivo CSV
    fs.writeFileSync(csvPath, csv, 'utf8');
    
    console.log('✅ Conversão concluída!');
    console.log('💾 Arquivo CSV salvo em:', csvPath);
    
    // Mostra uma prévia das primeiras linhas
    const lines = csv.split('\n').slice(0, 5);
    console.log('\n📋 Prévia do conteúdo:');
    lines.forEach((line, i) => {
      if (line.trim()) {
        console.log(`${i + 1}: ${line}`);
      }
    });
    
    return csvPath;
  } catch (error) {
    console.error('❌ Erro na conversão:', error.message);
    process.exit(1);
  }
}

// Verifica argumentos
const excelFile = process.argv[2];
if (!excelFile) {
  console.error('❌ Uso: node convert-excel-to-csv.js <caminho-do-excel>');
  process.exit(1);
}

const excelPath = path.resolve(excelFile);
if (!fs.existsSync(excelPath)) {
  console.error('❌ Arquivo não encontrado:', excelPath);
  process.exit(1);
}

// Define o caminho do CSV de saída
const csvPath = excelPath.replace(/\.xlsx?$/i, '.csv');

convertExcelToCsv(excelPath, csvPath);
