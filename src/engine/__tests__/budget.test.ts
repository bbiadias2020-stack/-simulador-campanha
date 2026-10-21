import { describe, expect, it } from "vitest";
import { aplicarAlocacaoVerba, efeitoVerba } from "../budget";
import type { CandidatoEstado } from "../types";

function estadoBase(): CandidatoEstado {
  return {
    id: "luana",
    metricas: {
      intencaoVoto: 18,
      rejeicao: 46,
      caixaMi: 45,
      tempoTV: 22,
      sentimento: 52,
      coesao: 78,
      credibilidade: 61,
      riscoJuridico: 12,
    },
    intencaoPorSegmento: { jovens: 31, mulheres: 25, evangelicos: 6, classeC: 17, nordeste: 19, sul: 12 },
    tomAtual: "moderado",
    dividaMi: 0,
  };
}

describe("efeitoVerba (retornos decrescentes)", () => {
  it("é zero para gasto zero", () => {
    expect(efeitoVerba(0)).toBe(0);
  });

  it("o mesmo incremento de gasto rende menos efeito conforme o gasto total cresce", () => {
    const ganhoInicial = efeitoVerba(20) - efeitoVerba(10);
    const ganhoDepois = efeitoVerba(40) - efeitoVerba(30);
    expect(ganhoInicial).toBeGreaterThan(ganhoDepois);
  });

  it("satura no teto para gastos muito altos", () => {
    expect(efeitoVerba(1_000_000)).toBeLessThanOrEqual(6);
  });
});

describe("aplicarAlocacaoVerba", () => {
  it("debita o gasto total da caixa", () => {
    const estado = estadoBase();
    const atualizado = aplicarAlocacaoVerba(estado, { tv: 5, digital: 5, comicios: 0, pesquisas: 0, juridica: 0 });
    expect(atualizado.metricas.caixaMi).toBeCloseTo(35, 5);
  });

  it("gasto em TV aumenta tempo de TV e intenção de voto", () => {
    const estado = estadoBase();
    const atualizado = aplicarAlocacaoVerba(estado, { tv: 10, digital: 0, comicios: 0, pesquisas: 0, juridica: 0 });
    expect(atualizado.metricas.tempoTV).toBeGreaterThan(estado.metricas.tempoTV);
    expect(atualizado.metricas.intencaoVoto).toBeGreaterThan(estado.metricas.intencaoVoto);
  });

  it("gasto em digital favorece o segmento jovens mais que os outros", () => {
    const estado = estadoBase();
    const atualizado = aplicarAlocacaoVerba(estado, { tv: 0, digital: 10, comicios: 0, pesquisas: 0, juridica: 0 });
    const ganhoJovens = atualizado.intencaoPorSegmento.jovens - estado.intencaoPorSegmento.jovens;
    const ganhoSul = atualizado.intencaoPorSegmento.sul - estado.intencaoPorSegmento.sul;
    expect(ganhoJovens).toBeGreaterThan(ganhoSul);
  });

  it("gastar mais que a caixa disponível gera dívida e não deixa caixa negativa", () => {
    const estado = estadoBase();
    const atualizado = aplicarAlocacaoVerba(estado, { tv: 60, digital: 0, comicios: 0, pesquisas: 0, juridica: 0 });
    expect(atualizado.metricas.caixaMi).toBe(0);
    expect(atualizado.dividaMi).toBeGreaterThan(0);
  });

  it("verba em equipe jurídica reduz o risco jurídico", () => {
    const estado = estadoBase();
    const atualizado = aplicarAlocacaoVerba(estado, { tv: 0, digital: 0, comicios: 0, pesquisas: 0, juridica: 10 });
    expect(atualizado.metricas.riscoJuridico).toBeLessThan(estado.metricas.riscoJuridico);
  });
});
