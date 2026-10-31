import {
  UserProfile,
  Project,
  Task,
  Decision,
  DifficultConversationScenario,
  ProcessDoc,
  Mission,
  ExecutionPatternKey,
  EbookChapter,
  Stage,
  Idea,
  ChecklistItem
} from '../types';

export const DIAGNOSTIC_PATTERNS: Record<
  ExecutionPatternKey,
  {
    title: string;
    description: string;
    perceivedSigns: string[];
    firstRecommendation: string;
    secondaryAdvice: string;
  }
> = {
  excesso_planejamento: {
    title: 'Excesso de Planejamento (Armadilha da Preparação Contínua)',
    description: 'Você consome tempo refinando cronogramas, pesquisando ferramentas e organizando pastas, acreditando que precisa de mais estrutura antes de dar o primeiro passo físico.',
    perceivedSigns: [
      'Mais de 3 listas de tarefas ou planilhas iniciadas nos últimos 60 dias',
      'Sensação de que o plano ainda não está 100% pronto para ir a campo',
      'Cansaço mental no fim do dia sem ter enviado nada concreto a clientes ou parceiros'
    ],
    firstRecommendation: 'Troque o próximo bloco de planejamento por uma ação física de 10 minutos com saída visível para o mundo externo.',
    secondaryAdvice: 'Planejamento sem entrega é ansiedade disfarçada de método. Seu objetivo de hoje é produzir uma evidência imperfeita.'
  },
  perfeccionismo: {
    title: 'Perfeccionismo Paralisante (Medo do Rascunho Público)',
    description: 'A preocupação em não entregar no padrão mais elevado faz você adiar o envio, revisar infinitamente e travar a liberação de materiais prontos.',
    perceivedSigns: [
      'Projetos 90% prontos que passam semanas sem a última etapa de publicação',
      'Desconforto físico ao pensar em alguém avaliando sua entrega em formato inicial',
      'Refazer o mesmo documento ou layout várias vezes sem acréscimo de valor real'
    ],
    firstRecommendation: 'Adote a regra do "Padrão Mínimo Operacional": defina o critério objetivo de aprovação e pare na primeira versão que cumprir o critério.',
    secondaryAdvice: 'A excelência não é gerada no isolamento da revisão; ela surge da correção rápida em contato com o mundo real.'
  },
  falta_clareza: {
    title: 'Falta de Clareza na Próxima Ação (Névoa de Execução)',
    description: 'Suas tarefas têm nomes genéricos como "marketing", "vendas" ou "organizar finanças", o que impede o cérebro de identificar o movimento físico inicial.',
    perceivedSigns: [
      'Olhar para a lista de afazeres e não saber qual botão apertar primeiro',
      'Sensação de sobrecarga diante de itens que na verdade são projetos inteiros',
      'Alternar entre abas do navegador sem conseguir focar em um único arquivo'
    ],
    firstRecommendation: 'Reescreva a tarefa principal iniciando por um verbo de ação física visível (ex: "Abrir documento X e redigir 5 linhas").',
    secondaryAdvice: 'Se você não sabe qual é o primeiro clique ou o primeiro parágrafo, a tarefa ainda não foi desenhada.'
  },
  excesso_tarefas: {
    title: 'Sobrecarga de Tarefas Concorrentes (Dispersão Frontal)',
    description: 'Você assume compromissos em excesso simultaneamente e tenta empurrar 10 frentes ao mesmo tempo, gerando atrito operacional e estagnação generalizada.',
    perceivedSigns: [
      'Mais de 15 tarefas listadas para um único dia de trabalho',
      'Dificuldade em dizer não a demandas urgentes de terceiros',
      'Sensação constante de estar apagando incêndios enquanto as metas estruturais mofam'
    ],
    firstRecommendation: 'Escolha uma única prioridade dominante para o dia e declare as outras 4 como "pausadas conscientemente".',
    secondaryAdvice: 'Foco não é escolher o que fazer; é tolerar a culpa temporária de deixar tarefas secundárias aguardando.'
  },
  dificuldade_decisao: {
    title: 'Dificuldade de Decisão (Custo do Adiamento Silencioso)',
    description: 'Você mantém decisões estratégicas ou operacionais em aberto por semanas na esperança de obter certezas absolutas que o mercado não oferece.',
    perceivedSigns: [
      'Decisões cruciais (contratação, cancelamento de software, mudança de rota) pendentes há mais de 15 dias',
      'Consulta repetida a opiniões de terceiros sem fechar a posição',
      'Desperdício de caixa ou energia mantendo serviços ou parceiros ineficientes'
    ],
    firstRecommendation: 'Estabeleça a "Decisão Reversível": se o risco for reparável em até 30 dias, decida em até 24 horas.',
    secondaryAdvice: 'Não decidir já é uma decisão — a decisão mais cara e lenta possível.'
  },
  dificuldade_delegacao: {
    title: 'Dificuldade de Delegação (Centralização Operacional)',
    description: 'A crença de que "se eu fizer é mais rápido e fica melhor" prende sua energia em tarefas repetitivas que roubam seu tempo estratégico.',
    perceivedSigns: [
      'Interrupções constantes da equipe para dúvidas banais de procedimento',
      'Trabalhar 10 a 12 horas por dia enquanto colaboradores ficam ociosos ou inseguros',
      'Ausência de padrões mínimos registrados por escrito'
    ],
    firstRecommendation: 'Grave um vídeo ou escreva os 4 passos mínimos de uma tarefa repetitiva e passe a responsabilidade com ponto de acompanhamento claro.',
    secondaryAdvice: 'Delegar não é terceirizar a culpa; é alinhar o padrão mínimo esperado e dar autonomia com data de revisão combinada.'
  },
  conversa_evitada: {
    title: 'Conversa Evitada (Acúmulo de Tensões Interpessoais)',
    description: 'Você adia dar feedbacks diretos, cobrar clientes inadimplentes, alinhar expectativas com sócios ou renegociar contratos por receio de conflito.',
    perceivedSigns: [
      'Desconforto no estômago ao abrir mensagens de determinados clientes ou parceiros',
      'Tolerar comportamentos ou entregas medíocres durante meses sem alinhamento',
      'Ruminar conversas mentalmente durante o banho ou antes de dormir'
    ],
    firstRecommendation: 'Utilize o roteiro de 5 etapas: Fato observável → Impacto no negócio → Pedido direto → Limite objetivo.',
    secondaryAdvice: 'A clareza protege o relacionamento. O silêncio corrói a confiança e o seu caixa.'
  },
  baixa_energia: {
    title: 'Baixa Energia e Sobrecarga Fisiológica (Esgotamento Operacional)',
    description: 'Você tenta forçar produtividade mental quando o corpo e a mente já estão saturados por falta de pausas reais, sono desregulado e tensão constante.',
    perceivedSigns: [
      'Sensação de peso no corpo já nas primeiras horas da manhã',
      'Dificuldade de concentração em textos de mais de dois parágrafos',
      'Uso excessivo de café ou estímulos rápidos para conseguir sentar na cadeira'
    ],
    firstRecommendation: 'Ative o Modo Recuperação hoje: zere a lista de tarefas, escolha apenas 1 microação de 15 minutos e encerre o expediente sem culpa.',
    secondaryAdvice: 'Não tente compensar um mês cansado em uma tarde heroica. A consistência vem da renovação do fôlego.'
  },
  medo_vender: {
    title: 'Medo de Vender e Abordar (Resistência Comercial)',
    description: 'Você prepara o produto, cria posts de conteúdo, mexe no site, mas hesita no momento de enviar a proposta, cobrar o valor justo ou pedir o fechamento.',
    perceivedSigns: [
      'Propostas enviadas que você tem vergonha de acompanhar (follow-up)',
      'Preços defasados que você sabe que não cobrem o estresse da entrega',
      'Excesso de reuniões de alinhamento gratuito sem conversão'
    ],
    firstRecommendation: 'Envie hoje uma mensagem direta e simples para 3 contatos qualificados apresentando sua nova disponibilidade.',
    secondaryAdvice: 'Vender um serviço útil e honesto para quem precisa é um ato de serviço, não de importunação.'
  },
  excesso_ideias: {
    title: 'Excesso de Ideias e Troca de Foco (Efeito Objeto Brilhante)',
    description: 'Toda semana surge uma oportunidade imperdível que faz você abandonar o projeto em andamento antes que ele gere tração ou aprendizado real.',
    perceivedSigns: [
      'Cadernos e aplicativos cheios de novos negócios, domínios comprados e logos criados',
      'Nenhum projeto rodando com clientes recorrentes há mais de 6 meses contínuos',
      'Tédio imediato assim que a fase empolgante de concepção vira rotina operacional'
    ],
    firstRecommendation: 'Crie a pasta "Cofre de Ideias" e estabeleça quarentena obrigatória de 14 dias antes de tocar em qualquer nova iniciativa.',
    secondaryAdvice: 'O lucro e a estabilidade vivem na fase chata da execução sustentada.'
  }
};

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Rafael',
  business: 'Consultoria de Marketing e Crescimento',
  teamSize: '2 pessoas',
  currentMode: 'Normal',
  executionPattern: 'excesso_planejamento',
  dailyMinutes: 30,
  isDemo: true,
  onboardingCompleted: true,
  createdAt: '2026-09-15T09:00:00Z'
};

