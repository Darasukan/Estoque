// ==================== CARREGAR SIDEBAR COMPARTILHADA ====================
document.addEventListener('DOMContentLoaded', () => {
  fetch('sidebar.html')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro ao carregar sidebar.html: ${response.status}`);
      }
      return response.text();
    })
    .then(html => {
      // Encontrar ou criar container para a sidebar
      const container = document.querySelector('.container');
      if (container && !document.querySelector('.sidebar')) {
        container.insertAdjacentHTML('afterbegin', html);
        
        // Carregar dados do usuario
        const usuarioLogado = localStorage.getItem('usuario');
        const token = localStorage.getItem('token');
        
        // Atualizar interface de autenticacao
        atualizarSidebarAuth(usuarioLogado, token);
        
        // Marcar a pagina ativa
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (currentPage === 'index.html' || currentPage === '') {
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
        }
      }
    })
    .catch(err => console.error('Erro ao carregar sidebar:', err));
});

// Atualizar interface de autenticacao na sidebar
function atualizarSidebarAuth(usuario, token) {
  const loginSection = document.getElementById('loginSection');
  const logoutSection = document.getElementById('logoutSection');
  const adminMenu = document.getElementById('adminMenu');
  const usuarioLogadoEl = document.getElementById('usuarioLogado');
  
  // Validar se elementos existem
  if (!loginSection || !logoutSection || !adminMenu || !usuarioLogadoEl) {
    console.error('Elementos da sidebar nao encontrados. Verifique se sidebar.html foi carregado corretamente.');
    return;
  }
  
  const btnLoginToggle = document.getElementById('btnLoginToggle');
  const loginFormSidebar = document.getElementById('loginFormSidebar');
  const btnCancelarLogin = document.getElementById('btnCancelarLogin');
  const loginUsuario = document.getElementById('loginUsuario');
  const loginSenha = document.getElementById('loginSenha');
  
  if (token && usuario) {
    // Usuario logado
    loginSection.style.display = 'none';
    logoutSection.style.display = 'block';
    adminMenu.style.display = 'block';
    usuarioLogadoEl.textContent = usuario;
  } else {
    // Usuario nao logado
    loginSection.style.display = 'block';
    logoutSection.style.display = 'none';
    adminMenu.style.display = 'none';
    usuarioLogadoEl.textContent = 'Visitante';
    
    // Configurar botao de login
    if (btnLoginToggle) {
      btnLoginToggle.addEventListener('click', (e) => {
        e.preventDefault();
        loginFormSidebar.style.display = loginFormSidebar.style.display === 'none' ? 'block' : 'none';
      });
    }
    
    if (btnCancelarLogin) {
      btnCancelarLogin.addEventListener('click', () => {
        loginFormSidebar.style.display = 'none';
        loginUsuario.value = '';
        loginSenha.value = '';
      });
    }
    
    // Formulario de login
    if (loginFormSidebar) {
      loginFormSidebar.addEventListener('submit', async (e) => {
        e.preventDefault();
        await fazerLoginSidebar(loginUsuario.value, loginSenha.value);
      });
    }
  }
}

// Funcao para fazer login via sidebar
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
      localStorage.setItem('perfil', data.perfil || 'usuario');
      
      // Recarregar a pagina para atualizar interface
      location.reload();
    } else {
      alert('Usuario ou senha incorretos');
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    alert('Erro ao conectar ao servidor');
  }
}

// ==================== LOGOUT ====================
function logout() {
  localStorage.clear();
  location.reload();
}

