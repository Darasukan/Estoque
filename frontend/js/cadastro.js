// =============================================
// CADASTRO DE CATEGORIAS E SUBCATEGORIAS
// Sistema de Almoxarifado
// =============================================

// Dados em memória (localStorage)
let categorias = JSON.parse(localStorage.getItem('almox_categorias') || '[]');
let subcategorias = JSON.parse(localStorage.getItem('almox_subcategorias') || '[]');

// Atributos temporários durante criação
let atributosTemp = [];

// Estado da ordenação
let ordenacaoCategorias = 'az';
let ordenacaoSubcategorias = 'az';

document.addEventListener('DOMContentLoaded', () => {
  carregarCategorias();
  carregarSubcategorias();
  carregarUltimasSubcategorias();
  setupFormularios();
  setupAtributosInput();
  setupTabs();
  setupAutocompleteSubcategoria();
  setupOrdenacao();
});

// =============================================
// TABS
// =============================================

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const sidebar = document.querySelector('.catalogo-sidebar');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remover active de todos
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // Ativar a aba clicada
      btn.classList.add('active');
      const tabId = btn.dataset.tab;
      document.getElementById(`tab-${tabId}`)?.classList.add('active');
      
      // Mostrar/ocultar sidebar (só mostra nas abas de consulta)
      if (sidebar) {
        sidebar.style.display = (tabId === 'cadastro') ? 'none' : 'block';
      }
    });
  });
  
  // Inicialmente ocultar sidebar (começa na aba cadastro)
  if (sidebar) {
    sidebar.style.display = 'none';
  }
  
  // Botão limpar filtros
  const btnLimpar = document.getElementById('btnLimparFiltros');
  if (btnLimpar) {
    btnLimpar.addEventListener('click', () => {
      const filtroCategoria = document.getElementById('filtroCategoria');
      const filtroSubcategoria = document.getElementById('filtroSubcategoria');
      const buscaGeral = document.getElementById('buscaGeral');
      
      if (filtroCategoria) filtroCategoria.value = '';
      if (filtroSubcategoria) {
        filtroSubcategoria.value = '';
        filtroSubcategoria.disabled = true;
      }
      if (buscaGeral) buscaGeral.value = '';
      
      carregarCategorias();
      carregarSubcategorias();
    });
  }
}

// =============================================
// ORDENAÇÃO
// =============================================

function setupOrdenacao() {
  document.querySelectorAll('.btn-ordenar').forEach(btn => {
    btn.addEventListener('click', () => {
      const lista = btn.dataset.lista;
      const ordem = btn.dataset.ordem;
      
      // Atualizar estado visual
      document.querySelectorAll(`.btn-ordenar[data-lista="${lista}"]`).forEach(b => {
        b.classList.remove('active');
      });
      btn.classList.add('active');
      
      // Atualizar estado e recarregar
      if (lista === 'categorias') {
        ordenacaoCategorias = ordem;
        carregarCategorias();
      } else if (lista === 'subcategorias') {
        ordenacaoSubcategorias = ordem;
        carregarSubcategorias();
      }
    });
  });
}

function ordenarLista(lista, tipo, ordem) {
  const listaOrdenada = [...lista];
  
  switch (ordem) {
    case 'az':
      listaOrdenada.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      break;
    case 'za':
      listaOrdenada.sort((a, b) => b.nome.localeCompare(a.nome, 'pt-BR'));
      break;
    case 'recente':
      listaOrdenada.sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));
      break;
    case 'categoria':
      // Ordenar por nome da categoria pai, depois por nome
      listaOrdenada.sort((a, b) => {
        const catA = categorias.find(c => c.id === a.categoriaId)?.nome || '';
        const catB = categorias.find(c => c.id === b.categoriaId)?.nome || '';
        const cmp = catA.localeCompare(catB, 'pt-BR');
        return cmp !== 0 ? cmp : a.nome.localeCompare(b.nome, 'pt-BR');
      });
      break;
  }
  
  return listaOrdenada;
}

