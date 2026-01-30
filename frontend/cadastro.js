const API_URL = `http://${window.location.hostname}:3000/api`;

let token = localStorage.getItem('token');
let categoriasCache = [];
let subcategoriasCache = [];
let tagsCache = [];

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
  const usuarioLogado = localStorage.getItem('usuario');
  if (!usuarioLogado || !token) {
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('usuarioLogado').textContent = usuarioLogado;

  // Carregamos os dados
  carregarDados();

  // Event listeners
  document.getElementById('formCategoria').addEventListener('submit', criarCategoria);
  document.getElementById('formSubcategoria').addEventListener('submit', criarSubcategoria);
  document.getElementById('formTag').addEventListener('submit', criarTag);
});

// ==================== CARREGAR DADOS ====================
async function carregarDados() {
  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Carregar categorias
    const resCat = await fetch(`${API_URL}/categorias`, { headers });
    if (resCat.status === 401) {
      logout();
      return;
    }
    categoriasCache = await resCat.json();

    // Carregar subcategorias
    const resSubcat = await fetch(`${API_URL}/subcategorias`, { headers });
    subcategoriasCache = await resSubcat.json();

    // Carregar tags
    const resTag = await fetch(`${API_URL}/tags`, { headers });
    tagsCache = await resTag.json();

    // Preencher selects
    preencherSelectCategoria();
    renderizarCategorias();

    // Mostrar forms de subcategoria e tag quando houver categorias
    if (categoriasCache.length > 0) {
      document.getElementById('formSubcategoria').style.display = 'block';
    }
    if (subcategoriasCache.length > 0) {
      document.getElementById('formTag').style.display = 'block';
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err);
  }
}

function preencherSelectCategoria() {
  const select = document.getElementById('catParentSub');
  select.innerHTML = '<option value="">Selecione uma categoria...</option>';
  categoriasCache.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.id;
    option.textContent = cat.nome;
    select.appendChild(option);
  });

  // Atualizar subcategorias quando mudar categoria
  select.addEventListener('change', () => {
    const catId = select.value;
    const subcatsDoSelect = document.getElementById('subcatParentTag');
    subcatsDoSelect.innerHTML = '<option value="">Selecione uma subcategoria...</option>';
    
    const subsCat = subcategoriasCache.filter(s => s.categoria_id == catId);
    subsCat.forEach(sub => {
      const option = document.createElement('option');
      option.value = sub.id;
      option.textContent = sub.nome;
      subcatsDoSelect.appendChild(option);
    });
  });
}

