import type { CandidatoId, PlacarFinal } from "../engine/types";
import type { GameState } from "../engine/types";

const CHAVE_ESTADO = "simulador-campanha:estado";
const CHAVE_HISTORICO = "simulador-campanha:historico";
const CHAVE_SEED_REPLAY = "simulador-campanha:seed-replay";
const CHAVE_NOME = "simulador-campanha:nome";
const CHAVE_JOGADOR_ATUAL = "simulador-campanha:jogador-atual";

export function salvarEstado(state: GameState): void {
  try {
    localStorage.setItem(CHAVE_ESTADO, JSON.stringify(state));
  } catch {
    // localStorage indisponível (ex.: modo privado) — a partida só não persiste entre sessões.
  }
}

export function carregarEstado(): GameState | null {
  try {
    const bruto = localStorage.getItem(CHAVE_ESTADO);
    if (!bruto) return null;
    return JSON.parse(bruto) as GameState;
  } catch {
    return null;
  }
}

export function limparEstado(): void {
  try {
    localStorage.removeItem(CHAVE_ESTADO);
  } catch {
    // ignorado
  }
}

export interface ResultadoHistorico {
  jogadorId: CandidatoId;
  seed: number;
  resultado: PlacarFinal;
  dataISO: string;
}

export function salvarNoHistorico(entrada: ResultadoHistorico): void {
  try {
    const historico = carregarHistorico();
    historico.push(entrada);
    localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(historico.slice(-20)));
  } catch {
    // ignorado
  }
}

export function carregarHistorico(): ResultadoHistorico[] {
  try {
    const bruto = localStorage.getItem(CHAVE_HISTORICO);
    if (!bruto) return [];
    return JSON.parse(bruto) as ResultadoHistorico[];
  } catch {
    return [];
  }
}

/** Guarda a seed da última partida para o botão "jogar de novo com outro perfil, mesma semente". */
export function salvarSeedReplay(seed: number): void {
  try {
    localStorage.setItem(CHAVE_SEED_REPLAY, String(seed));
  } catch {
    // ignorado
  }
}

export function carregarSeedReplay(): number | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SEED_REPLAY);
    return bruto ? Number(bruto) : null;
  } catch {
    return null;
  }
}

export function limparSeedReplay(): void {
  try {
    localStorage.removeItem(CHAVE_SEED_REPLAY);
  } catch {
    // ignorado
  }
}

/** Nome/apelido digitado pela pessoa — fica salvo entre partidas para não precisar redigitar. */
export function salvarNomeJogador(nome: string): void {
  try {
    localStorage.setItem(CHAVE_NOME, nome);
  } catch {
    // ignorado
  }
}

export function carregarNomeJogador(): string {
  try {
    return localStorage.getItem(CHAVE_NOME) ?? "";
  } catch {
    return "";
  }
}

export interface JogadorAtual {
  nome: string;
  /** Id único desta partida (não da pessoa) — liga os comentários de rodada ao resultado final no ranking público. */
  jogoId: string;
}

/** Identidade da partida em andamento (nome + id único), para o ranking/comentários públicos. */
export function salvarJogadorAtual(jogador: JogadorAtual): void {
  try {
    localStorage.setItem(CHAVE_JOGADOR_ATUAL, JSON.stringify(jogador));
  } catch {
    // ignorado
  }
}

export function carregarJogadorAtual(): JogadorAtual | null {
  try {
    const bruto = localStorage.getItem(CHAVE_JOGADOR_ATUAL);
    return bruto ? (JSON.parse(bruto) as JogadorAtual) : null;
  } catch {
    return null;
  }
}