// =============================================
// ÚLTIMAS SUBCATEGORIAS
// =============================================

function carregarUltimasSubcategorias() {
  const lista = document.getElementById('listaUltimasSubcats');
  if (!lista) return;
  
  // Ordenar por data de criação (mais recentes primeiro) e pegar as 5 primeiras
  const ultimas = [...subcategorias]
    .sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0))
    .slice(0, 5);
  
  if (ultimas.length === 0) {
    lista.innerHTML = '<div class="vazio-mini"><i class="bi bi-inbox"></i> Nenhuma ainda</div>';
    return;
  }
  
  lista.innerHTML = ultimas.map(sub => {
    const cat = categorias.find(c => c.id === sub.categoriaId);
    return `
      <div class="ultima-subcat-item">
        <div class="ultima-subcat-info">
          <span class="ultima-subcat-nome">${sub.nome}</span>
          <span class="ultima-subcat-cat">${cat?.nome || 'Sem categoria'}</span>
        </div>
        <button class="ultima-subcat-btn" onclick="editarSubcategoria('${sub.id}')" title="Editar">
          <i class="bi bi-pencil"></i>
        </button>
      </div>
    `;
  }).join('');
}

// =============================================
// SETUP
// =============================================

function setupFormularios() {
  // Form Categoria
  const formCategoria = document.getElementById('formCategoria');
  if (formCategoria) {
    formCategoria.addEventListener('submit', salvarCategoria);
    formCategoria.addEventListener('reset', () => {
      formCategoria.removeAttribute('data-editando');
    });
  }

  // Form Subcategoria
  const formSubcategoria = document.getElementById('formSubcategoria');
  if (formSubcategoria) {
    formSubcategoria.addEventListener('submit', salvarSubcategoria);
    formSubcategoria.addEventListener('reset', () => {
      atributosTemp = [];
      atualizarAtributosVisuais();
      formSubcategoria.removeAttribute('data-editando');
      atualizarSubcatsExistentes(); // Limpar lista
    });
  }

  // Select de categoria pai (formulário)
  const categoriaParente = document.getElementById('categoriaParente');
  if (categoriaParente) {
    categoriaParente.addEventListener('change', atualizarSubcatsExistentes);
  }

  // Filtro de categoria
  const filtroCategoria = document.getElementById('filtroCategoria');
  if (filtroCategoria) {
    filtroCategoria.addEventListener('change', () => {
      atualizarFiltroSubcategoria();
      carregarCategorias();
      carregarSubcategorias();
    });
  }
  
  // Filtro de subcategoria
  const filtroSubcategoria = document.getElementById('filtroSubcategoria');
  if (filtroSubcategoria) {
    filtroSubcategoria.addEventListener('change', () => {
      carregarSubcategorias();
    });
  }
  
  // Busca geral
  const buscaGeral = document.getElementById('buscaGeral');
  if (buscaGeral) {
    buscaGeral.addEventListener('input', () => {
      carregarCategorias();
      carregarSubcategorias();
    });
  }
}

function atualizarFiltroSubcategoria() {
  const filtroCategoria = document.getElementById('filtroCategoria');
  const filtroSubcategoria = document.getElementById('filtroSubcategoria');
  
  if (!filtroSubcategoria) return;
  
  const catId = filtroCategoria?.value || '';
  
  if (!catId) {
    filtroSubcategoria.innerHTML = '<option value="">Todas</option>';
    filtroSubcategoria.disabled = true;
    return;
  }
  
  const subsFiltradas = subcategorias.filter(s => s.categoriaId === catId);
  filtroSubcategoria.innerHTML = '<option value="">Todas</option>' +
    subsFiltradas.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
  filtroSubcategoria.disabled = false;
}

// Mostra subcategorias já cadastradas ao selecionar categoria no formulário
function atualizarSubcatsExistentes() {
  // Função mantida para compatibilidade, mas agora usamos autocomplete
  fecharSugestoes();
}

// =============================================
// AUTOCOMPLETE DE SUBCATEGORIAS
// =============================================