// ==================== RENDERIZAR ====================
function renderizarCategorias() {
  const container = document.getElementById('listaCategorias');
  
  if (categoriasCache.length === 0) {
    container.innerHTML = '<p style="color: #999; text-align: center;">Nenhuma categoria cadastrada</p>';
    return;
  }

  container.innerHTML = categoriasCache.map(cat => {
    const subsDaCat = subcategoriasCache.filter(s => s.categoria_id === cat.id);
    return `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="margin: 0; color: #333;">${cat.nome}</h4>
          <button class="btn btn-danger btn-small" onclick="deletarCategoria(${cat.id})">🗑️</button>
        </div>
        <p style="color: #666; font-size: 13px; margin: 5px 0;">${cat.descricao || 'Sem descrição'}</p>
        
        ${subsDaCat.length > 0 ? `
          <div style="margin-top: 10px; padding-left: 10px; border-left: 3px solid #2563eb;">
            <strong style="color: #2563eb; font-size: 12px;">Subcategorias:</strong>
            ${subsDaCat.map(sub => {
              const tagsDaSubcat = tagsCache.filter(t => t.subcategoria_id === sub.id);
              return `
                <div style="margin-top: 8px; padding: 8px; background: white; border-radius: 5px; font-size: 13px;">
                  <div style="display: flex; justify-content: space-between;">
                    <span>${sub.nome}</span>
                    <button class="btn btn-danger btn-small" onclick="deletarSubcategoria(${sub.id})">✕</button>
                  </div>
                  ${tagsDaSubcat.length > 0 ? `
                    <div style="margin-top: 5px; padding-left: 10px; border-left: 2px solid #999;">
                      <small style="color: #666;">Tags: ${tagsDaSubcat.map(t => `<span style="display: inline-block; background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 10px; margin-right: 5px; font-size: 11px;">${t.nome}</span>`).join('')}</small>
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` : '<p style="color: #999; font-size: 12px; margin-top: 10px;">Sem subcategorias</p>'}
      </div>
    `;
  }).join('');
}

// ==================== CRIAR ====================
async function criarCategoria(e) {
  e.preventDefault();

  const nome = document.getElementById('nomeCat').value.trim();
  const descricao = document.getElementById('descCat').value.trim();

  if (!nome) {
    alert('Nome da categoria é obrigatório');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/categorias`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nome, descricao: descricao || null })
    });

    if (response.ok) {
      document.getElementById('formCategoria').reset();
      document.getElementById('formSubcategoria').style.display = 'block';
      carregarDados();
      alert('✅ Categoria criada com sucesso!');
    } else {
      const erro = await response.json();
      alert(`❌ Erro: ${erro.error}`);
    }
  } catch (err) {
    console.error('Erro:', err);
    alert('Erro ao criar categoria');
  }
}

async function criarSubcategoria(e) {
  e.preventDefault();

  const categoria_id = document.getElementById('catParentSub').value;
  const nome = document.getElementById('nomeSubcat').value.trim();
  const descricao = document.getElementById('descSubcat').value.trim();

  if (!categoria_id || !nome) {
    alert('Categoria e nome são obrigatórios');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/subcategorias`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ categoria_id: parseInt(categoria_id), nome, descricao: descricao || null })
    });

    if (response.ok) {
      document.getElementById('formSubcategoria').reset();
      document.getElementById('formTag').style.display = 'block';
      carregarDados();
      alert('✅ Subcategoria criada com sucesso!');
    } else {
      const erro = await response.json();
      alert(`❌ Erro: ${erro.error}`);
    }
  } catch (err) {
    console.error('Erro:', err);
    alert('Erro ao criar subcategoria');
  }
}

async function criarTag(e) {
  e.preventDefault();

  const subcategoria_id = document.getElementById('subcatParentTag').value;
  const nome = document.getElementById('nomeTag').value.trim();
  const descricao = document.getElementById('descTag').value.trim();

  if (!subcategoria_id || !nome) {
    alert('Subcategoria e nome são obrigatórios');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subcategoria_id: parseInt(subcategoria_id), nome, descricao: descricao || null })
    });

    if (response.ok) {
      document.getElementById('formTag').reset();
      carregarDados();
      alert('✅ Tag criada com sucesso!');
    } else {
      const erro = await response.json();
      alert(`❌ Erro: ${erro.error}`);
    }
  } catch (err) {
    console.error('Erro:', err);
    alert('Erro ao criar tag');
  }
}

// ==================== DELETAR ====================
async function deletarCategoria(id) {
  if (!confirm('Tem certeza que deseja deletar essa categoria? Isso deletará todas as subcategorias e tags.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/categorias/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      carregarDados();
      alert('✅ Categoria deletada com sucesso!');
    } else {
      alert('Erro ao deletar categoria');
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

async function deletarSubcategoria(id) {
  if (!confirm('Tem certeza que deseja deletar essa subcategoria? Isso deletará todas as tags.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/subcategorias/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      carregarDados();
      alert('✅ Subcategoria deletada com sucesso!');
    } else {
      alert('Erro ao deletar subcategoria');
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

// ==================== UTILITÁRIOS ====================
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

function irPara(pagina) {
  switch(pagina) {
    case 'inventario':
      window.location.href = 'inventario.html';
      break;
    case 'movimentos':
      window.location.href = 'index.html?section=movimentos';
      break;
    case 'cadastro':
      // Já está aqui
      break;
    case 'relatorios':
      window.location.href = 'index.html?section=relatorios';
      break;
  }
}
