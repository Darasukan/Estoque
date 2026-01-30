const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.API_PORT || 3000;

// Servir arquivos estáticos da pasta frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Usuários demo (Em produção, isso seria um banco de dados)
const usuarios = {
  'admin': { senha: process.env.ADMIN_PASSWORD || 'admin123', perfil: 'admin' },
  'user': { senha: process.env.USER_PASSWORD || 'user123', perfil: 'usuario' }
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
  const { nome, sku, quantidade, preco, subcategoria_id } = req.body;
  
  if (!sku || quantidade === undefined) {
    return res.status(400).json({ error: 'SKU e quantidade são obrigatórios' });
  }

  // Validar quantidade não negativa
  if (isNaN(quantidade) || parseInt(quantidade) < 0) {
    return res.status(400).json({ error: 'Quantidade deve ser um número maior ou igual a 0' });
  }

  // Validar preço não negativo
  if (preco && isNaN(preco)) {
    return res.status(400).json({ error: 'Preço deve ser um número válido' });
  }

  if (preco && parseFloat(preco) < 0) {
    return res.status(400).json({ error: 'Preço não pode ser negativo' });
  }

  db.addProduto(nome || null, sku, parseInt(quantidade), parseFloat(preco) || 0, subcategoria_id || null, (err, id) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, message: 'Produto adicionado com sucesso' });
  });
});

// PUT - Atualizar produto
app.put('/api/produtos/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nome, sku, quantidade, preco, subcategoria_id } = req.body;

  if (!sku || quantidade === undefined) {
    return res.status(400).json({ error: 'SKU e quantidade são obrigatórios' });
  }

  // Validar quantidade não negativa
  if (isNaN(quantidade) || parseInt(quantidade) < 0) {
    return res.status(400).json({ error: 'Quantidade deve ser um número maior ou igual a 0' });
  }

  // Validar preço não negativo
  if (preco && isNaN(preco)) {
    return res.status(400).json({ error: 'Preço deve ser um número válido' });
  }

  if (preco && parseFloat(preco) < 0) {
    return res.status(400).json({ error: 'Preço não pode ser negativo' });
  }

  db.updateProduto(id, nome || null, sku, parseInt(quantidade), parseFloat(preco) || 0, subcategoria_id || null, (err) => {
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
  const { produto_id, tipo, quantidade, motivo, requisitante, local_aplicacao, preco_unitario, numero_nf, fornecedor } = req.body;
  const operador = req.usuario;

  if (!produto_id || !tipo || !quantidade) {
    return res.status(400).json({ error: 'Produto, tipo e quantidade são obrigatórios' });
  }

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo deve ser "entrada" ou "saida"' });
  }

  const dadosAdicionais = {
    requisitante: tipo === 'saida' ? requisitante : null,
    local_aplicacao: tipo === 'saida' ? local_aplicacao : null,
    preco_unitario: tipo === 'entrada' ? preco_unitario : null,
    numero_nf: tipo === 'entrada' ? numero_nf : null,
    fornecedor: tipo === 'entrada' ? fornecedor : null
  };

  db.addMovimento(produto_id, tipo, quantidade, motivo || '', operador, dadosAdicionais, (err, id) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, message: 'Movimento registrado com sucesso' });
  });
});

