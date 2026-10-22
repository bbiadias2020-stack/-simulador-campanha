import {
  CUSTO_RECURSO_JURIDICO_MI,
  FATOR_PROB_CASSACAO_POR_PONTO,
  FATOR_PROB_FALENCIA_POR_MI,
  FATOR_REDUCAO_CASSACAO_COM_RECURSO,
  INCREMENTO_PROB_POR_RODADA,
  LIMIAR_DIVIDA_FALENCIA,
  LIMIAR_RISCO_CASSACAO,
  PENALIDADE_INDECISAO_CREDIBILIDADE,
  PENALIDADE_INDECISAO_SENTIMENTO,
  PROB_BASE_CASSACAO,
  PROB_BASE_FALENCIA,
  PROB_MAX_CASSACAO,
  PROB_MAX_FALENCIA,
} from "../config/balance";
import { CANDIDATOS_BASE } from "../data/candidatos";
import { INDECISOS_INICIAL } from "../data/segmentos";
import { aplicarCrescimentoOrganico, reagirAdversarios } from "./adversaries";
import { aplicarAlocacaoVerba as aplicarAlocacaoVerbaCandidato } from "./budget";
import { historicoInicial, calcularFitConselheiros, atualizarHistoricoConselheiros } from "./advisors";
import { aplicarOpcaoDilema, multiplicadorConselheiro } from "./dilemmas";
import { aplicarPlataforma as aplicarPlataformaCandidato } from "./plataforma";
import { nextRandom } from "./rng";
import { calcularPlacarFinal } from "./score";
import { apurarPrimeiroTurno, apurarSegundoTurno } from "./secondRound";
import {
  ORDEM_FASES,
  type AlocacaoVerba,
  type CandidatoBase,
  type CandidatoEstado,
  type CandidatoId,
  type ConselheiroId,
  type Dilema,
  type EnfasePlataforma,
  type GameState,
  type PlacarFinal,
  type TomCampanha,
} from "./types";

/**
 * Monta o placar de uma saída antecipada (cassação ou falência por dívida): o
 * jogador sai com 0% de voto, e o vencedor vira o adversário com maior intenção
 * de voto no momento — a eleição segue sem ele.
 */
function construirPlacarSaidaAntecipada(
  estado: GameState,
  jogador: CandidatoEstado,
): Omit<PlacarFinal, "cassado" | "faliuPorDivida"> {
  const outros = (Object.keys(estado.candidatos) as CandidatoId[]).filter((id) => id !== estado.jogadorId);
  const vencedorId = outros.reduce((melhor, atual) =>
    estado.candidatos[atual].metricas.intencaoVoto > estado.candidatos[melhor].metricas.intencaoVoto ? atual : melhor,
  outros[0]);

  const votosFinais = {} as Record<CandidatoId, number>;
  for (const id of Object.keys(estado.candidatos) as CandidatoId[]) {
    votosFinais[id] = id === estado.jogadorId ? 0 : Math.round(estado.candidatos[id].metricas.intencaoVoto * 10) / 10;
  }

  return {
    vencedorId,
    votosFinais,
    dividaMi: Math.round(jogador.dividaMi * 10) / 10,
    promessasFeitas: estado.promessas,
    notaGovernabilidade: 0,
    foiSegundoTurno: false,
  };
}

/** Cria o estado inicial de uma partida nova a partir do perfil escolhido pelo jogador. */
export function criarNovoJogo(jogadorId: CandidatoId, seed: number): GameState {
  const candidatosBase = CANDIDATOS_BASE as Record<CandidatoId, CandidatoBase>;
  const candidatos = {} as Record<CandidatoId, CandidatoEstado>;

  for (const id of Object.keys(candidatosBase) as CandidatoId[]) {
    const base = candidatosBase[id];
    candidatos[id] = {
      id,
      metricas: { ...base.metricasIniciais },
      intencaoPorSegmento: { ...base.intencaoPorSegmentoInicial },
      tomAtual: "moderado",
      dividaMi: 0,
    };
  }

  return {
    seed,
    rngCursor: 0,
    jogadorId,
    faseAtual: "pre_campanha",
    faseIndex: 0,
    candidatos,
    candidatosBase,
    historicoDecisoes: [],
    historicoMetricas: [],
    historicoConselheiros: historicoInicial(),
    riscosOcultos: [],
    pesquisaInvestimentoAcumuladoMi: 0,
    promessas: [],
    dilemasResolvidosIds: [],
    indecisosRestantes: INDECISOS_INICIAL,
    finalistasSegundoTurno: null,
    resultado: null,
    terminado: false,
  };
}