function setupAutocompleteSubcategoria() {
  const input = document.getElementById('nomeSubcategoria');
  const dropdown = document.getElementById('sugestoesSubcat');
  
  if (!input || !dropdown) return;
  
  let selectedIndex = -1;
  
  // Ao digitar, mostrar sugestões
  input.addEventListener('input', () => {
    mostrarSugestoes();
  });
  
  // Foco no input também mostra sugestões
  input.addEventListener('focus', () => {
    mostrarSugestoes();
  });
  
  // Navegação com teclado
  input.addEventListener('keydown', (e) => {
    const items = dropdown.querySelectorAll('.sugestao-item');
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      atualizarSelecao(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, -1);
      atualizarSelecao(items);
    } else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
      e.preventDefault();
      const subId = items[selectedIndex].dataset.id;
      selecionarSubcategoriaExistente(subId);
    } else if (e.key === 'Escape') {
      fecharSugestoes();
    }
  });
  
  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.autocomplete-wrapper')) {
      fecharSugestoes();
    }
  });
  
  function atualizarSelecao(items) {
    items.forEach((item, idx) => {
      item.classList.toggle('selected', idx === selectedIndex);
    });
  }
}

function mostrarSugestoes() {
  const input = document.getElementById('nomeSubcategoria');
  const dropdown = document.getElementById('sugestoesSubcat');
  const catId = document.getElementById('categoriaParente')?.value || '';
  
  if (!dropdown || !input) return;
  
  // Se não tem categoria selecionada, não mostra sugestões
  if (!catId) {
    fecharSugestoes();
    return;
  }
  
  const termo = input.value.toLowerCase().trim();
  const subsDaCategoria = subcategorias.filter(s => s.categoriaId === catId);
  
  // Se não tiver subcategorias, não mostra
  if (subsDaCategoria.length === 0) {
    fecharSugestoes();
    return;
  }
  
  // Filtrar por termo (se tiver)
  let sugestoes = subsDaCategoria;
  if (termo) {
    sugestoes = subsDaCategoria.filter(s => 
      s.nome.toLowerCase().includes(termo)
    );
  }
  
  // Se não encontrou nada, fechar
  if (sugestoes.length === 0) {
    fecharSugestoes();
    return;
  }
  
  // Renderizar sugestões
  dropdown.innerHTML = sugestoes.map(sub => `
    <div class="sugestao-item" data-id="${sub.id}" onclick="selecionarSubcategoriaExistente('${sub.id}')">
      <i class="bi bi-folder2"></i>
      <span>${sub.nome}</span>
      <span class="hint">clique para editar</span>
    </div>
  `).join('');
  
  dropdown.classList.add('show');
}

function fecharSugestoes() {
  const dropdown = document.getElementById('sugestoesSubcat');
  if (dropdown) {
    dropdown.classList.remove('show');
    dropdown.innerHTML = '';
  }
}

function selecionarSubcategoriaExistente(id) {
  fecharSugestoes();
  editarSubcategoria(id);
}

function setupAtributosInput() {
  const input = document.getElementById('atributoInput');
  const container = document.getElementById('atributosContainer');
  
  if (!input || !container) return;

  input.addEventListener('keydown', (e) => {
    // Enter adiciona a tag e mantém foco
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const valor = input.value.trim();
      if (valor && !atributosTemp.includes(valor)) {
        atributosTemp.push(valor);
        atualizarAtributosVisuais();
      }
      input.value = '';
      // Garantir foco no input
      setTimeout(() => input.focus(), 0);
    }
    
    // Backspace com input vazio remove última tag
    if (e.key === 'Backspace' && input.value === '' && atributosTemp.length > 0) {
      e.preventDefault();
      atributosTemp.pop();
      atualizarAtributosVisuais();
      setTimeout(() => input.focus(), 0);
    }
  });

  container.addEventListener('click', () => {
    input.focus();
  });
}

