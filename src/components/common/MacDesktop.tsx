import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Minus,
  Maximize2,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Clock,
  CheckSquare,
  AlignLeft,
  Paperclip,
  MessageSquare,
  Eye,
  Trash2,
  Share2,
  Palette,
  Calendar,
  Tag,
  User,
  Check,
  RotateCcw,
  ArrowUpDown,
  ExternalLink,
  Edit2,
  FileText,
  Volume2,
  VolumeX,
  Wifi,
  Battery,
  Sliders,
  FolderKanban,
  FileCode2,
  Laptop,
  Compass,
  ArrowLeft,
  LayoutGrid,
  Sparkles
} from 'lucide-react';
import { Project, Stage, Task, ChecklistItem, CardLabel, CardAttachment, CardComment, CardActivity, CardMember } from '../../types';

// ============================================================================
// APPLE  BOOT SOUND GENERATOR (Web Audio API Crystal Mac Chime)
// ============================================================================
function playMacStartupChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Smooth F-sharp major chord harmonics simulation (iconic Mac chime feeling)
    const freqs = [185.0, 277.18, 369.99, 554.37, 739.99];
    const now = ctx.currentTime;

    freqs.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = index === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08 / (index + 1), now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.9);
    });
  } catch {
    // Ignore audio autoplay restrictions gracefully
  }
}

// ============================================================================
// APPLE LOGO SVG
// ============================================================================
export const AppleLogo: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 170 170" className={`${className} fill-current`}>
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.85-11.75-14.44-6.07-9.59-10.96-20.64-14.65-33.15-3.69-12.51-5.54-24.36-5.54-35.56 0-14.15 3.73-25.99 11.2-35.53 7.46-9.54 16.92-14.42 28.37-14.64 4.58 0 9.87 1.25 15.89 3.76 6.01 2.5 10.02 3.81 12.02 3.91 1.78-.1 5.92-1.46 12.42-4.08 6.5-2.61 11.83-3.83 16-3.65 12.38.65 22.39 5.39 30.03 14.22-10.88 6.53-16.21 15.56-16 27.1.22 9.14 3.82 16.76 10.81 22.86 6.99 6.1 15.11 9.47 24.36 10.12-2.17 6.31-4.78 12.51-7.84 18.6zM119.22 33.64c0-7.39 2.67-14.37 8-20.93 5.33-6.56 11.88-10.82 19.65-12.78.22 1.3.33 2.5.33 3.59 0 7.39-2.82 14.47-8.47 21.23-5.65 6.75-12.28 10.89-19.89 12.41-.11-1.08-.22-2.25-.33-3.52z" />
  </svg>
);

// ============================================================================
// DATA MODELS & COLOR PALETTE
// ============================================================================
export interface TrelloListModel {
  id: string;
  title: string;
  order: number;
}

export interface TrelloCardModel {
  id: string;
  listId: string;
  title: string;
  description?: string;
  order: number;
  coverColor?: string;
  labels: CardLabel[];
  members: CardMember[];
  dueDate?: string;
  dueComplete?: boolean;
  checklist: ChecklistItem[];
  attachments: CardAttachment[];
  comments: CardComment[];
  activities: CardActivity[];
  subscribed?: boolean;
  isArchived?: boolean;
  createdAt: string;
}

export interface FilterState {
  searchQuery: string;
  selectedLabelIds: string[];
  selectedMemberIds: string[];
  dueDateFilter: 'all' | 'none' | 'overdue' | 'nextDay' | 'nextWeek' | 'completed' | 'incomplete';
}

const COLOR_PALETTE: { id: string; name: string; bg: string; text: string }[] = [
  { id: 'green', name: 'Verde (Pronto / Produção)', bg: '#61BD4F', text: '#ffffff' },
  { id: 'yellow', name: 'Amarelo (Atenção / Revisão)', bg: '#F2D600', text: '#172B4D' },
  { id: 'orange', name: 'Laranja (Alta Prioridade)', bg: '#FF9F1A', text: '#ffffff' },
  { id: 'red', name: 'Vermelho (Bloqueado / Urgente)', bg: '#EB5A46', text: '#ffffff' },
  { id: 'purple', name: 'Roxo (Design / Estratégia)', bg: '#C377E0', text: '#ffffff' },
  { id: 'blue', name: 'Azul (Desenvolvimento)', bg: '#0079BF', text: '#ffffff' },
  { id: 'sky', name: 'Ciano (Infra / DevOps)', bg: '#00C2E0', text: '#172B4D' },
  { id: 'pink', name: 'Rosa (Feedback & QA)', bg: '#FF78CB', text: '#ffffff' },
  { id: 'dark', name: 'Grafite (Documentação)', bg: '#344563', text: '#ffffff' }
];

const WALLPAPER_PRESETS = [
  { id: 'sonoma-dusk', name: 'macOS Sonoma Dusk', style: 'linear-gradient(135deg, #181938 0%, #301f4e 50%, #101226 100%)' },
  { id: 'trello-blue', name: 'Trello Clássico', style: 'linear-gradient(135deg, #0079bf 0%, #5067c5 100%)' },
  { id: 'sequoia-dawn', name: 'macOS Sequoia Dawn', style: 'linear-gradient(135deg, #2b1055 0%, #7597de 50%, #0c0827 100%)' },
  { id: 'dark-obsidian', name: 'Obsidian Minimal', style: 'linear-gradient(135deg, #090B14 0%, #10142B 100%)' },
  { id: 'sunset-amber', name: 'Sunset Amber', style: 'linear-gradient(135deg, #37113e 0%, #901c1c 50%, #c44d00 100%)' }
];

