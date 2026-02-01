// ==================== CARREGAR NAVBAR COMPARTILHADA ====================
document.addEventListener('DOMContentLoaded', () => {
  // Aplicar tema salvo imediatamente
  aplicarTemaSalvo();
  
  // Determinar o caminho correto para navbar.html baseado na URL atual
  const currentPath = window.location.pathname;
  let navbarPath = 'navbar.html';
  
  // Se estamos na raiz ou em arquivos sem /html/, ajustar o caminho
  if (!currentPath.includes('/html/')) {
    navbarPath = 'html/navbar.html';
  }
  
  fetch(navbarPath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro ao carregar navbar.html: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      // Verificar se a navbar já existe
      if (!document.querySelector('.navbar')) {
        // Inserir no container ou no início do body
        const navbarContainer = document.getElementById('navbarContainer');
        if (navbarContainer) {
          navbarContainer.innerHTML = html;
        } else {
          document.body.insertAdjacentHTML('afterbegin', html);
        }
        
        // Carregar dados do usuário
        const usuarioLogado = localStorage.getItem('usuario');
        const token = localStorage.getItem('token');
        
        // Atualizar interface de autenticação
        atualizarNavbarAuth(usuarioLogado, token);
        
        // Setup do botão de tema
        setupBotaoTema();
        
        // Marcar a página ativa
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
          document.querySelector('.index-link')?.classList.add('active');
        } else if (currentPage === 'produtos.html') {
          document.querySelector('.produtos-link')?.classList.add('active');
        } else if (currentPage === 'inventario.html') {
          document.querySelector('.inventario-link')?.classList.add('active');
        } else if (currentPage === 'movimentos.html') {
          document.querySelector('.movimentos-link')?.classList.add('active');
        } else if (currentPage === 'cadastro.html') {
          document.querySelector('.cadastro-link')?.classList.add('active');
        } else if (currentPage === 'relatorios.html') {
          document.querySelector('.relatorios-link')?.classList.add('active');
        } else if (currentPage === 'itens.html') {
          document.querySelector('.itens-link')?.classList.add('active');
        }
      }
    })
    .catch(err => console.error('Erro ao carregar navbar:', err));
});

// ==================== TEMA ESCURO/CLARO ====================
function aplicarTemaSalvo() {
  const temaSalvo = localStorage.getItem('almox_tema');
  if (temaSalvo === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function setupBotaoTema() {
  const btnTema = document.getElementById('btnTema');
  const iconeTema = document.getElementById('iconeTema');
  
  if (!btnTema) return;
  
  // Atualizar ícone baseado no tema atual
  atualizarIconeTema();
  
  btnTema.addEventListener('click', () => {
    const temaAtual = document.documentElement.getAttribute('data-theme');
    
    if (temaAtual === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('almox_tema', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('almox_tema', 'dark');
    }
    
    atualizarIconeTema();
  });
}

function atualizarIconeTema() {
  const iconeTema = document.getElementById('iconeTema');
  if (!iconeTema) return;
  
  const temaAtual = document.documentElement.getAttribute('data-theme');
  
  if (temaAtual === 'dark') {
    iconeTema.className = 'bi bi-sun-fill';
  } else {
    iconeTema.className = 'bi bi-moon-fill';
  }
}

// Atualizar interface de autenticação na navbar
function atualizarNavbarAuth(usuario, token) {
  const loginSection = document.getElementById('loginSection');
  const logoutSection = document.getElementById('logoutSection');
  const adminMenu = document.getElementById('adminMenu');
  const usuarioLogadoEl = document.getElementById('usuarioLogado');
  
  // Validar se elementos existem
  if (!loginSection || !logoutSection || !adminMenu || !usuarioLogadoEl) {
    console.error('Elementos da navbar não encontrados. Verifique se navbar.html foi carregado corretamente.');
    return;
  }
  
  const btnLoginToggle = document.getElementById('btnLoginToggle');
  const loginFormSidebar = document.getElementById('loginFormSidebar');
  const btnCancelarLogin = document.getElementById('btnCancelarLogin');
  const loginUsuario = document.getElementById('loginUsuario');
  const loginSenha = document.getElementById('loginSenha');
  
  if (token && usuario) {
    // Usuário logado
    loginSection.style.display = 'none';
    logoutSection.style.display = 'flex';
    adminMenu.style.display = 'flex';
    usuarioLogadoEl.textContent = usuario;
  } else {
    // Usuário não logado
    loginSection.style.display = 'flex';
    logoutSection.style.display = 'none';
    adminMenu.style.display = 'none';
    usuarioLogadoEl.textContent = 'Visitante';
    
    // Configurar botão de login
    if (btnLoginToggle) {
      btnLoginToggle.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormSidebar.style.display = 'flex';
        btnLoginToggle.style.display = 'none';
      });
    }
    
    if (btnCancelarLogin) {
      btnCancelarLogin.addEventListener('click', () => {
        loginFormSidebar.style.display = 'none';
        btnLoginToggle.style.display = 'flex';
        loginUsuario.value = '';
        loginSenha.value = '';
      });
    }
    
    // Formulário de login
    if (loginFormSidebar) {
      loginFormSidebar.addEventListener('submit', async (e) => {
        e.preventDefault();
        await fazerLoginSidebar(loginUsuario.value, loginSenha.value);
      });
    }
  }
}

// Função para fazer login via sidebar
async function fazerLoginSidebar(usuario, senha) {
  const API_URL = `http://${window.location.hostname}:3000/api`;
  
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', usuario);
      localStorage.setItem('perfil', data.perfil || 'usuário');
      
      // Recarregar a página para atualizar interface
      location.reload();
    } else {
      alert('Usuário ou senha incorretos');
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    alert('Erro ao conectar ao servidor');
  }
}

// ==================== LOGOUT ====================
function logout() {
  // Remove apenas dados de autenticação, preserva cadastros
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  localStorage.removeItem('perfil');
  location.reload();
}

