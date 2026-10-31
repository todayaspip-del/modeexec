import assert from 'node:assert/strict';
import {
  reconcileOnLogin, pushNow, resolveWithCloudVersion, readMeta, writeMeta,
  collectSnapshot, wipeLocal, BACKUP_KEY, type KV, type CloudStore, type RemoteRow, type WriteResult
} from '../src/lib/cloudSync';

class MemKV implements KV {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}
class MemStore implements CloudStore {
  rows = new Map<string, RemoteRow>();
  async fetch(u: string) { return this.rows.get(u) ?? null; }
  async insert(u: string, data: any, sv: number): Promise<WriteResult> {
    if (this.rows.has(u)) return { ok: false, conflict: true };
    this.rows.set(u, { data, revision: 1, schemaVersion: sv }); return { ok: true, revision: 1 };
  }
  async update(u: string, data: any, sv: number, exp: number): Promise<WriteResult> {
    const r = this.rows.get(u);
    if (!r || r.revision !== exp) return { ok: false, conflict: true };
    this.rows.set(u, { data, revision: exp + 1, schemaVersion: sv }); return { ok: true, revision: exp + 1 };
  }
}
const P = 'modo_execucao_storage_v2_';
const put = (ls: KV, name: string, v: unknown) => ls.setItem(P + name, JSON.stringify(v));
const profile = (o: object) => ({ name: 'X', ...o });
let n = 0;
const t = async (name: string, fn: () => Promise<void>) => { await fn(); console.log('ok  ', ++n, name); };

