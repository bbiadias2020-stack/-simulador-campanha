import { DILEMAS } from "../data/dilemas";
import { randomFloat } from "./rng";
import type { Dilema, GameState } from "./types";

const MAX_DILEMAS_POR_RODADA = 2;

/**
 * Escolhe até 2 dilemas para a fase atual (regra da spec: "1 ou 2 dilemas" por
 * rodada), com seleção determinística a partir da seed — mesma semente sempre
 * mostra os mesmos dilemas, para o replay fazer sentido.
 */
export function dilemasDaFase(state: GameState): Dilema[] {
  const candidatos = DILEMAS.filter(
    (d) => d.fase === state.faseAtual && !state.dilemasResolvidosIds.includes(d.id),
  );
  if (candidatos.length <= MAX_DILEMAS_POR_RODADA) return candidatos;

  const comPeso = candidatos.map((dilema, i) => ({
    dilema,
    peso: randomFloat(state.seed, state.faseIndex * 1000 + i),
  }));
  comPeso.sort((a, b) => a.peso - b.peso);
  return comPeso.slice(0, MAX_DILEMAS_POR_RODADA).map((c) => c.dilema);
}