export function daysAgoISO(n: number): string {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return new Date(Date.now() - n * MS_PER_DAY).toISOString();
}

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Nova oferta de consultoria',
    desiredOutcome: 'Publicar a oferta simplificada e enviar para cinco contatos qualificados da rede',
    deadline: '2026-10-15',
    priority: 'Alta',
    status: 'ativo',
    lastActivityAt: daysAgoISO(1),
    nextAction: 'Abrir o documento de ofertas, escolher um serviço principal e escrever a promessa em três linhas.',
    createdAt: '2026-09-20'
  },
  {
    id: 'proj-2',
    name: 'Padronização do relatório de entrega mensal',
    desiredOutcome: 'Reduzir o tempo de geração do relatório para menos de 40 minutos com checklist padrão',
    deadline: '2026-10-22',
    priority: 'Média',
    status: 'ativo',
    lastActivityAt: daysAgoISO(3),
    nextAction: 'Reunir os 3 últimos relatórios e listar os 5 gráficos essenciais.',
    createdAt: '2026-09-25'
  },
  {
    id: 'proj-3',
    name: 'Reestruturação societária e alinhamento de pró-labore',
    desiredOutcome: 'Definir regras de retirada mensal e formalizar com o contador',
    deadline: '2026-11-01',
    priority: 'Baixa',
    status: 'pausado',
    lastActivityAt: daysAgoISO(14),
    nextAction: 'Agendar conversa objetiva de 30 minutos com o escritório contábil.',
    createdAt: '2026-09-01'
  }
];

export const INITIAL_STAGES: Stage[] = [
  // proj-1: Nova oferta de consultoria
  {
    id: 'stage-1-1',
    projectId: 'proj-1',
    title: 'Diagnóstico da demanda e validação inicial',
    doneCriteria: 'Três conversas exploratórias realizadas com anotações de dor registradas',
    order: 1,
    status: 'concluida',
    createdAt: daysAgoISO(10),
    completedAt: daysAgoISO(4)
  },
  {
    id: 'stage-1-2',
    projectId: 'proj-1',
    title: 'Estruturação do escopo e precificação',
    doneCriteria: 'Documento de uma página com escopo, entregáveis e tabela de preços salvo',
    order: 2,
    status: 'atual',
    createdAt: '2026-09-20T10:00:00Z'
  },
  {
    id: 'stage-1-3',
    projectId: 'proj-1',
    title: 'Envio piloto e primeiras propostas',
    doneCriteria: 'Proposta enviada em PDF assinado para 3 prospects qualificados',
    order: 3,
    status: 'futura',
    createdAt: '2026-09-20T10:00:00Z'
  },
  {
    id: 'stage-1-4',
    projectId: 'proj-1',
    title: 'Fechamento e onboarding dos 2 primeiros clientes',
    doneCriteria: 'Contratos assinados e primeiro pagamento compensado na conta PJ',
    order: 4,
    status: 'futura',
    createdAt: '2026-09-20T10:00:00Z'
  },

  // proj-2: Padronização do relatório de entrega mensal
  {
    id: 'stage-2-1',
    projectId: 'proj-2',
    title: 'Mapeamento das métricas essenciais',
    doneCriteria: 'Lista aprovada com os 5 indicadores obrigatórios e fontes de dados',
    order: 1,
    status: 'atual',
    createdAt: '2026-09-25T10:00:00Z'
  },
  {
    id: 'stage-2-2',
    projectId: 'proj-2',
    title: 'Construção do template no Notion/Docs',
    doneCriteria: 'Template criado com sumário executivo e gráficos pré-formatados',
    order: 2,
    status: 'futura',
    createdAt: '2026-09-25T10:00:00Z'
  },
  {
    id: 'stage-2-3',
    projectId: 'proj-2',
    title: 'Teste prático com 1 cliente ativo',
    doneCriteria: 'Relatório mensal preenchido em menos de 40 minutos e aprovado pelo cliente',
    order: 3,
    status: 'futura',
    createdAt: '2026-09-25T10:00:00Z'
  },

  // proj-3: Reestruturação societária e alinhamento de pró-labore
  {
    id: 'stage-3-1',
    projectId: 'proj-3',
    title: 'Diagnóstico financeiro e capacidade de retirada',
    doneCriteria: 'Planilha de fluxo de caixa dos últimos 6 meses com sobra média apurada',
    order: 1,
    status: 'concluida',
    createdAt: '2026-09-01T10:00:00Z',
    completedAt: '2026-09-10T15:30:00Z'
  },
  {
    id: 'stage-3-2',
    projectId: 'proj-3',
    title: 'Alinhamento com escritório de contabilidade',
    doneCriteria: 'Reunião de 30 min realizada e orientação tributária por escrito recebida',
    order: 2,
    status: 'atual',
    createdAt: '2026-09-01T10:00:00Z'
  },
  {
    id: 'stage-3-3',
    projectId: 'proj-3',
    title: 'Atualização do contrato social e regras bancárias',
    doneCriteria: 'Alteração contratual protocolada na Junta e agendamentos PIX automáticos fixados',
    order: 3,
    status: 'futura',
    createdAt: '2026-09-01T10:00:00Z'
  }
];

