import { useEffect, useMemo, useRef, useState } from "react";
import { CUSTO_RECURSO_JURIDICO_MI, LIMIAR_RISCO_CASSACAO, TEMPO_LIMITE_DILEMA_SEGUNDOS } from "../config/balance";
import { CANDIDATOS_BASE } from "../data/candidatos";
import { CONSELHEIROS_BASE } from "../data/conselheiros";
import { SEGMENTOS } from "../data/segmentos";
import { calcularFitConselheiros, melhorConselheiro } from "../engine/advisors";
import { efeitoVerba } from "../engine/budget";
import { gerarResultadoPesquisa, margemErroPesquisa } from "../engine/polls";
import { dilemasDaFase } from "../engine/selecaoConteudo";
import { afinidadeTransferencia, apurarPrimeiroTurno } from "../engine/secondRound";
import { enviarComentario, enviarDecisao } from "../integracao/ranking";
import { RANKING_HABILITADO } from "../integracao/supabase";
import { ORDEM_FASES, TIPO_RODADA } from "../engine/types";
import type {
  AlocacaoVerba,
  AreaPolitica,
  CandidatoEstado,
  CandidatoId,
  CanalVerba,
  ConselheiroId,
  DecisaoLogEntry,
  EnfasePlataforma,
  Fase,
  Metricas,
  TomCampanha,
} from "../engine/types";
import { useGameDispatch, useGameState } from "../store/GameContext";
import { carregarJogadorAtual } from "../store/persistence";
import { CartaoConselheiro } from "./components/CartaoConselheiro";
import { EstrelaAzul } from "./components/EstrelaAzul";
import { GraficoHistoricoMetricas } from "./components/GraficoHistoricoMetricas";
import { GraficoSegmentos } from "./components/GraficoSegmentos";
import { GraficoVotos } from "./components/GraficoVotos";
import { MarcadorRodada } from "./components/MarcadorRodada";
import { PainelHistorico } from "./components/PainelHistorico";
import { PainelMetricas } from "./components/PainelMetricas";
import { NOME_FASE } from "./nomesFase";
import { CORES_CANDIDATO } from "./paleta";

const CANAIS: { id: CanalVerba; nome: string; icone: string; cor: string; impacto: string; publico: string }[] = [
  {
    id: "tv",
    nome: "TV",
    icone: "📺",
    cor: "#1d3a64",
    impacto: "Sobe intenção de voto e tempo de TV (que por sua vez abre mais espaço nas próximas rodadas).",
    publico: "Público-alvo: Classe C e Nordeste respondem bem acima da média.",
  },
  {
    id: "digital",
    nome: "Digital",
    icone: "📱",
    cor: "#3e6698",
    impacto: "Sobe intenção de voto e sentimento nas redes — o canal mais barato por ponto de alcance.",
    publico: "Público-alvo: jovens (16–24) respondem muito mais que qualquer outro segmento.",
  },
  {
    id: "comicios",
    nome: "Comícios e carreatas",
    icone: "📣",
    cor: "#7e5b1c",
    impacto: "Sobe intenção de voto, sentimento e coesão de aliados — fortalece a base organizada.",
    publico: "Público-alvo: Nordeste e Sul respondem acima da média.",
  },
  {
    id: "pesquisas",
    nome: "Pesquisas",
    icone: "📊",
    cor: "#4f3912",
    impacto: "Não persuade ninguém — reduz a margem de erro do painel (os números que você vê ficam mais confiáveis).",
    publico: "Público-alvo: nenhum — é informação para a própria campanha, não propaganda.",
  },
  {
    id: "juridica",
    nome: "Equipe jurídica",
    icone: "⚖️",
    cor: "#15233a",
    impacto: "Reduz o risco jurídico acumulado — não muda intenção de voto, mas evita punições mais graves.",
    publico: "Público-alvo: nenhum — é blindagem interna da campanha, não propaganda.",
  },
];

const TONS: { id: TomCampanha; nome: string; icone: string; descricao: string }[] = [
  { id: "propositivo", nome: "Propositivo", icone: "🕊️", descricao: "Discurso de propostas, sem provocar os adversários." },
  { id: "ataque", nome: "De ataque", icone: "⚔️", descricao: "Ataca o adversário líder — ele tende a contra-atacar." },
  { id: "moderado", nome: "Ocupar o centro", icone: "🎯", descricao: "Modera o discurso — adversários extremos tendem a radicalizar." },
];

