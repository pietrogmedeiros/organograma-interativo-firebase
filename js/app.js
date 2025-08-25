// Firebase modular imports
// Carregamento preguiçoso dos módulos Firebase para evitar bloqueio se algo falhar
let initializeApp, getApps, getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, limit, getAuth, onAuthStateChanged;
async function loadFirebaseModules() {
    if (initializeApp) return true; // já carregado
    console.time('firebase-modular-imports');
    try {
        const [appMod, fsMod, authMod] = await Promise.all([
            import('https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js'),
            import('https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js'),
            import('https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js')
        ]);
        ({ initializeApp, getApps } = appMod);
        ({ getFirestore, collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, limit } = fsMod);
        ({ getAuth, onAuthStateChanged } = authMod);
        console.log('🧩 Firebase módulos carregados.');
        return true;
    } catch(e) {
        console.error('❌ Falha ao carregar módulos Firebase:', e);
        return false;
    } finally {
        console.timeEnd('firebase-modular-imports');
    }
}

// Variáveis globais
let colaboradoresData = [];
let currentHierarchyLevel = 'presidencia';
let currentSelectedPerson = null;
let navigationHistory = [];
let firestoreDb = null;
let firebaseAuth = null;
let dataLoaded = false;
let authInitDone = false; // marca quando o primeiro estado de auth foi resolvido

// ----------------- HELPERS DE NORMALIZAÇÃO -----------------
function getNome(col) {
    if (!col) return '';
    return (col.Colaborador || col.Nome || col['Nome do Colaborador'] || '').trim();
}
function getCargo(col) {
    if (!col) return '';
    return (col.Cargo || '').trim();
}
function getGestor(col) {
    if (!col) return '';
    return (col.Gestor || '').trim();
}
function getArea(col) {
    if (!col) return '';
    // Usa apenas 'Área' (Firebase) com variações, sem fallback para 'Departamento'
    return (col['Área'] || col.Area || col.area || '').trim();
}
function isDiretor(col) {
    const cargo = getCargo(col).toLowerCase();
    return cargo.includes('diretor') || cargo.includes('diretora');
}

function initFirestoreIfNeeded() {
    try {
        if (getApps().length === 0) {
            initializeApp({
                apiKey: "AIzaSyD76HOZNa8yWSVmeJtrkxFmdxtsvlt2arY",
                authDomain: "organograma-empresa.firebaseapp.com",
                projectId: "organograma-empresa",
                storageBucket: "organograma-empresa.firebasestorage.app",
                messagingSenderId: "256795992111",
                appId: "1:256795992111:web:6d8cb3e8e3ea5ae316a6da"
            });
        }
        firestoreDb = getFirestore();
        firebaseAuth = getAuth();
        console.log('🗄️ Firestore (modular) pronto.');
        testFirestorePermissions();
        onAuthStateChanged(firebaseAuth, async (user) => {
            if (user) {
                authInitDone = true;
                console.log('🔐 Auth OK:', user.email);
                if (colaboradoresData.length === 0) {
                    try { await loadInitialData(); } catch(err){ console.error('Erro loadInitialData pós-auth:', err); }
                }
            } else {
                // Durante a fase inicial, o Firebase pode emitir "null" até restaurar a sessão.
        const justLoggedAt = Number(sessionStorage.getItem('justLoggedAt') || '0');
                const withinGrace = justLoggedAt && (Date.now() - justLoggedAt < 10000); // 10s
                if (!authInitDone || withinGrace) {
                    console.log('⏳ Aguardando restauração da sessão de auth...');
                    return; // não redireciona ainda
                }
                // Se há usuário no localStorage, não force redireciono; opere em modo limitado
                try {
                    const localUser = localStorage.getItem('user');
                    if (localUser) {
                        console.warn('🟡 Usuário local presente, mas Firebase ainda não restaurou sessão. Operando com dados locais.');
                        if (!dataLoaded) {
                            try { await loadInitialData(); } catch(e) { console.error('Fallback local falhou', e); }
                        }
                        return;
                    }
                } catch {}
                console.warn('🔓 Sem usuário autenticado. Redirecionando...');
                window.location.href = 'login.html';
            }
        });
    } catch(e) {
        console.warn('Falha init Firebase modular:', e);
    }
}

// Teste simples de permissões: leitura e escrita temporária
async function testFirestorePermissions() {
    if (!firestoreDb) return;
    const permLog = (status, msg, extra) => {
        const prefix = status === 'OK' ? '✅' : status === 'WARN' ? '⚠️' : '❌';
        console.log(prefix + ' [PERMISSOES] ' + msg, extra || '');
    };
    try {
        const q = query(collection(firestoreDb,'colaboradores'), limit(1));
        const snap = await getDocs(q);
        permLog('OK', 'Leitura permitida (collection colaboradores). Docs retornados:', snap.size);
    } catch (err) { classifyFirestoreError(err,'Leitura'); }
    const tempId = '__perm_test__' + Date.now();
    try {
        await setDoc(doc(firestoreDb,'colaboradores', tempId), { _temp:true, ts: Date.now() });
        permLog('OK','Escrita permitida (doc temporário criado).');
        try { await deleteDoc(doc(firestoreDb,'colaboradores', tempId)); permLog('OK','Remoção permitida (doc temporário removido).'); } catch(delErr){ classifyFirestoreError(delErr,'Remoção temporária'); }
    } catch(writeErr) { classifyFirestoreError(writeErr,'Escrita'); }
}

