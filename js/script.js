// js/script.js - VERSÃO COM CRUD (CREATE)

// --- IMPORTAÇÃO E CONFIGURAÇÃO DO FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, setDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
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

// --- ESTADO GLOBAL ---
let colaboradoresData = [];
let departmentsList = [];

// --- ELEMENTOS DO DOM ---
const chartContainer = document.getElementById('chart-container');
const btnViewAll = document.getElementById('btn-view-all');
const deptSelect = document.getElementById('dept-select');

// NOVO: Elementos do Modal
const btnAddColaborador = document.getElementById('btn-add-colaborador');
const addColaboradorModal = document.getElementById('add-colaborador-modal');
const addColaboradorForm = document.getElementById('add-colaborador-form');
const btnCancelAdd = document.getElementById('btn-cancel-add');
const colabDeptoSelect = document.getElementById('colab-depto');
const colabGestorSelect = document.getElementById('colab-gestor');


// --- FUNÇÃO PRINCIPAL ---
document.addEventListener('DOMContentLoaded', async () => {
    // Listeners dos botões de visualização
    btnViewAll.addEventListener('click', () => {
        setActiveButton(btnViewAll);
        deptSelect.value = "";
        renderAllDepartmentsView();
        // NOVO: Listener para exclusão (delegação de eventos)
    chartContainer.addEventListener('click', handleDeleteColaborador);
    });

    deptSelect.addEventListener('change', (event) => {
        const selectedDept = event.target.value;
        if (selectedDept) {
            btnViewAll.classList.remove('active');
            renderSingleDepartmentView(selectedDept);
        } else {
            setActiveButton(btnViewAll);
            renderAllDepartmentsView();
        }
    });

    // NOVO: Listeners para o Modal
    btnAddColaborador.addEventListener('click', openAddModal);
    btnCancelAdd.addEventListener('click', closeAddModal);
    addColaboradorModal.addEventListener('click', (e) => {
        // Fecha o modal se clicar fora da caixa de conteúdo
        if (e.target === addColaboradorModal) {
            closeAddModal();
        }
    });
    addColaboradorForm.addEventListener('submit', handleAddColaborador);


    // Carregamento inicial dos dados
    await loadInitialData();
});

// --- NOVO: LÓGICA DO MODAL E DO FORMULÁRIO ---

function openAddModal() {
    // Popula os dropdowns do formulário com os dados mais recentes
    populateFormField(colabDeptoSelect, departmentsList);
    
    // Pega todos os nomes de colaboradores para o campo de gestor
    const allColaboradoresNomes = colaboradoresData.map(c => c.Colaborador).sort();
    populateFormField(colabGestorSelect, allColaboradoresNomes, true); // O 'true' indica para manter a opção "Nenhum"

    addColaboradorModal.classList.remove('hidden');
}

function closeAddModal() {
    addColaboradorForm.reset(); // Limpa o formulário
    addColaboradorModal.classList.add('hidden');
}

async function handleAddColaborador(event) {
    event.preventDefault(); // Previne o recarregamento da página
    
    const formData = new FormData(addColaboradorForm);
    const novoColaborador = {
        Colaborador: formData.get('nome'),
        Cargo: formData.get('cargo'),
        Departamento: formData.get('departamento'),
        Gestor: formData.get('gestor')
    };

    // Gera um ID para o documento (usando o nome em minúsculo e com hífens)
    const docId = novoColaborador.Colaborador.replace(/\s+/g, '-').toLowerCase();

    try {
        setLoadingState("Salvando novo colaborador...");
        // Salva o novo colaborador no Firestore
        await setDoc(doc(db, "colaboradores", docId), novoColaborador);
        
        closeAddModal();
        setLoadingState("Colaborador salvo! Atualizando organograma...");
        
        // Recarrega todos os dados para refletir a mudança
        await loadInitialData();
        renderAllDepartmentsView(); // Ou a visão que for mais apropriada

    } catch (error) {
        console.error("❌ Erro ao salvar colaborador:", error);
        setErrorState("Não foi possível salvar. Tente novamente.");
    }
}

// Função genérica para popular dropdowns do formulário
function populateFormField(selectElement, data, keepFirstOption = false) {
    const firstOption = selectElement.options[0]; // Guarda a primeira opção (ex: "Nenhum")
    selectElement.innerHTML = ''; // Limpa as opções antigas
    
    if (keepFirstOption) {
        selectElement.appendChild(firstOption);
    }

    data.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        selectElement.appendChild(option);
    });
}


// --- FUNÇÕES DE CARREGAMENTO E RENDERIZAÇÃO ---

async function loadInitialData() {
    setLoadingState("Carregando dados...");
    try {
        // Limpa os dados antigos antes de carregar novos
        colaboradoresData = [];
        departmentsList = [];

        const snapshot = await getDocs(collection(db, 'colaboradores'));
        snapshot.forEach(doc => colaboradoresData.push(doc.data()));
        
        if (colaboradoresData.length > 0) {
            departmentsList = [...new Set(colaboradoresData.map(item => item.Departamento).sort())];
            populateDepartmentSelector();
            setReadyState("Dados carregados. Selecione uma visão.");
        } else {
            setErrorState("Nenhum colaborador encontrado.");
        }
    } catch (error) {
        console.error("❌ ERRO CRÍTICO AO BUSCAR DADOS ❌:", error);
        setErrorState("Falha ao carregar os dados.");
    }
}

