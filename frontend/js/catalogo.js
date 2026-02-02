// =============================================
// CATÁLOGO DE ITENS
// Sistema de Almoxarifado
// =============================================

// Dados
let categorias = JSON.parse(localStorage.getItem('almox_categorias') || '[]');
let subcategorias = JSON.parse(localStorage.getItem('almox_subcategorias') || '[]');
let itens = JSON.parse(localStorage.getItem('almox_itens') || '[]');

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
  carregarResumo();
  carregarFiltros();
  carregarItens();
  setupFiltros();
  
  // Mostrar ações admin se for admin
  const usuarioLogado = JSON.parse(localStorage.getItem('almox_usuario') || '{}');
  const isAdmin = usuarioLogado.papel === 'admin';
  const acoesAdmin = document.getElementById('acoesAdminCatalogo');
  if (acoesAdmin && isAdmin) {
    acoesAdmin.style.display = 'block';
  }
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
          <label class="filtro-attr-titulo">${escapeHtml(attr)}</label>
          <div class="filtro-checkboxes">
            ${valoresUnicos.map(v => `
              <label class="filtro-checkbox">
                <input type="checkbox" class="filtro-attr-check" data-attr="${escapeAttr(attr)}" value="${escapeAttr(v)}">
                <span>${escapeHtml(v)}</span>
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
    // Verificar se é admin
    const perfilUsuario = localStorage.getItem('perfil');
    const isAdmin = perfilUsuario === 'admin';
    
    // Mostrar/ocultar coluna de ações
    const colAcoes = document.getElementById('colAcoesCatalogo');
    if (colAcoes) {
      colAcoes.style.display = isAdmin ? '' : 'none';
    }
    
    container.innerHTML = itensFiltrados.map(item => {
      const statusEstoque = getStatusEstoque(item);
      
      // Montar badges de atributos (escapando HTML)
      const atributosHtml = Object.entries(item.atributos || {}).map(([key, val]) => 
        `<span class="attr-badge">${escapeHtml(val)}</span>`
      ).join('');
      
      // Nome do item: Categoria > Subcategoria
      const nomeItem = `
        <div class="item-nome-completo">
          <span class="item-categoria">${escapeHtml(item.categoriaNome)}</span>
          <i class="bi bi-chevron-right"></i>
          <span class="item-subcategoria">${escapeHtml(item.subcategoriaNome)}</span>
        </div>
        ${item.descricao ? `<div class="item-descricao">${escapeHtml(item.descricao)}</div>` : ''}
      `;
      
      // Ações admin
      const acoesHtml = isAdmin ? `
        <td>
          <div class="acoes-catalogo">
            <button class="btn-editar-item" onclick="editarItem('${escapeAttr(item.id)}')" title="Editar atributos">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-deletar-item" onclick="deletarItem('${escapeAttr(item.id)}')" title="Excluir item">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      ` : '';
      
      return `
        <tr>
          <td class="col-id"><code>${escapeHtml(item.id)}</code></td>
          <td class="col-item">${nomeItem}</td>
          <td class="col-atributos">
            <div class="atributos-inline">${atributosHtml || '-'}</div>
          </td>
          <td class="col-estoque">
            <span class="estoque-valor ${statusEstoque.classe}">${item.estoque}</span>
          </td>
          <td class="col-unidade">${escapeHtml(item.unidade)}</td>
          <td class="col-minimo">${item.estoqueMinimo}</td>
          <td><span class="status-badge ${statusEstoque.classe}">${statusEstoque.texto}</span></td>
          ${acoesHtml}
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
// EDITAR/DELETAR ITENS
// =============================================

function editarItem(itemId) {
  const item = itens.find(i => i.id === itemId);
  if (!item) {
    mostrarMensagem('Item não encontrado', 'erro');
    return;
  }
  
  // Buscar subcategoria para saber os atributos
  const subcategoria = subcategorias.find(s => s.id === item.subcategoriaId);
  const atributosDefinidos = subcategoria?.atributos || [];
  
  // Montar formulário de edição
  let formHtml = `
    <div class="edit-form-grupo">
      <label class="edit-label">ID do Item:</label>
      <input type="text" id="editItemId" value="${escapeAttr(item.id)}" class="edit-input">
      <small class="edit-hint">⚠️ Alterar o ID pode afetar movimentações existentes</small>
    </div>
    <div class="edit-form-grupo">
      <label class="edit-label">Descrição:</label>
      <input type="text" id="editDescricao" value="${escapeAttr(item.descricao || '')}" class="edit-input" placeholder="Descrição adicional...">
    </div>
    <div class="edit-form-grupo">
      <label class="edit-label">Atributos:</label>
  `;
  
  atributosDefinidos.forEach(attr => {
    const valorAtual = item.atributos?.[attr] || '';
    formHtml += `
      <div class="edit-attr-item">
        <span class="edit-attr-nome">${escapeHtml(attr)}:</span>
        <input type="text" id="editAttr_${escapeAttr(attr)}" data-attr="${escapeAttr(attr)}" 
               value="${escapeAttr(valorAtual)}" class="edit-input">
      </div>
    `;
  });
  
  formHtml += '</div>';
  
  // Criar modal
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3><i class="bi bi-pencil"></i> Editar Item</h3>
        <button class="modal-close" onclick="fecharModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="edit-item-nome">${escapeHtml(item.nomeCompleto || item.nome)}</div>
        ${formHtml}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="fecharModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="salvarEdicaoItem('${itemId}')">Salvar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function salvarEdicaoItem(itemId) {
  const itemIdx = itens.findIndex(i => i.id === itemId);
  if (itemIdx === -1) {
    mostrarMensagem('Item não encontrado', 'erro');
    fecharModal();
    return;
  }
  
  // Verificar novo ID
  const novoIdInput = document.getElementById('editItemId');
  const novoId = novoIdInput?.value.trim();
  
  if (!novoId) {
    mostrarMensagem('ID não pode estar vazio', 'erro');
    return;
  }
  
  // Verificar se o novo ID já existe (se mudou)
  if (novoId !== itemId) {
    const idExiste = itens.some(i => i.id === novoId);
    if (idExiste) {
      mostrarMensagem('Este ID já está em uso por outro item', 'erro');
      return;
    }
    
    // Atualizar movimentações que referenciam este item
    let movimentacoes = JSON.parse(localStorage.getItem('almox_movimentacoes') || '[]');
    movimentacoes = movimentacoes.map(mov => {
      if (mov.itemId === itemId) {
        mov.itemId = novoId;
      }
      return mov;
    });
    localStorage.setItem('almox_movimentacoes', JSON.stringify(movimentacoes));
    
    // Atualizar o ID do item
    itens[itemIdx].id = novoId;
  }
  
  // Atualizar descrição
  const descricaoInput = document.getElementById('editDescricao');
  if (descricaoInput) {
    itens[itemIdx].descricao = descricaoInput.value.trim();
  }
  
  // Atualizar atributos
  const inputsAttr = document.querySelectorAll('[id^="editAttr_"]');
  inputsAttr.forEach(input => {
    const attrNome = input.dataset.attr;
    const novoValor = input.value.trim();
    if (attrNome && novoValor) {
      if (!itens[itemIdx].atributos) itens[itemIdx].atributos = {};
      itens[itemIdx].atributos[attrNome] = novoValor;
    }
  });
  
  // Reconstruir nome completo
  const subcategoria = subcategorias.find(s => s.id === itens[itemIdx].subcategoriaId);
  const categoria = categorias.find(c => c.id === subcategoria?.categoriaId);
  
  let nomeCompleto = `${categoria?.nome || ''} - ${subcategoria?.nome || ''}`;
  const atributosArr = Object.values(itens[itemIdx].atributos || {});
  if (atributosArr.length > 0) {
    nomeCompleto += ' - ' + atributosArr.join(' - ');
  }
  itens[itemIdx].nomeCompleto = nomeCompleto;
  itens[itemIdx].nome = nomeCompleto;
  
  // Salvar
  localStorage.setItem('almox_itens', JSON.stringify(itens));
  
  fecharModal();
  carregarItens();
  mostrarMensagem('✅ Item atualizado com sucesso!', 'sucesso');
}

function deletarItem(itemId) {
  const item = itens.find(i => i.id === itemId);
  if (!item) return;
  
  if (!confirm(`Tem certeza que deseja excluir o item?\n\n${item.nomeCompleto || item.nome}\n\nEsta ação não pode ser desfeita.`)) {
    return;
  }
  
  itens = itens.filter(i => i.id !== itemId);
  localStorage.setItem('almox_itens', JSON.stringify(itens));
  
  carregarItens();
  mostrarMensagem('🗑️ Item excluído', 'sucesso');
}

function fecharModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) modal.remove();
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

// =============================================
// REDEFINIR IDs
// =============================================

function redefinirTodosIds() {
  if (!confirm('Isso vai redefinir os IDs de TODOS os itens para o formato AUTO1, AUTO2, etc.\n\nOs históricos de movimentação serão atualizados automaticamente.\n\nDeseja continuar?')) {
    return;
  }
  
  // Carregar dados
  let itens = JSON.parse(localStorage.getItem('almox_itens') || '[]');
  let movimentacoes = JSON.parse(localStorage.getItem('almox_movimentacoes') || '[]');
  
  if (itens.length === 0) {
    mostrarMensagem('Nenhum item para redefinir', 'erro');
    return;
  }
  
  // Criar mapeamento de IDs antigos -> novos
  const mapeamento = {};
  
  // Ordenar itens por data de criação (mais antigo primeiro)
  itens.sort((a, b) => new Date(a.criadoEm || 0) - new Date(b.criadoEm || 0));
  
  // Atribuir novos IDs
  itens.forEach((item, index) => {
    const novoId = 'AUTO' + (index + 1);
    mapeamento[item.id] = novoId;
    item.id = novoId;
  });
  
  // Atualizar movimentações
  movimentacoes.forEach(mov => {
    if (mapeamento[mov.itemId]) {
      mov.itemId = mapeamento[mov.itemId];
    }
  });
  
  // Salvar
  localStorage.setItem('almox_itens', JSON.stringify(itens));
  localStorage.setItem('almox_movimentacoes', JSON.stringify(movimentacoes));
  
  mostrarMensagem(`${itens.length} IDs redefinidos com sucesso!`, 'sucesso');
  
  // Recarregar página
  setTimeout(() => {
    location.reload();
  }, 1500);
}
