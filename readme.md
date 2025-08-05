# Organograma Webcontinental

Uma aplicação web moderna para visualização e gerenciamento de organogramas empresariais.

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

## 🚀 Como Executar

### Pré-requisitos
- Node.js (versão 14 ou superior)
- NPM ou Yarn

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

### Com Docker

```bash
docker build -t organograma .
docker run -p 3000:3000 organograma
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
