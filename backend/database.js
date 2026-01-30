const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/estoque.db');
const db = new sqlite3.Database(dbPath);

// Inicializar banco de dados com tabelas
function initialize() {
  db.serialize(() => {
    // Tabela de Produtos
    db.run(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        sku TEXT UNIQUE NOT NULL,
        quantidade INTEGER DEFAULT 0,
        preco REAL DEFAULT 0,
        categoria TEXT,
        data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
        data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
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
        data_movimento DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (produto_id) REFERENCES produtos(id)
      )
    `);

    console.log('✅ Banco de dados inicializado');
  });
}

// ==================== FUNÇÕES DE PRODUTOS ====================

function getProdutos(callback) {
  db.all('SELECT * FROM produtos ORDER BY nome', callback);
}

function addProduto(nome, sku, quantidade, preco, categoria, callback) {
  db.run(
    'INSERT INTO produtos (nome, sku, quantidade, preco, categoria) VALUES (?, ?, ?, ?, ?)',
    [nome, sku, quantidade, preco, categoria],
    function(err) {
      if (callback) callback(err, this.lastID);
    }
  );
}

function updateProduto(id, nome, sku, quantidade, preco, categoria, callback) {
  db.run(
    'UPDATE produtos SET nome = ?, sku = ?, quantidade = ?, preco = ?, categoria = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?',
    [nome, sku, quantidade, preco, categoria, id],
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

function addMovimento(produto_id, tipo, quantidade, motivo, callback) {
  // Primeiro, registra o movimento
  db.run(
    'INSERT INTO movimentos (produto_id, tipo, quantidade, motivo) VALUES (?, ?, ?, ?)',
    [produto_id, tipo, quantidade, motivo],
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

function updateMovimento(id, produto_id, tipo, quantidade, motivo, callback) {
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
          'UPDATE movimentos SET produto_id = ?, tipo = ?, quantidade = ?, motivo = ? WHERE id = ?',
          [produto_id, tipo, quantidade, motivo, id],
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
  getEstoqueBaixo
};
