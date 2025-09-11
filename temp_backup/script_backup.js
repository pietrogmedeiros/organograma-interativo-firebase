// js/script.js - VERSÃO FINAL FUNCIONAL

// --- IMPORTAÇÃO E CONFIGURAÇÃO DO FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyD76HOZNa8yWSVmeJtrkxFmdxtsvlt2arY",
    authDomain: "organograma-empresa.firebaseapp.com",
    projectId: "organograma-empresa",
    storageBucket: "organograma-empresa.firebasestorage.app",
    messagingSenderId: "256795992111",
    appId: "1:256795992111:web:6d8cb3e8e3ea5ae316a6da"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- ESTADO GLOBAL ---
let colaboradoresData = [];
let departmentsList = [];
let currentDeleteName = '';
let currentDeleteId = '';
let googleChartsLoaded = false;

// Função para garantir que Google Charts está carregado
function ensureGoogleChartsLoaded() {
    return new Promise((resolve) => {
        if (googleChartsLoaded) {
            resolve();
            return;
        }
        
        google.charts.load('current', { packages: ['orgchart'] });
        google.charts.setOnLoadCallback(() => {
            googleChartsLoaded = true;
            console.log("✅ Google Charts carregado");
            resolve();
        });
    });
}

// --- ELEMENTOS DOM ---
const chartContainer = document.getElementById('chart-container');
const btnViewAll = document.getElementById('btn-view-all');
const btnLogout = document.getElementById('btn-logout');
const deptSelect = document.getElementById('dept-select');
const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarLinks = document.querySelectorAll('.sidebar-menu-link');

// --- VERIFICAÇÃO DE AUTENTICAÇÃO ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.log("Usuário não logado. Redirecionando para /login.html");
        window.location.href = '/login.html';
    } else {
        console.log("Usuário logado:", user.email);
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.textContent = user.email;
        }
    }
});

// --- FUNÇÃO PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("🎯 DOM carregado, inicializando aplicação...");
    
    initializeSidebar();
    
    if (btnViewAll) {
        btnViewAll.addEventListener('click', () => {
            console.log("🔘 Botão 'Todos' clicado");
            setActiveButton(btnViewAll);
            if (deptSelect) deptSelect.value = "";
            renderAllDepartmentsView();
        });
    }

    if (deptSelect) {
        deptSelect.addEventListener('change', (event) => {
            const selectedDept = event.target.value;
            console.log("🔘 Departamento selecionado:", selectedDept);
            if (selectedDept) {
                if (btnViewAll) btnViewAll.classList.remove('active');
                renderSingleDepartmentView(selectedDept);
            } else {
                setActiveButton(btnViewAll);
                renderAllDepartmentsView();
            }
        });
    }

    if (chartContainer) {
        chartContainer.addEventListener('click', handleDeleteColaborador);
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
            }
        });
    }

    console.log("📡 Iniciando carregamento de dados...");
    loadInitialData();
});

// --- FUNÇÕES DA SIDEBAR ---
function initializeSidebar() {
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        });
        
        const savedState = localStorage.getItem('sidebarCollapsed');
        if (savedState === 'true') {
            sidebar.classList.add('collapsed');
        }
    }
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            sidebarLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            const menuText = link.querySelector('.sidebar-text')?.textContent;
            console.log('🔘 Menu clicado:', menuText);

            if (menuText === 'Presidência') {
                console.log('🎯 Chamando renderPresidenciaView...');
                renderPresidenciaView();
            } else if (menuText === 'Diretorias') {
                console.log('🎯 Chamando renderDiretoriasView...');
                renderDiretoriasView();
            }
        });
    });
}

// --- CARREGAMENTO DE DADOS ---
async function loadInitialData() {
    console.log("🚀 Iniciando loadInitialData...");
    setLoadingState("Carregando dados...");
    
    try {
        console.log("📡 Conectando ao Firebase...");
        colaboradoresData = [];
        departmentsList = [];
        
        const snapshot = await getDocs(collection(db, 'colaboradores'));
        console.log("📊 Documentos encontrados:", snapshot.size);
        
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log("📄 Documento:", doc.id, data);
            colaboradoresData.push({
                ...data,
                docId: doc.id
            });
        });
        
        console.log("📋 Colaboradores carregados:", colaboradoresData.length);
        
        if (colaboradoresData.length === 0) {
            console.warn("⚠️ Nenhum colaborador encontrado no banco de dados");
            setErrorState("Nenhum colaborador encontrado.");
            return;
        }
        
        departmentsList = [...new Set(colaboradoresData.map(item => item.Departamento).sort())];
        console.log("🏢 Departamentos encontrados:", departmentsList);
        
        populateDepartmentSelector();
        setReadyState("Dados carregados. Selecione uma visão.");
        
    } catch (error) {
        console.error("❌ ERRO CRÍTICO AO BUSCAR DADOS:", error);
        setErrorState("Falha ao carregar os dados.");
    }
}

function populateDepartmentSelector() {
    if (!deptSelect) return;
    
    const currentSelection = deptSelect.value;
    const firstOption = deptSelect.options[0];
    deptSelect.innerHTML = '';
    deptSelect.appendChild(firstOption);
    
    departmentsList.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        deptSelect.appendChild(option);
    });
    
    deptSelect.value = currentSelection;
}

