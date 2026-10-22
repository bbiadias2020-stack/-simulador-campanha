import { describe, expect, it } from "vitest";
import { BONUS_IMEDIATO_ANTIETICO, PROB_BASE_ESTOURO_RISCO } from "../../config/balance";
import { aplicarOpcaoDilema, multiplicadorConselheiro } from "../dilemmas";
import { CANDIDATOS_BASE } from "../../data/candidatos";
import { DILEMAS } from "../../data/dilemas";
import type { CandidatoEstado, ConselheiroId } from "../types";

const whatsappDilema = DILEMAS.find((d) => d.id === "disparo-whatsapp")!;
const deepfakeDilema = DILEMAS.find((d) => d.id === "ia-deepfake")!;

function estadoLuana(): CandidatoEstado {
  const base = CANDIDATOS_BASE.luana;
  return {
    id: "luana",
    metricas: { ...base.metricasIniciais },
    intencaoPorSegmento: { ...base.intencaoPorSegmentoInicial },
    tomAtual: "moderado",
    dividaMi: 0,
  };
}

describe("multiplicadorConselheiro", () => {
  it("é 1 quando nenhum conselheiro foi seguido", () => {
    const fit: Record<ConselheiroId, number> = { neusa: 0.9, caio: 0.1, sonia: 0.5, beto: 0.5 };
    expect(multiplicadorConselheiro(fit, undefined)).toBe(1);
  });

  it("é maior para fit alto do que para fit baixo", () => {
    const fit: Record<ConselheiroId, number> = { neusa: 0.9, caio: 0.1, sonia: 0.5, beto: 0.5 };
    expect(multiplicadorConselheiro(fit, "neusa")).toBeGreaterThan(multiplicadorConselheiro(fit, "caio"));
  });
});

describe("aplicarOpcaoDilema", () => {
  it("aplica os efeitos da opção escolhida multiplicados pelo fit do conselheiro", () => {
    const opcaoB = whatsappDilema.opcoes.find((o) => o.id === "B")!;
    const estado = estadoLuana();
    const { estado: atualizado } = aplicarOpcaoDilema(estado, whatsappDilema, opcaoB, 1);
    expect(atualizado.metricas.riscoJuridico).toBeLessThan(estado.metricas.riscoJuridico);
    expect(atualizado.metricas.credibilidade).toBeGreaterThan(estado.metricas.credibilidade);
  });

  it("opção antiética dá ganho imediato extra e gera um risco oculto", () => {
    const opcaoA = whatsappDilema.opcoes.find((o) => o.id === "A")!;
    const estado = estadoLuana();
    const semBonusEsperado = opcaoA.efeitos.intencaoVoto ?? 0;

    const { estado: atualizado, riscoGerado } = aplicarOpcaoDilema(estado, whatsappDilema, opcaoA, 1);

    expect(atualizado.metricas.intencaoVoto - estado.metricas.intencaoVoto).toBeGreaterThan(semBonusEsperado);
    expect(riscoGerado).toBeDefined();
    expect(riscoGerado?.probabilidadePorRodada).toBeGreaterThan(0);
  });

  it("opção ética não gera risco oculto", () => {
    const opcaoB = whatsappDilema.opcoes.find((o) => o.id === "B")!;
    const { riscoGerado } = aplicarOpcaoDilema(estadoLuana(), whatsappDilema, opcaoB, 1);
    expect(riscoGerado).toBeUndefined();
  });

  it("opção com capturaIndecisos devolve indecisosCapturados igual ao ganho de intenção de voto", () => {
    const indecisosDilema = DILEMAS.find((d) => d.id === "indecisos-mobilizacao")!;
    const opcaoA = indecisosDilema.opcoes.find((o) => o.id === "A")!;
    const { indecisosCapturados } = aplicarOpcaoDilema(estadoLuana(), indecisosDilema, opcaoA, 1);
    expect(indecisosCapturados).toBe(opcaoA.efeitos.intencaoVoto);
  });

  it("opção sem capturaIndecisos devolve indecisosCapturados zero", () => {
    const opcaoB = whatsappDilema.opcoes.find((o) => o.id === "B")!;
    const { indecisosCapturados } = aplicarOpcaoDilema(estadoLuana(), whatsappDilema, opcaoB, 1);
    expect(indecisosCapturados).toBe(0);
  });

  it("deepfake: ganho imediato menor e risco de estourar maior que o padrão antiético global", () => {
    const opcaoDeepfake = deepfakeDilema.opcoes.find((o) => o.id === "A")!;
    expect(opcaoDeepfake.ganhoImediatoAntieticoOverride).toBeLessThan(BONUS_IMEDIATO_ANTIETICO);
    expect(opcaoDeepfake.probabilidadeEstouroOverride).toBeGreaterThan(PROB_BASE_ESTOURO_RISCO);

    const { riscoGerado } = aplicarOpcaoDilema(estadoLuana(), deepfakeDilema, opcaoDeepfake, 1);
    expect(riscoGerado?.probabilidadePorRodada).toBe(opcaoDeepfake.probabilidadeEstouroOverride);
  });
});
