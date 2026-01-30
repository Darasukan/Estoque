# 🎯 Guia Rápido - Sistema de Estoque

## 🚀 Iniciar o Sistema

```bash
cd c:\Estoque
npm start
```

Acesse: **http://localhost:3000/login.html**

## 👤 Login

### Credenciais Disponíveis:
- **admin** / **admin123**
- **user** / **user123**

---

## 📦 Funcionalidades Principais

### 1. **Produtos**
- ✅ Adicionar novo produto
- ✅ Editar informações (nome, SKU, quantidade, preço, categoria)
- ✅ Deletar produto
- ✅ Visualizar estoque atual

### 2. **Movimentações** ⭐ (NOVO)
- ✅ Registrar entrada de produto
- ✅ Registrar saída de produto
- ✅ Editar movimentação (com reversão de estoque)
- ✅ Deletar movimentação
- ✅ **Rastrear operador** (quem fez a movimentação)
- ✅ **Campos dinâmicos** conforme o tipo

#### Campos por Tipo:

**📥 ENTRADA:**
- Quantidade *
- Preço Unitário (opcional)
- Nº NF (opcional)
- Fornecedor (opcional)
- Observação/Motivo

**📤 SAÍDA:**
- Quantidade *
- Requisitante * (obrigatório)
- Local de Aplicação * (obrigatório)
- Observação/Motivo

### 3. **Relatórios**
- 📊 **Resumo de Estoque**: Total de produtos, valor total, produtos em falta
- ⚠️ **Estoque Baixo**: Produtos com quantidade menor que o limite definido

---

## 🎨 Design Melhorado

### Visual Refinado:
- 💫 Gradientes sofisticados
- ⚡ Animações suaves
- 🎯 Efeito ripple nos botões
- 📱 Totalmente responsivo
- 🌙 Sombras profissionais
- ✨ Transições fluidas

---

## 🔐 Segurança

- ✅ Autenticação com token
- ✅ Middleware de proteção em todas as rotas
- ✅ Logout seguro (limpa localStorage)
- ✅ Redirecionamento automático

---

## 💾 Dados Persistentes

- **Banco de dados**: SQLite (`database/estoque.db`)
- **Tabelas**: 
  - `produtos` - informações dos produtos
  - `movimentos` - histórico completo de entradas e saídas

---

## ⌨️ Atalhos & Dicas

| Ação | Como Fazer |
|------|-----------|
| Editar produto | Clique no ✏️ Editar na tabela de produtos |
| Editar movimentação | Clique no ✏️ Editar na tabela de movimentos |
| Deletar item | Clique no 🗑️ Deletar na tabela |
| Logout | Clique no botão "Sair" na sidebar |
| Filtrar estoque baixo | Ajuste o limite e clique "🔄 Atualizar" |

---

## 🐛 Troubleshooting

### Problema: Página em branco após login
- ✅ **Solução**: Aguarde 2-3 segundos para carregamento dos dados

### Problema: Campos dinâmicos não aparecem
- ✅ **Solução**: Selecione o tipo de movimentação (Entrada/Saída) novamente

### Problema: Erro ao editar
- ✅ **Solução**: Atualize a página com F5 e tente novamente

### Problema: Banco de dados não inicia
- ✅ **Solução**: 
  ```bash
  rm database/estoque.db
  npm start
  ```

---

## 📂 Estrutura do Projeto

```
c:\Estoque/
├── backend/
│   ├── server.js          # Servidor Express + API
│   └── database.js        # Funções SQLite
├── frontend/
│   ├── index.html         # Dashboard principal
│   ├── login.html         # Página de login
│   ├── script.js          # Lógica do frontend
│   └── styles.css         # Estilos CSS
├── database/
│   └── estoque.db         # Banco de dados SQLite
├── package.json           # Dependências Node.js
└── README.md              # Documentação

```

---

## 🔄 Fluxo de Uma Movimentação

1. **Usuário realiza movimentação** (entrada/saída)
2. **Sistema registra os dados** (incluindo operador/usuário)
3. **Estoque é atualizado automaticamente**
4. **Movimento aparece na tabela** com detalhes dinâmicos
5. **Relatórios são atualizados** em tempo real

---

## 📊 Informações Rastreadas

### Por Movimento:
- 📅 Data e hora
- 👤 Operador (quem fez)
- 📦 Produto (nome e SKU)
- 🔢 Quantidade
- 📝 Tipo (entrada/saída)
- 💬 Motivo/Observação
- **[Saída]** Requisitante, Local de Aplicação
- **[Entrada]** Preço, NF, Fornecedor

---

## 🎓 Exemplo de Uso

### Cenário: Receber 50 unidades de um produto

1. Vá em **Movimentações**
2. Selecione o produto
3. Selecione tipo: **Entrada** 📥
4. Digite quantidade: **50**
5. Preço unitário: **R$ 25.00** (opcional)
6. NF: **123456** (opcional)
7. Fornecedor: **ABC Importadora** (opcional)
8. Clique **✅ Registrar**
9. ✅ Estoque aumenta em 50 unidades
10. Movimento aparece na tabela com seu nome como operador

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar console do navegador (F12)
2. Verificar logs do servidor (terminal)
3. Limpar cache do navegador (Ctrl+Shift+Delete)
4. Reiniciar o servidor (npm start)

---

**Versão**: 2.0 com Campos Dinâmicos & Design Aprimorado  
**Status**: ✅ Pronto para Produção