function atualizarAtributosVisuais() {
  const container = document.getElementById('atributosContainer');
  const input = document.getElementById('atributoInput');
  
  if (!container || !input) return;

  container.innerHTML = '';
  
  atributosTemp.forEach((attr, idx) => {
    const tag = document.createElement('span');
    tag.className = 'atributo-tag';
    tag.draggable = true;
    tag.dataset.index = idx;
    tag.innerHTML = `<i class="bi bi-grip-vertical" style="opacity:0.5;font-size:0.75rem;cursor:grab"></i> ${attr} <span class="remover" onclick="event.stopPropagation();removerAtributo(${idx})">×</span>`;
    
    // Drag events
    tag.addEventListener('dragstart', handleDragStart);
    tag.addEventListener('dragend', handleDragEnd);
    tag.addEventListener('dragover', handleDragOver);
    tag.addEventListener('drop', handleDrop);
    tag.addEventListener('dragenter', handleDragEnter);
    tag.addEventListener('dragleave', handleDragLeave);
    
    container.appendChild(tag);
  });

  container.appendChild(input);
}

// =============================================
// DRAG AND DROP DE ATRIBUTOS
// =============================================

let draggedAttrIndex = null;

function handleDragStart(e) {
  draggedAttrIndex = parseInt(this.dataset.index);
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.atributo-tag').forEach(tag => {
    tag.classList.remove('drag-over');
  });
  draggedAttrIndex = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  if (parseInt(this.dataset.index) !== draggedAttrIndex) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  const targetIndex = parseInt(this.dataset.index);
  
  if (draggedAttrIndex !== null && draggedAttrIndex !== targetIndex) {
    // Reordenar array
    const item = atributosTemp.splice(draggedAttrIndex, 1)[0];
    atributosTemp.splice(targetIndex, 0, item);
    atualizarAtributosVisuais();
  }
  
  this.classList.remove('drag-over');
}

function removerAtributo(idx) {
  atributosTemp.splice(idx, 1);
  atualizarAtributosVisuais();
}

// =============================================
// SINCRONIZAÇÃO DE ITENS
// =============================================

function sincronizarItensComSubcategoria(subcategoriaId, atributosAtuais, nomeSubcategoria) {
  // Carregar itens do localStorage
  let itens = JSON.parse(localStorage.getItem('almox_itens') || '[]');
  let alterados = 0;
  
  itens = itens.map(item => {
    if (item.subcategoriaId !== subcategoriaId) return item;
    
    // Filtrar apenas os atributos que ainda existem na subcategoria
    const atributosLimpos = {};
    atributosAtuais.forEach(attr => {
      if (item.atributos && item.atributos[attr] !== undefined) {
        atributosLimpos[attr] = item.atributos[attr];
      }
    });
    
    // Atualizar nome da subcategoria
    item.subcategoriaNome = nomeSubcategoria;
    
    // Reconstruir nomeCompleto
    let partes = [item.categoriaNome, nomeSubcategoria];
    Object.entries(atributosLimpos).forEach(([nome, valor]) => {
      if (valor) partes.push(`${nome}: ${valor}`);
    });
    if (item.descricao) partes.push(item.descricao);
    
    item.atributos = atributosLimpos;
    item.nomeCompleto = partes.join(' - ');
    alterados++;
    
    return item;
  });
  
  if (alterados > 0) {
    localStorage.setItem('almox_itens', JSON.stringify(itens));
    console.log(`[Sync] ${alterados} item(s) atualizado(s) para subcategoria ${subcategoriaId}`);
  }
}

// =============================================
// CATEGORIAS
// =============================================

