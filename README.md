# MODO EXECUÇÃO

Sistema de 30 dias para empreendedores transformarem tarefas adiadas em ações claras, decisões tomadas e entregas concluídas.

## Rodar localmente
1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha `GEMINI_API_KEY` (IA).
3. `npm run dev`

Sem configuração de Supabase o app roda em **modo local** (sem login; dados no navegador).
Para ativar **contas e sincronização na nuvem**, siga `SETUP_SUPABASE.md`.

## Produção
`npm run build` e depois `npm start` (servidor Express servindo `dist/` e a API).

## Testes
`npm test` (sincronização + interface) e `npm run build && node scripts/test-server.mjs` (servidor).