const INITIAL_BOARD_MEMBERS: CardMember[] = [
  { id: 'm1', name: 'Rafael Execução', initials: 'RE', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
  { id: 'm2', name: 'Camila Design', initials: 'CD', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
  { id: 'm3', name: 'Jardel Prog', initials: 'JP' }
];

interface MacDesktopProps {
  project?: Project;
  projectId?: string;
  onSwitchToClassic?: () => void;
  embedded?: boolean;
}

// ============================================================================
// COMPONENT: MacBootSequence (Apple Loading Sequence)
// ============================================================================
const MacBootSequence: React.FC<{ onComplete: () => void; projectName?: string }> = ({
  onComplete,
  projectName = 'Mesa Executiva'
}) => {
  const [progress, setProgress] = useState(0);
  const [bootStep, setBootStep] = useState('Iniciando macOS Workspace...');

  useEffect(() => {
    // Play chime immediately on user click / trigger
    playMacStartupChime();

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 350);
          return 100;
        }

        const next = prev + 4;
        if (next > 25 && next < 55) {
          setBootStep(`Carregando ecossistema de foco para "${projectName}"...`);
        } else if (next >= 55 && next < 85) {
          setBootStep('Inicializando janela do Trello & malha técnica...');
        } else if (next >= 85) {
          setBootStep('Ambiente isolado pronto.');
        }
        return next;
      });
    }, 45);

    return () => clearInterval(interval);
  }, [onComplete, projectName]);

  return (
    <div
      onClick={onComplete}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-white select-none cursor-pointer transition-opacity duration-500"
      title="Clique ou pressione qualquer tecla para pular"
    >
      {/* Centered Apple Logo */}
      <div className="flex flex-col items-center space-y-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
          <AppleLogo className="w-20 h-20 text-white" />
        </div>

        {/* Apple macOS style thin progress bar */}
        <div className="w-56 sm:w-72 space-y-3">
          <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-white rounded-full transition-all duration-75 ease-out shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-[11px] font-mono text-center text-white/50 tracking-wider">
            {bootStep}
          </p>
        </div>
      </div>

      <div className="absolute bottom-8 text-[11px] text-white/30 font-sans">
        Clique para entrar imediatamente
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: MacDesktop
// ============================================================================
export const MacDesktop: React.FC<MacDesktopProps> = ({
  project: propProject,
  projectId: propProjectId,
  onSwitchToClassic,
  embedded = false
}) => {
  const { projects, stages, tasks, navigateTo, userProfile, showToast, updateTask, addTask } = useApp();

  // Find targeted project
  const project = propProject || projects.find((p) => p.id === propProjectId) || projects[0];

  // Boot sequence state: true on entry only if not embedded
  const [booting, setBooting] = useState(!embedded);

  // Live macOS Clock
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const str = now.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
      }) + ' ' + now.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentTime(str);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Board Title
  const [boardTitle, setBoardTitle] = useState(project ? `${project.name} — Mesa Trello` : 'Mesa Executiva (Trello)');
  const [isEditingBoardTitle, setIsEditingBoardTitle] = useState(false);
  const [isStarred, setIsStarred] = useState(true);
  const [currentWallpaper, setCurrentWallpaper] = useState(WALLPAPER_PRESETS[0].style);

  // Window states (Normal, Minimized to Dock, Fullscreen)
  const [windowState, setWindowState] = useState<'normal' | 'minimized' | 'fullscreen'>('normal');

  // Convert Project Stages into Trello Lists, or fallback
  const initialLists: TrelloListModel[] = useMemo(() => {
    if (project) {
      const projectStages = stages
        .filter((s) => s.projectId === project.id)
        .sort((a, b) => a.order - b.order);

      if (projectStages.length > 0) {
        return projectStages.map((s, idx) => ({
          id: s.id,
          title: s.title,
          order: idx
        }));
      }
    }

    return [
      { id: 'list-backlog', title: 'Backlog / Ideias', order: 0 },
      { id: 'list-todo', title: 'A Fazer (To Do)', order: 1 },
      { id: 'list-doing', title: 'Fazendo (In Progress)', order: 2 },
      { id: 'list-review', title: 'Em Revisão', order: 3 },
      { id: 'list-done', title: 'Concluído (Done)', order: 4 }
    ];
  }, [project, stages]);

  const [lists, setLists] = useState<TrelloListModel[]>(initialLists);

  // Sync cards with Project Tasks
  const initialCards: TrelloCardModel[] = useMemo(() => {
    if (project) {
      const projectTasks = tasks.filter((t) => t.projectId === project.id || !t.projectId);
      if (projectTasks.length > 0) {
        return projectTasks.map((t, idx) => ({
          id: t.id,
          listId: t.stageId || lists[0]?.id || 'list-todo',
          title: t.title,
          description: t.description || t.expectedEvidence,
          order: t.order ?? idx,
          coverColor: t.coverColor || (t.status === 'concluida' ? '#61BD4F' : t.status === 'bloqueada' ? '#EB5A46' : undefined),
          labels: t.labels || (t.isNextPhysicalAction ? [{ id: 'lbl-next', name: 'Próxima Ação', color: '#FF9F1A' }] : []),
          members: t.members || [INITIAL_BOARD_MEMBERS[0]],
          dueDate: t.dueDate,
          dueComplete: t.dueComplete ?? t.status === 'concluida',
          checklist: t.checklist || [],
          attachments: t.attachments || [],
          comments: t.comments || [],
          activities: t.activities || [
            { id: `act-init-${t.id}`, text: `Cartão carregado na Mesa Executiva`, createdAt: 'Hoje' }
          ],
          subscribed: true,
          createdAt: t.createdAt
        }));
      }
    }

    // Default template cards
    return [
      {
        id: 'c-1',
        listId: lists[1]?.id || lists[0]?.id,
        title: 'Definir proposta de valor e validar primeiras 5 entrevistas',
        description: 'Falar com donos de pequenas empresas sobre gargalos de execução diária.',
        order: 0,
        coverColor: '#0079BF',
        labels: [{ id: 'l1', name: 'Estratégia', color: '#0079BF' }],
        members: [INITIAL_BOARD_MEMBERS[0]],
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        dueComplete: false,
        checklist: [
          { id: 'chk-1', text: 'Elaborar roteiro de 5 perguntas diretas', done: true },
          { id: 'chk-2', text: 'Gravar notas em áudio ou transcrição', done: false }
        ],
        attachments: [],
        comments: [],
        activities: [],
        subscribed: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'c-2',
        listId: lists[2]?.id || lists[0]?.id,
        title: 'Criar protótipo funcional da tela de execução',
        description: 'Construir a interface do Mac Desktop simulando o ecossistema Trello com busca avançada.',
        order: 0,
        coverColor: '#61BD4F',
        labels: [{ id: 'l2', name: 'Desenvolvimento', color: '#61BD4F' }],
        members: [INITIAL_BOARD_MEMBERS[2]],
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        dueComplete: false,
        checklist: [
          { id: 'chk-3', text: 'Implementar atalhos de teclado (E)', done: true },
          { id: 'chk-4', text: 'Filtros em tempo real por etiquetas', done: true }
        ],
        attachments: [],
        comments: [],
        activities: [],
        subscribed: true,
        createdAt: new Date().toISOString()
      }
    ];
  }, [project, tasks, lists]);

  const [cards, setCards] = useState<TrelloCardModel[]>(initialCards);

  // Label text toggle (Trello signature: click any label toggles text globally)
  const [showLabelText, setShowLabelText] = useState(true);

  // Quick edit & Full modal states
  const [quickEditCard, setQuickEditCard] = useState<TrelloCardModel | null>(null);
  const [quickEditTitle, setQuickEditTitle] = useState('');
  const [activeModalCard, setActiveModalCard] = useState<TrelloCardModel | null>(null);

  // Search & Filter state (REA Evidence Engine)
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    selectedLabelIds: [],
    selectedMemberIds: [],
    dueDateFilter: 'all'
  });

  // Board right drawer
  const [menuDrawerOpen, setMenuDrawerOpen] = useState(false);
  const [activeMenuTab, setActiveMenuTab] = useState<'main' | 'background' | 'activity'>('main');

  // Inline List & Card form states
  const [addingList, setAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [addingCardListId, setAddingCardListId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  // Drag and drop state
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [dragOverListId, setDragOverListId] = useState<string | null>(null);

  // Quick edit 'E' shortcut
  const hoveredCardRef = useRef<TrelloCardModel | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (quickEditCard) setQuickEditCard(null);
        if (activeModalCard) setActiveModalCard(null);
        if (filterOpen) setFilterOpen(false);
        if (menuDrawerOpen) setMenuDrawerOpen(false);
        if (addingList) setAddingList(false);
        if (addingCardListId) setAddingCardListId(null);
      }
      if (
        (e.key === 'e' || e.key === 'E') &&
        !quickEditCard &&
        !activeModalCard &&
        hoveredCardRef.current &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setQuickEditCard(hoveredCardRef.current);
        setQuickEditTitle(hoveredCardRef.current.title);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickEditCard, activeModalCard, filterOpen, menuDrawerOpen, addingList, addingCardListId]);

  // Filter calculation
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery.trim()) count++;
    if (filters.selectedLabelIds.length > 0) count += filters.selectedLabelIds.length;
    if (filters.selectedMemberIds.length > 0) count += filters.selectedMemberIds.length;
    if (filters.dueDateFilter !== 'all') count++;
    return count;
  }, [filters]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      if (card.isArchived) return false;

      // 1. Text Search across title, description, checklist items, and comments
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const inTitle = card.title.toLowerCase().includes(query);
        const inDesc = (card.description || '').toLowerCase().includes(query);
        const inChecklist = card.checklist.some((c) => c.text.toLowerCase().includes(query));
        const inComments = card.comments.some((c) => c.text.toLowerCase().includes(query));
        if (!inTitle && !inDesc && !inChecklist && !inComments) {
          return false;
        }
      }

      // 2. Labels filter
      if (filters.selectedLabelIds.length > 0) {
        const matchesLabel = card.labels.some((l) => filters.selectedLabelIds.includes(l.color));
        if (!matchesLabel) return false;
      }

      // 3. Members filter
      if (filters.selectedMemberIds.length > 0) {
        const matchesMember = card.members.some((m) => filters.selectedMemberIds.includes(m.id));
        if (!matchesMember) return false;
      }

      // 4. Due Date filter
      if (filters.dueDateFilter !== 'all') {
        const now = Date.now();
        const dueTime = card.dueDate ? new Date(card.dueDate).getTime() : null;

        if (filters.dueDateFilter === 'none') {
          if (card.dueDate) return false;
        } else if (filters.dueDateFilter === 'completed') {
          if (!card.dueComplete) return false;
        } else if (filters.dueDateFilter === 'incomplete') {
          if (card.dueComplete || !card.dueDate) return false;
        } else if (filters.dueDateFilter === 'overdue') {
          if (!dueTime || dueTime >= now || card.dueComplete) return false;
        } else if (filters.dueDateFilter === 'nextDay') {
          if (!dueTime || dueTime < now || dueTime > now + 86400000 || card.dueComplete) return false;
        } else if (filters.dueDateFilter === 'nextWeek') {
          if (!dueTime || dueTime < now || dueTime > now + 86400000 * 7 || card.dueComplete) return false;
        }
      }

      return true;
    });
  }, [cards, filters]);

  // List actions
  const handleAddList = () => {
    if (!newListTitle.trim()) return;
    const newList: TrelloListModel = {
      id: `list-${Date.now()}`,
      title: newListTitle.trim(),
      order: lists.length
    };
    setLists((prev) => [...prev, newList]);
    setNewListTitle('');
    setAddingList(false);
    showToast(`Lista "${newList.title}" adicionada`);
  };

  const handleRenameList = (listId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setLists((prev) =>
      prev.map((l) => (l.id === listId ? { ...l, title: newTitle.trim() } : l))
    );
  };

  const handleArchiveList = (listId: string) => {
    const list = lists.find((l) => l.id === listId);
    setLists((prev) => prev.filter((l) => l.id !== listId));
    setCards((prev) =>
      prev.map((c) => (c.listId === listId ? { ...c, isArchived: true } : c))
    );
    showToast(`Lista "${list?.title || ''}" arquivada`);
  };

  const handleSortList = (listId: string, mode: 'date' | 'title') => {
    setCards((prev) => {
      const listCards = prev.filter((c) => c.listId === listId);
      const otherCards = prev.filter((c) => c.listId !== listId);

      const sorted = [...listCards].sort((a, b) => {
        if (mode === 'title') {
          return a.title.localeCompare(b.title);
        } else {
          const tA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const tB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return tB - tA;
        }
      });

      return [...otherCards, ...sorted];
    });
  };

  // Card actions
  const handleAddCard = (listId: string) => {
    if (!newCardTitle.trim()) return;
    const targetList = lists.find((l) => l.id === listId);
    const newCard: TrelloCardModel = {
      id: `card-${Date.now()}`,
      listId,
      title: newCardTitle.trim(),
      description: '',
      order: cards.filter((c) => c.listId === listId).length,
      labels: [],
      members: [INITIAL_BOARD_MEMBERS[0]],
      checklist: [],
      attachments: [],
      comments: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          text: `${userProfile.name} criou este cartão na lista ${targetList?.title || ''}`,
          createdAt: 'Agora mesmo'
        }
      ],
      subscribed: true,
      createdAt: new Date().toISOString()
    };

    setCards((prev) => [...prev, newCard]);

    // Also sync with AppContext tasks if associated with project
    if (project) {
      addTask({
        title: newCard.title,
        projectId: project.id,
        stageId: listId,
        status: 'pronta',
        durationMinutes: 25,
        expectedEvidence: 'Evidência a definir na Mesa',
        isNextPhysicalAction: false
      });
    }

    setNewCardTitle('');
  };

  const handleUpdateCard = (updated: TrelloCardModel) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    if (activeModalCard && activeModalCard.id === updated.id) {
      setActiveModalCard(updated);
    }

    // Sync with AppContext if exists
    if (project && tasks.some((t) => t.id === updated.id)) {
      updateTask(updated.id, {
        title: updated.title,
        description: updated.description,
        checklist: updated.checklist,
        labels: updated.labels,
        dueDate: updated.dueDate,
        dueComplete: updated.dueComplete,
        coverColor: updated.coverColor
      });
    }
  };

  const handleSaveQuickEdit = () => {
    if (!quickEditCard) return;
    if (quickEditTitle.trim()) {
      handleUpdateCard({
        ...quickEditCard,
        title: quickEditTitle.trim()
      });
    }
    setQuickEditCard(null);
  };

  const handleToggleDueComplete = (cardId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === cardId) {
          const nextVal = !c.dueComplete;
          return {
            ...c,
            dueComplete: nextVal,
            activities: [
              {
                id: `act-${Date.now()}`,
                text: `${userProfile.name} marcou a entrega como ${nextVal ? 'concluída' : 'incompleta'}`,
                createdAt: 'Agora mesmo'
              },
              ...c.activities
            ]
          };
        }
        return c;
      })
    );
  };

  // Drag and drop
  const handleDragStart = (cardId: string, e: React.DragEvent) => {
    setDraggedCardId(cardId);
    e.dataTransfer.setData('text/plain', cardId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverList = (listId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverListId !== listId) setDragOverListId(listId);
  };

  const handleDropOnList = (targetListId: string, e: React.DragEvent) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('text/plain') || draggedCardId;
    if (!cardId) return;

    const sourceCard = cards.find((c) => c.id === cardId);
    const targetList = lists.find((l) => l.id === targetListId);

    if (sourceCard && sourceCard.listId !== targetListId) {
      setCards((prev) =>
        prev.map((c) => {
          if (c.id === cardId) {
            return {
              ...c,
              listId: targetListId,
              activities: [
                {
                  id: `act-${Date.now()}`,
                  text: `${userProfile.name} moveu este cartão para ${targetList?.title || ''}`,
                  createdAt: 'Agora mesmo'
                },
                ...c.activities
              ]
            };
          }
          return c;
        })
      );
      showToast(`Cartão movido para ${targetList?.title || ''}`);
    }

    setDraggedCardId(null);
    setDragOverListId(null);
  };

  // If booting, show Apple Mac loading sequence (standalone mode only)
  if (booting && !embedded) {
    return (
      <MacBootSequence
        projectName={project?.name}
        onComplete={() => setBooting(false)}
      />
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: EMBEDDED VIEW IN MACOS WINDOW
  // --------------------------------------------------------------------------
  if (embedded) {
    return (
      <div
        className="w-full h-full flex flex-col overflow-hidden select-none font-sans"
        style={{
          background: currentWallpaper,
          backgroundSize: 'cover'
        }}
      >
        {/* Window Sub-toolbar with board title, tag toggle, members and actions */}
        <div className="h-11 bg-slate-900/85 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 text-white text-xs shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Trello branding & Title */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center shadow-xs">
                <div className="flex gap-0.5 items-start">
                  <div className="w-1.5 h-3 bg-white rounded-2xs" />
                  <div className="w-1.5 h-2 bg-white rounded-2xs" />
                </div>
              </div>
              <span className="text-xs font-bold text-white tracking-tight hidden sm:inline">Trello</span>
              <span className="text-xs text-white/40 hidden sm:inline">•</span>
              <span className="text-xs text-white/80 font-semibold truncate max-w-xs">
                {project?.name || 'Mesa'}
              </span>
            </div>

            {/* Editable Board Title */}
            <div className="flex items-center gap-2 max-w-sm truncate">
              {isEditingBoardTitle ? (
                <input
                  type="text"
                  autoFocus
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  onBlur={() => setIsEditingBoardTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setIsEditingBoardTitle(false);
                  }}
                  className="bg-white/20 border border-white/30 rounded px-2 py-0.5 text-xs font-bold text-white outline-none"
                />
              ) : (
                <button
                  onClick={() => setIsEditingBoardTitle(true)}
                  className="text-xs font-bold text-white hover:bg-white/10 px-2 py-1 rounded transition-colors truncate"
                  title="Clique para renomear quadro"
                >
                  {boardTitle}
                </button>
              )}
              <button
                onClick={() => setIsStarred(!isStarred)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isStarred ? 'text-amber-400 fill-amber-400' : 'text-white/40'}`} />
              </button>
            </div>

            {/* Global label toggle */}
            <button
              onClick={() => setShowLabelText(!showLabelText)}
              title="Alternar exibição de texto nas etiquetas de todos os cartões"
              className="text-[11px] text-white/70 hover:text-white bg-white/10 hover:bg-white/15 px-2 py-1 rounded transition-colors hidden md:flex items-center gap-1"
            >
              <Tag className="w-3 h-3 text-amber-300" />
              <span>{showLabelText ? 'Nomes das Etiquetas' : 'Etiquetas Compactas'}</span>
            </button>
          </div>

          {/* Members, Filters & Controls */}
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                onClick={() => setFilterOpen(true)}
                className="flex items-center gap-1.5 bg-amber-400 text-slate-900 font-bold text-xs px-2.5 py-1 rounded-full shadow-xs cursor-pointer"
              >
                <Filter className="w-3 h-3" />
                <span>{activeFiltersCount}</span>
              </button>
            )}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filterOpen || activeFiltersCount > 0 ? 'bg-white/20 text-white font-bold' : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filtros</span>
            </button>

            <button
              onClick={() => {
                setMenuDrawerOpen(true);
                setActiveMenuTab('main');
              }}
              className="flex items-center gap-1.5 text-xs text-white/80 hover:bg-white/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Menu</span>
            </button>

            <div className="hidden lg:flex items-center -space-x-1.5 ml-1">
              {INITIAL_BOARD_MEMBERS.map((m) => (
                <div
                  key={m.id}
                  title={m.name}
                  className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shadow-xs"
                >
                  {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : m.initials}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast('Link do workspace copiado');
              }}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-2.5 py-1 rounded shadow-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              <span className="hidden md:inline">Compartilhar</span>
            </button>
          </div>
        </div>

        {/* Horizontal Trello Canvas */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex items-start gap-3.5 scroll-smooth custom-scrollbar">
          {lists.map((list) => {
            const listCards = filteredCards.filter((c) => c.listId === list.id);
            const isOver = dragOverListId === list.id;

            return (
              <div
                key={list.id}
                onDragOver={(e) => handleDragOverList(list.id, e)}
                onDrop={(e) => handleDropOnList(list.id, e)}
                className={`w-[272px] sm:w-[280px] shrink-0 bg-[#ebecf0] dark:bg-[#1a1f3c] rounded-xl max-h-full flex flex-col shadow-md border transition-all ${
                  isOver ? 'ring-2 ring-blue-500 bg-blue-50/20' : 'border-slate-300/50 dark:border-white/10'
                }`}
              >
                {/* List Header */}
                <div className="px-3 pt-2.5 pb-2 flex items-center justify-between gap-1">
                  <input
                    type="text"
                    defaultValue={list.title}
                    onBlur={(e) => handleRenameList(list.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    className="bg-transparent font-bold text-sm text-[#172B4D] dark:text-white px-1 py-0.5 rounded hover:bg-white/50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full truncate cursor-pointer focus:cursor-text"
                  />

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                      {listCards.length}
                    </span>

                    <ListOptionsMenu
                      list={list}
                      onArchive={() => handleArchiveList(list.id)}
                      onSort={(mode) => handleSortList(list.id, mode)}
                      onAddCard={() => {
                        setAddingCardListId(list.id);
                        setNewCardTitle('');
                      }}
                    />
                  </div>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2 min-h-[30px] custom-scrollbar">
                  {listCards.map((card) => (
                    <TrelloCardItem
                      key={card.id}
                      card={card}
                      showLabelText={showLabelText}
                      onCardClick={() => setActiveModalCard(card)}
                      onQuickEditClick={(e) => {
                        e.stopPropagation();
                        setQuickEditCard(card);
                        setQuickEditTitle(card.title);
                      }}
                      onToggleDueComplete={(e) => handleToggleDueComplete(card.id, e)}
                      onDragStart={(e) => handleDragStart(card.id, e)}
                      onDragEnd={() => {
                        setDraggedCardId(null);
                        setDragOverListId(null);
                      }}
                      onMouseEnter={() => (hoveredCardRef.current = card)}
                      onMouseLeave={() => {
                        if (hoveredCardRef.current?.id === card.id) hoveredCardRef.current = null;
                      }}
                    />
                  ))}

                  {isOver && draggedCardId && (
                    <div className="h-16 rounded-lg bg-blue-100/60 border-2 border-dashed border-blue-400 animate-pulse" />
                  )}
                </div>

                {/* List Footer */}
                <div className="p-2 pt-1 border-t border-slate-200/50 dark:border-white/5">
                  {addingCardListId === list.id ? (
                    <div className="space-y-2">
                      <textarea
                        autoFocus
                        rows={2}
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddCard(list.id);
                          } else if (e.key === 'Escape') {
                            setAddingCardListId(null);
                          }
                        }}
                        placeholder="Insira um título para este cartão..."
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs resize-none"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddCard(list.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1.5 rounded shadow-xs cursor-pointer transition-colors"
                        >
                          Adicionar cartão
                        </button>
                        <button
                          onClick={() => setAddingCardListId(null)}
                          className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setAddingCardListId(list.id);
                        setNewCardTitle('');
                      }}
                      className="w-full flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/5 px-2 py-1.5 rounded-lg transition-colors cursor-pointer text-left font-medium"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar cartão</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Another List */}
          {addingList ? (
            <div className="w-[272px] sm:w-[280px] shrink-0 bg-[#ebecf0] dark:bg-[#1a1f3c] rounded-xl p-3 shadow-md border border-slate-300/50 dark:border-white/10 space-y-2">
              <input
                type="text"
                autoFocus
                placeholder="Insira o título da lista..."
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddList();
                  if (e.key === 'Escape') setAddingList(false);
                }}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleAddList}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1.5 rounded shadow-xs cursor-pointer transition-colors"
                >
                  Adicionar lista
                </button>
                <button
                  onClick={() => setAddingList(false)}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingList(true)}
              className="w-[272px] sm:w-[280px] shrink-0 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl border border-white/30 flex items-center gap-2 px-4 text-xs font-bold text-white transition-all cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar outra lista</span>
            </button>
          )}
        </div>

        {/* Quick Card Edit Overlay */}
        {quickEditCard && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setQuickEditCard(null)}
          >
            <div
              className="flex flex-col sm:flex-row gap-3 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex-1 bg-white rounded-xl p-3 shadow-2xl border border-slate-200 space-y-2">
                {quickEditCard.coverColor && (
                  <div className="h-10 rounded -mx-3 -mt-3 mb-2" style={{ backgroundColor: quickEditCard.coverColor }} />
                )}
                <textarea
                  autoFocus
                  rows={4}
                  value={quickEditTitle}
                  onChange={(e) => setQuickEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveQuickEdit();
                    }
                  }}
                  className="w-full text-sm font-medium text-slate-900 border-none outline-none resize-none"
                />
                <button
                  onClick={handleSaveQuickEdit}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded shadow-xs transition-colors cursor-pointer"
                >
                  Salvar
                </button>
              </div>
              <div className="flex flex-col gap-1.5 w-44">
                <button
                  onClick={() => {
                    setActiveModalCard(quickEditCard);
                    setQuickEditCard(null);
                  }}
                  className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg backdrop-blur-md transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                  <span>Abrir cartão</span>
                </button>
                <button
                  onClick={() => {
                    setActiveModalCard(quickEditCard);
                    setQuickEditCard(null);
                  }}
                  className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg backdrop-blur-md transition-colors"
                >
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Editar etiquetas</span>
                </button>
                <button
                  onClick={() => {
                    setCards((prev) => prev.map((c) => (c.id === quickEditCard.id ? { ...c, isArchived: true } : c)));
                    setQuickEditCard(null);
                    showToast('Cartão arquivado');
                  }}
                  className="flex items-center gap-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-semibold px-3 py-2 rounded-lg backdrop-blur-md transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Arquivar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Full Trello Card Modal */}
        {activeModalCard && (
          <TrelloCardModal
            card={activeModalCard}
            lists={lists}
            members={INITIAL_BOARD_MEMBERS}
            palette={COLOR_PALETTE}
            onClose={() => setActiveModalCard(null)}
            onUpdate={handleUpdateCard}
            onArchive={() => {
              setCards((prev) => prev.map((c) => (c.id === activeModalCard.id ? { ...c, isArchived: true } : c)));
              setActiveModalCard(null);
              showToast('Cartão arquivado');
            }}
          />
        )}

        {/* Search & Filter Drawer */}
        {filterOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150"
            onClick={() => setFilterOpen(false)}
          >
            <div
              className="w-80 sm:w-96 bg-white dark:bg-slate-900 h-full shadow-2xl p-4 overflow-y-auto space-y-4 border-l border-slate-200 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Filtro de Cartões</h3>
                </div>
                <button onClick={() => setFilterOpen(false)} className="p-1 text-slate-500 hover:text-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Palavra-chave (Pesquisa em Tempo Real)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar títulos, descrições, checklists..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Etiquetas
                </label>
                <div className="space-y-1.5">
                  {COLOR_PALETTE.map((c) => {
                    const isChecked = filters.selectedLabelIds.includes(c.bg);
                    return (
                      <label
                        key={c.id}
                        className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200 cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const next = isChecked
                              ? filters.selectedLabelIds.filter((id) => id !== c.bg)
                              : [...filters.selectedLabelIds, c.bg];
                            setFilters({ ...filters, selectedLabelIds: next });
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="w-4 h-4 rounded-xs shrink-0" style={{ backgroundColor: c.bg }} />
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Data de Entrega
                </label>
                <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  {[
                    { id: 'all', label: 'Todas as datas' },
                    { id: 'none', label: 'Sem data de entrega' },
                    { id: 'overdue', label: 'Atrasadas' },
                    { id: 'nextDay', label: 'Vencem no próximo dia' },
                    { id: 'nextWeek', label: 'Vencem na próxima semana' },
                    { id: 'completed', label: 'Marcadas como concluídas' },
                    { id: 'incomplete', label: 'Não concluídas' }
                  ].map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 p-1 rounded hover:bg-slate-100 cursor-pointer">
                      <input
                        type="radio"
                        name="dueDateFilter"
                        checked={filters.dueDateFilter === opt.id}
                        onChange={() => setFilters({ ...filters, dueDateFilter: opt.id as any })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200">
                <button
                  onClick={() =>
                    setFilters({
                      searchQuery: '',
                      selectedLabelIds: [],
                      selectedMemberIds: [],
                      dueDateFilter: 'all'
                    })
                  }
                  className="w-full text-center text-xs font-bold text-rose-600 hover:text-rose-700 py-2 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  Limpar todos os filtros
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Board Menu Drawer */}
        {menuDrawerOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150"
            onClick={() => setMenuDrawerOpen(false)}
          >
            <div
              className="w-80 sm:w-96 bg-[#f1f2f4] dark:bg-slate-900 h-full shadow-2xl p-4 overflow-y-auto space-y-4 border-l border-slate-300 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-slate-700">
                {activeMenuTab !== 'main' ? (
                  <button
                    onClick={() => setActiveMenuTab('main')}
                    className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Voltar</span>
                  </button>
                ) : (
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Menu do Quadro</h3>
                )}
                <button onClick={() => setMenuDrawerOpen(false)} className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {activeMenuTab === 'main' && (
                <div className="space-y-2">
                  <button
                    onClick={() => setActiveMenuTab('background')}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Palette className="w-4 h-4 text-purple-600" />
                      <span>Alterar tela de fundo</span>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => {
                      setMenuDrawerOpen(false);
                      setFilterOpen(true);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Filter className="w-4 h-4 text-blue-600" />
                      <span>Filtrar cartões</span>
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              )}
              {activeMenuTab === 'background' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Selecione o papel de parede:</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {WALLPAPER_PRESETS.map((wp) => (
                      <button
                        key={wp.id}
                        onClick={() => {
                          setCurrentWallpaper(wp.style);
                          showToast(`Tema alterado para ${wp.name}`);
                        }}
                        className="h-20 rounded-xl overflow-hidden shadow-xs border-2 border-white/40 hover:scale-105 transition-transform flex flex-col justify-end p-2 text-left cursor-pointer"
                        style={{ background: wp.style }}
                      >
                        <span className="text-[10px] font-bold text-white drop-shadow-md">{wp.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: FULL MAC DESKTOP ECOSYSTEM
  // --------------------------------------------------------------------------
  return (
    <div
      className="fixed inset-0 z-40 w-screen h-screen overflow-hidden flex flex-col select-none font-sans"
      style={{
        background: currentWallpaper,
        backgroundSize: 'cover'
      }}
    >
      {/* ====================================================================== */}
      {/* 1. macOS TOP MENU BAR                                                  */}
      {/* ====================================================================== */}
      <header className="h-7 w-full bg-slate-900/75 backdrop-blur-2xl border-b border-white/10 px-3 flex items-center justify-between text-white text-[12px] font-medium z-30 shadow-xs">
        {/* Left Side Menus */}
        <div className="flex items-center gap-4">
          {/* Apple Logo Dropdown */}
          <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
            <AppleLogo className="w-3.5 h-3.5 text-white drop-shadow-xs" />
          </div>

          {/* Project Name (bold macOS app name) */}
          <span className="font-extrabold tracking-tight text-white/95">
            {project?.name || 'Mesa Trello'}
          </span>

          <span className="text-white/60 hover:text-white cursor-pointer hidden sm:inline">
            Arquivo
          </span>
          <span className="text-white/60 hover:text-white cursor-pointer hidden sm:inline">
            Editar
          </span>
          
          {/* View Switcher: Classic Roadmap */}
          {onSwitchToClassic && (
            <button
              onClick={onSwitchToClassic}
              className="text-amber-300 hover:text-amber-200 font-semibold cursor-pointer flex items-center gap-1"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Visão Roadmap</span>
            </button>
          )}

          <span className="text-white/60 hover:text-white cursor-pointer hidden md:inline">
            Janela
          </span>
          <span className="text-white/60 hover:text-white cursor-pointer hidden md:inline">
            Ajuda
          </span>
        </div>

        {/* Right Side Status Icons */}
        <div className="flex items-center gap-3.5 text-white/80 text-[11px]">
          {/* Mode Badge */}
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold text-[10px]">
            <Sparkles className="w-2.5 h-2.5 text-amber-300" />
            <span>Mesa Ativa</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>

          <span className="font-mono tabular-nums">{currentTime}</span>

          <button
            onClick={() => navigateTo('/app/projetos')}
            className="text-[11px] font-bold text-white/70 hover:text-white px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            Sair da Mesa
          </button>
        </div>
      </header>

      {/* ====================================================================== */}
      {/* 2. DESKTOP WORKSPACE (Desktop icons + Centered Trello Window)          */}
      {/* ====================================================================== */}
      <div className="flex-1 relative p-3 sm:p-5 overflow-hidden flex items-center justify-center">
        {/* Desktop Shortcuts (Right side of screen, macOS style) */}
        <div className="absolute top-4 right-4 flex flex-col gap-5 z-10 hidden lg:flex items-center text-center">
          <div
            onClick={() => showToast('Pasta do Projeto vinculada à Mesa')}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-500/80 group-hover:bg-blue-500 flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-md transition-all">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md bg-black/30 px-1.5 py-0.5 rounded">
              Arquivos
            </span>
          </div>

          <div
            onClick={() => onSwitchToClassic?.()}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/80 group-hover:bg-amber-500 flex items-center justify-center shadow-lg border border-white/30 backdrop-blur-md transition-all">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md bg-black/30 px-1.5 py-0.5 rounded">
              Roadmap
            </span>
          </div>

          <div
            onClick={() => showToast('Lixeira do macOS')}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-700/80 group-hover:bg-slate-700 flex items-center justify-center shadow-lg border border-white/20 backdrop-blur-md transition-all">
              <Trash2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-bold text-white drop-shadow-md bg-black/30 px-1.5 py-0.5 rounded">
              Lixeira
            </span>
          </div>
        </div>

        {/* -------------------------------------------------------------------- */}
        {/* FLOATING TRELLO WINDOW (macOS App Window)                             */}
        {/* -------------------------------------------------------------------- */}
        {windowState !== 'minimized' && (
          <div
            className={`w-full bg-[#f1f2f4] dark:bg-[#10142B] rounded-2xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.6)] border border-white/25 flex flex-col transition-all duration-300 ${
              windowState === 'fullscreen'
                ? 'fixed inset-x-0 bottom-0 top-7 rounded-none h-[calc(100vh-1.75rem)] w-full'
                : 'h-[calc(100vh-5.5rem)] max-w-6xl max-h-[920px]'
            }`}
          >
            {/* Window Title Bar */}
            <div className="h-11 bg-slate-900/90 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 text-white shrink-0 z-20">
              {/* Traffic Lights */}
              <div className="flex items-center gap-2.5">
                <div className="flex items-center gap-2 group">
                  <button
                    onClick={() => navigateTo('/app/projetos')}
                    title="Fechar e voltar aos Projetos"
                    className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-2 h-2 text-[#4c0002] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button
                    onClick={() => {
                      setWindowState('minimized');
                      showToast('Janela minimizada no Dock');
                    }}
                    title="Minimizar janela"
                    className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123] hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-2 h-2 text-[#5a3a00] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button
                    onClick={() => setWindowState(windowState === 'fullscreen' ? 'normal' : 'fullscreen')}
                    title="Tela Cheia"
                    className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29] hover:opacity-80 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <Maximize2 className="w-1.5 h-1.5 text-[#004d11] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />

                {/* Trello branding */}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center shadow-xs">
                    <div className="flex gap-0.5 items-start">
                      <div className="w-1.5 h-3 bg-white rounded-2xs" />
                      <div className="w-1.5 h-2 bg-white rounded-2xs" />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-white tracking-tight">Trello</span>
                  <span className="text-xs text-white/40 hidden sm:inline">•</span>
                  <span className="text-xs text-white/70 font-semibold hidden sm:inline truncate max-w-xs">
                    {project?.name || 'Mesa'}
                  </span>
                </div>
              </div>

              {/* Title & Favorite */}
              <div className="flex items-center gap-2 max-w-sm truncate">
                {isEditingBoardTitle ? (
                  <input
                    type="text"
                    autoFocus
                    value={boardTitle}
                    onChange={(e) => setBoardTitle(e.target.value)}
                    onBlur={() => setIsEditingBoardTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingBoardTitle(false);
                    }}
                    className="bg-white/20 border border-white/30 rounded px-2 py-0.5 text-xs font-bold text-white outline-none"
                  />
                ) : (
                  <button
                    onClick={() => setIsEditingBoardTitle(true)}
                    className="text-xs font-bold text-white hover:bg-white/10 px-2 py-1 rounded transition-colors truncate"
                    title="Clique para renomear quadro"
                  >
                    {boardTitle}
                  </button>
                )}

                <button
                  onClick={() => setIsStarred(!isStarred)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isStarred ? 'text-amber-400 fill-amber-400' : 'text-white/40'}`} />
                </button>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <button
                    onClick={() => setFilterOpen(true)}
                    className="flex items-center gap-1.5 bg-amber-400 text-slate-900 font-bold text-xs px-2.5 py-1 rounded-full shadow-xs"
                  >
                    <Filter className="w-3 h-3" />
                    <span>{activeFiltersCount}</span>
                  </button>
                )}

                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors ${
                    filterOpen || activeFiltersCount > 0 ? 'bg-white/20 text-white font-bold' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Filtros</span>
                </button>

                <button
                  onClick={() => {
                    setMenuDrawerOpen(true);
                    setActiveMenuTab('main');
                  }}
                  className="flex items-center gap-1.5 text-xs text-white/80 hover:bg-white/10 px-2.5 py-1 rounded transition-colors"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Menu</span>
                </button>
              </div>
            </div>

            {/* Window Sub-toolbar */}
            <div className="h-11 bg-slate-800/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 text-white text-xs shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Área de Trabalho</span>
                </div>

                {/* Global label toggle */}
                <button
                  onClick={() => setShowLabelText(!showLabelText)}
                  title="Alternar exibição de texto nas etiquetas de todos os cartões"
                  className="text-[11px] text-white/70 hover:text-white bg-white/10 hover:bg-white/15 px-2 py-1 rounded transition-colors hidden md:flex items-center gap-1"
                >
                  <Tag className="w-3 h-3 text-amber-300" />
                  <span>{showLabelText ? 'Nomes das Etiquetas' : 'Etiquetas Compactas'}</span>
                </button>
              </div>

              {/* Members */}
              <div className="flex items-center gap-2">
                <div className="flex items-center -space-x-1.5">
                  {INITIAL_BOARD_MEMBERS.map((m) => (
                    <div
                      key={m.id}
                      title={m.name}
                      className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900 flex items-center justify-center text-[9px] font-bold text-white overflow-hidden shadow-xs"
                    >
                      {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : m.initials}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    showToast('Link do workspace copiado');
                  }}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-2.5 py-1 rounded shadow-xs transition-colors"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </div>

            {/* Horizontal Trello Canvas */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex items-start gap-3.5 scroll-smooth custom-scrollbar">
              {lists.map((list) => {
                const listCards = filteredCards.filter((c) => c.listId === list.id);
                const isOver = dragOverListId === list.id;

                return (
                  <div
                    key={list.id}
                    onDragOver={(e) => handleDragOverList(list.id, e)}
                    onDrop={(e) => handleDropOnList(list.id, e)}
                    className={`w-[272px] sm:w-[280px] shrink-0 bg-[#16181D] rounded-2xl max-h-full flex flex-col shadow-xl border transition-all text-white ${
                      isOver ? 'ring-2 ring-[#D7FF3F] bg-[#D7FF3F]/5 border-[#D7FF3F]/40' : 'border-white/10'
                    }`}
                  >
                    {/* List Header */}
                    <div className="px-3 pt-3 pb-2 flex items-center justify-between gap-1">
                      <input
                        type="text"
                        defaultValue={list.title}
                        onBlur={(e) => handleRenameList(list.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className="bg-transparent font-bold text-sm text-white font-display px-2 py-1 rounded-lg hover:bg-white/5 focus:bg-[#101114] focus:ring-1 focus:ring-[#D7FF3F] outline-none w-full truncate cursor-pointer focus:cursor-text transition-colors"
                      />

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-mono font-bold text-[#D7FF3F] bg-black/60 border border-white/10 px-2 py-0.5 rounded-full tabular-nums">
                          {listCards.length}
                        </span>

                        <ListOptionsMenu
                          list={list}
                          onArchive={() => handleArchiveList(list.id)}
                          onSort={(mode) => handleSortList(list.id, mode)}
                          onAddCard={() => {
                            setAddingCardListId(list.id);
                            setNewCardTitle('');
                          }}
                        />
                      </div>
                    </div>

                    {/* Cards Container */}
                    <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2 min-h-[30px] custom-scrollbar">
                      {listCards.map((card) => (
                        <TrelloCardItem
                          key={card.id}
                          card={card}
                          showLabelText={showLabelText}
                          onCardClick={() => setActiveModalCard(card)}
                          onQuickEditClick={(e) => {
                            e.stopPropagation();
                            setQuickEditCard(card);
                            setQuickEditTitle(card.title);
                          }}
                          onToggleDueComplete={(e) => handleToggleDueComplete(card.id, e)}
                          onDragStart={(e) => handleDragStart(card.id, e)}
                          onDragEnd={() => {
                            setDraggedCardId(null);
                            setDragOverListId(null);
                          }}
                          onMouseEnter={() => (hoveredCardRef.current = card)}
                          onMouseLeave={() => {
                            if (hoveredCardRef.current?.id === card.id) hoveredCardRef.current = null;
                          }}
                        />
                      ))}

                      {isOver && draggedCardId && (
                        <div className="h-16 rounded-xl bg-[#D7FF3F]/10 border-2 border-dashed border-[#D7FF3F]/40 animate-pulse" />
                      )}
                    </div>

                    {/* List Footer */}
                    <div className="p-2.5 pt-1.5 border-t border-white/10">
                      {addingCardListId === list.id ? (
                        <div className="space-y-2">
                          <textarea
                            autoFocus
                            rows={2}
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleAddCard(list.id);
                              } else if (e.key === 'Escape') {
                                setAddingCardListId(null);
                              }
                            }}
                            placeholder="Insira um título para este cartão..."
                            className="w-full bg-[#101114] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-[#8D9298] focus:outline-none focus:border-[#D7FF3F] shadow-sm resize-none"
                          />

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAddCard(list.id)}
                              className="bg-[#D7FF3F] hover:bg-white text-[#101114] font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm cursor-pointer transition-colors"
                            >
                              Adicionar cartão
                            </button>
                            <button
                              onClick={() => setAddingCardListId(null)}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-[#8D9298] hover:text-white transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setAddingCardListId(list.id);
                            setNewCardTitle('');
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-[#8D9298] hover:text-white hover:bg-white/5 text-xs font-semibold transition-colors text-left cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-[#D7FF3F]" />
                          <span>Adicionar um cartão</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add list */}
              <div className="w-[272px] sm:w-[280px] shrink-0">
                {addingList ? (
                  <div className="bg-[#ebecf0] dark:bg-[#1a1f3c] rounded-xl p-3 shadow-md border border-slate-300 dark:border-white/10 space-y-2">
                    <input
                      type="text"
                      autoFocus
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddList();
                        if (e.key === 'Escape') setAddingList(false);
                      }}
                      placeholder="Insira o título da lista..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddList}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3 py-1.5 rounded shadow-xs cursor-pointer transition-colors"
                      >
                        Adicionar lista
                      </button>
                      <button
                        onClick={() => setAddingList(false)}
                        className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingList(true)}
                    className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white font-semibold text-xs px-3 py-2.5 rounded-xl flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar outra lista</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================== */}
      {/* 3. macOS DOCK AT BOTTOM                                                */}
      {/* ====================================================================== */}
      <footer className="h-14 w-full flex items-center justify-center pb-2 pointer-events-none z-30">
        <div className="pointer-events-auto h-12 px-3 rounded-2xl bg-slate-900/80 backdrop-blur-2xl border border-white/15 flex items-center gap-3 shadow-2xl">
          {/* Trello App Icon in Dock */}
          <button
            onClick={() => {
              setWindowState(windowState === 'minimized' ? 'normal' : 'minimized');
            }}
            title="Trello Workspace"
            className="relative flex flex-col items-center group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 p-1 flex items-center justify-center shadow-md border border-blue-400/40 group-hover:-translate-y-1.5 transition-transform">
              <div className="w-full h-full flex gap-1 p-0.5 items-start justify-center">
                <div className="w-1/2 h-full bg-white rounded-xs" />
                <div className="w-1/2 h-2/3 bg-white rounded-xs" />
              </div>
            </div>
            {/* Active Dot under Dock icon */}
            <span className="w-1 h-1 rounded-full bg-white/80 absolute -bottom-1" />
          </button>

          {/* Roadmap Switcher in Dock */}
          {onSwitchToClassic && (
            <button
              onClick={onSwitchToClassic}
              title="Alternar para Visão Roadmap da Mesa"
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-2 flex items-center justify-center shadow-md border border-amber-300/40 hover:-translate-y-1.5 transition-transform cursor-pointer"
            >
              <Compass className="w-5 h-5 text-white" />
            </button>
          )}

          {/* Wallpapers trigger in Dock */}
          <button
            onClick={() => {
              setMenuDrawerOpen(true);
              setActiveMenuTab('background');
            }}
            title="Alterar Papel de Parede"
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 p-2 flex items-center justify-center shadow-md border border-purple-400/40 hover:-translate-y-1.5 transition-transform cursor-pointer"
          >
            <Palette className="w-5 h-5 text-white" />
          </button>

          <div className="w-px h-6 bg-white/15 my-auto" />

          {/* Exit Mesa to Projects */}
          <button
            onClick={() => navigateTo('/app/projetos')}
            title="Sair para lista de Projetos"
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 p-2 flex items-center justify-center shadow-md border border-white/20 hover:-translate-y-1.5 transition-transform cursor-pointer text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
      </footer>

      {/* ====================================================================== */}
      {/* 4. MODALS & OVERLAYS (Quick Edit, Card Modal, Search Drawer)          */}
      {/* ====================================================================== */}

      {/* Quick Card Edit Overlay */}
      {quickEditCard && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setQuickEditCard(null)}
        >
          <div
            className="flex flex-col sm:flex-row gap-3 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex-1 bg-white rounded-xl p-3 shadow-2xl border border-slate-200 space-y-2">
              {quickEditCard.coverColor && (
                <div className="h-10 rounded -mx-3 -mt-3 mb-2" style={{ backgroundColor: quickEditCard.coverColor }} />
              )}
              <textarea
                autoFocus
                rows={4}
                value={quickEditTitle}
                onChange={(e) => setQuickEditTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveQuickEdit();
                  }
                }}
                className="w-full text-sm font-medium text-slate-900 border-none outline-none resize-none"
              />
              <button
                onClick={handleSaveQuickEdit}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded shadow-xs transition-colors cursor-pointer"
              >
                Salvar
              </button>
            </div>

            <div className="flex flex-col gap-1.5 w-44">
              <button
                onClick={() => {
                  setActiveModalCard(quickEditCard);
                  setQuickEditCard(null);
                }}
                className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg backdrop-blur-md transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                <span>Abrir cartão</span>
              </button>
              <button
                onClick={() => {
                  setActiveModalCard(quickEditCard);
                  setQuickEditCard(null);
                }}
                className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg backdrop-blur-md transition-colors"
              >
                <Tag className="w-3.5 h-3.5 text-amber-400" />
                <span>Editar etiquetas</span>
              </button>
              <button
                onClick={() => {
                  setCards((prev) => prev.map((c) => (c.id === quickEditCard.id ? { ...c, isArchived: true } : c)));
                  setQuickEditCard(null);
                  showToast('Cartão arquivado');
                }}
                className="flex items-center gap-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-semibold px-3 py-2 rounded-lg backdrop-blur-md transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Arquivar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Trello Card Modal */}
      {activeModalCard && (
        <TrelloCardModal
          card={activeModalCard}
          lists={lists}
          members={INITIAL_BOARD_MEMBERS}
          palette={COLOR_PALETTE}
          onClose={() => setActiveModalCard(null)}
          onUpdate={handleUpdateCard}
          onArchive={() => {
            setCards((prev) => prev.map((c) => (c.id === activeModalCard.id ? { ...c, isArchived: true } : c)));
            setActiveModalCard(null);
            showToast('Cartão arquivado');
          }}
        />
      )}

      {/* Search & Filter Drawer (REA Evidence Engine) */}
      {filterOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150"
          onClick={() => setFilterOpen(false)}
        >
          <div
            className="w-80 sm:w-96 bg-white dark:bg-slate-900 h-full shadow-2xl p-4 overflow-y-auto space-y-4 border-l border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Filtro de Cartões</h3>
              </div>
              <button onClick={() => setFilterOpen(false)} className="p-1 text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Palavra-chave (Pesquisa em Tempo Real)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar títulos, descrições, checklists..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Etiquetas
              </label>
              <div className="space-y-1.5">
                {COLOR_PALETTE.map((c) => {
                  const isChecked = filters.selectedLabelIds.includes(c.bg);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 text-xs text-slate-800 dark:text-slate-200 cursor-pointer p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const next = isChecked
                            ? filters.selectedLabelIds.filter((id) => id !== c.bg)
                            : [...filters.selectedLabelIds, c.bg];
                          setFilters({ ...filters, selectedLabelIds: next });
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="w-4 h-4 rounded-xs shrink-0" style={{ backgroundColor: c.bg }} />
                      <span className="truncate">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Data de Entrega
              </label>
              <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                {[
                  { id: 'all', label: 'Todas as datas' },
                  { id: 'none', label: 'Sem data de entrega' },
                  { id: 'overdue', label: 'Atrasadas' },
                  { id: 'nextDay', label: 'Vencem no próximo dia' },
                  { id: 'nextWeek', label: 'Vencem na próxima semana' },
                  { id: 'completed', label: 'Marcadas como concluídas' },
                  { id: 'incomplete', label: 'Não concluídas' }
                ].map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 p-1 rounded hover:bg-slate-100 cursor-pointer">
                    <input
                      type="radio"
                      name="dueDateFilter"
                      checked={filters.dueDateFilter === opt.id}
                      onChange={() => setFilters({ ...filters, dueDateFilter: opt.id as any })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <button
                onClick={() =>
                  setFilters({
                    searchQuery: '',
                    selectedLabelIds: [],
                    selectedMemberIds: [],
                    dueDateFilter: 'all'
                  })
                }
                className="w-full text-center text-xs font-bold text-rose-600 hover:text-rose-700 py-2 rounded-lg hover:bg-rose-50 transition-colors"
              >
                Limpar todos os filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Board Menu Drawer */}
      {menuDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex justify-end animate-in fade-in duration-150"
          onClick={() => setMenuDrawerOpen(false)}
        >
          <div
            className="w-80 sm:w-96 bg-[#f1f2f4] dark:bg-slate-900 h-full shadow-2xl p-4 overflow-y-auto space-y-4 border-l border-slate-300 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-300 dark:border-slate-700">
              {activeMenuTab !== 'main' ? (
                <button
                  onClick={() => setActiveMenuTab('main')}
                  className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
              ) : (
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Menu do Quadro</h3>
              )}
              <button onClick={() => setMenuDrawerOpen(false)} className="p-1 text-slate-500 hover:text-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            {activeMenuTab === 'main' && (
              <div className="space-y-2">
                <button
                  onClick={() => setActiveMenuTab('background')}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4 text-purple-600" />
                    <span>Alterar tela de fundo</span>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>

                <button
                  onClick={() => {
                    setMenuDrawerOpen(false);
                    setFilterOpen(true);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span>Filtrar cartões</span>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            )}

            {activeMenuTab === 'background' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">Selecione o papel de parede do macOS:</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {WALLPAPER_PRESETS.map((wp) => (
                    <button
                      key={wp.id}
                      onClick={() => {
                        setCurrentWallpaper(wp.style);
                        showToast(`Tema alterado para ${wp.name}`);
                      }}
                      className="h-20 rounded-xl overflow-hidden shadow-xs border-2 border-white/40 hover:scale-105 transition-transform flex flex-col justify-end p-2 text-left"
                      style={{ background: wp.style }}
                    >
                      <span className="text-[10px] font-bold text-white drop-shadow-md">{wp.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: TrelloCardItem
// ============================================================================
const TrelloCardItem: React.FC<{
  card: TrelloCardModel;
  showLabelText: boolean;
  onCardClick: () => void;
  onQuickEditClick: (e: React.MouseEvent) => void;
  onToggleDueComplete: (e: React.MouseEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}> = ({
  card,
  showLabelText,
  onCardClick,
  onQuickEditClick,
  onToggleDueComplete,
  onDragStart,
  onDragEnd,
  onMouseEnter,
  onMouseLeave
}) => {
  const checklistTotal = card.checklist.length;
  const checklistDone = card.checklist.filter((c) => c.done).length;
  const isChecklistFinished = checklistTotal > 0 && checklistDone === checklistTotal;

  const dueDateInfo = useMemo(() => {
    if (!card.dueDate) return null;
    const date = new Date(card.dueDate);
    const now = Date.now();
    const isOverdue = date.getTime() < now && !card.dueComplete;
    const isDueSoon = date.getTime() >= now && date.getTime() <= now + 86400000 && !card.dueComplete;

    const formatted = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });

    let badgeClass = 'text-[#8D9298] bg-black/40 border border-white/10';
    if (card.dueComplete) {
      badgeClass = 'bg-[#D7FF3F] text-[#101114] font-bold';
    } else if (isOverdue) {
      badgeClass = 'bg-rose-500 text-white font-bold animate-pulse';
    } else if (isDueSoon) {
      badgeClass = 'bg-[#D7FF3F] text-[#101114] font-bold';
    }

    return { formatted, isOverdue, badgeClass };
  }, [card.dueDate, card.dueComplete]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onCardClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="group relative bg-[#101114] rounded-xl p-3 shadow-md hover:shadow-xl border border-white/10 hover:border-white/20 cursor-grab active:cursor-grabbing transition-all select-none text-white"
    >
      {card.coverColor && (
        <div
          className="h-8 rounded-t-lg -mx-3 -mt-3 mb-2 transition-opacity group-hover:opacity-95"
          style={{ backgroundColor: card.coverColor }}
        />
      )}

      {/* Pencil Icon for Quick Edit */}
      <button
        onClick={onQuickEditClick}
        title="Editar rápido (tecla 'E')"
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-[#8D9298] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity border border-white/15 shadow-sm z-10 cursor-pointer"
      >
        <Edit2 className="w-3 h-3" />
      </button>

      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {card.labels.map((lbl) => (
            <span
              key={lbl.id}
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white transition-all ${
                showLabelText ? 'min-w-[40px] text-center' : 'w-8 h-2 text-transparent'
              }`}
              style={{ backgroundColor: lbl.color }}
            >
              {showLabelText ? lbl.name : ''}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs font-semibold text-white leading-snug break-words font-display">
        {card.title}
      </p>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 text-[11px] text-[#8D9298]">
        {card.subscribed && (
          <span title="Seguindo este cartão">
            <Eye className="w-3 h-3 text-[#D7FF3F]" />
          </span>
        )}

        {dueDateInfo && (
          <div
            onClick={onToggleDueComplete}
            title={card.dueComplete ? 'Marcar como incompleto' : 'Marcar como concluído'}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer transition-colors ${dueDateInfo.badgeClass}`}
          >
            <Clock className="w-3 h-3" />
            <span>{dueDateInfo.formatted}</span>
          </div>
        )}

        {Boolean(card.description?.trim()) && (
          <span title="Possui descrição">
            <AlignLeft className="w-3 h-3 text-[#8D9298]" />
          </span>
        )}

        {checklistTotal > 0 && (
          <div
            title={`Checklist: ${checklistDone}/${checklistTotal}`}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${
              isChecklistFinished ? 'bg-[#D7FF3F] text-[#101114] font-bold' : 'text-[#8D9298] bg-black/40 border border-white/10'
            }`}
          >
            <CheckSquare className="w-3 h-3" />
            <span>
              {checklistDone}/{checklistTotal}
            </span>
          </div>
        )}

        {card.attachments.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-mono" title={`${card.attachments.length} anexos`}>
            <Paperclip className="w-3 h-3 text-[#8D9298]" />
            <span>{card.attachments.length}</span>
          </div>
        )}

        {card.comments.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-mono" title={`${card.comments.length} comentários`}>
            <MessageSquare className="w-3 h-3 text-[#8D9298]" />
            <span>{card.comments.length}</span>
          </div>
        )}

        {card.members.length > 0 && (
          <div className="ml-auto flex items-center -space-x-1">
            {card.members.map((m) => (
              <div
                key={m.id}
                title={m.name}
                className="w-5 h-5 rounded-full bg-black/60 text-[#D7FF3F] text-[9px] font-bold flex items-center justify-center border border-white/20 overflow-hidden"
              >
                {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : m.initials}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: ListOptionsMenu
// ============================================================================
const ListOptionsMenu: React.FC<{
  list: TrelloListModel;
  onArchive: () => void;
  onSort: (mode: 'date' | 'title') => void;
  onAddCard: () => void;
}> = ({ list, onArchive, onSort, onAddCard }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-lg text-[#8D9298] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
        aria-label="Opções da lista"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-7 w-52 bg-[#16181D] rounded-xl shadow-2xl border border-white/15 py-1.5 z-30 text-xs text-[#F3F0EB] animate-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 font-bold text-white border-b border-white/10 font-display">
            Ações da Lista
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onAddCard();
            }}
            className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 text-white cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#D7FF3F]" />
            <span>Adicionar cartão...</span>
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onSort('title');
            }}
            className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 text-[#8D9298] hover:text-white cursor-pointer transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8D9298]" />
            <span>Ordenar por título</span>
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onSort('date');
            }}
            className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2 text-[#8D9298] hover:text-white cursor-pointer transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-[#D7FF3F]" />
            <span>Ordenar por data</span>
          </button>
          <div className="my-1 border-t border-white/10" />
          <button
            onClick={() => {
              setOpen(false);
              onArchive();
            }}
            className="w-full text-left px-3 py-2 hover:bg-rose-500/10 text-rose-400 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Arquivar esta lista</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: TrelloCardModal
// ============================================================================
const TrelloCardModal: React.FC<{
  card: TrelloCardModel;
  lists: TrelloListModel[];
  members: CardMember[];
  palette: typeof COLOR_PALETTE;
  onClose: () => void;
  onUpdate: (updated: TrelloCardModel) => void;
  onArchive: () => void;
}> = ({ card, lists, members, palette, onClose, onUpdate, onArchive }) => {
  const { userProfile, showToast } = useApp();

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [activePopover, setActivePopover] = useState<'labels' | 'members' | 'cover' | null>(null);

  const currentList = lists.find((l) => l.id === card.listId);
  const checklistTotal = card.checklist.length;
  const checklistDone = card.checklist.filter((c) => c.done).length;
  const checklistPercent = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  const handleTitleBlur = () => {
    if (title.trim() && title !== card.title) {
      onUpdate({ ...card, title: title.trim() });
    }
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment: CardComment = {
      id: `c-${Date.now()}`,
      author: userProfile.name,
      text: commentText.trim(),
      createdAt: 'Agora mesmo'
    };
    onUpdate({
      ...card,
      comments: [newComment, ...card.comments],
      activities: [
        {
          id: `act-${Date.now()}`,
          text: `${userProfile.name} comentou no cartão`,
          createdAt: 'Agora mesmo'
        },
        ...card.activities
      ]
    });
    setCommentText('');
    showToast('Comentário adicionado');
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-[#16181D] rounded-2xl shadow-2xl border border-white/10 overflow-hidden my-auto max-h-[92vh] flex flex-col text-white animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {card.coverColor && (
          <div className="h-24 w-full relative shrink-0" style={{ backgroundColor: card.coverColor }}>
            <button
              onClick={() => onUpdate({ ...card, coverColor: undefined })}
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-1 rounded-full text-xs cursor-pointer transition-colors"
              title="Remover capa"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-lg sm:text-xl font-bold text-white font-display bg-transparent border-none outline-none focus:bg-white/5 focus:ring-1 focus:ring-[#D7FF3F] rounded-lg px-2 -ml-2 w-full"
              />
              <p className="text-xs text-[#8D9298]">
                na lista <span className="font-semibold text-white underline">{currentList?.title || 'Quadro'}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-[#8D9298] hover:text-white cursor-pointer transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-4 text-xs">
                {card.members.length > 0 && (
                  <div>
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#8D9298] mb-1">Membros</span>
                    <div className="flex items-center gap-1">
                      {card.members.map((m) => (
                        <div
                          key={m.id}
                          className="w-7 h-7 rounded-full bg-black/60 text-[#D7FF3F] font-bold flex items-center justify-center border border-white/20 overflow-hidden text-xs"
                          title={m.name}
                        >
                          {m.avatar ? <img src={m.avatar} alt={m.name} className="w-full h-full object-cover" /> : m.initials}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {card.labels.length > 0 && (
                  <div>
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#8D9298] mb-1">Etiquetas</span>
                    <div className="flex flex-wrap gap-1">
                      {card.labels.map((lbl) => (
                        <span
                          key={lbl.id}
                          className="px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-2xs"
                          style={{ backgroundColor: lbl.color }}
                        >
                          {lbl.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {card.dueDate && (
                  <div>
                    <span className="block text-[11px] font-mono font-bold uppercase tracking-wider text-[#8D9298] mb-1">Data de entrega</span>
                    <div className="flex items-center gap-2 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                      <input
                        type="checkbox"
                        checked={card.dueComplete || false}
                        onChange={() => onUpdate({ ...card, dueComplete: !card.dueComplete })}
                        className="rounded accent-[#D7FF3F]"
                      />
                      <span className="font-semibold text-white">
                        {new Date(card.dueDate).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white font-display">
                    <AlignLeft className="w-4 h-4 text-[#D7FF3F]" />
                    <span>Descrição</span>
                  </div>
                  {!isEditingDesc && (
                    <button
                      onClick={() => setIsEditingDesc(true)}
                      className="text-xs bg-white/10 hover:bg-white/15 text-white font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-white/10"
                    >
                      Editar
                    </button>
                  )}
                </div>

                {isEditingDesc ? (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Adicione uma descrição mais detalhada..."
                      className="w-full bg-[#101114] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-[#8D9298] outline-none focus:border-[#D7FF3F]"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onUpdate({ ...card, description });
                          setIsEditingDesc(false);
                        }}
                        className="bg-[#D7FF3F] hover:bg-white text-[#101114] font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        Salvar
                      </button>
                      <button onClick={() => setIsEditingDesc(false)} className="text-xs text-[#8D9298] hover:text-white px-2 cursor-pointer transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDesc(true)}
                    className="p-3 bg-black/40 rounded-xl min-h-[60px] text-xs text-[#F3F0EB] cursor-pointer border border-white/10 hover:border-white/20 transition-colors"
                  >
                    {card.description ? (
                      <p className="whitespace-pre-line leading-relaxed">{card.description}</p>
                    ) : (
                      <span className="text-[#8D9298] italic">Adicione uma descrição a este cartão...</span>
                    )}
                  </div>
                )}
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-white font-display">
                    <CheckSquare className="w-4 h-4 text-[#D7FF3F]" />
                    <span>Checklist ({checklistDone}/{checklistTotal})</span>
                  </div>
                </div>

                {checklistTotal > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono font-bold text-white tabular-nums w-8">{checklistPercent}%</span>
                    <div className="flex-1 h-2 rounded-full bg-black/50 border border-white/10 overflow-hidden">
                      <div
                        className="h-full transition-all duration-300 rounded-full bg-[#D7FF3F]"
                        style={{ width: `${checklistPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {card.checklist.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-white/5 group border border-transparent hover:border-white/5 transition-colors">
                      <label className="flex items-center gap-2.5 text-xs text-[#F3F0EB] cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={item.done}
                          onChange={() => {
                            const nextChecklist = card.checklist.map((i) =>
                              i.id === item.id ? { ...i, done: !i.done } : i
                            );
                            onUpdate({ ...card, checklist: nextChecklist });
                          }}
                          className="rounded accent-[#D7FF3F] w-4 h-4"
                        />
                        <span className={item.done ? 'line-through text-[#8D9298]' : ''}>{item.text}</span>
                      </label>
                      <button
                        onClick={() =>
                          onUpdate({ ...card, checklist: card.checklist.filter((i) => i.id !== item.id) })
                        }
                        className="opacity-0 group-hover:opacity-100 p-1 text-[#8D9298] hover:text-rose-400 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Adicionar um item..."
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newItemText.trim()) {
                          onUpdate({
                            ...card,
                            checklist: [...card.checklist, { id: `chk-${Date.now()}`, text: newItemText.trim(), done: false }]
                          });
                          setNewItemText('');
                        }
                      }}
                      className="flex-1 bg-[#101114] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#8D9298] outline-none focus:border-[#D7FF3F]"
                    />
                    <button
                      onClick={() => {
                        if (!newItemText.trim()) return;
                        onUpdate({
                          ...card,
                          checklist: [...card.checklist, { id: `chk-${Date.now()}`, text: newItemText.trim(), done: false }]
                        });
                        setNewItemText('');
                      }}
                      className="bg-[#D7FF3F] hover:bg-white text-[#101114] font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-sm font-bold text-white font-display">
                  <MessageSquare className="w-4 h-4 text-[#D7FF3F]" />
                  <span>Comentários</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-black/60 border border-white/15 text-[#D7FF3F] font-bold text-xs flex items-center justify-center shrink-0">
                    {userProfile.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-2">
                    <textarea
                      rows={2}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Escreva um comentário..."
                      className="w-full bg-[#101114] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-[#8D9298] outline-none focus:border-[#D7FF3F]"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim()}
                      className="bg-[#D7FF3F] hover:bg-white disabled:opacity-40 text-[#101114] font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#8D9298] uppercase tracking-wider block mb-2">
                  Adicionar ao cartão
                </span>
                <div className="space-y-1.5 relative">
                  <button
                    onClick={() => setActivePopover(activePopover === 'labels' ? null : 'labels')}
                    className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl text-left border border-white/10 transition-colors cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Etiquetas</span>
                  </button>

                  <button
                    onClick={() => setActivePopover(activePopover === 'cover' ? null : 'cover')}
                    className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl text-left border border-white/10 transition-colors cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-[#8D79FF]" />
                    <span>Capa</span>
                  </button>

                  <button
                    onClick={() => {
                      const newDue = card.dueDate ? undefined : new Date(Date.now() + 86400000 * 2).toISOString();
                      onUpdate({ ...card, dueDate: newDue });
                      showToast(newDue ? 'Data de entrega definida' : 'Data removida');
                    }}
                    className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl text-left border border-white/10 transition-colors cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{card.dueDate ? 'Remover Datas' : 'Datas'}</span>
                  </button>

                  {activePopover === 'labels' && (
                    <div className="absolute left-0 top-10 w-64 bg-[#16181D] rounded-2xl shadow-2xl p-3 border border-white/15 z-50 space-y-2 text-white animate-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <span className="font-bold text-xs text-white font-display">Etiquetas</span>
                        <button onClick={() => setActivePopover(null)} className="p-1 text-[#8D9298] hover:text-white cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="space-y-1">
                        {palette.map((p) => {
                          const active = card.labels.some((l) => l.color === p.bg);
                          return (
                            <button
                              key={p.id}
                              onClick={() => {
                                const exists = card.labels.some((l) => l.color === p.bg);
                                const nextLabels = exists
                                  ? card.labels.filter((l) => l.color !== p.bg)
                                  : [...card.labels, { id: `lbl-${Date.now()}`, name: p.name, color: p.bg }];
                                onUpdate({ ...card, labels: nextLabels });
                              }}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-2xs cursor-pointer transition-transform hover:scale-[1.02]"
                              style={{ backgroundColor: p.bg }}
                            >
                              <span className="truncate">{p.name}</span>
                              {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activePopover === 'cover' && (
                    <div className="absolute left-0 top-20 w-64 bg-[#16181D] rounded-2xl shadow-2xl p-3.5 border border-white/15 z-50 space-y-2.5 text-white animate-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                        <span className="font-bold text-xs text-white font-display">Cores de Capa</span>
                        <button onClick={() => setActivePopover(null)} className="p-1 text-[#8D9298] hover:text-white cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {palette.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              onUpdate({ ...card, coverColor: p.bg });
                              setActivePopover(null);
                            }}
                            className="h-8 rounded-lg shadow-2xs hover:scale-105 transition-transform cursor-pointer border border-white/10"
                            style={{ backgroundColor: p.bg }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono font-bold text-[#8D9298] uppercase tracking-wider block mb-2">
                  Ações
                </span>
                <div className="space-y-1.5">
                  <button
                    onClick={() => {
                      onUpdate({ ...card, subscribed: !card.subscribed });
                      showToast(card.subscribed ? 'Deixou de seguir' : 'Seguindo cartão');
                    }}
                    className="w-full flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold px-3 py-2 rounded-xl text-left border border-white/10 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D7FF3F]" />
                    <span>{card.subscribed ? 'Seguindo ✓' : 'Seguir'}</span>
                  </button>

                  <button
                    onClick={onArchive}
                    className="w-full flex items-center gap-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold px-3 py-2 rounded-xl text-left transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Arquivar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacDesktop;