function salvarCategoria(e) {
  e.preventDefault();

  const nomeEl = document.getElementById('nomeCategoria');
  if (!nomeEl) return;

  const nome = nomeEl.value.trim();
  const editandoId = e.target.getAttribute('data-editando');

  if (!nome) {
    mostrarMensagem('Preencha o nome da categoria', 'erro');
    return;
  }

  // Verificar duplicata
  const duplicata = categorias.find(c => 
    c.nome.toLowerCase() === nome.toLowerCase() && c.id !== editandoId
  );
  if (duplicata) {
    mostrarMensagem('Já existe uma categoria com esse nome', 'erro');
    return;
  }

  if (editandoId) {
    const idx = categorias.findIndex(c => c.id === editandoId);
    if (idx !== -1) {
      categorias[idx].nome = nome;
      mostrarMensagem('Categoria atualizada!', 'sucesso');
    }
    e.target.removeAttribute('data-editando');
  } else {
    const novaCategoria = {
      id: 'cat_' + Date.now(),
      nome,
      criadoEm: new Date().toISOString()
    };
    categorias.push(novaCategoria);
    mostrarMensagem('Categoria criada!', 'sucesso');
  }

  salvarDados();
  e.target.reset();
  carregarCategorias();
}

function carregarCategorias() {
  const lista = document.getElementById('listaCategorias');
  const total = document.getElementById('totalCategorias');
  const selectParente = document.getElementById('categoriaParente');
  const filtroCategoria = document.getElementById('filtroCategoria');
  
  // Obter filtros
  const filtroCatId = document.getElementById('filtroCategoria')?.value || '';
  const filtroBusca = document.getElementById('buscaGeral')?.value?.toLowerCase().trim() || '';
  
  // Filtrar categorias
  let catsFiltradas = [...categorias];
  
  if (filtroCatId) {
    catsFiltradas = catsFiltradas.filter(c => c.id === filtroCatId);
  }
  
  if (filtroBusca) {
    catsFiltradas = catsFiltradas.filter(c => 
      c.nome.toLowerCase().includes(filtroBusca)
    );
  }
  
  // Aplicar ordenação
  catsFiltradas = ordenarLista(catsFiltradas, 'categorias', ordenacaoCategorias);

  if (lista) {
    if (catsFiltradas.length === 0) {
      lista.innerHTML = '<div class="vazio"><i class="bi bi-inbox"></i> Nenhuma categoria encontrada</div>';
    } else {
      lista.innerHTML = catsFiltradas.map(cat => `
        <div class="item-lista">
          <div class="info-item">
            <div class="nome-item">${cat.nome}</div>
            <div class="desc-item">${contarSubcategorias(cat.id)} subcategoria(s)</div>
          </div>
          <div class="acoes-item">
            <button class="btn-editar" onclick="editarCategoria('${cat.id}')"><i class="bi bi-pencil"></i></button>
            <button class="btn-deletar" onclick="deletarCategoria('${cat.id}')"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      `).join('');
    }
  }

  if (total) total.textContent = catsFiltradas.length;

  // Atualizar selects (sempre mostrar todas as categorias nos selects)
  const options = categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  
  if (selectParente) {
    selectParente.innerHTML = '<option value="">Selecione uma categoria</option>' + options;
  }
  
  if (filtroCategoria) {
    const valorAtual = filtroCategoria.value;
    filtroCategoria.innerHTML = '<option value="">Todas</option>' + options;
    filtroCategoria.value = valorAtual;
  }
}

function editarCategoria(id) {
  const cat = categorias.find(c => c.id === id);
  if (!cat) return;

  // Mudar para a aba de cadastro
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="cadastro"]')?.classList.add('active');
  document.getElementById('tab-cadastro')?.classList.add('active');

  document.getElementById('nomeCategoria').value = cat.nome;
  document.getElementById('formCategoria').setAttribute('data-editando', id);
  document.getElementById('nomeCategoria').focus();
}

function deletarCategoria(id) {
  const cat = categorias.find(c => c.id === id);
  if (!cat) return;

  const subsVinculadas = subcategorias.filter(s => s.categoriaId === id);
  
  let msg = `Excluir a categoria "${cat.nome}"?`;
  if (subsVinculadas.length > 0) {
    msg += `\n\nATENÇÃO: ${subsVinculadas.length} subcategoria(s) serão excluídas!`;
  }

  if (confirm(msg)) {
    categorias = categorias.filter(c => c.id !== id);
    subcategorias = subcategorias.filter(s => s.categoriaId !== id);
    salvarDados();
    carregarCategorias();
    carregarSubcategorias();
    mostrarMensagem('Categoria excluída', 'sucesso');
  }
}