function classifyFirestoreError(err, operacao) {
    const code = err && err.code ? err.code : 'desconhecido';
    let explicacao = '';
    switch(code) {
        case 'permission-denied':
            explicacao = 'Regras de segurança bloquearam a operação. Verifique Firestore Rules e autenticação.'; break;
        case 'unauthenticated':
            explicacao = 'Usuário não autenticado. Necessário login para esta operação.'; break;
        case 'unavailable':
            explicacao = 'Serviço indisponível (talvez offline ou problema de rede).'; break;
        case 'not-found':
            explicacao = 'Documento/coleção não encontrado (pode ser normal em primeiro acesso).'; break;
        case 'deadline-exceeded':
            explicacao = 'Timeout na operação (rede lenta).'; break;
        default:
            explicacao = 'Erro Firestore não categorizado.';
    }
    console.error(`❌ [PERMISSOES] Falha em ${operacao}. Código: ${code}. ${explicacao}`, err);
}

// Modal Add Colaborador refs
let addModal, addForm, btnAddColaborador, btnCancelAdd;
let selectDepartamento, selectGestor;

function setupAddColaboradorModal() {
    addModal = document.getElementById('add-colaborador-modal');
    addForm = document.getElementById('add-colaborador-form');
    btnAddColaborador = document.getElementById('btn-add-colaborador');
    btnCancelAdd = document.getElementById('btn-cancel-add');
    selectDepartamento = document.getElementById('colaborador-departamento');
    selectGestor = document.getElementById('colaborador-gestor');

    if (!addModal || !addForm || !btnAddColaborador) return;

    btnAddColaborador.addEventListener('click', () => {
        populateDepartamentos();
        populateGestores();
        openAddModal();
    });

    btnCancelAdd && btnCancelAdd.addEventListener('click', closeAddModal);

    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('colaborador-nome').value.trim();
        const cargo = document.getElementById('colaborador-cargo').value.trim();
        const departamento = selectDepartamento.value; // mantém o id mas semântica é "Área"
        const gestor = selectGestor.value;
        if (!nome || !cargo || !departamento || !gestor) {
            alert('Preencha todos os campos.');
            return;
        }
    // Persistir somente o campo 'Área' (legado 'Departamento' removido).
    const novo = { Colaborador: nome, Cargo: cargo, 'Área': departamento, Gestor: gestor };
                try {
                    // Atualiza Firestore primeiro
                    if (firestoreDb) {
                        // Gera ID padronizado (minúsculo, sem acentos, apenas [a-z0-9-])
                        const docId = nome
                            .toLowerCase()
                            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, '')
                            .slice(0, 200);
                console.groupCollapsed('📝 Novo Colaborador -> Persistência (modular)');
                console.log('📦 Payload:', novo);
                console.log('🆔 Documento ID:', docId);
                try {
                    await setDoc(doc(firestoreDb,'colaboradores', docId), novo, { merge: true });
                    console.log('💾 setDoc OK');
                } catch(writeErr) { classifyFirestoreError(writeErr,'Escrita (setDoc)'); throw writeErr; }
                try {
                    const snap = await getDoc(doc(firestoreDb,'colaboradores', docId));
                    if (snap.exists()) {
                        console.log('🔍 Confirmação pós-escrita:', snap.data());
                    } else {
                        console.warn('⚠️ Confirmação: documento não encontrado.');
                    }
                } catch(readErr) { classifyFirestoreError(readErr,'Leitura de confirmação'); }
                console.groupEnd();
            } else {
                console.warn('⚠️ Firestore não disponível - somente array local será atualizado.');
            }
            // Atualiza array local somente se Firestore ok ou Firestore ausente
            colaboradoresData.push(novo);
            closeAddModal();
            // Re-renderiza a view atual
            if (!currentSelectedPerson) {
                renderPresidenciaView();
            } else {
                renderHierarchyLevel(currentSelectedPerson, currentHierarchyLevel);
            }
            alert('Colaborador adicionado com sucesso. (Fonte: ' + (firestoreDb ? 'Firestore' : 'Local Temporário') + ')');
        } catch(err) {
            console.error('❌ Erro geral ao adicionar colaborador:', err);
            alert('Erro ao salvar. Verifique o console.');
        }
    });

    // Fechar ao clicar fora
    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) closeAddModal();
    });
}

function openAddModal() {
    addModal.classList.remove('hidden');
}
function closeAddModal() {
    addModal.classList.add('hidden');
    addForm.reset();
}

function populateDepartamentos() {
    if (!selectDepartamento) return;
    const valores = [...new Set(colaboradoresData.map(c => getArea(c)).filter(Boolean).sort((a,b)=> a.localeCompare(b)) )];
    // Limpa mantendo placeholder
    selectDepartamento.innerHTML = '<option value="" disabled selected>Selecione uma área</option>';
    valores.forEach(dep => {
        const opt = document.createElement('option');
        opt.value = dep;
        opt.textContent = dep;
        selectDepartamento.appendChild(opt);
    });
}

function populateGestores() {
    if (!selectGestor) return;
    const gestoresSet = new Set();
    colaboradoresData.forEach(c => {
        const cargoLower = (c.Cargo||'').toLowerCase();
        if (cargoLower.includes('diretor') || cargoLower.includes('gerente') || cargoLower.includes('coordenador') || cargoLower.includes('supervisor') || cargoLower.includes('head') || cargoLower.includes('manager')) {
            gestoresSet.add(c.Colaborador);
        }
    });
    const list = Array.from(gestoresSet).sort((a,b)=> a.localeCompare(b));
    selectGestor.innerHTML = '<option value="" disabled selected>Selecione o superior imediato</option>';
    list.forEach(nome => {
        const opt = document.createElement('option');
        opt.value = nome;
        opt.textContent = nome;
        selectGestor.appendChild(opt);
    });
}

// Função para garantir que o Google Charts está carregado
function ensureGoogleChartsLoaded() {
    return new Promise((resolve) => {
        if (window.google && window.google.charts) {
            resolve();
        } else {
            google.charts.load('current', { packages: ['orgchart'] });
            google.charts.setOnLoadCallback(resolve);
        }
    });
}



