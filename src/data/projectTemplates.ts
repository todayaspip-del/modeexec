export interface TemplateCard {
  title: string;
  durationMinutes: number;
  expectedEvidence: string;
}

export interface TemplateStage {
  title: string;
  doneCriteria: string;
  cards: TemplateCard[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  stages: TemplateStage[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl-oferta-nova',
    name: 'Lançar uma oferta nova',
    description: 'Transforme uma ideia em uma proposta comercial clara com clientes pagantes.',
    icon: 'Rocket',
    stages: [
      {
        title: 'Definir a oferta',
        doneCriteria: 'Oferta descrita em uma página com preço',
        cards: [
          {
            title: 'Escrever a promessa principal da oferta em 3 linhas',
            durationMinutes: 15,
            expectedEvidence: 'Três frases da promessa anotadas no documento da oferta'
          },
          {
            title: 'Listar os 3 entregáveis e o preço do pacote',
            durationMinutes: 20,
            expectedEvidence: 'Lista com 3 itens objetivos e valor em R$ anotados'
          },
          {
            title: 'Criar documento de uma página com o resumo da oferta',
            durationMinutes: 25,
            expectedEvidence: 'Arquivo PDF ou documento com o resumo pronto para apresentação'
          }
        ]
      },
      {
        title: 'Validar com clientes',
        doneCriteria: '3 conversas feitas e anotadas',
        cards: [
          {
            title: 'Mandar mensagem para 5 clientes próximos sondando interesse',
            durationMinutes: 15,
            expectedEvidence: '5 mensagens personalizadas enviadas no WhatsApp'
          }
        ]
      },
      {
        title: 'Preparar a venda',
        doneCriteria: 'Página ou mensagem de venda pronta',
        cards: [
          {
            title: 'Redigir texto padrão da proposta de envio rápido',
            durationMinutes: 25,
            expectedEvidence: 'Modelo de mensagem de envio pronto na pasta de vendas'
          }
        ]
      },
      {
        title: 'Vender e ajustar',
        doneCriteria: 'Primeira venda realizada',
        cards: []
      }
    ]
  },
  {
    id: 'tpl-cliente-importante',
    name: 'Fechar um cliente importante',
    description: 'Conduza uma oportunidade comercial relevante do primeiro contato ao contrato assinado.',
    icon: 'Briefcase',
    stages: [
      {
        title: 'Entender o cliente',
        doneCriteria: 'Diagnóstico das 3 principais dores anotado em documento',
        cards: [
          {
            title: 'Revisar o histórico das conversas e anotações sobre o decisor',
            durationMinutes: 15,
            expectedEvidence: 'Documento com pontos de interesse e desafios do cliente'
          },
          {
            title: 'Redigir as 3 maiores dores e o custo de não resolver',
            durationMinutes: 20,
            expectedEvidence: 'Resumo estruturado de 3 dores e o impacto financeiro delas'
          },
          {
            title: 'Agendar conversa de diagnóstico com o patrocinador da conta',
            durationMinutes: 10,
            expectedEvidence: 'Convite de reunião aceito no calendário'
          }
        ]
      },
      {
        title: 'Montar a proposta',
        doneCriteria: 'Proposta comercial personalizada em PDF com escopo, prazo e investimento',
        cards: [
          {
            title: 'Preencher o escopo e tabela de investimento na proposta',
            durationMinutes: 25,
            expectedEvidence: 'PDF da proposta comercial exportado na pasta do cliente'
          }
        ]
      },
      {
        title: 'Enviar e acompanhar',
        doneCriteria: 'Proposta apresentada em reunião e data de decisão combinada',
        cards: [
          {
            title: 'Realizar reunião de apresentação da proposta comercial',
            durationMinutes: 25,
            expectedEvidence: 'Ata da reunião registrada com data de decisão acordada'
          }
        ]
      },
      {
        title: 'Fechar e iniciar',
        doneCriteria: 'Contrato assinado e primeiro pagamento confirmado',
        cards: []
      }
    ]
  },
  {
    id: 'tpl-contratar-integrar',
    name: 'Contratar e integrar alguém',
    description: 'Delegue tarefas com segurança definindo função, seleção e integração prática.',
    icon: 'UserPlus',
    stages: [
      {
        title: 'Definir a função',
        doneCriteria: 'Descrição da vaga com responsabilidades e entregas dos 90 dias escrita',
        cards: [
          {
            title: 'Listar as 5 tarefas repetitivas que mais consom seu tempo hoje',
            durationMinutes: 15,
            expectedEvidence: 'Lista de 5 tarefas anotadas no documento da função'
          },
          {
            title: 'Escrever as 3 entregas esperadas nos primeiros 90 dias',
            durationMinutes: 20,
            expectedEvidence: 'Metas dos 90 dias descritas com critérios objetivos de avaliação'
          },
          {
            title: 'Definir o modelo de contratação e orçamento mensal limite',
            durationMinutes: 15,
            expectedEvidence: 'Valor mensal limite e modelo (PJ ou CLT) definidos por escrito'
          }
        ]
      },
      {
        title: 'Atrair candidatos',
        doneCriteria: 'Vaga divulgada e pelo menos 10 currículos recebidos',
        cards: [
          {
            title: 'Publicar anúncio da vaga no LinkedIn e enviar em grupos do setor',
            durationMinutes: 20,
            expectedEvidence: 'Links de publicação salvos e formulário de inscrição ativo'
          }
        ]
      },
      {
        title: 'Escolher',
        doneCriteria: '3 entrevistas finais realizadas e proposta aceita pelo escolhido',
        cards: [
          {
            title: 'Conduzir entrevistas finais com os 3 melhores perfis',
            durationMinutes: 25,
            expectedEvidence: 'Planilha comparativa preenchida com o candidato escolhido'
          }
        ]
      },
      {
        title: 'Integrar nos primeiros 30 dias',
        doneCriteria: 'Treinamento inicial concluído e primeira entrega autônoma entregue',
        cards: []
      }
    ]
  },
  {
    id: 'tpl-financas-negocio',
    name: 'Organizar as finanças do negócio',
    description: 'Assuma o controle do fluxo de caixa e crie uma rotina financeira sem estresse.',
    icon: 'Coins',
    stages: [
      {
        title: 'Levantar os números',
        doneCriteria: 'Extratos bancários dos últimos 90 dias exportados e categorizados',
        cards: [
          {
            title: 'Baixar extratos em CSV de todas as contas da empresa',
            durationMinutes: 15,
            expectedEvidence: 'Arquivos CSV baixados e salvos na pasta Financeiro'
          },
          {
            title: 'Categorizar as 15 maiores saídas dos últimos 30 dias',
            durationMinutes: 25,
            expectedEvidence: 'Planilha com despesas classificadas em fixas e variáveis'
          },
          {
            title: 'Listar receitas e faturamentos previstos para este mês',
            durationMinutes: 20,
            expectedEvidence: 'Soma total de entradas previstas calculada em planilha'
          }
        ]
      },
      {
        title: 'Separar o essencial',
        doneCriteria: 'Contas PF e PJ separadas e planilha de custos fixos atualizada',
        cards: [
          {
            title: 'Identificar gastos pessoais pagos na conta jurídica e definir pró-labore',
            durationMinutes: 20,
            expectedEvidence: 'Valor fixo mensal de pró-labore definido e transferências alinhadas'
          }
        ]
      },
      {
        title: 'Criar a rotina',
        doneCriteria: 'Rotina semanal de conciliação financeira agendada no calendário',
        cards: [
          {
            title: 'Reservar bloco de 45 min toda semana na agenda para conciliação',
            durationMinutes: 10,
            expectedEvidence: 'Evento recorrente fixado no Google Agenda toda sexta-feira'
          }
        ]
      },
      {
        title: 'Revisar todo mês',
        doneCriteria: 'Primeiro fechamento mensal do DRE simplificado finalizado',
        cards: []
      }
    ]
  }
];