function contarSubcategorias(categoriaId) {
  return subcategorias.filter(s => s.categoriaId === categoriaId).length;
}

// =============================================
// SUBCATEGORIAS
// =============================================

function salvarSubcategoria(e) {
  e.preventDefault();

  const categoriaId = document.getElementById('categoriaParente').value;
  const nome = document.getElementById('nomeSubcategoria').value.trim();
  const unidade = document.getElementById('unidadeSubcategoria').value;
  const estoqueMinimo = parseInt(document.getElementById('estoqueMinimo').value) || 0;
  const editandoId = e.target.getAttribute('data-editando');

  if (!categoriaId) {
    mostrarMensagem('Selecione uma categoria', 'erro');
    return;
  }

  if (!nome) {
    mostrarMensagem('Preencha o nome da subcategoria', 'erro');
    return;
  }

  // Verificar duplicata
  const duplicata = subcategorias.find(s => 
    s.categoriaId === categoriaId && 
    s.nome.toLowerCase() === nome.toLowerCase() && 
    s.id !== editandoId
  );
  if (duplicata) {
    mostrarMensagem('Já existe uma subcategoria com esse nome nesta categoria', 'erro');
    return;
  }

  if (editandoId) {
    const idx = subcategorias.findIndex(s => s.id === editandoId);
    if (idx !== -1) {
      const atributosAntigos = subcategorias[idx].atributos || [];
      const atributosNovos = [...atributosTemp];
      
      subcategorias[idx].nome = nome;
      subcategorias[idx].unidade = unidade;
      subcategorias[idx].estoqueMinimo = estoqueMinimo;
      subcategorias[idx].atributos = atributosNovos;
      
      // Sincronizar itens - remover atributos que foram excluídos
      sincronizarItensComSubcategoria(editandoId, atributosNovos, nome);
      
      mostrarMensagem('Subcategoria atualizada!', 'sucesso');
    }
    e.target.removeAttribute('data-editando');
  } else {
    const novaSubcategoria = {
      id: 'sub_' + Date.now(),
      categoriaId,
      nome,
      unidade,
      estoqueMinimo,
      atributos: [...atributosTemp],
      criadoEm: new Date().toISOString()
    };
    subcategorias.push(novaSubcategoria);
    mostrarMensagem('Subcategoria criada!', 'sucesso');
  }

  atributosTemp = [];
  salvarDados();
  e.target.reset();
  atualizarAtributosVisuais();
  carregarCategorias();
  carregarSubcategorias();
  carregarUltimasSubcategorias();
  atualizarSubcatsExistentes(); // Atualizar lista de subcategorias existentes
}

