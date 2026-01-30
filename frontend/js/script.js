// API URL dinâmica - funciona tanto em localhost quanto em LAN
const API_URL = `http://${window.location.hostname}:3000/api`;

// ==================== VERIFICAÇÃO DE AUTENTICAÇÃO ====================

// Verificar se está logado ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  
  if (token) {
    // Se estiver logado, carregar dados iniciais
    carregarProdutos();
    carregarProdutosSelect();
    carregarMovimentos();
    atualizarNomeUsuario();
  }
  // Se não estiver logado, nada acontece - a página carrega normalmente
});

// Função para obter headers com autenticação
function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// Atualizar nome do usuário na interface
function atualizarNomeUsuario() {
  const usuario = localStorage.getItem('usuario');
  const perfil = localStorage.getItem('perfil');
  
  // Se existir um elemento para mostrar o usuário
  const usuarioEl = document.getElementById('usuarioLogado');
  if (usuarioEl) {
    usuarioEl.textContent = `${usuario} (${perfil})`;
  }
}

// Função de logout
function logout() {
  if (confirm('Deseja realmente sair?')) {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('perfil');
    location.reload();
  }
}

// ==================== NAVEGAÇÃO ====================
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    
    btn.classList.add('active');
    const sectionId = btn.dataset.section;
    document.getElementById(sectionId).classList.add('active');

    if (sectionId === 'movimentos') {
      carregarProdutosSelect();
      carregarMovimentos();
    } else if (sectionId === 'relatorios') {
      carregarEstoqueBaixo();
      carregarResumoEstoque();
    } else {
      carregarProdutos();
    }
  });
});

// ==================== PRODUTOS ====================

// Cache de produtos para edição
let produtosCache_Produtos = [];

// Carregar lista de produtos
async function carregarProdutos() {
  try {
    const response = await fetch(`${API_URL}/produtos`, {
      headers: getHeaders()
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const produtos = await response.json();
    produtosCache_Produtos = produtos; // Armazenar em cache
    const tbody = document.getElementById('bodyProdutos');

    if (produtos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum produto cadastrado</td></tr>';
      return;
    }

    tbody.innerHTML = produtos.map(p => `
      <tr>
        <td>${p.id}</td>
        <td>${p.nome}</td>
        <td>${p.sku}</td>
        <td>${p.quantidade}</td>
        <td>R$ ${p.preco.toFixed(2)}</td>
        <td>${p.categoria || '-'}</td>
        <td>
          <button class="btn btn-edit" onclick="abrirEditar(${p.id})">✏️ Editar</button>
          <button class="btn btn-danger" onclick="deletarProduto(${p.id})">🗑️ Deletar</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
}

// Adicionar novo produto
document.getElementById('formProduto').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validar campos obrigatórios
  const nome = document.getElementById('nomeProduto').value.trim();
  const sku = document.getElementById('skuProduto').value.trim();
  const quantidade = parseInt(document.getElementById('qtdProduto').value);
  const preco = parseFloat(document.getElementById('precoProduto').value) || 0;

  if (!nome) {
    mostrarNotificacao('⚠️ Nome do produto é obrigatório!', 'warning');
    return;
  }

  if (!sku) {
    mostrarNotificacao('⚠️ SKU é obrigatório!', 'warning');
    return;
  }

  if (isNaN(quantidade) || quantidade < 0) {
    mostrarNotificacao('⚠️ Quantidade deve ser um número maior ou igual a 0!', 'warning');
    return;
  }

  if (preco < 0) {
    mostrarNotificacao('⚠️ Preço não pode ser negativo!', 'warning');
    return;
  }

  // Coletar atributos do formulário
  const atributos = {};
  document.querySelectorAll('#listaAtributos .atributo-campo').forEach(div => {
    const chave = div.querySelector('.atributo-chave').value.trim();
    const valor = div.querySelector('.atributo-valor').value.trim();
    if (chave && valor) {
      atributos[chave] = valor;
    }
  });

  const produto = {
    nome: nome,
    sku: sku,
    quantidade: quantidade,
    preco: preco,
    categoria: document.getElementById('categoriaProduto').value.trim(),
    grupo: document.getElementById('grupoProduto').value.trim() || 'Sem Grupo',
    atributos: atributos
  };

  try {
    const response = await fetch(`${API_URL}/produtos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(produto)
    });

    if (response.status === 401) {
      logout();
      return;
    }

    if (response.ok) {
      mostrarNotificacao('Produto adicionado com sucesso!', 'success');
      document.getElementById('formProduto').reset();
      document.getElementById('listaAtributos').innerHTML = '';
      carregarProdutos();
      if (document.getElementById('produtoMovimento')) {
        carregarProdutosSelect();
      }
    } else {
      const erro = await response.json();
      mostrarNotificacao(`Erro: ${erro.error}`, 'danger');
    }
  } catch (error) {
    mostrarNotificacao('Erro ao adicionar produto', 'danger');
    console.error('Erro:', error);
  }
});

