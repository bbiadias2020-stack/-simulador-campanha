import { describe, expect, it } from "vitest";
import { aplicarAlocacaoVerba, aplicarPlataforma, avancarFase, criarNovoJogo, resolverDilema } from "../engine";
import { TIPO_RODADA, ORDEM_FASES } from "../types";
import type { GameState } from "../types";
import { DILEMAS } from "../../data/dilemas";

const videoDilema = DILEMAS.find((d) => d.id === "video-2015")!;
const whatsappDilema = DILEMAS.find((d) => d.id === "disparo-whatsapp")!;
const indecisosDilema = DILEMAS.find((d) => d.id === "indecisos-mobilizacao")!;

describe("ORDEM_FASES", () => {
  it("tem as 9 fases na ordem esperada, terminando em 1º e 2º turno", () => {
    expect(ORDEM_FASES).toEqual([
      "pre_campanha",
      "plataforma_governo",
      "convencao",
      "campanha_oficial",
      "campanha_intermediaria",
      "debates",
      "reta_final",
      "primeiro_turno",
      "segundo_turno",
    ]);
  });
});

describe("TIPO_RODADA", () => {
  it("nem toda fase é uma rodada de verba", () => {
    expect(TIPO_RODADA.plataforma_governo).toBe("plataforma");
    expect(TIPO_RODADA.convencao).toBe("dilema_ou_tom");
    expect(TIPO_RODADA.debates).toBe("dilema_ou_tom");
    expect(TIPO_RODADA.campanha_oficial).toBe("verba");
  });
});

describe("criarNovoJogo", () => {
  it("cria estado inicial com os 4 candidatos e fase pré-campanha", () => {
    const state = criarNovoJogo("luana", 1);
    expect(Object.keys(state.candidatos).sort()).toEqual(["augusto", "helena", "luana", "rafael"]);
    expect(state.faseAtual).toBe("pre_campanha");
    expect(state.candidatos.luana.metricas.intencaoVoto).toBe(18);
  });

  it("é determinístico para o mesmo seed (replay)", () => {
    const a = criarNovoJogo("luana", 7);
    const b = criarNovoJogo("luana", 7);
    expect(a).toEqual(b);
  });
});

describe("aplicarAlocacaoVerba", () => {
  it("só afeta o candidato do jogador, não os adversários", () => {
    const state = criarNovoJogo("luana", 1);
    const atualizado = aplicarAlocacaoVerba(state, { tv: 10, digital: 0, comicios: 0, pesquisas: 0, juridica: 0 });
    expect(atualizado.candidatos.luana.metricas.caixaMi).toBeLessThan(state.candidatos.luana.metricas.caixaMi);
    expect(atualizado.candidatos.helena).toEqual(state.candidatos.helena);
  });

  it("acumula investimento em pesquisas", () => {
    const state = criarNovoJogo("luana", 1);
    const atualizado = aplicarAlocacaoVerba(state, { tv: 0, digital: 0, comicios: 0, pesquisas: 8, juridica: 0 });
    expect(atualizado.pesquisaInvestimentoAcumuladoMi).toBe(8);
  });
});

