// =============================================
// MOVIMENTAÇÕES DE ESTOQUE
// Sistema de Almoxarifado
// =============================================

// Dados do localStorage
let categorias = [];
let subcategorias = [];
let itens = [];
let movimentacoes = [];

// Item atualmente selecionado
let itemSelecionadoEntrada = null;
let itemSelecionadoSaida = null;

// Função para escapar HTML (evita quebra com aspas, <, >, etc)
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Função para escapar atributos HTML (para value="...")
function escapeAttr(text) {
  if (!text) return '';
  return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  setupTabs();
  setupFormularios();
  setupCascatas();
  setupMascaraMoeda();
  setupBuscaPorId();
  carregarHistorico();
  setDataHoje();
});

// =============================================
// CARREGAR DADOS DO LOCALSTORAGE
// =============================================

function carregarDados() {
  categorias = JSON.parse(localStorage.getItem('almox_categorias') || '[]');
  subcategorias = JSON.parse(localStorage.getItem('almox_subcategorias') || '[]');
  itens = JSON.parse(localStorage.getItem('almox_itens') || '[]');
  movimentacoes = JSON.parse(localStorage.getItem('almox_movimentacoes') || '[]');
  
  // Popular selects de categoria
  popularCategorias('categoriaEntrada');
  popularCategorias('categoriaSaida');
  popularCategorias('filtroCategoriaHist');
}

function popularCategorias(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecione</option>';
  
  categorias.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.nome;
    select.appendChild(option);
  });
}

// =============================================
// SETUP
// =============================================

function setDataHoje() {
  const hoje = new Date().toISOString().split('T')[0];
  const dataEntrada = document.getElementById('dataEntrada');
  const dataSaida = document.getElementById('dataSaida');
  
  if (dataEntrada) dataEntrada.value = hoje;
  if (dataSaida) dataSaida.value = hoje;
}

function gerarIdsAutomaticos() {
  const timestamp = Date.now();
  const idEntrada = document.getElementById('idEntrada');
  const idSaida = document.getElementById('idSaida');
  
  if (idEntrada) idEntrada.value = 'ENT_' + timestamp;
  if (idSaida) idSaida.value = 'SAI_' + timestamp;
}

// =============================================
// BUSCA POR ID DO ITEM
// =============================================

function setupBuscaPorId() {
  const idEntrada = document.getElementById('idEntrada');
  const idSaida = document.getElementById('idSaida');
  
  // Remover tabindex negativo para permitir digitação
  if (idEntrada) {
    idEntrada.removeAttribute('tabindex');
    idEntrada.placeholder = 'Digite ID ou selecione abaixo';
    idEntrada.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        buscarItemPorId('Entrada', idEntrada.value.trim());
      }
    });
    idEntrada.addEventListener('blur', () => {
      if (idEntrada.value.trim()) {
        buscarItemPorId('Entrada', idEntrada.value.trim());
      }
    });
  }
  
  if (idSaida) {
    idSaida.removeAttribute('tabindex');
    idSaida.placeholder = 'Digite ID ou selecione abaixo';
    idSaida.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        buscarItemPorId('Saida', idSaida.value.trim());
      }
    });
    idSaida.addEventListener('blur', () => {
      if (idSaida.value.trim()) {
        buscarItemPorId('Saida', idSaida.value.trim());
      }
    });
  }
}

function buscarItemPorId(tipo, idBuscado) {
  if (!idBuscado) return;
  
  // Buscar item pelo ID (case insensitive)
  const item = itens.find(i => i.id.toLowerCase() === idBuscado.toLowerCase());
  
  if (!item) {
    mostrarMensagem(`Item com ID "${idBuscado}" não encontrado`, 'erro');
    return;
  }
  
  // Encontrar categoria e subcategoria do item
  const subcategoria = subcategorias.find(s => s.id === item.subcategoriaId);
  if (!subcategoria) {
    mostrarMensagem('Subcategoria do item não encontrada', 'erro');
    return;
  }
  
  const categoria = categorias.find(c => c.id === subcategoria.categoriaId);
  if (!categoria) {
    mostrarMensagem('Categoria do item não encontrada', 'erro');
    return;
  }
  
  // Preencher os selects automaticamente
  const selectCategoria = document.getElementById(`categoria${tipo}`);
  const selectSubcategoria = document.getElementById(`subcategoria${tipo}`);
  const selectItem = document.getElementById(`item${tipo}`);
  
  // Selecionar categoria
  selectCategoria.value = categoria.id;
  popularSubcategorias(`subcategoria${tipo}`, categoria.id);
  
  // Selecionar subcategoria
  selectSubcategoria.value = subcategoria.id;
  montarFiltroAtributos(tipo, subcategoria.id);
  popularItensFiltrados(tipo, subcategoria.id);
  
  // Selecionar item
  selectItem.value = item.id;
  selecionarItem(tipo, item.id);
  
  mostrarMensagem(`Item encontrado: ${item.nomeCompleto || item.nome}`, 'sucesso');
}

// =============================================
// MÁSCARA DE MOEDA BRASILEIRA
// =============================================

