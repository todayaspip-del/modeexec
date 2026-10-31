import React, { useState } from 'react';
import { Cloud, CloudOff, Loader2, LogOut, Trash2 } from 'lucide-react';
import { useAuth, type SyncStatus } from '../../context/AuthGate';

const STATUS_LABEL: Record<SyncStatus, { text: string; cls: string }> = {
  idle: { text: 'Sincronizado', cls: 'text-[#8D9298]' },
  saving: { text: 'Salvando na nuvem…', cls: 'text-[#D7FF3F]' },
  saved: { text: 'Salvo na nuvem', cls: 'text-[#D7FF3F]' },
  offline: { text: 'Sem conexão — tentando novamente', cls: 'text-amber-300' },
  conflict: { text: 'Conflito entre aparelhos', cls: 'text-red-300' }
};

export const AccountCard: React.FC = () => {
  const { cloudEnabled, user, syncStatus, lastSyncedAt, signOut, deleteAccount } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!cloudEnabled) {
    return (
      <div className="p-5 rounded-xl bg-[#16181D] border border-white/10 flex items-start gap-3 text-xs">
        <CloudOff className="w-4 h-4 text-[#8D9298] shrink-0 mt-0.5" />
        <div className="space-y-1 text-[#8D9298]">
          <strong className="text-white">Modo local</strong>
          <p>Neste ambiente as contas não estão ativas: seus dados ficam apenas neste navegador. Use o backup em JSON abaixo para não perdê-los.</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  const st = STATUS_LABEL[syncStatus];
  const handleDelete = async () => {
    const ok = window.confirm(
      'Excluir sua conta apaga definitivamente seu login e todos os seus dados na nuvem. Esta ação não pode ser desfeita. Continuar?'
    );
    if (!ok) return;
    setBusy(true);
    setError(null);
    const res = await deleteAccount();
    if (res.error) setError(res.error);
    setBusy(false);
  };

  return (
    <div className="p-5 rounded-xl bg-[#16181D] border border-white/10 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs min-w-0">
          <Cloud className="w-4 h-4 text-[#D7FF3F] shrink-0" />
          <div className="min-w-0">
            <div className="font-bold text-white truncate">{user.email}</div>
            <div className={`flex items-center gap-1.5 font-mono ${st.cls}`}>
              {syncStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
              {st.text}
              {lastSyncedAt && syncStatus !== 'saving' && (
                <span className="text-[#8D9298]">· {new Date(lastSyncedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={() => void signOut()}
          className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Sair
        </button>
      </div>

      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <p className="text-[#8D9298]">Você pode excluir sua conta e todos os dados associados a qualquer momento.</p>
        <button
          onClick={handleDelete}
          disabled={busy}
          className="flex items-center justify-center gap-2 px-3.5 py-2 font-semibold text-red-300 hover:bg-red-500/10 border border-red-500/30 rounded-lg disabled:opacity-60 transition-colors cursor-pointer"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          Excluir minha conta
        </button>
      </div>
      {error && <div role="alert" className="text-xs text-red-300">{error}</div>}
    </div>
  );
};
