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
  const btnLimpar = document.getElementById('btnLimparFiltros');

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

      // Ocultar filtro de atributos se não tem subcategoria selecionada
      document.getElementById('filtroAtributosContainer').style.display = 'none';
      
      carregarItens();
    });
  }

  if (selectSub) {
    selectSub.addEventListener('change', () => {
      const subId = selectSub.value;
      atualizarFiltroAtributos(subId);
      carregarItens();
    });
  }

  if (selectEstoque) selectEstoque.addEventListener('change', carregarItens);
  if (inputBusca) inputBusca.addEventListener('input', debounce(carregarItens, 300));
  
  // Botão limpar filtros
  if (btnLimpar) {
    btnLimpar.addEventListener('click', limparFiltros);
  }
}

function limparFiltros() {
  const selectCat = document.getElementById('filtroCategoria');
  const selectSub = document.getElementById('filtroSubcategoria');
  const selectEstoque = document.getElementById('filtroEstoque');
  const inputBusca = document.getElementById('filtroBusca');

  if (selectCat) selectCat.value = '';
  if (selectSub) {
    selectSub.value = '';
    selectSub.disabled = true;
  }
  if (selectEstoque) selectEstoque.value = '';
  if (inputBusca) inputBusca.value = '';
  
  document.getElementById('filtroAtributosContainer').style.display = 'none';
  
  carregarItens();
}

function atualizarFiltroAtributos(subId) {
  const container = document.getElementById('filtroAtributosContainer');
  const atributosDiv = document.getElementById('filtroAtributos');
  
  if (!container || !atributosDiv) return;
  
  if (!subId) {
    container.style.display = 'none';
    return;
  }
  
  // Buscar subcategoria para pegar os atributos definidos
  const subcategoria = subcategorias.find(s => s.id === subId);
  
  if (!subcategoria || !subcategoria.atributos || subcategoria.atributos.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  // Buscar valores únicos de atributos nos itens dessa subcategoria
  const itensSubcat = itens.filter(i => i.subcategoriaId === subId);
  
  let html = '';
  subcategoria.atributos.forEach(attr => {
    // Coletar valores únicos desse atributo
    const valoresUnicos = [...new Set(
      itensSubcat
        .map(i => i.atributos?.[attr])
        .filter(v => v)
    )];
    
    if (valoresUnicos.length > 0) {
      html += `
        <div class="filtro-attr-grupo">
          <label class="filtro-attr-titulo">${attr}</label>
          <div class="filtro-checkboxes">
            ${valoresUnicos.map(v => `
              <label class="filtro-checkbox">
                <input type="checkbox" class="filtro-attr-check" data-attr="${attr}" value="${v}">
                <span>${v}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }
  });
  
  if (html) {
    atributosDiv.innerHTML = html;
    container.style.display = 'block';
    
    // Adicionar listeners nos checkboxes
    atributosDiv.querySelectorAll('.filtro-attr-check').forEach(check => {
      check.addEventListener('change', carregarItens);
    });
  } else {
    container.style.display = 'none';
  }
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
  const filtroBusca = document.getElementById('filtroBusca')?.value?.toLowerCase().trim() || '';

  let itensFiltrados = [...itens];

  // Filtrar por categoria
  if (filtroCat) {
    itensFiltrados = itensFiltrados.filter(i => i.categoriaId === filtroCat);
  }

  // Filtrar por subcategoria
  if (filtroSub) {
    itensFiltrados = itensFiltrados.filter(i => i.subcategoriaId === filtroSub);
  }

  // Filtrar por atributos selecionados (checkboxes)
  // Agrupa checkboxes marcados por atributo
  const checkboxesMarcados = document.querySelectorAll('.filtro-attr-check:checked');
  const filtrosAttr = {};
  
  checkboxesMarcados.forEach(check => {
    const attrNome = check.dataset.attr;
    if (!filtrosAttr[attrNome]) {
      filtrosAttr[attrNome] = [];
    }
    filtrosAttr[attrNome].push(check.value);
  });
  
  // Para cada atributo com filtros, o item deve ter UM dos valores selecionados
  Object.entries(filtrosAttr).forEach(([attrNome, valores]) => {
    itensFiltrados = itensFiltrados.filter(i => 
      valores.includes(i.atributos?.[attrNome])
    );
  });

  // Filtrar por estoque
  if (filtroEstoque) {
    itensFiltrados = itensFiltrados.filter(i => {
      if (filtroEstoque === 'critico') return i.estoque <= 0;
      if (filtroEstoque === 'baixo') return i.estoque > 0 && i.estoque < i.estoqueMinimo;
      if (filtroEstoque === 'ok') return i.estoque >= i.estoqueMinimo;
      return true;
    });
  }

  // BUSCA INTELIGENTE - procura em todos os campos
  if (filtroBusca) {
    const termos = filtroBusca.split(/\s+/); // Divide por espaços
    
    itensFiltrados = itensFiltrados.filter(item => {
      // Monta string de busca com todos os campos do item
      const camposBusca = [
        item.categoriaNome || '',
        item.subcategoriaNome || '',
        item.descricao || '',
        item.nomeCompleto || '',
        ...Object.values(item.atributos || {})
      ].join(' ').toLowerCase();
      
      // Todos os termos devem estar presentes
      return termos.every(termo => camposBusca.includes(termo));
    });
  }

  // Atualizar contador
  const contador = document.getElementById('contadorResultados');
  if (contador) {
    contador.textContent = `${itensFiltrados.length} ${itensFiltrados.length === 1 ? 'item encontrado' : 'itens encontrados'}`;
  }

  // Renderizar
  if (itensFiltrados.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="6" class="vazio">
          <div class="vazio-icon">${itens.length === 0 ? '<i class="bi bi-box"></i>' : '<i class="bi bi-search"></i>'}</div>
          <p>${itens.length === 0 
            ? 'Nenhum item cadastrado ainda.' 
            : 'Nenhum item encontrado com os filtros aplicados.'}</p>
          ${itens.length === 0 ? '<p>Vá em <strong>Novo Item</strong> para criar itens.</p>' : ''}
        </td>
      </tr>
    `;
  } else {
    container.innerHTML = itensFiltrados.map(item => {
      const statusEstoque = getStatusEstoque(item);
      
      // Montar badges de atributos
      const atributosHtml = Object.entries(item.atributos || {}).map(([key, val]) => 
        `<span class="attr-badge">${val}</span>`
      ).join('');
      
      // Nome do item: Categoria > Subcategoria
      const nomeItem = `
        <div class="item-nome-completo">
          <span class="item-categoria">${item.categoriaNome}</span>
          <i class="bi bi-chevron-right"></i>
          <span class="item-subcategoria">${item.subcategoriaNome}</span>
        </div>
        ${item.descricao ? `<div class="item-descricao">${item.descricao}</div>` : ''}
      `;
      
      return `
        <tr>
          <td class="col-item">${nomeItem}</td>
          <td class="col-atributos">
            <div class="atributos-inline">${atributosHtml || '-'}</div>
          </td>
          <td class="col-estoque">
            <span class="estoque-valor ${statusEstoque.classe}">${item.estoque}</span>
          </td>
          <td class="col-unidade">${item.unidade}</td>
          <td class="col-minimo">${item.estoqueMinimo}</td>
          <td><span class="status-badge ${statusEstoque.classe}">${statusEstoque.texto}</span></td>
        </tr>
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