function setupMascaraMoeda() {
  const inputValor = document.getElementById('valorUnitarioEntrada');
  if (!inputValor) return;
  
  // Mudar tipo para text para permitir formatação
  inputValor.type = 'text';
  inputValor.placeholder = 'R$ 0,00';
  
  inputValor.addEventListener('input', (e) => {
    let valor = e.target.value;
    
    // Remove R$ e espaços, mantém números e vírgula
    valor = valor.replace(/R\$\s?/g, '').trim();
    
    // Permite apenas números e uma vírgula
    valor = valor.replace(/[^\d,]/g, '');
    
    // Garante apenas uma vírgula
    const partes = valor.split(',');
    if (partes.length > 2) {
      valor = partes[0] + ',' + partes.slice(1).join('');
    }
    
    // Limita decimais a 2 dígitos
    if (partes.length === 2 && partes[1].length > 2) {
      valor = partes[0] + ',' + partes[1].substring(0, 2);
    }
    
    // Se vazio, limpa
    if (!valor) {
      e.target.value = '';
      e.target.dataset.valorNumerico = '';
      return;
    }
    
    // Mostra com R$
    e.target.value = 'R$ ' + valor;
    
    // Guarda valor numérico (troca vírgula por ponto)
    const valorNumerico = parseFloat(valor.replace(',', '.')) || 0;
    e.target.dataset.valorNumerico = valorNumerico.toString();
  });
  
  // Formata ao sair do campo
  inputValor.addEventListener('blur', (e) => {
    const valorNum = parseFloat(e.target.dataset.valorNumerico);
    if (!isNaN(valorNum) && valorNum > 0) {
      e.target.value = valorNum.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    }
  });
}

// Função para obter valor numérico do campo de moeda
function getValorMoeda(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return null;
  return parseFloat(input.dataset.valorNumerico) || null;
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remover ativo de todos
      tabs.forEach(t => t.classList.remove('ativo'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('ativo'));
      
      // Adicionar ativo no clicado
      tab.classList.add('ativo');
      const tabId = `tab-${tab.dataset.tab}`;
      document.getElementById(tabId)?.classList.add('ativo');
    });
  });
}

function setupFormularios() {
  // Form Entrada
  const formEntrada = document.getElementById('formEntrada');
  if (formEntrada) {
    formEntrada.addEventListener('submit', registrarEntrada);
    formEntrada.addEventListener('reset', () => {
      itemSelecionadoEntrada = null;
      document.getElementById('itemSelecionadoEntrada').style.display = 'none';
      document.getElementById('filtroAtributosEntrada').style.display = 'none';
      document.getElementById('subcategoriaEntrada').disabled = true;
      document.getElementById('itemEntrada').disabled = true;
      setDataHoje();
    });
  }
  
  // Form Saída
  const formSaida = document.getElementById('formSaida');
  if (formSaida) {
    formSaida.addEventListener('submit', registrarSaida);
    formSaida.addEventListener('reset', () => {
      itemSelecionadoSaida = null;
      document.getElementById('itemSelecionadoSaida').style.display = 'none';
      document.getElementById('filtroAtributosSaida').style.display = 'none';
      document.getElementById('subcategoriaSaida').disabled = true;
      document.getElementById('itemSaida').disabled = true;
      setDataHoje();
    });
  }
  
  // Filtros do histórico
  document.getElementById('filtroTipo')?.addEventListener('change', carregarHistorico);
  document.getElementById('filtroCategoriaHist')?.addEventListener('change', (e) => {
    popularSubcategoriasHist(e.target.value);
    carregarHistorico();
  });
  document.getElementById('filtroSubcategoriaHist')?.addEventListener('change', (e) => {
    atualizarFiltroAtributosHist(e.target.value);
    carregarHistorico();
  });
  document.getElementById('filtroDataInicio')?.addEventListener('change', carregarHistorico);
  document.getElementById('filtroDataFim')?.addEventListener('change', carregarHistorico);
  
  // Filtro de busca com debounce
  const filtroBusca = document.getElementById('filtroBuscaHist');
  if (filtroBusca) {
    let timeout;
    filtroBusca.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(carregarHistorico, 300);
    });
  }
  
  // Botão limpar filtros
  document.getElementById('btnLimparFiltrosHist')?.addEventListener('click', limparFiltrosHistorico);
  
  // Checkboxes de exibição de colunas - carregar preferências salvas
  carregarPreferenciasColunasHist();
  
  document.getElementById('mostrarIdMov')?.addEventListener('change', () => {
    salvarPreferenciasColunasHist();
    atualizarColunasVisiveis();
  });
  document.getElementById('mostrarIdItem')?.addEventListener('change', () => {
    salvarPreferenciasColunasHist();
    atualizarColunasVisiveis();
  });
  
  // Aplicar visibilidade inicial
  atualizarColunasVisiveis();
}

function carregarPreferenciasColunasHist() {
  const prefs = JSON.parse(localStorage.getItem('almox_prefs_hist_colunas') || '{}');
  
  const checkIdMov = document.getElementById('mostrarIdMov');
  const checkIdItem = document.getElementById('mostrarIdItem');
  
  if (checkIdMov && prefs.mostrarIdMov !== undefined) {
    checkIdMov.checked = prefs.mostrarIdMov;
  }
  if (checkIdItem && prefs.mostrarIdItem !== undefined) {
    checkIdItem.checked = prefs.mostrarIdItem;
  }
}

