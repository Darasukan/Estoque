const API_URL = `http://${window.location.hostname}:3000/api`;

let token = localStorage.getItem('token');
let familiasCache = [];

// ==================== INICIALIZAÃ‡ÃƒO ====================
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Mostrar aviso se nÃ£o estiver logado
    mostrarAvisoCadastroProtegido();
    return;
  }

  carregarFamilias();
  document.getElementById('formFamilia').addEventListener('submit', criarFamilia);
});

function mostrarAvisoCadastroProtegido() {
  // Desabilitar formulÃ¡rio
  const form = document.getElementById('formFamilia');
  if (form) {
    form.style.opacity = '0.5';
    form.style.pointerEvents = 'none';
  }
  
  // Mostrar aviso
  const container = document.querySelector('main') || document.body;
  const aviso = document.createElement('div');
  aviso.className = 'alert alert-warning';
  aviso.innerHTML = '<p><strong>Cadastro Protegido</strong></p><p>VocÃª precisa estar logado para criar grupos e subfamilias. FaÃ§a login na barra lateral.</p>';
  aviso.style.cssText = 'padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin: 15px; color: #856404;';
  container.insertBefore(aviso, container.firstChild);
}

// ==================== CARREGAR FAMÃLIAS ====================
async function carregarFamilias() {
  try {
    const headers = { 'Authorization': `Bearer ${token}` };

    // Carregar categorias
    const resCat = await fetch(`${API_URL}/categorias`, { headers });
    if (resCat.status === 401) {
      logout();
      return;
    }
    const categorias = await resCat.json();

    // Carregar subcategorias
    const resSubcat = await fetch(`${API_URL}/subcategorias`, { headers });
    const subcategorias = await resSubcat.json();

    // Carregar tags
    const resTag = await fetch(`${API_URL}/tags`, { headers });
    const tags = await resTag.json();

    // Montar estrutura de famÃ­lias
    familiasCache = categorias.map(cat => ({
      ...cat,
      subcategorias: subcategorias
        .filter(s => s.categoria_id === cat.id)
        .map(sub => ({
          ...sub,
          tags: tags.filter(t => t.subcategoria_id === sub.id)
        }))
    }));

    renderizarFamilias();
  } catch (err) {
    console.error('Erro:', err);
  }
}

// ==================== RENDERIZAR FAMÃLIAS ====================
function renderizarFamilias() {
  const container = document.getElementById('listaFamilias');
  
  if (familiasCache.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">Nenhuma famÃ­lia cadastrada</p>';
    return;
  }

  container.innerHTML = familiasCache.map(familia => {
    return familia.subcategorias.map(sub => {
      const tagsNomes = sub.tags.map(t => t.nome).join(', ');
      const displayTags = tagsNomes ? `(${tagsNomes})` : '(Sem tags)';
      
      return `
        <div style="
          background: white;
          padding: 15px;
          margin-bottom: 12px;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div>
            <h4 style="margin: 0 0 5px 0; color: #333; font-size: 14px;">
              <strong>${familia.nome}</strong> - ${sub.nome} <span style="color: #666; font-size: 12px;">${displayTags}</span>
            </h4>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-primary btn-small" onclick="editarFamilia(${familia.id}, ${sub.id})" style="font-size: 12px;">
              âœï¸ Editar
            </button>
            <button class="btn btn-danger btn-small" onclick="deletarFamilia(${familia.id}, ${sub.id})" style="font-size: 12px;">
              ðŸ—‘ï¸ Excluir
            </button>
          </div>
        </div>
      `;
    }).join('');
  }).join('');
}

// ==================== CRIAR FAMÃLIA ====================
async function criarFamilia(e) {
  e.preventDefault();

  const grupo = document.getElementById('grupo').value.trim();
  const subfamilia = document.getElementById('subfamilia').value.trim();
  const camposObrigatorios = document.getElementById('camposObrigatorios').value.trim();
  const camposExtras = document.getElementById('camposExtras').value.trim();

  if (!grupo || !subfamilia) {
    alert('âŒ Grupo Principal e SubfamÃ­lia sÃ£o obrigatÃ³rios!');
    return;
  }

  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 1. Criar/encontrar categoria
    let categoriaId = null;
    const catExistente = familiasCache.find(f => f.nome === grupo);
    
    if (catExistente) {
      categoriaId = catExistente.id;
    } else {
      const resCat = await fetch(`${API_URL}/categorias`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nome: grupo })
      });
      const dataCat = await resCat.json();
      categoriaId = dataCat.id;
    }

    // 2. Criar subcategoria
    const resSubcat = await fetch(`${API_URL}/subcategorias`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        categoria_id: categoriaId,
        nome: subfamilia
      })
    });
    const dataSubcat = await resSubcat.json();
    const subcategoriaId = dataSubcat.id;

    // 3. Criar tags obrigatÃ³rias
    if (camposObrigatorios) {
      const tags = camposObrigatorios.split(',').map(t => t.trim()).filter(t => t);
      for (const tag of tags) {
        await fetch(`${API_URL}/tags`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            subcategoria_id: subcategoriaId,
            nome: tag
          })
        });
      }
    }

    // 4. Criar tags extras
    if (camposExtras) {
      const tags = camposExtras.split(',').map(t => t.trim()).filter(t => t);
      for (const tag of tags) {
        await fetch(`${API_URL}/tags`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            subcategoria_id: subcategoriaId,
            nome: tag
          })
        });
      }
    }

    document.getElementById('formFamilia').reset();
    await carregarFamilias();
    alert('âœ… FamÃ­lia criada com sucesso!');
  } catch (err) {
    console.error('Erro:', err);
    alert('âŒ Erro ao criar famÃ­lia');
  }
}

// ==================== EDITAR/DELETAR ====================
function editarFamilia(catId, subcatId) {
  alert('ðŸ”§ FunÃ§Ã£o de ediÃ§Ã£o em desenvolvimento');
}

async function deletarFamilia(catId, subcatId) {
  if (!confirm('Tem certeza que deseja deletar essa famÃ­lia e todas as suas tags?')) {
    return;
  }

  try {
    const headers = { 'Authorization': `Bearer ${token}` };
    
    await fetch(`${API_URL}/subcategorias/${subcatId}`, {
      method: 'DELETE',
      headers
    });

    await carregarFamilias();
    alert('âœ… FamÃ­lia deletada com sucesso!');
  } catch (err) {
    console.error('Erro:', err);
    alert('âŒ Erro ao deletar famÃ­lia');
  }
}

// ==================== UTILITÃRIOS ====================
function logout() {
  localStorage.clear();
  location.reload();
}