// --- RENDERIZAÇÃO ---
function renderAllDepartmentsView() {
    console.log("🎯 Renderizando todos os departamentos...");
    console.log("📊 Total de colaboradores:", colaboradoresData.length);
    setLoadingState("Renderizando todos os departamentos...");

    if (colaboradoresData.length === 0) {
        setErrorState("Nenhum colaborador encontrado.");
        return;
    }

    // Debug: vamos ver alguns exemplos de dados
    console.log("🔍 Primeiros 3 colaboradores:", colaboradoresData.slice(0, 3));

    ensureGoogleChartsLoaded().then(() => {
        try {
            chartContainer.innerHTML = '';
            chartContainer.style.justifyContent = 'flex-start';
            chartContainer.style.alignItems = 'center';
            chartContainer.style.flexDirection = 'column';

            // Função para extrair nome legível do departamento
            function extrairNomeDepartamento(codigoDept) {
                if (!codigoDept || codigoDept === 'Sem Departamento') return 'Sem Departamento';

                console.log("🔧 Processando código:", codigoDept);

                // Remove prefixos como DC_, TI_, RC_, etc.
                let nome = codigoDept.replace(/^[A-Z]{1,3}_/, '');

                // Remove códigos internos como GDS_, GLO_, MKO_, CTR_, GGT_, etc.
                nome = nome.replace(/^[A-Z]{3}_/, '');

                // Substitui underscores e hífens por espaços
                nome = nome.replace(/[_-]/g, ' ');

                // Remove palavras muito técnicas e mantém o essencial
                nome = nome.replace(/\bCOORDENACAO\b/gi, '');
                nome = nome.replace(/\bADMINISTRACAO\b/gi, '');

                // Capitaliza cada palavra e limpa espaços extras
                nome = nome.toLowerCase()
                    .replace(/\b\w/g, l => l.toUpperCase())
                    .replace(/\s+/g, ' ')
                    .trim();

                console.log("✨ Nome final:", nome);
                return nome || 'Outros';
            }

            // Agrupa por departamento
            const todosPorDept = {};
            colaboradoresData.forEach((col, index) => {
                const codigoDept = col.Departamento || col.departamento || 'Sem Departamento';
                const nomeDept = extrairNomeDepartamento(codigoDept);

                if (index < 5) {
                    console.log("🔍 Colaborador:", col.Colaborador);
                    console.log("   📋 Código original:", codigoDept);
                    console.log("   🏷️ Nome extraído:", nomeDept);
                }

                if (!todosPorDept[nomeDept]) {
                    todosPorDept[nomeDept] = [];
                }
                todosPorDept[nomeDept].push(col);
            });

            console.log("🏢 Departamentos encontrados:", Object.keys(todosPorDept));
            console.log("📋 Dados por departamento:", todosPorDept);
            console.log("🏷️ Departamentos encontrados:", Object.keys(todosPorDept));
            console.log("📈 Quantidade por departamento:", Object.keys(todosPorDept).map(dept => `${dept}: ${todosPorDept[dept].length}`));

            if (Object.keys(todosPorDept).length === 0) {
                setErrorState("Nenhum departamento encontrado.");
                return;
            }

            console.log("🚀 Iniciando criação dos títulos e organogramas...");
            Object.keys(todosPorDept).forEach((dept, index) => {
                console.log(`🏷️ [${index + 1}] Criando título para departamento:`, dept);
                console.log(`📊 [${index + 1}] Quantidade de colaboradores:`, todosPorDept[dept].length);

                console.log(`📝 [${index + 1}] Criando elemento h2 para:`, dept);

                // Criar um container para o título
                const titleContainer = document.createElement('div');
                titleContainer.style.cssText = `
                    width: 100%;
                    margin: 30px 0 20px 0;
                    display: block;
                    text-align: center;
                `;

                const deptTitle = document.createElement('h2');
                deptTitle.className = 'dept-title-custom';
                deptTitle.textContent = dept;
                deptTitle.style.cssText = `
                    text-align: center !important;
                    width: 100% !important;
                    margin: 0 !important;
                    font-size: 32px !important;
                    font-weight: 800 !important;
                    color: #1e40af !important;
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%) !important;
                    padding: 25px 40px !important;
                    border-radius: 16px !important;
                    border: 3px solid #3b82f6 !important;
                    box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2) !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 2px !important;
                    position: relative !important;
                    z-index: 1000 !important;
                    max-width: 800px !important;
                    margin: 0 auto !important;
                `;

                console.log(`🎨 [${index + 1}] Aplicando estilos ao título...`);

                // Adiciona uma linha decorativa abaixo do título
                const decorativeLine = document.createElement('div');
                decorativeLine.style.cssText = `
                    width: 100px !important;
                    height: 6px !important;
                    background: linear-gradient(90deg, #3b82f6, #1e40af) !important;
                    margin: 20px auto 0 auto !important;
                    border-radius: 3px !important;
                    display: block !important;
                `;
                deptTitle.appendChild(decorativeLine);

                titleContainer.appendChild(deptTitle);

                console.log(`📌 [${index + 1}] Adicionando título ao container...`);
                chartContainer.appendChild(titleContainer);

                console.log(`✅ [${index + 1}] Título criado e adicionado:`, deptTitle.textContent);
                console.log(`🔍 [${index + 1}] Título no DOM:`, chartContainer.contains(titleContainer));

                const deptChartContainer = document.createElement('div');
                deptChartContainer.className = 'todos-view-container'; // Classe específica para "Todos"

                // Para visualização "Todos" - layout mais compacto e organizado
                const numColaboradores = todosPorDept[dept].length;

                deptChartContainer.style.cssText = `
                    margin-bottom: 40px;
                    width: 100%;
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                    overflow: visible;
                    padding: 25px;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.95);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    box-sizing: border-box;
                    position: relative;
                `;

                chartContainer.appendChild(deptChartContainer);

                console.log(`📊 [${index + 1}] Container "Todos" criado para ${numColaboradores} colaboradores`);

                const deptData = todosPorDept[dept];
                createHierarchicalView(deptChartContainer, deptData, dept);
            });
        } catch (error) {
            console.error("❌ Erro ao renderizar todos os departamentos:", error);
            setErrorState("Erro ao renderizar organograma");
        }
    });
}

