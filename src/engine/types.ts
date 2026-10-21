// Tipos centrais do motor de jogo. Nenhuma lógica aqui — só formas de dados.

export type SegmentoId =
  | "jovens"
  | "mulheres"
  | "evangelicos"
  | "classeC"
  | "nordeste"
  | "sul";

export type CandidatoId = "luana" | "rafael" | "helena" | "augusto";

export type ConselheiroId = "neusa" | "caio" | "sonia" | "beto";

export type Costumes = "progressista" | "conservador";
export type Economia = "estado" | "mercado";
export type PortePartido = "grande" | "medio" | "medio_federacao" | "pequeno";

export type Fase =
  | "pre_campanha"
  | "plataforma_governo"
  | "convencao"
  | "campanha_oficial"
  | "campanha_intermediaria"
  | "debates"
  | "reta_final"
  | "primeiro_turno"
  | "segundo_turno";

export const ORDEM_FASES: Fase[] = [
  "pre_campanha",
  "plataforma_governo",
  "convencao",
  "campanha_oficial",
  "campanha_intermediaria",
  "debates",
  "reta_final",
  "primeiro_turno",
  "segundo_turno",
];

/**
 * Nem toda fase é uma rodada de verba: Convenção e Debates giram só em torno de
 * dilemas e tom; "Plataforma de Governo" é uma rodada própria, sem custo de caixa,
 * de promessas por área (ver `src/engine/plataforma.ts`). Mantém a campanha menos
 * repetitiva e cada fase com uma identidade própria.
 */
export type TipoRodada = "verba" | "plataforma" | "dilema_ou_tom";

export const TIPO_RODADA: Record<Fase, TipoRodada> = {
  pre_campanha: "verba",
  plataforma_governo: "plataforma",
  convencao: "dilema_ou_tom",
  campanha_oficial: "verba",
  campanha_intermediaria: "verba",
  debates: "dilema_ou_tom",
  reta_final: "verba",
  primeiro_turno: "verba",
  segundo_turno: "verba",
};

/** As 4 áreas de política pública que entram na plataforma de governo do candidato. */
export type AreaPolitica = "saude" | "seguranca" | "educacao" | "economia";

export const AREAS_POLITICAS: AreaPolitica[] = ["saude", "seguranca", "educacao", "economia"];

/** Ênfase (0 a 10) que o candidato dá a cada área na plataforma de governo. */
export type EnfasePlataforma = Record<AreaPolitica, number>;

/** Métricas que todo candidato carrega e que o painel exibe. */
export interface Metricas {
  intencaoVoto: number;
  rejeicao: number;
  caixaMi: number;
  tempoTV: number;
  sentimento: number;
  coesao: number;
  credibilidade: number;
  riscoJuridico: number;
}

export type IntencaoPorSegmento = Record<SegmentoId, number>;

/** Dados estáticos de um candidato (vêm de src/data/candidatos.ts, nunca mudam). */
export interface CandidatoBase {
  id: CandidatoId;
  nome: string;
  genero: string;
  costumes: Costumes;
  economia: Economia;
  raca: string;
  idade: number;
  origem: string;
  religiao: string;
  trajetoria: string;
  partido: PortePartido;
  esqueleto: string;
  seguidores: number;
  engajamento: number;
  pontoForte: string;
  obstaculo: string;
  /** Autoapresentação em 1ª pessoa, para a ficha do candidato na tela inicial. */
  apresentacao: string;
  metricasIniciais: Metricas;
  intencaoPorSegmentoInicial: IntencaoPorSegmento;
}

/** Estado mutável de um candidato dentro de uma partida em andamento. */
export interface CandidatoEstado {
  id: CandidatoId;
  metricas: Metricas;
  intencaoPorSegmento: IntencaoPorSegmento;
  tomAtual: TomCampanha;
  dividaMi: number;
}

export type TomCampanha = "propositivo" | "ataque" | "moderado" | "radical";

export type CanalVerba = "tv" | "digital" | "comicios" | "pesquisas" | "juridica";

export type AlocacaoVerba = Record<CanalVerba, number>;

/** Um risco oculto criado por uma escolha antiética, que pode estourar rodadas depois. */
export interface RiscoOculto {
  id: string;
  origemId: string;
  descricao: string;
  probabilidadePorRodada: number;
  rodadasRestantes: number;
  efeitoSeEstourar: Partial<Metricas>;
}

export interface HistoricoConselheiro {
  acertos: number;
  erros: number;
  vezesIgnorado: number;
  saiuDaCampanha: boolean;
  agendaOcultaRevelada: boolean;
}

