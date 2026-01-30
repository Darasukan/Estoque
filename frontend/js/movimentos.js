const API_URL = `http://${window.location.hostname}:3000/api`;

let token = localStorage.getItem('token');
let movimentos = [];

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Mostrar aviso de proteÃ§Ã£o
    mostrarAvisoProtecaoMovimentos();
    return;
  }

  document.getElementById('formMovimento').addEventListener('submit', registrarMovimento);
  carregarMovimentos();
});

function mostrarAvisoProtecaoMovimentos() {
  const container = document.querySelector('main') || document.body;
  const aviso = document.createElement('div');
  aviso.innerHTML = '<p><strong>âš ï¸ Recurso Protegido</strong></p><p>VocÃª precisa estar logado para registrar movimentaÃ§Ãµes. FaÃ§a login na barra lateral.</p>';
  aviso.style.cssText = 'padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin: 15px; color: #856404;';
  
  // Ocultar formulÃ¡rio
  const form = document.getElementById('formMovimento');
  const historico = document.getElementById('historicoMovimentos');
  if (form) form.style.display = 'none';
  if (historico) historico.style.display = 'none';
  
  container.insertBefore(aviso, container.firstChild);
}

async function registrarMovimento(e) {
  e.preventDefault();

  const tipoMovimento = document.getElementById('tipoMovimento').value;
  const skuMovimento = document.getElementById('skuMovimento').value;
  const quantidadeMovimento = parseInt(document.getElementById('quantidadeMovimento').value);
  const motivoMovimento = document.getElementById('motivoMovimento').value;

  if (!tipoMovimento || !skuMovimento || !quantidadeMovimento) {
    alert('âŒ Preencha os campos obrigatÃ³rios!');
    return;
  }

  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // TODO: Implementar endpoint de movimentos no backend
    alert('ðŸ”§ FunÃ§Ã£o de movimentaÃ§Ãµes em desenvolvimento no backend');
    
  } catch (err) {
    console.error('Erro:', err);
    alert('âŒ Erro ao registrar movimentaÃ§Ã£o');
  }
}

async function carregarMovimentos() {
  try {
    // TODO: Implementar endpoint de movimentos no backend
    document.getElementById('listaMovimentos').innerHTML = 
      '<p style="color: #999; text-align: center; padding: 20px;">Movimentos em desenvolvimento</p>';
  } catch (err) {
    console.error('Erro:', err);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = 'html/login.html';
}