function renderSingleDepartmentView(departmentName) {
    console.log("🎯 Renderizando departamento específico:", departmentName);
    console.log("📊 Total de colaboradores disponíveis:", colaboradoresData.length);
    
    const data = colaboradoresData.filter(col => {
        const dept = col.Departamento || col.departamento || '';
        console.log(`🔍 Comparando: "${dept}" === "${departmentName}"`);
        return dept === departmentName;
    });
    console.log(`🔍 Colaboradores encontrados para ${departmentName}:`, data.length);
    console.log("📋 Primeiros 3 colaboradores:", data.slice(0, 3));
    
    setLoadingState(`Renderizando ${departmentName}...`);

    if (data.length === 0) {
        console.warn(`⚠️ Nenhum colaborador encontrado no departamento ${departmentName}`);
        setErrorState(`Nenhum colaborador encontrado no departamento ${departmentName}.`);
        return;
    }

    try {
        chartContainer.innerHTML = '';
        chartContainer.style.justifyContent = 'flex-start';
        chartContainer.style.alignItems = 'center';
        chartContainer.style.flexDirection = 'column';

        // Adicionar título do departamento
        const deptTitle = document.createElement('h2');
        deptTitle.className = 'dept-title';
        deptTitle.textContent = departmentName;
        deptTitle.style.textAlign = 'center';
        deptTitle.style.width = '100%';
        deptTitle.style.marginBottom = '20px';
        deptTitle.style.marginTop = '0px';
        chartContainer.appendChild(deptTitle);

        // Container para o organograma hierárquico
        const deptChartContainer = document.createElement('div');
        deptChartContainer.style.width = '100%';
        deptChartContainer.style.maxWidth = '1400px';
        deptChartContainer.style.overflow = 'auto';
        chartContainer.appendChild(deptChartContainer);

        console.log("🎨 Chamando createHierarchicalView...");
        // Usar a mesma visualização hierárquica que criamos para "Todos"
        createHierarchicalView(deptChartContainer, data, departmentName);
        
        console.log("✅ createHierarchicalView concluído");
        setReadyState(`Departamento ${departmentName} renderizado com sucesso!`);
    } catch (error) {
        console.error("❌ Erro ao renderizar departamento:", error);
        setErrorState("Erro ao renderizar organograma");
    }
}

function buildChartData(colaboradores) {
    console.log("🔍 Construindo dados do chart para:", colaboradores.length, "colaboradores");

    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'Name');
    dataTable.addColumn('string', 'Manager');
    dataTable.addColumn('string', 'ToolTip');

    const rows = [];

    colaboradores.forEach((col, index) => {
        const nome = (col.Colaborador || '').trim();
        const cargo = (col.Cargo || '').trim();
        const departamento = (col.Departamento || '').trim();
        const superior = (col.Gestor || col['Superior imediato'] || '').trim();

        console.log(`📋 ${index + 1}: ${nome} (${cargo}) -> ${superior || 'RAIZ'}`);

        if (nome) {
            // Ajustar truncamento baseado no tamanho do cargo
            const isDiretor = cargo.toLowerCase().includes('diretor');
            const isPresidente = cargo.toLowerCase().includes('presidente');

            // Tamanhos diferentes para diferentes tipos de cargo
            let maxNomeLength = 25;
            let maxCargoLength = 30;
            let fontSize = '13px';
            let cargoFontSize = '11px';

            if (isPresidente) {
                maxNomeLength = 30;
                maxCargoLength = 35;
                fontSize = '14px';
                cargoFontSize = '12px';
            } else if (isDiretor) {
                maxNomeLength = 28;
                maxCargoLength = 32;
                fontSize = '13px';
                cargoFontSize = '11px';
            }

            const nomeDisplay = nome.length > maxNomeLength ? nome.substring(0, maxNomeLength - 3) + '...' : nome;
            const cargoDisplay = cargo.length > maxCargoLength ? cargo.substring(0, maxCargoLength - 3) + '...' : cargo;

            // Preparar departamento para exibição
            const departamentoDisplay = departamento.length > 25 ? departamento.substring(0, 22) + '...' : departamento;

            // Criar uma visualização limpa e legível com destaque para diretores
            const displayName = `
                <div style="text-align: center; padding: 10px; font-family: 'Inter', sans-serif; ${isDiretor || isPresidente ? 'background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 8px; border: 2px solid #3b82f6;' : 'background: linear-gradient(135deg, #ffffff, #f8fafc); border-radius: 6px; border: 1px solid #e2e8f0;'}">
                    <div style="font-weight: ${isDiretor || isPresidente ? '700' : '600'}; font-size: ${fontSize}; color: ${isDiretor || isPresidente ? '#1e40af' : '#1e293b'}; margin-bottom: 4px; line-height: 1.2;">
                        ${nomeDisplay}
                    </div>
                    <div style="font-size: ${cargoFontSize}; color: ${isDiretor || isPresidente ? '#3730a3' : '#64748b'}; font-weight: ${isDiretor || isPresidente ? '600' : '500'}; line-height: 1.3; margin-bottom: 3px;">
                        ${cargoDisplay}
                    </div>
                    ${departamento ? `<div style="font-size: 10px; color: ${isDiretor || isPresidente ? '#6366f1' : '#94a3b8'}; font-weight: 500; line-height: 1.2; padding: 2px 6px; background: ${isDiretor || isPresidente ? 'rgba(99, 102, 241, 0.1)' : 'rgba(148, 163, 184, 0.1)'}; border-radius: 4px; margin-top: 2px;">
                        ${departamentoDisplay}
                    </div>` : ''}
                </div>
            `;

            // Tooltip com informações completas
            const tooltip = `${nome}\n${cargo}\n${departamento}${superior ? `\nReporta para: ${superior}` : ''}`;

            rows.push([
                displayName,
                superior || '',
                tooltip
            ]);
        }
    });

    console.log("📊 Rows criadas:", rows.length);
    console.log("📊 Primeira row:", rows[0]);

    if (rows.length === 0) {
        rows.push(['Sem dados', '', 'Nenhum colaborador']);
    }

    dataTable.addRows(rows);
    console.log("📊 DataTable criada com", dataTable.getNumberOfRows(), "linhas");

    return dataTable;
}

