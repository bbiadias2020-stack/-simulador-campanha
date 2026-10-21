import { describe, expect, it } from "vitest";
import { criarNovoJogo } from "../engine";
import { apurarPrimeiroTurno, apurarSegundoTurno } from "../secondRound";
import type { CandidatoId, GameState } from "../types";

function comIntencao(state: GameState, valores: Partial<Record<CandidatoId, number>>): GameState {
  const candidatos = { ...state.candidatos };
  for (const id of Object.keys(valores) as CandidatoId[]) {
    candidatos[id] = { ...candidatos[id], metricas: { ...candidatos[id].metricas, intencaoVoto: valores[id]! } };
  }
  return { ...state, candidatos };
}

describe("apurarPrimeiroTurno", () => {
  it("decide a eleição no 1º turno quando alguém passa de 50% dos votos válidos", () => {
    const state = comIntencao(criarNovoJogo("luana", 1), { luana: 55, rafael: 15, helena: 20, augusto: 10 });
    const apuracao = apurarPrimeiroTurno(state);
    expect(apuracao.decidido).toBe(true);
    expect(apuracao.vencedorId).toBe("luana");
  });

  it("vai para o 2º turno com os 2 mais votados quando ninguém passa de 50%", () => {
    const state = comIntencao(criarNovoJogo("luana", 1), { luana: 40, rafael: 5, helena: 45, augusto: 10 });
    const apuracao = apurarPrimeiroTurno(state);
    expect(apuracao.decidido).toBe(false);
    expect(apuracao.finalistas).toEqual(["helena", "luana"]);
  });
});

describe("apurarSegundoTurno", () => {
  it("transfere votos dos eliminados por proximidade ideológica", () => {
    let state = comIntencao(criarNovoJogo("luana", 1), { luana: 30, rafael: 10, helena: 35, augusto: 25 });
    state = { ...state, finalistasSegundoTurno: ["helena", "luana"] };

    const apuracao = apurarSegundoTurno(state);

    expect(apuracao.decidido).toBe(true);
    // Augusto (conservador/mercado) é ideologicamente mais próximo da Helena;
    // Rafael (progressista/mercado) é mais próximo da Luana no eixo de costumes.
    const helena = apuracao.ranking.find((r) => r.id === "helena")!;
    const luana = apuracao.ranking.find((r) => r.id === "luana")!;
    expect(helena.percentual + luana.percentual).toBeCloseTo(100, 5);
    expect(helena.percentual).toBeGreaterThan(35); // ganhou parte dos votos do Augusto
    expect(luana.percentual).toBeGreaterThan(30); // ganhou parte dos votos do Rafael
  });

  it("lança erro se chamado sem finalistas definidos", () => {
    const state = criarNovoJogo("luana", 1);
    expect(() => apurarSegundoTurno(state)).toThrow();
  });
});
