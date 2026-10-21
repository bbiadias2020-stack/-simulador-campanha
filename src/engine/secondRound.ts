import {
  INTENSIDADE_REJEICAO_SEGUNDO_TURNO,
  LIMIAR_VITORIA_PRIMEIRO_TURNO,
  PESO_REJEICAO_PRIMEIRO_TURNO,
  SURPRESA_ELEICAO_BASE,
  SURPRESA_ELEICAO_MINIMA,
  SURPRESA_ELEICAO_REDUCAO_POR_MI,
  TRANSFERENCIA_VOTO_ALIADO_2T,
} from "../config/balance";
import { CURSOR_BASE_ELEICAO, gaussianAt } from "./rng";
import type { CandidatoId, GameState } from "./types";

/**
 * Choque de última hora (ver balance.ts): ruído gaussiano determinístico por
 * (seed, candidato, turno) — não muda se a apuração for recalculada, só se a
 * seed da partida mudar. Investir em pesquisas reduz o desvio-padrão, nunca
 * zera: nenhuma liderança é 100% segura.
 */
function surpresaEleicao(state: GameState, id: CandidatoId, namespaceTurno: number): number {
  const idsOrdenados = (Object.keys(state.candidatos) as CandidatoId[]).sort();
  const idx = idsOrdenados.indexOf(id);
  const desvio = Math.max(
    SURPRESA_ELEICAO_BASE - state.pesquisaInvestimentoAcumuladoMi * SURPRESA_ELEICAO_REDUCAO_POR_MI,
    SURPRESA_ELEICAO_MINIMA,
  );
  return gaussianAt(state.seed, CURSOR_BASE_ELEICAO + namespaceTurno + idx) * desvio;
}

export interface ApuracaoTurno {
  decidido: boolean;
  vencedorId?: CandidatoId;
  ranking: { id: CandidatoId; percentual: number }[];
  finalistas?: [CandidatoId, CandidatoId];
}

/**
 * "Votos válidos" aqui = intenção de voto de cada candidato normalizada para
 * somar 100 entre os 4 (simplificação de MVP: não modelamos brancos/nulos
 * evoluindo rodada a rodada, só o "indecisos" inicial da ficha dos candidatos).
 */
function votosEfetivos(state: GameState, id: CandidatoId): number {
  const { intencaoVoto, rejeicao } = state.candidatos[id].metricas;
  const fator = 1 - (PESO_REJEICAO_PRIMEIRO_TURNO * rejeicao) / 100;
  return Math.max(0, intencaoVoto) * Math.max(0, fator);
}

export function apurarPrimeiroTurno(state: GameState): ApuracaoTurno {
  const ids = Object.keys(state.candidatos) as CandidatoId[];
  const brutos = {} as Record<CandidatoId, number>;
  for (const id of ids) brutos[id] = Math.max(0, votosEfetivos(state, id) + surpresaEleicao(state, id, 0));
  const soma = ids.reduce((s, id) => s + brutos[id], 0);

  const ranking = ids
    .map((id) => ({
      id,
      percentual: soma > 0 ? (brutos[id] / soma) * 100 : 25,
    }))
    .sort((a, b) => b.percentual - a.percentual);

  const lider = ranking[0];
  if (lider.percentual > LIMIAR_VITORIA_PRIMEIRO_TURNO) {
    return { decidido: true, vencedorId: lider.id, ranking };
  }
  return { decidido: false, ranking, finalistas: [ranking[0].id, ranking[1].id] };
}

/**
 * Para quem tende o eleitorado de um candidato eliminado no 1º turno, entre os 2
 * finalistas (mesma posição em costumes e/ou economia pesa mais). Usado tanto na
 * apuração real quanto na tela de briefing do 2º turno, que mostra essa tendência
 * ao jogador antes da rodada começar.
 */
export function afinidadeTransferencia(
  state: GameState,
  elimId: CandidatoId,
  finalistas: [CandidatoId, CandidatoId],
): [number, number] {
  const elim = state.candidatosBase[elimId];
  const afinidade = finalistas.map((fid) => {
    const f = state.candidatosBase[fid];
    return (f.costumes === elim.costumes ? 1 : 0) + (f.economia === elim.economia ? 1 : 0);
  }) as [number, number];

  if (afinidade[0] > afinidade[1]) return [TRANSFERENCIA_VOTO_ALIADO_2T, 1 - TRANSFERENCIA_VOTO_ALIADO_2T];
  if (afinidade[1] > afinidade[0]) return [1 - TRANSFERENCIA_VOTO_ALIADO_2T, TRANSFERENCIA_VOTO_ALIADO_2T];
  return [0.5, 0.5];
}

/**
 * No 2º turno, os votos dos eliminados se transferem para os 2 finalistas conforme
 * proximidade ideológica (mesma posição em costumes e/ou economia pesa mais).
 */
export function apurarSegundoTurno(state: GameState): ApuracaoTurno {
  const finalistas = state.finalistasSegundoTurno;
  if (!finalistas) throw new Error("apurarSegundoTurno chamado sem finalistas definidos");

  const eliminados = (Object.keys(state.candidatos) as CandidatoId[]).filter((id) => !finalistas.includes(id));
  const votos: Record<CandidatoId, number> = {
    [finalistas[0]]: Math.max(state.candidatos[finalistas[0]].metricas.intencaoVoto, 0),
    [finalistas[1]]: Math.max(state.candidatos[finalistas[1]].metricas.intencaoVoto, 0),
  } as Record<CandidatoId, number>;

  for (const elimId of eliminados) {
    const votosElim = Math.max(state.candidatos[elimId].metricas.intencaoVoto, 0);
    const fracao = afinidadeTransferencia(state, elimId, finalistas);

    votos[finalistas[0]] += votosElim * fracao[0];
    votos[finalistas[1]] += votosElim * fracao[1];
  }

  // Rejeição decide o 2º turno (ver Parte 2 da spec): quem tem menos rejeição
  // retém proporcionalmente mais do seu total num confronto direto — é o caminho
  // de vitória do perfil que não lidera nenhum segmento, mas chega com rejeição baixa.
  const aceitabilidade = finalistas.map((id) => 100 - state.candidatos[id].metricas.rejeicao) as [number, number];
  const mediaAceitabilidade = (aceitabilidade[0] + aceitabilidade[1]) / 2;
  const votosAjustados = finalistas.map((id, i) => {
    const fatorAjuste =
      mediaAceitabilidade > 0
        ? 1 + INTENSIDADE_REJEICAO_SEGUNDO_TURNO * (aceitabilidade[i] / mediaAceitabilidade - 1)
        : 1;
    return votos[id] * Math.max(0, fatorAjuste);
  });

  const comSurpresa = finalistas.map((id, i) => Math.max(0, votosAjustados[i] + surpresaEleicao(state, id, 500)));
  const soma = comSurpresa[0] + comSurpresa[1];
  const ranking = finalistas
    .map((id, i) => ({ id, percentual: soma > 0 ? (comSurpresa[i] / soma) * 100 : 50 }))
    .sort((a, b) => b.percentual - a.percentual);

  return { decidido: true, vencedorId: ranking[0].id, ranking, finalistas };
}