// Carregar dados iniciais
async function loadInitialData() {
    try {
    if (dataLoaded) { return; }
        console.log('📊 Carregando dados (Firestore > fallback JSON)...');

        // Se Firestore disponível, tentar buscar
        if (firestoreDb) {
            try {
                const snap = await getDocs(collection(firestoreDb,'colaboradores'));
                const arr = snap.docs.map(d=> d.data());
                if (arr.length > 0) {
                    colaboradoresData = arr;
                    console.log(`✅ ${colaboradoresData.length} colaboradores carregados do Firestore`);
                } else {
                    console.warn('⚠️ Firestore retornou 0 documentos. Usando fallback output.json.');
                    await loadFromLocalJson();
                }
            } catch(fsErr) {
                console.error('❌ Erro lendo Firestore (fallback para JSON):', fsErr);
                await loadFromLocalJson();
            }
        } else {
            await loadFromLocalJson();
        }
        

        
        // Renderizar view inicial
        renderPresidenciaView();
        dataLoaded = true;
        
    } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        setErrorState('Erro ao carregar dados: ' + error.message);
    }
}

async function loadFromLocalJson() {
    console.log('📁 Carregando output.json...');
    const response = await fetch('output.json', { cache: 'no-store' });
    if (!response.ok) {
        throw new Error('Falha ao carregar output.json');
    }
    colaboradoresData = await response.json();
    console.log(`✅ ${colaboradoresData.length} colaboradores carregados do arquivo local`);
}





// Renderizar view da presidência
function renderPresidenciaView() {
    console.log('🎯 Renderizando view da presidência');
    
    const container = document.getElementById('chart-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    const title = document.createElement('h2');
    title.textContent = 'Presidência';
    title.style.cssText = `
        text-align: center;
        margin: 0 0 40px 0;
        font-size: 32px;
        font-weight: 700;
        color: #1e40af;
    `;
    container.appendChild(title);
    
    // Ajustar estado base da hierarquia
    currentHierarchyLevel = 'presidencia';

    // Buscar presidente de forma segura
    const presidente = colaboradoresData.find(col => getCargo(col).toLowerCase().includes('presidente')) || null;

    // Derivar diretores: primeiro todos, depois filtrar diretos
    const todosDiretores = colaboradoresData.filter(isDiretor);
    let diretores = todosDiretores;
    if (presidente) {
        const nomePresidente = getNome(presidente).toLowerCase();
        const diretos = todosDiretores.filter(d => getGestor(d).toLowerCase() === nomePresidente);
        if (diretos.length > 0) diretores = diretos;
        console.log(`👔 Diretores total: ${todosDiretores.length} | Diretos: ${diretos.length} | Exibindo: ${diretores.length}`);
    } else {
        console.warn('⚠️ Presidente não encontrado. Exibindo todos os diretores.');
    }
    
    // Definir currentSelectedPerson para facilitar histórico na primeira navegação
    if (presidente) {
        currentSelectedPerson = presidente;
    } else {
        currentSelectedPerson = null;
    }

    // Card da Presidente (se encontrada)
    if (presidente) {
                        const presidenteContainer = document.createElement('div');
                presidenteContainer.style.cssText = `
                    display: flex;
                    justify-content: center;
                    margin-bottom: 30px;
                `;
        
                            const presidenteCard = document.createElement('div');
                    presidenteCard.style.cssText = `
                        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
                        color: white;
                        border-radius: 20px;
                        padding: 20px;
                        text-align: center;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 8px 30px rgba(96, 165, 250, 0.4);
                        max-width: 300px;
                        width: 100%;
                    `;
        
        const presidenteNome = document.createElement('h3');
    presidenteNome.textContent = getNome(presidente) || 'Presidente';
        presidenteNome.style.cssText = `
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 8px 0;
        `;
        
        const presidenteCargo = document.createElement('p');
    presidenteCargo.textContent = getCargo(presidente) || 'PRESIDENTE';
        presidenteCargo.style.cssText = `
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 6px 0;
            opacity: 0.95;
        `;
        
        const presidenteDept = document.createElement('p');
    presidenteDept.textContent = getArea(presidente) || 'PRESIDENCIA';
        presidenteDept.style.cssText = `
            font-size: 12px;
            opacity: 0.9;
            margin: 0;
        `;
        
        presidenteCard.appendChild(presidenteNome);
        presidenteCard.appendChild(presidenteCargo);
        presidenteCard.appendChild(presidenteDept);
        
        // Adicionar eventos de hover e clique
        presidenteCard.addEventListener('mouseenter', () => {
            presidenteCard.style.transform = 'translateY(-5px)';
            presidenteCard.style.boxShadow = '0 12px 35px rgba(96, 165, 250, 0.5)';
        });
        
        presidenteCard.addEventListener('mouseleave', () => {
            presidenteCard.style.transform = 'translateY(0)';
            presidenteCard.style.boxShadow = '0 8px 30px rgba(96, 165, 250, 0.4)';
        });
        
        presidenteCard.addEventListener('click', () => {
            // Usar forma padronizada 'presidencia' para coerência com levelMap
            navigateToNextLevel(presidente, 'presidencia');
        });
        
        presidenteContainer.appendChild(presidenteCard);
        container.appendChild(presidenteContainer);
    }
    
    // Título dos diretores
    const diretoresTitle = document.createElement('h3');
    diretoresTitle.textContent = 'Diretores';
    diretoresTitle.style.cssText = `
        text-align: center;
        margin: 0 0 20px 0;
        font-size: 24px;
        font-weight: 600;
        color: #374151;
    `;
    container.appendChild(diretoresTitle);
    
    if (!Array.isArray(diretores) || diretores.length === 0) {
        const noData = document.createElement('p');
        noData.textContent = 'Nenhum diretor encontrado.';
        noData.style.cssText = `
            text-align: center;
            color: #64748b;
            font-size: 16px;
            margin-top: 30px;
        `;
        container.appendChild(noData);
        return;
    }

    // Lista branca fornecida pelo usuário
    const listaDiretoresPermitidos = new Set([
        'Diego Calabria',
        'Roger Ricardo Bueno Pinto',
        'Elifas Levi Rocha dos Santos',
        'Guilherme Ricciardi Correa Lopes',
        'Jairo Avritchir',
        'Jefferson dos Santos Melo',
        'Juliano Teles Andriguetti',
        'Vinicius Antoniazi Ungarato'
    ].map(n => n.toLowerCase()));

    const filtradosLista = diretores.filter(d => listaDiretoresPermitidos.has(getNome(d).toLowerCase()));
    if (filtradosLista.length > 0) {
        console.log(`📋 Aplicando filtro lista branca: ${filtradosLista.length}/${diretores.length}`);
        diretores = filtradosLista;
    } else {
        console.warn('⚠️ Lista branca não encontrou correspondências. Mantendo diretores calculados.');
    }
    
    // Container dos diretores em layout horizontal
    const diretoresContainer = document.createElement('div');
    diretoresContainer.style.cssText = `
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        padding: 10px 0;
        max-width: 100%;
        margin: 0 auto;
        justify-content: center;
    `;
    
    diretores.forEach(diretor => {
        const diretorCard = document.createElement('div');
        diretorCard.style.cssText = `
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            border-radius: 12px;
            padding: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            min-height: 120px;
            flex: 1;
            min-width: 180px;
            max-width: 200px;
        `;
        
        const diretorNome = document.createElement('h3');
        diretorNome.textContent = diretor.Colaborador;
        diretorNome.style.cssText = `
            font-size: 14px;
            font-weight: 700;
            margin: 0 0 6px 0;
            line-height: 1.2;
        `;
        
        const diretorCargo = document.createElement('p');
        diretorCargo.textContent = diretor.Cargo;
        diretorCargo.style.cssText = `
            font-size: 11px;
            font-weight: 600;
            margin: 0 0 4px 0;
            opacity: 0.9;
            line-height: 1.3;
        `;
        
        const diretorDept = document.createElement('p');
    diretorDept.textContent = getArea(diretor);
        diretorDept.style.cssText = `
            font-size: 9px;
            opacity: 0.8;
            margin: 0;
            line-height: 1.2;
        `;
        
        diretorCard.appendChild(diretorNome);
        diretorCard.appendChild(diretorCargo);
        diretorCard.appendChild(diretorDept);
        
        // Adicionar eventos de hover e clique
        diretorCard.addEventListener('mouseenter', () => {
            diretorCard.style.transform = 'translateY(-3px)';
            diretorCard.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
        });
        
        diretorCard.addEventListener('mouseleave', () => {
            diretorCard.style.transform = 'translateY(0)';
            diretorCard.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.3)';
        });
        
        diretorCard.addEventListener('click', () => {
            navigateToNextLevel(diretor, 'diretor');
        });
        
        diretoresContainer.appendChild(diretorCard);
    });
    
    container.appendChild(diretoresContainer);
}

