# 📊 Organograma Interativo com Firebase



## 📑 Sobre o Projeto

O **Organograma Interativo** é uma aplicação web moderna e dinâmica projetada para visualizar e gerenciar a estrutura hierárquica de uma empresa. Construído com tecnologias web padrão e integrado ao poder do **Google Firebase**, este projeto oferece uma solução em tempo real, escalável e de fácil manutenção para qualquer organização.

A aplicação permite não apenas a visualização clara dos departamentos e da cadeia de comando, mas também o gerenciamento completo de colaboradores, incluindo a adição e remoção de membros diretamente pela interface.

---

## ✨ Funcionalidades Principais

*   **Visualização Dinâmica**: Renderiza organogramas claros e interativos usando a biblioteca Google Charts.
*   **Backend Serverless**: Utiliza o **Firebase Firestore** como um banco de dados NoSQL em tempo real, eliminando a necessidade de um servidor tradicional.
*   **Filtragem por Departamento**: Permite visualizar a estrutura completa da empresa ou focar em departamentos específicos através de um menu dropdown.
*   **Gerenciamento CRUD Completo**:
    *   **Adicionar Colaborador**: Um formulário modal intuitivo para cadastrar novos membros.
    *   **Excluir Colaborador**: Remoção de membros com um clique (e confirmação), atualizando a estrutura em tempo real.
    *   *(Em desenvolvimento: Edição de colaboradores e gerenciamento de departamentos).*
*   **Interface Limpa e Responsiva**: Design moderno e funcional construído com HTML5 e CSS3.

---

## 🚀 Tecnologias Utilizadas

Este projeto foi construído utilizando as seguintes tecnologias:

*   **Frontend**:
    *   ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
    *   ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
    *   ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black) (ES6 Modules)
*   **Backend & Banco de Dados**:
    *   ![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black) (Firestore Database)
*   **Visualização de Dados**:
    *   **Google Charts**

---

## 🛠️ Como Executar o Projeto

Siga os passos abaixo para configurar e rodar uma cópia local desta aplicação.

### Pré-requisitos

*   Você precisa ter uma conta no [Google Firebase](https://firebase.google.com/).
*   É necessário ter o [Node.js](https://nodejs.org/) (que inclui o npm) instalado em sua máquina.
*   Um editor de código como o [VS Code](https://code.visualstudio.com/) com a extensão **Live Server**.

### Passo a Passo

1.  **Clone o Repositório**
    ```bash
    git clone https://github.com/seu-usuario/seu-repositorio.git
    cd seu-repositorio
    ```

2.  **Configure o Firebase**
    *   Crie um novo projeto no console do Firebase.
    *   Ative o **Firestore Database** em modo de teste ou configure as [regras de segurança](#regras-de-segurança) para permitir leitura e escrita.
    *   Nas configurações do projeto, registre um novo **App da Web**.

3.  **Configure as Variáveis de Ambiente**
    *   No seu projeto Firebase, vá em "Configurações do projeto" e copie o objeto de configuração `firebaseConfig`.
    *   Abra o arquivo `js/script.js` e cole suas credenciais na constante `firebaseConfig`.
    ```javascript
    const firebaseConfig = {
      apiKey: "SUA_API_KEY",
      authDomain: "SEU_AUTH_DOMAIN",
      // ...etc
    };
    ```

4.  **Popule o Banco de Dados (Opcional)**
    *   Se você possui dados iniciais (como o arquivo `output.json` deste projeto), pode populá-los no Firestore.
    *   Obtenha sua chave de administrador em "Configurações do projeto" > "Contas de serviço", gere uma nova chave privada e salve o arquivo como `firebase-adminsdk.json` na raiz do projeto.
    *   Instale as dependências e execute o script de _seeding_:
    ```bash
    npm install
    node seed.js
    ```

5.  **Inicie a Aplicação**
    *   Abra o projeto no VS Code.
    *   Clique com o botão direito no arquivo `index.html`.
    *   Selecione **"Open with Live Server"**.

A aplicação será aberta em seu navegador, pronta para uso!

---

### 📜 Regras de Segurança (Firestore)

Para desenvolvimento, você pode usar regras abertas. Na aba "Regras" do seu Firestore, use:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // ATENÇÃO: Apenas para desenvolvimento.
      // Em produção, restrinja o acesso.
      allow read, write: if true;
    }
  }
}