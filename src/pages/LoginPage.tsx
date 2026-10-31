import React, { useState } from 'react';
import { Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthGate';

type Mode = 'entrar' | 'link' | 'recuperar' | 'nova-senha';

const TITLES: Record<Mode, { eyebrow: string; title: string; sub: string }> = {
  entrar: { eyebrow: 'Acesso', title: 'Entre na sua Central de Execução', sub: 'Acesso restrito a e-mails autorizados.' },
  link: { eyebrow: 'Sem senha', title: 'Receba um link de acesso', sub: 'Enviamos um link para o seu e-mail. Basta clicar para entrar.' },
  recuperar: { eyebrow: 'Recuperação', title: 'Recupere sua senha', sub: 'Informe seu e-mail e enviaremos um link para criar uma nova senha.' },
  'nova-senha': { eyebrow: 'Nova senha', title: 'Defina sua nova senha', sub: 'Escolha uma senha com ao menos 8 caracteres.' }
};

const inputCls =
  'w-full pl-9 pr-3 py-2.5 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#D7FF3F]';

export const LoginPage: React.FC = () => {
  const auth = useAuth();
  const [mode, setMode] = useState<Mode>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const effectiveMode: Mode = auth.recovery ? 'nova-senha' : mode;
  const copy = TITLES[effectiveMode];
  const needsPassword = effectiveMode === 'entrar' || effectiveMode === 'nova-senha';
  const needsEmail = effectiveMode !== 'nova-senha';

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      let result;
      switch (effectiveMode) {
        case 'entrar':
          result = await auth.signInWithPassword(email, password);
          break;
        case 'link':
          result = await auth.sendMagicLink(email);
          break;
        case 'recuperar':
          result = await auth.sendPasswordReset(email);
          break;
        default:
          result = await auth.updatePassword(password);
      }
      if (result.error) setError(result.error);
      else if (result.needsEmailConfirmation)
        setNotice('Conta criada! Enviamos um e-mail de confirmação. Clique no link para ativar o acesso e depois volte para entrar.');
      else if (result.emailSent)
        setNotice('Pronto! Se este e-mail estiver correto, você receberá o link em instantes. Confira também o spam.');
      // sucesso de login/nova senha: o AuthGate troca de tela sozinho
    } finally {
      setBusy(false);
    }
  };

  const cta: Record<Mode, string> = {
    entrar: 'Entrar',
    link: 'Enviar link de acesso',
    recuperar: 'Enviar link de recuperação',
    'nova-senha': 'Salvar nova senha'
  };

  return (
    <div className="min-h-screen bg-[#101114] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto space-y-4">
        <div className="bg-[#16181D] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">
          <div className="space-y-1 border-b border-white/10 pb-4">
            <span className="text-xs font-semibold text-[#D7FF3F] uppercase tracking-wide">{copy.eyebrow}</span>
            <h1 className="text-xl font-display font-bold text-white">{copy.title}</h1>
            <p className="text-xs text-[#8D9298]">{copy.sub}</p>
          </div>

          {notice ? (
            <div role="status" className="flex items-start gap-3 p-4 rounded-xl bg-[#D7FF3F]/10 border border-[#D7FF3F]/30 text-xs text-[#F3F0EB]">
              <CheckCircle2 className="w-4 h-4 text-[#D7FF3F] shrink-0 mt-0.5" />
              <span>{notice}</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
              {needsEmail && (
                <div>
                  <label htmlFor="auth-email" className="block text-xs font-semibold text-[#8D9298] mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="voce@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {needsPassword && (
                <div>
                  <label htmlFor="auth-password" className="block text-xs font-semibold text-[#8D9298] mb-1">
                    {effectiveMode === 'nova-senha' ? 'Nova senha' : 'Senha'}
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="auth-password"
                      type="password"
                      required
                      minLength={effectiveMode === 'entrar' ? undefined : 8}
                      autoComplete={effectiveMode === 'entrar' ? 'current-password' : 'new-password'}
                      placeholder={effectiveMode === 'entrar' ? 'Sua senha' : 'Mínimo de 8 caracteres'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div role="alert" className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white disabled:opacity-60 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
              >
                {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {cta[effectiveMode]}
              </button>
            </form>
          )}

          {!auth.recovery && (
            <div className="pt-4 border-t border-white/10 flex flex-col gap-2 text-xs text-[#8D9298]">
              {effectiveMode === 'entrar' && (
                <>
                  <button onClick={() => switchMode('link')} className="text-left hover:text-white cursor-pointer">Entrar sem senha (link por e-mail)</button>
                  <button onClick={() => switchMode('recuperar')} className="text-left hover:text-white cursor-pointer">Esqueci minha senha</button>
                </>
              )}
              {effectiveMode !== 'entrar' && (
                <button onClick={() => switchMode('entrar')} className="text-left hover:text-white cursor-pointer">
                  Já tem conta? <span className="text-[#D7FF3F] font-semibold">Entrar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
