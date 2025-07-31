// js/login.js

// Importa as funções necessárias do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// SUAS CREDENCIAIS DO FIREBASE (AS MESMAS DO SEU OUTRO SCRIPT)
const firebaseConfig = {
apiKey: "AIzaSyD76HOZNa8yWSVmeJtrkxFmdxtsvlt2arY",
  authDomain: "organograma-empresa.firebaseapp.com",
  projectId: "organograma-empresa",
  storageBucket: "organograma-empresa.firebasestorage.app",
  messagingSenderId: "256795992111",
  appId: "1:256795992111:web:6d8cb3e8e3ea5ae316a6da"
};

// Inicializa o Firebase e o serviço de Autenticação
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Elementos do DOM ---
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

// --- Listener para o envio do formulário ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Previne o recarregamento da página

    const email = emailInput.value;
    const password = passwordInput.value;

    try {
        // Tenta fazer o login com a função do Firebase
        await signInWithEmailAndPassword(auth, email, password);
        
        // Se o login for bem-sucedido, redireciona para a página do organograma
        window.location.href = '/index.html';

    } catch (error) {
        // Se der erro, mostra uma mensagem amigável
        console.error("Erro de login:", error.code);
        showError("E-mail ou senha inválidos. Tente novamente.");
    }
});

// --- Função para mostrar erros ---
function showError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}