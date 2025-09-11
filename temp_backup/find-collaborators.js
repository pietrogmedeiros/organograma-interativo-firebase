// Lista colaboradores que "batem" com os termos fornecidos (por nome)
// Uso: node find-collaborators.js "Teste" "Fulano" ...

const admin = require('firebase-admin');

let serviceAccount = require('./firebase-adminsdk.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();}

(async ()=>{
  const terms = process.argv.slice(2);
  if (!terms.length) { console.log('Informe termos (ex: node find-collaborators.js "Teste" "Fulano")'); process.exit(0); }
  const normTerms = terms.map(norm);
  const snap = await db.collection('colaboradores').get();
  let found = [];
  for (const d of snap.docs) {
    const data = d.data()||{};
    const nome = data.Colaborador || data.Nome || '';
    const n = norm(nome);
    if (normTerms.some(t => n === t || n.includes(t))) {
      found.push({ id: d.id, nome, area: data['Área']||data.area||'', cargo: data.Cargo||'' });
    }
  }
  console.log('Resultados:', found.length);
  found.slice(0,100).forEach(r=> console.log(`- ${r.id} | ${r.nome} | ${r.cargo} | ${r.area}`));
})();
