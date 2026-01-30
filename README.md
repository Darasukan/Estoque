# 📦 Sistema de Controle de Estoque e Fluxo

Um sistema web completo para gerenciar estoque e movimentação de produtos.

## ✨ Funcionalidades

- **Gerenciamento de Produtos**: Cadastro, edição e exclusão de produtos
- **Controle de Fluxo**: Registrar entradas e saídas de produtos
- **Relatórios**: Visualizar estoque baixo, valor total e movimentações
- **Interface Amigável**: Design moderno e responsivo

## 🚀 Como Começar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Iniciar o Servidor

```bash
npm start
```

Ou em modo desenvolvimento (com auto-recarregamento):

```bash
npm run dev
```

O sistema estará disponível em: **http://localhost:3000**

## 📁 Estrutura do Projeto

```
Estoque/
├── backend/
│   ├── server.js       # Servidor Express
│   └── database.js     # Configuração do SQLite
├── frontend/
│   ├── index.html      # Interface
│   ├── styles.css      # Estilos
│   └── script.js       # Lógica do cliente
├── database/
│   └── estoque.db      # Banco de dados (criado automaticamente)
└── package.json        # Dependências
```

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js + Express
- **Banco de Dados**: SQLite3
- **Frontend**: HTML5 + CSS3 + JavaScript Vanilla

## 📊 Funcionalidades Detalhadas

### Produtos
- Adicionar novo produto com nome, SKU, quantidade, preço e categoria
- Editar informações de produtos existentes
- Deletar produtos
- Listar todos os produtos com suas informações

### Movimentações
- Registrar entrada de estoque
- Registrar saída de estoque
- Adicionar motivo da movimentação
- Histórico completo de movimentos

### Relatórios
- Produtos com estoque baixo (configurável)
- Resumo de estoque (total de produtos, valor total, produtos em falta)
- Histórico de movimentação por produto

## 🔧 API Endpoints

### Produtos
- `GET /api/produtos` - Listar todos
- `POST /api/produtos` - Criar novo
- `PUT /api/produtos/:id` - Atualizar
- `DELETE /api/produtos/:id` - Deletar

### Movimentos
- `GET /api/movimentos` - Listar todos
- `POST /api/movimentos` - Registrar movimento

### Relatórios
- `GET /api/relatorios/estoque-baixo` - Produtos com estoque baixo
- `GET /api/relatorios/movimentos/:produto_id` - Histórico de um produto

## 💾 Banco de Dados

O SQLite cria automaticamente as tabelas necessárias:

- **produtos**: Armazena informações dos produtos
- **movimentos**: Registra entradas e saídas

## 📝 Próximas Melhorias (Sugestões)

- [ ] Autenticação de usuários
- [ ] Exportar relatórios em PDF/Excel
- [ ] Gráficos e dashboard
- [ ] Integração com APIs externas
- [ ] Backup automático do banco de dados
- [ ] Notificações de estoque baixo
- [ ] Múltiplos depósitos/filiais

## 📧 Suporte

Qualquer dúvida, entre em contato ou abra uma issue!
