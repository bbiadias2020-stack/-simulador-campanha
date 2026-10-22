import { describe, expect, it } from "vitest";
import { reagirAdversarios } from "../adversaries";
import { criarNovoJogo } from "../engine";

describe("reagirAdversarios", () => {
  it("tom de ataque: o adversário líder contra-ataca (ganha núcleo, perde sentimento)", () => {
    const state = criarNovoJogo("rafael", 1); // rafael não lidera nada, helena é a líder
    const atualizado = reagirAdversarios(state, "ataque");
    expect(atualizado.candidatos.helena.metricas.intencaoVoto).toBeGreaterThan(
      state.candidatos.helena.metricas.intencaoVoto,
    );
    expect(atualizado.candidatos.helena.metricas.sentimento).toBeLessThan(
      state.candidatos.helena.metricas.sentimento,
    );
    expect(atualizado.candidatos.helena.tomAtual).toBe("ataque");
  });

  it("tom moderado: o adversário ideologicamente mais distante radicaliza no segmento mais forte dele", () => {
    const state = criarNovoJogo("luana", 1); // luana é progressista; helena/augusto são conservadores
    const atualizado = reagirAdversarios(state, "moderado");
    const algumAdversarioRadicalizou = (["rafael", "helena", "augusto"] as const).some(
      (id) => atualizado.candidatos[id].tomAtual === "radical",
    );
    expect(algumAdversarioRadicalizou).toBe(true);
  });

  it("tom propositivo não altera os adversários", () => {
    const state = criarNovoJogo("luana", 1);
    const atualizado = reagirAdversarios(state, "propositivo");
    expect(atualizado.candidatos).toEqual(state.candidatos);
  });

  it("não afeta o próprio candidato do jogador", () => {
    const state = criarNovoJogo("luana", 1);
    const atualizado = reagirAdversarios(state, "ataque");
    expect(atualizado.candidatos.luana).toEqual(state.candidatos.luana);
  });

  it("tom de ataque: candidatos 'ociosos' (nem jogador, nem alvo) também ganham voto", () => {
    const state = criarNovoJogo("rafael", 1); // rafael não lidera nada, helena é a líder/alvo
    const atualizado = reagirAdversarios(state, "ataque");
    expect(atualizado.candidatos.luana.metricas.intencaoVoto).toBeGreaterThan(
      state.candidatos.luana.metricas.intencaoVoto,
    );
    expect(atualizado.candidatos.augusto.metricas.intencaoVoto).toBeGreaterThan(
      state.candidatos.augusto.metricas.intencaoVoto,
    );
  });
});
