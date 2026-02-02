const API_URL = `http://${window.location.hostname}:3000/api`;

let token = localStorage.getItem('token');
let produtos = [];

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Mostrar aviso de proteção
    mostrarAvisoProtecaoRelatorios();
    return;
  }

  carregarRelatorioProdutos();
  carregarResumoGeral();
});

function mostrarAvisoProtecaoRelatorios() {
  const container = document.querySelector('main') || document.body;
  const aviso = document.createElement('div');
  aviso.innerHTML = '<p><strong>Recurso Protegido</strong></p><p>Você precisa estar logado para acessar os relatórios. Faça login na barra lateral.</p>';
  aviso.style.cssText = 'padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin: 15px; color: #856404;';
  
  // Ocultar seções de relatório
  document.querySelectorAll('section').forEach(s => s.style.display = 'none');
  
  container.insertBefore(aviso, container.firstChild);
}

async function carregarResumoGeral() {
  try {
    const headers = { 'Authorization': `Bearer ${token}` };
    
    const res = await fetch(`${API_URL}/produtos`, { headers });
    if (res.status === 401) {
      logout();
      return;
    }
    
    produtos = await res.json();

    // Calcular estatísticas
    const totalProdutos = produtos.length;
    const quantidadeTotal = produtos.reduce((sum, p) => sum + p.quantidade, 0);
    const valorTotal = produtos.reduce((sum, p) => sum + (p.quantidade * p.preco), 0);

    document.getElementById('totalProdutos').textContent = totalProdutos;
    document.getElementById('quantidadeTotal').textContent = quantidadeTotal;
    document.getElementById('valorTotal').textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('produtosCriados').textContent = totalProdutos;

  } catch (err) {
    console.error('Erro:', err);
  }
}

async function carregarRelatorioProdutos() {
  try {
    const headers = { 'Authorization': `Bearer ${token}` };
    
    const res = await fetch(`${API_URL}/produtos`, { headers });
    if (res.status === 401) {
      logout();
      return;
    }
    
    produtos = await res.json();
    renderizarTabelaProdutos();

  } catch (err) {
    console.error('Erro:', err);
    document.getElementById('bodyProdutosRelatorio').innerHTML = 
      '<tr><td colspan="6" style="text-align: center; color: #999;">Erro ao carregar produtos</td></tr>';
  }
}

function renderizarTabelaProdutos() {
  const tbody = document.getElementById('bodyProdutosRelatorio');
  
  if (produtos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Nenhum produto cadastrado</td></tr>';
    return;
  }

  tbody.innerHTML = produtos.map(p => `
    <tr>
      <td>${p.sku || '-'}</td>
      <td>${p.nome || '-'}</td>
      <td>${p.subcategoria_id || '-'}</td>
      <td>${p.quantidade}</td>
      <td>R$ ${p.preco.toFixed(2).replace('.', ',')}</td>
      <td>R$ ${(p.quantidade * p.preco).toFixed(2).replace('.', ',')}</td>
    </tr>
  `).join('');
}

function carregarBaixoEstoque() {
  const limiar = parseInt(document.getElementById('limiarEstoque').value);
  const tbody = document.getElementById('bodyBaixoEstoque');
  
  const baixosEstoques = produtos.filter(p => p.quantidade < limiar);
  
  if (baixosEstoques.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Nenhum produto com baixo estoque</td></tr>';
    return;
  }

  tbody.innerHTML = baixosEstoques.map(p => `
    <tr>
      <td>${p.sku || '-'}</td>
      <td>${p.nome || '-'}</td>
      <td>${p.subcategoria_id || '-'}</td>
      <td>${p.quantidade}</td>
      <td>${limiar}</td>
      <td style="color: #991b1b; font-weight: bold;">-${limiar - p.quantidade}</td>
    </tr>
  `).join('');
}

function carregarMovimentosRelatorio() {
  const tbody = document.getElementById('bodyMovimentosRelatorio');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999;">Movimentos em desenvolvimento</td></tr>';
}

function selecionarRelatorio(tipo) {
  // Scroll para a seção correspondente
  const sectionId = `relatorio${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

function exportarCSV() {
  alert('Função de exportar CSV em desenvolvimento');
}

function exportarPDF() {
  alert('Função de exportar PDF em desenvolvimento');
}

function logout() {
  // Remove apenas dados de autenticação, preserva cadastros
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('perfil');
  location.reload();
}

