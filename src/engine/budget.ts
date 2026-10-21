import {
  AFINIDADE_SEGMENTO_CANAL,
  FATOR_ESCALA_VERBA,
  PESOS_CANAL,
  TETO_EFEITO_VERBA,
} from "../config/balance";
import { SEGMENTOS } from "../data/segmentos";
import type { AlocacaoVerba, CandidatoEstado } from "./types";

/** Retornos decrescentes: efeito cresce com a raiz do gasto, não linearmente. */
export function efeitoVerba(gastoMi: number): number {
  const gasto = Math.max(gastoMi, 0);
  return Math.min(Math.sqrt(gasto) * FATOR_ESCALA_VERBA, TETO_EFEITO_VERBA);
}

export function custoTotalAlocacao(alocacao: AlocacaoVerba): number {
  return Object.values(alocacao).reduce((soma, v) => soma + Math.max(v, 0), 0);
}

/**
 * Aplica uma alocação de verba ao candidato: debita a caixa (ou gera dívida se
 * faltar dinheiro) e soma os efeitos de cada canal, com bônus para os segmentos
 * que aquele canal favorece.
 */
export function aplicarAlocacaoVerba(
  estado: CandidatoEstado,
  alocacao: AlocacaoVerba,
): CandidatoEstado {
  const custoTotal = custoTotalAlocacao(alocacao);
  const caixaDisponivel = estado.metricas.caixaMi;
  const excedente = Math.max(custoTotal - caixaDisponivel, 0);

  const metricas = { ...estado.metricas };
  const intencaoPorSegmento = { ...estado.intencaoPorSegmento };

  metricas.caixaMi = Math.max(caixaDisponivel - custoTotal, 0);

  for (const [canalStr, gastoMi] of Object.entries(alocacao)) {
    const canal = canalStr as keyof typeof PESOS_CANAL;
    if (gastoMi <= 0) continue;
    const efeito = efeitoVerba(gastoMi);
    const pesos = PESOS_CANAL[canal];

    metricas.intencaoVoto += efeito * pesos.intencaoVoto;
    metricas.tempoTV += efeito * pesos.tempoTV;
    metricas.sentimento += efeito * pesos.sentimento;
    metricas.coesao += efeito * pesos.coesao;
    metricas.riscoJuridico = Math.max(0, metricas.riscoJuridico + efeito * pesos.riscoJuridico);

    const afinidades = AFINIDADE_SEGMENTO_CANAL[canal];
    if (afinidades && pesos.intencaoVoto > 0) {
      for (const segmento of SEGMENTOS) {
        const multiplicador = afinidades[segmento.id] ?? 1;
        intencaoPorSegmento[segmento.id] += efeito * pesos.intencaoVoto * multiplicador * 0.5;
      }
    }
  }

  if (excedente > 0) {
    metricas.credibilidade = Math.max(0, metricas.credibilidade - excedente * 0.05);
  }

  return {
    ...estado,
    metricas,
    intencaoPorSegmento,
    dividaMi: estado.dividaMi + excedente,
  };
}