function salvarPreferenciasColunasHist() {
  const prefs = {
    mostrarIdMov: document.getElementById('mostrarIdMov')?.checked ?? true,
    mostrarIdItem: document.getElementById('mostrarIdItem')?.checked ?? true
  };
  localStorage.setItem('almox_prefs_hist_colunas', JSON.stringify(prefs));
}

function atualizarColunasVisiveis() {
  const mostrarIdMov = document.getElementById('mostrarIdMov')?.checked ?? true;
  const mostrarIdItem = document.getElementById('mostrarIdItem')?.checked ?? true;
  
  // Colunas do header
  document.querySelectorAll('.col-id-mov').forEach(el => {
    el.style.display = mostrarIdMov ? '' : 'none';
  });
  document.querySelectorAll('.col-id-item').forEach(el => {
    el.style.display = mostrarIdItem ? '' : 'none';
  });
  
  // Colunas das linhas (índice 1 = ID Mov, índice 2 = ID Item)
  document.querySelectorAll('#tabelaHistorico tbody tr').forEach(tr => {
    const cells = tr.querySelectorAll('td');
    if (cells.length > 2) {
      if (cells[1]) cells[1].style.display = mostrarIdMov ? '' : 'none';
      if (cells[2]) cells[2].style.display = mostrarIdItem ? '' : 'none';
    }
  });
}

function popularSubcategoriasHist(categoriaId) {
  const select = document.getElementById('filtroSubcategoriaHist');
  if (!select) return;
  
  // Ocultar filtros de atributos
  const attrContainer = document.getElementById('filtroAtributosContainerHist');
  if (attrContainer) attrContainer.style.display = 'none';
  
  if (!categoriaId) {
    select.innerHTML = '<option value="">Todas</option>';
    select.disabled = true;
    return;
  }
  
  // Só mostrar subcategorias que têm movimentações
  const idsItensComMov = [...new Set(movimentacoes.map(m => m.itemId))];
  const subsComMov = subcategorias.filter(s => {
    if (s.categoriaId !== categoriaId) return false;
    // Verificar se tem algum item dessa subcategoria com movimentação
    return itens.some(i => i.subcategoriaId === s.id && idsItensComMov.includes(i.id));
  });
  
  select.innerHTML = '<option value="">Todas</option>' + 
    subsComMov.map(s => `<option value="${s.id}">${s.nome}</option>`).join('');
  select.disabled = subsComMov.length === 0;
}

function atualizarFiltroAtributosHist(subId) {
  const container = document.getElementById('filtroAtributosContainerHist');
  const atributosDiv = document.getElementById('filtroAtributosHist');
  
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
  
  // Só considerar itens que têm movimentações
  const idsItensComMov = [...new Set(movimentacoes.map(m => m.itemId))];
  const itensSubcatComMov = itens.filter(i => i.subcategoriaId === subId && idsItensComMov.includes(i.id));
  
  let html = '';
  subcategoria.atributos.forEach(attr => {
    // Coletar valores únicos desse atributo (só de itens com movimentações)
    const valoresUnicos = [...new Set(
      itensSubcatComMov
        .map(i => i.atributos?.[attr])
        .filter(v => v)
    )].sort();
    
    if (valoresUnicos.length > 0) {
      const checkboxesHtml = valoresUnicos.map(v => 
        `<label class="filtro-checkbox"><input type="checkbox" class="filtro-attr-check-hist" data-attr="${escapeAttr(attr)}" value="${escapeAttr(v)}"><span>${escapeHtml(v)}</span></label>`
      ).join('');
      
      html += `<div class="filtro-attr-grupo"><div class="filtro-attr-titulo">${escapeHtml(attr)}</div><div class="filtro-attr-opcoes">${checkboxesHtml}</div></div>`;
    }
  });
  
  if (html) {
    atributosDiv.innerHTML = html;
    container.style.display = 'block';
    
    // Adicionar listeners nos checkboxes
    atributosDiv.querySelectorAll('.filtro-attr-check-hist').forEach(check => {
      check.addEventListener('change', carregarHistorico);
    });
  } else {
    container.style.display = 'none';
  }
}

function limparFiltrosHistorico() {
  const filtroTipo = document.getElementById('filtroTipo');
  const filtroCategoriaHist = document.getElementById('filtroCategoriaHist');
  const filtroSubcategoriaHist = document.getElementById('filtroSubcategoriaHist');
  const filtroBuscaHist = document.getElementById('filtroBuscaHist');
  const filtroDataInicio = document.getElementById('filtroDataInicio');
  const filtroDataFim = document.getElementById('filtroDataFim');
  const filtroAtributosContainerHist = document.getElementById('filtroAtributosContainerHist');
  
  if (filtroTipo) filtroTipo.value = '';
  if (filtroCategoriaHist) filtroCategoriaHist.value = '';
  if (filtroSubcategoriaHist) {
    filtroSubcategoriaHist.value = '';
    filtroSubcategoriaHist.innerHTML = '<option value="">Todas</option>';
    filtroSubcategoriaHist.disabled = true;
  }
  if (filtroAtributosContainerHist) filtroAtributosContainerHist.style.display = 'none';
  if (filtroBuscaHist) filtroBuscaHist.value = '';
  if (filtroDataInicio) filtroDataInicio.value = '';
  if (filtroDataFim) filtroDataFim.value = '';
  
  carregarHistorico();
}

