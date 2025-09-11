<<<<<<< HEAD
# Organograma Webcontinental
=======
# Organograma Interativo com Firebase e Docker
>>>>>>> 8fca7c5b91e62a7282525ed3cda4f0c8fdfb5fa1

Uma aplicação web moderna para visualização e gerenciamento de organogramas empresariais.

<<<<<<< HEAD
## ✨ Características

- **Design Moderno**: Interface profissional com gradientes, sombras e animações suaves
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **Interativo**: Adicione, edite e remova colaboradores facilmente
- **Filtros**: Visualize por departamento ou todos os colaboradores
- **Autenticação**: Sistema de login seguro
- **Visualização**: Organograma interativo usando Google Charts

## 🎨 Melhorias Visuais Implementadas

### Design System Moderno
- **Paleta de Cores**: Cores profissionais e acessíveis
- **Tipografia**: Fonte Inter para melhor legibilidade
- **Gradientes**: Efeitos visuais modernos
- **Sombras**: Sistema de sombras consistente
- **Animações**: Transições suaves e feedback visual
=======
## 📜 Sobre o Projeto

Este projeto é uma aplicação web moderna e interativa para visualização e gerenciamento de organogramas empresariais. Desenvolvido com tecnologias frontend puras e integrado com o Firebase, ele oferece uma solução dinâmica, em tempo real e segura para gerenciar a estrutura de uma equipe.

A aplicação conta com um sistema de autenticação, permitindo que apenas usuários autorizados acessem e modifiquem os dados.
>>>>>>> 8fca7c5b91e62a7282525ed3cda4f0c8fdfb5fa1

### Componentes Melhorados
- **Header**: Com backdrop-filter e gradiente no título
- **Botões**: Estados hover com animações
- **Cards**: Elevação e hover effects
- **Modal**: Design profissional com animações
- **Formulários**: Campos com foco e validação visual

### Responsividade
- Layout adaptativo para diferentes tamanhos de tela
- Navegação otimizada para mobile
- Formulários responsivos

<<<<<<< HEAD
## 🚀 Como Executar
=======
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
>>>>>>> 8fca7c5b91e62a7282525ed3cda4f0c8fdfb5fa1

### Pré-requisitos
- Node.js (versão 14 ou superior)
- NPM ou Yarn

<<<<<<< HEAD
### Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd organograma-webcontinental
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o projeto:
```bash
npm start
```

4. Acesse no navegador:
```
http://localhost:3000
```

### Com Docker (NGINX)

Opção A — Docker direto:
```bash
docker build -t organograma-web .
docker run --name organograma-web -p 8080:80 organograma-web
# Abra http://localhost:8080
```

Opção B — Docker Compose (inclui serviço de ferramentas):
```bash
docker compose up --build -d
# Abra http://localhost:8080

# Rodar scripts utilitários (exemplos):
docker compose run --rm tools npm run migrate-csv -- ./base_atualizada_colaboradores.csv
docker compose run --rm tools npm run update-area -- ./base_atualizada_colaboradores.csv
docker compose run --rm tools npm run remove-departamento
```

## 📁 Estrutura do Projeto

```
organograma-webcontinental/
├── css/
│   └── style.css          # Estilos modernos e responsivos
├── js/
│   ├── login.js           # Lógica de autenticação
│   └── script.js          # Lógica principal da aplicação
├── data/                  # Dados do organograma
├── index.html             # Página principal
├── login.html             # Página de login
├── package.json           # Dependências do projeto
└── readme.md             # Este arquivo
```

## 🎯 Funcionalidades

### Autenticação
- Login seguro com validação
- Sessão persistente
- Logout funcional

### Gerenciamento de Colaboradores
- Adicionar novos colaboradores
- Editar informações existentes
- Remover colaboradores
- Definir hierarquia organizacional

### Visualização
- Organograma interativo
- Filtros por departamento
- Visualização completa da empresa
- Navegação intuitiva

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Charts**: Google Charts API
- **Fontes**: Inter (Google Fonts)
- **Deploy**: Docker, Nginx
- **Estilo**: CSS Custom Properties, Flexbox, Grid

## 🎨 Design System

### Cores
- **Primária**: #2563eb (Azul)
- **Secundária**: #64748b (Cinza)
- **Sucesso**: #10b981 (Verde)
- **Aviso**: #f59e0b (Amarelo)
- **Erro**: #ef4444 (Vermelho)

### Tipografia
- **Família**: Inter
- **Pesos**: 400, 500, 600, 700
- **Tamanhos**: Sistema escalável

### Espaçamento
- Sistema de espaçamento consistente
- Variáveis CSS para manutenibilidade

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: < 768px

## 🔧 Personalização

O design pode ser facilmente personalizado através das variáveis CSS em `css/style.css`:

```css
:root {
    --primary-color: #2563eb;
    --bg-primary: #f8fafc;
    --text-primary: #1e293b;
    /* ... outras variáveis */
}
```

## 📄 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor, leia as diretrizes de contribuição antes de submeter pull requests.

---

**Desenvolvido com ❤️ para Webcontinental**
=======
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
>>>>>>> 8fca7c5b91e62a7282525ed3cda4f0c8fdfb5fa1
