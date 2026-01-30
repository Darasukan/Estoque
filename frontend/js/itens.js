// =============================================
// CRIAR NOVOS ITENS
// Sistema de Almoxarifado
// =============================================

// Dados
let categorias = JSON.parse(localStorage.getItem('almox_categorias') || '[]');
let subcategorias = JSON.parse(localStorage.getItem('almox_subcategorias') || '[]');
let itens = JSON.parse(localStorage.getItem('almox_itens') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  carregarCategorias();
  setupCascata();
  setupFormulario();
});

// =============================================
// SETUP
// =============================================

function carregarCategorias() {
  const select = document.getElementById('categoriaItem');
  if (!select) return;

  select.innerHTML = '<option value="">Selecione a categoria</option>' +
    categorias.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

function setupCascata() {
  const selectCat = document.getElementById('categoriaItem');
  const selectSub = document.getElementById('subcategoriaItem');

  if (!selectCat || !selectSub) return;

  // Ao mudar categoria
  selectCat.addEventListener('change', () => {
    const catId = selectCat.value;
    
    // Popular subcategorias
    const subsFiltradas = catId ? subcategorias.filter(s => s.categoriaId === catId) : [];
    
    selectSub.innerHTML = '<option value="">Selecione a subcategoria</option>' +
      subsFiltradas.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
    selectSub.disabled = !catId;

    // Limpar info e campos
    esconderInfoSubcategoria();
    esconderCamposAtributos();
    esconderPreview();
  });

  // Ao mudar subcategoria
  selectSub.addEventListener('change', () => {
    const subId = selectSub.value;
    
    if (subId) {
      mostrarInfoSubcategoria(subId);
      gerarCamposAtributos(subId);
    } else {
      esconderInfoSubcategoria();
      esconderCamposAtributos();
    }
    
    atualizarPreview();
  });
}

function setupFormulario() {
  const form = document.getElementById('formNovoItem');
  if (!form) return;

  form.addEventListener('submit', criarItem);
  form.addEventListener('reset', () => {
    esconderInfoSubcategoria();
    esconderCamposAtributos();
    esconderPreview();
    document.getElementById('subcategoriaItem').disabled = true;
  });

  // Atualizar preview ao digitar descrição
  document.getElementById('descricaoItem')?.addEventListener('input', atualizarPreview);
}

// =============================================
// INFO SUBCATEGORIA
// =============================================

function mostrarInfoSubcategoria(subId) {
  const sub = subcategorias.find(s => s.id === subId);
  if (!sub) return;

  const container = document.getElementById('infoSubcategoria');
  if (!container) return;

  document.getElementById('badgeUnidade').textContent = sub.unidade;
  document.getElementById('badgeMinimo').textContent = `Mín: ${sub.estoqueMinimo}`;
  document.getElementById('badgeAtributos').textContent = `${sub.atributos?.length || 0} atributo(s)`;

  container.style.display = 'block';
}

function esconderInfoSubcategoria() {
  const container = document.getElementById('infoSubcategoria');
  if (container) container.style.display = 'none';
}

// =============================================
// CAMPOS DINÂMICOS DE ATRIBUTOS
// =============================================

function gerarCamposAtributos(subId) {
  const sub = subcategorias.find(s => s.id === subId);
  const container = document.getElementById('camposAtributos');
  const lista = document.getElementById('listaCamposAtributos');

  if (!sub || !container || !lista) return;

  if (!sub.atributos || sub.atributos.length === 0) {
    lista.innerHTML = '<div class="vazio">Esta subcategoria não possui atributos definidos</div>';
    container.style.display = 'block';
    return;
  }

  lista.innerHTML = sub.atributos.map((attr, idx) => `
    <div class="campo-atributo">
      <label for="atributo_${idx}">${attr} *</label>
      <input type="text" 
             id="atributo_${idx}" 
             data-atributo="${attr}"
             required
             placeholder="Valor de ${attr}"
             oninput="atualizarPreview()">
    </div>
  `).join('');

  container.style.display = 'block';
}

function esconderCamposAtributos() {
  const container = document.getElementById('camposAtributos');
  if (container) container.style.display = 'none';
}

function coletarValoresAtributos() {
  const inputs = document.querySelectorAll('#listaCamposAtributos input[data-atributo]');
  const valores = {};
  
  inputs.forEach(input => {
    const nome = input.dataset.atributo;
    const valor = input.value.trim();
    if (nome && valor) {
      valores[nome] = valor;
    }
  });

  return valores;
}

// =============================================
// PREVIEW
// =============================================

function atualizarPreview() {
  const container = document.getElementById('previewItem');
  const nomeEl = document.getElementById('nomeCompletoItem');
  
  if (!container || !nomeEl) return;

  const catId = document.getElementById('categoriaItem')?.value;
  const subId = document.getElementById('subcategoriaItem')?.value;
  const descricao = document.getElementById('descricaoItem')?.value?.trim();

  if (!catId || !subId) {
    container.style.display = 'none';
    return;
  }

  const categoria = categorias.find(c => c.id === catId);
  const subcategoria = subcategorias.find(s => s.id === subId);

  if (!categoria || !subcategoria) {
    container.style.display = 'none';
    return;
  }

  // Montar nome
  let partes = [categoria.nome, subcategoria.nome];
  
  // Adicionar valores dos atributos com nome do atributo
  const valores = coletarValoresAtributos();
  Object.entries(valores).forEach(([nome, valor]) => {
    if (valor) partes.push(`${nome}: ${valor}`);
  });

  // Adicionar descrição se houver
  if (descricao) {
    partes.push(descricao);
  }

  nomeEl.textContent = partes.join(' - ');
  container.style.display = 'block';
}

function esconderPreview() {
  const container = document.getElementById('previewItem');
  if (container) container.style.display = 'none';
}

// =============================================
// CRIAR ITEM
// =============================================

function criarItem(e) {
  e.preventDefault();

  const catId = document.getElementById('categoriaItem').value;
  const subId = document.getElementById('subcategoriaItem').value;
  const descricao = document.getElementById('descricaoItem').value.trim();

  if (!catId || !subId) {
    mostrarMensagem('Selecione categoria e subcategoria', 'erro');
    return;
  }

  const categoria = categorias.find(c => c.id === catId);
  const subcategoria = subcategorias.find(s => s.id === subId);

  if (!categoria || !subcategoria) {
    mostrarMensagem('Categoria ou subcategoria inválida', 'erro');
    return;
  }

  // Coletar valores dos atributos
  const atributosValores = coletarValoresAtributos();

  // Verificar se todos os atributos foram preenchidos
  if (subcategoria.atributos && subcategoria.atributos.length > 0) {
    const faltando = subcategoria.atributos.filter(a => !atributosValores[a]);
    if (faltando.length > 0) {
      mostrarMensagem(`Preencha: ${faltando.join(', ')}`, 'erro');
      return;
    }
  }

  // Montar nome completo com nome dos atributos
  let partes = [categoria.nome, subcategoria.nome];
  Object.entries(atributosValores).forEach(([nome, valor]) => {
    if (valor) partes.push(`${nome}: ${valor}`);
  });
  if (descricao) partes.push(descricao);
  const nomeCompleto = partes.join(' - ');

  // Verificar duplicata
  const duplicata = itens.find(i => i.nomeCompleto.toLowerCase() === nomeCompleto.toLowerCase());
  if (duplicata) {
    mostrarMensagem('Já existe um item com esse nome', 'erro');
    return;
  }

  // Criar item
  const novoItem = {
    id: 'item_' + Date.now(),
    categoriaId: catId,
    categoriaNome: categoria.nome,
    subcategoriaId: subId,
    subcategoriaNome: subcategoria.nome,
    atributos: atributosValores,
    descricao,
    nomeCompleto,
    unidade: subcategoria.unidade,
    estoqueMinimo: subcategoria.estoqueMinimo,
    estoque: 0,
    criadoEm: new Date().toISOString()
  };

  itens.push(novoItem);
  localStorage.setItem('almox_itens', JSON.stringify(itens));

  mostrarMensagem(`Item "${nomeCompleto}" criado com sucesso!`, 'sucesso');
  e.target.reset();
}

// =============================================
// UTILIDADES
// =============================================

function mostrarMensagem(texto, tipo) {
  const el = document.getElementById('mensagem');
  if (!el) return;

  el.textContent = texto;
  el.className = `mensagem ${tipo}`;
  el.style.display = 'block';

  setTimeout(() => {
    el.style.display = 'none';
  }, 4000);
}