function setupCascatas() {
  // Cascata Entrada
  document.getElementById('categoriaEntrada')?.addEventListener('change', (e) => {
    popularSubcategorias('subcategoriaEntrada', e.target.value);
    document.getElementById('itemEntrada').innerHTML = '<option value="">Primeiro selecione subcategoria</option>';
    document.getElementById('itemEntrada').disabled = true;
    document.getElementById('itemSelecionadoEntrada').style.display = 'none';
    document.getElementById('filtroAtributosEntrada').style.display = 'none';
  });
  
  document.getElementById('subcategoriaEntrada')?.addEventListener('change', (e) => {
    const subId = e.target.value;
    if (subId) {
      montarFiltroAtributos('Entrada', subId);
      popularItensFiltrados('Entrada', subId);
    } else {
      document.getElementById('filtroAtributosEntrada').style.display = 'none';
      document.getElementById('itemEntrada').innerHTML = '<option value="">Primeiro selecione subcategoria</option>';
      document.getElementById('itemEntrada').disabled = true;
    }
    document.getElementById('itemSelecionadoEntrada').style.display = 'none';
  });
  
  document.getElementById('itemEntrada')?.addEventListener('change', (e) => {
    selecionarItem('Entrada', e.target.value);
  });
  
  // Cascata Saída
  document.getElementById('categoriaSaida')?.addEventListener('change', (e) => {
    popularSubcategorias('subcategoriaSaida', e.target.value);
    document.getElementById('itemSaida').innerHTML = '<option value="">Primeiro selecione subcategoria</option>';
    document.getElementById('itemSaida').disabled = true;
    document.getElementById('itemSelecionadoSaida').style.display = 'none';
    document.getElementById('filtroAtributosSaida').style.display = 'none';
  });
  
  document.getElementById('subcategoriaSaida')?.addEventListener('change', (e) => {
    const subId = e.target.value;
    if (subId) {
      montarFiltroAtributos('Saida', subId);
      popularItensFiltrados('Saida', subId);
    } else {
      document.getElementById('filtroAtributosSaida').style.display = 'none';
      document.getElementById('itemSaida').innerHTML = '<option value="">Primeiro selecione subcategoria</option>';
      document.getElementById('itemSaida').disabled = true;
    }
    document.getElementById('itemSelecionadoSaida').style.display = 'none';
  });
  
  document.getElementById('itemSaida')?.addEventListener('change', (e) => {
    selecionarItem('Saida', e.target.value);
  });
  
  // Botões limpar filtros
  document.getElementById('btnLimparFiltrosEntrada')?.addEventListener('click', () => {
    limparFiltrosAtributos('Entrada');
  });
  
  document.getElementById('btnLimparFiltrosSaida')?.addEventListener('click', () => {
    limparFiltrosAtributos('Saida');
  });
}

// =============================================
// CASCATAS
// =============================================

function popularSubcategorias(selectId, categoriaId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecione</option>';
  
  if (!categoriaId) {
    select.disabled = true;
    return;
  }
  
  const subsFiltradas = subcategorias.filter(s => s.categoriaId === categoriaId);
  
  subsFiltradas.forEach(sub => {
    const option = document.createElement('option');
    option.value = sub.id;
    option.textContent = sub.nome;
    select.appendChild(option);
  });
  
  select.disabled = subsFiltradas.length === 0;
}

