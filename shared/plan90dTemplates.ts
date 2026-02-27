// ─── Plano 90 Dias — Biblioteca de Templates 70/20/10 ──────────────────────
// Cada opção tem: id único, label curto, descrição de ação concreta
// O usuário seleciona 1-3 opções por bloco

export interface PlanOption {
  id: string;
  label: string;
  description: string;
}

export interface PlanBlock {
  key: "70" | "20" | "10";
  title: string;
  subtitle: string;
  maxSelections: number;
  options: PlanOption[];
}

// ─── Bloco 70% — Trabalho principal / entrega de valor ─────────────────────
const OPTIONS_70: PlanOption[] = [
  {
    id: "70_deepen_core",
    label: "Aprofundar competência central",
    description: "Dedicar tempo deliberado à dimensão de maior impacto no seu trabalho atual — com prática intencional, não apenas execução.",
  },
  {
    id: "70_deliver_project",
    label: "Entregar projeto estratégico",
    description: "Identificar o projeto de maior visibilidade e impacto no ciclo e garantir entrega com qualidade acima do esperado.",
  },
  {
    id: "70_build_routine",
    label: "Construir rotina de alta performance",
    description: "Estruturar blocos de trabalho focado (deep work), reduzir interrupções e criar rituais de início/encerramento de dia.",
  },
  {
    id: "70_improve_process",
    label: "Melhorar processo crítico",
    description: "Mapear o processo que mais drena energia ou gera retrabalho e redesenhá-lo com pelo menos 20% de ganho de eficiência.",
  },
  {
    id: "70_stakeholder",
    label: "Fortalecer relação com stakeholders-chave",
    description: "Identificar 2-3 pessoas que mais influenciam seu trabalho e investir em alinhamento proativo e visibilidade de resultados.",
  },
];

// ─── Bloco 20% — Aprendizado / desenvolvimento ─────────────────────────────
const OPTIONS_20: PlanOption[] = [
  {
    id: "20_learn_adjacent",
    label: "Aprender habilidade adjacente",
    description: "Escolher uma habilidade que complementa sua competência central e dedicar 2-3 horas semanais a aprendizado estruturado.",
  },
  {
    id: "20_seek_feedback",
    label: "Buscar feedback estruturado",
    description: "Solicitar feedback específico de 2-3 pessoas sobre uma dimensão de desenvolvimento — com perguntas concretas, não genéricas.",
  },
  {
    id: "20_mentor_mentee",
    label: "Ativar relação de mentoria",
    description: "Identificar alguém mais experiente na sua área de desenvolvimento e propor encontros quinzenais com pauta preparada.",
  },
  {
    id: "20_experiment",
    label: "Conduzir experimento de carreira",
    description: "Testar uma hipótese sobre seu desenvolvimento (ex: liderar uma iniciativa nova, assumir responsabilidade diferente) com prazo definido.",
  },
  {
    id: "20_document_learning",
    label: "Documentar aprendizados",
    description: "Criar o hábito de registrar 1 aprendizado por semana — o que funcionou, o que não funcionou e o que mudaria.",
  },
];

// ─── Bloco 10% — Exploração / apostas de longo prazo ──────────────────────
const OPTIONS_10: PlanOption[] = [
  {
    id: "10_explore_ikigai",
    label: "Explorar interseção do IKIGAI",
    description: "Dedicar tempo a uma atividade que cruza pelo menos dois círculos do seu IKIGAI — sem pressão de resultado imediato.",
  },
  {
    id: "10_network_new",
    label: "Expandir rede para área de interesse",
    description: "Conectar-se com 2-3 pessoas que atuam na direção que você quer explorar — para aprender, não para pedir favores.",
  },
  {
    id: "10_side_project",
    label: "Iniciar projeto paralelo pequeno",
    description: "Lançar um projeto de baixo custo e baixo risco que testa uma hipótese de carreira ou produto — com entrega em 30 dias.",
  },
  {
    id: "10_read_research",
    label: "Pesquisar tendências do setor",
    description: "Ler 2-3 referências relevantes sobre o futuro da sua área e identificar onde você quer estar posicionado em 2-3 anos.",
  },
  {
    id: "10_reflect_values",
    label: "Revisitar valores e critérios de decisão",
    description: "Reservar tempo para revisar o que importa para você agora — e verificar se suas escolhas atuais estão alinhadas com isso.",
  },
];

export const PLAN_90D_BLOCKS: PlanBlock[] = [
  {
    key: "70",
    title: "70% — Trabalho principal",
    subtitle: "O que você vai entregar e aprofundar no seu trabalho atual",
    maxSelections: 2,
    options: OPTIONS_70,
  },
  {
    key: "20",
    title: "20% — Desenvolvimento",
    subtitle: "O que você vai aprender e como vai crescer neste ciclo",
    maxSelections: 2,
    options: OPTIONS_20,
  },
  {
    key: "10",
    title: "10% — Exploração",
    subtitle: "O que você vai testar e explorar para o longo prazo",
    maxSelections: 1,
    options: OPTIONS_10,
  },
];