// Deletar produto
async function deletarProduto(id) {
  if (!confirm('Tem certeza que deseja deletar este produto?')) return;

  try {
    const response = await fetch(`${API_URL}/produtos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (response.status === 401) {
      logout();
      return;
    }

    if (response.ok) {
      mostrarNotificacao('Produto deletado com sucesso!', 'success');
      carregarProdutos();
      if (document.getElementById('produtoMovimento')) {
        carregarProdutosSelect();
      }
    } else {
      mostrarNotificacao('Erro ao deletar produto', 'danger');
    }
  } catch (error) {
    mostrarNotificacao('Erro ao deletar produto', 'danger');
    console.error('Erro:', error);
  }
}

// ==================== MODAIS (Lógica Corrigida) ====================

// 1. Abrir modal de edição de PRODUTO (Usa o modal antigo)
function abrirEditar(id) {
  const produto = produtosCache_Produtos.find(p => p.id == id);
  if (!produto) {
    console.error('Produto não encontrado');
    return;
  }

  document.getElementById('idProdutoEdicao').value = id;
  document.getElementById('nomeEditar').value = produto.nome;
  document.getElementById('skuEditar').value = produto.sku;
  document.getElementById('qtdEditar').value = produto.quantidade;
  document.getElementById('precoEditar').value = produto.preco;
  document.getElementById('categoriaEditar').value = produto.categoria || '';
  document.getElementById('grupoEditar').value = produto.grupo || '';

  // Limpar e preencher atributos
  const container = document.getElementById('listaAtributosEditar');
  container.innerHTML = '';
  if (produto.atributos && Object.keys(produto.atributos).length > 0) {
    Object.entries(produto.atributos).forEach(([chave, valor]) => {
      const div = document.createElement('div');
      div.className = 'atributo-campo';
      
      const inputChave = document.createElement('input');
      inputChave.type = 'text';
      inputChave.className = 'atributo-chave';
      inputChave.value = chave;
      
      const inputValor = document.createElement('input');
      inputValor.type = 'text';
      inputValor.className = 'atributo-valor';
      inputValor.value = valor;
      
      const btnRemover = document.createElement('button');
      btnRemover.type = 'button';
      btnRemover.className = 'btn btn-danger btn-small';
      btnRemover.textContent = '✕';
      btnRemover.onclick = () => div.remove();
      
      div.appendChild(inputChave);
      div.appendChild(inputValor);
      div.appendChild(btnRemover);
      container.appendChild(div);
    });
  }

  document.getElementById('modalEditar').classList.add('show');
}

// 2. Abrir modal de edição de MOVIMENTAÇÃO (Usa o modal novo e IDs novos)
function abrirEditarMov(data, nome, tipo, quantidade, motivo) {
  // Note os IDs com prefixo 'mov' que criamos no HTML
  document.getElementById('movData').value = data;
  document.getElementById('movNome').value = nome;
  document.getElementById('movTipo').value = tipo;
  document.getElementById('movQtd').value = quantidade;
  document.getElementById('movMotivo').value = motivo || '';

  document.getElementById('modalMovimentacao').classList.add('show');
}

// Fechar Modais (Genérico para os botões 'X')
document.querySelectorAll('.close').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('modalEditar').classList.remove('show');
    if(document.getElementById('modalMovimentacao')) {
        document.getElementById('modalMovimentacao').classList.remove('show');
    }
  });
});

// Fechar ao clicar fora (Gerencia ambos os modais)
window.onclick = function(event) {
  const modalProd = document.getElementById('modalEditar');
  const modalMov = document.getElementById('modalMovimentacao');

  if (event.target == modalProd) {
    modalProd.classList.remove('show');
  }
  if (modalMov && event.target == modalMov) {
    modalMov.classList.remove('show');
  }
}

// Salvar edição de PRODUTO
document.getElementById('formEditarProduto').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validar campos obrigatórios
  const nome = document.getElementById('nomeEditar').value.trim();
  const sku = document.getElementById('skuEditar').value.trim();
  const quantidade = parseInt(document.getElementById('qtdEditar').value);
  const preco = parseFloat(document.getElementById('precoEditar').value) || 0;

  if (!nome) {
    mostrarNotificacao('⚠️ Nome do produto é obrigatório!', 'warning');
    return;
  }

  if (!sku) {
    mostrarNotificacao('⚠️ SKU é obrigatório!', 'warning');
    return;
  }

  if (isNaN(quantidade) || quantidade < 0) {
    mostrarNotificacao('⚠️ Quantidade deve ser um número maior ou igual a 0!', 'warning');
    return;
  }

  if (preco < 0) {
    mostrarNotificacao('⚠️ Preço não pode ser negativo!', 'warning');
    return;
  }

  // Coletar atributos do formulário
  const atributos = {};
  document.querySelectorAll('#listaAtributosEditar .atributo-campo').forEach(div => {
    const chave = div.querySelector('.atributo-chave').value.trim();
    const valor = div.querySelector('.atributo-valor').value.trim();
    if (chave && valor) {
      atributos[chave] = valor;
    }
  });

  const id = document.getElementById('idProdutoEdicao').value;
  const produto = {
    nome: nome,
    sku: sku,
    quantidade: quantidade,
    preco: preco,
    categoria: document.getElementById('categoriaEditar').value.trim(),
    grupo: document.getElementById('grupoEditar').value.trim() || 'Sem Grupo',
    atributos: atributos
  };

  try {
    const response = await fetch(`${API_URL}/produtos/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(produto)
    });

    if (response.status === 401) {
      logout();
      return;
    }

    if (response.ok) {
      mostrarNotificacao('Produto atualizado com sucesso!', 'success');
      document.getElementById('modalEditar').classList.remove('show');
      carregarProdutos();
      if (document.getElementById('produtoMovimento')) {
        carregarProdutosSelect();
      }
    } else {
      mostrarNotificacao('Erro ao atualizar produto', 'danger');
    }
  } catch (error) {
    mostrarNotificacao('Erro ao atualizar produto', 'danger');
    console.error('Erro:', error);
  }
});