// PUT - Atualizar movimento
app.put('/api/movimentos/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { produto_id, tipo, quantidade, motivo, requisitante, local_aplicacao, preco_unitario, numero_nf, fornecedor } = req.body;
  const operador = req.usuario;

  if (!produto_id || !tipo || !quantidade) {
    return res.status(400).json({ error: 'Produto, tipo e quantidade são obrigatórios' });
  }

  if (!['entrada', 'saida'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo deve ser "entrada" ou "saida"' });
  }

  const dadosAdicionais = {
    requisitante: tipo === 'saida' ? requisitante : null,
    local_aplicacao: tipo === 'saida' ? local_aplicacao : null,
    preco_unitario: tipo === 'entrada' ? preco_unitario : null,
    numero_nf: tipo === 'entrada' ? numero_nf : null,
    fornecedor: tipo === 'entrada' ? fornecedor : null
  };

  db.updateMovimento(id, produto_id, tipo, quantidade, motivo || '', operador, dadosAdicionais, (err) => {
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

// ==================== ROTAS DE CATEGORIAS ====================

// GET - Listar categorias
app.get('/api/categorias', verificarToken, (req, res) => {
  db.getCategorias((err, categorias) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(categorias);
  });
});

// POST - Adicionar categoria
app.post('/api/categorias', verificarToken, (req, res) => {
  const { nome, descricao } = req.body;
  
  if (!nome) {
    return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
  }

  db.addCategoria(nome, descricao || null, (err, id) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, message: 'Categoria adicionada com sucesso' });
  });
});

// PUT - Atualizar categoria
app.put('/api/categorias/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nome, descricao } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
  }

  db.updateCategoria(id, nome, descricao || null, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Categoria atualizada com sucesso' });
  });
});

// DELETE - Deletar categoria
app.delete('/api/categorias/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  db.deleteCategoria(id, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Categoria deletada com sucesso' });
  });
});

// ==================== ROTAS DE SUBCATEGORIAS ====================

// GET - Listar subcategorias
app.get('/api/subcategorias', verificarToken, (req, res) => {
  const { categoria_id } = req.query;
  db.getSubcategorias((err, subcategorias) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(subcategorias);
  }, categoria_id);
});

// POST - Adicionar subcategoria
app.post('/api/subcategorias', verificarToken, (req, res) => {
  const { categoria_id, nome, descricao } = req.body;
  
  if (!categoria_id || !nome) {
    return res.status(400).json({ error: 'Categoria e nome da subcategoria são obrigatórios' });
  }

  db.addSubcategoria(categoria_id, nome, descricao || null, (err, id) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, message: 'Subcategoria adicionada com sucesso' });
  });
});

// PUT - Atualizar subcategoria
app.put('/api/subcategorias/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nome, descricao } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Nome da subcategoria é obrigatório' });
  }

  db.updateSubcategoria(id, nome, descricao || null, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Subcategoria atualizada com sucesso' });
  });
});

// DELETE - Deletar subcategoria
app.delete('/api/subcategorias/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  db.deleteSubcategoria(id, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Subcategoria deletada com sucesso' });
  });
});

// ==================== ROTAS DE TAGS ====================

// GET - Listar tags
app.get('/api/tags', verificarToken, (req, res) => {
  const { subcategoria_id } = req.query;
  db.getTags((err, tags) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(tags);
  }, subcategoria_id);
});

// POST - Adicionar tag
app.post('/api/tags', verificarToken, (req, res) => {
  const { subcategoria_id, nome, descricao } = req.body;
  
  if (!subcategoria_id || !nome) {
    return res.status(400).json({ error: 'Subcategoria e nome da tag são obrigatórios' });
  }

  db.addTag(subcategoria_id, nome, descricao || null, (err, id) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id, message: 'Tag adicionada com sucesso' });
  });
});

// PUT - Atualizar tag
app.put('/api/tags/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nome, descricao } = req.body;

  if (!nome) {
    return res.status(400).json({ error: 'Nome da tag é obrigatório' });
  }

  db.updateTag(id, nome, descricao || null, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Tag atualizada com sucesso' });
  });
});

// DELETE - Deletar tag
app.delete('/api/tags/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  db.deleteTag(id, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Tag deletada com sucesso' });
  });
});

// Rota padrão
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let lanIp = 'localhost';
  
  // Encontrar IP local da máquina
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        lanIp = iface.address;
        break;
      }
    }
  }
  
  console.log(`✅ Banco de dados inicializado`);
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🌐 Acesse pela LAN: http://${lanIp}:${PORT}`);
});
