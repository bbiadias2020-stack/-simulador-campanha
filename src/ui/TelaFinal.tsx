import { useEffect, useRef, useState } from "react";
import { CONSELHEIROS_BASE } from "../data/conselheiros";
import { calcularScoreRanking, classificarVitoria } from "../engine/score";
import { buscarPosicaoRanking, enviarResultadoFinal, type PosicaoRanking } from "../integracao/ranking";
import { RANKING_HABILITADO } from "../integracao/supabase";
import { useGameDispatch, useGameState } from "../store/GameContext";
import { carregarHistorico, carregarJogadorAtual, salvarSeedReplay } from "../store/persistence";
import { EstrelaAzul } from "./components/EstrelaAzul";
import { GraficoHistoricoMetricas } from "./components/GraficoHistoricoMetricas";
import { GraficoVotos } from "./components/GraficoVotos";
import { NOME_FASE } from "./nomesFase";
import { CORES_CANDIDATO } from "./paleta";

export function TelaFinal() {
  const state = useGameState()!;
  const dispatch = useGameDispatch();
  const resultado = state.resultado!;
  const jogadorBase = state.candidatosBase[state.jogadorId];
  const venceu = resultado.vencedorId === state.jogadorId;
  const historico = carregarHistorico();
  const saidaAntecipada = resultado.cassado || resultado.faliuPorDivida;
  const selosVitoria = venceu ? classificarVitoria(state) : [];
  const score = calcularScoreRanking(resultado, state.jogadorId);

  const [ranking, setRanking] = useState<PosicaoRanking | null>(null);
  const envioFeitoRef = useRef(false);

  useEffect(() => {
    if (envioFeitoRef.current || !RANKING_HABILITADO) return;
    envioFeitoRef.current = true;

    const jogador = carregarJogadorAtual();
    if (!jogador) return;

    (async () => {
      await enviarResultadoFinal({
        jogoId: jogador.jogoId,
        nome: jogador.nome,
        candidatoId: state.jogadorId,
        candidatoNome: jogadorBase.nome,
        votosFinais: resultado.votosFinais[state.jogadorId] ?? 0,
        notaGovernabilidade: resultado.notaGovernabilidade,
        score,
        venceu,
        seed: state.seed,
      });
      const posicao = await buscarPosicaoRanking(score);
      setRanking(posicao);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let icone = "🏆";
  let titulo = venceu ? `${jogadorBase.nome} venceu!` : `${state.candidatosBase[resultado.vencedorId!]?.nome ?? "Ninguém"} venceu`;
  let subtitulo = "";

  if (resultado.cassado) {
    icone = "⚖️";
    titulo = `${jogadorBase.nome} foi cassado(a)`;
    subtitulo = "A campanha foi encerrada por decisão judicial antes do fim.";
  } else if (resultado.faliuPorDivida) {
    icone = "💸";
    titulo = `${jogadorBase.nome} saiu da disputa por dívida`;
    subtitulo = "Contas rejeitadas por dívida descontrolada — candidatura retirada.";
  } else if (resultado.foiEliminadoAntesDoSegundoTurno) {
    icone = "🚪";
    titulo = `${jogadorBase.nome} não passou para o 2º turno`;
    subtitulo = `${state.candidatosBase[resultado.vencedorId!].nome} seguiu na disputa.`;
  }

  function jogarDeNovoMesmaSemente() {
    salvarSeedReplay(state.seed);
    dispatch({ type: "REINICIAR" });
  }

  function novaPartida() {
    dispatch({ type: "REINICIAR" });
  }

  return (
    <div className="tela tela-final">
      <header className={`cabecalho-bansh ${saidaAntecipada ? "cabecalho-bansh--alerta" : ""}`}>
        <div className="cabecalho-bansh__conteudo cabecalho-bansh__conteudo--centralizado">
          <span className="tela-final__trofeu">{icone}</span>
          <EstrelaAzul variante="selo" tamanho={44} />
          <span className="cabecalho-bansh__pais">BANSH · RESULTADO DA ELEIÇÃO</span>
          <h1 style={{ color: "var(--marfim)" }}>{titulo}</h1>
          {subtitulo && (
            <p style={{ color: "var(--marfim)", opacity: 0.9, margin: "4px 0 0" }}>{subtitulo}</p>
          )}
        </div>
      </header>
      <div className="faixa-ouro" />

      <div className="tela-final__corpo">
        {RANKING_HABILITADO && (
          <section className="bloco-decisao cartao-ranking-publico">
            <h2>🏅 Ranking público</h2>
            <p>
              Seu score: <strong>{score}/100</strong> (metade votos finais, metade governabilidade).
            </p>
            {ranking ? (
              <p className="cartao-ranking-publico__posicao">
                Você ficou em <strong>{ranking.posicao}º lugar</strong> entre {ranking.totalJogadores}{" "}
                {ranking.totalJogadores === 1 ? "jogador" : "jogadores"}.
              </p>
            ) : (
              <p>Calculando sua posição no ranking...</p>
            )}
          </section>
        )}

        {selosVitoria.length > 0 && (
          <section className="bloco-decisao grid-selos-vitoria">
            {selosVitoria.map((selo) => (
              <div key={selo.titulo} className="cartao-selo-vitoria">
                <span className="cartao-selo-vitoria__icone">{selo.icone}</span>
                <div>
                  <strong>{selo.titulo}</strong>
                  <p>{selo.descricao}</p>
                </div>
              </div>
            ))}
          </section>
        )}

        <section className="bloco-decisao">
          <h2>🗳️ Votos finais {resultado.foiSegundoTurno ? "(2º turno)" : "(1º turno)"}</h2>
          <GraficoVotos votosFinais={resultado.votosFinais} candidatosBase={state.candidatosBase} />
        </section>

        <section className="bloco-decisao grid-placar">
          <div className="cartao-metrica cartao-metrica--grande">
            <span className="cartao-metrica__icone">💸</span>
            <span className="cartao-metrica__rotulo">Dívida de campanha</span>
            <span className="cartao-metrica__valor cartao-metrica__valor--gigante">R$ {resultado.dividaMi} mi</span>
          </div>
          <div className="cartao-metrica cartao-metrica--grande">
            <span className="cartao-metrica__icone">🏛️</span>
            <span className="cartao-metrica__rotulo">Nota de governabilidade</span>
            <span className="cartao-metrica__valor cartao-metrica__valor--gigante">{resultado.notaGovernabilidade}/100</span>
          </div>
          <div className="cartao-metrica cartao-metrica--grande">
            <span className="cartao-metrica__icone">🤝</span>
            <span className="cartao-metrica__rotulo">Promessas feitas</span>
            <span className="cartao-metrica__valor cartao-metrica__valor--gigante">{resultado.promessasFeitas.length}</span>
          </div>
        </section>

        {resultado.promessasFeitas.length > 0 && (
          <section className="bloco-decisao">
            <h3>🤝 Promessas e cargos prometidos</h3>
            <ul>
              {resultado.promessasFeitas.map((p, i) => (
                <li key={i}>
                  {p.descricao} <span className="aviso-divida">(custo: {p.custoGovernabilidade} na governabilidade)</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {state.historicoMetricas.length >= 2 && (
          <section className="bloco-decisao">
            <h3>📈 Histórico da campanha</h3>
            <GraficoHistoricoMetricas historico={state.historicoMetricas} />
          </section>
        )}

        <section className="bloco-decisao">
          <h3>🕰️ Linha do tempo das decisões</h3>
          <ol className="timeline">
            {state.historicoDecisoes.map((d, i) => (
              <li key={i}>
                <span className="timeline__fase">{NOME_FASE[d.fase]}</span>
                <span>{d.descricao}</span>
                {d.conselheiroSeguidoId && (
                  <span className="timeline__conselheiro">
                    seguiu {CONSELHEIROS_BASE[d.conselheiroSeguidoId].nome}
                    {d.acertou !== undefined && (d.acertou ? " ✓ acerto" : " ✗ erro")}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <section className="bloco-decisao">
          <h3>🔁 Comparar com partidas anteriores (mesmo navegador)</h3>
          {historico.length === 0 ? (
            <p>Nenhuma partida anterior registrada ainda.</p>
          ) : (
            <table className="tabela-historico">
              <thead>
                <tr>
                  <th>Perfil</th>
                  <th>Semente</th>
                  <th>Vencedor</th>
                  <th>Governabilidade</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {historico
                  .slice()
                  .reverse()
                  .map((h, i) => (
                    <tr key={i}>
                      <td style={{ color: CORES_CANDIDATO[h.jogadorId] }}>{state.candidatosBase[h.jogadorId].nome}</td>
                      <td>{h.seed}</td>
                      <td>{h.resultado.vencedorId ? state.candidatosBase[h.resultado.vencedorId].nome : "—"}</td>
                      <td>{h.resultado.notaGovernabilidade}</td>
                      <td>{new Date(h.dataISO).toLocaleString("pt-BR")}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </section>

        <div className="tela-final__acoes">
          <button type="button" className="botao-decisao botao-decisao--primario" onClick={jogarDeNovoMesmaSemente}>
            Jogar de novo com outro perfil (mesma semente)
          </button>
          <button type="button" className="botao-decisao botao-decisao--secundario" onClick={novaPartida}>
            Começar nova partida (semente aleatória)
          </button>
        </div>
      </div>
    </div>
  );
}
