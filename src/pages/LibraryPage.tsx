import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EBOOK_CHAPTERS } from '../data/seedData';
import { ASSETS } from '../assets/images';
import {
  BookOpen,
  Headphones,
  FileText,
  Download,
  ArrowRight,
  Play,
  Pause,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const { navigateTo, showToast } = useApp();
  const [playingChapterId, setPlayingChapterId] = useState<number | null>(null);

  const togglePlayAudio = (chapterId: number) => {
    if (playingChapterId === chapterId) {
      setPlayingChapterId(null);
    } else {
      setPlayingChapterId(chapterId);
      showToast('Áudio Executivo', 'Reproduzindo resumo em áudio do capítulo selecionado.', 'info');
    }
  };

  const handleDownload = (filename: string) => {
    showToast('Download Iniciado', `O material "${filename}" foi preparado e baixado.`, 'success');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D7FF3F] uppercase tracking-wide">
            <span>Acervo de Apoio</span>
            <span aria-hidden="true" className="text-white/20">·</span>
            <span className="text-[#8D9298] font-mono">30 Capítulos · Templates · Áudios</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
            Biblioteca & E-book Interativo
          </h1>
          <p className="text-xs text-[#8D9298] mt-1">
            Cada capítulo do livro se conecta a uma missão no aplicativo para transformar conhecimento em tração real.
          </p>
        </div>
      </div>

      {/* Book Spotlight Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#16181D] border border-white/10 shadow-xl flex flex-col md:flex-row gap-6 items-center">
        <div className="w-36 shrink-0 rounded-xl overflow-hidden shadow-md border border-white/15">
          <img
            src={ASSETS.ebookCover}
            alt="Capa do E-book MODO EXECUÇÃO"
            referrerPolicy="no-referrer"
            className="w-full h-auto object-cover"
          />
        </div>

        <div className="space-y-3 flex-1">
          <span className="text-xs font-bold text-[#D7FF3F] uppercase tracking-wider">
            Publicação Oficial
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-white">
            MODO EXECUÇÃO: O Sistema de 30 Dias para Vencer a Procrastinação
          </h2>
          <p className="text-xs sm:text-sm text-[#8D9298] leading-relaxed">
            Um guia denso, sem jargões motivacionais, que aborda as razões psicológicas, neurológicas e operacionais do adiamento. Cada lição termina com uma missão direta.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={() => handleDownload('Modo_Execucao_Ebook_Completo.pdf')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar E-book em PDF</span>
            </button>
            <button
              onClick={() => navigateTo('/app/programa')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/15 rounded-lg transition-colors cursor-pointer"
            >
              <span>Ver todas as 30 missões</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* E-book Chapters Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">
          Capítulos em Destaque & Áudios Executivos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {EBOOK_CHAPTERS.map((chap) => {
            const isPlaying = playingChapterId === chap.id;

            return (
              <div
                key={chap.id}
                className="p-5 rounded-xl bg-[#16181D] border border-white/10 hover:border-white/20 transition-all space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between text-xs text-[#8D9298] pb-2 border-b border-white/10">
                  <span className="font-mono font-bold text-[#D7FF3F]">
                    CAPÍTULO {chap.id.toString().padStart(2, '0')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{chap.readingTimeMin} min de leitura</span>
                    <span aria-hidden="true" className="text-white/20">·</span>
                    <button
                      onClick={() => togglePlayAudio(chap.id)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        isPlaying
                          ? 'bg-[#D7FF3F] text-[#101114] font-bold'
                          : 'bg-black/40 text-white/80 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-3 h-3 text-[#101114] animate-pulse" />
                          <span>Pausar Áudio</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-[#8D9298]" />
                          <span>Ouvir ({chap.audioDurationMin} min)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-display font-bold text-white leading-snug">
                    {chap.title}
                  </h4>
                  <p className="text-xs text-[#8D9298] italic">
                    {chap.quote}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/10 text-xs text-[#F3F0EB] space-y-1">
                  <span className="font-bold text-[#D7FF3F] text-[11px] uppercase tracking-wider">
                    Lição Central:
                  </span>
                  <p className="leading-relaxed text-[#F3F0EB]/90">{chap.coreLesson}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#8D9298] uppercase">
                    Tópicos de Reflexão:
                  </span>
                  <ul className="space-y-1 text-xs text-[#8D9298]">
                    {chap.summaryBulletPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#D7FF3F] font-bold">·</span>
                        <span className="text-[#F3F0EB]/80">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => navigateTo(`/app/missao/${chap.day}`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#D7FF3F] hover:underline cursor-pointer"
                  >
                    <span>Executar Missão Prática #{chap.day}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Templates & Worksheets */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h3 className="text-sm font-bold text-white uppercase tracking-wide">
          Templates & Guias Operacionais Prontos
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Checklist do Padrão Mínimo Operacional',
              type: 'PDF · 2 Páginas',
              desc: 'Critérios objetivos para aprovar rascunhos sem perder dias em revisões infinitas.',
              file: 'Checklist_Padrao_Minimo.pdf'
            },
            {
              title: 'Planilha de Custo de Inércia',
              type: 'XLSX · 1 Planilha',
              desc: 'Calculadora simples para mensurar quanto custa adiar decisões e ferramentas sem uso.',
              file: 'Calculadora_Custo_Inercia.xlsx'
            },
            {
              title: 'Roteiros de Cobrança Sem Pedir Desculpas',
              type: 'DOCX · 4 Roteiros',
              desc: 'Modelos de e-mail e WhatsApp para reaver notas atrasadas com elegância e firmeza.',
              file: 'Roteiros_Cobranca_Empresarial.docx'
            },
            {
              title: 'Matriz de Decisão Reversível em 24h',
              type: 'PDF · 1 Página',
              desc: 'Fluxograma de 4 etapas para classificar o risco de escolhas e fechar posições.',
              file: 'Matriz_Decisao_Reversivel.pdf'
            },
            {
              title: 'Ficha Padrão de Delegação de Tarefas',
              type: 'DOCX · 1 Página',
              desc: 'Gatilho, contexto, critérios mínimos e ponto de retorno combinado com a equipe.',
              file: 'Ficha_Padrao_Delegacao.docx'
            },
            {
              title: 'Protocolo de Revisão de Sexta-Feira',
              type: 'PDF · 2 Páginas',
              desc: 'As 8 perguntas essenciais para zerar pendências e proteger o descanso de fim de semana.',
              file: 'Protocolo_Revisao_Sexta.pdf'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#16181D] border border-white/10 hover:border-white/20 transition-all space-y-2 text-xs shadow-xl"
            >
              <div className="flex items-center justify-between text-[#8D9298] font-mono text-[10px]">
                <span className="flex items-center gap-1 text-[#8D9298] font-semibold">
                  <FileText className="w-3.5 h-3.5 text-[#D7FF3F]" />
                  <span>{item.type}</span>
                </span>
              </div>
              <h4 className="font-bold text-white leading-snug">
                {item.title}
              </h4>
              <p className="text-[#8D9298] leading-relaxed">
                {item.desc}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => handleDownload(item.file)}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-white/15 bg-black/30 hover:bg-white/10 text-white font-medium transition-colors cursor-pointer"
                >
                  <Download className="w-3 h-3 text-[#8D9298]" />
                  <span>Baixar Arquivo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
