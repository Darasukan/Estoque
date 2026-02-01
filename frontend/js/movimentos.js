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

document.addEventListener('DOMContentLoaded', () => {
  carregarDados();
  setupTabs();
  setupFormularios();
  setupCascatas();
  setupMascaraMoeda();
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
      document.getElementById('subcategoriaEntrada').disabled = true;
      document.getElementById('itemEntrada').disabled = true;
      document.getElementById('buscaItemEntrada').value = '';
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
      document.getElementById('subcategoriaSaida').disabled = true;
      document.getElementById('itemSaida').disabled = true;
      document.getElementById('buscaItemSaida').value = '';
      setDataHoje();
    });
  }
  
  // Setup filtros de busca de item
  setupBuscaItem('buscaItemEntrada', 'itemEntrada');
  setupBuscaItem('buscaItemSaida', 'itemSaida');
  
  // Filtros do histórico
  document.getElementById('filtroTipo')?.addEventListener('change', carregarHistorico);
  document.getElementById('filtroCategoriaHist')?.addEventListener('change', carregarHistorico);
  document.getElementById('filtroDataInicio')?.addEventListener('change', carregarHistorico);
  document.getElementById('filtroDataFim')?.addEventListener('change', carregarHistorico);
}

function setupCascatas() {
  // Cascata Entrada
  document.getElementById('categoriaEntrada')?.addEventListener('change', (e) => {
    popularSubcategorias('subcategoriaEntrada', e.target.value);
    document.getElementById('itemEntrada').innerHTML = '<option value="">Primeiro selecione subcategoria</option>';
    document.getElementById('itemEntrada').disabled = true;
    document.getElementById('itemSelecionadoEntrada').style.display = 'none';
  });
  
  document.getElementById('subcategoriaEntrada')?.addEventListener('change', (e) => {
    popularItens('itemEntrada', e.target.value);
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
  });
  
  document.getElementById('subcategoriaSaida')?.addEventListener('change', (e) => {
    popularItens('itemSaida', e.target.value);
    document.getElementById('itemSelecionadoSaida').style.display = 'none';
  });
  
  document.getElementById('itemSaida')?.addEventListener('change', (e) => {
    selecionarItem('Saida', e.target.value);
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
  
  if (!item || !container) {
    if (container) container.style.display = 'none';
    if (tipo === 'Entrada') itemSelecionadoEntrada = null;
    else itemSelecionadoSaida = null;
    return;
  }
  
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
  
  mostrarMensagem(`✅ Entrada registrada! +${quantidade} unidades`, 'sucesso');
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
  
  mostrarMensagem(`✅ Saída registrada! -${quantidade} unidades`, 'sucesso');
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
  const filtroDataInicio = document.getElementById('filtroDataInicio')?.value;
  const filtroDataFim = document.getElementById('filtroDataFim')?.value;
  
  if (filtroTipo) {
    movsFiltradas = movsFiltradas.filter(m => m.tipo === filtroTipo);
  }
  
  if (filtroCategoria) {
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
  
  // Ordenar por data (mais recente primeiro)
  movsFiltradas.sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));
  
  const colspan = isAdmin ? 9 : 8;
  
  if (movsFiltradas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${colspan}" class="vazio">Nenhuma movimentação encontrada</td></tr>`;
    return;
  }
  
  tbody.innerHTML = movsFiltradas.map(mov => {
    const tipoClass = mov.tipo === 'entrada' ? 'badge-entrada' : 'badge-saida';
    const tipoIcon = mov.tipo === 'entrada' ? '📥' : '📤';
    const dataFormatada = formatarData(mov.data);
    const detalhes = mov.tipo === 'entrada' 
      ? (mov.fornecedor || mov.notaFiscal || '-')
      : (mov.quemRetirou || '-');
    
    // Coluna de observações
    const obsHtml = mov.observacoes || '-';
    
    // Ações admin
    const acoesHtml = isAdmin ? `
      <td>
        <div class="acoes-admin">
          <button class="btn-acao btn-editar-mov" onclick="editarMovimentacao('${mov.id}')" title="Editar">✏️</button>
          <button class="btn-acao btn-deletar-mov" onclick="deletarMovimentacao('${mov.id}')" title="Excluir">🗑️</button>
        </div>
      </td>
    ` : '';
    
    return `
      <tr>
        <td>${dataFormatada}</td>
        <td>${mov.id}</td>
        <td><span class="badge ${tipoClass}">${tipoIcon} ${mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
        <td>${mov.itemNome}</td>
        <td>${obsHtml}</td>
        <td><strong>${mov.tipo === 'entrada' ? '+' : '-'}${mov.quantidade}</strong></td>
        <td>${mov.operador || '-'}</td>
        <td>${detalhes}</td>
        ${acoesHtml}
      </tr>
    `;
  }).join('');
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
  
  const confirmar = confirm(`Excluir movimentação ${movId}?\n\nTipo: ${mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}\nItem: ${mov.itemNome}\nQuantidade: ${mov.quantidade}\n\n⚠️ O estoque será ajustado automaticamente.`);
  
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
