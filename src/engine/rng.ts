/**
 * PRNG determinístico e sem estado mutável externo: dado o mesmo (seed, cursor),
 * sempre devolve o mesmo valor. Isso permite salvar só um número (o cursor) no
 * GameState e ainda assim repetir a partida exatamente igual no replay/debrief.
 */
function hash32(seed: number, cursor: number): number {
  let h = (seed ^ cursor) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

/** Float determinístico em [0, 1) para um (seed, cursor) específico. */
export function randomFloat(seed: number, cursor: number): number {
  return hash32(seed, cursor);
}

/** Consome o próximo valor da sequência "de jogo" e devolve o cursor avançado. */
export function nextRandom(seed: number, cursor: number): { valor: number; cursor: number } {
  return { valor: randomFloat(seed, cursor), cursor: cursor + 1 };
}

/**
 * Ruído gaussiano (Box–Muller) a partir de duas amostras uniformes, usado nas
 * pesquisas. Namespace de cursor separado do fluxo principal (ver polls.ts) para
 * que consultar o painel várias vezes na mesma fase não mude outros sorteios.
 */
export function gaussianAt(seed: number, cursor: number): number {
  const u1 = Math.max(randomFloat(seed, cursor), 1e-9);
  const u2 = randomFloat(seed, cursor + 1);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Espaço de cursor reservado para sorteios "de consulta" (pesquisas), fora do fluxo sequencial. */
export const CURSOR_BASE_PESQUISA = 1_000_000;

/**
 * Espaço de cursor reservado para o choque de última hora da eleição (ver
 * secondRound.ts) — também fora do fluxo sequencial, para que recalcular a
 * apuração não consuma o cursor principal nem mude outros sorteios da partida.
 */
export const CURSOR_BASE_ELEICAO = 2_000_000;