(async () => {
  await t('conta nova + aparelho limpo: nada a fazer', async () => {
    const ls = new MemKV(), st = new MemStore();
    assert.equal((await reconcileOnLogin(ls, st, 'A')).action, 'none');
    assert.deepEqual(readMeta(ls), { userId: 'A', revision: null, dirty: false });
  });

  await t('conta nova + dados DEMO locais: demo é descartado (não vai para a conta)', async () => {
    const ls = new MemKV(), st = new MemStore();
    put(ls, 'profile', profile({ isDemo: true, onboardingCompleted: true })); put(ls, 'tasks', [{ id: 1 }]);
    assert.equal((await reconcileOnLogin(ls, st, 'A')).action, 'wiped');
    assert.deepEqual(collectSnapshot(ls), {});
    assert.equal(st.rows.size, 0);
  });

  await t('conta nova + dados anônimos reais (diagnóstico/onboarding): sobem para a conta', async () => {
    const ls = new MemKV(), st = new MemStore();
    put(ls, 'profile', profile({ isDemo: false, onboardingCompleted: false, executionPattern: 'perfeccionismo' }));
    assert.equal((await reconcileOnLogin(ls, st, 'A')).action, 'pushed');
    assert.equal((st.rows.get('A')!.data as any).v2_profile.executionPattern, 'perfeccionismo');
    assert.deepEqual(readMeta(ls), { userId: 'A', revision: 1, dirty: false });
  });

  await t('login em 2º aparelho: nuvem vence; local estabelecido vira backup', async () => {
    const ls = new MemKV(), st = new MemStore();
    st.rows.set('A', { data: { v2_profile: profile({ isDemo: false, onboardingCompleted: true, name: 'Nuvem' }) }, revision: 5, schemaVersion: 2 });
    put(ls, 'profile', profile({ isDemo: false, onboardingCompleted: true, name: 'Local' }));
    assert.equal((await reconcileOnLogin(ls, st, 'A')).action, 'applied');
    assert.equal((collectSnapshot(ls).v2_profile as any).name, 'Nuvem');
    assert.ok(ls.getItem(BACKUP_KEY)?.includes('Local'));
    assert.equal(readMeta(ls)!.revision, 5);
  });

  await t('troca de conta no mesmo aparelho: dados da conta anterior NÃO vazam', async () => {
    const ls = new MemKV(), st = new MemStore();
    put(ls, 'profile', profile({ isDemo: false, onboardingCompleted: true, name: 'Dados da A' }));
    writeMeta(ls, { userId: 'A', revision: 3, dirty: false });
    assert.equal((await reconcileOnLogin(ls, st, 'B')).action, 'wiped'); // B sem dados na nuvem
    assert.deepEqual(collectSnapshot(ls), {});
    // B com dados na nuvem: aplica os de B e não faz backup dos de A
    put(ls, 'profile', profile({ name: 'Dados da A' })); writeMeta(ls, { userId: 'A', revision: 3, dirty: false });
    st.rows.set('B', { data: { v2_profile: profile({ name: 'Dados da B' }) }, revision: 2, schemaVersion: 2 });
    await reconcileOnLogin(ls, st, 'B');
    assert.equal((collectSnapshot(ls).v2_profile as any).name, 'Dados da B');
    assert.equal(ls.getItem(BACKUP_KEY), null);
  });

  await t('mesmo dono, sem pendência, nuvem avançou em outro aparelho: aplica', async () => {
    const ls = new MemKV(), st = new MemStore();
    put(ls, 'tasks', [1]); writeMeta(ls, { userId: 'A', revision: 1, dirty: false });
    st.rows.set('A', { data: { v2_tasks: [1, 2, 3] }, revision: 4, schemaVersion: 2 });
    assert.equal((await reconcileOnLogin(ls, st, 'A')).action, 'applied');
    assert.deepEqual(collectSnapshot(ls).v2_tasks, [1, 2, 3]);
  });

  await t('mesmo dono, COM pendência e nuvem avançou: conflito, nada é sobrescrito', async () => {
    const ls = new MemKV(), st = new MemStore();
    put(ls, 'tasks', ['local']); writeMeta(ls, { userId: 'A', revision: 1, dirty: true });
    st.rows.set('A', { data: { v2_tasks: ['nuvem'] }, revision: 4, schemaVersion: 2 });
    assert.equal((await reconcileOnLogin(ls, st, 'A')).action, 'conflict');
    assert.deepEqual(collectSnapshot(ls).v2_tasks, ['local']);
    assert.deepEqual((st.rows.get('A')!.data as any).v2_tasks, ['nuvem']);
  });

  await t('mesmo dono com pendência e nuvem igual: envia', async () => {
    const ls = new MemKV(), st = new MemStore();
    st.rows.set('A', { data: { v2_tasks: [] }, revision: 2, schemaVersion: 2 });
    put(ls, 'tasks', ['novo']); writeMeta(ls, { userId: 'A', revision: 2, dirty: true });
    assert.equal((await reconcileOnLogin(ls, st, 'A')).action, 'pushed');
    assert.equal(st.rows.get('A')!.revision, 3);
  });

  await t('dois aparelhos gravando: o 2º recebe conflito; "usar nuvem" e "manter este" funcionam', async () => {
    const st = new MemStore(), d1 = new MemKV(), d2 = new MemKV();
    put(d1, 'tasks', ['a']); await reconcileOnLogin(d1, st, 'A');          // d1 cria rev 1
    await reconcileOnLogin(d2, st, 'A');                                     // d2 recebe rev 1
    put(d1, 'tasks', ['a', 'b']);
    const r1 = await pushNow(d1, st, 'A'); assert.equal(r1.status, 'saved'); // rev 2
    put(d2, 'tasks', ['a', 'c']);
    const r2 = await pushNow(d2, st, 'A'); assert.equal(r2.status, 'conflict');
    assert.deepEqual((st.rows.get('A')!.data as any).v2_tasks, ['a', 'b']);  // nada perdido
    await resolveWithCloudVersion(d2, st, 'A');
    assert.deepEqual(collectSnapshot(d2).v2_tasks, ['a', 'b']);
    assert.ok(d2.getItem(BACKUP_KEY)?.includes('"c"'));
    put(d2, 'tasks', ['forçado']);
    const r3 = await pushNow(d2, st, 'A', { force: true }); assert.equal(r3.status, 'saved');
    assert.deepEqual((st.rows.get('A')!.data as any).v2_tasks, ['forçado']);
  });

  await t('wipeLocal remove dados/backup/meta mas preserva preferência de interface', async () => {
    const ls = new MemKV();
    put(ls, 'profile', {}); ls.setItem(BACKUP_KEY, '{}'); writeMeta(ls, { userId: 'A', revision: 1, dirty: false });
    ls.setItem('modo_execucao_postit_note_content', 'segredo'); ls.setItem('modo_execucao_desktop_mode', 'classic');
    wipeLocal(ls);
    assert.deepEqual([...ls.m.keys()], ['modo_execucao_desktop_mode']);
  });

  await t('snapshot ignora chaves fora do formato ao aplicar (defesa contra payload estranho)', async () => {
    const ls = new MemKV(), st = new MemStore();
    st.rows.set('A', { data: { v2_ok: 1, 'evil_key': 2, 'modo_execucao_sync_meta': 3 } as any, revision: 1, schemaVersion: 2 });
    await reconcileOnLogin(ls, st, 'A');
    assert.deepEqual(Object.keys(collectSnapshot(ls)), ['v2_ok']);
    assert.equal(readMeta(ls)!.userId, 'A');
  });

  console.log(`\n${n} testes passaram`);
})().catch((e) => { console.error('FALHOU:', e); process.exit(1); });
