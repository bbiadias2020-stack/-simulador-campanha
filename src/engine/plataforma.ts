import {
  AFINIDADE_SEGMENTO_AREA,
  CUSTO_GOVERNABILIDADE_POR_PONTO_ENFASE,
  LIMIAR_ENFASE_VIRA_PROMESSA,
  PESO_ENFASE_AREA,
} from "../config/balance";
import { SEGMENTOS } from "../data/segmentos";
import type { AreaPolitica, CandidatoEstado, EnfasePlataforma, Promessa } from "./types";

export const NOME_AREA: Record<AreaPolitica, string> = {
  saude: "Saúde",
  seguranca: "Segurança",
  educacao: "Educação",
  economia: "Economia e emprego",
};

export interface ResultadoPlataforma {
  estado: CandidatoEstado;
  promessasGeradas: Promessa[];
}

/**
 * Aplica a ênfase de plataforma (0–10 por área) ao candidato: sobe intenção de
 * voto (geral e por segmento, pela afinidade de cada área) sem custar caixa — é
 * discurso/prioridade, não verba publicitária. Ênfase alta (≥ LIMIAR) vira
 * promessa formal de governo, que custa nota de governabilidade no placar final.
 */
export function aplicarPlataforma(estado: CandidatoEstado, enfases: EnfasePlataforma): ResultadoPlataforma {
  const metricas = { ...estado.metricas };
  const intencaoPorSegmento = { ...estado.intencaoPorSegmento };
  const promessasGeradas: Promessa[] = [];

  for (const [areaStr, pontosBrutos] of Object.entries(enfases)) {
    const area = areaStr as AreaPolitica;
    const pontos = Math.max(0, Math.min(10, pontosBrutos));
    if (pontos <= 0) continue;

    const efeitoBase = pontos * PESO_ENFASE_AREA;
    metricas.intencaoVoto = Math.min(100, metricas.intencaoVoto + efeitoBase);

    const afinidades = AFINIDADE_SEGMENTO_AREA[area];
    for (const segmento of SEGMENTOS) {
      const multiplicador = afinidades[segmento.id] ?? 1;
      intencaoPorSegmento[segmento.id] = Math.max(0, intencaoPorSegmento[segmento.id] + efeitoBase * multiplicador);
    }

    if (pontos >= LIMIAR_ENFASE_VIRA_PROMESSA) {
      promessasGeradas.push({
        descricao: `Prometeu prioridade forte em ${NOME_AREA[area]} no governo`,
        custoGovernabilidade: Math.round(pontos * CUSTO_GOVERNABILIDADE_POR_PONTO_ENFASE),
      });
    }
  }

  return { estado: { ...estado, metricas, intencaoPorSegmento }, promessasGeradas };
}
