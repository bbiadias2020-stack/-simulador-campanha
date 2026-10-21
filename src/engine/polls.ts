import {
  RUIDO_PESQUISA_BASE,
  RUIDO_PESQUISA_MINIMO,
  RUIDO_REDUCAO_POR_MI,
} from "../config/balance";
import { CURSOR_BASE_PESQUISA, gaussianAt } from "./rng";
import type { CandidatoId, Fase, GameState, ResultadoPesquisa } from "./types";

export function margemErroPesquisa(investimentoAcumuladoMi: number): number {
  const ruido = RUIDO_PESQUISA_BASE - investimentoAcumuladoMi * RUIDO_REDUCAO_POR_MI;
  return Math.max(ruido, RUIDO_PESQUISA_MINIMO);
}

/**
 * Pesquisa é só uma leitura ruidosa do estado verdadeiro — não muda o GameState.
 * O ruído é derivado de (seed, fase, candidato), então consultar o painel várias
 * vezes na mesma fase sempre mostra o mesmo número "errado", como uma pesquisa real.
 */
export function gerarResultadoPesquisa(state: GameState, fase: Fase = state.faseAtual): ResultadoPesquisa {
  const margemErro = margemErroPesquisa(state.pesquisaInvestimentoAcumuladoMi);
  const porCandidato = {} as Record<CandidatoId, number>;

  const idsOrdenados = Object.keys(state.candidatos).sort() as CandidatoId[];
  idsOrdenados.forEach((id, idx) => {
    const cursor = CURSOR_BASE_PESQUISA + state.faseIndex * 100 + idx;
    const ruido = gaussianAt(state.seed, cursor) * margemErro;
    const valorReal = state.candidatos[id].metricas.intencaoVoto;
    porCandidato[id] = Math.max(0, Math.round((valorReal + ruido) * 10) / 10);
  });

  return { fase, porCandidato, margemErro: Math.round(margemErro * 10) / 10 };
}
