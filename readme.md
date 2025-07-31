# Organograma Interativo com Firebase e Docker


## 📜 Sobre o Projeto

Este projeto é uma aplicação web moderna e interativa para visualização e gerenciamento de organogramas empresariais. Desenvolvido com tecnologias frontend puras e integrado com o Firebase, ele oferece uma solução dinâmica, em tempo real e segura para gerenciar a estrutura de uma equipe.

A aplicação conta com um sistema de autenticação, permitindo que apenas usuários autorizados acessem e modifiquem os dados.

---

## ✨ Funcionalidades Principais

*   **Autenticação de Usuários:** Tela de login segura para acesso ao sistema.
*   **Visualização Hierárquica:** Organogramas gerados dinamicamente com base nos dados.
*   **Filtragem por Departamento:** Visualize o organograma completo ou filtre por departamentos específicos através de um menu dropdown.
*   **CRUD de Colaboradores:**
    *   **Adicionar:** Crie novos colaboradores através de um formulário intuitivo.
    *   **Excluir:** Remova colaboradores diretamente pela interface do organograma.
*   **Backend Serverless:** Utiliza Firebase (Firestore e Authentication) para um backend robusto, escalável e em tempo real.
*   **Pronto para Implantação:** O projeto inclui um `Dockerfile` para fácil "containerização" e implantação em qualquer ambiente de nuvem.

---

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
*   **Banco de Dados:** [Google Firestore](https://firebase.google.com/docs/firestore) (NoSQL, em tempo real)
*   **Autenticação:** [Firebase Authentication](https://firebase.google.com/docs/auth) (Login com E-mail/Senha)
*   **Biblioteca de Gráficos:** [Google Charts](https://developers.google.com/chart)
*   **Containerização:** [Docker](https://www.docker.com/) com NGINX

---

## 🚀 Como Executar o Projeto

Siga os passos abaixo para configurar e executar o projeto em seu ambiente local.

### Pré-requisitos

*   [Node.js](https://nodejs.org/en/) (para o script de migração de dados inicial)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado e em execução.
*   Uma conta no [Firebase](https://firebase.google.com/).

### Configuração do Firebase

1.  Crie um novo projeto no console do Firebase.
2.  No seu projeto, vá para **Firestore Database** e crie um novo banco de dados (pode iniciar em modo de teste).
3.  Vá para **Authentication**, na aba "Método de login", e ative o provedor **"E-mail/senha"**.
4.  Crie um usuário de teste na aba "Usuários" do Authentication.
5.  Vá para **Configurações do Projeto** (ícone de engrenagem) e, em "Seus apps", registre um novo app da Web. Copie o objeto `firebaseConfig`.

### Configuração Local

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
    cd SEU_REPOSITORIO
    ```

2.  **Configure as credenciais:**
    *   No arquivo `js/script.js`, cole o objeto `firebaseConfig` que você copiou do console.
    *   Faça o mesmo no arquivo `js/login.js`.

3.  **(Opcional) Migração de Dados Iniciais:**
    *   Para popular o banco com dados iniciais (a partir de `output.json`), você precisará de uma chave de serviço do Firebase.
    *   Vá em Configurações do Projeto > Contas de serviço e gere uma nova chave privada. Salve o arquivo como `firebase-adminsdk.json` na raiz do projeto. **Este arquivo está no `.gitignore` e não deve ser "commitado"**.
    *   Instale as dependências: `npm install firebase-admin`
    *   Execute o script de migração: `node seed.js`

### Executando com Docker

Esta é a maneira recomendada para rodar a aplicação.

1.  **Construa a imagem Docker:**
    ```bash
    docker build -t organograma-app .
    ```

2.  **Execute o contêiner:**
    ```bash
    docker run -d -p 8080:80 --name organograma-container organograma-app
    ```

3.  Abra seu navegador e acesse **`http://localhost:8080`**. Você será direcionado para a tela de login.

---

**Pietro Medeiros** | [Meu Linkedin](https://www.linkedin.com/in/pietro-medeiros-770bba162/)
