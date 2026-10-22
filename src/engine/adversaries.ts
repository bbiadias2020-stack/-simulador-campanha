import {
  BONUS_CANDIDATO_OCIOSO_ATAQUE,
  CONTRA_ATAQUE_GANHO_NUCLEO,
  CONTRA_ATAQUE_PERDA_SENTIMENTO,
  CRESCIMENTO_ORGANICO_ADVERSARIO_DESVIO,
  CRESCIMENTO_ORGANICO_ADVERSARIO_MEDIO,
  RADICALIZACAO_GANHO_SEGMENTO_AFIM,
  RADICALIZACAO_PERDA_CENTRO,
} from "../config/balance";
import { gaussianAt } from "./rng";
import type { CandidatoEstado, CandidatoId, GameState, TomCampanha } from "./types";

/** Espaço de cursor dedicado ao crescimento orgânico dos adversários, por rodada. */
const CURSOR_BASE_CRESCIMENTO = 5_000_000;

/**
 * Os adversários também fazem campanha fora de tela: a cada rodada somam um
 * pouco de intenção de voto por conta própria, não só quando reagem ao tom do
 * jogador. Ver CRESCIMENTO_ORGANICO_ADVERSARIO_MEDIO em balance.ts.
 */
export function aplicarCrescimentoOrganico(state: GameState): GameState {
  const adversarios = adversariosDe(state);
  const candidatos = { ...state.candidatos };
  const idsOrdenados = (Object.keys(state.candidatos) as CandidatoId[]).sort();

  for (const id of adversarios) {
    const idx = idsOrdenados.indexOf(id);
    const ruido = gaussianAt(state.seed, CURSOR_BASE_CRESCIMENTO + state.faseIndex * 10 + idx);
    const ganho = Math.max(0, CRESCIMENTO_ORGANICO_ADVERSARIO_MEDIO + ruido * CRESCIMENTO_ORGANICO_ADVERSARIO_DESVIO);
    candidatos[id] = {
      ...candidatos[id],
      metricas: { ...candidatos[id].metricas, intencaoVoto: Math.min(100, candidatos[id].metricas.intencaoVoto + ganho) },
    };
  }

  return { ...state, candidatos };
}

function adversariosDe(state: GameState): CandidatoId[] {
  return (Object.keys(state.candidatos) as CandidatoId[]).filter((id) => id !== state.jogadorId);
}

function liderEntre(state: GameState, ids: CandidatoId[]): CandidatoId {
  return ids.reduce((lider, atual) =>
    state.candidatos[atual].metricas.intencaoVoto > state.candidatos[lider].metricas.intencaoVoto
      ? atual
      : lider,
  ids[0]);
}

function segmentoMaisForte(estado: CandidatoEstado): keyof typeof estado.intencaoPorSegmento {
  const entradas = Object.entries(estado.intencaoPorSegmento) as [keyof typeof estado.intencaoPorSegmento, number][];
  return entradas.reduce((melhor, atual) => (atual[1] > melhor[1] ? atual : melhor), entradas[0])[0];
}

/**
 * IA simples dos 3 adversários: eles não jogam o jogo completo, só reagem ao tom
 * escolhido pelo jogador na rodada (ver Parte 2 da spec — "adversário que reage").
 * - Jogador ataca → o adversário líder contra-ataca: ganha no núcleo duro, mas
 *   perde sentimento geral (polarização). E quem NÃO é o alvo também ganha um
 *   pouco — "candidato ocioso ganha" (ver BONUS_CANDIDATO_OCIOSO_ATAQUE): atacar
 *   fortalece dois adversários ao mesmo tempo, não só um.
 * - Jogador ocupa o centro (moderado) → o adversário ideologicamente mais distante
 *   radicaliza: reforça seu segmento mais forte, mas perde apelo de centro.
 */
export function reagirAdversarios(state: GameState, tomJogador: TomCampanha): GameState {
  const adversarios = adversariosDe(state);
  if (adversarios.length === 0) return state;

  const candidatos = { ...state.candidatos };

  if (tomJogador === "ataque") {
    const alvoId = liderEntre(state, adversarios);
    const alvo = candidatos[alvoId];
    candidatos[alvoId] = {
      ...alvo,
      metricas: {
        ...alvo.metricas,
        intencaoVoto: Math.min(100, alvo.metricas.intencaoVoto + CONTRA_ATAQUE_GANHO_NUCLEO),
        sentimento: Math.max(0, alvo.metricas.sentimento - CONTRA_ATAQUE_PERDA_SENTIMENTO),
      },
      tomAtual: "ataque",
    };

    for (const id of adversarios) {
      if (id === alvoId) continue;
      const ocioso = candidatos[id];
      candidatos[id] = {
        ...ocioso,
        metricas: { ...ocioso.metricas, intencaoVoto: Math.min(100, ocioso.metricas.intencaoVoto + BONUS_CANDIDATO_OCIOSO_ATAQUE) },
      };
    }
  }

  if (tomJogador === "moderado") {
    const jogadorBase = state.candidatosBase[state.jogadorId];
    const distante = adversarios.find((id) => state.candidatosBase[id].costumes !== jogadorBase.costumes) ?? adversarios[0];
    const alvo = candidatos[distante];
    const segmentoForte = segmentoMaisForte(alvo);
    candidatos[distante] = {
      ...alvo,
      metricas: {
        ...alvo.metricas,
        intencaoVoto: Math.max(0, alvo.metricas.intencaoVoto - RADICALIZACAO_PERDA_CENTRO * 0.5),
        coesao: Math.min(100, alvo.metricas.coesao + RADICALIZACAO_PERDA_CENTRO),
      },
      intencaoPorSegmento: {
        ...alvo.intencaoPorSegmento,
        [segmentoForte]: alvo.intencaoPorSegmento[segmentoForte] + RADICALIZACAO_GANHO_SEGMENTO_AFIM,
      },
      tomAtual: "radical",
    };
  }

  return { ...state, candidatos };
}