// Navegar para o próximo nível hierárquico
function navigateToNextLevel(person, currentLevel) {
    console.log('🎯 DEBUG navigateToNextLevel:', person.Colaborador, 'nível atual:', currentLevel);
    
    // Salvar estado atual no histórico
    if (currentSelectedPerson) {
        navigationHistory.push({
            person: currentSelectedPerson,
            level: currentHierarchyLevel
        });
    } else {
        console.log('ℹ️ Histórico não atualizado pois currentSelectedPerson ainda é null (nível raiz).');
    }
    
    console.log(`🎯 Estado atual: currentHierarchyLevel = ${currentHierarchyLevel}`);
    
    // Determinar próximo nível
    let nextLevel = getNextLevel(currentLevel);
    console.log('🎯 getNextLevel retornou:', nextLevel);
    
    if (nextLevel === 'auto') {
        nextLevel = detectNextLevel(person);
        console.log('🎯 detectNextLevel retornou:', nextLevel);
    }
    
    // Atualizar estado
    currentHierarchyLevel = nextLevel;
    currentSelectedPerson = person;
    console.log('🎯 Estado atualizado - currentHierarchyLevel:', currentHierarchyLevel);
    
    // Renderizar próximo nível usando o nível já atualizado (nextLevel)
    renderHierarchyLevel(person, currentHierarchyLevel);
}

// Determinar próximo nível baseado no nível atual
function getNextLevel(currentLevel) {
    console.log(`🎯 getNextLevel chamado com: ${currentLevel}`);
    const levelMap = {
        'presidencia': 'diretor',
    'presidente': 'diretor', // compatibilidade caso string antiga seja usada
        'diretor': 'auto', // Será determinado automaticamente
        'gerente': 'auto', // Será determinado automaticamente
        'coordenador': 'auto', // Será determinado automaticamente
        'supervisor': 'colaborador'
    };
    const result = levelMap[currentLevel] || 'colaborador';
    console.log(`🎯 getNextLevel retornando: ${result}`);
    return result;
}

