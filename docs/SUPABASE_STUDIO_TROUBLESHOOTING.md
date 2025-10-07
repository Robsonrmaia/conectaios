# Supabase Studio - Solução de Problemas

## ❌ Erro: "Unable to find snippet with ID"

### Causa
O Supabase Studio armazena referências a snippets SQL antigos no `localStorage` do navegador. Quando um snippet é deletado do banco mas a referência permanece no cache, esse erro ocorre.

### ✅ Solução Rápida

1. **Abra o Supabase Studio** no navegador
2. **Abra o DevTools** (`F12`)
3. **Vá para a aba Console**
4. **Execute este comando:**

```javascript
// Limpar cache do Supabase Studio
localStorage.clear();
sessionStorage.clear();

// Redirecionar para nova query
const projectRef = window.location.pathname.split('/')[2];
window.location.href = `${window.location.origin}/project/${projectRef}/sql/new`;
```

5. **Pressione Enter** e aguarde o redirecionamento

---

### 🔧 Solução Seletiva (Apenas SQL Snippets)

Se você não quer perder TODAS as configurações do Studio, use este comando mais específico:

```javascript
// Limpar APENAS dados relacionados a SQL
Object.keys(localStorage).forEach(key => {
  if (key.includes('sql') || 
      key.includes('snippet') || 
      key.includes('query') ||
      key.includes('editor')) {
    localStorage.removeItem(key);
    console.log('Removido:', key);
  }
});

// Limpar sessionStorage também
Object.keys(sessionStorage).forEach(key => {
  if (key.includes('sql') || key.includes('snippet')) {
    sessionStorage.removeItem(key);
  }
});

// Recarregar
location.reload();
```

---

### 🛡️ Prevenção Automática

Para evitar que o erro aconteça novamente, você pode adicionar este script como **bookmark** no navegador:

```javascript
javascript:(function(){
  const path = window.location.pathname;
  if (path.includes('/sql/') && !path.endsWith('/sql/new')) {
    const projectRef = path.split('/')[2];
    window.location.href = `${window.location.origin}/project/${projectRef}/sql/new`;
  }
})();
```

**Como usar:**
1. Crie um novo bookmark no navegador
2. Cole o código acima no campo URL
3. Nomeie como "Fix SQL Editor"
4. Clique nele sempre que o erro aparecer

---

### 🔍 Diagnóstico

Para ver quais snippets estão armazenados:

```javascript
// Listar todos os snippets salvos
Object.keys(localStorage)
  .filter(key => key.includes('sql') || key.includes('snippet'))
  .forEach(key => {
    console.log(key, localStorage.getItem(key));
  });
```

---

### 🆘 Se o Problema Persistir

1. **Limpe o cache completo do navegador:**
   - Chrome: `Ctrl+Shift+Del` → Selecione "Todos os períodos" → Marque "Cache" e "Cookies"
   - Firefox: `Ctrl+Shift+Del` → Selecione tudo

2. **Tente em janela anônima/privada:**
   - Isso confirma se é problema de cache local

3. **Verifique se o snippet existe no banco:**
   ```sql
   SELECT * FROM supabase_functions.snippets;
   ```

4. **Entre em contato com o suporte do Supabase:**
   - [https://supabase.com/support](https://supabase.com/support)
   - Inclua o ID do snippet que está causando erro

---

### ⚙️ Configuração Recomendada

Para evitar acúmulo de snippets antigos:

1. **Delete snippets não utilizados regularmente**
2. **Use queries temporárias** (sem salvar) para testes rápidos
3. **Organize snippets em pastas** (se disponível na sua versão do Studio)

---

## 📌 Atalhos Úteis do SQL Editor

| Atalho | Ação |
|--------|------|
| `Ctrl+Enter` | Executar query |
| `Ctrl+S` | Salvar snippet |
| `Ctrl+/` | Comentar linha |
| `Ctrl+Shift+F` | Formatar SQL |
| `Esc` | Fechar modal de erro |

---

## 🐛 Reportar Bugs

Se encontrar bugs persistentes no Supabase Studio:
- GitHub: [https://github.com/supabase/supabase/issues](https://github.com/supabase/supabase/issues)
- Discord: [https://discord.supabase.com](https://discord.supabase.com)
