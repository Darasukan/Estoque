const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/estoque.db');
const db = new sqlite3.Database(dbPath);

// Otimizações para múltiplas conexões
db.configure('busyTimeout', 5000); // Aguarda 5s se BD estiver travado
db.run('PRAGMA journal_mode = WAL'); // Write-Ahead Logging para melhor concorrência
db.run('PRAGMA synchronous = NORMAL'); // Menos sync = mais rápido
db.run('PRAGMA cache_size = -64000'); // 64MB cache

// Inicializar banco de dados com tabelas
function initialize() {
  db.serialize(() => {
    // Tabela de Categorias (Famílias principais)
    db.run(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE NOT NULL,
        descricao TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de Subcategorias
    db.run(`
      CREATE TABLE IF NOT EXISTS subcategorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        categoria_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        descricao TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE,
        UNIQUE(categoria_id, nome)
      )
    `);

    // Tabela de Tags (Atributos/Características)
    db.run(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        subcategoria_id INTEGER NOT NULL,
        nome TEXT NOT NULL,
        descricao TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id) ON DELETE CASCADE,
        UNIQUE(subcategoria_id, nome)
      )
    `);

    // Tabela de Produtos (Itens em Estoque)
    db.run(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        sku TEXT UNIQUE NOT NULL,
        quantidade INTEGER DEFAULT 0,
        preco REAL DEFAULT 0,
        subcategoria_id INTEGER,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subcategoria_id) REFERENCES subcategorias(id) ON DELETE SET NULL
      )
    `);

    // Tabela de Associação: Produtos e Tags
    db.run(`
      CREATE TABLE IF NOT EXISTS produto_tags (
        produto_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (produto_id, tag_id),
        FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // Tabela de Movimentos (Entrada/Saída)
    db.run(`
      CREATE TABLE IF NOT EXISTS movimentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        produto_id INTEGER NOT NULL,
        tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'saida')),
        quantidade INTEGER NOT NULL,
        motivo TEXT,
        requisitante TEXT,
        local_aplicacao TEXT,
        preco_unitario REAL,
        numero_nf TEXT,
        fornecedor TEXT,
        operador TEXT,
        data_movimento DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
      )
    `);

    console.log('[OK] Banco de dados inicializado');
  });
}

// ==================== FUNÇÕES DE PRODUTOS ====================

function getProdutos(callback) {
  db.all(`
    SELECT p.*, 
           s.nome as subcategoria_nome,
           c.nome as categoria_nome
    FROM produtos p
    LEFT JOIN subcategorias s ON p.subcategoria_id = s.id
    LEFT JOIN categorias c ON s.categoria_id = c.id
    ORDER BY p.sku
  `, callback);
}

function addProduto(nome, sku, quantidade, preco, subcategoria_id, callback) {
  db.run(
    'INSERT INTO produtos (nome, sku, quantidade, preco, subcategoria_id) VALUES (?, ?, ?, ?, ?)',
    [nome || null, sku, quantidade, preco, subcategoria_id || null],
    function(err) {
      if (callback) callback(err, this.lastID);
    }
  );
}

function updateProduto(id, nome, sku, quantidade, preco, subcategoria_id, callback) {
  db.run(
    'UPDATE produtos SET nome = ?, sku = ?, quantidade = ?, preco = ?, subcategoria_id = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?',
    [nome || null, sku, quantidade, preco, subcategoria_id || null, id],
    callback
  );
}

function deleteProduto(id, callback) {
  db.run('DELETE FROM produtos WHERE id = ?', [id], callback);
}

// ==================== FUNÇÕES DE MOVIMENTOS ====================

function getMovimentos(callback) {
  db.all(`
    SELECT m.*, p.nome as produto_nome, p.sku
    FROM movimentos m
    JOIN produtos p ON m.produto_id = p.id
    ORDER BY m.data_movimento DESC
  `, callback);
}

function addMovimento(produto_id, tipo, quantidade, motivo, operador, dadosAdicionais, callback) {
  const { requisitante, local_aplicacao, preco_unitario, numero_nf, fornecedor } = dadosAdicionais || {};
  
  // Primeiro, registra o movimento
  db.run(
    'INSERT INTO movimentos (produto_id, tipo, quantidade, motivo, operador, requisitante, local_aplicacao, preco_unitario, numero_nf, fornecedor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [produto_id, tipo, quantidade, motivo, operador, requisitante || null, local_aplicacao || null, preco_unitario || null, numero_nf || null, fornecedor || null],
    function(err) {
      if (err) return callback(err);

      // Depois, atualiza a quantidade do produto
      const operador = tipo === 'entrada' ? '+' : '-';
      db.run(
        `UPDATE produtos SET quantidade = quantidade ${operador} ? WHERE id = ?`,
        [quantidade, produto_id],
        (err) => {
          if (callback) callback(err, this.lastID);
        }
      );
    }
  );
}

function updateMovimento(id, produto_id, tipo, quantidade, motivo, operador, dadosAdicionais, callback) {
  const { requisitante, local_aplicacao, preco_unitario, numero_nf, fornecedor } = dadosAdicionais || {};
  
  // Primeiro, obter o movimento antigo
  db.get('SELECT * FROM movimentos WHERE id = ?', [id], (err, movimentoAntigo) => {
    if (err) return callback(err);
    if (!movimentoAntigo) return callback(new Error('Movimento não encontrado'));

    // Desfazer o movimento antigo no estoque
    const operadorDesfazer = movimentoAntigo.tipo === 'entrada' ? '-' : '+';
    db.run(
      `UPDATE produtos SET quantidade = quantidade ${operadorDesfazer} ? WHERE id = ?`,
      [movimentoAntigo.quantidade, movimentoAntigo.produto_id],
      (err) => {
        if (err) return callback(err);

        // Atualizar o movimento
        db.run(
          'UPDATE movimentos SET produto_id = ?, tipo = ?, quantidade = ?, motivo = ?, operador = ?, requisitante = ?, local_aplicacao = ?, preco_unitario = ?, numero_nf = ?, fornecedor = ? WHERE id = ?',
          [produto_id, tipo, quantidade, motivo, operador, requisitante || null, local_aplicacao || null, preco_unitario || null, numero_nf || null, fornecedor || null, id],
          (err) => {
            if (err) return callback(err);

            // Aplicar o novo movimento no estoque
            const operadorAplicar = tipo === 'entrada' ? '+' : '-';
            db.run(
              `UPDATE produtos SET quantidade = quantidade ${operadorAplicar} ? WHERE id = ?`,
              [quantidade, produto_id],
              callback
            );
          }
        );
      }
    );
  });
}

function deleteMovimento(id, callback) {
  // Primeiro, obter o movimento
  db.get('SELECT * FROM movimentos WHERE id = ?', [id], (err, movimento) => {
    if (err) return callback(err);
    if (!movimento) return callback(new Error('Movimento não encontrado'));

    // Desfazer o movimento no estoque
    const operador = movimento.tipo === 'entrada' ? '-' : '+';
    db.run(
      `UPDATE produtos SET quantidade = quantidade ${operador} ? WHERE id = ?`,
      [movimento.quantidade, movimento.produto_id],
      (err) => {
        if (err) return callback(err);

        // Deletar o movimento
        db.run('DELETE FROM movimentos WHERE id = ?', [id], callback);
      }
    );
  });
}

function getMovimentosPorProduto(produto_id, callback) {
  db.all(
    'SELECT * FROM movimentos WHERE produto_id = ? ORDER BY data_movimento DESC',
    [produto_id],
    callback
  );
}

// ==================== FUNÇÕES DE RELATÓRIOS ====================

function getEstoqueBaixo(callback, limite = 10) {
  db.all(
    'SELECT * FROM produtos WHERE quantidade <= ? ORDER BY quantidade ASC',
    [limite],
    callback
  );
}

module.exports = {
  initialize,
  getProdutos,
  addProduto,
  updateProduto,
  deleteProduto,
  getMovimentos,
  addMovimento,
  updateMovimento,
  deleteMovimento,
  getMovimentosPorProduto,
  getEstoqueBaixo,
  // Categorias
  getCategorias,
  addCategoria,
  updateCategoria,
  deleteCategoria,
  // Subcategorias
  getSubcategorias,
  addSubcategoria,
  updateSubcategoria,
  deleteSubcategoria,
  // Tags
  getTags,
  addTag,
  updateTag,
  deleteTag,
  // Associações
  getProdutoTags,
  addProdutoTag,
  removeProdutoTag
};

// ==================== FUNÇÕES DE CATEGORIAS ====================

function getCategorias(callback) {
  db.all('SELECT * FROM categorias ORDER BY nome', callback);
}

function addCategoria(nome, descricao, callback) {
  db.run(
    'INSERT INTO categorias (nome, descricao) VALUES (?, ?)',
    [nome, descricao || null],
    function(err) {
      if (callback) callback(err, this.lastID);
    }
  );
}

function updateCategoria(id, nome, descricao, callback) {
  db.run(
    'UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?',
    [nome, descricao || null, id],
    callback
  );
}

function deleteCategoria(id, callback) {
  db.run('DELETE FROM categorias WHERE id = ?', [id], callback);
}

// ==================== FUNÇÕES DE SUBCATEGORIAS ====================

function getSubcategorias(callback, categoria_id = null) {
  if (categoria_id) {
    db.all('SELECT * FROM subcategorias WHERE categoria_id = ? ORDER BY nome', [categoria_id], callback);
  } else {
    db.all('SELECT * FROM subcategorias ORDER BY nome', callback);
  }
}

function addSubcategoria(categoria_id, nome, descricao, callback) {
  db.run(
    'INSERT INTO subcategorias (categoria_id, nome, descricao) VALUES (?, ?, ?)',
    [categoria_id, nome, descricao || null],
    function(err) {
      if (callback) callback(err, this.lastID);
    }
  );
}

function updateSubcategoria(id, nome, descricao, callback) {
  db.run(
    'UPDATE subcategorias SET nome = ?, descricao = ? WHERE id = ?',
    [nome, descricao || null, id],
    callback
  );
}

function deleteSubcategoria(id, callback) {
  db.run('DELETE FROM subcategorias WHERE id = ?', [id], callback);
}

// ==================== FUNÇÕES DE TAGS ====================

function getTags(callback, subcategoria_id = null) {
  if (subcategoria_id) {
    db.all('SELECT * FROM tags WHERE subcategoria_id = ? ORDER BY nome', [subcategoria_id], callback);
  } else {
    db.all('SELECT * FROM tags ORDER BY nome', callback);
  }
}

function addTag(subcategoria_id, nome, descricao, callback) {
  db.run(
    'INSERT INTO tags (subcategoria_id, nome, descricao) VALUES (?, ?, ?)',
    [subcategoria_id, nome, descricao || null],
    function(err) {
      if (callback) callback(err, this.lastID);
    }
  );
}

function updateTag(id, nome, descricao, callback) {
  db.run(
    'UPDATE tags SET nome = ?, descricao = ? WHERE id = ?',
    [nome, descricao || null, id],
    callback
  );
}

function deleteTag(id, callback) {
  db.run('DELETE FROM tags WHERE id = ?', [id], callback);
}

// ==================== FUNÇÕES DE ASSOCIAÇÕES PRODUTO-TAGS ====================

function getProdutoTags(produto_id, callback) {
  db.all(`
    SELECT t.* FROM tags t
    JOIN produto_tags pt ON t.id = pt.tag_id
    WHERE pt.produto_id = ?
  `, [produto_id], callback);
}

function addProdutoTag(produto_id, tag_id, callback) {
  db.run(
    'INSERT OR IGNORE INTO produto_tags (produto_id, tag_id) VALUES (?, ?)',
    [produto_id, tag_id],
    callback
  );
}

function removeProdutoTag(produto_id, tag_id, callback) {
  db.run(
    'DELETE FROM produto_tags WHERE produto_id = ? AND tag_id = ?',
    [produto_id, tag_id],
    callback
  );
}
