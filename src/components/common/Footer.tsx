import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, Sparkles, BookOpen } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo } = useApp();

  return (
    <footer className="border-t border-white/10 bg-[#101114] text-[#8D9298] text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <span className="text-base font-bold tracking-tight text-white font-display flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF3F]" />
              <span>Modo eXec®</span>
            </span>
            <p className="text-xs text-[#8D9298] leading-relaxed">
              O sistema definitivo para empreendedores transformarem intenções represadas em ações físicas, decisões tomadas e entregas concluídas.
            </p>
            <div className="text-[11px] text-[#8D9298]">
              © {new Date().getFullYear()} Modo eXec®. Todos os direitos reservados.
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 font-display">
              Módulos de Ação
            </h4>
            <ul className="space-y-2 text-[#8D9298]">
              <li>
                <button
                  onClick={() => navigateTo('/diagnostico')}
                  className="hover:text-[#D7FF3F] transition-colors cursor-pointer"
                >
                  Diagnóstico Inicial
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/app/programa')}
                  className="hover:text-[#D7FF3F] transition-colors cursor-pointer"
                >
                  Programa de 30 Dias
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/app/projetos')}
                  className="hover:text-[#D7FF3F] transition-colors cursor-pointer"
                >
                  Projetos e Próximas Ações
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/app/decisoes')}
                  className="hover:text-[#D7FF3F] transition-colors cursor-pointer"
                >
                  Matriz de Decisões
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 font-display">
              Ferramentas & Protocolos
            </h4>
            <ul className="space-y-2 text-[#8D9298]">
              <li>
                <button
                  onClick={() => navigateTo('/app/conversas')}
                  className="hover:text-[#D7FF3F] transition-colors cursor-pointer"
                >
                  Roteiros de Conversas Difíceis
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/app/processos')}
                  className="hover:text-[#D7FF3F] transition-colors cursor-pointer"
                >
                  Criador de Processos & Delegação
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/app/revisao')}
                  className="hover:text-[#D7FF3F] transition-colors cursor-pointer"
                >
                  Revisão Semanal em 8 Etapas
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/app/recuperacao')}
                  className="hover:text-[#8D79FF] transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8D79FF]" />
                  <span>Modo Recuperação (Sem Culpa)</span>
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 font-display">
              Materiais & Conta
            </h4>
            <ul className="space-y-2 text-[#8D9298]">
              <li>
                <button
                  onClick={() => navigateTo('/biblioteca')}
                  className="hover:text-[#D7FF3F] transition-colors cursor-pointer"
                >
                  E-book Interativo & Áudios
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('/configuracoes')}
                  className="hover:text-[#D7FF3F] transition-colors cursor-pointer"
                >
                  Configurações & Preferências
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Mandatory Legal & Educational Disclaimer */}
        <div className="pt-6 border-t border-white/10 bg-[#16181D] p-4 rounded-xl border border-white/10">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#D7FF3F] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#8D9298] leading-relaxed">
              <strong className="text-white">Aviso Institucional & Limites:</strong> O MODO EXEC® é uma metodologia de organização, tomada de decisão e execução física de tarefas. Não diagnostica nem trata condições clínicas. Para sofrimento intenso ou persistente, consulte um profissional qualificado da saúde.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
