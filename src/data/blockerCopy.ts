import { BlockerReason } from '../types';

export interface BlockerOption {
  id: BlockerReason;
  label: string;
  explanation: string;
}

export const BLOCKER_OPTIONS: BlockerOption[] = [
  {
    id: 'falta_tempo',
    label: 'Falta de tempo hoje',
    explanation: 'O dia foi tomado por urgências e não houve uma janela de 20 minutos ininterruptos.'
  },
  {
    id: 'falta_clareza',
    label: 'Falta de clareza',
    explanation: 'Não ficou 100% nítido qual é o primeiro botão a clicar ou documento a abrir.'
  },
  {
    id: 'tarefa_grande',
    label: 'Tarefa grande demais',
    explanation: 'A ação parece um projeto inteiro disfarçado de tarefa e gerou sobrecarga mental.'
  },
  {
    id: 'medo_resistencia',
    label: 'Medo ou resistência interna',
    explanation: 'Desconforto com o julgamento alheio, medo de errar ou de enviar algo imperfeito.'
  },
  {
    id: 'dependencia_terceiro',
    label: 'Dependência de outra pessoa',
    explanation: 'Você precisa de uma resposta, aprovação ou dado de sócio, cliente ou colaborador.'
  },
  {
    id: 'baixa_energia',
    label: 'Baixa energia ou cansaço físico',
    explanation: 'A mente e o corpo estão exaustos e forçar produtividade mental geraria retrabalho.'
  },
  {
    id: 'falta_informacao',
    label: 'Falta de informação ou dado técnico',
    explanation: 'Falta uma senha, um número financeiro ou um documento essencial para avançar.'
  }
];

export const BLOCKER_REASON_LABELS: Record<BlockerReason, string> = {
  falta_tempo: 'Falta de tempo hoje',
  falta_clareza: 'Falta de clareza',
  tarefa_grande: 'Tarefa grande demais',
  medo_resistencia: 'Medo ou resistência interna',
  dependencia_terceiro: 'Dependência de outra pessoa',
  baixa_energia: 'Baixa energia ou cansaço físico',
  falta_informacao: 'Falta de informação ou dado técnico'
};