export const INITIAL_IDEAS: Idea[] = [
  // proj-1
  {
    id: 'idea-1-1',
    projectId: 'proj-1',
    text: 'Testar tráfego pago no LinkedIn direcionado para diretores de operações',
    createdAt: '2026-10-01T14:00:00Z'
  },
  {
    id: 'idea-1-2',
    projectId: 'proj-1',
    text: 'Criar formulário de aplicação simples no Typeform em vez de proposta longa',
    createdAt: '2026-10-02T11:20:00Z'
  },
  {
    id: 'idea-1-3',
    projectId: 'proj-1',
    text: 'Oferecer garantia de resultado condicional para fechar os primeiros 2 contratos',
    createdAt: '2026-10-03T16:45:00Z'
  },

  // proj-2
  {
    id: 'idea-2-1',
    projectId: 'proj-2',
    text: 'Gravar vídeo de 3 minutos no Loom explicando os gráficos em vez de texto longo',
    createdAt: '2026-10-01T09:30:00Z'
  },
  {
    id: 'idea-2-2',
    projectId: 'proj-2',
    text: 'Automatizar a coleta de dados com webhook direto no Google Sheets',
    createdAt: '2026-10-02T15:10:00Z'
  },

  // proj-3
  {
    id: 'idea-3-1',
    projectId: 'proj-3',
    text: 'Separar conta bancária de reserva tributária para não misturar com despesas correntes',
    createdAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'idea-3-2',
    projectId: 'proj-3',
    text: 'Consultar advogado sobre cláusula de saída em caso de divergência societária futura',
    createdAt: '2026-09-18T14:30:00Z'
  },
  {
    id: 'idea-demo-discarded-1',
    projectId: 'proj-1',
    text: 'Criar podcast semanal sobre consultoria',
    discardedAt: daysAgoISO(4),
    createdAt: daysAgoISO(7)
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Escrever a promessa da oferta em três linhas',
    durationMinutes: 15,
    projectId: 'proj-1',
    projectName: 'Nova oferta de consultoria',
    stageId: 'stage-1-2',
    order: 1,
    status: 'pronta',
    description: 'Definir claramente para quem é, qual problema específico resolve e qual a transformação em até 30 dias.',
    expectedEvidence: 'Documento de texto salvo contendo a promessa clara de 3 linhas',
    minimumVersion: 'Um rascunho de 3 linhas no bloco de notas contendo o público e a promessa central.',
    isNextPhysicalAction: true,
    decisionId: 'dec-2',
    checklist: [
      { id: 'chk-1-1', text: 'Identificar o perfil do cliente ideal mais rentável', done: true },
      { id: 'chk-1-2', text: 'Sintetizar a transformação mensurável em uma frase', done: true },
      { id: 'chk-1-3', text: 'Limitar o escopo em três linhas diretas sem jargões', done: false }
    ],
    createdAt: '2026-10-04'
  },
  {
    id: 'task-2',
    title: 'Filtrar lista de 5 clientes anteriores com maior afinidade para envio da oferta',
    durationMinutes: 20,
    projectId: 'proj-1',
    projectName: 'Nova oferta de consultoria',
    stageId: 'stage-1-2',
    order: 2,
    status: 'pronta',
    description: 'Selecionar clientes que já tiveram resultado comprovado e possuem abertura para nova contratação.',
    expectedEvidence: 'Planilha com 5 nomes, contatos e contexto anotados',
    minimumVersion: '5 nomes com telefone anotados em um papel ou bloco de notas.',
    isNextPhysicalAction: false,
    checklist: [
      { id: 'chk-2-1', text: 'Abrir histórico de contratos dos últimos 12 meses', done: true },
      { id: 'chk-2-2', text: 'Selecionar os 5 contatos com melhor relacionamento', done: false },
      { id: 'chk-2-3', text: 'Anotar o canal de abordagem direta preferencial', done: false }
    ],
    createdAt: '2026-10-04'
  },
  {
    id: 'task-3',
    title: 'Cobrar aprovação da campanha pendente do cliente Alfa',
    durationMinutes: 10,
    status: 'bloqueada',
    blockedReason: 'Cliente não respondeu ao WhatsApp anterior; precisa de roteiro formal por e-mail',
    blockedReasonKey: 'dependencia_terceiro',
    expectedEvidence: 'E-mail formal com prazo de corte enviado e registrado',
    isNextPhysicalAction: false,
    conversationSlug: 'alinhar-expectativas-cliente',
    createdAt: '2026-10-02'
  },
  {
    id: 'task-4',
    title: 'Exportar histórico de contatos da ferramenta antiga antes do cancelamento',
    durationMinutes: 25,
    status: 'pronta',
    expectedEvidence: 'Arquivo .csv baixado na pasta local da empresa',
    minimumVersion: 'Exportar apenas a base ativa dos últimos 6 meses.',
    isNextPhysicalAction: false,
    decisionId: 'dec-1',
    checklist: [
      { id: 'chk-4-1', text: 'Fazer login no painel antigo de automação', done: true },
      { id: 'chk-4-2', text: 'Gerar arquivo de exportação em formato .csv', done: false },
      { id: 'chk-4-3', text: 'Salvar backup no Google Drive na pasta de segurança', done: false }
    ],
    createdAt: '2026-10-03'
  },
  {
    id: 'task-5',
    title: 'Reunir os 3 últimos relatórios e listar os 5 gráficos essenciais',
    durationMinutes: 20,
    projectId: 'proj-2',
    projectName: 'Padronização do relatório de entrega mensal',
    stageId: 'stage-2-1',
    order: 1,
    status: 'em_andamento',
    expectedEvidence: 'Lista de 5 gráficos com métricas-chave anotada no documento padrão',
    minimumVersion: 'Anotar os 5 gráficos essenciais em uma folha.',
    isNextPhysicalAction: true,
    checklist: [
      { id: 'chk-5-1', text: 'Baixar os 3 relatórios anteriores enviados aos clientes', done: true },
      { id: 'chk-5-2', text: 'Identificar as 5 métricas que os clientes mais valorizaram', done: false },
      { id: 'chk-5-3', text: 'Eliminar tabelas secundárias de baixo impacto', done: false }
    ],
    createdAt: '2026-10-04'
  },
  {
    id: 'task-6',
    title: 'Agendar conversa objetiva de 30 minutos com o escritório contábil',
    durationMinutes: 15,
    projectId: 'proj-3',
    projectName: 'Reestruturação societária e alinhamento de pró-labore',
    stageId: 'stage-3-2',
    order: 1,
    status: 'pronta',
    expectedEvidence: 'Convite no Google Calendar aceito pelo contador',
    minimumVersion: 'Enviar mensagem direta pelo WhatsApp para a sócia da contabilidade.',
    isNextPhysicalAction: true,
    checklist: [
      { id: 'chk-6-1', text: 'Listar as 2 dúvidas cruciais sobre limites de retirada', done: true },
      { id: 'chk-6-2', text: 'Enviar mensagem para a contabilidade com 2 opções de horário', done: false }
    ],
    createdAt: '2026-10-04'
  },
  {
    id: 'task-demo-done-1',
    title: 'Realizar 3 entrevistas de diagnóstico de demanda com potenciais clientes',
    durationMinutes: 30,
    projectId: 'proj-1',
    projectName: 'Nova oferta de consultoria',
    stageId: 'stage-1-1',
    order: 1,
    status: 'concluida',
    completedAt: daysAgoISO(2),
    expectedEvidence: 'Anotações de dor e transcrições salvas na pasta da oferta',
    isNextPhysicalAction: false,
    createdAt: daysAgoISO(5)
  },
  {
    id: 'task-demo-done-2',
    title: 'Sintetizar dores recorrentes e validar promessa inicial',
    durationMinutes: 20,
    projectId: 'proj-1',
    projectName: 'Nova oferta de consultoria',
    stageId: 'stage-1-1',
    order: 2,
    status: 'concluida',
    completedAt: daysAgoISO(3),
    expectedEvidence: 'Documento síntese de 1 página com 3 dores principais',
    isNextPhysicalAction: false,
    createdAt: daysAgoISO(5)
  },
  {
    id: 'task-demo-done-3',
    title: 'Auditar os últimos 3 relatórios enviados a clientes',
    durationMinutes: 25,
    projectId: 'proj-2',
    projectName: 'Padronização do relatório de entrega mensal',
    stageId: 'stage-2-1',
    order: 2,
    status: 'concluida',
    completedAt: daysAgoISO(1),
    expectedEvidence: 'Planilha comparativa com tempo médio de elaboração',
    isNextPhysicalAction: false,
    createdAt: daysAgoISO(4)
  },
  {
    id: 'task-demo-done-4',
    title: 'Listar ferramentas gratuitas para geração de gráficos',
    durationMinutes: 15,
    projectId: 'proj-2',
    projectName: 'Padronização do relatório de entrega mensal',
    stageId: 'stage-2-1',
    order: 3,
    status: 'concluida',
    completedAt: daysAgoISO(2),
    expectedEvidence: 'Documento com links e testes de renderização',
    isNextPhysicalAction: false,
    createdAt: daysAgoISO(4)
  },
  {
    id: 'task-demo-archived-1',
    title: 'Pesquisar ferramentas pagas de automação de propostas',
    durationMinutes: 15,
    projectId: 'proj-1',
    projectName: 'Nova oferta de consultoria',
    status: 'arquivada',
    archivedAt: daysAgoISO(3),
    archiveReason: 'Decidido usar formato simples em PDF sem custo adicional de software',
    expectedEvidence: 'Comparativo de preços arquivado',
    isNextPhysicalAction: false,
    createdAt: daysAgoISO(6)
  }
];

export const INITIAL_DECISIONS: Decision[] = [
  {
    id: 'dec-1',
    title: 'Escolher se a ferramenta antiga de automação será cancelada',
    openDays: 12,
    postponeCost: 'R$ 480/mês cobrados no cartão corporativo sem uso real, além de dispersão da base de contatos.',
    missingInformation: 'Verificar se existem fluxos de formulários legados ainda apontando para ela.',
    nextStep: 'Acessar o painel da ferramenta, checar requisições dos últimos 30 dias e baixar backup.',
    reviewDate: 'Amanhã, 14:00',
    status: 'pendente',
    taskId: 'task-4',
    options: [
      {
        label: 'Cancelar imediatamente após backup dos dados',
        pros: 'Economia imediata de R$ 480/mês, redução do ruído de sistemas',
        cons: 'Pode quebrar algum webhook esquecido (fácil de religar se necessário)',
        risk: 'Baixo'
      },
      {
        label: 'Fazer downgrade para o plano gratuito ou básico',
        pros: 'Mantém acesso a dados históricos sem cobrança alta',
        cons: 'Gera pendência mental prolongada',
        risk: 'Baixo'
      },
      {
        label: 'Manter ativa por mais 90 dias',
        pros: 'Nenhum risco de quebra técnica',
        cons: 'Desperdício de quase R$ 1.500 em dinheiro parado',
        risk: 'Médio'
      }
    ]
  },
  {
    id: 'dec-2',
    title: 'Definir modelo de cobrança da consultoria: Fixa mensal vs. Projeto pontual',
    openDays: 19,
    postponeCost: 'Insegurança nas propostas comerciais e perda de clientes que pedem previsibilidade orçamentária.',
    missingInformation: 'Custo hora real da equipe e escopo mínimo viável para entrega sustentável.',
    nextStep: 'Definir pacote único de 3 meses com escopo fechado como teste padrão.',
    reviewDate: 'Sexta-feira, 10:00',
    status: 'pendente',
    projectId: 'proj-1',
    stageId: 'stage-1-2',
    options: [
      {
        label: 'Pacote trimestral com entregas quinzenais pré-definidas',
        pros: 'Previsibilidade financeira e controle de escopo sem surpresas',
        cons: 'Exige maior disciplina de agenda da equipe',
        risk: 'Baixo'
      },
      {
        label: 'Hora avulsa sob demanda',
        pros: 'Fácil de vender no início',
        cons: 'Gera ansiedade de faturamento e reuniões sem fim',
        risk: 'Alto'
      }
    ]
  },
  {
    id: 'dec-3',
    title: 'Escolher se a oferta de consultoria terá garantia incondicional ou condicional',
    openDays: 5,
    postponeCost: 'Atraso na redação da página de proposta.',
    missingInformation: 'Histórico de taxa de sucesso dos projetos anteriores.',
    nextStep: 'Inserir termo de compromisso no contrato.',
    reviewDate: 'Segunda-feira',
    status: 'decidida',
    decidedAt: daysAgoISO(2),
    chosenOption: 'Garantia condicional com base no cumprimento do checklist pelo cliente',
    projectId: 'proj-1',
    options: [
      {
        label: 'Garantia condicional com base no cumprimento do checklist pelo cliente',
        pros: 'Protege o tempo da consultoria e estimula o cliente a executar',
        cons: 'Exige evidência formal de acompanhamento',
        risk: 'Baixo'
      },
      {
        label: 'Sem nenhuma garantia',
        pros: 'Sem risco financeiro de reembolso',
        cons: 'Aumenta atrito na conversão de novos clientes',
        risk: 'Médio'
      }
    ]
  }
];