function populateDepartmentSelector() {
    // Lógica para popular o seletor principal da página
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

// ... (O resto das funções de renderização: renderSingleDepartmentView, renderAllDepartmentsView, buildChartData, drawChart, etc., permanecem iguais à versão anterior)
// Copie e cole as funções restantes da versão anterior aqui se necessário, elas não mudaram.

function renderSingleDepartmentView(departmentName) {
    const data = colaboradoresData.filter(col => col.Departamento === departmentName);
    setLoadingState(`Renderizando ${departmentName}...`);
    google.charts.load('current', { packages: ['orgchart'] });
    google.charts.setOnLoadCallback(() => {
        chartContainer.innerHTML = '';
        const chartData = buildChartData(data);
        drawChart(chartContainer, chartData);
    });
}

function renderAllDepartmentsView() {
    setLoadingState("Renderizando todos os departamentos...");
    google.charts.load('current', { packages: ['orgchart'] });
    google.charts.setOnLoadCallback(() => {
        chartContainer.innerHTML = '';
        chartContainer.style.justifyContent = 'flex-start';
        departmentsList.forEach(dept => {
            const deptTitle = document.createElement('h2');
            deptTitle.className = 'dept-title';
            deptTitle.textContent = `${dept}`;
            chartContainer.appendChild(deptTitle);
            const deptChartContainer = document.createElement('div');
            deptChartContainer.style.marginBottom = '40px';
            chartContainer.appendChild(deptChartContainer);
            const deptData = colaboradoresData.filter(col => col.Departamento === dept);
            const deptColaboradoresNomes = deptData.map(c => c.Colaborador);
            const deptChartData = deptData.map(c => {
                if (c.Gestor && !deptColaboradoresNomes.includes(c.Gestor)) {
                    return { ...c, Gestor: '' };
                }
                return c;
            });
            const chartData = buildChartData(deptData);
            drawChart(deptChartContainer, chartData);
        });
    });
}

function buildChartData(colaboradores) {
    const dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'Name');
    dataTable.addColumn('string', 'Manager');
    dataTable.addColumn('string', 'ToolTip');
    colaboradores.forEach(col => {
        if (!col.Colaborador || !col.Cargo) return;
        const node = { v: col.Colaborador, f: formatNode(col.Colaborador, col.Cargo) };
        const manager = col.Gestor || '';
        dataTable.addRow([node, manager, col.Departamento]);
    });
    return dataTable;
}

function drawChart(container, data) {
    if (data.getNumberOfRows() === 0) {
        container.innerHTML = '<p class="placeholder">Nenhum dado para exibir.</p>';
        return;
    }
    const chart = new google.visualization.OrgChart(container);
    chart.draw(data, { 'allowHtml': true, 'nodeClass': 'google-visualization-orgchart-node-medium', 'allowCollapse': true });
}

function formatNode(nome, cargo) {
    // Geramos um ID seguro para o elemento a partir do nome do colaborador
    const colaboradorId = nome.replace(/\s+/g, '-').toLowerCase();
    
    return `<div class="org-card">
                <div class="org-name">${nome}</div>
                <div class="org-role">${cargo}</div>
                <span class="delete-btn" data-id="${colaboradorId}" title="Excluir ${nome}">×</span>
            </div>`;
}

function setActiveButton(activeButton) {
    [btnViewAll].forEach(button => button.classList.remove('active'));
    if (activeButton) activeButton.classList.add('active');
}

function setLoadingState(message) {
    chartContainer.innerHTML = `<p class="placeholder">${message}</p>`;
    chartContainer.style.justifyContent = 'center';
}

function setReadyState(message) {
    chartContainer.innerHTML = `<p class="placeholder">${message}</p>`;
    chartContainer.style.justifyContent = 'center';
}

function setErrorState(message) {
    chartContainer.innerHTML = `<p class="placeholder" style="color: #d93025;">${message}</p>`;
    chartContainer.style.justifyContent = 'center';
}

// --- NOVA FUNÇÃO DE EXCLUSÃO ---
async function handleDeleteColaborador(event) {
    // Verifica se o elemento clicado foi um botão de exclusão
    if (event.target.classList.contains('delete-btn')) {
        
        // Pega o ID do colaborador armazenado no atributo data-id
        const docId = event.target.dataset.id;
        const colaboradorNome = event.target.title.replace('Excluir ', '');

        // Pede confirmação ao usuário
        const isConfirmed = confirm(`Tem certeza que deseja excluir ${colaboradorNome}? Esta ação não pode ser desfeita.`);

        if (isConfirmed) {
            try {
                setLoadingState(`Excluindo ${colaboradorNome}...`);

                // Usa o deleteDoc para remover o documento do Firestore
                await deleteDoc(doc(db, "colaboradores", docId));

                setLoadingState("Colaborador excluído! Atualizando organograma...");

                // Recarrega os dados e redesenha a tela
                await loadInitialData();
                
                // Redesenha a visão que estava ativa
                const activeDept = deptSelect.value;
                if(activeDept) {
                    renderSingleDepartmentView(activeDept);
                } else {
                    renderAllDepartmentsView();
                }

            } catch (error) {
                console.error("❌ Erro ao excluir colaborador:", error);
                setErrorState("Não foi possível excluir. Tente novamente.");
            }
        }
    }
}