/** Aplica a alocação de verba da rodada ao candidato controlado pelo jogador. */
export function aplicarAlocacaoVerba(state: GameState, alocacao: AlocacaoVerba): GameState {
  const jogador = state.candidatos[state.jogadorId];
  const jogadorAtualizado = aplicarAlocacaoVerbaCandidato(jogador, alocacao);

  const investimentoPesquisa = Math.max(alocacao.pesquisas ?? 0, 0);

  return {
    ...state,
    candidatos: { ...state.candidatos, [state.jogadorId]: jogadorAtualizado },
    pesquisaInvestimentoAcumuladoMi: state.pesquisaInvestimentoAcumuladoMi + investimentoPesquisa,
    historicoDecisoes: [
      ...state.historicoDecisoes,
      {
        fase: state.faseAtual,
        tipo: "verba",
        descricao: `Verba: TV ${alocacao.tv}, Digital ${alocacao.digital}, Comícios ${alocacao.comicios}, Pesquisas ${alocacao.pesquisas}, Jurídica ${alocacao.juridica}`,
      },
    ],
  };
}

/**
 * Aplica a ênfase de plataforma de governo (0–10 por área) na rodada "Plataforma
 * de Governo" — sem custo de caixa, diferente da verba; ênfase alta vira promessa
 * formal (custa governabilidade no placar final).
 */
export function aplicarPlataforma(state: GameState, enfases: EnfasePlataforma): GameState {
  const jogador = state.candidatos[state.jogadorId];
  const { estado: jogadorAtualizado, promessasGeradas } = aplicarPlataformaCandidato(jogador, enfases);

  return {
    ...state,
    candidatos: { ...state.candidatos, [state.jogadorId]: jogadorAtualizado },
    promessas: [...state.promessas, ...promessasGeradas],
    historicoDecisoes: [
      ...state.historicoDecisoes,
      {
        fase: state.faseAtual,
        tipo: "estrategica",
        descricao: `Plataforma de governo: Saúde ${enfases.saude}, Segurança ${enfases.seguranca}, Educação ${enfases.educacao}, Economia ${enfases.economia}`,
      },
    ],
  };
}

/**
 * Resolve um dilema para o jogador: aplica a opção escolhida e atualiza o
 * histórico dos conselheiros. `porOmissao` marca quando o cronômetro esgotou
 * sem NENHUMA opção selecionada (não o caso de já ter escolhido e só não ter
 * confirmado) — aí, além dos efeitos da opção escolhida automaticamente, soma
 * a penalidade de indecisão (ver balance.ts): quem não decide também perde.
 */
export function resolverDilema(
  state: GameState,
  dilema: Dilema,
  opcaoId: string,
  conselheiroSeguidoId?: ConselheiroId,
  porOmissao = false,
): GameState {
  const opcao = dilema.opcoes.find((o) => o.id === opcaoId);
  if (!opcao) throw new Error(`Opção "${opcaoId}" não existe no dilema "${dilema.id}"`);

  const jogador = state.candidatos[state.jogadorId];
  const jogadorBase = state.candidatosBase[state.jogadorId];
  const fit = calcularFitConselheiros(dilema, jogadorBase, jogador);

  const multiplicador = multiplicadorConselheiro(fit, conselheiroSeguidoId);

  const { estado: jogadorAtualizado, riscoGerado, indecisosCapturados } = aplicarOpcaoDilema(
    jogador,
    dilema,
    opcao,
    multiplicador,
  );

  const jogadorFinal = porOmissao
    ? {
        ...jogadorAtualizado,
        metricas: {
          ...jogadorAtualizado.metricas,
          sentimento: Math.min(100, Math.max(0, jogadorAtualizado.metricas.sentimento + PENALIDADE_INDECISAO_SENTIMENTO)),
          credibilidade: Math.min(
            100,
            Math.max(0, jogadorAtualizado.metricas.credibilidade + PENALIDADE_INDECISAO_CREDIBILIDADE),
          ),
        },
      }
    : jogadorAtualizado;

  const { historico, acertou } = atualizarHistoricoConselheiros(
    state.historicoConselheiros,
    dilema,
    fit,
    conselheiroSeguidoId,
  );

  return {
    ...state,
    candidatos: { ...state.candidatos, [state.jogadorId]: jogadorFinal },
    historicoConselheiros: historico,
    riscosOcultos: riscoGerado ? [...state.riscosOcultos, riscoGerado] : state.riscosOcultos,
    promessas: opcao.gerarPromessa ? [...state.promessas, opcao.gerarPromessa] : state.promessas,
    indecisosRestantes: Math.max(0, state.indecisosRestantes - indecisosCapturados),
    dilemasResolvidosIds: [...state.dilemasResolvidosIds, dilema.id],
    historicoDecisoes: [
      ...state.historicoDecisoes,
      {
        fase: state.faseAtual,
        tipo: "dilema",
        descricao: porOmissao
          ? `${dilema.titulo} → tempo esgotado sem resposta (penalidade por indecisão)`
          : `${dilema.titulo} → "${opcao.texto}"`,
        conselheiroSeguidoId,
        acertou,
        opcaoEscolhidaId: opcaoId,
      },
    ],
  };
}

