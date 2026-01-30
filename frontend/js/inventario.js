// Cache de produtos em memÃ³ria
let produtosCache = [];
let filtrosAtivos = {};

// API URL dinÃ¢mica
const API_URL = `http://${window.location.hostname}:3000/api`;

// Elemento para token
let token = localStorage.getItem('token');

// ==================== INICIALIZAÃ‡ÃƒO ====================
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();

  // Event listeners dos filtros
  document.getElementById('filtroFamilia').addEventListener('change', aplicarFiltros);
  document.getElementById('filtroSubfamilia').addEventListener('change', aplicarFiltros);
  document.getElementById('filtroBusca').addEventListener('input', aplicarFiltros);
});

// ==================== CARREGAR DADOS ====================
function carregarProdutos() {
  fetch('/api/produtos')
    .then(res => res.json())
    .then(data => {
      produtosCache = data || [];
      inicializarFiltros();
      aplicarFiltros();
    })
    .catch(err => {
      console.error('Erro ao carregar produtos:', err);
      document.getElementById('bodyProdutos').innerHTML = 
        '<tr><td colspan="6" class="tabela-vazia">Erro ao carregar produtos</td></tr>';
    });
}

// ==================== INICIALIZAR CASCATAS ====================
function inicializarFiltros() {
  // Extrair famÃ­lias Ãºnicas
  const familias = [...new Set(produtosCache.map(p => p.grupo).filter(Boolean))];
  const selectFamilia = document.getElementById('filtroFamilia');
  selectFamilia.innerHTML = '<option value="">Selecione uma famÃ­lia...</option>';
  familias.forEach(familia => {
    const option = document.createElement('option');
    option.value = familia;
    option.textContent = familia;
    selectFamilia.appendChild(option);
  });
}

function atualizarSubfamilias() {
  const familia = document.getElementById('filtroFamilia').value;
  const selectSubfamilia = document.getElementById('filtroSubfamilia');
  selectSubfamilia.innerHTML = '<option value="">Selecione uma subfamÃ­lia...</option>';

  if (!familia) {
    document.getElementById('atributosContainer').style.display = 'none';
    limparFiltrosAtributos();
    return;
  }

  // Filtrar produtos da famÃ­lia selecionada
  const produtosDaFamilia = produtosCache.filter(p => p.grupo === familia);
  const subfamilias = [...new Set(produtosDaFamilia.map(p => p.categoria).filter(Boolean))];

  subfamilias.forEach(subfamilia => {
    const option = document.createElement('option');
    option.value = subfamilia;
    option.textContent = subfamilia;
    selectSubfamilia.appendChild(option);
  });
}

function atualizarAtributos() {
  const familia = document.getElementById('filtroFamilia').value;
  const subfamilia = document.getElementById('filtroSubfamilia').value;

  const containerAtributos = document.getElementById('atributosContainer');
  const listaAtributos = document.getElementById('listaAtributos');
  listaAtributos.innerHTML = '';

  if (!subfamilia) {
    containerAtributos.style.display = 'none';
    limparFiltrosAtributos();
    return;
  }

  // Filtrar produtos da subfamÃ­lia selecionada
  const produtosDaSubfamilia = produtosCache.filter(
    p => p.grupo === familia && p.categoria === subfamilia
  );

  // Extrair todos os atributos Ãºnicos de produtos dessa subfamÃ­lia
  const atributosMap = new Map();
  produtosDaSubfamilia.forEach(produto => {
    if (produto.atributos) {
      Object.entries(produto.atributos).forEach(([chave, valor]) => {
        if (!atributosMap.has(chave)) {
          atributosMap.set(chave, new Set());
        }
        atributosMap.get(chave).add(valor);
      });
    }
  });

  if (atributosMap.size === 0) {
    containerAtributos.style.display = 'none';
    limparFiltrosAtributos();
    return;
  }

  // Renderizar checkboxes para cada atributo
  containerAtributos.style.display = 'block';
  atributosMap.forEach((valores, chave) => {
    const grupoAtributo = document.createElement('div');
    grupoAtributo.style.marginBottom = '15px';

    const titulo = document.createElement('strong');
    titulo.textContent = chave;
    titulo.style.display = 'block';
    titulo.style.marginBottom = '8px';
    titulo.style.fontSize = '13px';
    titulo.style.color = '#333';
    grupoAtributo.appendChild(titulo);

    // Ordenar valores
    const valoresOrdenadas = Array.from(valores).sort();
    valoresOrdenadas.forEach(valor => {
      const div = document.createElement('div');
      div.className = 'filtro-atributo';

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `attr-${chave}-${valor}`;
      input.value = valor;
      input.dataset.chave = chave;
      input.addEventListener('change', atualizarFiltrosAtivos);

      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.appendChild(input);
      label.appendChild(document.createTextNode(valor));

      div.appendChild(label);
      grupoAtributo.appendChild(div);
    });

    listaAtributos.appendChild(grupoAtributo);
  });
}