const AREAS: { id: AreaPolitica; nome: string; icone: string; cor: string; publico: string }[] = [
  { id: "saude", nome: "Saúde", icone: "🏥", cor: "#1d3a64", publico: "Classe C e Nordeste respondem bem acima da média." },
  { id: "seguranca", nome: "Segurança", icone: "🚓", cor: "#3e6698", publico: "Sul e evangélicos respondem bem acima da média." },
  { id: "educacao", nome: "Educação", icone: "📚", cor: "#7e5b1c", publico: "Jovens e mulheres respondem bem acima da média." },
  { id: "economia", nome: "Economia e emprego", icone: "💼", cor: "#4f3912", publico: "Classe C e Sul respondem acima da média." },
];

const ENFASE_ZERADA: EnfasePlataforma = { saude: 0, seguranca: 0, educacao: 0, economia: 0 };

type Etapa = "verba" | "plataforma" | "dilema" | "tom" | "resultado" | "briefing_segundo_turno";

/**
 * Primeira etapa de uma rodada depende do tipo dela — nem toda fase é verba. O
 * 2º turno sempre abre com o briefing (quem disputa, quem conquistar), antes da
 * verba normal da rodada.
 */
function etapaInicialDaFase(fase: Fase, temDilemas: boolean): Etapa {
  if (fase === "segundo_turno") return "briefing_segundo_turno";
  const tipo = TIPO_RODADA[fase];
  if (tipo === "verba") return "verba";
  if (tipo === "plataforma") return "plataforma";
  return temDilemas ? "dilema" : "tom";
}

interface ResultadoRodada {
  fase: Fase;
  tom?: TomCampanha;
  antes: Metricas;
  depois: Metricas;
  indecisosAntes: number;
  indecisosDepois: number;
  crises: DecisaoLogEntry[];
}

