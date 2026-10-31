# Contas e sincronização (Supabase) — passo a passo

Sem as variáveis abaixo o app continua funcionando em **modo local** (sem login, dados só no navegador).
Com elas, ativa-se: login, dados na nuvem entre aparelhos, IA restrita a usuários logados (com limite por usuário) e exclusão de conta.

## 1. Criar o projeto
1. Em supabase.com, crie um projeto (região **South America – São Paulo** para usuários no Brasil).
2. **SQL Editor** → cole e rode o conteúdo de `supabase/schema.sql`. Ele cria a tabela `user_data` com RLS: cada usuário só enxerga a própria linha.

## 2. Configurar a autenticação (Authentication)
- **Providers → Email:** habilitado. Recomendado manter *Confirm email* ligado e senha mínima de 8 caracteres.
- **URL Configuration:**
  - *Site URL* = a URL pública do app (ex.: `https://app.seudominio.com.br`)
  - *Redirect URLs* = adicione `https://app.seudominio.com.br/app` (e `http://localhost:3000/app` para desenvolvimento)
- **SMTP (importante antes de lançar):** o envio de e-mails padrão do Supabase é extremamente limitado e serve só para testes. Configure um SMTP próprio (Resend, SendGrid, Amazon SES…) e traduza os modelos de e-mail (*Email Templates*) para português.
- Opcional: ative CAPTCHA em *Authentication → Attack Protection* para barrar criação de contas em massa.

## 3. Variáveis de ambiente do servidor
| Variável | Onde pegar | Observação |
|---|---|---|
| `SUPABASE_URL` | Project Settings → API → Project URL | pública |
| `SUPABASE_ANON_KEY` | Project Settings → API → `anon` `public` | pública por desenho; a RLS protege os dados |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → `service_role` | **SEGREDO.** Só no servidor (Secrets). Habilita "Excluir minha conta". Nunca coloque em código ou no navegador. |

No AI Studio/Cloud Run, cadastre-as em *Secrets*/variáveis de ambiente. Não é preciso rebuild: o navegador recebe URL + chave anon em tempo de execução (`/api/public-config`).

## 4. Verificação rápida (10 minutos)
1. Abra `/` → deve aparecer a **landing page** (não o dashboard).
2. Clique em começar → crie uma conta → confirme o e-mail → entre → deve cair em **/onboarding** com tudo vazio.
3. Conclua o onboarding, crie um projeto. Em *Configurações*, o status deve mostrar "Salvo na nuvem".
4. Abra o app em **outro navegador/aparelho**, entre com a mesma conta → o projeto deve aparecer.
5. No Supabase → Table Editor → `user_data`: uma linha por usuário, com `revision` aumentando.
6. Em *Configurações → Excluir minha conta*: o usuário some de Authentication e a linha de `user_data` some junto.

## Como a sincronização funciona (e seus limites)
- O estado inteiro do app é um documento JSON por usuário (teto de ~2 MB), salvo ~2 s após cada alteração e ao esconder a aba.
- Cada gravação confere a "revisão" conhecida. Se outro aparelho gravou antes, o app **não sobrescreve**: mostra um aviso para escolher entre a versão da nuvem ou a deste aparelho (a descartada fica de backup no `localStorage`).
- Ao sair, os dados são removidos do aparelho (evita vazar entre contas em computador compartilhado).
- Não sincroniza: posição das janelas, wallpaper do desktop e o conteúdo do post-it (preferências deste aparelho).
- Se quiser edição simultânea em tempo real, o caminho é migrar de "um documento" para tabelas por entidade. Para o beta, o modelo atual é suficiente.

## Testes automatizados
`npm test` roda a lógica de sincronização (11 cenários) e a interface com jsdom (10 cenários).
`npm run build && node scripts/test-server.mjs` testa o servidor (login, limite por usuário, exclusão) contra um Supabase simulado.
