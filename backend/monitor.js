// backend/monitor.js - Monitorar conexões ativas

let conexoesAtivas = 0;
let requisicoesPorSegundo = 0;
let totalRequisicoes = 0;

function registrarConexao() {
  conexoesAtivas++;
  requisicoesPorSegundo++;
  totalRequisicoes++;
  console.log(`👤 Conexões ativas: ${conexoesAtivas} | Total requisições: ${totalRequisicoes}`);
}

function finalizarConexao() {
  if (conexoesAtivas > 0) conexoesAtivas--;
  console.log(`👤 Conexões ativas: ${conexoesAtivas}`);
}

// Reset contador a cada segundo
setInterval(() => {
  if (requisicoesPorSegundo > 0) {
    console.log(`📊 Requisições/seg: ${requisicoesPorSegundo}`);
  }
  requisicoesPorSegundo = 0;
}, 1000);

// Status detalhado a cada 30 segundos
setInterval(() => {
  const memoria = process.memoryUsage();
  console.log(`
  ═════════════════════════════════════
  📊 STATUS DO SERVIDOR
  ═════════════════════════════════════
  👤 Conexões ativas: ${conexoesAtivas}
  📈 Total requisições: ${totalRequisicoes}
  💾 Memória usada: ${Math.round(memoria.heapUsed / 1024 / 1024)}MB
  ⏱️ Uptime: ${Math.floor(process.uptime() / 60)}min
  ═════════════════════════════════════
  `);
}, 30000);

module.exports = {
  registrarConexao,
  finalizarConexao
};
