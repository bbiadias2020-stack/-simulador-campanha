import { describe, expect, it } from "vitest";
import { criarNovoJogo } from "../engine";
import { calcularPlacarFinal, calcularScoreRanking } from "../score";
import type { ApuracaoTurno } from "../secondRound";
import type { PlacarFinal } from "../types";

describe("calcularPlacarFinal", () => {
  it("usa o ranking apurado como votos finais e aponta o vencedor", () => {
    const state = criarNovoJogo("luana", 1);
    const apuracao: ApuracaoTurno = {
      decidido: true,
      vencedorId: "luana",
      ranking: [
        { id: "luana", percentual: 55 },
        { id: "helena", percentual: 20 },
        { id: "augusto", percentual: 15 },
        { id: "rafael", percentual: 10 },
      ],
    };
    const placar = calcularPlacarFinal(state, apuracao, false);
    expect(placar.vencedorId).toBe("luana");
    expect(placar.votosFinais.luana).toBe(55);
    expect(placar.foiSegundoTurno).toBe(false);
  });

  it("promessas feitas reduzem a nota de governabilidade", () => {
    const state = criarNovoJogo("luana", 1);
    const comPromessa = { ...state, promessas: [{ descricao: "Cargo prometido", custoGovernabilidade: 20 }] };
    const apuracao: ApuracaoTurno = { decidido: true, vencedorId: "luana", ranking: [{ id: "luana", percentual: 60 }] };

    const semPromessa = calcularPlacarFinal(state, apuracao, false);
    const comPromessaPlacar = calcularPlacarFinal(comPromessa, apuracao, false);

    expect(comPromessaPlacar.notaGovernabilidade).toBeLessThan(semPromessa.notaGovernabilidade);
  });

  it("reporta a dívida de campanha do jogador", () => {
    const state = criarNovoJogo("luana", 1);
    const comDivida = {
      ...state,
      candidatos: { ...state.candidatos, luana: { ...state.candidatos.luana, dividaMi: 12.3 } },
    };
    const apuracao: ApuracaoTurno = { decidido: true, vencedorId: "luana", ranking: [{ id: "luana", percentual: 60 }] };
    const placar = calcularPlacarFinal(comDivida, apuracao, false);
    expect(placar.dividaMi).toBe(12.3);
  });
});

describe("calcularScoreRanking", () => {
  it("é a média de votos finais e nota de governabilidade", () => {
    const placar: PlacarFinal = {
      vencedorId: "luana",
      votosFinais: { luana: 60, rafael: 20, helena: 10, augusto: 10 },
      dividaMi: 0,
      promessasFeitas: [],
      notaGovernabilidade: 80,
      foiSegundoTurno: false,
    };
    expect(calcularScoreRanking(placar, "luana")).toBe(70);
  });

  it("usa 0 de votos quando o jogador não está no placar (ex.: cassado/eliminado)", () => {
    const placar: PlacarFinal = {
      vencedorId: "helena",
      votosFinais: { helena: 60, rafael: 20, augusto: 10, luana: 0 },
      dividaMi: 0,
      promessasFeitas: [],
      notaGovernabilidade: 0,
      foiSegundoTurno: false,
      cassado: true,
    };
    expect(calcularScoreRanking(placar, "luana")).toBe(0);
  });
});