function carregarSubcategorias() {
  const lista = document.getElementById('listaSubcategorias');
  const total = document.getElementById('totalSubcategorias');

  if (!lista) return;
  
  // Obter filtros
  const filtroCatId = document.getElementById('filtroCategoria')?.value || '';
  const filtroSubId = document.getElementById('filtroSubcategoria')?.value || '';
  const filtroBusca = document.getElementById('buscaGeral')?.value?.toLowerCase().trim() || '';

  let subsFiltradas = [...subcategorias];
  
  // Filtrar por categoria
  if (filtroCatId) {
    subsFiltradas = subsFiltradas.filter(s => s.categoriaId === filtroCatId);
  }
  
  // Filtrar por subcategoria específica
  if (filtroSubId) {
    subsFiltradas = subsFiltradas.filter(s => s.id === filtroSubId);
  }
  
  // Filtrar por busca de texto
  if (filtroBusca) {
    subsFiltradas = subsFiltradas.filter(s => 
      s.nome.toLowerCase().includes(filtroBusca) ||
      s.atributos?.some(a => a.toLowerCase().includes(filtroBusca))
    );
  }
  
  // Aplicar ordenação
  subsFiltradas = ordenarLista(subsFiltradas, 'subcategorias', ordenacaoSubcategorias);

  if (subsFiltradas.length === 0) {
    lista.innerHTML = '<div class="vazio"><i class="bi bi-inbox"></i> Nenhuma subcategoria encontrada</div>';
  } else {
    lista.innerHTML = subsFiltradas.map(sub => {
      const categoria = categorias.find(c => c.id === sub.categoriaId);
      return `
        <div class="item-lista subcategoria">
          <div class="info-item">
            <div class="nome-item">${categoria?.nome || 'Sem categoria'} <i class="bi bi-chevron-right"></i> ${sub.nome}</div>
            <div class="badges">
              <span class="badge badge-unidade">${sub.unidade}</span>
              <span class="badge badge-minimo">Mín: ${sub.estoqueMinimo}</span>
              ${sub.atributos?.length > 0 
                ? sub.atributos.map(a => `<span class="badge badge-atributo">${a}</span>`).join('')
                : '<span class="badge badge-atributo">Sem atributos</span>'
              }
            </div>
          </div>
          <div class="acoes-item">
            <button class="btn-editar" onclick="editarSubcategoria('${sub.id}')"><i class="bi bi-pencil"></i></button>
            <button class="btn-deletar" onclick="deletarSubcategoria('${sub.id}')"><i class="bi bi-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');
  }

  if (total) total.textContent = subsFiltradas.length;
  
  // Atualizar contador da sidebar
  const contador = document.getElementById('contadorResultados');
  if (contador) {
    const totalCats = document.getElementById('totalCategorias')?.textContent || '0';
    contador.textContent = `${totalCats} cat. / ${subsFiltradas.length} subcat.`;
  }
}

function editarSubcategoria(id) {
  const sub = subcategorias.find(s => s.id === id);
  if (!sub) return;

  // Mudar para a aba de cadastro
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('.tab-btn[data-tab="cadastro"]')?.classList.add('active');
  document.getElementById('tab-cadastro')?.classList.add('active');

  document.getElementById('categoriaParente').value = sub.categoriaId;
  document.getElementById('nomeSubcategoria').value = sub.nome;
  document.getElementById('unidadeSubcategoria').value = sub.unidade;
  document.getElementById('estoqueMinimo').value = sub.estoqueMinimo;
  atributosTemp = [...(sub.atributos || [])];
  atualizarAtributosVisuais();
  document.getElementById('formSubcategoria').setAttribute('data-editando', id);
  document.getElementById('nomeSubcategoria').focus();
}

function deletarSubcategoria(id) {
  const sub = subcategorias.find(s => s.id === id);
  if (!sub) return;

  // Verificar se há itens vinculados
  const itens = JSON.parse(localStorage.getItem('almox_itens') || '[]');
  const itensVinculados = itens.filter(i => i.subcategoriaId === id);

  let msg = `Excluir a subcategoria "${sub.nome}"?`;
  if (itensVinculados.length > 0) {
    msg += `\n\nATENÇÃO: ${itensVinculados.length} item(s) serão excluídos!`;
  }

  if (confirm(msg)) {
    subcategorias = subcategorias.filter(s => s.id !== id);
    // Remover itens vinculados também
    const itensAtualizados = itens.filter(i => i.subcategoriaId !== id);
    localStorage.setItem('almox_itens', JSON.stringify(itensAtualizados));
    
    salvarDados();
    carregarCategorias();
    carregarSubcategorias();
    carregarUltimasSubcategorias();
    atualizarSubcatsExistentes(); // Atualizar lista de subcategorias existentes
    mostrarMensagem('Subcategoria excluída', 'sucesso');
  }
}

// =============================================
// UTILIDADES
// =============================================

function salvarDados() {
  localStorage.setItem('almox_categorias', JSON.stringify(categorias));
  localStorage.setItem('almox_subcategorias', JSON.stringify(subcategorias));
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

