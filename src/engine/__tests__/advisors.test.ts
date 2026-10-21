import { describe, expect, it } from "vitest";
import {
  atualizarHistoricoConselheiros,
  calcularFitConselheiros,
  historicoInicial,
  melhorConselheiro,
} from "../advisors";
import { CANDIDATOS_BASE } from "../../data/candidatos";
import { DILEMAS } from "../../data/dilemas";
import type { CandidatoEstado } from "../types";

const videoDilema = DILEMAS.find((d) => d.id === "video-2015")!;

function estadoDe(id: "luana" | "helena"): CandidatoEstado {
  const base = CANDIDATOS_BASE[id];
  return {
    id,
    metricas: { ...base.metricasIniciais },
    intencaoPorSegmento: { ...base.intencaoPorSegmentoInicial },
    tomAtual: "moderado",
    dividaMi: 0,
  };
}

describe("calcularFitConselheiros", () => {
  it("dá fit alto para Sônia em crise de desinformação", () => {
    const fit = calcularFitConselheiros(videoDilema, CANDIDATOS_BASE.luana, estadoDe("luana"));
    expect(fit.sonia).toBeGreaterThan(0.7);
  });

  it("dá fit alto para Caio com candidato de base digital grande (Luana)", () => {
    const fit = calcularFitConselheiros(videoDilema, CANDIDATOS_BASE.luana, estadoDe("luana"));
    expect(fit.caio).toBeGreaterThan(0.7);
  });

  it("dá fit baixo para Caio com candidato de base digital pequena (Helena)", () => {
    const fit = calcularFitConselheiros(videoDilema, CANDIDATOS_BASE.helena, estadoDe("helena"));
    expect(fit.caio).toBeLessThan(0.5);
  });
});

describe("melhorConselheiro", () => {
  it("escolhe Sônia como melhor conselheira para a crise do vídeo (Luana)", () => {
    const fit = calcularFitConselheiros(videoDilema, CANDIDATOS_BASE.luana, estadoDe("luana"));
    expect(melhorConselheiro(videoDilema, fit)).toBe("sonia");
  });
});

describe("atualizarHistoricoConselheiros", () => {
  it("marca acerto para quem seguido é o melhor fit e ignorado para os demais", () => {
    const fit = calcularFitConselheiros(videoDilema, CANDIDATOS_BASE.luana, estadoDe("luana"));
    const { historico, acertou } = atualizarHistoricoConselheiros(
      historicoInicial(),
      videoDilema,
      fit,
      "sonia",
    );
    expect(acertou).toBe(true);
    expect(historico.sonia.acertos).toBe(1);
    expect(historico.neusa.vezesIgnorado).toBe(1);
    expect(historico.caio.vezesIgnorado).toBe(1);
    expect(historico.beto.vezesIgnorado).toBe(1);
  });

  it("marca erro quando o conselheiro seguido não é o melhor fit", () => {
    const fit = calcularFitConselheiros(videoDilema, CANDIDATOS_BASE.luana, estadoDe("luana"));
    const { acertou } = atualizarHistoricoConselheiros(historicoInicial(), videoDilema, fit, "beto");
    expect(acertou).toBe(false);
  });
});
