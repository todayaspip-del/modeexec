// Teste de integração do servidor com um Supabase simulado. Uso: npm run build && node scripts/test-server.mjs
import http from 'node:http';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const deleted = [];
const mock = http.createServer((req, res) => {
  const auth = req.headers.authorization || '';
  res.setHeader('content-type', 'application/json');
  if (req.url === '/auth/v1/user') {
    if (auth === 'Bearer good-1') return res.end(JSON.stringify({ id: 'user-1', email: 'a@x.com' }));
    if (auth === 'Bearer good-2') return res.end(JSON.stringify({ id: 'user-2', email: 'b@x.com' }));
    res.statusCode = 401; return res.end('{}');
  }
  if (req.method === 'DELETE' && req.url.startsWith('/auth/v1/admin/users/')) {
    if (auth !== 'Bearer SERVICE') { res.statusCode = 403; return res.end('{}'); }
    deleted.push(req.url.split('/').pop()); return res.end('{}');
  }
  res.statusCode = 404; res.end('{}');
});
await new Promise((r) => mock.listen(54321, r));

const procs = [];
async function start(port, env) {
  const p = spawn('node', ['server.js'], { env: { PATH: process.env.PATH, NODE_ENV: 'production', PORT: String(port), ...env }, stdio: 'ignore' });
  procs.push(p);
  for (let i = 0; i < 40; i++) {
    try { await fetch(`http://localhost:${port}/api/health`); return `http://localhost:${port}`; } catch { await new Promise((r) => setTimeout(r, 150)); }
  }
  throw new Error('servidor não subiu');
}
const post = (base, token) => fetch(`${base}/api/ai/stages`, {
  method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify({ name: 'x', desiredOutcome: 'y' })
});
let n = 0; const ok = (m) => console.log('ok  ', ++n, m);

try {
  // A) modo local
  let base = await start(3201, {});
  assert.deepEqual(await (await fetch(`${base}/api/public-config`)).json(), { enabled: false }); ok('A) sem Supabase: contas desativadas');
  assert.notEqual((await (await post(base)).json()).code, 'unauthorized'); ok('A) IA sem token NÃO é barrada pelo middleware no modo local (falha só por falta de chave Gemini)');
  assert.equal((await fetch(`${base}/app/projetos`)).status, 200); ok('A) deep link do SPA responde 200');

  // B) contas ativas
  base = await start(3202, { SUPABASE_URL: 'http://localhost:54321', SUPABASE_ANON_KEY: 'anon' });
  const cfg = await (await fetch(`${base}/api/public-config`)).json();
  assert.deepEqual(cfg, { enabled: true, supabaseUrl: 'http://localhost:54321', supabaseAnonKey: 'anon' }); ok('B) config pública entrega só URL + chave anon');
  assert.equal((await post(base)).status, 401); ok('B) IA sem token -> 401');
  const forged = await post(base, 'forjado');
  assert.equal(forged.status, 401); assert.equal((await forged.json()).code, 'unauthorized'); ok('B) IA com token forjado -> 401 (code: unauthorized)');
  assert.notEqual((await (await post(base, 'good-1')).json()).code, 'unauthorized'); ok('B) IA com token válido passa pela autenticação');
  const codes = [];
  for (let i = 0; i < 12; i++) codes.push((await post(base, 'good-1')).status);
  assert.ok(codes.includes(429), 'user-1 deveria ser limitado'); ok(`B) limite por usuário aplicado ao user-1 (${codes.filter((c) => c === 429).length} bloqueadas de 12)`);
  assert.notEqual((await post(base, 'good-2')).status, 429); ok('B) user-2 não é afetado pelo limite do user-1');
  const noKey = await fetch(`${base}/api/account`, { method: 'DELETE', headers: { Authorization: 'Bearer good-1' } });
  assert.equal(noKey.status, 501); ok('B) exclusão sem service key -> 501 com mensagem clara');

  // C) exclusão de conta
  base = await start(3203, { SUPABASE_URL: 'http://localhost:54321', SUPABASE_ANON_KEY: 'anon', SUPABASE_SERVICE_ROLE_KEY: 'SERVICE' });
  assert.equal((await fetch(`${base}/api/account`, { method: 'DELETE' })).status, 401); ok('C) exclusão sem token -> 401');
  assert.equal((await fetch(`${base}/api/account`, { method: 'DELETE', headers: { Authorization: 'Bearer forjado' } })).status, 401); ok('C) exclusão com token forjado -> 401');
  assert.equal((await fetch(`${base}/api/account`, { method: 'DELETE', headers: { Authorization: 'Bearer good-1' } })).status, 200);
  assert.deepEqual(deleted, ['user-1']); ok('C) exclusão válida remove exatamente o usuário do token (user-1)');
  console.log(`\n${n} verificações passaram`);
} catch (e) {
  console.error('FALHOU:', e); process.exitCode = 1;
} finally {
  procs.forEach((p) => p.kill());
  mock.close();
  setTimeout(() => process.exit(process.exitCode ?? 0), 300);
}