export interface DecisaoLogEntry {
  fase: Fase;
  tipo: "verba" | "dilema" | "estrategica" | "segundo_turno" | "crise";
  descricao: string;
  conselheiroSeguidoId?: ConselheiroId;
  acertou?: boolean;
  opcaoEscolhidaId?: string;
  /** Preenchido quando tipo === "crise": o efeito que a crise aplicou ao estourar. */
  efeitoCrise?: Partial<Metricas>;
}

/** Opção de resposta a um dilema ou evento. */
export interface OpcaoDilema {
  id: string;
  texto: string;
  /** Só aparece se liberada (ex.: perícia da Sônia revela opção escondida). */
  oculta?: boolean;
  liberadaPorConselheiroId?: ConselheiroId;
  /** Marca a opção como antiética — abre risco oculto de consequência atrasada. */
  antietica?: boolean;
  efeitos: Partial<Metricas>;
  efeitosPorSegmento?: Partial<IntencaoPorSegmento>;
  /** Opções que empenham uma promessa/cargo custam nota de governabilidade no placar final. */
  gerarPromessa?: Promessa;
  /** Manchete/post/fala de eleitor-persona reagindo a essa escolha — prévia antes de confirmar. */
  reacao?: string;
  /**
   * Quando true, o ganho de intencaoVoto desta opção vem do pool de indecisos/
   * brancos/nulos (GameState.indecisosRestantes), não "nasce do nada".
   */
  capturaIndecisos?: boolean;
}

export interface OpiniaoConselheiro {
  conselheiroId: ConselheiroId;
  recomendaOpcaoId: string;
  fala: string;
}

export type CategoriaDilema =
  | "padrao"
  | "crise_desinformacao"
  | "negociacao"
  | "etico"
  | "indecisos"
  | "alianca"
  | "grupo_focal";

export interface Dilema {
  id: string;
  fase: Fase;
  titulo: string;
  descricao: string;
  categoria: CategoriaDilema;
  opcoes: OpcaoDilema[];
  opinioes: OpiniaoConselheiro[];
  /** Sobrescreve o fit padrão de um conselheiro para este dilema específico (0 a 1). */
  fitPorConselheiro?: Partial<Record<ConselheiroId, number>>;
}

export interface ResultadoPesquisa {
  fase: Fase;
  porCandidato: Record<CandidatoId, number>;
  margemErro: number;
}

export interface Promessa {
  descricao: string;
  custoGovernabilidade: number;
}

export interface PlacarFinal {
  vencedorId: CandidatoId | null;
  votosFinais: Record<CandidatoId, number>;
  dividaMi: number;
  promessasFeitas: Promessa[];
  notaGovernabilidade: number;
  foiSegundoTurno: boolean;
  /** Campanha encerrada no meio do caminho por decisão judicial (risco jurídico alto demais). */
  cassado?: boolean;
  /** Campanha encerrada no meio do caminho por dívida descontrolada (contas rejeitadas). */
  faliuPorDivida?: boolean;
  /** Jogador não ficou entre os 2 mais votados no 1º turno — nunca chegou ao 2º turno. */
  foiEliminadoAntesDoSegundoTurno?: boolean;
}

/** Snapshot das métricas do jogador ao fim de uma rodada — ver GameState.historicoMetricas. */
export interface SnapshotMetricas {
  fase: Fase;
  metricas: Metricas;
}

export interface GameState {
  seed: number;
  rngCursor: number;
  jogadorId: CandidatoId;
  faseAtual: Fase;
  faseIndex: number;
  candidatos: Record<CandidatoId, CandidatoEstado>;
  candidatosBase: Record<CandidatoId, CandidatoBase>;
  historicoDecisoes: DecisaoLogEntry[];
  /** Métricas do jogador ao fim de cada rodada já concluída, na ordem em que aconteceram. */
  historicoMetricas: SnapshotMetricas[];
  historicoConselheiros: Record<ConselheiroId, HistoricoConselheiro>;
  riscosOcultos: RiscoOculto[];
  pesquisaInvestimentoAcumuladoMi: number;
  promessas: Promessa[];
  dilemasResolvidosIds: string[];
  /** Pool de eleitores ainda indecisos/brancos/nulos (%), iniciado em INDECISOS_INICIAL. */
  indecisosRestantes: number;
  finalistasSegundoTurno: [CandidatoId, CandidatoId] | null;
  resultado: PlacarFinal | null;
  terminado: boolean;
}