describe("aplicarPlataforma", () => {
  it("sobe intenção de voto sem custar caixa, e favorece o segmento afim à área", () => {
    const state = criarNovoJogo("luana", 1);
    const atualizado = aplicarPlataforma(state, { saude: 5, seguranca: 0, educacao: 0, economia: 0 });

    expect(atualizado.candidatos.luana.metricas.caixaMi).toBe(state.candidatos.luana.metricas.caixaMi);
    expect(atualizado.candidatos.luana.metricas.intencaoVoto).toBeGreaterThan(state.candidatos.luana.metricas.intencaoVoto);

    const ganhoClasseC = atualizado.candidatos.luana.intencaoPorSegmento.classeC - state.candidatos.luana.intencaoPorSegmento.classeC;
    const ganhoEvangelicos =
      atualizado.candidatos.luana.intencaoPorSegmento.evangelicos - state.candidatos.luana.intencaoPorSegmento.evangelicos;
    expect(ganhoClasseC).toBeGreaterThan(ganhoEvangelicos); // saúde favorece classeC/nordeste, não evangélicos
  });

  it("ênfase alta (≥ limiar) vira promessa formal; ênfase baixa não", () => {
    const state = criarNovoJogo("luana", 1);
    const comPromessa = aplicarPlataforma(state, { saude: 8, seguranca: 0, educacao: 0, economia: 0 });
    const semPromessa = aplicarPlataforma(state, { saude: 3, seguranca: 0, educacao: 0, economia: 0 });

    expect(comPromessa.promessas).toHaveLength(1);
    expect(semPromessa.promessas).toHaveLength(0);
  });

  it("só afeta o candidato do jogador", () => {
    const state = criarNovoJogo("luana", 1);
    const atualizado = aplicarPlataforma(state, { saude: 5, seguranca: 5, educacao: 5, economia: 5 });
    expect(atualizado.candidatos.helena).toEqual(state.candidatos.helena);
  });

  it("ênfase extrema (acima de 8) custa governabilidade desproporcionalmente mais por ponto", () => {
    const state = criarNovoJogo("luana", 1);
    const moderada = aplicarPlataforma(state, { saude: 8, seguranca: 0, educacao: 0, economia: 0 });
    const extrema = aplicarPlataforma(state, { saude: 10, seguranca: 0, educacao: 0, economia: 0 });

    const custoPorPontoModerado = moderada.promessas[0].custoGovernabilidade / 8;
    const custoPorPontoExtremo = extrema.promessas[0].custoGovernabilidade / 10;
    expect(custoPorPontoExtremo).toBeGreaterThan(custoPorPontoModerado);
  });

  it("dívida de campanha alta aumenta o custo de governabilidade da promessa", () => {
    const state = criarNovoJogo("luana", 1);
    const comDivida = {
      ...state,
      candidatos: { ...state.candidatos, luana: { ...state.candidatos.luana, dividaMi: 30 } },
    };

    const semDivida = aplicarPlataforma(state, { saude: 8, seguranca: 0, educacao: 0, economia: 0 });
    const comDividaResultado = aplicarPlataforma(comDivida, { saude: 8, seguranca: 0, educacao: 0, economia: 0 });

    expect(comDividaResultado.promessas[0].custoGovernabilidade).toBeGreaterThan(
      semDivida.promessas[0].custoGovernabilidade,
    );
  });
});

describe("resolverDilema", () => {
  it("seguir o conselheiro de melhor fit (Sônia, opção E) dá efeito maior que não seguir ninguém", () => {
    const state = criarNovoJogo("luana", 1);
    const comSonia = resolverDilema(state, videoDilema, "E", "sonia");
    const semConselheiro = resolverDilema(state, videoDilema, "E", undefined);

    const ganhoComSonia = comSonia.candidatos.luana.metricas.sentimento - state.candidatos.luana.metricas.sentimento;
    const ganhoSemConselheiro =
      semConselheiro.candidatos.luana.metricas.sentimento - state.candidatos.luana.metricas.sentimento;

    expect(ganhoComSonia).toBeGreaterThan(ganhoSemConselheiro);
  });

  it("registra a decisão no histórico", () => {
    const state = criarNovoJogo("luana", 1);
    const atualizado = resolverDilema(state, videoDilema, "A", "neusa");
    expect(atualizado.historicoDecisoes).toHaveLength(1);
    expect(atualizado.historicoDecisoes[0].tipo).toBe("dilema");
  });

  it("opção antiética cria risco oculto no estado", () => {
    const state = criarNovoJogo("luana", 1);
    const atualizado = resolverDilema(state, whatsappDilema, "A", "caio");
    expect(atualizado.riscosOcultos).toHaveLength(1);
  });

  it("opção com capturaIndecisos reduz indecisosRestantes na mesma magnitude do ganho de intenção de voto", () => {
    const state = criarNovoJogo("luana", 1);
    const atualizado = resolverDilema(state, indecisosDilema, "A", undefined);

    const ganhoIntencaoVoto =
      atualizado.candidatos.luana.metricas.intencaoVoto - state.candidatos.luana.metricas.intencaoVoto;

    expect(ganhoIntencaoVoto).toBeGreaterThan(0);
    expect(atualizado.indecisosRestantes).toBeCloseTo(state.indecisosRestantes - ganhoIntencaoVoto, 5);
  });

  it("opção sem capturaIndecisos não mexe no pool de indecisos", () => {
    const state = criarNovoJogo("luana", 1);
    const atualizado = resolverDilema(state, indecisosDilema, "B", undefined);
    expect(atualizado.indecisosRestantes).toBe(state.indecisosRestantes);
  });

  it("porOmissao aplica penalidade extra de sentimento/credibilidade além do efeito normal da opção", () => {
    const state = criarNovoJogo("luana", 1);
    const comResposta = resolverDilema(state, videoDilema, "A", undefined, false);
    const porOmissao = resolverDilema(state, videoDilema, "A", undefined, true);

    expect(porOmissao.candidatos.luana.metricas.sentimento).toBeLessThan(comResposta.candidatos.luana.metricas.sentimento);
    expect(porOmissao.candidatos.luana.metricas.credibilidade).toBeLessThan(
      comResposta.candidatos.luana.metricas.credibilidade,
    );
    expect(porOmissao.historicoDecisoes[0].descricao).toContain("tempo esgotado");
  });
});