// ==================== MOVIMENTOS ====================

// Carregar produtos no select
async function carregarProdutosSelect() {
  try {
    const response = await fetch(`${API_URL}/produtos`, {
      headers: getHeaders()
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const produtos = await response.json();
    const select = document.getElementById('produtoMovimento');

    select.innerHTML = '<option value="">-- Selecione um produto --</option>' +
      produtos.map(p => `<option value="${p.id}">${p.nome} (${p.sku})</option>`).join('');
  } catch (error) {
    console.error('Erro ao carregar produtos:', error);
  }
}

// Mostrar/ocultar campos dinâmicos no formulário de criação
function mostrarCamposDinamicos() {
  const tipo = document.getElementById('tipoMovimento').value;
  const camposSaida = document.getElementById('camposSaida');
  const camposEntrada = document.getElementById('camposEntrada');
  
  if (tipo === 'saida') {
    camposSaida.style.display = 'block';
    camposEntrada.style.display = 'none';
    document.getElementById('requisiante').required = true;
    document.getElementById('localAplicacao').required = true;
  } else if (tipo === 'entrada') {
    camposSaida.style.display = 'none';
    camposEntrada.style.display = 'block';
  } else {
    camposSaida.style.display = 'none';
    camposEntrada.style.display = 'none';
  }
}

// Mostrar/ocultar campos dinâmicos no modal de edição
function mostrarCamposDinamicosModal() {
  const tipo = document.getElementById('movTipo').value;
  const camposSaida = document.getElementById('camposSaidaModal');
  const camposEntrada = document.getElementById('camposEntradaModal');
  
  if (tipo === 'saida') {
    camposSaida.style.display = 'block';
    camposEntrada.style.display = 'none';
  } else if (tipo === 'entrada') {
    camposSaida.style.display = 'none';
    camposEntrada.style.display = 'block';
  } else {
    camposSaida.style.display = 'none';
    camposEntrada.style.display = 'none';
  }
}

async function carregarMovimentos() {
  try {
    const response = await fetch(`${API_URL}/movimentos`, {
      headers: getHeaders()
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const movimentos = await response.json();
    const tbody = document.getElementById('bodyMovimentos');

    // Se não houver movimentos, exibe mensagem vazia
    if (movimentos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Nenhuma movimentação registrada</td></tr>';
      return;
    }

    tbody.innerHTML = movimentos.map(m => {
      const tipoVisual = m.tipo === 'entrada' 
        ? '<span style="color: var(--success);">📥 Entrada</span>' 
        : '<span style="color: var(--danger);">📤 Saída</span>';
  
      const dataFormatada = new Date(m.data_movimento).toLocaleString('pt-BR');
      
      // Detalhe dinâmico baseado no tipo
      let detalhes = '-';
      if (m.tipo === 'saida') {
        detalhes = `${m.requisitante || '-'} → ${m.local_aplicacao || '-'}`;
      } else if (m.tipo === 'entrada') {
        detalhes = `R$ ${parseFloat(m.preco_unitario || 0).toFixed(2)} | NF: ${m.numero_nf || '-'} | ${m.fornecedor || '-'}`;
      }
      
      return `
        <tr>
          <td>${dataFormatada}</td>
          <td>${m.produto_nome}</td>
          <td>${m.sku}</td>
          <td>${tipoVisual}</td>
          <td>${m.quantidade}</td>
          <td>${detalhes}</td>
          <td>${m.operador || '-'}</td>
          <td>
            <button class="btn btn-edit" 
              onclick="abrirEditarMov(${m.id}, '${dataFormatada}', '${m.produto_nome}', ${m.produto_id}, '${m.tipo}', ${m.quantidade}, '${m.motivo || ''}', '${m.operador || ''}', '${m.requisitante || ''}', '${m.local_aplicacao || ''}', ${m.preco_unitario || 'null'}, '${m.numero_nf || ''}', '${m.fornecedor || ''}')">
              ✏️ Editar
            </button>
            <button class="btn btn-danger" onclick="deletarMovimentacao(${m.id})">
              🗑️ Deletar
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('Erro ao carregar movimentos:', error);
  }
}

// Registrar movimentação
document.getElementById('formMovimento').addEventListener('submit', async (e) => {
  e.preventDefault();

  const tipo = document.getElementById('tipoMovimento').value;
  const movimento = {
    produto_id: parseInt(document.getElementById('produtoMovimento').value),
    tipo: tipo,
    quantidade: parseInt(document.getElementById('qtdMovimento').value),
    motivo: document.getElementById('motivoMovimento').value
  };

  // Adicionar campos condicionais baseado no tipo
  if (tipo === 'saida') {
    movimento.requisitante = document.getElementById('requisiante').value;
    movimento.local_aplicacao = document.getElementById('localAplicacao').value;
  } else if (tipo === 'entrada') {
    movimento.preco_unitario = document.getElementById('precoUnitario').value || null;
    movimento.numero_nf = document.getElementById('numeroNF').value || null;
    movimento.fornecedor = document.getElementById('fornecedor').value || null;
  }

  try {
    const response = await fetch(`${API_URL}/movimentos`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(movimento)
    });

    if (response.status === 401) {
      logout();
      return;
    }

    if (response.ok) {
      mostrarNotificacao('Movimentação registrada com sucesso!', 'success');
      document.getElementById('formMovimento').reset();
      document.getElementById('camposSaida').style.display = 'none';
      document.getElementById('camposEntrada').style.display = 'none';
      carregarMovimentos();
      carregarProdutos();
      carregarResumoEstoque();
    } else {
      const erro = await response.json();
      mostrarNotificacao(`Erro: ${erro.error}`, 'danger');
    }
  } catch (error) {
    mostrarNotificacao('Erro ao registrar movimentação', 'danger');
    console.error('Erro:', error);
  }
});

// ==================== RELATÓRIOS ====================

// Estoque baixo
async function carregarEstoqueBaixo() {
  try {
    const response = await fetch(`${API_URL}/produtos`, {
      headers: getHeaders()
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const produtos = await response.json();
    const limite = parseInt(document.getElementById('limiteEstoque').value) || 10;
    
    const produtosBaixos = produtos.filter(p => p.quantidade <= limite);
    const tbody = document.getElementById('bodyEstoqueBaixo');

    if (produtosBaixos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum produto com estoque baixo</td></tr>';
      return;
    }

    tbody.innerHTML = produtosBaixos.map(p => `
      <tr>
        <td>${p.nome}</td>
        <td>${p.sku}</td>
        <td><strong>${p.quantidade}</strong></td>
        <td>R$ ${p.preco.toFixed(2)}</td>
        <td>${p.categoria || '-'}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Erro ao carregar estoque baixo:', error);
  }
}

// Resumo de estoque
async function carregarResumoEstoque() {
  try {
    const response = await fetch(`${API_URL}/produtos`, {
      headers: getHeaders()
    });

    if (response.status === 401) {
      logout();
      return;
    }

    const produtos = await response.json();

    const totalProdutos = produtos.length;
    const valorTotal = produtos.reduce((sum, p) => sum + (p.quantidade * p.preco), 0);
    const produtosEmFalta = produtos.filter(p => p.quantidade === 0).length;

    document.getElementById('totalProdutos').textContent = totalProdutos;
    document.getElementById('valorTotal').textContent = `R$ ${valorTotal.toFixed(2)}`;
    document.getElementById('produtosEmFalta').textContent = produtosEmFalta;
  } catch (error) {
    console.error('Erro ao carregar resumo:', error);
  }
}

// ==================== UTILIDADES ====================

// Abrir modal para editar movimentação
function abrirEditarMov(id, data, produtoNome, produtoId, tipo, quantidade, motivo, operador, requisitante, localAplicacao, precoUnitario, numeroNF, fornecedor) {
  document.getElementById('movData').value = data;
  document.getElementById('movNome').value = produtoNome;
  document.getElementById('movOperador').value = operador || '-';
  document.getElementById('movTipo').value = tipo;
  document.getElementById('movQtd').value = quantidade;
  document.getElementById('movMotivo').value = motivo || '';
  
  // Preencher campos dinâmicos baseado no tipo
  if (tipo === 'saida') {
    document.getElementById('movRequisitante').value = requisitante || '';
    document.getElementById('movLocalAplicacao').value = localAplicacao || '';
    document.getElementById('camposSaidaModal').style.display = 'block';
    document.getElementById('camposEntradaModal').style.display = 'none';
  } else if (tipo === 'entrada') {
    document.getElementById('movPrecoUnitario').value = precoUnitario || '';
    document.getElementById('movNumeroNF').value = numeroNF || '';
    document.getElementById('movFornecedor').value = fornecedor || '';
    document.getElementById('camposSaidaModal').style.display = 'none';
    document.getElementById('camposEntradaModal').style.display = 'block';
  }
  
  // Armazenar ID e produto_id para uso na submissão
  document.getElementById('formEditarMovimento').dataset.id = id;
  document.getElementById('formEditarMovimento').dataset.produtoId = produtoId;
  
  document.getElementById('modalMovimentacao').classList.add('show');
}

// Salvar edição de movimentação - aguarda o DOM estar pronto
function inicializarFormEditarMovimento() {
  const form = document.getElementById('formEditarMovimento');
  if (!form) {
    setTimeout(inicializarFormEditarMovimento, 100);
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = e.target.dataset.id;
    const produto_id = parseInt(e.target.dataset.produtoId);
    const tipo = document.getElementById('movTipo').value;
    const quantidade = parseInt(document.getElementById('movQtd').value);
    const motivo = document.getElementById('movMotivo').value;
    
    const dadosMovimento = {
      produto_id,
      tipo,
      quantidade,
      motivo
    };

    // Adicionar campos condicionais baseado no tipo
    if (tipo === 'saida') {
      dadosMovimento.requisitante = document.getElementById('movRequisitante').value;
      dadosMovimento.local_aplicacao = document.getElementById('movLocalAplicacao').value;
    } else if (tipo === 'entrada') {
      dadosMovimento.preco_unitario = document.getElementById('movPrecoUnitario').value || null;
      dadosMovimento.numero_nf = document.getElementById('movNumeroNF').value || null;
      dadosMovimento.fornecedor = document.getElementById('movFornecedor').value || null;
    }

    try {
      const response = await fetch(`${API_URL}/movimentos/${id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(dadosMovimento)
      });

      if (response.status === 401) {
        logout();
        return;
      }

      if (response.ok) {
        mostrarNotificacao('Movimentação atualizada com sucesso!', 'success');
        document.getElementById('modalMovimentacao').classList.remove('show');
        carregarMovimentos();
        carregarProdutos();
        carregarResumoEstoque();
      } else {
        const erro = await response.json();
        mostrarNotificacao(`Erro: ${erro.error}`, 'danger');
      }
    } catch (error) {
      mostrarNotificacao('Erro ao atualizar movimentação', 'danger');
      console.error('Erro:', error);
    }
  });
}

// Inicializar ao carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializarFormEditarMovimento);
} else {
  inicializarFormEditarMovimento();
}

// Deletar movimentação
async function deletarMovimentacao(id) {
  if (!confirm('Tem certeza que deseja deletar esta movimentação?')) return;

  try {
    const response = await fetch(`${API_URL}/movimentos/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (response.status === 401) {
      logout();
      return;
    }

    if (response.ok) {
      mostrarNotificacao('Movimentação deletada com sucesso!', 'success');
      carregarMovimentos();
      carregarProdutos();
      carregarResumoEstoque();
    } else {
      mostrarNotificacao('Erro ao deletar movimentação', 'danger');
    }
  } catch (error) {
    mostrarNotificacao('Erro ao deletar movimentação', 'danger');
    console.error('Erro:', error);
  }
}

// ==================== GERENCIAMENTO DE ATRIBUTOS ====================

function adicionarCampoAtributo() {
  const container = document.getElementById('listaAtributos');
  const div = document.createElement('div');
  div.className = 'atributo-campo';
  
  const inputChave = document.createElement('input');
  inputChave.type = 'text';
  inputChave.className = 'atributo-chave';
  inputChave.placeholder = 'Nome do atributo (ex: Processador)';
  
  const inputValor = document.createElement('input');
  inputValor.type = 'text';
  inputValor.className = 'atributo-valor';
  inputValor.placeholder = 'Valor (ex: Intel i7)';
  
  const btnRemover = document.createElement('button');
  btnRemover.type = 'button';
  btnRemover.className = 'btn btn-danger btn-small';
  btnRemover.textContent = '✕';
  btnRemover.onclick = () => div.remove();
  
  div.appendChild(inputChave);
  div.appendChild(inputValor);
  div.appendChild(btnRemover);
  container.appendChild(div);
}

function adicionarCampoAtributoEditar() {
  const container = document.getElementById('listaAtributosEditar');
  const div = document.createElement('div');
  div.className = 'atributo-campo';
  
  const inputChave = document.createElement('input');
  inputChave.type = 'text';
  inputChave.className = 'atributo-chave';
  inputChave.placeholder = 'Nome do atributo (ex: Processador)';
  
  const inputValor = document.createElement('input');
  inputValor.type = 'text';
  inputValor.className = 'atributo-valor';
  inputValor.placeholder = 'Valor (ex: Intel i7)';
  
  const btnRemover = document.createElement('button');
  btnRemover.type = 'button';
  btnRemover.className = 'btn btn-danger btn-small';
  btnRemover.textContent = '✕';
  btnRemover.onclick = () => div.remove();
  
  div.appendChild(inputChave);
  div.appendChild(inputValor);
  div.appendChild(btnRemover);
  container.appendChild(div);
}

function mostrarNotificacao(mensagem, tipo) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${tipo}`;
  alertDiv.textContent = mensagem;

  const mainContent = document.querySelector('.main-content');
  mainContent.insertBefore(alertDiv, mainContent.firstChild);

  setTimeout(() => alertDiv.remove(), 3000);
}

