import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProcessDoc } from '../types';
import {
  Workflow,
  Plus,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  FolderKanban,
  ArrowDownToLine,
  X
} from 'lucide-react';

export const ProcessesPage: React.FC = () => {
  const { processes, addProcess, projects, stages, importProcessIntoStage, navigateTo } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProcessId, setActiveProcessId] = useState<string>(processes[0]?.id || '');

  // "Usar em um projeto" dialog state
  const [useInProjectProc, setUseInProjectProc] = useState<ProcessDoc | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string>('');
  const [targetStageId, setTargetStageId] = useState<string>('');

  const handleOpenUseInProject = (proc: ProcessDoc) => {
    setUseInProjectProc(proc);
    const initialProj = projects.find((p) => p.status === 'ativo') || projects[0];
    const initialProjId = initialProj?.id || '';
    setTargetProjectId(initialProjId);

    const projStages = stages.filter((s) => s.projectId === initialProjId);
    setTargetStageId(projStages[0]?.id || '');
  };

  const handleConfirmUseInProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!useInProjectProc || !targetStageId) return;

    importProcessIntoStage(useInProjectProc, targetStageId);
    setUseInProjectProc(null);
  };

  const stagesForTargetProject = stages.filter((s) => s.projectId === targetProjectId);

  // Form states for new process
  const [title, setTitle] = useState('');
  const [trigger, setTrigger] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [responsible, setResponsible] = useState('');
  const [minimumStandard, setMinimumStandard] = useState('');
  const [mistakesText, setMistakesText] = useState('');
  const [expectedResult, setExpectedResult] = useState('');
  const [assignee, setAssignee] = useState('');
  const [context, setContext] = useState('');
  const [deadline, setDeadline] = useState('');
  const [autonomyLevel, setAutonomyLevel] = useState<'Total' | 'Avisar após' | 'Consultar antes'>('Avisar após');
  const [followUpDate, setFollowUpDate] = useState('');

  const handleCreateProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !trigger.trim()) return;

    const stepsArray = stepsText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const mistakesArray = mistakesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    addProcess({
      title,
      trigger,
      steps: stepsArray.length > 0 ? stepsArray : ['Passo 1 em definição'],
      responsible: responsible || 'Responsável designado',
      minimumStandard: minimumStandard || 'Padrão de qualidade aprovado',
      commonMistakes: mistakesArray,
      expectedResult: expectedResult || 'Entrega concluída conforme padrão',
      delegation: assignee
        ? {
            assignee,
            context: context || 'Contexto estratégico da tarefa',
            deadline: deadline || 'Conforme combinado',
            autonomyLevel,
            followUpDate: followUpDate || 'Toda sexta-feira'
          }
        : undefined
    });

    setIsModalOpen(false);
    // Reset fields
    setTitle('');
    setTrigger('');
    setStepsText('');
    setResponsible('');
    setMinimumStandard('');
    setMistakesText('');
    setExpectedResult('');
    setAssignee('');
    setContext('');
    setDeadline('');
    setFollowUpDate('');
  };

  const selectedProc = processes.find((p) => p.id === activeProcessId) || processes[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#D7FF3F] uppercase tracking-wide">
            <span>Operação Descentralizada</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#8D9298] font-mono tabular-nums">
              {processes.length} processos mapeados
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-display mt-1">
            Processos & Delegação com Critério
          </h1>
          <p className="text-xs text-[#8D9298] mt-1">
            Delegar não é &quot;delargar&quot;. Estabeleça gatilho, padrão mínimo inegociável e autonomia combinada.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Documentar Novo Processo</span>
        </button>
      </div>

      {/* MOBILE-ONLY PROCESS PICKER (lg:hidden) */}
      <div className="lg:hidden space-y-2">
        <label className="block text-xs font-bold text-[#8D9298] uppercase tracking-wide">
          Escolha o Processo para Visualizar:
        </label>
        <select
          value={selectedProc?.id}
          onChange={(e) => setActiveProcessId(e.target.value)}
          className="w-full p-3 text-xs font-semibold text-white bg-[#16181D] border border-white/15 rounded-xl shadow-xs focus:ring-1 focus:ring-[#D7FF3F]"
        >
          {processes.map((proc) => (
            <option key={proc.id} value={proc.id} className="bg-[#16181D] text-white">
              {proc.title} ({proc.responsible})
            </option>
          ))}
        </select>
        {selectedProc && (
          <div className="flex items-center justify-end pt-1">
            <button
              type="button"
              onClick={() => handleOpenUseInProject(selectedProc)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Usar em um projeto</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column Desktop: Process List */}
        <div className="hidden lg:block lg:col-span-4 space-y-2">
          <span className="text-xs font-bold text-[#8D9298] uppercase tracking-wide px-1">
            Processos Operacionais
          </span>
          <div className="space-y-2">
            {processes.map((proc) => {
              const isSelected = selectedProc?.id === proc.id;
              return (
                <div
                  key={proc.id}
                  onClick={() => setActiveProcessId(proc.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#D7FF3F] bg-[#D7FF3F]/10 shadow-xs ring-1 ring-[#D7FF3F]'
                      : 'border-white/10 hover:border-white/25 bg-[#16181D]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono text-[#8D9298] mb-0.5">
                    <span>{proc.responsible}</span>
                    <span className="text-[10px] tabular-nums font-sans font-semibold text-[#F3F0EB] bg-white/10 px-1.5 py-0.5 rounded">
                      {proc.steps.length} passos
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white leading-snug">
                    {proc.title}
                  </div>
                  <div className="text-[11px] text-[#8D9298] mt-1 truncate">
                    Gatilho: {proc.trigger}
                  </div>
                  <div className="pt-2 mt-2 border-t border-white/10 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenUseInProject(proc);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D7FF3F] hover:underline cursor-pointer"
                    >
                      <FolderKanban className="w-3 h-3" />
                      <span>Usar em um projeto</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Process Details & Delegation Card */}
        {selectedProc && (
          <div className="lg:col-span-8 bg-[#16181D] p-6 sm:p-7 rounded-2xl border border-white/10 shadow-2xl space-y-6 text-white">
            <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono text-[#D7FF3F] uppercase tracking-wide">
                  Responsável: {selectedProc.responsible}
                </span>
                <h2 className="text-xl font-bold text-white font-display mt-1">
                  {selectedProc.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => handleOpenUseInProject(selectedProc)}
                className="px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <FolderKanban className="w-4 h-4" />
                <span>Usar em um projeto</span>
              </button>
            </div>

            {/* 6-step visual flow */}
            <div className="space-y-4 text-xs">
              {/* 1. Gatilho */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                <span className="font-bold text-[#D7FF3F] uppercase tracking-wide text-[11px]">
                  1. Gatilho de Início (Quando Começa?)
                </span>
                <p className="text-[#F3F0EB] leading-relaxed font-medium">
                  {selectedProc.trigger}
                </p>
              </div>

              {/* 2. Passos sequenciais */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2">
                <span className="font-bold text-[#D7FF3F] uppercase tracking-wide text-[11px]">
                  2. Passos Operacionais Sequenciais:
                </span>
                <ol className="space-y-2">
                  {selectedProc.steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-[#F3F0EB]">
                      <span className="w-5 h-5 rounded-full bg-[#D7FF3F] text-[#101114] flex items-center justify-center font-mono text-[10px] shrink-0 font-bold">
                        {idx + 1}
                      </span>
                      <span className="leading-snug pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 3 & 4. Padrão mínimo e Resultado Esperado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                  <span className="font-bold text-emerald-400 uppercase tracking-wide text-[11px]">
                    3. Padrão Mínimo Inegociável:
                  </span>
                  <p className="text-[#F3F0EB] leading-relaxed">
                    {selectedProc.minimumStandard}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                  <span className="font-bold text-[#D7FF3F] uppercase tracking-wide text-[11px]">
                    4. Resultado Esperado:
                  </span>
                  <p className="text-[#F3F0EB] leading-relaxed font-semibold">
                    {selectedProc.expectedResult}
                  </p>
                </div>
              </div>

              {/* 5. Erros Comuns */}
              {selectedProc.commonMistakes && selectedProc.commonMistakes.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <span className="font-bold text-amber-400 uppercase tracking-wide text-[11px]">
                    5. Erros Mais Frequentes a Evitar:
                  </span>
                  <ul className="space-y-1 text-amber-200">
                    {selectedProc.commonMistakes.map((m, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">✕</span>
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 6. Ficha de Delegação */}
              {selectedProc.delegation && (
                <div className="p-4 rounded-xl border border-white/15 bg-black/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wide">
                    <UserCheck className="w-4 h-4 text-[#D7FF3F]" />
                    <span>Ficha de Delegação Ativa</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#8D9298]">
                    <div>
                      <strong className="text-white">Delegado para: </strong>
                      <span className="text-[#F3F0EB]">{selectedProc.delegation.assignee}</span>
                    </div>
                    <div>
                      <strong className="text-white">Nível de Autonomia: </strong>
                      <span className="font-semibold text-[#D7FF3F]">
                        {selectedProc.delegation.autonomyLevel}
                      </span>
                    </div>
                    <div>
                      <strong className="text-white">Prazo Padrão: </strong>
                      <span className="text-[#F3F0EB]">{selectedProc.delegation.deadline}</span>
                    </div>
                    <div>
                      <strong className="text-white">Ponto de Acompanhamento: </strong>
                      <span className="text-[#F3F0EB]">{selectedProc.delegation.followUpDate}</span>
                    </div>
                  </div>

                  <div className="pt-1 text-xs text-[#8D9298]">
                    <strong className="text-white">Contexto Compartilhado: </strong>
                    <span className="text-[#F3F0EB]">{selectedProc.delegation.context}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal to create a new process */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="bg-[#16181D] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto text-white">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white font-display">
                Documentar Novo Processo
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8D9298] hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProcess} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                  Título do Processo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fechamento de Faturas e Notas Mensais"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-white/20 rounded-lg bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                    Gatilho de Início *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Todo dia 25 do mês"
                    value={trigger}
                    onChange={(e) => setTrigger(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-white/20 rounded-lg bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                    Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Auxiliar Financeiro"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-white/20 rounded-lg bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                  Passos Sequenciais (1 por linha) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="1. Conferir planilha&#10;2. Emitir notas no portal&#10;3. Enviar e-mail de cobrança"
                  value={stepsText}
                  onChange={(e) => setStepsText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-white/20 rounded-lg bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                  Padrão Mínimo de Sucesso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 100% das notas emitidas sem erro de CNPJ e enviadas com boleto"
                  value={minimumStandard}
                  onChange={(e) => setMinimumStandard(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-white/20 rounded-lg bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                  Erros Comuns (1 por linha)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Esquecer de anexar o boleto&#10;Código de serviço errado"
                  value={mistakesText}
                  onChange={(e) => setMistakesText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-white/20 rounded-lg bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F]"
                />
              </div>

              {/* Delegação fields */}
              <div className="pt-2 border-t border-white/10">
                <span className="text-xs font-bold text-white uppercase tracking-wide block mb-2">
                  Delegação (Opcional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#8D9298] mb-1">Pessoa Delegada</label>
                    <input
                      type="text"
                      placeholder="Ex: Mariana"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-white/20 rounded-lg bg-black/40 text-white placeholder-white/40 focus:outline-none focus:border-[#D7FF3F]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#8D9298] mb-1">Autonomia</label>
                    <select
                      value={autonomyLevel}
                      onChange={(e) => setAutonomyLevel(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs border border-white/20 rounded-lg bg-[#16181D] text-white focus:outline-none focus:border-[#D7FF3F]"
                    >
                      <option value="Avisar após">Avisar após executar</option>
                      <option value="Consultar antes">Consultar antes de fechar</option>
                      <option value="Total">Autonomia total</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/20 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-xl transition-colors cursor-pointer shadow-sm"
                >
                  Salvar Processo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Usar em um projeto */}
      {useInProjectProc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setUseInProjectProc(null)}
          role="dialog"
          aria-label="Usar processo em um projeto"
        >
          <div
            className="bg-[#16181D] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/10 space-y-4 animate-in zoom-in-95 duration-150 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-[#D7FF3F]" />
                <h3 className="text-base font-bold text-white font-display">
                  Usar processo em um projeto
                </h3>
              </div>
              <button
                onClick={() => setUseInProjectProc(null)}
                className="text-[#8D9298] hover:text-white p-1 cursor-pointer transition-colors"
                aria-label="Fechar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-[#8D9298] font-medium">Processo selecionado:</span>
              <p className="text-sm font-bold text-white leading-snug">
                {useInProjectProc.title}
              </p>
              <p className="text-xs text-[#8D9298]">
                {useInProjectProc.steps.length} {useInProjectProc.steps.length === 1 ? 'passo operacional' : 'passos operacionais'}
              </p>
            </div>

            {projects.length === 0 ? (
              <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200">
                Você ainda não possui projetos criados. Crie um projeto em Projetos e Mesa primeiro.
              </div>
            ) : (
              <form onSubmit={handleConfirmUseInProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#8D9298] mb-1">
                    1. Escolha o Projeto de Destino *
                  </label>
                  <select
                    value={targetProjectId}
                    onChange={(e) => {
                      const newProjId = e.target.value;
                      setTargetProjectId(newProjId);
                      const projStages = stages.filter((s) => s.projectId === newProjId);
                      setTargetStageId(projStages[0]?.id || '');
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold border border-white/20 rounded-xl bg-black/40 text-white focus:outline-none focus:border-[#D7FF3F]"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#16181D] text-white">
                        {p.name} ({p.status === 'ativo' ? 'Ativo' : p.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8D9298] mb-1">
                    2. Escolha a Etapa *
                  </label>
                  {stagesForTargetProject.length === 0 ? (
                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl text-xs text-[#8D9298]">
                      Este projeto não tem etapas cadastradas. Acesse a Mesa do projeto para criar a primeira etapa.
                    </div>
                  ) : (
                    <select
                      value={targetStageId}
                      onChange={(e) => setTargetStageId(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold border border-white/20 rounded-xl bg-black/40 text-white focus:outline-none focus:border-[#D7FF3F]"
                    >
                      {stagesForTargetProject.map((s, sIdx) => (
                        <option key={s.id} value={s.id} className="bg-[#16181D] text-white">
                          Etapa {sIdx + 1}: {s.title} ({s.status === 'atual' ? 'Atual' : s.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="p-3 bg-black/40 border border-white/10 rounded-xl text-xs text-[#8D9298] leading-relaxed">
                  Cada passo será importado como um cartão de 15 minutos na etapa. Se o limite de cartões for alcançado, os passos extras serão guardados no Estacionamento de ideias do projeto.
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setUseInProjectProc(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#8D9298] hover:text-white border border-white/20 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!targetStageId}
                    className="px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed rounded-xl cursor-pointer transition-colors shadow-xs inline-flex items-center gap-1.5"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>Importar para a Etapa</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