describe("avancarFase", () => {
  it("avança a fase atual na ordem esperada", () => {
    const state = criarNovoJogo("luana", 1);
    const proximo = avancarFase(state);
    expect(proximo.faseAtual).toBe("plataforma_governo");
    expect(proximo.faseIndex).toBe(1);
  });

  it("registra um snapshot de métricas em historicoMetricas a cada rodada concluída", () => {
    let state = criarNovoJogo("luana", 1);
    expect(state.historicoMetricas).toHaveLength(0);

    state = avancarFase(state);
    expect(state.historicoMetricas).toHaveLength(1);
    expect(state.historicoMetricas[0].fase).toBe("pre_campanha");
    expect(state.historicoMetricas[0].metricas.intencaoVoto).toBe(state.candidatos.luana.metricas.intencaoVoto);

    state = avancarFase(state);
    expect(state.historicoMetricas).toHaveLength(2);
    expect(state.historicoMetricas[1].fase).toBe("plataforma_governo");
  });

  it("roteia para o 2º turno com o índice correto de ORDEM_FASES (não hardcoded)", () => {
    const base = criarNovoJogo("luana", 2);
    const state = {
      ...base,
      faseAtual: "primeiro_turno" as const,
      faseIndex: ORDEM_FASES.indexOf("primeiro_turno"),
      candidatos: {
        luana: { ...base.candidatos.luana, metricas: { ...base.candidatos.luana.metricas, intencaoVoto: 30 } },
        rafael: { ...base.candidatos.rafael, metricas: { ...base.candidatos.rafael.metricas, intencaoVoto: 25 } },
        helena: { ...base.candidatos.helena, metricas: { ...base.candidatos.helena.metricas, intencaoVoto: 25 } },
        augusto: { ...base.candidatos.augusto, metricas: { ...base.candidatos.augusto.metricas, intencaoVoto: 20 } },
      },
    };

    const proximo = avancarFase(state);

    expect(proximo.faseAtual).toBe("segundo_turno");
    expect(proximo.faseIndex).toBe(ORDEM_FASES.indexOf("segundo_turno"));
    expect(proximo.terminado).toBe(false);
  });

  it("registra uma entrada 'crise' no histórico quando um risco oculto estoura", () => {
    let state = criarNovoJogo("luana", 1);
    state = resolverDilema(state, whatsappDilema, "A", "caio");
    state = avancarFase(state);

    expect(state.riscosOcultos).toHaveLength(0); // estourou já na 1ª rodada com essa seed
    const crise = state.historicoDecisoes.find((d) => d.tipo === "crise");
    expect(crise).toBeDefined();
    expect(crise?.descricao).toContain(whatsappDilema.titulo);
    expect(crise?.efeitoCrise).toBeDefined();
  });

  it("rola riscos ocultos: eventualmente estoura ou prescreve ao longo das rodadas", () => {
    let state = criarNovoJogo("luana", 1);
    state = resolverDilema(state, whatsappDilema, "A", "caio");
    expect(state.riscosOcultos).toHaveLength(1);

    for (let i = 0; i < 4; i++) {
      state = avancarFase(state);
    }
    // depois de RODADAS_MAX_RISCO_OCULTO rodadas, o risco já estourou ou prescreveu.
    expect(state.riscosOcultos).toHaveLength(0);
  });

  it("é determinístico: mesma seed produz a mesma sequência de estouros", () => {
    let a = criarNovoJogo("luana", 55);
    a = resolverDilema(a, whatsappDilema, "A", "caio");
    let b = criarNovoJogo("luana", 55);
    b = resolverDilema(b, whatsappDilema, "A", "caio");

    for (let i = 0; i < 3; i++) {
      a = avancarFase(a);
      b = avancarFase(b);
    }
    expect(a.candidatos.luana.metricas).toEqual(b.candidatos.luana.metricas);
  });

  it("cassação: risco jurídico muito alto pode encerrar a campanha antes do fim", () => {
    let state = criarNovoJogo("luana", 1);
    state = {
      ...state,
      candidatos: {
        ...state.candidatos,
        luana: { ...state.candidatos.luana, metricas: { ...state.candidatos.luana.metricas, riscoJuridico: 100 } },
      },
    };

    const proximo = avancarFase(state);

    expect(proximo.terminado).toBe(true);
    expect(proximo.resultado?.cassado).toBe(true);
    expect(proximo.resultado?.votosFinais.luana).toBe(0);
    expect(proximo.resultado?.vencedorId).not.toBe("luana");
    expect(proximo.resultado?.notaGovernabilidade).toBe(0);
  });

  it("risco jurídico dentro do normal não aciona cassação", () => {
    const state = criarNovoJogo("luana", 1); // riscoJuridico inicial = 12
    const proximo = avancarFase(state);
    expect(proximo.terminado).toBe(false);
  });

  it("recurso jurídico reduz a chance de cassação da rodada (sem recurso cassa, com recurso não)", () => {
    let state = criarNovoJogo("luana", 1);
    state = {
      ...state,
      candidatos: {
        ...state.candidatos,
        // risco 78 + seed 1: a mesma rolagem dispara cassação com a probabilidade
        // normal (20%) mas fica abaixo do limiar reduzido pelo recurso (10%).
        luana: { ...state.candidatos.luana, metricas: { ...state.candidatos.luana.metricas, riscoJuridico: 78 } },
      },
    };

    const semRecurso = avancarFase(state, "moderado", false);
    expect(semRecurso.terminado).toBe(true);
    expect(semRecurso.resultado?.cassado).toBe(true);

    const comRecurso = avancarFase(state, "moderado", true);
    expect(comRecurso.terminado).toBe(false);
  });

  it("recurso jurídico deduz o custo da caixa (ou gera dívida se faltar)", () => {
    let state = criarNovoJogo("luana", 1);
    state = {
      ...state,
      candidatos: {
        ...state.candidatos,
        luana: { ...state.candidatos.luana, metricas: { ...state.candidatos.luana.metricas, riscoJuridico: 78, caixaMi: 3 } },
      },
    };

    const proximo = avancarFase(state, "moderado", true);
    expect(proximo.terminado).toBe(false);
    expect(proximo.candidatos.luana.metricas.caixaMi).toBe(0);
    expect(proximo.candidatos.luana.dividaMi).toBeGreaterThan(state.candidatos.luana.dividaMi);
  });

  it("recurso jurídico sem o risco cruzar o limiar não tem efeito nenhum", () => {
    const state = criarNovoJogo("luana", 1); // riscoJuridico inicial = 12, bem abaixo do limiar
    const semRecurso = avancarFase(state, "moderado", false);
    const comRecurso = avancarFase(state, "moderado", true);
    expect(comRecurso.candidatos.luana.metricas.caixaMi).toBe(semRecurso.candidatos.luana.metricas.caixaMi);
    expect(comRecurso.candidatos.luana.dividaMi).toBe(semRecurso.candidatos.luana.dividaMi);
  });

  it("falência: dívida descontrolada também pode encerrar a campanha antes do fim", () => {
    let state = criarNovoJogo("luana", 1);
    state = {
      ...state,
      candidatos: { ...state.candidatos, luana: { ...state.candidatos.luana, dividaMi: 100 } },
    };

    const proximo = avancarFase(state);

    expect(proximo.terminado).toBe(true);
    expect(proximo.resultado?.faliuPorDivida).toBe(true);
    expect(proximo.resultado?.votosFinais.luana).toBe(0);
    expect(proximo.resultado?.dividaMi).toBe(100);
  });

  it("dívida dentro do normal não aciona falência", () => {
    const state = criarNovoJogo("luana", 1); // dividaMi inicial = 0
    const proximo = avancarFase(state);
    expect(proximo.terminado).toBe(false);
  });

  it("jogador fora dos 2 mais votados no 1º turno não chega ao 2º turno", () => {
    const base = criarNovoJogo("luana", 5);
    const state: GameState = {
      ...base,
      faseAtual: "primeiro_turno",
      faseIndex: ORDEM_FASES.indexOf("primeiro_turno"),
      candidatos: {
        luana: { ...base.candidatos.luana, metricas: { ...base.candidatos.luana.metricas, intencaoVoto: 5 } },
        rafael: { ...base.candidatos.rafael, metricas: { ...base.candidatos.rafael.metricas, intencaoVoto: 20 } },
        helena: { ...base.candidatos.helena, metricas: { ...base.candidatos.helena.metricas, intencaoVoto: 55 } },
        augusto: { ...base.candidatos.augusto, metricas: { ...base.candidatos.augusto.metricas, intencaoVoto: 15 } },
      },
    };

    const proximo = avancarFase(state);

    expect(proximo.terminado).toBe(true);
    expect(proximo.faseAtual).toBe("primeiro_turno"); // não chegou a virar "segundo_turno"
    expect(proximo.resultado?.foiEliminadoAntesDoSegundoTurno).toBe(true);
    expect(proximo.resultado?.vencedorId).toBe("helena");
    expect(proximo.resultado?.foiSegundoTurno).toBe(false);
  });
});
