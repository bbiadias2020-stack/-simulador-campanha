import {
  LIMIAR_DIVIDA_VITORIA_PROBLEMATICA,
  LIMIAR_GOVERNABILIDADE_VITORIA_CONTESTADA,
  LIMIAR_MARGEM_VITORIA_AMPLA,
  LIMIAR_MARGEM_VITORIA_APERTADA,
  LIMIAR_REJEICAO_VITORIA_CONTESTADA,
  NOTA_GOVERNABILIDADE_BASE,
  PESO_CREDIBILIDADE_GOVERNABILIDADE,
  PESO_COESAO_GOVERNABILIDADE,
} from "../config/balance";
import type { ApuracaoTurno } from "./secondRound";
import type { CandidatoId, GameState, PlacarFinal } from "./types";

/**
 * Placar final multidimensional (votos, dívida, promessas e nota de
 * governabilidade), conforme a Parte 1/2 da spec.
 */
export function calcularPlacarFinal(state: GameState, apuracao: ApuracaoTurno, foiSegundoTurno: boolean): PlacarFinal {
  const jogador = state.candidatos[state.jogadorId];

  const votosFinais = {} as Record<CandidatoId, number>;
  for (const id of Object.keys(state.candidatos) as CandidatoId[]) votosFinais[id] = 0;
  for (const r of apuracao.ranking) votosFinais[r.id] = Math.round(r.percentual * 10) / 10;

  const custoPromessas = state.promessas.reduce((soma, p) => soma + p.custoGovernabilidade, 0);
  const notaBruta =
    NOTA_GOVERNABILIDADE_BASE +
    PESO_COESAO_GOVERNABILIDADE * (jogador.metricas.coesao - 50) +
    PESO_CREDIBILIDADE_GOVERNABILIDADE * (jogador.metricas.credibilidade - 50) -
    custoPromessas;

  return {
    vencedorId: apuracao.vencedorId ?? null,
    votosFinais,
    dividaMi: Math.round(jogador.dividaMi * 10) / 10,
    promessasFeitas: state.promessas,
    notaGovernabilidade: Math.min(100, Math.max(0, Math.round(notaBruta))),
    foiSegundoTurno,
  };
}

export interface SeloResultado {
  icone: string;
  titulo: string;
  descricao: string;
}

/**
 * Vencer não é um resultado único: a mesma vitória pode vir com folga e mandato
 * forte, ou raspando e já contestada, endividada, sem governabilidade. Esta
 * função lê o placar final + as métricas do jogador no fim de jogo e devolve
 * uma lista de selos descrevendo "como" foi a vitória — pensada para a tela
 * final, não para nenhum cálculo de jogo (não afeta o resultado em si).
 */
export function classificarVitoria(state: GameState): SeloResultado[] {
  const resultado = state.resultado;
  if (!resultado || resultado.vencedorId !== state.jogadorId) return [];

  const jogador = state.candidatos[state.jogadorId];
  const selos: SeloResultado[] = [];

  const percentuais = Object.values(resultado.votosFinais).sort((a, b) => b - a);
  const margem = (percentuais[0] ?? 0) - (percentuais[1] ?? 0);

  if (margem >= LIMIAR_MARGEM_VITORIA_AMPLA) {
    selos.push({
      icone: "📊",
      titulo: "Vitória com maioria ampla",
      descricao: `Venceu com ${margem.toFixed(1)} pontos de vantagem sobre o 2º colocado — mandato forte, sem viela estreita para governar.`,
    });
  } else if (margem <= LIMIAR_MARGEM_VITORIA_APERTADA) {
    selos.push({
      icone: "🤏",
      titulo: "Vitória apertada",
      descricao: `Só ${margem.toFixed(1)} pontos à frente do 2º colocado — por um fio, numa eleição que poderia ter virado.`,
    });
  }

  if (resultado.notaGovernabilidade < LIMIAR_GOVERNABILIDADE_VITORIA_CONTESTADA || jogador.metricas.rejeicao > LIMIAR_REJEICAO_VITORIA_CONTESTADA) {
    selos.push({
      icone: "📣",
      titulo: "Vitória contestada",
      descricao: `Com ${jogador.metricas.rejeicao}% de rejeição e governabilidade em ${resultado.notaGovernabilidade}/100, a oposição não reconhece o resultado como legítimo — protestos e desgaste político aguardam a posse.`,
    });
  }

  if (resultado.dividaMi >= LIMIAR_DIVIDA_VITORIA_PROBLEMATICA) {
    selos.push({
      icone: "💸",
      titulo: "Vitória com dívida nas alturas",
      descricao: `R$ ${resultado.dividaMi} mi em dívida de campanha — o novo governo começa pagando fiado, não investindo em política pública.`,
    });
  }

  if (selos.length === 0) {
    selos.push({
      icone: "🏛️",
      titulo: "Vitória consolidada",
      descricao: "Margem confortável, contas em ordem, governabilidade sólida — a eleição mais tranquila que uma campanha pode pedir.",
    });
  }

  return selos;
}

/**
 * Score único (0–100) para o ranking público entre partidas de perfis e
 * sementes diferentes: metade pelo % de votos finais do jogador, metade pela
 * nota de governabilidade — assim tanto "ganhar" quanto "governar bem depois"
 * contam, e dá pra comparar quem venceu com quem perdeu mas chegou perto.
 */
export function calcularScoreRanking(resultado: PlacarFinal, jogadorId: CandidatoId): number {
  const votos = resultado.votosFinais[jogadorId] ?? 0;
  return Math.round((votos + resultado.notaGovernabilidade) * 5) / 10;
}
