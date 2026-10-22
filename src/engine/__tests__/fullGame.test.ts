import { describe, expect, it } from "vitest";
import { aplicarAlocacaoVerba, avancarFase, criarNovoJogo, resolverDilema } from "../engine";
import { DILEMAS } from "../../data/dilemas";
import type { AlocacaoVerba, CandidatoId, TomCampanha } from "../types";

const TONS: TomCampanha[] = ["propositivo", "ataque", "moderado"];
const CANDIDATO_IDS: CandidatoId[] = ["luana", "rafael", "helena", "augusto"];

function alocacaoPadrao(caixaDisponivel: number): AlocacaoVerba {
  const porCanal = Math.max(caixaDisponivel / 6, 0);
  return { tv: porCanal, digital: porCanal, comicios: porCanal, pesquisas: porCanal, juridica: porCanal };
}

/** Joga uma partida completa do início ao fim, sem UI, para validar o critério de aceite. */
function jogarPartidaCompleta(jogadorId: CandidatoId, seed: number) {
  let state = criarNovoJogo(jogadorId, seed);
  let rodada = 0;

  while (!state.terminado && rodada < 10) {
    const jogador = state.candidatos[state.jogadorId];
    state = aplicarAlocacaoVerba(state, alocacaoPadrao(jogador.metricas.caixaMi));

    const dilemaDaFase = DILEMAS.find((d) => d.fase === state.faseAtual);
    if (dilemaDaFase) {
      const opcaoVisivel = dilemaDaFase.opcoes.find((o) => !o.oculta) ?? dilemaDaFase.opcoes[0];
      const conselheiro = dilemaDaFase.opinioes[0]?.conselheiroId;
      state = resolverDilema(state, dilemaDaFase, opcaoVisivel.id, conselheiro);
    }

    const tom = TONS[rodada % TONS.length];
    state = avancarFase(state, tom);
    rodada += 1;
  }

  return state;
}

describe("fluxo completo de uma partida (critério de aceite)", () => {
  for (const jogadorId of CANDIDATO_IDS) {
    it(`perfil ${jogadorId}: joga do início ao fim sem erros e produz um resultado`, () => {
      const resultado = jogarPartidaCompleta(jogadorId, 1);

      expect(resultado.terminado).toBe(true);
      expect(resultado.resultado).not.toBeNull();
      expect(resultado.resultado!.vencedorId).not.toBeNull();
      expect(Number.isFinite(resultado.resultado!.notaGovernabilidade)).toBe(true);

      // Cada percentual é arredondado independentemente a 1 casa decimal antes de
      // somar (ver calcularPlacarFinal), então a soma pode ficar a até ±0.2 de
      // 100 por acúmulo de arredondamento — não é sinal de voto "sumindo".
      const somaVotos = Object.values(resultado.resultado!.votosFinais).reduce((s, v) => s + v, 0);
      expect(somaVotos).toBeCloseTo(100, 0);
    });
  }

  it("é determinística: a mesma seed produz o mesmo resultado para o mesmo perfil", () => {
    const a = jogarPartidaCompleta("augusto", 777);
    const b = jogarPartidaCompleta("augusto", 777);
    expect(a.resultado).toEqual(b.resultado);
  });
});