// Detectar próximo nível dinamicamente
function detectNextLevel(person) {
    console.log('🔍 DEBUG detectNextLevel:', person.Colaborador);
    
    // Buscar todos os subordinados diretos
    const subordinados = colaboradoresData.filter(col => {
        const gestor = (col.Gestor || '').toLowerCase();
        const nomePessoa = person.Colaborador.toLowerCase();
        const match = gestor.includes(nomePessoa);
        console.log(`🔍 Comparando: "${gestor}" com "${nomePessoa}" = ${match}`);
        return match;
    });
    
    console.log('📊 Subordinados encontrados:', subordinados.length);
    subordinados.forEach((sub, i) => {
        console.log(`${i+1}. ${sub.Colaborador} - ${sub.Cargo} - Gestor: ${sub.Gestor}`);
    });
    
    if (subordinados.length === 0) {
        console.log('❌ Nenhum subordinado encontrado, retornando colaborador');
        return 'colaborador';
    }
    
    // Analisar cargos dos subordinados para determinar o próximo nível
    const cargos = subordinados.map(col => (col.Cargo || '').toLowerCase());
    console.log('🔍 Cargos dos subordinados:', cargos);
    
    // Verificar se há gerentes/heads
    const temGerentes = cargos.some(cargo => 
        cargo.includes('gerente') || 
        cargo.includes('head') || 
        cargo.includes('manager')
    );
    
    // Verificar se há coordenadores
    const temCoordenadores = cargos.some(cargo => 
        cargo.includes('coordenador') || 
        cargo.includes('coordinator')
    );
    
    // Verificar se há supervisores
    const temSupervisores = cargos.some(cargo => 
        cargo.includes('supervisor') || 
        cargo.includes('supervisora')
    );
    
    // Verificar se há diretores (caso raro, mas possível)
    const temDiretores = cargos.some(cargo => 
        cargo.includes('diretor') || 
        cargo.includes('diretora')
    );
    
    console.log('🔍 Análise de cargos:', {
        temDiretores,
        temGerentes,
        temCoordenadores,
        temSupervisores
    });
    
    // Seguir a hierarquia exata: Diretores > Gerentes > Coordenadores > Supervisores > Colaboradores
    if (temDiretores) {
        console.log('🎯 Retornando: diretor');
        return 'diretor';
    }
    if (temGerentes) {
        console.log('🎯 Retornando: gerente');
        return 'gerente';
    }
    if (temCoordenadores) {
        console.log('🎯 Retornando: coordenador');
        return 'coordenador';
    }
    if (temSupervisores) {
        console.log('🎯 Retornando: supervisor');
        return 'supervisor';
    }
    
    console.log('🎯 Retornando: colaborador (fallback)');
    return 'colaborador';
}

// Renderizar nível hierárquico
function renderHierarchyLevel(person, previousLevel) {
    // Guardas defensivos
    if (!person || !(person.Colaborador || person.Nome)) {
        console.warn('⚠️ Pessoa inválida em renderHierarchyLevel; voltando para visão da presidência.');
        return renderPresidenciaView();
    }
    console.log('🎯 DEBUG renderHierarchyLevel:', (person.Colaborador || person.Nome || '—'), 'nível:', currentHierarchyLevel);
    
    const container = document.getElementById('chart-container');
    if (!container) {
        console.error('❌ Container não encontrado!');
        return;
    }
    
    // Limpar container
    container.innerHTML = '';
    
    // Adicionar breadcrumb
    addBreadcrumb(container);
    
    // Usar função genérica para renderizar qualquer nível
    console.log('🎯 Chamando renderSubordinadosView com nível:', currentHierarchyLevel);
    renderSubordinadosView(person, currentHierarchyLevel);
}

// Função genérica para renderizar qualquer nível
function renderSubordinadosView(pessoa, nivelAtual) {
    console.log('🎯 DEBUG renderSubordinadosView:', (pessoa && (pessoa.Colaborador || pessoa.Nome)) || '—', 'nível:', nivelAtual);
    
    const container = document.getElementById('chart-container');
    if (!container) return;
    
    // Buscar subordinados diretos
    const subordinados = colaboradoresData.filter(col => {
        const gestor = String(col && col.Gestor || '').toLowerCase();
        const nomePessoa = String((pessoa && (pessoa.Colaborador || pessoa.Nome)) || '').toLowerCase();
        return nomePessoa && gestor.includes(nomePessoa);
    });
    
    console.log(`📊 Subordinados encontrados: ${subordinados.length}`, subordinados);
    
    // Título genérico - mostrar todos os subordinados
    const title = document.createElement('h2');
    title.textContent = `Subordinados - ${(pessoa && (pessoa.Colaborador || pessoa.Nome)) || '—'}`;
    title.style.cssText = `
        text-align: center;
        margin: 0 0 30px 0;
        font-size: 28px;
        font-weight: 700;
        color: #1e40af;
    `;
    container.appendChild(title);
    
    // Card da pessoa atual (contexto)
    const pessoaCard = document.createElement('div');
    const cores = {
        'diretor': 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
        'gerente': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'coordenador': 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'supervisor': 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        'colaborador': 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
    };
    
    pessoaCard.style.cssText = `
        background: ${cores[nivelAtual] || cores['colaborador']};
        color: white;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        margin-bottom: 30px;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
    `;
    
    const pessoaNome = document.createElement('h3');
    pessoaNome.textContent = (pessoa && (pessoa.Colaborador || pessoa.Nome)) || '';
    pessoaNome.style.cssText = `
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 8px 0;
    `;
    
    const pessoaCargo = document.createElement('p');
    pessoaCargo.textContent = pessoa.Cargo;
    pessoaCargo.style.cssText = `
        font-size: 14px;
        font-weight: 600;
        margin: 0;
        opacity: 0.9;
    `;
    
    pessoaCard.appendChild(pessoaNome);
    pessoaCard.appendChild(pessoaCargo);
    container.appendChild(pessoaCard);
    
    if (subordinados.length === 0) {
        const noData = document.createElement('p');
    noData.textContent = `Nenhum subordinado encontrado para ${(pessoa && (pessoa.Colaborador || pessoa.Nome)) || '—'}.`;
        noData.style.cssText = `
            text-align: center;
            color: #64748b;
            font-size: 16px;
            margin-top: 30px;
        `;
        container.appendChild(noData);
        return;
    }
    
    // Agrupar subordinados por tipo de cargo
    const diretores = subordinados.filter(col => {
        const cargo = (col.Cargo || '').toLowerCase();
        return cargo.includes('diretor') || cargo.includes('diretora');
    });
    
    const gerentes = subordinados.filter(col => {
        const cargo = (col.Cargo || '').toLowerCase();
        return cargo.includes('gerente') || cargo.includes('head') || cargo.includes('manager');
    });
    
    const coordenadores = subordinados.filter(col => {
        const cargo = (col.Cargo || '').toLowerCase();
        return cargo.includes('coordenador') || cargo.includes('coordinator');
    });
    
    const supervisores = subordinados.filter(col => {
        const cargo = (col.Cargo || '').toLowerCase();
        return cargo.includes('supervisor') || cargo.includes('supervisora');
    });
    
    const colaboradores = subordinados.filter(col => {
        const cargo = (col.Cargo || '').toLowerCase();
        return !cargo.includes('diretor') && 
               !cargo.includes('gerente') && 
               !cargo.includes('head') && 
               !cargo.includes('manager') &&
               !cargo.includes('coordenador') && 
               !cargo.includes('coordinator') &&
               !cargo.includes('supervisor') && 
               !cargo.includes('supervisora');
    });
    
    // Renderizar cada grupo em ordem hierárquica
    if (diretores.length > 0) {
        renderGrupoSubordinados(container, diretores, 'diretor', pessoa);
    }
    
    if (gerentes.length > 0) {
        renderGrupoSubordinados(container, gerentes, 'gerente', pessoa);
    }
    
    if (coordenadores.length > 0) {
        renderGrupoSubordinados(container, coordenadores, 'coordenador', pessoa);
    }
    
    if (supervisores.length > 0) {
        renderGrupoSubordinados(container, supervisores, 'supervisor', pessoa);
    }
    
    if (colaboradores.length > 0) {
        renderGrupoSubordinados(container, colaboradores, 'colaborador', pessoa);
    }
}