/**
 * Fecha a rodada atual e avança para a próxima fase:
 * 1. Adversários reagem ao tom escolhido pelo jogador na rodada.
 * 2. Riscos ocultos pendentes (consequência atrasada) são sorteados.
 * 3. Se a fase que está terminando é o 1º turno, apura o resultado — se alguém
 *    passou de 50%, o jogo termina aqui; senão, vai para o 2º turno com os 2
 *    mais votados. Se a fase que está terminando já é o 2º turno, apura o
 *    resultado final entre os 2 finalistas e termina o jogo.
 *
 * `recursoJuridicoContratado`: só tem efeito se o risco jurídico já passou do
 * limiar de cassação — custa CUSTO_RECURSO_JURIDICO_MI (vira dívida se faltar
 * caixa) e reduz a chance de cassação desta rodada específica, sem zerar o
 * risco de base (litígio ativo atrasa, não garante vitória — ver README).
 */
export function avancarFase(
  state: GameState,
  tomJogador: TomCampanha = "moderado",
  recursoJuridicoContratado = false,
): GameState {
  const comReacao = reagirAdversarios(aplicarCrescimentoOrganico(state), tomJogador);

  let jogador = comReacao.candidatos[comReacao.jogadorId];
  let cursor = comReacao.rngCursor;

  if (recursoJuridicoContratado && jogador.metricas.riscoJuridico > LIMIAR_RISCO_CASSACAO) {
    const caixaDisponivel = jogador.metricas.caixaMi;
    const excedente = Math.max(CUSTO_RECURSO_JURIDICO_MI - caixaDisponivel, 0);
    jogador = {
      ...jogador,
      metricas: { ...jogador.metricas, caixaMi: Math.max(caixaDisponivel - CUSTO_RECURSO_JURIDICO_MI, 0) },
      dividaMi: jogador.dividaMi + excedente,
    };
  }
  const riscosRestantes: typeof comReacao.riscosOcultos = [];
  const crisesEstouradas: typeof comReacao.historicoDecisoes = [];

  for (const risco of comReacao.riscosOcultos) {
    const sorteio = nextRandom(comReacao.seed, cursor);
    cursor = sorteio.cursor;

    if (sorteio.valor < risco.probabilidadePorRodada) {
      const metricas = { ...jogador.metricas };
      for (const [chave, valor] of Object.entries(risco.efeitoSeEstourar)) {
        const k = chave as keyof typeof metricas;
        metricas[k] = Math.max(0, metricas[k] + (valor as number));
      }
      jogador = { ...jogador, metricas };
      crisesEstouradas.push({
        fase: comReacao.faseAtual,
        tipo: "crise",
        descricao: risco.descricao,
        efeitoCrise: risco.efeitoSeEstourar,
      });
      // risco resolvido (estourou), não entra de volta na lista.
    } else if (risco.rodadasRestantes > 1) {
      riscosRestantes.push({
        ...risco,
        rodadasRestantes: risco.rodadasRestantes - 1,
        probabilidadePorRodada: risco.probabilidadePorRodada + INCREMENTO_PROB_POR_RODADA,
      });
    }
    // se rodadasRestantes <= 1 e não estourou, o risco prescreve (não volta para a lista).
  }

  // Saída antecipada: nem toda campanha chega inteira ao fim. Risco jurídico alto
  // demais (cassação) ou dívida descontrolada (contas rejeitadas) podem encerrar a
  // campanha no meio do caminho — quem joga nessas áreas sabe que está arriscando.
  let resultadoSaidaAntecipada: PlacarFinal | null = null;
  let descricaoSaidaAntecipada = "";

  if (jogador.metricas.riscoJuridico > LIMIAR_RISCO_CASSACAO) {
    const sorteio = nextRandom(comReacao.seed, cursor);
    cursor = sorteio.cursor;
    const probabilidadeBase = Math.min(
      PROB_MAX_CASSACAO,
      PROB_BASE_CASSACAO + (jogador.metricas.riscoJuridico - LIMIAR_RISCO_CASSACAO) * FATOR_PROB_CASSACAO_POR_PONTO,
    );
    const probabilidade = recursoJuridicoContratado ? probabilidadeBase * FATOR_REDUCAO_CASSACAO_COM_RECURSO : probabilidadeBase;
    if (sorteio.valor < probabilidade) {
      resultadoSaidaAntecipada = { ...construirPlacarSaidaAntecipada(comReacao, jogador), cassado: true };
      descricaoSaidaAntecipada = "O risco jurídico acumulado resultou em decisão judicial que encerrou a campanha.";
    }
  }

  if (!resultadoSaidaAntecipada && jogador.dividaMi > LIMIAR_DIVIDA_FALENCIA) {
    const sorteio = nextRandom(comReacao.seed, cursor);
    cursor = sorteio.cursor;
    const probabilidade = Math.min(
      PROB_MAX_FALENCIA,
      PROB_BASE_FALENCIA + (jogador.dividaMi - LIMIAR_DIVIDA_FALENCIA) * FATOR_PROB_FALENCIA_POR_MI,
    );
    if (sorteio.valor < probabilidade) {
      resultadoSaidaAntecipada = { ...construirPlacarSaidaAntecipada(comReacao, jogador), faliuPorDivida: true };
      descricaoSaidaAntecipada = "A dívida de campanha ficou descontrolada, as contas foram rejeitadas e a candidatura foi retirada da disputa.";
    }
  }

  const estadoComRiscos: GameState = {
    ...comReacao,
    candidatos: { ...comReacao.candidatos, [comReacao.jogadorId]: jogador },
    riscosOcultos: riscosRestantes,
    rngCursor: cursor,
    historicoDecisoes: [
      ...comReacao.historicoDecisoes,
      ...crisesEstouradas,
      ...(resultadoSaidaAntecipada
        ? [{ fase: comReacao.faseAtual, tipo: "crise" as const, descricao: descricaoSaidaAntecipada }]
        : []),
    ],
    historicoMetricas: [...comReacao.historicoMetricas, { fase: comReacao.faseAtual, metricas: jogador.metricas }],
  };

  if (resultadoSaidaAntecipada) {
    return { ...estadoComRiscos, resultado: resultadoSaidaAntecipada, terminado: true };
  }

  if (estadoComRiscos.faseAtual === "primeiro_turno") {
    const apuracao = apurarPrimeiroTurno(estadoComRiscos);
    if (apuracao.decidido) {
      return {
        ...estadoComRiscos,
        resultado: calcularPlacarFinal(estadoComRiscos, apuracao, false),
        terminado: true,
      };
    }
    if (!apuracao.finalistas!.includes(estadoComRiscos.jogadorId)) {
      // O jogador não ficou entre os 2 mais votados — a campanha acaba aqui, sem 2º turno.
      const placar = calcularPlacarFinal(
        estadoComRiscos,
        { ...apuracao, decidido: true, vencedorId: apuracao.ranking[0].id },
        false,
      );
      return {
        ...estadoComRiscos,
        resultado: { ...placar, foiEliminadoAntesDoSegundoTurno: true },
        terminado: true,
      };
    }
    return {
      ...estadoComRiscos,
      faseIndex: ORDEM_FASES.indexOf("segundo_turno"),
      faseAtual: "segundo_turno",
      finalistasSegundoTurno: apuracao.finalistas!,
    };
  }

  if (estadoComRiscos.faseAtual === "segundo_turno") {
    const apuracao = apurarSegundoTurno(estadoComRiscos);
    return {
      ...estadoComRiscos,
      resultado: calcularPlacarFinal(estadoComRiscos, apuracao, true),
      terminado: true,
    };
  }

  const proximoIndex = Math.min(estadoComRiscos.faseIndex + 1, ORDEM_FASES.length - 1);
  return {
    ...estadoComRiscos,
    faseIndex: proximoIndex,
    faseAtual: ORDEM_FASES[proximoIndex],
  };
}
