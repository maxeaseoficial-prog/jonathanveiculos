---
title: Hardening de Segurança
date: 2026-08-13
---

# Hardening de Segurança — Jonathan Veículos

## Ações Realizadas

### 1. Proteção contra Brute Force (Rate Limiting)
- **Implementação**: Criado `src/lib/rate-limit.functions.ts` com rate limiting server-side.
- **Regra**: Máximo de 5 tentativas inválidas por combinação de IP + Usuário em uma janela de 15 minutos.
- **Frontend**: Integrado em `src/routes/admin.index.tsx` antes da chamada de autenticação do Supabase.
- **Bloqueio**: Bloqueio temporário real (server-side) que não pode ser contornado via localStorage/sessionStorage ou recarregamento de página.

### 2. Segurança de Autenticação & Sessão
- **Credenciais Demo**: Removidas todas as referências a `admin/admin` ou `demo_admin_session`. O login agora é 100% dependente do Supabase Auth.
- **Login por Usuário**: Mantido o sistema de mapeamento `username -> email` em `resolveUsername` para evitar exposição de e-mails internos.
- **Proteção de Rotas**: `admin.dashboard.tsx` valida a sessão e o perfil de administrador via Supabase.
- **Mensagens de Erro**: Padronizadas para "Usuário ou senha inválidos" para evitar enumeração de usuários.

### 3. RLS (Row Level Security) & Banco de Dados
- **Auditoria**: Verificado que `profiles` não permite listagem pública (SELECT retorna vazio para anon).
- **Políticas**: Tabelas administrativas (`company_settings`, `vehicles`) bloqueiam INSERT/UPDATE/DELETE anônimos.
- **Chaves**: Confirmado que `SUPABASE_SERVICE_ROLE_KEY` não está exposta no frontend. O cliente usa apenas a chave pública `anon`.

### 4. Segurança de Frontend
- **Headers de Links**: Atualizados todos os links externos (`target="_blank"`) para incluir `rel="noopener noreferrer"` em todos os componentes (Header, Footer, Hero, etc.).
- **Logs**: Removidos logs que poderiam expor dados sensíveis. Logs administrativos agora usam prefixos claros e sanitizados.
- **XSS**: Verificado uso de `dangerouslySetInnerHTML` (restrito a componentes de UI controlados como Charts).
- **Tratamento de Erros**: Página 404 e erros de roteamento configurados para não vazar stack traces ou detalhes de SQL.

### 5. Auditoria de Segredos
- **.env**: Arquivo `.env` está no `.gitignore`.
- **Hardcoded**: Nenhuma senha ou segredo administrativo encontrado nos arquivos `src/`, `public/` ou assets.

## Relatório Final

| Item | Status |
| :--- | :--- |
| Rate limit login server-side | SIM (5/15min) |
| Reload contorna rate limit | NÃO |
| LocalStorage contorna rate limit | NÃO |
| Login demo/hardcoded | NÃO |
| Senha admin no frontend | NÃO |
| Service Role no navegador | NÃO |
| Admin protegido por sessão real | SIM |
| RLS auditada | SIM |
| Escrita anônima no banco | NÃO |
| Profiles públicos | NÃO |
| Links seguros (noopener) | SIM |
| Build | SUCESSO |

**RESULTADO: PRONTO PARA PRODUÇÃO**