function drawChart(container, data, chartType = 'default') {
    try {
        if (!container || !data) {
            container.innerHTML = '<p class="placeholder">Erro nos dados.</p>';
            return;
        }

        const numRows = data.getNumberOfRows();
        console.log(`📊 Tentando desenhar chart com ${numRows} linhas`);

        if (numRows === 0) {
            container.innerHTML = '<p class="placeholder">Nenhum dado para exibir.</p>';
            return;
        }

        // Log dos dados para debug
        for (let i = 0; i < numRows; i++) {
            const row = data.getFormattedValue(i, 0) + ' -> ' + data.getFormattedValue(i, 1);
            console.log(`Linha ${i}: ${row}`);
        }

        container.innerHTML = '';
        container.style.position = 'relative';
        container.style.overflow = 'auto';

        // Configurações específicas por tipo de chart
        if (chartType === 'presidencia') {
            container.style.minHeight = '500px';
            container.style.width = '100%';
            container.style.maxWidth = '1200px';
            container.style.margin = '0 auto';
            container.style.padding = '20px';
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'flex-start';
        } else if (chartType === 'diretorias') {
            container.style.minHeight = '400px';
            container.style.width = '100%';
            container.style.padding = '15px';
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'flex-start';
        } else {
            container.style.minHeight = '400px';
            container.style.width = '100%';
            container.style.padding = '10px';
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'flex-start';
        }

        const chart = new google.visualization.OrgChart(container);

        // Opções específicas por tipo
        let options = {
            'allowHtml': true,
            'allowCollapse': false,
            'nodeClass': 'custom-org-node',
            'selectedNodeClass': 'custom-org-selected',
            'compactRows': false
        };

        if (chartType === 'presidencia') {
            options.size = 'large';
            options.compactRows = false;
            // Garantir centralização para presidência
            container.style.display = 'flex';
            container.style.justifyContent = 'center';
            container.style.alignItems = 'center';
            container.style.flexDirection = 'column';
        } else if (chartType === 'diretorias') {
            options.size = 'medium';
            options.compactRows = true;
        } else {
            options.size = 'medium';
        }

        console.log('🎨 Iniciando draw do Google Charts...');
        chart.draw(data, options);
        console.log('✅ Draw concluído');

    } catch (error) {
        console.error("❌ Erro ao desenhar gráfico:", error);
        container.innerHTML = `<p class="placeholder" style="color: #d93025;">Erro: ${error.message}</p>`;
    }
}

function addDragFunctionality(container) {
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;
    
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        container.style.cursor = 'grabbing';
        startX = e.pageX - container.offsetLeft;
        startY = e.pageY - container.offsetTop;
        scrollLeft = container.scrollLeft;
        scrollTop = container.scrollTop;
        e.preventDefault();
    });
    
    container.addEventListener('mouseleave', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });
    
    container.addEventListener('mouseup', () => {
        isDragging = false;
        container.style.cursor = 'grab';
    });
    
    container.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - container.offsetLeft;
        const y = e.pageY - container.offsetTop;
        const walkX = (x - startX) * 2;
        const walkY = (y - startY) * 2;
        container.scrollLeft = scrollLeft - walkX;
        container.scrollTop = scrollTop - walkY;
    });
    
    // Adiciona indicador visual
    const indicator = document.createElement('div');
    indicator.innerHTML = '↔️ Arraste para navegar';
    indicator.style.position = 'absolute';
    indicator.style.top = '10px';
    indicator.style.right = '10px';
    indicator.style.background = 'rgba(0,0,0,0.7)';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '5px';
    indicator.style.fontSize = '12px';
    indicator.style.zIndex = '10';
    container.appendChild(indicator);
}

function formatNode(nome, cargo, area) {
    const name = formatText(nome || '');
    const role = formatCargo(cargo || '');
    const areaFormatted = formatArea(area || '');
    
    return `
        <div class="org-card">
            <div class="org-name">${name}</div>
            <div class="org-role">${role}</div>
            ${areaFormatted ? `<div class="org-area">${areaFormatted}</div>` : ''}
        </div>
    `;
}

function formatText(text) {
    return text ? text.trim() : '';
}

function formatCargo(cargo) {
    return cargo ? cargo.trim() : '';
}

function formatArea(area) {
    return area ? area.trim() : '';
}

function setActiveButton(activeButton) {
    [btnViewAll].forEach(button => button.classList.remove('active'));
    if (activeButton) activeButton.classList.add('active');
}

function setLoadingState(message) {
    chartContainer.innerHTML = `<p class="placeholder">${message}</p>`;
    chartContainer.style.justifyContent = 'center';
}

function setErrorState(message) {
    chartContainer.innerHTML = `<p class="placeholder" style="color: #ef4444;">${message}</p>`;
    chartContainer.style.justifyContent = 'center';
}

function setReadyState(message) {
    chartContainer.innerHTML = `<p class="placeholder" style="color: #10b981;">${message}</p>`;
    chartContainer.style.justifyContent = 'center';
}

// --- FUNÇÕES STUB ---
function handleDeleteColaborador(event) {
    console.log("Deletar colaborador não implementado");
}