export const CONVERSATION_SCENARIOS: DifficultConversationScenario[] = [
  {
    id: 'conv-1',
    title: 'Cobrar cliente com pagamento atrasado',
    slug: 'cobrar-cliente',
    category: 'Financeiro',
    summary: 'Como cobrar faturas vencidas mantendo profissionalismo, sem pedir desculpas por exigir o que foi acordado.',
    objective: 'Obter data e comprovante de pagamento imediato ou estabelecer renegociação formal com paralisação das entregas.',
    observableFacts: 'A nota fiscal 142 com vencimento em 28/09 não consta como compensada no nosso sistema financeiro.',
    impact: 'O atraso compromete o cronograma de repasses aos fornecedores e o planejamento operacional da equipe dedicada à sua conta.',
    request: 'Solicitamos o envio do comprovante até hoje às 17h ou o alinhamento do pagamento via Pix na chave institucional.',
    limit: 'Caso o pagamento não seja confirmado até amanhã às 12h, os acessos às campanhas e novas entregas ficarão suspensos conforme cláusula 7 do contrato.',
    alternative: 'Se houver alguma divergência no boleto original, emitimos agora uma guia atualizada com isenção de encargos para liquidação hoje.',
    shortScriptMessage: 'Olá [Nome], tudo bem? Identificamos que a fatura [Número/Mês], com vencimento no dia [Data], ainda não teve a compensação registrada. Para mantermos o cronograma de entregas em dia e regularizarmos o sistema financeiro, peço por gentileza o envio do comprovante até hoje às 17h. Caso precise de nova chave Pix, responda esta mensagem imediatamente. Obrigado pela atenção!'
  },
  {
    id: 'conv-2',
    title: 'Reajustar preço de cliente antigo',
    slug: 'reajustar-preco',
    category: 'Comercial',
    summary: 'Como atualizar valores defasados sem medo de perder o cliente e com justificativa técnica irrefutável.',
    objective: 'Alinhar o novo valor de honorários para o próximo ciclo contratual com 30 dias de antecedência.',
    observableFacts: 'Estamos há 18 meses com o mesmo valor de mensalidade, período em que o escopo de entregas cresceu 40% e a equipe foi reforçada.',
    impact: 'Com o valor defasado, a conta opera no limite da margem, o que impede novos investimentos e suporte prioritário.',
    request: 'Atualizaremos a mensalidade para R$ [Novo Valor] a partir do dia 1º do próximo mês.',
    limit: 'Não conseguimos sustentar o escopo integral e a frequência atual de atendimentos pelo valor defasado anterior.',
    alternative: 'Se o orçamento atual da sua empresa for inflexível, podemos reduzir 2 entregas mensais para manter a mensalidade próxima da atual.',
    shortScriptMessage: 'Olá [Nome], tudo bem? Gostaria de agendar uma breve conversa nesta semana para alinharmos os resultados do último trimestre e o novo ciclo de trabalho. Completamos 18 meses de parceria mantendo os mesmos valores contratuais, enquanto expandimos o escopo e o suporte à sua empresa. A partir do próximo mês, atualizaremos a mensalidade para R$ [Valor]. Tenho horários na quinta às 14h ou sexta às 10h para formalizarmos os detalhes.'
  },
  {
    id: 'conv-3',
    title: 'Dizer não a pedido fora do escopo',
    slug: 'dizer-nao',
    category: 'Operacional',
    summary: 'Como recusar pedidos extras e "favores" sem parecer indelicado, protegendo o tempo da sua equipe.',
    objective: 'Manter o foco no contrato firmado e oferecer canal formal para expansão de demanda caso o cliente deseje.',
    observableFacts: 'A solicitação de [Demanda solicitada] não faz parte do escopo de serviços contratado no plano [Nome].',
    impact: 'Executar essa demanda não prevista comprometeria os prazos das entregas prioritárias acordadas para esta semana.',
    request: 'Vamos focar 100% da energia no prazo da entrega principal aprovada para sexta-feira.',
    limit: 'Minha equipe não pode iniciar essa atividade dentro do fee atual sem desrespeitar os entregáveis do contrato.',
    alternative: 'Podemos orçar essa demanda pontual à parte como um aditivo ou incluí-la no cronograma do próximo mês substituindo outra entrega.',
    shortScriptMessage: 'Olá [Nome]. Analisamos com a equipe técnica o pedido de [Demanda extra]. Como essa atividade não faz parte do escopo contratado, executá-la agora comprometeria a entrega prioritária de [Projeto atual]. Para te atender sem prejudicar o cronograma, posso montar uma proposta de aditivo pontual ou agendá-la para o próximo ciclo contratual. Como prefere proceder?'
  },
  {
    id: 'conv-4',
    title: 'Renegociar prazo com antecedência e clareza',
    slug: 'renegociar-prazo',
    category: 'Gestão de Crise',
    summary: 'Como avisar que a entrega atrasará sem mentir, assumindo a liderança do cronograma com segurança.',
    objective: 'Estabelecer nova data definitiva com plano de mitigação claro, antes do vencimento do prazo original.',
    observableFacts: 'A entrega prevista para amanhã exige validações técnicas adicionais que levarão mais 48 horas de análise.',
    impact: 'Entregar amanhã significaria lançar sem os testes de segurança e com risco de retrabalho na sua base de clientes.',
    request: 'Atualizaremos a entrega oficial para [Nova Data e Horário exatos], com garantia de qualidade total.',
    limit: 'Não abriremos mão da bateria de testes para cumprir um prazo superficial que traga prejuízo operacional.',
    alternative: 'Podemos liberar hoje a visualização da versão beta/rascunho para validação de layout enquanto finalizamos as integrações.',
    shortScriptMessage: 'Olá [Nome]. Entrando em contato proativamente sobre a entrega de [Projeto]. Identificamos na etapa de validação um ponto que exige 48 horas adicionais para garantir que nada falhe no lançamento. Para não comprometer a segurança, ajustamos a data final para [Nova Data, Horário]. Se quiser, posso compartilhar uma prévia do que já está validado hoje às 16h.'
  },
  {
    id: 'conv-5',
    title: 'Pedir ajuda ou apoio estratégico',
    slug: 'pedir-ajuda',
    category: 'Liderança',
    summary: 'Como solicitar mentoria, auxílio de sócios ou colaboração sem parecer fraco ou desorganizado.',
    objective: 'Receber orientação pontual e específica sobre um gargalo bem delimitado.',
    observableFacts: 'Testei 3 abordagens para solucionar o gargalo de [Problema] e em todas cheguei ao mesmo resultado de estagnação.',
    impact: 'Continuar tentando sozinho consome horas do projeto sem garantia de validação técnica.',
    request: 'Preciso de 20 minutos do seu olhar sobre este ponto específico para decidir entre o caminho A e o caminho B.',
    limit: 'Trago os dados já organizados em 1 página; não tomarei seu tempo com introduções longas.',
    alternative: 'Se não tiver disponibilidade para call, posso enviar um áudio de 2 minutos com as opções para você opinar quando puder.',
    shortScriptMessage: '[Nome], estou com um impasse técnico/estratégico em [Projeto]. Já estruturei o cenário e testei os caminhos básicos, mas gostaria de 15 minutos da sua visão experiente para calibrar a decisão entre as opções A e B. Preparei um resumo de meia página com os fatos. Teria disponibilidade de um café rápido ou call curta nesta semana?'
  },
  {
    id: 'conv-6',
    title: 'Dar feedback corretivo a colaborador ou fornecedor',
    slug: 'dar-feedback',
    category: 'Equipe',
    summary: 'Como corrigir erros e alinhar comportamentos sem agressividade e sem rodeios desconfortáveis.',
    objective: 'Restabelecer o padrão operacional mínimo e definir compromisso verificável para a próxima entrega.',
    observableFacts: 'Nas últimas duas entregas de [Tarefa], foram identificados 3 erros de digitação e 1 link quebrado.',
    impact: 'Isso gerou ruído na reunião com o cliente final e transmitiu uma percepção de desatenção da nossa marca.',
    request: 'Preciso que a partir de agora você utilize o checklist de revisão em 4 etapas antes de subir qualquer arquivo.',
    limit: 'Não podemos encaminhar materiais ao cliente que não tenham passado pelo padrão de conferência assinado.',
    alternative: 'Se o tempo alocado para a tarefa estiver curto, me avise antes para calibrarmos o volume de trabalho.',
    shortScriptMessage: '[Nome], preciso alinhar um ponto importante sobre as entregas recentes de [Projeto]. Notei [fato objetivo: ex: erros de dados na planilha]. Isso impacta diretamente a confiança do cliente e o retrabalho interno. Gostaria que a partir de hoje você aplicasse o checklist de conferência antes de marcar como pronto. Podemos revisar juntos o checklist hoje às 15h?'
  },
  {
    id: 'conv-7',
    title: 'Encerrar parceria ou contrato com prestador',
    slug: 'encerrar-parceria',
    category: 'Contratos',
    summary: 'Como demitir prestador ou encerrar sociedade/parceria com respeito e sem margem para drama.',
    objective: 'Finalizar a prestação de serviços dentro do aviso prévio contratual, com transição limpa de dados e acessos.',
    observableFacts: 'Avaliamos a estratégia da empresa para os próximos semestres e decidimos remodelar o setor de [Área].',
    impact: 'O formato atual de contratação deixará de fazer parte da nossa estrutura operacional a partir do fim deste mês.',
    request: 'Conduziremos o encerramento do contrato respeitando o aviso até [Data], com entrega do relatório de transição.',
    limit: 'A decisão de remodelagem da estrutura está tomada pela diretoria e não há espaço para renovação do modelo vigente.',
    alternative: 'Faremos questão de recomendar seu trabalho para demandas pontuais futuras que se enquadrem no seu modelo de atuação.',
    shortScriptMessage: 'Olá [Nome]. Conversamos internamente sobre o direcionamento estratégico da empresa para os próximos períodos e decidimos reestruturar o setor de [Área]. Em função disso, encerraremos nossa parceria ao término do ciclo deste mês, conforme previsto em contrato. Agradeço imensamente sua dedicação até aqui e marcaremos uma conversa de 15 minutos para formalizarmos a transição dos arquivos e acessos.'
  },
  {
    id: 'conv-8',
    title: 'Comunicar um erro grave ao cliente',
    slug: 'comunicar-erro',
    category: 'Gestão de Crise',
    summary: 'Como assumir uma falha imediatamente, antes que o cliente descubra sozinho, apresentando a solução pronta.',
    objective: 'Neutralizar a desconfiança assumindo responsabilidade total e apresentando o plano de reparação em andamento.',
    observableFacts: 'Identificamos hoje às 08h30 que um disparo de e-mail foi realizado com a tag de link invertida.',
    impact: 'Isso direcionou aproximadamente 120 usuários para uma página temporariamente desatualizada.',
    request: 'Peço que nos conceda até as 11h para a publicação da correção e envio da errata bonificada aos contatos afetados.',
    limit: 'Assumimos 100% dos custos técnicos decorrentes da correção sem qualquer ônus para a sua empresa.',
    alternative: 'Caso prefira, suspendemos os disparos do restante do mês para validação conjunta de todos os links.',
    shortScriptMessage: 'Olá [Nome]. Entro em contato para informar com transparência sobre uma falha ocorrida hoje às 08h30: [fato: disparo de e-mail com link inconsistente]. Identificamos o problema internamente antes de qualquer reclamação, já pausamos o fluxo e a correção já está sendo aplicada pela nossa equipe técnica. Às 11h enviarei o relatório com a correção finalizada e a medida de compensação sem nenhum custo para você.'
  }
];

