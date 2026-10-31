import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarCheck2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

export const ProgramPage: React.FC = () => {
  const { missions, navigateTo } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const filteredMissions = missions.filter((m) => {
    if (filter === 'completed') return m.completed;
    if (filter === 'pending') return !m.completed;
    return true;
  });

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D7FF3F] uppercase tracking-wide">
            <span>Roteiro de 30 Dias</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#8D9298] font-mono tabular-nums">
              {completedCount} de 30 entregas realizadas
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-1">
            Programa MODO EXECUÇÃO
          </h1>
          <p className="text-xs text-[#8D9298] mt-1">
            Cada dia traz um capítulo editorial e uma missão prática. Sem acúmulo e sem cobrança por dias pulados.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 p-1 bg-[#16181D] border border-white/10 rounded-xl text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-[#D7FF3F] text-[#101114] font-bold shadow-xs'
                : 'text-[#8D9298] hover:text-white'
            }`}
          >
            Todas (30)
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'pending'
                ? 'bg-[#D7FF3F] text-[#101114] font-bold shadow-xs'
                : 'text-[#8D9298] hover:text-white'
            }`}
          >
            Pendentes ({30 - completedCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filter === 'completed'
                ? 'bg-[#D7FF3F] text-[#101114] font-bold shadow-xs'
                : 'text-[#8D9298] hover:text-white'
            }`}
          >
            Concluídas ({completedCount})
          </button>
        </div>
      </div>

      {/* Mission list */}
      <div className="space-y-3">
        {filteredMissions.map((mission) => (
          <div
            key={mission.id}
            onClick={() => navigateTo(`/app/missao/${mission.id}`)}
            className="p-4 sm:p-5 rounded-2xl bg-[#16181D] border border-white/10 hover:border-[#D7FF3F]/50 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white shadow-xl"
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono font-bold text-[#D7FF3F]">
                  DIA {mission.day.toString().padStart(2, '0')}
                </span>
                <span className="text-white/20">·</span>
                <span className="text-[#8D9298] font-mono tabular-nums">
                  {mission.estimatedMinutes} min
                </span>
                {mission.blockedReason && (
                  <>
                    <span className="text-white/20">·</span>
                    <span className="text-amber-400 font-medium">Bloqueio registrado</span>
                  </>
                )}
              </div>
              <h3 className="text-base font-bold text-white font-display group-hover:text-[#D7FF3F] transition-colors truncate">
                {mission.title}
              </h3>
              <p className="text-xs text-[#8D9298] line-clamp-1">
                {mission.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
              {mission.completed ? (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Concluída</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-xs font-bold text-[#D7FF3F] group-hover:text-white transition-colors">
                  <span>Abrir</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
