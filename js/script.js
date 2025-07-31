// js/script.js - VERSÃO COM AUTENTICAÇÃO

// --- IMPORTAÇÃO E CONFIGURAÇÃO DO FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
// ALTERADO: Adicionando as funções de autenticação
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
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
const auth = getAuth(app); // ADICIONADO: Inicializa o serviço de autenticação

// --- VERIFICAÇÃO DE AUTENTICAÇÃO (BLOCO DE SEGURANÇA) ---
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Se não há usuário logado, redireciona para a página de login
        console.log("Usuário não logado. Redirecionando para /login.html");
        window.location.href = '/login.html';
    } else {
        // Se o usuário está logado, podemos continuar
        console.log("Usuário logado:", user.email);
        // Exibe o email do usuário no header
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.textContent = user.email;
        }
    }
});

// --- ESTADO GLOBAL ---
let colaboradoresData = [];
let departmentsList = [];

// --- ELEMENTOS DO DOM ---
const chartContainer = document.getElementById('chart-container');
const btnViewAll = document.getElementById('btn-view-all');
const deptSelect = document.getElementById('dept-select');
const btnAddColaborador = document.getElementById('btn-add-colaborador');
const addColaboradorModal = document.getElementById('add-colaborador-modal');
const addColaboradorForm = document.getElementById('add-colaborador-form');
const btnCancelAdd = document.getElementById('btn-cancel-add');
const colabDeptoSelect = document.getElementById('colab-depto');
const colabGestorSelect = document.getElementById('colab-gestor');
const btnLogout = document.getElementById('btn-logout'); // ADICIONADO: Botão de Logout


// --- FUNÇÃO PRINCIPAL ---
document.addEventListener('DOMContentLoaded', () => {
    // Listeners dos botões de visualização
    btnViewAll.addEventListener('click', () => {
        setActiveButton(btnViewAll);
        deptSelect.value = "";
        renderAllDepartmentsView();
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

    // Listeners do Modal de Adicionar
    btnAddColaborador.addEventListener('click', openAddModal);
    btnCancelAdd.addEventListener('click', closeAddModal);
    addColaboradorModal.addEventListener('click', (e) => {
        if (e.target === addColaboradorModal) closeAddModal();
    });
    addColaboradorForm.addEventListener('submit', handleAddColaborador);

    // Listener de exclusão
    chartContainer.addEventListener('click', handleDeleteColaborador);

    // ADICIONADO: Listener do botão de Logout
    btnLogout.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // O onAuthStateChanged vai detectar a saída e redirecionar automaticamente.
        } catch (error) {
            console.error("Erro ao fazer logout:", error);
        }
    });

    // ALTERADO: A chamada inicial dos dados agora é feita após a verificação de login
    loadInitialData();
});

// --- LÓGICA DO MODAL E DO FORMULÁRIO ---
// (Nenhuma alteração nesta seção)
function openAddModal() {
    populateFormField(colabDeptoSelect, departmentsList);
    const allColaboradoresNomes = colaboradoresData.map(c => c.Colaborador).sort();
    populateFormField(colabGestorSelect, allColaboradoresNomes, true);
    addColaboradorModal.classList.remove('hidden');
}

function closeAddModal() {
    addColaboradorForm.reset();
    addColaboradorModal.classList.add('hidden');
}

async function handleAddColaborador(event) {
    event.preventDefault();
    const formData = new FormData(addColaboradorForm);
    const novoColaborador = {
        Colaborador: formData.get('nome'),
        Cargo: formData.get('cargo'),
        Departamento: formData.get('departamento'),
        Gestor: formData.get('gestor')
    };
    const docId = novoColaborador.Colaborador.replace(/\s+/g, '-').toLowerCase();

    try {
        setLoadingState("Salvando novo colaborador...");
        await setDoc(doc(db, "colaboradores", docId), novoColaborador);
        closeAddModal();
        setLoadingState("Colaborador salvo! Atualizando organograma...");
        await loadInitialData();
        renderAllDepartmentsView();
    } catch (error) {
        console.error("❌ Erro ao salvar colaborador:", error);
        setErrorState("Não foi possível salvar. Tente novamente.");
    }
}

function populateFormField(selectElement, data, keepFirstOption = false) {
    const firstOption = selectElement.options[0];
    selectElement.innerHTML = '';
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
// (Nenhuma alteração nesta seção)
async function loadInitialData() {
    setLoadingState("Carregando dados...");
    try {
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

async function handleDeleteColaborador(event) {
    if (event.target.classList.contains('delete-btn')) {
        const docId = event.target.dataset.id;
        const colaboradorNome = event.target.title.replace('Excluir ', '');
        const isConfirmed = confirm(`Tem certeza que deseja excluir ${colaboradorNome}? Esta ação não pode ser desfeita.`);

        if (isConfirmed) {
            try {
                setLoadingState(`Excluindo ${colaboradorNome}...`);
                await deleteDoc(doc(db, "colaboradores", docId));
                setLoadingState("Colaborador excluído! Atualizando organograma...");
                await loadInitialData();
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