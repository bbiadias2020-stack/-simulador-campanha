import { CONSELHEIRO_IDS } from "../data/conselheiros";
import type {
  CandidatoBase,
  CandidatoEstado,
  ConselheiroId,
  Dilema,
  HistoricoConselheiro,
} from "./types";

const SEGUIDORES_BASE_DIGITAL_GRANDE = 3_000_000;
const TEMPO_TV_ALTO = 25;

/**
 * Fit padrão de cada conselheiro para um dilema, 0 a 1, com base no perfil do
 * candidato e na categoria do dilema. `dilema.fitPorConselheiro` pode sobrescrever
 * um valor específico (ex.: Caio acerta mais com bases digitais grandes; Sônia
 * acerta mais em crises de desinformação; Beto acerta mais em negociações e em
 * capturar o eleitorado indeciso — é trabalho de articulação política, não digital
 * nem jurídico).
 */
export function calcularFitConselheiros(
  dilema: Dilema,
  candidatoBase: CandidatoBase,
  candidatoEstado: CandidatoEstado,
): Record<ConselheiroId, number> {
  const fit: Record<ConselheiroId, number> = {
    neusa: candidatoEstado.metricas.tempoTV >= TEMPO_TV_ALTO ? 0.75 : 0.4,
    caio: candidatoBase.seguidores >= SEGUIDORES_BASE_DIGITAL_GRANDE ? 0.8 : 0.35,
    sonia: dilema.categoria === "crise_desinformacao" ? 0.85 : 0.45,
    beto:
      dilema.categoria === "negociacao" ||
      dilema.categoria === "indecisos" ||
      dilema.categoria === "alianca" ||
      dilema.fase === "segundo_turno"
        ? 0.85
        : 0.4,
  };

  for (const id of CONSELHEIRO_IDS) {
    const override = dilema.fitPorConselheiro?.[id];
    if (override !== undefined) fit[id] = override;
  }

  return fit;
}

/** Conselheiro com maior fit entre os que deram opinião neste dilema. */
export function melhorConselheiro(
  dilema: Dilema,
  fit: Record<ConselheiroId, number>,
): ConselheiroId {
  const idsComOpiniao = dilema.opinioes.map((o) => o.conselheiroId);
  return idsComOpiniao.reduce((melhor, atual) =>
    fit[atual] > fit[melhor] ? atual : melhor,
  idsComOpiniao[0]);
}

export function historicoInicial(): Record<ConselheiroId, HistoricoConselheiro> {
  const base = {} as Record<ConselheiroId, HistoricoConselheiro>;
  for (const id of CONSELHEIRO_IDS) {
    base[id] = { acertos: 0, erros: 0, vezesIgnorado: 0, saiuDaCampanha: false, agendaOcultaRevelada: false };
  }
  return base;
}

/**
 * Atualiza o histórico depois de um dilema: quem foi seguido ganha acerto/erro
 * conforme o fit; quem deu opinião mas não foi seguido conta como ignorado.
 */
export function atualizarHistoricoConselheiros(
  historico: Record<ConselheiroId, HistoricoConselheiro>,
  dilema: Dilema,
  fit: Record<ConselheiroId, number>,
  conselheiroSeguidoId: ConselheiroId | undefined,
): { historico: Record<ConselheiroId, HistoricoConselheiro>; acertou: boolean | undefined } {
  const novoHistorico = { ...historico };
  let acertou: boolean | undefined;

  for (const opiniao of dilema.opinioes) {
    const atual = novoHistorico[opiniao.conselheiroId];
    if (opiniao.conselheiroId === conselheiroSeguidoId) {
      const foiOMelhor = melhorConselheiro(dilema, fit) === conselheiroSeguidoId;
      acertou = foiOMelhor;
      novoHistorico[opiniao.conselheiroId] = {
        ...atual,
        acertos: atual.acertos + (foiOMelhor ? 1 : 0),
        erros: atual.erros + (foiOMelhor ? 0 : 1),
      };
    } else {
      novoHistorico[opiniao.conselheiroId] = {
        ...atual,
        vezesIgnorado: atual.vezesIgnorado + 1,
      };
    }
  }

  return { historico: novoHistorico, acertou };
}