function popularItens(selectId, subcategoriaId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  select.innerHTML = '<option value="">Selecione</option>';
  
  if (!subcategoriaId) {
    select.disabled = true;
    opcoesOriginais[selectId] = [];
    return;
  }
  
  const itensFiltrados = itens.filter(i => i.subcategoriaId === subcategoriaId);
  
  itensFiltrados.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.nomeCompleto || item.nome} (Estoque: ${item.estoque || 0})`;
    select.appendChild(option);
  });
  
  select.disabled = itensFiltrados.length === 0;
  
  // Guardar opções para filtro de busca
  guardarOpcoes(selectId);
}

function selecionarItem(tipo, itemId) {
  const item = itens.find(i => i.id === itemId);
  const container = document.getElementById(`itemSelecionado${tipo}`);
  const campoId = document.getElementById(`id${tipo}`);
  
  if (!item || !container) {
    if (container) container.style.display = 'none';
    if (campoId) campoId.value = '';
    if (tipo === 'Entrada') itemSelecionadoEntrada = null;
    else itemSelecionadoSaida = null;
    return;
  }
  
  // Preencher campo ID com o ID do item
  if (campoId) campoId.value = item.id;
  
  // Buscar subcategoria para pegar a unidade
  const subcategoria = subcategorias.find(s => s.id === item.subcategoriaId);
  
  if (tipo === 'Entrada') {
    itemSelecionadoEntrada = item;
  } else {
    itemSelecionadoSaida = item;
  }
  
  document.getElementById(`nomeItem${tipo}`).textContent = item.nomeCompleto || item.nome;
  document.getElementById(`estoqueItem${tipo}`).textContent = item.estoque || 0;
  document.getElementById(`unidadeItem${tipo}`).textContent = item.unidade || subcategoria?.unidade || 'UN';
  
  if (tipo === 'Entrada') {
    document.getElementById(`minimoItem${tipo}`).textContent = subcategoria?.estoqueMinimo || 0;
  }
  
  container.style.display = 'block';
}

// =============================================
// REGISTRAR MOVIMENTAÇÕES
// =============================================

function registrarEntrada(e) {
  e.preventDefault();
  
  if (!itemSelecionadoEntrada) {
    mostrarMensagem('Selecione um item', 'erro');
    return;
  }
  
  const quantidade = parseInt(document.getElementById('qtdEntrada').value);
  if (!quantidade || quantidade <= 0) {
    mostrarMensagem('Quantidade inválida', 'erro');
    return;
  }
  
  const movimentacao = {
    id: document.getElementById('idEntrada').value || 'ENT_' + Date.now(),
    tipo: 'entrada',
    itemId: itemSelecionadoEntrada.id,
    itemNome: itemSelecionadoEntrada.nomeCompleto || itemSelecionadoEntrada.nome,
    quantidade,
    valorUnitario: getValorMoeda('valorUnitarioEntrada'),
    notaFiscal: document.getElementById('nfEntrada').value || null,
    fornecedor: document.getElementById('fornecedorEntrada').value || null,
    observacoes: document.getElementById('obsEntrada').value || null,
    operador: document.getElementById('operadorEntrada').value,
    data: document.getElementById('dataEntrada').value,
    criadoEm: new Date().toISOString()
  };
  
  // Atualizar estoque do item
  const itemIdx = itens.findIndex(i => i.id === itemSelecionadoEntrada.id);
  if (itemIdx !== -1) {
    itens[itemIdx].estoque = (itens[itemIdx].estoque || 0) + quantidade;
    localStorage.setItem('almox_itens', JSON.stringify(itens));
  }
  
  // Salvar movimentação
  movimentacoes.push(movimentacao);
  localStorage.setItem('almox_movimentacoes', JSON.stringify(movimentacoes));
  
  mostrarMensagem(`Entrada registrada! +${quantidade} unidades`, 'sucesso');
  e.target.reset();
  carregarHistorico();
}

function registrarSaida(e) {
  e.preventDefault();
  
  if (!itemSelecionadoSaida) {
    mostrarMensagem('Selecione um item', 'erro');
    return;
  }
  
  const quantidade = parseInt(document.getElementById('qtdSaida').value);
  if (!quantidade || quantidade <= 0) {
    mostrarMensagem('Quantidade inválida', 'erro');
    return;
  }
  
  const estoqueAtual = itemSelecionadoSaida.estoque || 0;
  if (quantidade > estoqueAtual) {
    mostrarMensagem(`Estoque insuficiente! Disponível: ${estoqueAtual}`, 'erro');
    return;
  }
  
  const movimentacao = {
    id: document.getElementById('idSaida').value || 'SAI_' + Date.now(),
    tipo: 'saida',
    itemId: itemSelecionadoSaida.id,
    itemNome: itemSelecionadoSaida.nomeCompleto || itemSelecionadoSaida.nome,
    quantidade,
    quemRetirou: document.getElementById('quemRetirouSaida').value,
    localAplicacao: document.getElementById('localAplicacaoSaida').value || null,
    observacoes: document.getElementById('obsSaida').value || null,
    operador: document.getElementById('operadorSaida').value,
    data: document.getElementById('dataSaida').value,
    criadoEm: new Date().toISOString()
  };
  
  // Atualizar estoque do item
  const itemIdx = itens.findIndex(i => i.id === itemSelecionadoSaida.id);
  if (itemIdx !== -1) {
    itens[itemIdx].estoque = (itens[itemIdx].estoque || 0) - quantidade;
    localStorage.setItem('almox_itens', JSON.stringify(itens));
  }
  
  // Salvar movimentação
  movimentacoes.push(movimentacao);
  localStorage.setItem('almox_movimentacoes', JSON.stringify(movimentacoes));
  
  mostrarMensagem(`Saída registrada! -${quantidade} unidades`, 'sucesso');
  e.target.reset();
  carregarHistorico();
}

// =============================================
// HISTÓRICO
// =============================================

function carregarHistorico() {
  const tbody = document.querySelector('#tabelaHistorico tbody');
  if (!tbody) return;
  
  // Verificar se é admin
  const perfilUsuario = localStorage.getItem('perfil');
  const isAdmin = perfilUsuario === 'admin';
  
  // Mostrar/ocultar coluna de ações
  const colAcoes = document.getElementById('colAcoes');
  if (colAcoes) {
    colAcoes.style.display = isAdmin ? '' : 'none';
  }
  
  let movsFiltradas = [...movimentacoes];
  
  // Aplicar filtros
  const filtroTipo = document.getElementById('filtroTipo')?.value;
  const filtroCategoria = document.getElementById('filtroCategoriaHist')?.value;
  const filtroSubcategoria = document.getElementById('filtroSubcategoriaHist')?.value;
  const filtroDataInicio = document.getElementById('filtroDataInicio')?.value;
  const filtroDataFim = document.getElementById('filtroDataFim')?.value;
  const filtroBusca = document.getElementById('filtroBuscaHist')?.value?.toLowerCase().trim();
  
  if (filtroTipo) {
    movsFiltradas = movsFiltradas.filter(m => m.tipo === filtroTipo);
  }
  
  if (filtroSubcategoria) {
    // Filtrar por subcategoria específica
    let itensSub = itens.filter(i => i.subcategoriaId === filtroSubcategoria);
    
    // Aplicar filtros de atributos
    const attrChecks = document.querySelectorAll('.filtro-attr-check-hist:checked');
    if (attrChecks.length > 0) {
      // Agrupar por atributo
      const filtrosAttr = {};
      attrChecks.forEach(check => {
        const attr = check.dataset.attr;
        const valor = check.value;
        if (!filtrosAttr[attr]) filtrosAttr[attr] = [];
        filtrosAttr[attr].push(valor);
      });
      
      // Filtrar itens que tenham pelo menos um dos valores para cada atributo
      itensSub = itensSub.filter(item => {
        return Object.entries(filtrosAttr).every(([attr, valores]) => {
          const valorItem = item.atributos?.[attr];
          return valorItem && valores.includes(valorItem);
        });
      });
    }
    
    const idsItensSub = itensSub.map(i => i.id);
    movsFiltradas = movsFiltradas.filter(m => idsItensSub.includes(m.itemId));
  } else if (filtroCategoria) {
    // Filtrar por categoria (via subcategoria do item)
    const subsCategoria = subcategorias.filter(s => s.categoriaId === filtroCategoria).map(s => s.id);
    const itensCategoria = itens.filter(i => subsCategoria.includes(i.subcategoriaId)).map(i => i.id);
    movsFiltradas = movsFiltradas.filter(m => itensCategoria.includes(m.itemId));
  }
  
  if (filtroDataInicio) {
    movsFiltradas = movsFiltradas.filter(m => m.data >= filtroDataInicio);
  }
  
  if (filtroDataFim) {
    movsFiltradas = movsFiltradas.filter(m => m.data <= filtroDataFim);
  }
  
  // Filtro de busca (por ID da movimentação, ID do item, nome do item, operador)
  if (filtroBusca) {
    movsFiltradas = movsFiltradas.filter(m => {
      const idMov = (m.id || '').toLowerCase();
      const idItem = (m.itemId || '').toLowerCase();
      const nomeItem = (m.itemNome || '').toLowerCase();
      const operador = (m.operador || '').toLowerCase();
      const fornecedor = (m.fornecedor || '').toLowerCase();
      const quemRetirou = (m.quemRetirou || '').toLowerCase();
      return idMov.includes(filtroBusca) || idItem.includes(filtroBusca) || nomeItem.includes(filtroBusca) ||
             operador.includes(filtroBusca) || fornecedor.includes(filtroBusca) || quemRetirou.includes(filtroBusca);
    });
  }
  
  // Ordenar por data (mais recente primeiro)
  movsFiltradas.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  
  const colspan = isAdmin ? 13 : 12;
  
  if (movsFiltradas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="vazio">Nenhuma movimentação encontrada</td></tr>`;
    return;
  }
  
  tbody.innerHTML = movsFiltradas.map(mov => {
    const tipoClass = mov.tipo === 'entrada' ? 'badge-entrada' : 'badge-saida';
    const tipoIcon = mov.tipo === 'entrada' ? '<i class="bi bi-box-arrow-in-down"></i>' : '<i class="bi bi-box-arrow-up"></i>';
    const dataFormatada = formatarData(mov.data);
    
    // Buscar categoria do item
    const item = itens.find(i => i.id === mov.itemId);
    const sub = item ? subcategorias.find(s => s.id === item.subcategoriaId) : null;
    const cat = sub ? categorias.find(c => c.id === sub.categoriaId) : null;
    const categoriaNome = cat ? cat.nome : '-';
    
    // Nome do item (sem categoria, só subcategoria + atributos)
    const itemNomeLimpo = mov.itemNome || '-';
    
    // Colunas específicas por tipo
    const fornecedorHtml = mov.tipo === 'entrada' ? escapeHtml(mov.fornecedor || '-') : '-';
    const nfHtml = mov.tipo === 'entrada' ? escapeHtml(mov.notaFiscal || '-') : '-';
    const retiradoPorHtml = mov.tipo === 'saida' ? escapeHtml(mov.quemRetirou || '-') : '-';
    
    // Coluna de observações
    const obsHtml = mov.observacoes || '-';
    
    // Ações admin
    const acoesHtml = isAdmin ? `
      <td>
        <div class="acoes-admin">
          <button class="btn-acao btn-editar-mov" onclick="editarMovimentacao('${escapeAttr(mov.id)}')" title="Editar"><i class="bi bi-pencil"></i></button>
          <button class="btn-acao btn-deletar-mov" onclick="deletarMovimentacao('${escapeAttr(mov.id)}')" title="Excluir"><i class="bi bi-trash"></i></button>
        </div>
      </td>
    ` : '';
    
    return `
      <tr>
        <td>${dataFormatada}</td>
        <td class="col-id-mov"><code>${escapeHtml(mov.id)}</code></td>
        <td class="col-id-item"><code>${escapeHtml(mov.itemId || '-')}</code></td>
        <td><span class="badge ${tipoClass}">${tipoIcon} ${mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
        <td>${escapeHtml(categoriaNome)}</td>
        <td>${escapeHtml(itemNomeLimpo)}</td>
        <td>${escapeHtml(obsHtml)}</td>
        <td><strong>${mov.tipo === 'entrada' ? '+' : '-'}${mov.quantidade}</strong></td>
        <td>${escapeHtml(mov.operador || '-')}</td>
        <td>${fornecedorHtml}</td>
        <td>${nfHtml}</td>
        <td>${retiradoPorHtml}</td>
        ${acoesHtml}
      </tr>
    `;
  }).join('');
  
  // Atualizar contador
  const contador = document.getElementById('contadorMovimentacoes');
  if (contador) {
    const total = movsFiltradas.length;
    const entradas = movsFiltradas.filter(m => m.tipo === 'entrada').length;
    const saidas = movsFiltradas.filter(m => m.tipo === 'saida').length;
    contador.textContent = `${total} movimentação${total !== 1 ? 'ões' : ''} (${entradas} entrada${entradas !== 1 ? 's' : ''}, ${saidas} saída${saidas !== 1 ? 's' : ''})`;
  }
  
  // Aplicar visibilidade das colunas
  atualizarColunasVisiveis();
}

