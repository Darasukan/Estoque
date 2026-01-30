# 🏠 **Sistema de Estoque - Guia LAN**

## ✅ **Como Usar (Rede Local)**

### **1️⃣ INICIAR O SERVIDOR**

**Opção A - Clicar duas vezes em `iniciar.bat`:**
```
C:\Estoque\iniciar.bat (duplo clique)
```

**Opção B - Pelo Terminal:**
```powershell
cd C:\Estoque
npm start
```

### **2️⃣ ACESSAR O SISTEMA**

Após iniciar, você verá algo como:
```
✅ Banco de dados inicializado
🚀 Servidor rodando em http://localhost:3000
🌐 Acesse pela LAN: http://192.168.1.100:3000
```

**Acesse no navegador:**
- 📍 **Do PC Principal**: `http://localhost:3000/login.html`
- 📍 **De Outro PC da Rede**: `http://192.168.1.100:3000/login.html` (troque 192.168.1.100 pelo seu IP)

### **3️⃣ FAZER LOGIN**

Use uma das credenciais:
- **Usuário**: admin | **Senha**: admin123
- **Usuário**: user | **Senha**: user123

---

## 🔍 **Como Encontrar o IP da Sua Máquina**

**No Windows:**
```powershell
ipconfig
```

Procure por algo como:
```
IPv4 Address. . . . . . . . . : 192.168.1.100
```

---

## 🖥️ **Para DEIXAR RODANDO 24/7**

### **Opção 1: Usar Taskbar do Windows**

1. Clique com botão direito em `iniciar.bat`
2. Escolha "Criar atalho"
3. Clique direito no atalho → Propriedades
4. Marca a caixa "Minimizado"
5. Coloque em `C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup`
6. Pronto! Vai iniciar quando Windows ligar

### **Opção 2: Usar PM2 (Profissional)**

```powershell
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar com PM2
pm2 start "npm start" --name "estoque" --cwd "C:\Estoque"

# Ver status
pm2 status

# Logs
pm2 logs estoque

# Reiniciar na boot
pm2 startup
pm2 save
```

### **Opção 3: Task Scheduler do Windows**

1. Abra "Agendador de Tarefas"
2. Crie nova tarefa
3. Gatilho: "Na inicialização"
4. Ação: Executar `C:\Estoque\iniciar.bat`
5. Marque "Executar independentemente se usuário está logado"

---

## 📊 **Acessar de Diversos Dispositivos**

### **PC Windows**
```
http://192.168.1.100:3000/login.html
```

### **Mac/Linux**
```
http://192.168.1.100:3000/login.html
```

### **Tablet/Smartphone (Android/iOS)**
```
http://192.168.1.100:3000/login.html
```

---

## 🔧 **Troubleshooting LAN**

### **Problema: "Conexão recusada"**
```
❌ Solução: 
1. Verifique se o servidor está rodando
2. Use o IP correto (veja com ipconfig)
3. Firewall: permita Node.js
```

### **Problema: "Não consegue acessar de outro PC"**
```
❌ Solução:
1. Ambos PCs devem estar na mesma rede WiFi/Ethernet
2. Não pode haver firewall bloqueando porta 3000
3. Tente: ping 192.168.1.100 (do outro PC)
```

### **Problema: "Permissão negada"**
```
❌ Solução:
1. Abra PowerShell como Admin
2. Execute: npm start
```

---

## 📝 **Comandos Úteis**

| Comando | O Que Faz |
|---------|-----------|
| `npm start` | Inicia o servidor |
| `npm install` | Instala dependências |
| `ipconfig` | Mostra seu IP local |
| `Ctrl+C` | Para o servidor |
| `del database\estoque.db` | Reseta o banco (deleta dados) |

---

## 🎯 **Fluxo Típico**

```
1. Executar iniciar.bat
   ↓
2. Notar o IP (ex: 192.168.1.100)
   ↓
3. Ir para http://192.168.1.100:3000/login.html (de qualquer PC)
   ↓
4. Fazer login com admin/admin123
   ↓
5. Usar o sistema normalmente!
   ↓
6. Deixar rodando 24/7 com PM2 ou Task Scheduler
```

---

## 💾 **Dados**

- **Banco de dados**: `C:\Estoque\database\estoque.db` (SQLite local)
- **Arquivo salvo automaticamente** em tempo real
- **Backup**: Copie o arquivo `estoque.db` regularmente

---

## ✅ **Tudo Pronto!**

Seu sistema está **100% funcional na LAN**. Qualquer dispositivo na rede pode acessar! 🚀
