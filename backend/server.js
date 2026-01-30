const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = 3000;

// Usuários demo (Em produção, isso seria um banco de dados)
const usuarios = {
  'admin': { senha: 'admin123', perfil: 'admin' },
  'user': { senha: 'user123', perfil: 'usuario' }
};

// Middleware de autenticação
function verificarToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Acesso não autorizado' });
  }

  // Verificar token (simples para demo)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [usuario] = decoded.split(':');
    
    if (usuarios[usuario]) {
      req.usuario = usuario;
      req.perfil = usuarios[usuario].perfil;
      next();
    } else {
      res.status(401).json({ error: 'Token inválido' });
    }
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Inicializar banco de dados
db.initialize();

// ==================== ROTAS DE AUTENTICAÇÃO ====================

// POST - Login
app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios' });
  }

  const user = usuarios[usuario];
  
  if (!user || user.senha !== senha) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos' });
  }

  // Gerar token simples (em produção usar JWT)
  const token = Buffer.from(`${usuario}:${Date.now()}`).toString('base64');

  res.json({
    token,
    usuario,
    perfil: user.perfil,
    message: 'Login realizado com sucesso'
  });
});

// POST - Logout
app.post('/api/logout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// GET - Verificar autenticação
app.get('/api/me', verificarToken, (req, res) => {
  res.json({
    usuario: req.usuario,
    perfil: req.perfil
  });
});

// ==================== ROTAS DE PRODUTOS ====================

// GET - Listar todos os produtos
app.get('/api/produtos', verificarToken, (req, res) => {
  db.getProdutos((err, produtos) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(produtos);
  });
});

// POST - Adicionar novo produto
app.post('/api/produtos', verificarToken, (req, res) => {
  const { nome, sku, quantidade, preco, categoria } = req.body;
  
  if (!nome || !sku || quantidade === undefined) {
    return res.status(400).json({ error: 'Nome, SKU e quantidade são obrigatórios' });
  }

  db.addProduto(nome, sku, quantidade, preco || 0, categoria || 'Geral', (err, id) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, message: 'Produto adicionado com sucesso' });
  });
});

// PUT - Atualizar produto
app.put('/api/produtos/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nome, sku, quantidade, preco, categoria } = req.body;

  db.updateProduto(id, nome, sku, quantidade, preco, categoria, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Produto atualizado com sucesso' });
  });
});

// DELETE - Deletar produto
app.delete('/api/produtos/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  db.deleteProduto(id, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Produto deletado com sucesso' });
  });
});

// ==================== ROTAS DE FLUXO (MOVIMENTAÇÃO) ====================

// GET - Listar todos os movimentos
app.get('/api/movimentos', verificarToken, (req, res) => {
  db.getMovimentos((err, movimentos) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(movimentos);
  });
});

// POST - Registrar movimento (entrada/saída)
app.post('/api/movimentos', verificarToken, (req, res) => {
  const { produto_id, tipo, quantidade, motivo } = req.body;

  if (!produto_id || !tipo || !quantidade) {
    return res.status(400).json({ error: 'Produto, tipo e quantidade são obrigatórios' });
  }

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo deve ser "entrada" ou "saida"' });
  }

  db.addMovimento(produto_id, tipo, quantidade, motivo || '', (err, id) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, message: 'Movimento registrado com sucesso' });
  });
});

// PUT - Atualizar movimento
app.put('/api/movimentos/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { produto_id, tipo, quantidade, motivo } = req.body;

  if (!produto_id || !tipo || !quantidade) {
    return res.status(400).json({ error: 'Produto, tipo e quantidade são obrigatórios' });
  }

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo deve ser "entrada" ou "saida"' });
  }

  db.updateMovimento(id, produto_id, tipo, quantidade, motivo || '', (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Movimento atualizado com sucesso' });
  });
});

// DELETE - Deletar movimento
app.delete('/api/movimentos/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  db.deleteMovimento(id, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Movimento deletado com sucesso' });
  });
});

// ==================== ROTAS DE RELATÓRIOS ====================

// GET - Relatório de estoque baixo
app.get('/api/relatorios/estoque-baixo', verificarToken, (req, res) => {
  db.getEstoqueBaixo((err, produtos) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(produtos);
  });
});

// GET - Histórico de movimentação de um produto
app.get('/api/relatorios/movimentos/:produto_id', verificarToken, (req, res) => {
  const { produto_id } = req.params;

  db.getMovimentosPorProduto(produto_id, (err, movimentos) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(movimentos);
  });
});

// Rota padrão
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