function formatarData(dataStr) {
  if (!dataStr) return '-';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

// =============================================
// EDITAR/DELETAR MOVIMENTAÇÕES (ADMIN)
// =============================================

function editarMovimentacao(movId) {
  const mov = movimentacoes.find(m => m.id === movId);
  if (!mov) return;
  
  const novaQtd = prompt(`Editar quantidade da movimentação ${movId}:\n\nQuantidade atual: ${mov.quantidade}\n\nDigite a nova quantidade:`, mov.quantidade);
  
  if (novaQtd === null) return;
  
  const qtdNova = parseInt(novaQtd);
  if (isNaN(qtdNova) || qtdNova <= 0) {
    mostrarMensagem('Quantidade inválida', 'erro');
    return;
  }
  
  const diferenca = qtdNova - mov.quantidade;
  
  // Atualizar estoque do item
  const itemIdx = itens.findIndex(i => i.id === mov.itemId);
  if (itemIdx !== -1) {
    if (mov.tipo === 'entrada') {
      itens[itemIdx].estoque = (itens[itemIdx].estoque || 0) + diferenca;
    } else {
      itens[itemIdx].estoque = (itens[itemIdx].estoque || 0) - diferenca;
    }
    localStorage.setItem('almox_itens', JSON.stringify(itens));
  }
  
  // Atualizar movimentação
  const movIdx = movimentacoes.findIndex(m => m.id === movId);
  if (movIdx !== -1) {
    movimentacoes[movIdx].quantidade = qtdNova;
    localStorage.setItem('almox_movimentacoes', JSON.stringify(movimentacoes));
  }
  
  mostrarMensagem('Movimentação atualizada!', 'sucesso');
  carregarDados();
  carregarHistorico();
}

function deletarMovimentacao(movId) {
  const mov = movimentacoes.find(m => m.id === movId);
  if (!mov) return;
  
  const confirmar = confirm(`Excluir movimentação ${movId}?\n\nTipo: ${mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}\nItem: ${mov.itemNome}\nQuantidade: ${mov.quantidade}\n\nATENÇÃO: O estoque será ajustado automaticamente.`);
  
  if (!confirmar) return;
  
  // Reverter estoque do item
  const itemIdx = itens.findIndex(i => i.id === mov.itemId);
  if (itemIdx !== -1) {
    if (mov.tipo === 'entrada') {
      itens[itemIdx].estoque = (itens[itemIdx].estoque || 0) - mov.quantidade;
    } else {
      itens[itemIdx].estoque = (itens[itemIdx].estoque || 0) + mov.quantidade;
    }
    localStorage.setItem('almox_itens', JSON.stringify(itens));
  }
  
  // Remover movimentação
  movimentacoes = movimentacoes.filter(m => m.id !== movId);
  localStorage.setItem('almox_movimentacoes', JSON.stringify(movimentacoes));
  
  mostrarMensagem('Movimentação excluída!', 'sucesso');
  carregarDados();
  carregarHistorico();
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

// =============================================
// BUSCA/FILTRO DE ITENS
// =============================================

// Guarda todas as opções originais do select
const opcoesOriginais = {};

function setupBuscaItem(inputId, selectId) {
  const input = document.getElementById(inputId);
  const select = document.getElementById(selectId);
  
  if (!input || !select) return;
  
  // Quando o input receber texto, filtra as opções
  input.addEventListener('input', () => {
    const termo = input.value.toLowerCase().trim();
    filtrarOpcoes(selectId, termo);
  });
  
  // Limpar busca quando o select mudar
  select.addEventListener('change', () => {
    input.value = '';
  });
}

function guardarOpcoes(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  // Guarda todas as opções (exceto a primeira "Selecione...")
  opcoesOriginais[selectId] = Array.from(select.options).slice(1).map(opt => ({
    value: opt.value,
    text: opt.textContent
  }));
}

function filtrarOpcoes(selectId, termo) {
  const select = document.getElementById(selectId);
  if (!select || !opcoesOriginais[selectId]) return;
  
  const opcoes = opcoesOriginais[selectId];
  const valorAtual = select.value;
  
  // Limpa select mantendo primeira opção
  select.innerHTML = '<option value="">Selecione o item</option>';
  
  // Filtra e adiciona opções que contém o termo
  opcoes.forEach(opt => {
    if (!termo || opt.text.toLowerCase().includes(termo)) {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.text;
      if (opt.value === valorAtual) option.selected = true;
      select.appendChild(option);
    }
  });
  
  // Atualiza contador no placeholder
  const qtdFiltrada = select.options.length - 1;
  const qtdTotal = opcoes.length;
  if (termo && qtdFiltrada !== qtdTotal) {
    select.options[0].textContent = `${qtdFiltrada} de ${qtdTotal} itens`;
  }
}

// =============================================
// FILTRO DE ATRIBUTOS (estilo catálogo)
// =============================================

// Guarda subcategoria atual para cada tipo
const subcategoriaSelecionada = { Entrada: null, Saida: null };

function montarFiltroAtributos(tipo, subcategoriaId) {
  const container = document.getElementById(`filtroAtributos${tipo}`);
  const listaDiv = document.getElementById(`listaFiltros${tipo}`);
  
  if (!container || !listaDiv) return;
  
  subcategoriaSelecionada[tipo] = subcategoriaId;
  
  // Buscar subcategoria para pegar os atributos definidos
  const subcategoria = subcategorias.find(s => s.id === subcategoriaId);
  
  if (!subcategoria || !subcategoria.atributos || subcategoria.atributos.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  // Buscar itens dessa subcategoria
  const itensSub = itens.filter(i => i.subcategoriaId === subcategoriaId);
  
  if (itensSub.length === 0) {
    container.style.display = 'none';
    return;
  }
  
  // Montar HTML dos filtros
  let html = '';
  
  subcategoria.atributos.forEach(attrNome => {
    // Coletar valores únicos desse atributo
    const valores = [...new Set(
      itensSub
        .map(i => i.atributos?.[attrNome])
        .filter(v => v)
    )].sort();
    
    if (valores.length === 0) return;
    
    html += `
      <div class="filtro-atributo-grupo">
        <h5>${escapeHtml(attrNome)}</h5>
        <div class="filtro-atributo-opcoes">
          ${valores.map(val => `
            <label class="filtro-checkbox-mov">
              <input type="checkbox" class="filtro-attr-check-${tipo}" data-attr="${escapeAttr(attrNome)}" value="${escapeAttr(val)}">
              ${escapeHtml(val)}
            </label>
          `).join('')}
        </div>
      </div>
    `;
  });
  
  if (html) {
    listaDiv.innerHTML = html;
    container.style.display = 'block';
    
    // Adicionar listeners nos checkboxes
    listaDiv.querySelectorAll(`.filtro-attr-check-${tipo}`).forEach(check => {
      check.addEventListener('change', () => {
        popularItensFiltrados(tipo, subcategoriaId);
      });
    });
  } else {
    container.style.display = 'none';
  }
}

function popularItensFiltrados(tipo, subcategoriaId) {
  const selectId = `item${tipo}`;
  const select = document.getElementById(selectId);
  const contadorEl = document.getElementById(`contadorItens${tipo}`);
  
  if (!select) return;
  
  // Buscar itens dessa subcategoria
  let itensFiltrados = itens.filter(i => i.subcategoriaId === subcategoriaId);
  const totalItens = itensFiltrados.length;
  
  // Aplicar filtros de atributos
  const checkboxes = document.querySelectorAll(`.filtro-attr-check-${tipo}:checked`);
  
  if (checkboxes.length > 0) {
    // Agrupar por atributo
    const filtrosAgrupados = {};
    checkboxes.forEach(cb => {
      const attr = cb.dataset.attr;
      if (!filtrosAgrupados[attr]) filtrosAgrupados[attr] = [];
      filtrosAgrupados[attr].push(cb.value);
    });
    
    // Para cada atributo com filtros, o item deve ter UM dos valores selecionados
    Object.entries(filtrosAgrupados).forEach(([attr, valores]) => {
      itensFiltrados = itensFiltrados.filter(item => {
        const valorItem = item.atributos?.[attr];
        return valores.includes(valorItem);
      });
    });
  }
  
  // Popular select
  select.innerHTML = '<option value="">Selecione o item</option>';
  
  itensFiltrados.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = `${item.nomeCompleto || item.nome} (Estoque: ${item.estoque || 0})`;
    select.appendChild(option);
  });
  
  select.disabled = itensFiltrados.length === 0;
  
  // Atualizar contador
  if (contadorEl) {
    contadorEl.textContent = `${itensFiltrados.length} de ${totalItens} itens`;
  }
}

function limparFiltrosAtributos(tipo) {
  const checkboxes = document.querySelectorAll(`.filtro-attr-check-${tipo}:checked`);
  checkboxes.forEach(cb => cb.checked = false);
  
  const subId = subcategoriaSelecionada[tipo];
  if (subId) {
    popularItensFiltrados(tipo, subId);
  }
}