export const INITIAL_PROCESSES: ProcessDoc[] = [
  {
    id: 'proc-1',
    title: 'Onboarding de Novo Cliente de Consultoria',
    trigger: 'Assinatura do contrato digital e confirmação do primeiro pagamento.',
    steps: [
      'Criar pasta compartilhada no Drive com pastas de [Entregáveis], [Atas] e [Brutos]',
      'Enviar formulário diagnóstico com 7 perguntas-chave para o WhatsApp do cliente',
      'Configurar canal de comunicação no Slack ou grupo institucional de acompanhamento',
      'Agendar Reunião de Alinhamento Inicial (Kickoff) de 45 minutos em até 4 dias úteis'
    ],
    responsible: 'Coordenador Operacional',
    minimumStandard: 'O cliente deve receber todos os acessos e mensagem de boas-vindas em até 4 horas úteis após a assinatura.',
    commonMistakes: [
      'Deixar o cliente mais de 24 horas sem nenhum contato após o pagamento',
      'Esquecer de liberar permissão de edição nas pastas do Drive',
      'Fazer reunião sem antes ter as respostas do formulário preenchidas'
    ],
    expectedResult: 'Cliente seguro, integrado e com a reunião de início já confirmada na agenda.',
    delegation: {
      assignee: 'Mariana (Assistente de Projetos)',
      context: 'Garantir que a primeira impressão do cliente transmita excelência e organização imediata.',
      deadline: 'Sempre em até 4 horas úteis pós-venda',
      autonomyLevel: 'Avisar após',
      followUpDate: 'Toda sexta-feira na reunião rápida de equipe'
    },
    createdAt: '2026-09-18'
  },
  {
    id: 'proc-2',
    title: 'Fechamento e Emissão de Notas Fiscais Mensais',
    trigger: 'Todo dia 25 do mês corrente.',
    steps: [
      'Conferir planilha de clientes ativos e verificar se houve cancelamentos ou reajustes',
      'Emitir notas fiscais no emissor da prefeitura municipal',
      'Enviar boletos ou chaves Pix com o PDF da nota anexado por e-mail institucional',
      'Registrar status "Aguardando pagamento" no painel financeiro'
    ],
    responsible: 'Auxiliar Administrativo',
    minimumStandard: '100% das notas emitidas com descrição detalhada conforme exigência do tomador e sem erros de CNPJ.',
    commonMistakes: [
      'Emitir com código de serviço incorreto gerando retenção indevida de ISS',
      'Enviar a nota sem o boleto bancário correspondente'
    ],
    expectedResult: 'Faturamento registrado e cobranças enviadas 5 dias antes do vencimento.',
    createdAt: '2026-09-22'
  }
];