// Renderizar grupo de subordinados
function renderGrupoSubordinados(container, subordinados, tipo, gestor) {
    // --- Título do grupo ---
    const titulos = {
        'diretor': 'Diretores',
        'gerente': 'Gerentes',
        'coordenador': 'Coordenadores',
        'supervisor': 'Supervisores',
        'colaborador': 'Colaboradores'
    };

    const titulo = document.createElement('h3');
    titulo.textContent = titulos[tipo] || 'Grupo';
    titulo.style.cssText = `
        font-size: 20px;
        font-weight: 600;
        color: #374151;
        margin: 30px 0 15px 0;
        text-align: center;
    `;
    container.appendChild(titulo);

    // --- Container dos subordinados ---
    const subordinadosContainer = document.createElement('div');

    // Regras de layout horizontal
    const isGerente = tipo === 'gerente';
    const isCoordenador = tipo === 'coordenador';
    let aplicarHorizontal = false;

    if (isGerente) {
        aplicarHorizontal = true; // Gerentes sempre horizontais
    } else if (isCoordenador) {
        // Coordenadores só horizontais se não houver gerentes renderizados
        const jaTemGerentes = container.querySelector('.gerentes-section, .gerente-card');
        if (!jaTemGerentes) aplicarHorizontal = true;
    }

    if (aplicarHorizontal) {
        // Layout horizontal contínuo (mantido)
        subordinadosContainer.className = `${isGerente ? 'gerentes-section' : 'coordenadores-section'} horizontal-level`;
        subordinadosContainer.setAttribute('data-count', subordinados.length.toString());
    } else if (tipo === 'colaborador') {
        subordinadosContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            padding: 20px 0;
            justify-items: center;
            justify-content: center;
            max-width: 100%;
        `;
    } else if (tipo === 'supervisor') {
        subordinadosContainer.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 20px 0;
            justify-items: center;
            max-width: 800px;
            margin: 0 auto;
        `;
    } else {
        // Gerentes / Coordenadores em layout responsivo quebrando linhas equilibradas
        const count = subordinados.length;
        let template = 'repeat(auto-fit, minmax(250px, 1fr))';
        // Ajuste específico para 5 itens: 2 + 3 linhas centralizadas
        if (count === 5) {
            // Usar grid com 3 colunas e centralizar primeira linha (2 itens)
            template = 'repeat(3, 1fr)';
            subordinadosContainer.style.cssText = `
                display: grid;
                grid-template-columns: ${template};
                gap: 24px 28px;
                padding: 28px 20px 30px 20px;
                max-width: 1100px;
                margin: 0 auto;
                justify-items: center;
                align-items: stretch;
            `;
        } else if (count === 4) {
            template = 'repeat(2, 1fr)';
            subordinadosContainer.style.cssText = `
                display: grid;
                grid-template-columns: ${template};
                gap: 28px;
                padding: 28px 10px 30px 10px;
                max-width: 900px;
                margin: 0 auto;
                justify-items: center;
            `;
        } else if (count <= 6) {
            // 3 colunas até 6 itens
            template = 'repeat(3, 1fr)';
            subordinadosContainer.style.cssText = `
                display: grid;
                grid-template-columns: ${template};
                gap: 24px 28px;
                padding: 24px 10px 30px 10px;
                max-width: 1200px;
                margin: 0 auto;
                justify-items: center;
            `;
        } else if (count === 7) {
            // 7: 4 + 3
            template = 'repeat(4, 1fr)';
            subordinadosContainer.style.cssText = `
                display: grid;
                grid-template-columns: ${template};
                gap: 22px 26px;
                padding: 26px 12px 32px 12px;
                max-width: 1400px;
                margin: 0 auto;
                justify-items: center;
            `;
        } else {
            subordinadosContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 22px 26px;
                padding: 24px 0 30px 0;
                max-width: 1400px;
                margin: 0 auto;
                justify-items: center;
            `;
        }
    }

    // --- Renderização dos cards ---
    subordinados.forEach(sub => {
        // Mapear estilo para diretor (usa estilo de gerente se não houver caso específico)
        const tipoCard = (sub.Cargo || '').toLowerCase().includes('diretor') && tipo === 'diretor' ? 'gerente' : tipo;
        const card = createColaboradorCard(sub, tipoCard);
        card.classList.add(`${tipo}-card`);

        // Clique para navegar
        card.addEventListener('click', () => {
            navigateToNextLevel(sub, tipo);
        });

        subordinadosContainer.appendChild(card);
    });

    container.appendChild(subordinadosContainer);
}

// Criar card de colaborador
function createColaboradorCard(colaborador, tipo) {
    const nome = (colaborador.Colaborador || colaborador.Nome || colaborador['Nome do Colaborador'] || '').trim();
    const cargo = (colaborador.Cargo || '').trim();
    const departamento = getArea(colaborador);
    
    const card = document.createElement('div');
    card.className = `colaborador-card ${tipo}-card`;
    
    // Definir estilos baseados no tipo
    let cardStyles, nomeStyles, cargoStyles, deptStyles, hoverShadow;
    
    switch(tipo) {
        case 'gerente':
            cardStyles = `
                min-width: 220px;
                max-width: 280px;
                padding: 18px;
                background: linear-gradient(135deg, #eff6ff, #dbeafe);
                border: 3px solid #3b82f6;
                box-shadow: 0 6px 16px rgba(59, 130, 246, 0.25);
                border-radius: 12px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            nomeStyles = `
                font-weight: 700;
                font-size: 15px;
                color: #1e40af;
                margin-bottom: 8px;
                line-height: 1.2;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            cargoStyles = `
                font-size: 13px;
                color: #3730a3;
                font-weight: 600;
                line-height: 1.3;
                margin-bottom: 6px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            deptStyles = `
                font-size: 11px;
                color: #6366f1;
                font-weight: 500;
                line-height: 1.2;
                padding: 3px 8px;
                background: rgba(99, 102, 241, 0.1);
                border-radius: 6px;
                margin-top: 6px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            hoverShadow = '0 8px 24px rgba(59, 130, 246, 0.35)';
            break;
            
        case 'coordenador':
            cardStyles = `
                min-width: 200px;
                max-width: 250px;
                padding: 16px;
                background: linear-gradient(135deg, #f0fdfa, #ccfbf1);
                border: 2px solid #06b6d4;
                box-shadow: 0 4px 14px rgba(6, 182, 212, 0.2);
                border-radius: 10px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            nomeStyles = `
                font-weight: 700;
                font-size: 14px;
                color: #0f766e;
                margin-bottom: 6px;
                line-height: 1.2;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            cargoStyles = `
                font-size: 12px;
                color: #0d9488;
                font-weight: 600;
                line-height: 1.3;
                margin-bottom: 4px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            deptStyles = `
                font-size: 10px;
                color: #0891b2;
                font-weight: 500;
                line-height: 1.2;
                padding: 2px 6px;
                background: rgba(6, 182, 212, 0.1);
                border-radius: 4px;
                margin-top: 4px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            hoverShadow = '0 6px 20px rgba(6, 182, 212, 0.3)';
            break;
            
        case 'supervisor':
            cardStyles = `
                min-width: 180px;
                max-width: 220px;
                padding: 14px;
                background: linear-gradient(135deg, #fefce8, #fef3c7);
                border: 2px solid #f59e0b;
                box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
                border-radius: 9px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            nomeStyles = `
                font-weight: 600;
                font-size: 13px;
                color: #92400e;
                margin-bottom: 6px;
                line-height: 1.2;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            cargoStyles = `
                font-size: 11px;
                color: #a16207;
                font-weight: 500;
                line-height: 1.3;
                margin-bottom: 4px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            deptStyles = `
                font-size: 9px;
                color: #d97706;
                font-weight: 500;
                line-height: 1.2;
                padding: 2px 6px;
                background: rgba(245, 158, 11, 0.1);
                border-radius: 4px;
                margin-top: 4px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            hoverShadow = '0 5px 18px rgba(245, 158, 11, 0.3)';
            break;
            
        case 'colaborador':
            cardStyles = `
                min-width: 180px;
                max-width: 220px;
                padding: 12px;
                background: linear-gradient(135deg, #f9fafb, #f3f4f6);
                border: 2px solid #d1d5db;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
                height: 100%;
                display: flex;
                flex-direction: column;
                justify-content: center;
                min-height: 120px;
            `;
            nomeStyles = `
                font-weight: 600;
                font-size: 11px;
                color: #374151;
                margin-bottom: 3px;
                line-height: 1.2;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            cargoStyles = `
                font-size: 9px;
                color: #6b7280;
                font-weight: 500;
                line-height: 1.3;
                margin-bottom: 2px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            deptStyles = `
                font-size: 7px;
                color: #9ca3af;
                font-weight: 500;
                line-height: 1.2;
                padding: 1px 3px;
                background: rgba(156, 163, 175, 0.1);
                border-radius: 2px;
                margin-top: 2px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            hoverShadow = '0 4px 15px rgba(0, 0, 0, 0.15)';
            break;
            
        default:
            cardStyles = `
                min-width: 200px;
                max-width: 250px;
                padding: 16px;
                background: white;
                border: 2px solid #e5e7eb;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                border-radius: 10px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            nomeStyles = `
                font-weight: 600;
                font-size: 14px;
                color: #1f2937;
                margin-bottom: 6px;
                line-height: 1.2;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            cargoStyles = `
                font-size: 12px;
                color: #6b7280;
                font-weight: 500;
                line-height: 1.3;
                margin-bottom: 4px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            deptStyles = `
                font-size: 10px;
                color: #9ca3af;
                font-weight: 500;
                line-height: 1.2;
                padding: 2px 6px;
                background: rgba(156, 163, 175, 0.1);
                border-radius: 4px;
                margin-top: 4px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            hoverShadow = '0 6px 18px rgba(0, 0, 0, 0.15)';
    }
    
    card.style.cssText = cardStyles;
    
    const nomeElement = document.createElement('h3');
    nomeElement.textContent = nome;
    nomeElement.style.cssText = nomeStyles;
    
    const cargoElement = document.createElement('p');
    cargoElement.textContent = cargo;
    cargoElement.style.cssText = cargoStyles;
    
    const deptElement = document.createElement('p');
    deptElement.textContent = departamento;
    deptElement.style.cssText = deptStyles;
    
    card.appendChild(nomeElement);
    card.appendChild(cargoElement);
    card.appendChild(deptElement);
    
    return card;
}

// Criar visualização hierárquica
function createHierarchicalView(container, colaboradores, deptName) {
    const title = document.createElement('h3');
    title.textContent = `Estrutura Hierárquica - ${deptName}`;
    title.style.cssText = `
        text-align: center;
        margin: 20px 0;
        font-size: 20px;
        font-weight: 600;
        color: #374151;
    `;
    container.appendChild(title);
    
    // Função para determinar prioridade do cargo
    const getPriority = (cargo) => {
        const cargoLower = cargo.toLowerCase();
        if (cargoLower.includes('diretor')) return 1;
        if (cargoLower.includes('gerente') || cargoLower.includes('head') || cargoLower.includes('manager')) return 2;
        if (cargoLower.includes('coordenador') || cargoLower.includes('coordinator')) return 3;
        if (cargoLower.includes('supervisor')) return 4;
        return 5; // colaboradores
    };
    
    // Ordenar colaboradores por prioridade
    const sortedColaboradores = colaboradores.sort((a, b) => {
        return getPriority(a.Cargo) - getPriority(b.Cargo);
    });
    
    // Criar visualização em cards
    const cardsContainer = document.createElement('div');
    cardsContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        padding: 20px 0;
    `;
    
    sortedColaboradores.forEach(colaborador => {
        const card = createColaboradorCard(colaborador, 'default');
        cardsContainer.appendChild(card);
    });
    
    container.appendChild(cardsContainer);
}



function setLoadingState(message) {
    const container = document.getElementById('chart-container');
    if (container) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #64748b;">${message}</div>`;
    }
}

function setErrorState(message) {
    const container = document.getElementById('chart-container');
    if (container) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #dc2626;">❌ ${message}</div>`;
    }
}

function setReadyState(message) {
    const container = document.getElementById('chart-container');
    if (container) {
        container.innerHTML = `<div style="text-align: center; padding: 40px; color: #059669;">✅ ${message}</div>`;
    }
}

// Função para fazer logout
// Adicionar breadcrumb
function addBreadcrumb(container) {
    const breadcrumb = document.createElement('div');
    breadcrumb.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 20px;
        padding: 15px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
    `;
    
    const backButton = document.createElement('button');
    backButton.textContent = '← Voltar';
    backButton.style.cssText = `
        background: #3b82f6;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: background 0.2s;
    `;
    
    backButton.addEventListener('mouseenter', () => {
        backButton.style.background = '#2563eb';
    });
    
    backButton.addEventListener('mouseleave', () => {
        backButton.style.background = '#3b82f6';
    });
    
    backButton.addEventListener('click', goBack);
    
    const path = document.createElement('span');
    path.textContent = `Presidência > ${currentSelectedPerson ? currentSelectedPerson.Colaborador : ''}`;
    path.style.cssText = `
        color: #64748b;
        font-size: 14px;
    `;
    
    breadcrumb.appendChild(backButton);
    breadcrumb.appendChild(path);
    container.appendChild(breadcrumb);
}

// Voltar para nível anterior
function goBack() {
    if (navigationHistory.length === 0) {
        // Se não há histórico, voltar para a presidência
        loadInitialData();
        return;
    }
    
    const previousLevel = navigationHistory.pop();
    if (!previousLevel || !previousLevel.person) {
        console.warn('⚠️ Nível anterior inválido ou sem pessoa. Recarregando raiz.');
        loadInitialData();
        return;
    }
    currentSelectedPerson = previousLevel.person;
    currentHierarchyLevel = previousLevel.level;

    console.log('⬅️ Voltando para:', currentSelectedPerson.Colaborador, 'nível:', currentHierarchyLevel);

    // Se voltamos para a presidência, renderizar visão raiz especial
    if (currentHierarchyLevel === 'presidencia' || currentHierarchyLevel === 'presidente') {
        renderPresidenciaView();
        return;
    }

    try {
        renderHierarchyLevel(currentSelectedPerson, currentHierarchyLevel);
    } catch (err) {
        console.error('❌ Erro ao renderizar nível anterior. Recarregando raiz.', err);
        loadInitialData();
    }
}

function handleLogout() {
    console.log('🚪 Fazendo logout...');
    
    // Limpar dados da sessão (se houver)
    sessionStorage.clear();
    localStorage.removeItem('user');
    
    // Mostrar mensagem de confirmação
    if (confirm('Tem certeza que deseja sair?')) {
        // Redirecionar para a página de login
        window.location.href = 'login.html';
    }
}

// Função para verificar se o usuário está logado
function checkAuthStatus() {
    // Apenas verifica presença, sem redirecionar imediatamente
    const user = localStorage.getItem('user');
    return !!user;
}

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando aplicação (fase UI)...');
    // Não redireciona aqui; aguarda o onAuthStateChanged concluir a restauração
    await ensureGoogleChartsLoaded();
    setupAddColaboradorModal();
    const firebaseOk = await loadFirebaseModules();
    if (!firebaseOk) {
        console.warn('⚠️ Não foi possível carregar Firebase - usando dados locais.');
        await loadInitialData();
        return;
    }
    initFirestoreIfNeeded();
    const logoutButton = document.getElementById('btn-logout');
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    console.log('✅ UI pronta. Aguardando Firestore/Auth para carregar dados.');
    // Fallback: se em 5000ms nenhum dado carregado, usa dados locais
    setTimeout(async () => {
        if (!dataLoaded) {
            console.warn('⏱️ Timeout de auth/Firestore - carregando fallback local.');
            await loadInitialData();
        }
    }, 5000);
});