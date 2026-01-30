// Dashboard - Painel do Almoxarifado
document.addEventListener("DOMContentLoaded", () => {
  carregarDashboard();
});

function carregarDashboard() {
  // Carregar dados do localStorage
  const categorias = JSON.parse(localStorage.getItem("almox_categorias") || "[]");
  const subcategorias = JSON.parse(localStorage.getItem("almox_subcategorias") || "[]");
  const itens = JSON.parse(localStorage.getItem("almox_itens") || "[]");
  const movimentacoes = JSON.parse(localStorage.getItem("almox_movimentacoes") || "[]");

  // Estatísticas
  const totalItens = itens.length;
  const quantidadeTotal = itens.reduce((sum, item) => sum + (item.estoque || 0), 0);
  
  // Materiais críticos (abaixo do mínimo)
  const criticos = itens.filter(item => (item.estoque || 0) < (item.estoqueMinimo || 0));
  
  // Requisições hoje
  const hoje = new Date().toISOString().split("T")[0];
  const requisicoesHoje = movimentacoes.filter(m => 
    m.tipo === "saida" && m.data && m.data.startsWith(hoje)
  );

  // Atualizar cards
  const elTotal = document.getElementById("totalProdutos");
  const elQtd = document.getElementById("quantidadeTotal");
  const elCriticos = document.getElementById("produtosBaixoEstoque");
  const elReq = document.getElementById("requisicoesDia");

  if (elTotal) elTotal.textContent = totalItens;
  if (elQtd) elQtd.textContent = quantidadeTotal;
  if (elCriticos) elCriticos.textContent = criticos.length;
  if (elReq) elReq.textContent = requisicoesHoje.length;

  // Lista de materiais críticos
  const listaCriticos = document.getElementById("listaBaixoEstoque");
  if (listaCriticos) {
    if (criticos.length === 0) {
      listaCriticos.innerHTML = "<li class=\"vazio-lista\"><i class=\"bi bi-check-circle\"></i> Nenhum material crítico</li>";
    } else {
      listaCriticos.innerHTML = criticos.slice(0, 5).map(item => {
        const subcat = subcategorias.find(s => s.id === item.subcategoriaId);
        return "<li><span class=\"nome\">" + (item.nomeCompleto || "Item") + "</span><span class=\"qtd alerta-baixo\">" + (item.estoque || 0) + " / " + (item.estoqueMinimo || 0) + "</span></li>";
      }).join("");
    }
  }

  // Últimas requisições (saídas)
  const listaReq = document.getElementById("listaRequisicoes");
  if (listaReq) {
    const ultimasSaidas = movimentacoes
      .filter(m => m.tipo === "saida")
      .sort((a, b) => new Date(b.data) - new Date(a.data))
      .slice(0, 5);

    if (ultimasSaidas.length === 0) {
      listaReq.innerHTML = "<li class=\"vazio-lista\"><i class=\"bi bi-inbox\"></i> Nenhuma requisição registrada</li>";
    } else {
      listaReq.innerHTML = ultimasSaidas.map(mov => {
        const item = itens.find(i => i.id === mov.itemId);
        const dataFormatada = mov.data ? new Date(mov.data).toLocaleDateString("pt-BR") : "-";
        return "<li><span class=\"nome\">" + (item ? item.nomeCompleto : "Item removido") + "</span><span class=\"qtd\">" + mov.quantidade + " un - " + dataFormatada + "</span></li>";
      }).join("");
    }
  }

  // Grupos de materiais (categorias)
  const listaFamilias = document.getElementById("listaFamilias");
  if (listaFamilias) {
    if (categorias.length === 0) {
      listaFamilias.innerHTML = "<li class=\"vazio-lista\"><i class=\"bi bi-folder\"></i> Nenhuma categoria cadastrada</li>";
    } else {
      listaFamilias.innerHTML = categorias.map(cat => {
        const qtdItens = itens.filter(i => {
          const subcat = subcategorias.find(s => s.id === i.subcategoriaId);
          return subcat && subcat.categoriaId === cat.id;
        }).length;
        return "<li><span class=\"nome\">" + cat.nome + "</span><span class=\"qtd\">" + qtdItens + " itens</span></li>";
      }).join("");
    }
  }
}
