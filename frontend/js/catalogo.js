// =============================================
// CATÁLOGO DE ITENS
// Sistema de Almoxarifado
// =============================================

// Dados
let categorias = JSON.parse(localStorage.getItem('almox_categorias') || '[]');
let subcategorias = JSON.parse(localStorage.getItem('almox_subcategorias') || '[]');
let itens = JSON.parse(localStorage.getItem('almox_itens') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  carregarResumo();
  carregarFiltros();
  carregarItens();
  setupFiltros();
});

// =============================================
// RESUMO
// =============================================

function carregarResumo() {
  const totalItensEl = document.getElementById('totalItens');
  const totalCategoriasEl = document.getElementById('totalCategorias');
  const itensCriticosEl = document.getElementById('itensCriticos');
  const itensOkEl = document.getElementById('itensOk');

  let criticos = 0;
  let ok = 0;

  itens.forEach(item => {
    if (item.estoque <= 0) {
      criticos++;
    } else if (item.estoque < item.estoqueMinimo) {
      criticos++;
    } else {
      ok++;
    }
  });

  if (totalItensEl) totalItensEl.textContent = itens.length;
  if (totalCategoriasEl) totalCategoriasEl.textContent = categorias.length;
  if (itensCriticosEl) itensCriticosEl.textContent = criticos;
  if (itensOkEl) itensOkEl.textContent = ok;
}

// =============================================
// FILTROS
// =============================================

function carregarFiltros() {
  const selectCat = document.getElementById('filtroCategoria');
  
  if (selectCat) {
    selectCat.innerHTML = '<option value="">Todas</option>' +
      categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  }
}

function setupFiltros() {
  const selectCat = document.getElementById('filtroCategoria');
  const selectSub = document.getElementById('filtroSubcategoria');
  const selectEstoque = document.getElementById('filtroEstoque');
  const inputBusca = document.getElementById('filtroBusca');

  if (selectCat) {
    selectCat.addEventListener('change', () => {
      const catId = selectCat.value;
      
      // Atualizar subcategorias
      if (selectSub) {
        const subsFiltradas = catId ? subcategorias.filter(s => s.categoriaId === catId) : [];
        selectSub.innerHTML = '<option value="">Todas</option>' +
          subsFiltradas.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
        selectSub.disabled = !catId;
      }

      carregarItens();
    });
  }

  if (selectSub) selectSub.addEventListener('change', carregarItens);
  if (selectEstoque) selectEstoque.addEventListener('change', carregarItens);
  if (inputBusca) inputBusca.addEventListener('input', debounce(carregarItens, 300));
}

// =============================================
// ITENS
// =============================================

function carregarItens() {
  const container = document.getElementById('listaItens');
  if (!container) return;

  // Recarregar dados
  itens = JSON.parse(localStorage.getItem('almox_itens') || '[]');

  const filtroCat = document.getElementById('filtroCategoria')?.value || '';
  const filtroSub = document.getElementById('filtroSubcategoria')?.value || '';
  const filtroEstoque = document.getElementById('filtroEstoque')?.value || '';
  const filtroBusca = document.getElementById('filtroBusca')?.value?.toLowerCase() || '';

  let itensFiltrados = [...itens];

  // Filtrar por categoria
  if (filtroCat) {
    itensFiltrados = itensFiltrados.filter(i => i.categoriaId === filtroCat);
  }

  // Filtrar por subcategoria
  if (filtroSub) {
    itensFiltrados = itensFiltrados.filter(i => i.subcategoriaId === filtroSub);
  }

  // Filtrar por estoque
  if (filtroEstoque) {
    itensFiltrados = itensFiltrados.filter(i => {
      if (filtroEstoque === 'critico') return i.estoque <= 0;
      if (filtroEstoque === 'baixo') return i.estoque > 0 && i.estoque < i.estoqueMinimo;
      if (filtroEstoque === 'ok') return i.estoque >= i.estoqueMinimo;
      return true;
    });
  }

  // Filtrar por busca
  if (filtroBusca) {
    itensFiltrados = itensFiltrados.filter(i => 
      i.nomeCompleto.toLowerCase().includes(filtroBusca) ||
      Object.values(i.atributos || {}).some(v => v.toLowerCase().includes(filtroBusca))
    );
  }

  // Renderizar
  if (itensFiltrados.length === 0) {
    container.innerHTML = `
      <div class="vazio">
        <div class="vazio-icon">${itens.length === 0 ? '📦' : '🔍'}</div>
        <p>${itens.length === 0 
          ? 'Nenhum item cadastrado ainda.' 
          : 'Nenhum item encontrado com os filtros aplicados.'}</p>
        ${itens.length === 0 ? '<p>Vá em <strong>Novo Item</strong> para criar itens.</p>' : ''}
      </div>
    `;
  } else {
    container.innerHTML = itensFiltrados.map(item => {
      const statusEstoque = getStatusEstoque(item);
      
      return `
        <div class="card-item">
          <div class="card-header">
            <div class="categoria">${item.categoriaNome} / ${item.subcategoriaNome}</div>
            <div class="nome">${item.nomeCompleto}</div>
          </div>
          <div class="card-body">
            <div class="atributos-lista">
              ${Object.entries(item.atributos || {}).map(([key, val]) => `
                <div class="atributo-row">
                  <span class="label">${key}</span>
                  <span class="valor">${val}</span>
                </div>
              `).join('')}
              ${item.descricao ? `
                <div class="atributo-row">
                  <span class="label">Descrição</span>
                  <span class="valor">${item.descricao}</span>
                </div>
              ` : ''}
            </div>
          </div>
          <div class="card-footer">
            <div class="estoque-info">
              <span class="estoque ${statusEstoque.classe}">${item.estoque}</span>
              <span class="unidade">${item.unidade}</span>
            </div>
            <span class="status-badge ${statusEstoque.classe}">${statusEstoque.texto}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Atualizar resumo
  carregarResumo();
}

function getStatusEstoque(item) {
  if (item.estoque <= 0) {
    return { classe: 'critico', texto: '🔴 Zerado' };
  } else if (item.estoque < item.estoqueMinimo) {
    return { classe: 'alerta', texto: '🟡 Baixo' };
  } else {
    return { classe: 'ok', texto: '🟢 OK' };
  }
}

// =============================================
// UTILIDADES
// =============================================

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function mostrarMensagem(texto, tipo) {
  const el = document.getElementById('mensagem');
  if (!el) return;

  el.textContent = texto;
  el.className = `mensagem ${tipo}`;
  el.style.display = 'block';

  setTimeout(() => {
    el.style.display = 'none';
  }, 3000);
}
