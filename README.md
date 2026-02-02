# Sistema de Estoque

Sistema de gerenciamento de estoque em tempo real (possui filtro pra tudo)

## Estrutura do Projeto

```
Estoque/
├── backend/                   # Backend Node.js + Express
│   ├── server.js              # Servidor principal
│   ├── database.js            # Operações SQLite3
│   └── controllers/           # (vazio por enquanto)
│
├── frontend/                  # Frontend (JS)
│   ├── html/                  # Arquivos HTML
│   │   ├── index.html         # Dashboard
│   │   ├── inventario.html    # Visualização de estoque (não-logado pode ver)
│   │   ├── produtos.html      # Gerenciar produtos (apenas logado vê)
│   │   ├── cadastro.html      # Cadastro de grupos (apenas logado vê)
│   │   ├── movimentos.html    # Movimentações (apenas logado vê)
│   │   ├── relatorios.html    # Relatórios (apenas logado vê)
│   │   ├── login.html         # Login (obsoleto, não quis tirar)
│   │   └── sidebar.html       # Navegação compartilhada (na verdade é um navbar)
│   │
│   ├── js/                    # JavaScript Frontend
│   │   ├── sidebar.js         # Gerenciar sidebar e autenticação (sidebar = navbar)
│   │   ├── dashboard.js       # Dashboard com estatísticas
│   │   ├── inventario.js      # Filtros e visualização (público)
│   │   ├── script.js          # Funções gerais de produtos
│   │   ├── cadastro.js        # Gerenciar grupos/famílias
│   │   ├── movimentos.js      # Registrar movimentações
│   │   └── relatorios.js      # Gerar relatórios
│   │
│   ├── styles.css             # Estilos globais
│   └── html/                  # (Arquivos HTML)
│
├── database/                  # SQLite database (auto-gerado)
│   └── estoque.db
│
├── node_modules/             # Dependências npm
├── package.json              # Configuração npm
├── .env                      # Variáveis de ambiente
├── .gitignore
└── iniciar.bat               # Script de inicialização (Windows)
```

## Como usar

### Instalação
```bash
npm install
```

### Iniciar o servidor
```bash
npm start
```

Ou no Windows:
```bash
iniciar.bat
```

O servidor rodará em `http://localhost:3000`  
Acesso via LAN: `http://<seu-ip>:3000` (mostrado no console)

## Meios de login

- **Inventário**: Público, sem autenticação
- **Outros recursos**: Requer login
- **Login**: Na sidebar

**Usuários demo:**
- `admin` / `admin123`
- `user` / `user123`

## Explicação de cada página

| Página | Acesso | Descrição |
|--------|--------|-----------|
| Dashboard | Público | Resumo com estatísticas |
| Inventário | Público | Filtros avançados, (não-admin não pode editar) |
| Produtos | Autenticado | Adicionar/editar/deletar produtos |
| Cadastro de Grupos | Autenticado | Definir categorias, subfamilias, tags |
| Movimentações | Autenticado | Registrar entrada/saída de produtos |
| Relatórios | Autenticado | Análises e relatórios detalhados |

## Bugigangas

- **Backend**: Node.js + Express.js
- **Banco de dados**: SQLite3
- **Frontend**: HTML5 + Vanilla JavaScript + CSS3
- **Autenticação**: Bearer Token (Base64)
