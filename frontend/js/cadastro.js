// =============================================
// CADASTRO DE CATEGORIAS E SUBCATEGORIAS
// Sistema de Almoxarifado
// =============================================

// Dados em memória (localStorage)
let categorias = JSON.parse(localStorage.getItem('almox_categorias') || '[]');
let subcategorias = JSON.parse(localStorage.getItem('almox_subcategorias') || '[]');

// Atributos temporários durante criação
let atributosTemp = [];

document.addEventListener('DOMContentLoaded', () => {
  carregarCategorias();
  carregarSubcategorias();
  setupFormularios();
  setupAtributosInput();
});

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
    });
  }

  // Filtro de subcategorias
  const filtroSubcategorias = document.getElementById('filtroSubcategorias');
  if (filtroSubcategorias) {
    filtroSubcategorias.addEventListener('change', () => {
      carregarSubcategorias(filtroSubcategorias.value);
    });
  }
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
    tag.innerHTML = `${attr} <span class="remover" onclick="removerAtributo(${idx})">×</span>`;
    container.appendChild(tag);
  });

  container.appendChild(input);
}

function removerAtributo(idx) {
  atributosTemp.splice(idx, 1);
  atualizarAtributosVisuais();
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
  const filtroSubcategorias = document.getElementById('filtroSubcategorias');

  if (lista) {
    if (categorias.length === 0) {
      lista.innerHTML = '<div class="vazio">Nenhuma categoria cadastrada</div>';
    } else {
      lista.innerHTML = categorias.map(cat => `
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

  if (total) total.textContent = categorias.length;

  // Atualizar selects
  const options = categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
  
  if (selectParente) {
    selectParente.innerHTML = '<option value="">Selecione uma categoria</option>' + options;
  }
  
  if (filtroSubcategorias) {
    filtroSubcategorias.innerHTML = '<option value="">Todas as categorias</option>' + options;
  }
}

function editarCategoria(id) {
  const cat = categorias.find(c => c.id === id);
  if (!cat) return;

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
      subcategorias[idx].nome = nome;
      subcategorias[idx].unidade = unidade;
      subcategorias[idx].estoqueMinimo = estoqueMinimo;
      subcategorias[idx].atributos = [...atributosTemp];
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
}

function carregarSubcategorias(filtroCategoria = '') {
  const lista = document.getElementById('listaSubcategorias');
  const total = document.getElementById('totalSubcategorias');

  if (!lista) return;

  let subsFiltradas = filtroCategoria 
    ? subcategorias.filter(s => s.categoriaId === filtroCategoria)
    : subcategorias;

  if (subsFiltradas.length === 0) {
    lista.innerHTML = '<div class="vazio">Nenhuma subcategoria cadastrada</div>';
  } else {
    lista.innerHTML = subsFiltradas.map(sub => {
      const categoria = categorias.find(c => c.id === sub.categoriaId);
      return `
        <div class="item-lista subcategoria">
          <div class="info-item">
            <div class="nome-item">${sub.nome}</div>
            <div class="desc-item">${categoria?.nome || 'Categoria removida'}</div>
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
}

function editarSubcategoria(id) {
  const sub = subcategorias.find(s => s.id === id);
  if (!sub) return;

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

