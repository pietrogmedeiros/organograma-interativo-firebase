// js/login.js

// Importa as funções necessárias do Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

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
        // Garante que a sessão seja persistida no armazenamento local
        await setPersistence(auth, browserLocalPersistence);
        // Tenta fazer o login com a função do Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('[LOGIN] signIn OK para', userCredential.user.email);
        // Força obtenção de token para garantir que a sessão esteja válida antes de redirecionar
        try {
            const t = await userCredential.user.getIdToken(true);
            console.log('[LOGIN] Token obtido (tamanho):', t ? t.length : 0);
        } catch (tokErr) {
            console.warn('[LOGIN] Falha ao obter token imediatamente, seguindo mesmo assim.', tokErr);
        }
        
        // Salvar dados do usuário no localStorage
        const user = {
            email: userCredential.user.email,
            uid: userCredential.user.uid,
            loginTime: new Date().toISOString()
        };
    localStorage.setItem('user', JSON.stringify(user));
    // Marca que acabou de logar (grace period na página principal)
    sessionStorage.setItem('justLoggedAt', String(Date.now()));
        
        // Se o login for bem-sucedido, redireciona para a página do organograma
        window.location.href = 'index.html';

    } catch (error) {
        // Se der erro, mostra uma mensagem amigável
        console.error('[LOGIN] Erro:', error.code, error.message);
        let msg = 'Não foi possível entrar.';
        switch (error.code) {
            case 'auth/invalid-email':
                msg = 'E-mail inválido.'; break;
            case 'auth/user-disabled':
                msg = 'Usuário desativado.'; break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                msg = 'E-mail ou senha incorretos.'; break;
            case 'auth/too-many-requests':
                msg = 'Muitas tentativas. Tente novamente mais tarde.'; break;
            case 'auth/network-request-failed':
                msg = 'Falha de rede. Verifique sua conexão.'; break;
            case 'auth/operation-not-allowed':
                msg = 'Método de login desabilitado no projeto.'; break;
            case 'auth/unauthorized-domain':
                msg = 'Domínio não autorizado no Firebase Auth (adicione "localhost" em Domínios autorizados).'; break;
            default:
                msg = `Erro de login (${error.code || 'desconhecido'}).`;
        }
        showError(msg);
    }
});

// --- Função para mostrar erros ---
function showError(message) {
    loginError.textContent = message;
    loginError.classList.remove('hidden');
}