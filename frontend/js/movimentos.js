const API_URL = `http://${window.location.hostname}:3000/api`;

let token = localStorage.getItem('token');
let movimentos = [];

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Mostrar aviso de proteção
    mostrarAvisoProtecaoMovimentos();
    return;
  }

  document.getElementById('formMovimento').addEventListener('submit', registrarMovimento);
  carregarMovimentos();
});

function mostrarAvisoProtecaoMovimentos() {
  const container = document.querySelector('main') || document.body;
  const aviso = document.createElement('div');
  aviso.innerHTML = '<p><strong>⚠️ Recurso Protegido</strong></p><p>Você precisa estar logado para registrar movimentações. Faça login na barra lateral.</p>';
  aviso.style.cssText = 'padding: 15px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; margin: 15px; color: #856404;';
  
  // Ocultar formulário
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
    alert('❌ Preencha os campos obrigatórios!');
    return;
  }

  try {
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // TODO: Implementar endpoint de movimentos no backend
    alert('🔧 Função de movimentações em desenvolvimento no backend');
    
  } catch (err) {
    console.error('Erro:', err);
    alert('❌ Erro ao registrar movimentação');
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
  location.reload();
}

