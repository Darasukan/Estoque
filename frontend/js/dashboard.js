const API_URL = `http://${window.location.hostname}:3000/api`;
let token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  
  if (token) {
    carregarDados();
  } else {
    // Mostrar mensagem para usuÃ¡rio nÃ£o autenticado
    mostrarMensagemPublica();
  }
});

function mostrarMensagemPublica() {
  // Esconder cards de estatÃ­sticas
  document.querySelectorAll('.stat-card').forEach(el => el.style.display = 'none');
  
  // Mostrar mensagem
  const container = document.querySelector('main') || document.body;
  const msg = document.createElement('div');
  msg.className = 'alert alert-info';
  msg.innerHTML = '<p><strong>Bem-vindo!</strong></p><p>VocÃª estÃ¡ visualizando o inventÃ¡rio. FaÃ§a login na barra lateral para gerenciar os produtos.</p>';
  msg.style.cssText = 'padding: 20px; background: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 4px; margin: 20px; color: #004085;';
  container.insertBefore(msg, container.firstChild);
}

async function carregarDados() {
  try {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

    // Carregar produtos
    const resProdutos = await fetch(`${API_URL}/produtos`, { headers });
    if (resProdutos.status === 401) {
      logout();
      return;
    }
    const produtos = await resProdutos.json();

    // Carregar categorias (requer token)
    let categorias = [];
    if (token) {
      const resCategorias = await fetch(`${API_URL}/categorias`, { headers });
      if (resCategorias.ok) {
        categorias = await resCategorias.json();
      }
    }

    // Calcular estatÃ­sticas
    calcularEstatisticas(produtos);
    carregarProdutosRecentes(produtos);
    carregarBaixoEstoque(produtos);
    if (categorias.length > 0) {
      carregarFamilias(categorias);
    }

  } catch (err) {
    console.error('Erro:', err);
  }
}

function calcularEstatisticas(produtos) {
  const totalProdutos = produtos.length;
  const quantidadeTotal = produtos.reduce((sum, p) => sum + (p.quantidade || 0), 0);
  const valorTotal = produtos.reduce((sum, p) => sum + ((p.quantidade || 0) * (p.preco || 0)), 0);
  const produtosBaixoEstoque = produtos.filter(p => (p.quantidade || 0) < 10).length;

  document.getElementById('totalProdutos').textContent = totalProdutos;
  document.getElementById('quantidadeTotal').textContent = quantidadeTotal;
  document.getElementById('valorTotal').textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
  document.getElementById('produtosBaixoEstoque').textContent = produtosBaixoEstoque;
}

function carregarProdutosRecentes(produtos) {
  const container = document.getElementById('listaProdutosRecentes');
  
  if (produtos.length === 0) {
    container.innerHTML = '<li style="text-align: center; color: #999; padding: 20px;">Nenhum produto cadastrado</li>';
    return;
  }

  // Pegar os 5 Ãºltimos produtos
  const recentes = produtos.slice(-5).reverse();
  
  container.innerHTML = recentes.map(p => `
    <li>
      <div>
        <div class="nome">${p.nome || 'Sem nome'}</div>
        <small style="color: #999;">SKU: ${p.sku}</small>
      </div>
      <div class="qtd">${p.quantidade || 0}</div>
    </li>
  `).join('');
}

function carregarBaixoEstoque(produtos) {
  const container = document.getElementById('listaBaixoEstoque');
  
  const baixos = produtos.filter(p => (p.quantidade || 0) < 10);
  
  if (baixos.length === 0) {
    container.innerHTML = '<li style="text-align: center; color: #999; padding: 20px;">Tudo normal! Nenhum produto com baixo estoque</li>';
    return;
  }

  container.innerHTML = baixos.map(p => `
    <li>
      <div>
        <div class="nome">${p.nome || 'Sem nome'}</div>
        <small style="color: #999;">SKU: ${p.sku}</small>
      </div>
      <div class="qtd alerta-baixo">${p.quantidade || 0}</div>
    </li>
  `).join('');
}

function carregarFamilias(categorias) {
  const container = document.getElementById('listaFamilias');
  
  if (categorias.length === 0) {
    container.innerHTML = '<li style="text-align: center; color: #999; padding: 20px;">Nenhuma famÃ­lia cadastrada</li>';
    return;
  }

  container.innerHTML = categorias.map(cat => `
    <li>
      <div class="nome">${cat.nome}</div>
      <small style="color: #2563eb; font-weight: bold;">${cat.descricao || 'Sem descriÃ§Ã£o'}</small>
    </li>
  `).join('');
}

function logout() {
  localStorage.clear();
  location.reload();
}

