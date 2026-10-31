import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Priority, ProjectStatus, TaskStatus } from '../../types';
import { X, Plus, FolderKanban, CheckSquare, Scale, Workflow } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addProject, createProjectWithMesa } = useApp();
  const [name, setName] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<Priority>('Alta');
  const [status, setStatus] = useState<ProjectStatus>('ativo');
  const [nextAction, setNextAction] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const trimmedAction = nextAction.trim();
    const actionTitle = trimmedAction || 'Definir o primeiro passo físico e abrir o arquivo inicial';
    const outcomeTitle = desiredOutcome.trim() || 'Resultado em definição com a equipe';

    // If the user typed a nextAction, also create a stage 'Execução' and a first card with that title
    if (trimmedAction) {
      createProjectWithMesa({
        name: trimmedName,
        desiredOutcome: outcomeTitle,
        deadline: deadline || undefined,
        priority,
        status,
        stages: [
          {
            title: 'Execução',
            doneCriteria: 'Ações prioritárias executadas e comprovadas',
            cards: [
              {
                title: trimmedAction,
                durationMinutes: 20,
                expectedEvidence: 'Evidência da primeira ação concluída',
                isNextPhysicalAction: true
              }
            ]
          }
        ]
      });
    } else {
      addProject({
        name: trimmedName,
        desiredOutcome: outcomeTitle,
        deadline: deadline || undefined,
        priority,
        status,
        nextAction: actionTitle
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#16181D] rounded-xl max-w-lg w-full p-6 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-[#D7FF3F]" />
            <h3 className="text-base font-display font-bold text-white">Novo Projeto Ativo</h3>
          </div>
          <button onClick={onClose} className="text-[#8D9298] hover:text-white p-1 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8D9298] mb-1">
              Nome do Projeto *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Nova oferta de consultoria"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D9298] mb-1">
              Resultado Desejado (Critério de Conclusão) *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Como você saberá que o projeto acabou? Ex: Publicar a página e enviar proposta para 5 clientes..."
              value={desiredOutcome}
              onChange={(e) => setDesiredOutcome(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D9298] mb-1">
              Próxima Ação Física Imediata
            </label>
            <input
              type="text"
              placeholder="Ex: Abrir documento de texto e escrever as 3 promessas da oferta..."
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
            />
            <p className="text-[11px] text-[#8D9298] mt-1">
              Inicie sempre por um verbo de ação mecânica (abrir, ligar, redigir, exportar).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8D9298] mb-1">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
              >
                <option value="Alta" className="bg-[#16181D] text-white">Alta</option>
                <option value="Média" className="bg-[#16181D] text-white">Média</option>
                <option value="Baixa" className="bg-[#16181D] text-white">Baixa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8D9298] mb-1">Prazo Opcional</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8D9298] hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Criar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const NewTaskModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addTask, projects } = useApp();
  const [title, setTitle] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [expectedEvidence, setExpectedEvidence] = useState('');
  const [isNextPhysicalAction, setIsNextPhysicalAction] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const matchedProj = projects.find((p) => p.id === projectId);

    addTask({
      title,
      durationMinutes: Number(durationMinutes) || 15,
      projectId: projectId || undefined,
      projectName: matchedProj?.name,
      status: 'pronta',
      expectedEvidence: expectedEvidence || 'Arquivo salvo ou mensagem enviada com sucesso',
      isNextPhysicalAction
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#16181D] rounded-xl max-w-lg w-full p-6 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-[#D7FF3F]" />
            <h3 className="text-base font-display font-bold text-white">Nova Próxima Ação</h3>
          </div>
          <button onClick={onClose} className="text-[#8D9298] hover:text-white p-1 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8D9298] mb-1">
              Ação Física Observável *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Abrir documento de propostas e redigir a introdução de 3 linhas..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
            />
            <p className="text-[11px] text-[#8D9298] mt-1">
              Evite títulos vagos como &quot;marketing&quot; ou &quot;financeiro&quot;. O que uma câmera veria você fazendo?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                Projeto Vinculado
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
              >
                <option value="" className="bg-[#16181D] text-white">(Sem projeto específico)</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#16181D] text-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                Duração Estimada
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
              >
                <option value={5} className="bg-[#16181D] text-white">5 minutos (Microação)</option>
                <option value={10} className="bg-[#16181D] text-white">10 minutos</option>
                <option value={15} className="bg-[#16181D] text-white">15 minutos</option>
                <option value={25} className="bg-[#16181D] text-white">25 minutos (Pomodoro)</option>
                <option value={45} className="bg-[#16181D] text-white">45 minutos (Foco Profundo)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D9298] mb-1">
              Evidência de Conclusão *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Print do e-mail enviado ou documento .docx salvo na pasta"
              value={expectedEvidence}
              onChange={(e) => setExpectedEvidence(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isNext"
              checked={isNextPhysicalAction}
              onChange={(e) => setIsNextPhysicalAction(e.target.checked)}
              className="rounded border-white/20 text-[#D7FF3F] focus:ring-[#D7FF3F] bg-black/50"
            />
            <label htmlFor="isNext" className="text-xs text-[#F3F0EB]">
              Marcar como <strong className="text-[#D7FF3F]">Prioridade Imediata do Agora</strong>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8D9298] hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Salvar Ação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const NewDecisionModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { addDecision } = useApp();
  const [title, setTitle] = useState('');
  const [openDays, setOpenDays] = useState(7);
  const [postponeCost, setPostponeCost] = useState('');
  const [missingInformation, setMissingInformation] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [reviewDate, setReviewDate] = useState('Amanhã, 14:00');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addDecision({
      title,
      openDays: Number(openDays) || 1,
      postponeCost: postponeCost || 'Custo de indecisão mental e atraso de entregas',
      missingInformation: missingInformation || 'Dados objetivos já coletados',
      nextStep: nextStep || 'Escolher uma das opções viáveis e comunicar envolvidos',
      reviewDate: reviewDate || 'Em 48 horas',
      status: 'pendente',
      options: [
        { label: 'Opção A (Caminho mais direto)', pros: 'Rapidez na execução', cons: 'Pode exigir ajuste posterior', risk: 'Baixo' },
        { label: 'Opção B (Caminho conservador)', pros: 'Menor risco imediato', cons: 'Mais lento e trabalhoso', risk: 'Médio' }
      ]
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#16181D] rounded-xl max-w-lg w-full p-6 shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#D7FF3F]" />
            <h3 className="text-base font-display font-bold text-white">Mapear Decisão Pendente</h3>
          </div>
          <button onClick={onClose} className="text-[#8D9298] hover:text-white p-1 transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8D9298] mb-1">
              Qual decisão você está adiando? *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Cancelar ferramenta de automação ou mudar de plano?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                Aberta há quantos dias?
              </label>
              <input
                type="number"
                min={1}
                value={openDays}
                onChange={(e) => setOpenDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white tabular-nums focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8D9298] mb-1">
                Data/Hora da Decisão
              </label>
              <input
                type="text"
                placeholder="Ex: Sexta-feira, 11:00"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white focus:outline-none focus:border-[#D7FF3F]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D9298] mb-1">
              Qual é o Custo de Continuar Adiando? *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Ex: R$ 480/mês cobrados sem uso, perda de foco da equipe e ansiedade diária..."
              value={postponeCost}
              onChange={(e) => setPostponeCost(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D9298] mb-1">
              Qual dado ou informação está faltando para decidir?
            </label>
            <input
              type="text"
              placeholder="Ex: Verificar se os relatórios antigos já foram exportados..."
              value={missingInformation}
              onChange={(e) => setMissingInformation(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8D9298] mb-1">
              Próximo Passo para Fechar a Posição
            </label>
            <input
              type="text"
              placeholder="Ex: Ligar para o suporte e solicitar o backup..."
              value={nextStep}
              onChange={(e) => setNextStep(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-black/40 border border-white/15 rounded-lg text-white placeholder:text-[#8D9298]/50 focus:outline-none focus:border-[#D7FF3F]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8D9298] hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-[#101114] bg-[#D7FF3F] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Registrar Decisão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