export const MISSIONS_30_DAYS: Mission[] = [
  {
    id: 1,
    day: 1,
    title: 'A Lista do Adiamento Silencioso',
    subtitle: 'Tirar o peso da cabeça e colocar no papel sem tentar resolver tudo hoje.',
    whyItMatters: 'O cérebro gasta energia monumental mantendo tarefas inacabadas em aberto na memória de curto prazo (efeito Zeigarnik). Descarregar em um suporte externo reduz imediatamente a ansiedade.',
    estimatedMinutes: 12,
    reflectionPrompt: 'Quais são as 5 pendências que você mais pensou nos últimos 14 dias enquanto tentava descansar ou fazer outra coisa?',
    practicalAction: 'Pegue papel e caneta ou use o campo abaixo e liste exatamente 5 pendências que você vem empurrando com a barriga.',
    minimalAction: 'Liste apenas 2 pendências que você gostaria de ver resolvidas.',
    expectedEvidence: 'Uma lista com 5 pendências escritas de forma crua, sem julgamento.',
    completed: true,
    userReflection: 'Tenho pensado muito em refazer a proposta comercial, cancelar a ferramenta antiga, cobrar o cliente Alfa e organizar os recibos de setembro.',
    userEvidence: '1. Cancelar ferramenta antiga; 2. Enviar proposta para 5 contatos; 3. Cobrar cliente Alfa; 4. Alinhar pró-labore com contador; 5. Ajustar promessa de vendas.',
    completionDate: '2026-10-04'
  },
  {
    id: 2,
    day: 2,
    title: 'O Primeiro Passo Físico',
    subtitle: 'Transformar intenções vagas em movimentos mecânicos irrecusáveis.',
    whyItMatters: 'O cérebro resiste a comandos como "fazer marketing" porque não existe um músculo para "marketing". O que existe é abrir o navegador, digitar uma frase e clicar em enviar.',
    estimatedMinutes: 15,
    reflectionPrompt: 'Qual é a pendência número 1 da sua lista de ontem? Se uma câmera estivesse gravando você nos primeiros 60 segundos dessa tarefa, o que ela veria?',
    practicalAction: 'Escreva a próxima ação física da tarefa principal iniciando por um verbo mecânico (abrir, escrever, ligar, enviar) e execute apenas esse primeiro minuto.',
    minimalAction: 'Apenas abra o documento ou arquivo onde a tarefa será realizada.',
    expectedEvidence: 'O arquivo aberto com pelo menos uma frase ou parágrafo inicial redigido.',
    completed: false
  },
  {
    id: 3,
    day: 3,
    title: 'A Regra dos Dois Minutos de Bloqueio',
    subtitle: 'Descobrir se a tarefa é difícil ou se você só está sem clareza.',
    whyItMatters: '90% da procrastinação não é preguiça — é fricção cognitiva. Quando a tarefa parece confusa ou grande demais, o sistema límbico foge para o celular.',
    estimatedMinutes: 10,
    reflectionPrompt: 'O que exatamente está te impedindo de concluir a próxima ação? É tempo, medo do resultado ou falta de um dado?',
    practicalAction: 'Identifique o dado ou a decisão que falta. Se for um arquivo, localize-o agora. Se for uma resposta de alguém, redija a pergunta curta.',
    minimalAction: 'Envie uma mensagem de 1 linha pedindo a informação que falta.',
    expectedEvidence: 'A informação necessária anotada ou a mensagem de consulta enviada.',
    completed: false
  },
  {
    id: 4,
    day: 4,
    title: 'O Fim da Multitarefa Heroica',
    subtitle: 'Proteger 45 minutos de execução monotarefa com fechamento de abas.',
    whyItMatters: 'Alternar entre tarefas custa até 40% da capacidade produtiva diária. O empresário exausto frequentemente só esteve hiperfragmentado.',
    estimatedMinutes: 20,
    reflectionPrompt: 'Quantas abas você tem abertas agora? Quantas delas representam compromissos que você não vai honrar hoje?',
    practicalAction: 'Feche todas as abas que não pertencem à prioridade número 1. Ative um timer de 20 minutos e avance sem trocar de tela.',
    minimalAction: 'Feche apenas as 3 abas mais barulhentas e trabalhe 10 minutos sem música com letra ou rede social.',
    expectedEvidence: 'Um avanço visível registrado em um único documento.',
    completed: false
  },
  {
    id: 5,
    day: 5,
    title: 'O Padrão Mínimo Operacional',
    subtitle: 'Entregar o rascunho nota 7 antes de tentar a perfeição nota 10.',
    whyItMatters: 'Um trabalho imperfeito entregue no mercado gera feedback e receita. Um trabalho perfeito imaginado na cabeça gera apenas cansaço.',
    estimatedMinutes: 25,
    reflectionPrompt: 'Qual é o mínimo aceitável que resolve o problema do cliente ou da empresa sem colocar a reputação em risco?',
    practicalAction: 'Defina os 3 critérios inegociáveis dessa entrega e finalize a versão beta hoje.',
    minimalAction: 'Escreva em tópicos o resumo da entrega e aprove para si mesmo como versão 1.',
    expectedEvidence: 'Versão 1 da entrega concluída com os 3 critérios essenciais atendidos.',
    completed: false
  },
  {
    id: 6,
    day: 6,
    title: 'A Conversa que Você Está Evitando',
    subtitle: 'Cobrar, alinhar ou dizer não com clareza cirúrgica.',
    whyItMatters: 'O tamanho da sua empresa e da sua paz mental é medido pelo número de conversas difíceis que você está disposto a ter.',
    estimatedMinutes: 15,
    reflectionPrompt: 'Com quem você precisa ter uma conversa franca que você vem postergando há mais de uma semana?',
    practicalAction: 'Acesse o módulo de Conversas Difíceis, escolha o cenário aplicável e personalize o roteiro objetivo.',
    minimalAction: 'Escreva os 2 fatos objetivos que você precisa apresentar, sem adjetivos acusatórios.',
    expectedEvidence: 'Roteiro de conversa estruturado ou mensagem de alinhamento enviada.',
    completed: false
  },
  {
    id: 7,
    day: 7,
    title: 'A Primeira Revisão Semanal',
    subtitle: 'Olhar o que andou, o que travou e limpar o terreno para a próxima semana.',
    whyItMatters: 'Sem revisão, a culpa do que não foi feito contamina a semana seguinte. A revisão é o ritual que zera a contabilidade mental.',
    estimatedMinutes: 20,
    reflectionPrompt: 'O que de fato saiu do papel nesta semana? Qual decisão ainda está te drenando energia?',
    practicalAction: 'Execute o fluxo de Revisão Semanal: classifique entregas, cancele compromissos fantasmas e eleja a prioridade única da semana seguinte.',
    minimalAction: 'Anote 3 vitórias concretas e risque 2 tarefas que não fazem mais sentido.',
    expectedEvidence: 'Resumo da semana preenchido e primeira ação de segunda-feira definida.',
    completed: false
  },
  {
    id: 8,
    day: 8,
    title: 'O Cofre de Decisões Rápidas',
    subtitle: 'Classificar decisões entre reversíveis e irreversíveis.',
    whyItMatters: 'Decisões reversíveis devem ser tomadas com 70% das informações disponíveis. Esperar 100% é comprar atraso desnecessário.',
    estimatedMinutes: 15,
    reflectionPrompt: 'Essa decisão que você está adiando pode ser desfeita em 30 dias se der errado?',
    practicalAction: 'Se a resposta for sim, tome a decisão hoje antes do almoço e comunique aos envolvidos.',
    minimalAction: 'Escolha uma opção provisória e estabeleça uma data de reavaliação em 14 dias.',
    expectedEvidence: 'Decisão registrada no painel com prazo de revisão agendado.',
    completed: false
  },
  {
    id: 9,
    day: 9,
    title: 'A Primeira Delegação com Padrão',
    subtitle: 'Parar de delargar e entregar contexto, critério e data.',
    whyItMatters: 'A equipe erra quando o gestor passa apenas o comando verbal sem o padrão mínimo de sucesso visual.',
    estimatedMinutes: 20,
    reflectionPrompt: 'Qual tarefa simples você repetiu mais de 3 vezes este mês que alguém poderia executar?',
    practicalAction: 'Escreva os 4 passos sequenciais e grave um vídeo de 3 minutos demonstrando a execução na tela.',
    minimalAction: 'Escreva apenas o gatilho e o resultado esperado da tarefa em 3 linhas.',
    expectedEvidence: 'Checklist da tarefa entregue ao responsável com data combinada de retorno.',
    completed: false
  },
  {
    id: 10,
    day: 10,
    title: 'A Faxina de Compromissos Zumbis',
    subtitle: 'A coragem de cancelar projetos que você já sabe que não vai fazer.',
    whyItMatters: 'Projetos que ficam em banho-maria drenam foco de quem está na linha de frente. Dizer "cancelado" liberta espaço criativo.',
    estimatedMinutes: 15,
    reflectionPrompt: 'Qual ideia ou projeto você carrega há meses por apego, mas que hoje não move o ponteiro do caixa?',
    practicalAction: 'Selecione pelo menos um projeto ou tarefa antiga e mude o status formal para "cancelado".',
    minimalAction: 'Mova para a pasta de quarentena por 90 dias.',
    expectedEvidence: 'Pelo menos 1 projeto cancelado ou arquivado conscientemente.',
    completed: false
  },
  {
    id: 11,
    day: 11,
    title: 'A Oferta Direta para a Rede Quente',
    subtitle: 'Superar a resistência de vender com abordagem humana e objetiva.',
    whyItMatters: 'Vendas curam a maioria dos problemas operacionais de uma empresa. Muitas vezes seu próximo cliente já está no seu catálogo telefônico.',
    estimatedMinutes: 25,
    reflectionPrompt: 'Quem são 3 clientes que já compraram de você ou demonstraram interesse recente?',
    practicalAction: 'Envie uma mensagem pessoal apresentando uma solução para a dor atual deles, sem rodeios corporativos.',
    minimalAction: 'Mande mensagem para apenas 1 contato puxando conversa sobre o momento do negócio dele.',
    expectedEvidence: 'Três mensagens enviadas com comprovante de envio anotado.',
    completed: false
  },
  {
    id: 12,
    day: 12,
    title: 'O Protocolo Anti-Interrupção',
    subtitle: 'Criar uma janela diária de 60 minutos onde ninguém pode te interromper.',
    whyItMatters: 'Se você está acessível o tempo todo para todo mundo, você não lidera seu dia — o dia é liderado pelas notificações alheias.',
    estimatedMinutes: 15,
    reflectionPrompt: 'Em que horário da manhã sua energia mental é mais alta e seu escritório está mais calmo?',
    practicalAction: 'Bloqueie na agenda o "Bloco de Execução Profunda" e avise a equipe que mensagens só serão respondidas após esse bloco.',
    minimalAction: 'Desative as notificações do WhatsApp Web por 30 minutos.',
    expectedEvidence: 'Bloco recorrente criado no calendário com aviso prévio à equipe.',
    completed: false
  },
  {
    id: 13,
    day: 13,
    title: 'A Limpeza do Ambiente de Trabalho',
    subtitle: 'A desordem visual do espaço reflete e alimenta a dispersão interna.',
    whyItMatters: 'Tudo o que está no seu campo visual compete por atenção com a tarefa principal.',
    estimatedMinutes: 15,
    reflectionPrompt: 'O que está em cima da sua mesa agora que não tem relação com o projeto do dia?',
    practicalAction: 'Retire papéis soltos, copos vazios e cabos desnecessários da mesa de trabalho.',
    minimalAction: 'Organize apenas a área direta do teclado e do mouse.',
    expectedEvidence: 'Mesa limpa apenas com os instrumentos de execução do dia.',
    completed: false
  },
  {
    id: 14,
    day: 14,
    title: 'A Segunda Revisão: Calibrando o Ritmo',
    subtitle: 'Avaliar os primeiros 14 dias sem autoengano e sem autopunição.',
    whyItMatters: 'Ajustar o leme a cada 7 dias impede que você navegue duas semanas na direção errada.',
    estimatedMinutes: 20,
    reflectionPrompt: 'O que funcionou melhor nas duas primeiras semanas: blocos curtos ou prazos fechados?',
    practicalAction: 'Complete a revisão da semana 2 e celebre as evidências concretas acumuladas.',
    minimalAction: 'Verifique se seus 3 projetos principais continuam alinhados com o faturamento.',
    expectedEvidence: 'Painel de revisão preenchido com as métricas do ciclo de 14 dias.',
    completed: false
  },
  {
    id: 15,
    day: 15,
    title: 'A Gestão de Energia vs. Gestão de Tempo',
    subtitle: 'Reconhecer seus picos de lucidez e colocar as tarefas pesadas neles.',
    whyItMatters: 'Duas horas com energia baixa rendem menos que 30 minutos com clareza e vigor.',
    estimatedMinutes: 15,
    reflectionPrompt: 'Você costuma render melhor antes das 10h da manhã ou após as 16h da tarde?',
    practicalAction: 'Mova sua tarefa mais adiada para o pico de energia de amanhã e tarefas burocráticas para o pós-almoço.',
    minimalAction: 'Defina a hora exata em que você sentará para a tarefa principal amanhã.',
    expectedEvidence: 'Agenda reorganizada priorizando energia e foco.',
    completed: false
  },
  {
    id: 16,
    day: 16,
    title: 'O Roteiro da Cobrança Firme',
    subtitle: 'Recuperar valores em aberto sem desgastar a imagem da sua empresa.',
    whyItMatters: 'Dinheiro atrasado na conta do cliente é financiamento gratuito com a saúde do seu negócio.',
    estimatedMinutes: 20,
    reflectionPrompt: 'Existe algum valor faturado ou serviço prestado que ainda não foi quitado?',
    practicalAction: 'Envie o roteiro de cobrança profissional com prazo claro de 24 horas para solução.',
    minimalAction: 'Identifique na planilha os clientes inadimplentes e o valor total acumulado.',
    expectedEvidence: 'Comprovante do envio formal da cobrança com data limite registrada.',
    completed: false
  },
  {
    id: 17,
    day: 17,
    title: 'O Checklist à Prova de Falhas',
    subtitle: 'Documentar o processo mais crítico da empresa em 5 passos visíveis.',
    whyItMatters: 'Pilotos de avião e cirurgiões usam checklists não por falta de memória, mas por respeito à complexidade.',
    estimatedMinutes: 25,
    reflectionPrompt: 'Qual erro foi cometido pela equipe recentemente que poderia ter sido evitado com uma lista de conferência?',
    practicalAction: 'Crie um checklist de 5 itens no módulo de Processos e teste com a próxima entrega.',
    minimalAction: 'Escreva em 3 tópicos os erros mais frequentes a serem evitados.',
    expectedEvidence: 'Checklist publicado e disponível para a equipe.',
    completed: false
  },
  {
    id: 18,
    day: 18,
    title: 'O Contrato de Conclusão com um Par',
    subtitle: 'Usar a prestação de contas externa para blindar a execução.',
    whyItMatters: 'Quando nos comprometemos apenas conosco, é fácil negociar e ceder. Com um par responsável, o compromisso ganha peso.',
    estimatedMinutes: 15,
    reflectionPrompt: 'Quem é o empreendedor da sua confiança que você respeita e que não aceitaria suas desculpas?',
    practicalAction: 'Envie uma mensagem: "Até as 18h vou te enviar o print da evidência de X. Se eu não mandar, te devo um almoço."',
    minimalAction: 'Compartilhe sua meta do dia com alguém próximo da sua confiança.',
    expectedEvidence: 'Mensagem de compromisso enviada ao parceiro de execução.',
    completed: false
  },
  {
    id: 19,
    day: 19,
    title: 'O Limite do Sim Automático',
    subtitle: 'Aprender a pausar 10 minutos antes de aceitar novos convites e demandas.',
    whyItMatters: 'Toda vez que você diz sim sem pensar para alguém, você está dizendo não para a prioridade da sua própria empresa.',
    estimatedMinutes: 10,
    reflectionPrompt: 'Qual compromisso você aceitou recentemente e se arrependeu 5 minutos depois?',
    practicalAction: 'Adote a frase padrão: "Vou consultar minha agenda e prioridades da semana e te respondo até o fim do dia."',
    minimalAction: 'Pratique a resposta padrão em voz alta uma vez.',
    expectedEvidence: 'Regra de filtro mental anotada e colocada à vista.',
    completed: false
  },
  {
    id: 20,
    day: 20,
    title: 'A Eliminação de Custos Silenciosos',
    subtitle: 'Cortar assinaturas e ferramentas que viraram débito automático sem uso.',
    whyItMatters: 'Reduzir R$ 500 de custo fixo inútil tem o mesmo impacto na margem líquida que vender R$ 2.500 a mais.',
    estimatedMinutes: 20,
    reflectionPrompt: 'Quais softwares ou assinaturas corporativas você não abriu nos últimos 30 dias?',
    practicalAction: 'Abra a fatura do cartão corporativo e cancele agora pelo menos duas assinaturas esquecidas.',
    minimalAction: 'Liste as assinaturas ativas e marque as suspeitas com interrogação.',
    expectedEvidence: 'Pelo menos uma assinatura cancelada ou renegociada com economia registrada.',
    completed: false
  },
  {
    id: 21,
    day: 21,
    title: 'A Terceira Revisão: Reta Final',
    subtitle: 'Identificar o que falta para fechar o ciclo de 30 dias com chave de ouro.',
    whyItMatters: 'Três semanas de consistência começam a transformar o comportamento em identidade operacional.',
    estimatedMinutes: 20,
    reflectionPrompt: 'Você se sente mais no controle dos seus dias hoje do que há 21 dias?',
    practicalAction: 'Preencha a revisão semanal e verifique se sua tarefa mais antiga ainda resiste.',
    minimalAction: 'Escolha a única pendência estrutural que precisa morrer nesta semana.',
    expectedEvidence: 'Revisão da semana 3 salva no sistema.',
    completed: false
  },
  {
    id: 22,
    day: 22,
    title: 'O Modelo de Feedback E.P.A.',
    subtitle: 'Evidência, Percepção e Ação: como alinhar expectativas com parceiros.',
    whyItMatters: 'Feedback sem evidência parece perseguição; feedback com evidência vira oportunidade de crescimento mútuo.',
    estimatedMinutes: 20,
    reflectionPrompt: 'Quem na sua operação precisa de um direcionamento claro sobre a qualidade do trabalho?',
    practicalAction: 'Monte o roteiro de feedback no módulo de Conversas Difíceis e agende o horário da conversa.',
    minimalAction: 'Anote a evidência concreta do comportamento a ser corrigido.',
    expectedEvidence: 'Roteiro de alinhamento estruturado com a equipe.',
    completed: false
  },
  {
    id: 23,
    day: 23,
    title: 'A Retomada sem Culpa',
    subtitle: 'Aprender o que fazer quando um dia sai completamente dos trilhos.',
    whyItMatters: 'Dias ruins acontecem para todo mundo. O que separa o amador do profissional é o tempo que ele leva para voltar ao trilho.',
    estimatedMinutes: 15,
    reflectionPrompt: 'Quando as coisas dão errado, você costuma chutar o balde ou busca uma saída mínima?',
    practicalAction: 'Ative o Modo Recuperação, selecione uma única tarefa de 10 minutos e execute-a para restabelecer a autoeficácia.',
    minimalAction: 'Respire fundo, beba um copo de água e anote apenas a primeira ação de amanhã.',
    expectedEvidence: 'Uma microação concluída com sucesso após um dia truncado.',
    completed: false
  },
  {
    id: 24,
    day: 24,
    title: 'A Formalização de Entregas',
    subtitle: 'Nunca encerrar um trabalho sem registrar a evidência de conclusão.',
    whyItMatters: 'Clientes valorizam o que é comunicado e documentado. Se você entrega sem formalizar, o cliente esquece o valor gerado.',
    estimatedMinutes: 20,
    reflectionPrompt: 'Quantas entregas foram feitas no último mês sem um e-mail formal de fechamento ou ata de entrega?',
    practicalAction: 'Envie um e-mail de fechamento para um cliente com os marcos atingidos e o próximo passo recomendado.',
    minimalAction: 'Monte o modelo padrão de e-mail de entrega da sua empresa.',
    expectedEvidence: 'E-mail de fechamento enviado e arquivado no processo.',
    completed: false
  },
  {
    id: 25,
    day: 25,
    title: 'A Blindagem contra Urgências Artificiais',
    subtitle: 'Filtrar o que é urgente para os outros do que é importante para o seu negócio.',
    whyItMatters: 'A falta de planejamento dos outros não pode virar a urgência da sua tarde.',
    estimatedMinutes: 15,
    reflectionPrompt: 'Qual urgência te tirou do trilho ontem que no fim do dia não mudou nada?',
    practicalAction: 'Defina a regra das 4 horas: nenhuma solicitação não agendada é atendida em menos de 4 horas sem autorização expressa.',
    minimalAction: 'Avise seus clientes dos horários oficiais de atendimento e resposta.',
    expectedEvidence: 'Comunicado de política de atendimento revisado.',
    completed: false
  },
  {
    id: 26,
    day: 26,
    title: 'A Padronização do Financeiro Semanal',
    subtitle: 'Gastar 30 minutos na sexta para não passar o fim de semana com medo das contas.',
    whyItMatters: 'A clareza financeira é o maior ansiolítico para o sono do empresário.',
    estimatedMinutes: 25,
    reflectionPrompt: 'Você sabe exatamente quanto tem a receber e a pagar nos próximos 15 dias?',
    practicalAction: 'Abra as contas bancárias, atualize as entradas e saídas e anote o saldo projetado.',
    minimalAction: 'Verifique se não há boletos vencidos esquecidos na caixa de entrada.',
    expectedEvidence: 'Projeção de fluxo de caixa para 15 dias anotada no sistema.',
    completed: false
  },
  {
    id: 27,
    day: 27,
    title: 'O Encerramento de Ciclos Abertos',
    subtitle: 'Cobrar retornos pendentes para esvaziar a gaveta das incertezas.',
    whyItMatters: 'Ficar esperando a resposta de alguém impede o planejamento das semanas seguintes.',
    estimatedMinutes: 20,
    reflectionPrompt: 'Quantas propostas ou conversas estão paradas aguardando a decisão da outra parte?',
    practicalAction: 'Envie a mensagem de "corte limpo": "Olá [Nome], para planejarmos nossa agenda, preciso saber se avançaremos com a proposta até amanhã ou se arquivamos o projeto."',
    minimalAction: 'Envie para pelo menos 1 contato em aberto.',
    expectedEvidence: 'Mensagem de corte limpo enviada para os contatos em aberto.',
    completed: false
  },
  {
    id: 28,
    day: 28,
    title: 'A Quarta Revisão Semanal: O Mapa do Mês',
    subtitle: 'Consolidar as entregas dos 28 dias e mensurar o avanço real conquistado.',
    whyItMatters: 'Você realizou em 4 semanas o que muitas vezes ficava adormecido durante 6 meses.',
    estimatedMinutes: 25,
    reflectionPrompt: 'Quantas decisões difíceis foram tomadas? Quantas entregas foram formalizadas?',
    practicalAction: 'Execute a revisão mensal completa e calcule o valor financeiro e operacional destravado.',
    minimalAction: 'Anote as 5 maiores conquistas do ciclo de 30 dias.',
    expectedEvidence: 'Relatório de fechamento dos 28 dias completo.',
    completed: false
  },
  {
    id: 29,
    day: 29,
    title: 'A Estrutura do Mês Seguinte',
    subtitle: 'Definir os 3 projetos dominantes do próximo ciclo de 30 dias.',
    whyItMatters: 'O sucesso de um mês é desenhado nos últimos dois dias do mês anterior.',
    estimatedMinutes: 25,
    reflectionPrompt: 'Quais são as 3 grandes batalhas operacionais e comerciais do próximo mês?',
    practicalAction: 'Cadastre os 3 novos projetos no sistema com o resultado desejado e a próxima ação física de cada um.',
    minimalAction: 'Defina pelo menos o projeto número 1 do próximo mês.',
    expectedEvidence: 'Projetos cadastrados com resultados inegociáveis definidos.',
    completed: false
  },
  {
    id: 30,
    day: 30,
    title: 'A Consagração do Modo Execução',
    subtitle: 'Da intenção à entrega: consolidar sua nova postura como empreendedor.',
    whyItMatters: 'Você provou que não precisa de motivação cósmica; precisa apenas de um método claro, um primeiro passo físico e respeito ao seu tempo.',
    estimatedMinutes: 30,
    reflectionPrompt: 'O que mudou na sua relação com tarefas difíceis e decisões acumuladas?',
    practicalAction: 'Escreva seu Manifesto Pessoal de Execução: 3 princípios que você nunca mais vai negociar na sua rotina profissional.',
    minimalAction: 'Escreva um parágrafo sobre a principal lição aprendida nesses 30 dias.',
    expectedEvidence: 'Manifesto de Execução gravado e salvo na biblioteca pessoal.',
    completed: false
  }
];