export function TelaRodada() {
  const state = useGameState()!;
  const dispatch = useGameDispatch();

  const [etapa, setEtapa] = useState<Etapa>("verba");
  const [indiceDilema, setIndiceDilema] = useState(0);
  const [alocacao, setAlocacao] = useState<AlocacaoVerba>({ tv: 0, digital: 0, comicios: 0, pesquisas: 0, juridica: 0 });
  const [enfases, setEnfases] = useState<EnfasePlataforma>(ENFASE_ZERADA);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | undefined>(undefined);
  const [tomSelecionado, setTomSelecionado] = useState<TomCampanha | undefined>(undefined);
  const [tempoRestante, setTempoRestante] = useState(TEMPO_LIMITE_DILEMA_SEGUNDOS);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  // Snapshot "congelado" no início da rodada: o painel lateral mostra sempre esses
  // valores (estáveis) enquanto a rodada está em andamento. A mudança só é revelada
  // na tela de "Resultado da rodada", de propósito — sem spoiler em tempo real.
  const [metricasInicioRodada, setMetricasInicioRodada] = useState<Metricas>(state.candidatos[state.jogadorId].metricas);
  const [indecisosInicioRodada, setIndecisosInicioRodada] = useState(state.indecisosRestantes);
  const [candidatosInicioRodada, setCandidatosInicioRodada] = useState<Record<CandidatoId, CandidatoEstado>>(state.candidatos);
  const [resultadoRodada, setResultadoRodada] = useState<ResultadoRodada | null>(null);
  const [mostrarPesquisa, setMostrarPesquisa] = useState(false);
  const [comentarioRodada, setComentarioRodada] = useState("");
  const [comentarioEnviado, setComentarioEnviado] = useState(false);
  const [recursoJuridico, setRecursoJuridico] = useState(false);
  const [confirmandoRecomeco, setConfirmandoRecomeco] = useState(false);

  // null = ainda não rodou; guardamos o faseIndex (não um booleano "primeira vez")
  // porque o StrictMode do React roda o efeito duas vezes na montagem em dev, e um
  // booleano consumido na 1ª chamada confundiria a 2ª chamada fantasma com uma
  // rodada de verdade tendo avançado.
  const faseIndexAnteriorRef = useRef<number | null>(null);
  const metricasInicioRodadaRef = useRef(metricasInicioRodada);
  const indecisosInicioRodadaRef = useRef(indecisosInicioRodada);
  const tomUsadoRef = useRef<TomCampanha | undefined>(undefined);
  const historicoAntesDoAvancoRef = useRef(state.historicoDecisoes.length);

  // Calculado uma vez por rodada (não a cada dilema resolvido): dilemasDaFase exclui
  // dilemas já resolvidos, então recalcular a cada resposta encolheria a lista e
  // desalinharia o índice do próximo dilema.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const dilemas = useMemo(() => dilemasDaFase(state), [state.faseIndex]);

  useEffect(() => {
    const faseIndexAnterior = faseIndexAnteriorRef.current;
    const metricasAtuais = state.candidatos[state.jogadorId].metricas;
    const avancouUmaRodada = faseIndexAnterior !== null && faseIndexAnterior !== state.faseIndex;

    if (avancouUmaRodada) {
      const crises = state.historicoDecisoes.slice(historicoAntesDoAvancoRef.current).filter((d) => d.tipo === "crise");
      setResultadoRodada({
        fase: ORDEM_FASES[state.faseIndex - 1],
        tom: tomUsadoRef.current,
        antes: metricasInicioRodadaRef.current,
        depois: metricasAtuais,
        indecisosAntes: indecisosInicioRodadaRef.current,
        indecisosDepois: state.indecisosRestantes,
        crises,
      });
      setEtapa("resultado");
    } else if (faseIndexAnterior === null) {
      setEtapa(etapaInicialDaFase(state.faseAtual, dilemas.length > 0));
    }
    // se faseIndexAnterior === state.faseIndex, é a 2ª chamada fantasma do
    // StrictMode: não mexe na etapa, só garante que os refs/estado fiquem corretos.

    faseIndexAnteriorRef.current = state.faseIndex;
    metricasInicioRodadaRef.current = metricasAtuais;
    indecisosInicioRodadaRef.current = state.indecisosRestantes;
    historicoAntesDoAvancoRef.current = state.historicoDecisoes.length;
    setIndiceDilema(0);
    setAlocacao({ tv: 0, digital: 0, comicios: 0, pesquisas: 0, juridica: 0 });
    setEnfases(ENFASE_ZERADA);
    setOpcaoSelecionada(undefined);
    setTomSelecionado(undefined);
    setComentarioRodada("");
    setComentarioEnviado(false);
    setRecursoJuridico(false);
    setMetricasInicioRodada(metricasAtuais);
    setIndecisosInicioRodada(state.indecisosRestantes);
    setCandidatosInicioRodada(state.candidatos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.faseIndex]);

  const jogador = state.candidatos[state.jogadorId];
  const jogadorBase = state.candidatosBase[state.jogadorId];
  const custoTotal = Object.values(alocacao).reduce((s, v) => s + Math.max(v, 0), 0);
  const excedeCaixa = custoTotal > jogador.metricas.caixaMi;
  const margemErroAtual = margemErroPesquisa(state.pesquisaInvestimentoAcumuladoMi);
  const dilemaAtual = dilemas[indiceDilema];

  const finalistasSegundoTurno = state.finalistasSegundoTurno;
  const adversarioSegundoTurnoId = finalistasSegundoTurno?.find((id) => id !== state.jogadorId);
  const eliminadosSegundoTurno = finalistasSegundoTurno
    ? (Object.keys(state.candidatos) as CandidatoId[]).filter((id) => !finalistasSegundoTurno.includes(id))
    : [];
  // Recalcula a mesma apuração que decidiu quem vai pro 2º turno — pura, sem
  // efeito colateral, reproduz o resultado exato já que nada mudou desde então.
  const votosPrimeiroTurno = finalistasSegundoTurno
    ? (Object.fromEntries(
        apurarPrimeiroTurno(state).ranking.map((r) => [r.id, Math.round(r.percentual * 10) / 10]),
      ) as Record<CandidatoId, number>)
    : null;

  function topSegmentos(id: CandidatoId, n = 2) {
    return Object.entries(state.candidatos[id].intencaoPorSegmento)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([segId, valor]) => ({ nome: SEGMENTOS.find((s) => s.id === segId)?.nome ?? segId, valor }));
  }

  /** Aplica a opção (manual ou por tempo esgotado) e avança para o próximo dilema/etapa. */
  function confirmarOpcao(opcaoId: string, conselheiroId?: ConselheiroId, porOmissao = false) {
    const dilema = dilemas[indiceDilema];
    dispatch({
      type: "RESOLVER_DILEMA",
      dilema,
      opcaoId,
      conselheiroSeguidoId: conselheiroId,
      porOmissao,
    });

    const jogador = carregarJogadorAtual();
    if (jogador) {
      const opcao = dilema.opcoes.find((o) => o.id === opcaoId);
      void enviarDecisao({
        tipo: "dilema",
        jogoId: jogador.jogoId,
        nome: jogador.nome,
        candidatoId: state.jogadorId,
        fase: state.faseAtual,
        faseNome: NOME_FASE[state.faseAtual],
        dilemaId: dilema.id,
        dilemaTitulo: dilema.titulo,
        opcaoId,
        opcaoTexto: opcao?.texto ?? opcaoId,
        conselheiroSeguidoId: conselheiroId,
        porOmissao,
      });
    }

    setOpcaoSelecionada(undefined);
    if (indiceDilema + 1 < dilemas.length) setIndiceDilema(indiceDilema + 1);
    else setEtapa("tom");
  }

  // Cronômetro: reinicia a cada novo dilema, pára fora da etapa "dilema".
  useEffect(() => {
    if (etapa !== "dilema") return;
    setTempoRestante(TEMPO_LIMITE_DILEMA_SEGUNDOS);
    const intervalId = setInterval(() => {
      setTempoRestante((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(intervalId);
  }, [etapa, indiceDilema]);

  // Tempo esgotado: confirma o que já estava selecionado (pulando o confronto, sem
  // penalidade — a pessoa decidiu, só não clicou em confirmar) ou, se NADA foi
  // escolhido, a primeira opção visível com penalidade por indecisão — pressão
  // real, sem travar o jogo, mas não respondeu também tem custo.
  useEffect(() => {
    if (etapa !== "dilema" || tempoRestante > 0) return;
    if (opcaoSelecionada) {
      confirmarOpcao(opcaoSelecionada, conselheiroSelecionado);
    } else if (dilemaAtual) {
      const primeira = dilemaAtual.opcoes.find((o) => !o.oculta);
      if (primeira) confirmarOpcao(primeira.id, undefined, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempoRestante]);

  function confirmarVerba() {
    dispatch({ type: "APLICAR_VERBA", alocacao });

    const jogador = carregarJogadorAtual();
    if (jogador) {
      void enviarDecisao({
        tipo: "verba",
        jogoId: jogador.jogoId,
        nome: jogador.nome,
        candidatoId: state.jogadorId,
        fase: state.faseAtual,
        faseNome: NOME_FASE[state.faseAtual],
        alocacao,
      });
    }

    if (dilemas.length > 0) setEtapa("dilema");
    else setEtapa("tom");
  }

  function recomecar() {
    dispatch({ type: "REINICIAR" });
  }

  function confirmarPlataforma() {
    dispatch({ type: "APLICAR_PLATAFORMA", enfases });
    if (dilemas.length > 0) setEtapa("dilema");
    else setEtapa("tom");
  }

  function confirmarTom() {
    if (!tomSelecionado) return;
    tomUsadoRef.current = tomSelecionado;

    const jogador = carregarJogadorAtual();
    if (jogador) {
      void enviarDecisao({
        tipo: "tom",
        jogoId: jogador.jogoId,
        nome: jogador.nome,
        candidatoId: state.jogadorId,
        fase: state.faseAtual,
        faseNome: NOME_FASE[state.faseAtual],
        tom: tomSelecionado,
      });
    }

    dispatch({ type: "AVANCAR_FASE", tom: tomSelecionado, recursoJuridicoContratado: recursoJuridico });
  }

  const pesquisa = mostrarPesquisa ? gerarResultadoPesquisa(state) : null;

  // Prévia de reação + confronto do conselheiro, calculados a cada opção selecionada.
  // "Conselheiro seguido" é derivado da opção escolhida (não um estado próprio): se a
  // opção selecionada é a que algum conselheiro recomendou, é dele que está "seguindo"
  // de verdade — evita um 2º clique separado e evita levar o bônus de um conselheiro
  // sem ter escolhido a opção que ele recomenda.
  const conselheiroSelecionado = dilemaAtual?.opinioes.find((o) => o.recomendaOpcaoId === opcaoSelecionada)?.conselheiroId;
  const opcaoSelecionadaObj = dilemaAtual?.opcoes.find((o) => o.id === opcaoSelecionada);
  const fitDilemaAtual = dilemaAtual ? calcularFitConselheiros(dilemaAtual, jogadorBase, jogador) : null;
  const melhorConselheiroId = dilemaAtual && fitDilemaAtual ? melhorConselheiro(dilemaAtual, fitDilemaAtual) : undefined;
  const opiniaoMelhorConselheiro = dilemaAtual?.opinioes.find((o) => o.conselheiroId === melhorConselheiroId);
  const temDivergencia =
    !!opcaoSelecionada && !!opiniaoMelhorConselheiro && opiniaoMelhorConselheiro.recomendaOpcaoId !== opcaoSelecionada;

  return (
    <div className="tela tela-rodada">
      <header className="cabecalho-bansh">
        <div className="cabecalho-bansh__conteudo">
          <div className="cabecalho-bansh__identidade">
            <EstrelaAzul variante="selo" tamanho={36} />
            <div>
              <span className="cabecalho-bansh__pais">BANSH · ELEIÇÃO PRESIDENCIAL</span>
              <h1 style={{ color: "var(--marfim)" }}>{jogadorBase.nome}</h1>
            </div>
          </div>
          <MarcadorRodada faseIndex={state.faseIndex} onClicarFaseConcluida={() => setMostrarHistorico(true)} />
        </div>
      </header>
      <div className="faixa-ouro" />

      {mostrarHistorico && (
        <PainelHistorico historico={state.historicoDecisoes} onFechar={() => setMostrarHistorico(false)} />
      )}

      <div className="tela-rodada__corpo">
        <main className="tela-rodada__decisao">
          <div className="barra-acoes-topo">
            <button type="button" className="botao-historico" onClick={() => setMostrarHistorico(true)}>
              📜 Ver histórico da campanha
            </button>
            <button type="button" className="botao-recomecar" onClick={() => setConfirmandoRecomeco(true)}>
              🔄 Recomeçar partida
            </button>
          </div>

          {confirmandoRecomeco && (
            <div className="overlay-confirmacao" role="dialog" aria-modal="true">
              <div className="cartao-confirmacao">
                <h3>Recomeçar a partida?</h3>
                <p>Todo o progresso desta campanha será perdido — não dá pra desfazer.</p>
                <div className="cartao-confirmacao__acoes">
                  <button type="button" className="botao-decisao botao-decisao--secundario" onClick={() => setConfirmandoRecomeco(false)}>
                    Cancelar
                  </button>
                  <button type="button" className="botao-decisao botao-decisao--primario botao-decisao--perigo" onClick={recomecar}>
                    Sim, recomeçar
                  </button>
                </div>
              </div>
            </div>
          )}

          {etapa === "resultado" && resultadoRodada && (
            <section className="bloco-decisao">
              {resultadoRodada.crises.length > 0 &&
                resultadoRodada.crises.map((crise, i) => (
                  <div className="alerta-crise" key={i}>
                    <span className="alerta-crise__icone" aria-hidden="true">
                      ⚠
                    </span>
                    <div>
                      <strong>CRISE ESTOUROU NA CAMPANHA</strong>
                      <p>{crise.descricao}</p>
                      {crise.efeitoCrise && (
                        <p className="alerta-crise__efeito">
                          {Object.entries(crise.efeitoCrise)
                            .map(([k, v]) => `${k}: ${(v as number) > 0 ? "+" : ""}${v}`)
                            .join(" · ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

              <span className="rotulo-fase">📋 Resultado da rodada</span>
              <h2>{NOME_FASE[resultadoRodada.fase]}</h2>
              <p>
                {resultadoRodada.tom
                  ? `Tom escolhido: ${TONS.find((t) => t.id === resultadoRodada.tom)?.nome}. `
                  : ""}
                Veja como a verba e as decisões desta rodada mudaram o painel de {jogadorBase.nome}.
              </p>
              <PainelMetricas
                metricas={resultadoRodada.depois}
                metricasAnteriores={resultadoRodada.antes}
                margemErroIntencaoVoto={margemErroAtual}
              />
              {resultadoRodada.indecisosAntes !== resultadoRodada.indecisosDepois && (
                <p className="indecisos-delta">
                  Indecisos/brancos/nulos convertidos nesta rodada:{" "}
                  {(resultadoRodada.indecisosAntes - resultadoRodada.indecisosDepois).toFixed(1)} pontos — pool agora
                  em {resultadoRodada.indecisosDepois.toFixed(1)}%.
                </p>
              )}
              {state.historicoMetricas.length >= 2 && (
                <>
                  <h3>📈 Histórico da campanha até aqui</h3>
                  <GraficoHistoricoMetricas historico={state.historicoMetricas} />
                </>
              )}

              <div className="bloco-comentario-rodada">
                <label htmlFor="comentario-rodada">
                  💬 Por que você decidiu assim nesta rodada?{" "}
                  {RANKING_HABILITADO && <span className="bloco-comentario-rodada__aviso">(vai pro dashboard público)</span>}
                </label>
                <textarea
                  id="comentario-rodada"
                  rows={3}
                  placeholder="Conte rapidamente o raciocínio por trás da sua decisão nesta rodada..."
                  value={comentarioRodada}
                  onChange={(e) => setComentarioRodada(e.target.value)}
                />
              </div>

              <button
                type="button"
                className="botao-decisao botao-decisao--primario"
                disabled={comentarioRodada.trim().length === 0 || comentarioEnviado}
                onClick={() => {
                  setComentarioEnviado(true);
                  const jogador = carregarJogadorAtual();
                  if (jogador) {
                    void enviarComentario({
                      jogoId: jogador.jogoId,
                      nome: jogador.nome,
                      candidatoId: state.jogadorId,
                      fase: resultadoRodada.fase,
                      faseNome: NOME_FASE[resultadoRodada.fase],
                      texto: comentarioRodada.trim(),
                    });
                  }
                  setEtapa(etapaInicialDaFase(state.faseAtual, dilemas.length > 0));
                }}
              >
                {comentarioEnviado ? "Enviando..." : `Continuar para ${NOME_FASE[state.faseAtual]}`}
              </button>
            </section>
          )}

          {etapa === "briefing_segundo_turno" && finalistasSegundoTurno && adversarioSegundoTurnoId && (
            <section className="bloco-decisao">
              <span className="rotulo-fase">🗳️ Vai para o 2º turno</span>
              <h2>Quem disputa, e quem cada um precisa conquistar</h2>
              <p>Ninguém passou de 50% no 1º turno. Agora é só entre vocês dois.</p>

              {votosPrimeiroTurno && (
                <>
                  <h3>🗳️ Quantos votos cada um teve no 1º turno</h3>
                  <GraficoVotos votosFinais={votosPrimeiroTurno} candidatosBase={state.candidatosBase} />
                </>
              )}

              <div className="grid-briefing-finalistas">
                {finalistasSegundoTurno.map((id) => {
                  const base = state.candidatosBase[id];
                  const estado = state.candidatos[id];
                  const ehJogador = id === state.jogadorId;
                  return (
                    <div key={id} className="cartao-finalista" style={{ borderColor: CORES_CANDIDATO[id] }}>
                      <strong style={{ color: CORES_CANDIDATO[id] }}>
                        {base.nome} {ehJogador ? "(você)" : "(adversário)"}
                      </strong>
                      <ul className="cartao-finalista__stats">
                        <li>
                          <span>Intenção de voto</span>
                          <strong>{Math.round(estado.metricas.intencaoVoto * 10) / 10}%</strong>
                        </li>
                        <li>
                          <span>Rejeição</span>
                          <strong>{Math.round(estado.metricas.rejeicao * 10) / 10}%</strong>
                        </li>
                      </ul>
                      <p className="cartao-finalista__base">
                        Base principal: {topSegmentos(id).map((s) => s.nome).join(" · ")}
                      </p>
                    </div>
                  );
                })}
              </div>

              {eliminadosSegundoTurno.length > 0 && (
                <>
                  <h3>🧲 Eleitores em disputa</h3>
                  <p>
                    Quem foi eliminado no 1º turno não vota mais em si mesmo — para onde esses votos tendem a ir
                    depende da proximidade ideológica com cada finalista (ver Parte 2 da spec).
                  </p>
                  <ul className="lista-eleitores-disputa">
                    {eliminadosSegundoTurno.map((elimId) => {
                      const base = state.candidatosBase[elimId];
                      const fracao = afinidadeTransferencia(state, elimId, finalistasSegundoTurno);
                      const favorito = fracao[0] > fracao[1] ? finalistasSegundoTurno[0] : fracao[1] > fracao[0] ? finalistasSegundoTurno[1] : null;
                      const favoritoBase = favorito ? state.candidatosBase[favorito] : null;
                      const favoritoEhJogador = favorito === state.jogadorId;
                      return (
                        <li key={elimId}>
                          <strong>{base.nome}</strong> ({topSegmentos(elimId, 1)[0]?.nome}) —{" "}
                          {favoritoBase ? (
                            <>
                              tende a pender para{" "}
                              <strong style={{ color: CORES_CANDIDATO[favorito!] }}>
                                {favoritoEhJogador ? "você" : favoritoBase.nome}
                              </strong>
                              , por afinidade de costumes/economia.
                            </>
                          ) : (
                            "está dividido entre os dois, sem afinidade clara com nenhum."
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              <button type="button" className="botao-decisao botao-decisao--primario" onClick={() => setEtapa("verba")}>
                Continuar para o 2º turno
              </button>
            </section>
          )}

          {etapa === "verba" && (
            <section className="bloco-decisao">
              <h2>💰 Alocação de verba</h2>
              <p>Caixa disponível: R$ {Math.round(jogador.metricas.caixaMi * 10) / 10} mi</p>
              {CANAIS.map((canal) => {
                const max = Math.max(Math.round(jogador.metricas.caixaMi * 1.3), 20);
                return (
                  <div key={canal.id} className="canal-card" style={{ borderLeftColor: canal.cor }}>
                    <div className="canal-card__icone" style={{ background: canal.cor }}>
                      {canal.icone}
                    </div>
                    <div className="canal-card__corpo">
                      <div className="linha-slider__cabecalho">
                        <span className="canal-card__nome">{canal.nome}</span>
                        <span className="linha-slider__valor">
                          R$ {alocacao[canal.id]} mi <em>→ efeito +{efeitoVerba(alocacao[canal.id]).toFixed(1)}</em>
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={max}
                        value={alocacao[canal.id]}
                        style={{ accentColor: canal.cor }}
                        onChange={(e) => setAlocacao((a) => ({ ...a, [canal.id]: Number(e.target.value) }))}
                      />
                      <p className="linha-slider__explicacao">
                        {canal.impacto} {canal.publico}
                      </p>
                    </div>
                  </div>
                );
              })}
              <p className={excedeCaixa ? "aviso-divida" : ""}>
                Total alocado: R$ {custoTotal} mi
                {excedeCaixa && " — isso vai gerar dívida de campanha."}
              </p>
              <button type="button" className="botao-decisao botao-decisao--primario" onClick={confirmarVerba}>
                Confirmar verba
              </button>
            </section>
          )}

          {etapa === "plataforma" && (
            <section className="bloco-decisao">
              <h2>🏛️ Plataforma de Governo</h2>
              <p>
                Defina a prioridade de {jogadorBase.nome} em cada área, de 0 a 10. Não custa caixa — é discurso, não
                verba —, mas ênfase alta (7 ou mais) vira promessa formal de governo e pesa na nota de
                governabilidade se eleito.
              </p>
              {AREAS.map((area) => (
                <div key={area.id} className="canal-card" style={{ borderLeftColor: area.cor }}>
                  <div className="canal-card__icone" style={{ background: area.cor }}>
                    {area.icone}
                  </div>
                  <div className="canal-card__corpo">
                    <div className="linha-slider__cabecalho">
                      <span className="canal-card__nome">{area.nome}</span>
                      <span className="linha-slider__valor">
                        Ênfase {enfases[area.id]}
                        {enfases[area.id] >= 7 && <em className="aviso-promessa">→ vira promessa formal</em>}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      value={enfases[area.id]}
                      style={{ accentColor: area.cor }}
                      onChange={(e) => setEnfases((a) => ({ ...a, [area.id]: Number(e.target.value) }))}
                    />
                    <p className="linha-slider__explicacao">Público-alvo: {area.publico}</p>
                  </div>
                </div>
              ))}
              <button type="button" className="botao-decisao botao-decisao--primario" onClick={confirmarPlataforma}>
                Confirmar plataforma
              </button>
            </section>
          )}

          {etapa === "dilema" && dilemaAtual && (
            <section className="bloco-decisao">
              <div className="dilema-cabecalho">
                <span className="rotulo-dilema">
                  🧭 Dilema {indiceDilema + 1} de {dilemas.length}
                </span>
                <span className={`cronometro ${tempoRestante <= 10 ? "cronometro--urgente" : ""}`}>
                  ⏱ {tempoRestante}s
                </span>
              </div>
              <h2>{dilemaAtual.titulo}</h2>
              <p>{dilemaAtual.descricao}</p>

              <h3>🗣️ O que a equipe acha</h3>
              <div className="grid-conselheiros">
                {dilemaAtual.opinioes.map((opiniao) => (
                  <CartaoConselheiro
                    key={opiniao.conselheiroId}
                    opiniao={opiniao}
                    historico={state.historicoConselheiros[opiniao.conselheiroId]}
                    selecionado={conselheiroSelecionado === opiniao.conselheiroId}
                    onSeguir={() =>
                      setOpcaoSelecionada((atual) => (atual === opiniao.recomendaOpcaoId ? undefined : opiniao.recomendaOpcaoId))
                    }
                  />
                ))}
              </div>

              <h3>✅ Opções</h3>
              <div className="grid-opcoes">
                {dilemaAtual.opcoes
                  .filter((o) => !o.oculta)
                  .map((opcao) => (
                    <button
                      key={opcao.id}
                      type="button"
                      className={`botao-decisao botao-decisao--secundario ${opcaoSelecionada === opcao.id ? "botao-decisao--selecionada" : ""}`}
                      onClick={() => setOpcaoSelecionada(opcao.id)}
                    >
                      {opcao.texto}
                    </button>
                  ))}
              </div>

              {dilemaAtual.opcoes.some((o) => o.oculta) && (
                <details className="opcao-oculta">
                  <summary>Um conselheiro pode ter revelado uma opção — ver</summary>
                  {dilemaAtual.opcoes
                    .filter((o) => o.oculta)
                    .map((opcao) => (
                      <button
                        key={opcao.id}
                        type="button"
                        className={`botao-decisao botao-decisao--secundario botao-opcao--oculta ${opcaoSelecionada === opcao.id ? "botao-decisao--selecionada" : ""}`}
                        onClick={() => setOpcaoSelecionada(opcao.id)}
                      >
                        {opcao.texto}
                      </button>
                    ))}
                </details>
              )}

              {opcaoSelecionada && opcaoSelecionadaObj?.reacao && (
                <div className="reacao-preview">
                  <span className="reacao-preview__rotulo">Repercussão imediata</span>
                  <p>{opcaoSelecionadaObj.reacao}</p>
                </div>
              )}

              {temDivergencia && opiniaoMelhorConselheiro && (
                <div className="confronto-conselheiro">
                  <strong>{CONSELHEIROS_BASE[opiniaoMelhorConselheiro.conselheiroId].nome} discorda dessa escolha:</strong>
                  <p>"{opiniaoMelhorConselheiro.fala}"</p>
                  <p className="confronto-conselheiro__ainda">
                    Ainda recomenda a opção {opiniaoMelhorConselheiro.recomendaOpcaoId}.
                  </p>
                  <div className="confronto-conselheiro__acoes">
                    <button
                      type="button"
                      className="botao-decisao botao-decisao--secundario"
                      onClick={() => setOpcaoSelecionada(undefined)}
                    >
                      Reconsiderar
                    </button>
                    <button
                      type="button"
                      className="botao-decisao botao-decisao--primario"
                      onClick={() => confirmarOpcao(opcaoSelecionada!, conselheiroSelecionado)}
                    >
                      Confirmar mesmo assim
                    </button>
                  </div>
                </div>
              )}

              {opcaoSelecionada && !temDivergencia && (
                <button
                  type="button"
                  className="botao-decisao botao-decisao--primario"
                  onClick={() => confirmarOpcao(opcaoSelecionada, conselheiroSelecionado)}
                >
                  Confirmar decisão
                </button>
              )}
            </section>
          )}

          {etapa === "tom" && (
            <section className="bloco-decisao">
              <h2>🎙️ Tom da campanha nesta rodada</h2>
              <div className="grid-opcoes grid-opcoes--tom">
                {TONS.map((tom) => (
                  <button
                    key={tom.id}
                    type="button"
                    className={`cartao-tom cartao-tom--${tom.id} ${tomSelecionado === tom.id ? "cartao-tom--selecionada" : ""}`}
                    onClick={() => setTomSelecionado(tom.id)}
                  >
                    <span className="cartao-tom__icone">{tom.icone}</span>
                    <strong>{tom.nome}</strong>
                    <span>{tom.descricao}</span>
                  </button>
                ))}
              </div>

              {jogador.metricas.riscoJuridico > LIMIAR_RISCO_CASSACAO && (
                <label className="bloco-recurso-juridico">
                  <input type="checkbox" checked={recursoJuridico} onChange={(e) => setRecursoJuridico(e.target.checked)} />
                  <span>
                    <strong>⚖️ Contratar recurso de urgência na Justiça Eleitoral</strong> — custa R${" "}
                    {CUSTO_RECURSO_JURIDICO_MI} mi (vira dívida se faltar caixa) e reduz pela metade a chance de
                    cassação nesta rodada. Não elimina o risco — litígio ativo atrasa, não garante vitória.
                  </span>
                </label>
              )}

              <button
                type="button"
                className="botao-decisao botao-decisao--primario"
                disabled={!tomSelecionado}
                onClick={confirmarTom}
              >
                Confirmar e avançar fase
              </button>
            </section>
          )}
        </main>

        <aside className="tela-rodada__painel">
          <section className="painel-atual">
            <h3>📊 Painel — {jogadorBase.nome}</h3>
            {/* Painel estável: mostra o snapshot do início da rodada, sem oscilar a
                cada decisão. A mudança só aparece na tela de "Resultado da rodada". */}
            <PainelMetricas metricas={metricasInicioRodada} margemErroIntencaoVoto={margemErroAtual} />
            <p className="indecisos-restantes">
              Indecisos/brancos/nulos em aberto: <strong>{indecisosInicioRodada.toFixed(1)}%</strong>
            </p>
          </section>

          <button type="button" className="botao-decisao botao-decisao--secundario" onClick={() => setMostrarPesquisa((v) => !v)}>
            {mostrarPesquisa ? "Esconder pesquisa" : "Ver pesquisa dos 4 candidatos"}
          </button>

          {pesquisa && (
            <div className="caixa-pesquisa">
              <strong>Pesquisa de intenção de voto</strong> (margem de erro: ±{pesquisa.margemErro} pontos)
              <ul>
                {(Object.keys(pesquisa.porCandidato) as CandidatoId[]).map((id) => (
                  <li key={id} style={{ color: CORES_CANDIDATO[id] }}>
                    {CANDIDATOS_BASE[id].nome}: {pesquisa.porCandidato[id]}%
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      <section className="bloco-decisao grafico-secao grafico-secao--rodape">
        <h3>📈 Intenção de voto por segmento</h3>
        <GraficoSegmentos candidatos={candidatosInicioRodada} candidatosBase={state.candidatosBase} />
      </section>
    </div>
  );
}
