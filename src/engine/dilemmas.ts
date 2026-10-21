import {
  BONUS_CONSELHEIRO_BOM_FIT,
  BONUS_IMEDIATO_ANTIETICO,
  PENALIDADE_CONSELHEIRO_MAU_FIT,
  PROB_BASE_ESTOURO_RISCO,
  RODADAS_MAX_RISCO_OCULTO,
} from "../config/balance";
import { melhorConselheiro } from "./advisors";
import type {
  CandidatoEstado,
  ConselheiroId,
  Dilema,
  Metricas,
  OpcaoDilema,
  RiscoOculto,
} from "./types";

const METRICAS_0_100: (keyof Metricas)[] = [
  "intencaoVoto",
  "rejeicao",
  "tempoTV",
  "sentimento",
  "coesao",
  "credibilidade",
  "riscoJuridico",
];

function clampMetrica(chave: keyof Metricas, valor: number): number {
  if (chave === "caixaMi") return Math.max(0, valor);
  if (METRICAS_0_100.includes(chave)) return Math.min(100, Math.max(0, valor));
  return valor;
}

/**
 * Multiplicador de efeito ao seguir um conselheiro: interpola entre a penalidade
 * (fit = 0) e o bônus (fit = 1) do conselheiro seguido. Sem conselheiro seguido
 * (decisão por conta própria), o efeito é o valor-base do dilema (multiplicador 1).
 */
export function multiplicadorConselheiro(
  fit: Record<ConselheiroId, number>,
  conselheiroSeguidoId: ConselheiroId | undefined,
): number {
  if (!conselheiroSeguidoId) return 1;
  const fitSeguido = fit[conselheiroSeguidoId] ?? 0.5;
  return PENALIDADE_CONSELHEIRO_MAU_FIT + (BONUS_CONSELHEIRO_BOM_FIT - PENALIDADE_CONSELHEIRO_MAU_FIT) * fitSeguido;
}

export { melhorConselheiro };

export interface ResultadoOpcaoDilema {
  estado: CandidatoEstado;
  riscoGerado?: RiscoOculto;
  /** Quanto do ganho de intencaoVoto desta opção veio do pool de indecisos (ver capturaIndecisos). */
  indecisosCapturados: number;
}

/**
 * Aplica a opção escolhida de um dilema ao estado do candidato. Opções antiéticas
 * dão um ganho imediato extra (BONUS_IMEDIATO_ANTIETICO) e geram um risco oculto
 * que o motor passa a rolar nas próximas rodadas (ver engine.ts/avancarFase).
 */
export function aplicarOpcaoDilema(
  estado: CandidatoEstado,
  dilema: Dilema,
  opcao: OpcaoDilema,
  multiplicador: number,
): ResultadoOpcaoDilema {
  const fatorExtra = opcao.antietica ? BONUS_IMEDIATO_ANTIETICO : 1;
  const fatorTotal = multiplicador * fatorExtra;

  const metricas = { ...estado.metricas };
  for (const [chaveStr, valor] of Object.entries(opcao.efeitos)) {
    const chave = chaveStr as keyof Metricas;
    metricas[chave] = clampMetrica(chave, metricas[chave] + (valor as number) * fatorTotal);
  }

  const intencaoPorSegmento = { ...estado.intencaoPorSegmento };
  if (opcao.efeitosPorSegmento) {
    for (const [segStr, valor] of Object.entries(opcao.efeitosPorSegmento)) {
      const seg = segStr as keyof typeof intencaoPorSegmento;
      intencaoPorSegmento[seg] = Math.max(0, intencaoPorSegmento[seg] + (valor as number) * multiplicador);
    }
  }

  const novoEstado: CandidatoEstado = { ...estado, metricas, intencaoPorSegmento };

  const indecisosCapturados = opcao.capturaIndecisos
    ? Math.max(0, (opcao.efeitos.intencaoVoto ?? 0) * fatorTotal)
    : 0;

  let riscoGerado: RiscoOculto | undefined;
  if (opcao.antietica) {
    riscoGerado = {
      id: `${dilema.id}:${opcao.id}`,
      origemId: dilema.id,
      descricao: `${dilema.titulo} — opção "${opcao.texto}"`,
      probabilidadePorRodada: PROB_BASE_ESTOURO_RISCO,
      rodadasRestantes: RODADAS_MAX_RISCO_OCULTO,
      efeitoSeEstourar: { credibilidade: -12, riscoJuridico: 18, sentimento: -8 },
    };
  }

  return { estado: novoEstado, riscoGerado, indecisosCapturados };
}