function renderPresidenciaView() {
    console.log("🎯 INICIANDO renderPresidenciaView");

    const container = document.getElementById('chart-container');
    if (!container) {
        console.error("❌ Container não encontrado!");
        return;
    }

    // Buscar diretores que reportam à Eloana
    const diretores = colaboradoresData.filter(col => {
        const gestor = (col.Gestor || '').toLowerCase();
        const cargo = (col.Cargo || '').toLowerCase();

        return gestor.includes('eloana') && gestor.includes('antoniazi') && gestor.includes('tonello') &&
               (cargo.includes('diretor') || cargo.includes('diretora'));
    });

    console.log("👑 Diretores encontrados:", diretores);
    console.log("📊 Total de diretores:", diretores.length);

    // Debug: mostrar cada diretor
    diretores.forEach((diretor, index) => {
        console.log(`${index + 1}. ${diretor.Colaborador} - ${diretor.Cargo}`);
    });

    // Resetar estilos do container
    container.style.cssText = `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        width: 100% !important;
        min-height: 600px !important;
        padding: 40px !important;
        background: #f8fafc !important;
        overflow: visible !important;
    `;

    container.innerHTML = '';

    // Título da seção
    const title = document.createElement('h2');
    title.textContent = 'Presidência';
    title.style.cssText = `
        text-align: center;
        margin: 0 0 50px 0;
        font-size: 32px;
        font-weight: 700;
        color: #1e40af;
        letter-spacing: 1px;
    `;
    container.appendChild(title);

    // Container principal da hierarquia
    const hierarquiaContainer = document.createElement('div');
    hierarquiaContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 30px;
    `;

    // Card da presidente
    const presidenteCard = document.createElement('div');
    presidenteCard.style.cssText = `
        background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
        color: white;
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(59, 130, 246, 0.3);
        text-align: center;
        width: 400px;
        border: 3px solid rgba(255, 255, 255, 0.2);
    `;

    const nomePresidente = document.createElement('h3');
    nomePresidente.textContent = 'Eloana Antoniazi Tonello';
    nomePresidente.style.cssText = `
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 15px 0;
        color: white;
    `;

    const cargoPresidente = document.createElement('p');
    cargoPresidente.textContent = 'PRESIDENTE';
    cargoPresidente.style.cssText = `
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 10px 0;
        color: white;
    `;

    const deptPresidente = document.createElement('p');
    deptPresidente.textContent = 'PRESIDÊNCIA';
    deptPresidente.style.cssText = `
        font-size: 14px;
        font-weight: 500;
        margin: 0;
        color: white;
    `;

    presidenteCard.appendChild(nomePresidente);
    presidenteCard.appendChild(cargoPresidente);
    presidenteCard.appendChild(deptPresidente);
    hierarquiaContainer.appendChild(presidenteCard);

    // Linha conectora
    if (diretores.length > 0) {
        const linha = document.createElement('div');
        linha.style.cssText = `
            width: 2px;
            height: 30px;
            background: #1e40af;
        `;
        hierarquiaContainer.appendChild(linha);

        // Container dos diretores - UMA LINHA HORIZONTAL
        const diretoresContainer = document.createElement('div');
        diretoresContainer.style.cssText = `
            display: flex;
            flex-wrap: nowrap;
            justify-content: center;
            gap: 8px;
            overflow-x: auto;
            padding: 10px;
            width: 100%;
        `;

        // Criar cards dos diretores
        diretores.forEach(diretor => {
            const diretorCard = document.createElement('div');
            diretorCard.style.cssText = `
                background: white;
                color: #374151;
                padding: 15px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                text-align: center;
                width: 140px;
                min-width: 140px;
                border: 1px solid #e5e7eb;
                flex-shrink: 0;
            `;

            // Nome do diretor (mais destacado)
            const nomeDiretor = document.createElement('h4');
            nomeDiretor.textContent = diretor.Colaborador;
            nomeDiretor.style.cssText = `
                font-size: 13px;
                font-weight: 700;
                margin: 0 0 8px 0;
                color: #1f2937;
                line-height: 1.1;
            `;

            // Cargo do diretor (simplificado)
            const cargoDiretor = document.createElement('p');
            cargoDiretor.textContent = diretor.Cargo.toUpperCase();
            cargoDiretor.style.cssText = `
                font-size: 10px;
                font-weight: 600;
                margin: 0 0 6px 0;
                color: #4b5563;
                line-height: 1.2;
            `;

            // Departamento (menor)
            const deptDiretor = document.createElement('p');
            deptDiretor.textContent = diretor.Departamento.toUpperCase();
            deptDiretor.style.cssText = `
                font-size: 9px;
                font-weight: 500;
                margin: 0;
                color: #9ca3af;
                line-height: 1.1;
            `;

            diretorCard.appendChild(nomeDiretor);
            diretorCard.appendChild(cargoDiretor);
            diretorCard.appendChild(deptDiretor);
            diretoresContainer.appendChild(diretorCard);
        });

        hierarquiaContainer.appendChild(diretoresContainer);
    }

    container.appendChild(hierarquiaContainer);
    console.log("✅ Presidência com diretores renderizada");
}

function renderDiretoriasView() {
    console.log("🎯 Renderizando visão das Diretorias...");
    console.log("📊 Total de colaboradores:", colaboradoresData.length);
    setLoadingState("Carregando visão das Diretorias...");

    if (colaboradoresData.length === 0) {
        setErrorState("Nenhum colaborador encontrado.");
        return;
    }

    // Debug: vamos ver alguns exemplos de dados
    console.log("🔍 Primeiros 3 colaboradores:", colaboradoresData.slice(0, 3));

    // Primeiro, encontra todos os diretores
    const diretores = colaboradoresData.filter(col => {
        const cargo = (col.Cargo || '').toLowerCase();
        return cargo.includes('diretor') || cargo.includes('diretora');
    });

    console.log("👔 Diretores encontrados:", diretores.length);
    console.log("👔 Lista de diretores:", diretores);

    const nomesDiretores = diretores.map(dir => (dir['Nome do Colaborador'] || dir.Nome || dir.Colaborador || '').toLowerCase());

    // Depois, encontra todos que reportam a diretores OU são diretores
    const diretoriasData = colaboradoresData.filter(col => {
        const cargo = (col.Cargo || '').toLowerCase();
        const superior = (col['Superior imediato'] || col.Gestor || col['Superior Imediato'] || '').toLowerCase();

        // Inclui diretores
        const isDiretor = cargo.includes('diretor') || cargo.includes('diretora');

        // Inclui pessoas que reportam a diretores
        const reportaAoDiretor = nomesDiretores.some(nomeDiretor =>
            superior.includes(nomeDiretor) ||
            superior.includes('diretor') ||
            superior.includes('diretora')
        );

        return isDiretor || reportaAoDiretor;
    });

    console.log("📊 Dados das diretorias (filtrados):", diretoriasData.length);

    if (diretoriasData.length === 0) {
        setErrorState("Nenhum colaborador encontrado.");
        return;
    }
    
    ensureGoogleChartsLoaded().then(() => {
        try {
            chartContainer.innerHTML = '';
            chartContainer.style.justifyContent = 'flex-start';
            chartContainer.style.alignItems = 'center';
            chartContainer.style.flexDirection = 'column';

            // Título principal "Diretorias" no topo (apenas uma vez)
            const mainTitle = document.createElement('h1');
            mainTitle.textContent = 'DIRETORIAS';
            mainTitle.style.fontSize = '2.5rem';
            mainTitle.style.textAlign = 'center';
            mainTitle.style.width = '100%';
            mainTitle.style.marginBottom = '40px';
            mainTitle.style.marginTop = '20px';
            mainTitle.style.color = '#1e293b';
            mainTitle.style.fontWeight = '800';
            mainTitle.style.letterSpacing = '2px';
            mainTitle.style.textTransform = 'uppercase';
            mainTitle.style.borderBottom = '3px solid #3b82f6';
            mainTitle.style.paddingBottom = '15px';
            mainTitle.style.display = 'block';
            mainTitle.style.visibility = 'visible';
            console.log("🏢 Criando título principal: DIRETORIAS");
            chartContainer.appendChild(mainTitle);

            // Agrupa por departamento
            const diretoriasPorDept = {};
            diretoriasData.forEach(col => {
                const dept = col.Departamento || col.departamento || 'Sem Departamento';
                console.log("🏢 Processando colaborador:", col['Nome do Colaborador'] || col.Nome, "- Departamento:", dept);
                if (!diretoriasPorDept[dept]) {
                    diretoriasPorDept[dept] = [];
                }
                diretoriasPorDept[dept].push(col);
            });

            console.log("🏢 Departamentos encontrados:", Object.keys(diretoriasPorDept));
            console.log("📋 Dados por departamento:", diretoriasPorDept);

            // Renderiza cada departamento com suas diretorias
            Object.keys(diretoriasPorDept).sort().forEach(dept => {
                console.log("🎯 Renderizando departamento:", dept);
                // Nome do departamento
                const deptTitle = document.createElement('h3');
                deptTitle.textContent = dept;
                deptTitle.style.fontSize = '1.6rem';
                deptTitle.style.textAlign = 'center';
                deptTitle.style.width = '100%';
                deptTitle.style.marginTop = '30px';
                deptTitle.style.marginBottom = '25px';
                deptTitle.style.color = '#1e293b';
                deptTitle.style.fontWeight = '700';
                deptTitle.style.padding = '15px 20px';
                deptTitle.style.background = 'linear-gradient(135deg, #f8fafc, #e2e8f0)';
                deptTitle.style.borderRadius = '12px';
                deptTitle.style.border = '2px solid #cbd5e1';
                deptTitle.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                deptTitle.style.display = 'block';
                deptTitle.style.visibility = 'visible';
                console.log("📝 Criando título para departamento:", dept);
                chartContainer.appendChild(deptTitle);

                // Container para o organograma
                const deptChartContainer = document.createElement('div');
                deptChartContainer.style.marginBottom = '50px';
                deptChartContainer.style.width = '100%';
                deptChartContainer.style.maxWidth = '1400px';
                deptChartContainer.style.overflow = 'auto';
                deptChartContainer.style.padding = '20px';
                deptChartContainer.style.border = '1px solid #e2e8f0';
                deptChartContainer.style.borderRadius = '12px';
                deptChartContainer.style.background = 'rgba(255, 255, 255, 0.8)';
                deptChartContainer.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                chartContainer.appendChild(deptChartContainer);

                const chartData = buildChartData(diretoriasPorDept[dept]);
                drawChart(deptChartContainer, chartData, 'diretorias');
            });
            
        } catch (error) {
            console.error("❌ Erro ao renderizar diretorias:", error);
            setErrorState("Erro ao renderizar diretorias");
        }
    });
}

// ==================== NOVA FUNÇÃO PARA VISUALIZAÇÃO HIERÁRQUICA ====================

function createHierarchicalView(container, colaboradores, deptName) {
    console.log(`🎯 Criando visualização hierárquica para ${deptName} com ${colaboradores.length} colaboradores (antes da deduplicação)`);
    
    // Deduplicação inicial - garantir que cada colaborador apareça apenas uma vez
    const uniqueColaboradoresMap = new Map();
    colaboradores.forEach(col => {
        const name = (col.Colaborador || col.Nome || col['Nome do Colaborador'] || '').trim();
        if (name) {
            if (!uniqueColaboradoresMap.has(name)) {
                uniqueColaboradoresMap.set(name, col);
            } else {
                // Se já existe, manter o que tem cargo mais alto na hierarquia
                const existing = uniqueColaboradoresMap.get(name);
                const existingCargo = (existing.Cargo || '').toLowerCase();
                const newCargo = (col.Cargo || '').toLowerCase();
                
                // Definir prioridade: gerente > coordenador > supervisor > outros
                const getPriority = (cargo) => {
                    if (cargo.includes('gerente') || cargo.includes('gerência')) return 4;
                    if (cargo.includes('coordenador') || cargo.includes('coordenadora') || cargo.includes('coordenação')) return 3;
                    if (cargo.includes('supervisor') || cargo.includes('supervisora') || cargo.includes('supervisão')) return 2;
                    return 1;
                };
                
                const existingPriority = getPriority(existingCargo);
                const newPriority = getPriority(newCargo);
                
                if (newPriority > existingPriority) {
                    uniqueColaboradoresMap.set(name, col);
                }
            }
        }
    });
    
    const uniqueColaboradores = Array.from(uniqueColaboradoresMap.values());
    console.log(`🎯 Colaboradores únicos após deduplicação: ${uniqueColaboradores.length}`);
    
    // Limpar container
    container.innerHTML = '';
    
    // Organizar colaboradores por hierarquia (sem duplicação)
    const gerentes = uniqueColaboradores.filter(col => {
        const cargo = (col.Cargo || '').toLowerCase();
        return cargo.includes('gerente') || cargo.includes('gerência');
    });
    
    // Função para verificar se um colaborador já foi incluído em um nível superior
    const isAlreadyIncluded = (colaborador, nivelSuperior) => {
        const nome = colaborador.Colaborador || colaborador.Nome || colaborador['Nome do Colaborador'];
        return nivelSuperior.some(col => 
            (col.Colaborador || col.Nome || col['Nome do Colaborador']) === nome
        );
    };
    
    const coordenadores = uniqueColaboradores.filter(col => {
        const cargo = (col.Cargo || '').toLowerCase();
        // Excluir gerentes para evitar duplicação
        const isGerente = cargo.includes('gerente') || cargo.includes('gerência');
        const jaIncluido = isAlreadyIncluded(col, gerentes);
        return !isGerente && !jaIncluido && (cargo.includes('coordenador') || cargo.includes('coordenadora') || cargo.includes('coordenação'));
    });
    
    const supervisores = uniqueColaboradores.filter(col => {
        const cargo = (col.Cargo || '').toLowerCase();
        // Excluir gerentes e coordenadores para evitar duplicação
        const isGerente = cargo.includes('gerente') || cargo.includes('gerência');
        const isCoordenador = cargo.includes('coordenador') || cargo.includes('coordenadora') || cargo.includes('coordenação');
        const jaIncluido = isAlreadyIncluded(col, gerentes) || isAlreadyIncluded(col, coordenadores);
        return !isGerente && !isCoordenador && !jaIncluido && (cargo.includes('supervisor') || cargo.includes('supervisora') || cargo.includes('supervisão'));
    });
    
    const colaboradoresBase = uniqueColaboradores.filter(col => {
        const cargo = (col.Cargo || '').toLowerCase();
        // Excluir todos os cargos de gestão para evitar duplicação
        const isGerente = cargo.includes('gerente') || cargo.includes('gerência');
        const isCoordenador = cargo.includes('coordenador') || cargo.includes('coordenadora') || cargo.includes('coordenação');
        const isSupervisor = cargo.includes('supervisor') || cargo.includes('supervisora') || cargo.includes('supervisão');
        const jaIncluido = isAlreadyIncluded(col, gerentes) || isAlreadyIncluded(col, coordenadores) || isAlreadyIncluded(col, supervisores);
        return !isGerente && !isCoordenador && !isSupervisor && !jaIncluido;
    });
    
    console.log(`👤 Gerentes encontrados: ${gerentes.length}`);
    console.log(`👥 Coordenadores encontrados: ${coordenadores.length}`);
    console.log(`👥 Supervisores encontrados: ${supervisores.length}`);
    console.log(`👥 Colaboradores base encontrados: ${colaboradoresBase.length}`);
    
    // Debug: verificar duplicações
    const todosIds = [...gerentes, ...coordenadores, ...supervisores, ...colaboradoresBase];
    const nomesUnicos = new Set(todosIds.map(col => col.Colaborador || col.Nome || col['Nome do Colaborador']));
    console.log(`🔍 Total de colaboradores únicos: ${nomesUnicos.size}`);
    console.log(`🔍 Total de cards criados: ${todosIds.length}`);
    
    // Log detalhado de cada nível
    console.log(`👤 Gerentes:`, gerentes.map(col => col.Colaborador || col.Nome || col['Nome do Colaborador']));
    console.log(`👥 Coordenadores:`, coordenadores.map(col => col.Colaborador || col.Nome || col['Nome do Colaborador']));
    console.log(`👥 Supervisores:`, supervisores.map(col => col.Colaborador || col.Nome || col['Nome do Colaborador']));
    console.log(`👥 Colaboradores Base:`, colaboradoresBase.map(col => col.Colaborador || col.Nome || col['Nome do Colaborador']));
    
    if (todosIds.length !== nomesUnicos.size) {
        console.warn(`⚠️ ATENÇÃO: Possível duplicação detectada!`);
        const nomes = todosIds.map(col => col.Colaborador || col.Nome || col['Nome do Colaborador']);
        const duplicados = nomes.filter((nome, index) => nomes.indexOf(nome) !== index);
        console.warn(`⚠️ Nomes duplicados:`, duplicados);
    }
    
    // Verificar se há conteúdo para renderizar
    if (todosIds.length === 0) {
        console.warn(`⚠️ Nenhum colaborador para renderizar em ${deptName}`);
        container.innerHTML = '<p style="text-align: center; color: #666; font-size: 16px; padding: 40px;">Nenhum colaborador encontrado neste departamento.</p>';
        return;
    }
    
    // Criar estrutura hierárquica
    const hierarchicalContainer = document.createElement('div');
    hierarchicalContainer.className = 'hierarchical-view';
    hierarchicalContainer.style.cssText = `
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        padding: 20px;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(148, 163, 184, 0.15);
    `;
    
    // Seção dos Gerentes (nível mais alto)
    if (gerentes.length > 0) {
        const gerentesSection = document.createElement('div');
        gerentesSection.className = 'gerentes-section';
        gerentesSection.style.cssText = `
            width: 100%;
            display: flex;
            justify-content: center;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(239, 246, 255, 0.4);
            border-radius: 10px;
            border: 2px solid #3b82f6;
        `;
        
        gerentes.forEach(gerente => {
            const gerenteCard = createColaboradorCard(gerente, 'gerente');
            gerentesSection.appendChild(gerenteCard);
        });
        
        hierarchicalContainer.appendChild(gerentesSection);
        }
    
    // Linha conectora para coordenadores
    if (coordenadores.length > 0 || supervisores.length > 0 || colaboradoresBase.length > 0) {
        const connectorLine = document.createElement('div');
        connectorLine.style.cssText = `
            width: 2px;
            height: 25px;
            background: linear-gradient(180deg, #3b82f6, #1e40af);
            margin: 0 auto;
            border-radius: 1px;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
        `;
        hierarchicalContainer.appendChild(connectorLine);
    }
    
    // Seção dos Coordenadores (nível intermediário)
    if (coordenadores.length > 0) {
        const coordenadoresSection = document.createElement('div');
        coordenadoresSection.className = 'coordenadores-section';
        coordenadoresSection.style.cssText = `
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(236, 254, 255, 0.4);
            border-radius: 8px;
            border: 1px solid #06b6d4;
        `;
        
        coordenadores.forEach(coordenador => {
            const coordenadorCard = createColaboradorCard(coordenador, 'coordenador');
            coordenadoresSection.appendChild(coordenadorCard);
        });
        
        hierarchicalContainer.appendChild(coordenadoresSection);
        
        // Linha conectora para supervisores
        if (supervisores.length > 0 || colaboradoresBase.length > 0) {
            const connectorLine = document.createElement('div');
            connectorLine.style.cssText = `
                width: 2px;
                height: 25px;
                background: linear-gradient(180deg, #06b6d4, #0891b2);
                margin: 0 auto;
                border-radius: 1px;
                box-shadow: 0 2px 4px rgba(6, 182, 212, 0.3);
            `;
            hierarchicalContainer.appendChild(connectorLine);
        }
    }
    
    // Seção dos Supervisores (nível baixo)
    if (supervisores.length > 0) {
        const supervisoresSection = document.createElement('div');
        supervisoresSection.className = 'supervisores-section';
        supervisoresSection.style.cssText = `
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(254, 243, 199, 0.4);
            border-radius: 8px;
            border: 1px solid #f59e0b;
        `;
        
        supervisores.forEach(supervisor => {
            const supervisorCard = createColaboradorCard(supervisor, 'supervisor');
            supervisoresSection.appendChild(supervisorCard);
        });
        
        hierarchicalContainer.appendChild(supervisoresSection);
        
        // Linha conectora para colaboradores base
        if (colaboradoresBase.length > 0) {
        const connectorLine = document.createElement('div');
        connectorLine.style.cssText = `
            width: 2px;
            height: 25px;
            background: linear-gradient(180deg, #f59e0b, #d97706);
            margin: 0 auto;
            border-radius: 1px;
            box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
        `;
        hierarchicalContainer.appendChild(connectorLine);
    }
    
    // Seção dos Colaboradores Base (nível mais baixo)
    if (colaboradoresBase.length > 0) {
        const colaboradoresSection = document.createElement('div');
        colaboradoresSection.className = 'colaboradores-section';
        colaboradoresSection.style.cssText = `
            width: 100%;
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
            padding: 20px;
            background: rgba(248, 250, 252, 0.5);
            border-radius: 8px;
            border: 1px solid rgba(148, 163, 184, 0.1);
        `;
        
        colaboradoresBase.forEach(colaborador => {
            const colaboradorCard = createColaboradorCard(colaborador, 'colaborador');
            colaboradoresSection.appendChild(colaboradorCard);
        });
        
        hierarchicalContainer.appendChild(colaboradoresSection);
    }
    
    container.appendChild(hierarchicalContainer);
}

function createColaboradorCard(colaborador, tipo) {
    const nome = (colaborador.Colaborador || colaborador.Nome || colaborador['Nome do Colaborador'] || '').trim();
    const cargo = (colaborador.Cargo || '').trim();
    const departamento = (colaborador.Departamento || '').trim();
    
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
            
        default: // colaborador
            cardStyles = `
                min-width: 150px;
                max-width: 180px;
                padding: 12px 8px;
                background: linear-gradient(135deg, #ffffff, #f8fafc);
                border: 1px solid #e2e8f0;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
                border-radius: 8px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
            `;
            nomeStyles = `
                font-weight: 600;
                font-size: 12px;
                color: #1e293b;
                margin-bottom: 6px;
                line-height: 1.2;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            cargoStyles = `
                font-size: 10px;
                color: #64748b;
                font-weight: 500;
                line-height: 1.3;
                margin-bottom: 4px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            deptStyles = `
                font-size: 9px;
                color: #94a3b8;
                font-weight: 500;
                line-height: 1.2;
                padding: 2px 6px;
                background: rgba(148, 163, 184, 0.1);
                border-radius: 4px;
                margin-top: 4px;
                word-wrap: break-word;
                overflow-wrap: break-word;
            `;
            hoverShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
            break;
    }
    
    card.style.cssText = cardStyles;
    
    // Nome
    const nomeElement = document.createElement('div');
    nomeElement.className = 'nome-colaborador';
    nomeElement.textContent = nome.length > 20 ? nome.substring(0, 17) + '...' : nome;
    nomeElement.style.cssText = nomeStyles;
    
    // Cargo
    const cargoElement = document.createElement('div');
    cargoElement.className = 'cargo-colaborador';
    cargoElement.textContent = cargo.length > 25 ? cargo.substring(0, 22) + '...' : cargo;
    cargoElement.style.cssText = cargoStyles;
    
    // Departamento
    if (departamento) {
        const deptElement = document.createElement('div');
        deptElement.className = 'departamento-colaborador';
        deptElement.textContent = departamento.length > 20 ? departamento.substring(0, 17) + '...' : departamento;
        deptElement.style.cssText = deptStyles;
        card.appendChild(deptElement);
    }
    
    card.appendChild(nomeElement);
    card.appendChild(cargoElement);
    
    // Efeitos hover
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-3px)';
        card.style.boxShadow = hoverShadow;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = cardStyles.match(/box-shadow: ([^;]+)/)?.[1] || '0 2px 6px rgba(0, 0, 0, 0.1)';
    });
    
    return card;
}