function atualizarFiltrosAtivos() {
  filtrosAtivos = {};

  // Coletar checkboxes selecionados
  document.querySelectorAll('.filtro-atributo input[type="checkbox"]:checked').forEach(checkbox => {
    const chave = checkbox.dataset.chave;
    if (!filtrosAtivos[chave]) {
      filtrosAtivos[chave] = [];
    }
    filtrosAtivos[chave].push(checkbox.value);
  });
}

function limparFiltrosAtributos() {
  filtrosAtivos = {};
  document.querySelectorAll('.filtro-atributo input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
}

// ==================== APLICAR FILTROS ====================
function aplicarFiltros() {
  const familia = document.getElementById('filtroFamilia').value;
  const subfamilia = document.getElementById('filtroSubfamilia').value;
  const busca = document.getElementById('filtroBusca').value.toLowerCase();

  // Atualizar cascatas
  if (!familia) {
    atualizarSubfamilias();
    atualizarAtributos();
  } else if (!subfamilia) {
    atualizarSubfamilias();
    atualizarAtributos();
  } else {
    atualizarAtributos();
  }

  // Garantir que filtros ativos estejam atualizados
  atualizarFiltrosAtivos();

  // Filtrar produtos com base em todos os critÃ©rios
  const produtosFiltrados = produtosCache.filter(produto => {
    // CritÃ©rio: FamÃ­lia
    const matchFamilia = !familia || produto.grupo === familia;

    // CritÃ©rio: SubfamÃ­lia
    const matchSubfamilia = !subfamilia || produto.categoria === subfamilia;

    // CritÃ©rio: Busca (Nome ou CÃ³digo)
    const matchBusca = !busca || 
                       (produto.nome && produto.nome.toLowerCase().includes(busca)) ||
                       (produto.sku && produto.sku.toLowerCase().includes(busca));

    // CritÃ©rio: Atributos
    let matchAtributos = true;
    Object.entries(filtrosAtivos).forEach(([chave, valores]) => {
      if (valores.length > 0) {
        const valorProduto = produto.atributos && produto.atributos[chave];
        if (!valores.includes(valorProduto)) {
          matchAtributos = false;
        }
      }
    });

    return matchFamilia && matchSubfamilia && matchBusca && matchAtributos;
  });

  renderizarTabela(produtosFiltrados);
}

// ==================== RENDERIZAR TABELA ====================
function renderizarTabela(produtos) {
  const tbody = document.getElementById('bodyProdutos');
  const countProdutos = document.getElementById('countProdutos');
  const textoResultado = document.getElementById('textoResultado');

  countProdutos.textContent = produtos.length;

  if (produtos.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="tabela-vazia">Nenhum produto encontrado</td></tr>';
    textoResultado.textContent = '';
    return;
  }

  tbody.innerHTML = produtos.map(produto => {
    // Renderizar atributos como badges
    let atributosHtml = '';
    if (produto.atributos && Object.keys(produto.atributos).length > 0) {
      atributosHtml = Object.entries(produto.atributos)
        .map(([chave, valor]) => `<span class="badge">${chave}: ${valor}</span>`)
        .join('');
    } else {
      atributosHtml = '<span style="color: #999;">Sem atributos</span>';
    }

    // Classe de cor para quantidade
    const classeQtd = produto.quantidade === 0 ? 'quantidade-baixa' : 'quantidade-ok';

    return `
      <tr>
        <td><strong>${produto.sku || 'N/A'}</strong></td>
        <td>${produto.nome}</td>
        <td>${produto.categoria || 'Geral'}</td>
        <td>${atributosHtml}</td>
        <td><span class="${classeQtd}">${produto.quantidade}</span></td>
        <td>R$ ${(produto.preco || 0).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  textoResultado.textContent = `Mostrando ${produtos.length} de ${produtosCache.length} produtos`;
}

// ==================== AÃ‡Ã•ES ====================
function limparFiltros() {
  document.getElementById('filtroFamilia').value = '';
  document.getElementById('filtroSubfamilia').value = '';
  document.getElementById('filtroBusca').value = '';
  document.getElementById('atributosContainer').style.display = 'none';
  limparFiltrosAtributos();
  aplicarFiltros();
}

function logout() {
  localStorage.clear();
  location.reload(); // Recarrega a pÃ¡gina para limpar o estado
}

function irPara(pagina) {
  // Redirecionar para a pÃ¡gina principal e selecionar a seÃ§Ã£o
  if (pagina === 'inventario') {
    // JÃ¡ estÃ¡ nesta pÃ¡gina
    return;
  }
  window.location.href = 'index.html?section=' + pagina;
}