export const EBOOK_CHAPTERS: EbookChapter[] = [
  {
    id: 1,
    day: 1,
    title: 'Capítulo 1: O Custo Invisível de Carregar Pendências na Cabeça',
    readingTimeMin: 7,
    coreLesson: 'Toda tarefa não resolvida opera como um aplicativo aberto em segundo plano gastando a bateria do seu cérebro. Escrever descarrega a tensão.',
    quote: '"Não é falta de capacidade; é saturação de circuitos abertos que nunca encontram um ponto de fechamento."',
    audioDurationMin: 6,
    summaryBulletPoints: [
      'O efeito Zeigarnik e a obsessão biológica por ciclos inacabados',
      'Por que o empresário acorda cansado mesmo dormindo 8 horas',
      'A diferença entre armazenar compromissos e executá-los com evidência'
    ]
  },
  {
    id: 2,
    day: 2,
    title: 'Capítulo 2: A Ilusão da Motivação e a Anatomia da Próxima Ação',
    readingTimeMin: 9,
    coreLesson: 'A motivação não precede a ação; a motivação é uma consequência neuroquímica do movimento físico inicial.',
    quote: '"Você não precisa sentir vontade de fazer. Você precisa apenas posicionar os dedos no teclado e digitar a primeira linha."',
    audioDurationMin: 8,
    summaryBulletPoints: [
      'Por que seu cérebro tem pavor de termos amplos como "marketing" ou "planejamento"',
      'Como descer qualquer projeto ao nível do menor movimento muscular observável',
      'A mecânica dos primeiros 120 segundos de fricção'
    ]
  },
  {
    id: 3,
    day: 3,
    title: 'Capítulo 3: Fricção Cognitiva: Por que Você Foge para o Celular',
    readingTimeMin: 8,
    coreLesson: 'A procrastinação quase sempre é um pedido de socorro contra a ambiguidade. Quando a rota é turva, o cérebro escolhe a dopamina barata.',
    quote: '"Onde não há clareza operacional, a distração torna-se irresistível."',
    audioDurationMin: 7,
    summaryBulletPoints: [
      'Como identificar se o bloqueio é falta de informação, tarefa inchada ou medo',
      'O teste dos 2 minutos para desvendar o verdadeiro obstáculo',
      'A técnica da redução de missão para dias de baixa tolerância'
    ]
  },
  {
    id: 4,
    day: 4,
    title: 'Capítulo 4: A Monotarefa Radical em um Mundo Fragmentado',
    readingTimeMin: 8,
    coreLesson: 'Alternar abas a cada 3 minutos destrói a substância do pensamento executivo. A profundidade exige isolamento intencional.',
    quote: '"Quem atende a todos em tempo real não constrói nada de valor no longo prazo."',
    audioDurationMin: 7,
    summaryBulletPoints: [
      'O custo de troca de contexto e a ilusão da agilidade multitarefa',
      'Como estruturar blocos inegociáveis de 45 minutos no dia a dia',
      'Blindagem de notificações e comunicação assíncrona'
    ]
  },
  {
    id: 5,
    day: 5,
    title: 'Capítulo 5: O Padrão Mínimo Operacional e o Fim do Rascunho Infinito',
    readingTimeMin: 10,
    coreLesson: 'O perfeccionismo é a forma mais refinada de covardia: ele nos protege de sermos julgados às custas de nunca sermos comprados.',
    quote: '"O mercado premia quem resolve com rapidez, não quem rumina na solidão."',
    audioDurationMin: 9,
    summaryBulletPoints: [
      'Definição prática do critério "bom o bastante para ir a campo"',
      'Como validar com 5 clientes reais antes de criar sistemas complexos',
      'A libertação de entregar a versão beta com orgulho adulto'
    ]
  }
];
