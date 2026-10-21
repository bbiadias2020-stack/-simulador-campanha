import { useState } from "react";
import { CANDIDATO_IDS, CANDIDATOS_BASE } from "../data/candidatos";
import type { CandidatoId } from "../engine/types";
import { RANKING_HABILITADO } from "../integracao/supabase";
import { useGameDispatch } from "../store/GameContext";
import {
  carregarNomeJogador,
  carregarSeedReplay,
  limparSeedReplay,
  salvarJogadorAtual,
  salvarNomeJogador,
} from "../store/persistence";
import { EstrelaAzul } from "./components/EstrelaAzul";
import { CORES_CANDIDATO } from "./paleta";

const RESUMO_IDEOLOGIA: Record<string, string> = {
  progressista_estado: "Progressista nos costumes · Estado na economia",
  progressista_mercado: "Progressista nos costumes · Mercado na economia",
  conservador_estado: "Conservador nos costumes · Estado na economia",
  conservador_mercado: "Conservador nos costumes · Mercado na economia",
};

export function TelaInicial() {
  const dispatch = useGameDispatch();
  const seedReplay = carregarSeedReplay();
  const [nome, setNome] = useState(() => carregarNomeJogador());
  const nomeValido = nome.trim().length >= 2;

  function iniciar(jogadorId: CandidatoId) {
    if (!nomeValido) return;
    const nomeFinal = nome.trim();
    salvarNomeJogador(nomeFinal);
    salvarJogadorAtual({ nome: nomeFinal, jogoId: crypto.randomUUID() });

    const seed = seedReplay ?? Math.floor(Math.random() * 1_000_000_000);
    limparSeedReplay();
    dispatch({ type: "ESCOLHER_CANDIDATO", jogadorId, seed });
  }

  return (
    <div className="tela tela-inicial">
      <header className="cabecalho-bansh">
        <div className="cabecalho-bansh__conteudo cabecalho-bansh__conteudo--centralizado">
          <EstrelaAzul variante="selo" tamanho={44} />
          <span className="cabecalho-bansh__pais">BANSH · ELEIÇÃO PRESIDENCIAL</span>
          <h1 style={{ color: "var(--marfim)" }}>Simulador de Campanha</h1>
        </div>
      </header>
      <div className="faixa-ouro" />

      <div className="tela-inicial__intro">
        <section className="bloco-explicativo">
          <h2>🏛️ Sobre Bansh</h2>
          <p>
            Bansh é uma federação com pouco mais de um século de história democrática, hoje às vésperas da eleição
            presidencial mais disputada que já teve. O país é atravessado por dois grandes debates: um econômico,
            entre mais Estado e mais mercado, e um de costumes, entre progressistas e conservadores — e os quatro
            nomes na disputa ocupam cada um dos quatro cruzamentos possíveis desses eixos. Nenhum larga na frente
            com folga: a corrida deve se decidir nos detalhes.
          </p>
          <p>
            Você assume o papel de <strong>marqueteiro-chefe</strong> de um desses quatro candidatos. Não existe
            resposta certa pronta — cada escolha tem um trade-off, e o resultado só aparece lá na frente.
          </p>
          <ul className="lista-explicativa">
            <li>
              <strong>9 fases de campanha</strong> — da pré-campanha ao 2º turno, que só acontece se ninguém passar
              de 50% dos votos válidos no 1º.
            </li>
            <li>
              <strong>Nem toda fase é sobre verba</strong> — na maioria das rodadas você distribui o caixa entre TV,
              digital, comícios, pesquisas e equipe jurídica, com retornos decrescentes; outras giram em torno da
              sua plataforma de governo, de dilemas ou do tom da campanha.
            </li>
            <li>
              <strong>Conselho dividido</strong> — antes de cada dilema, 2 a 3 conselheiros dão opiniões que se
              contradizem; você decide quem ouvir.
            </li>
            <li>
              <strong>Pesquisas com margem de erro</strong> — os números que você vê nunca são exatos; investir em
              pesquisa melhora a leitura.
            </li>
            <li>
              <strong>Consequências atrasadas</strong> — algumas escolhas dão ganho imediato, mas abrem risco de
              crise nas rodadas seguintes.
            </li>
            <li>
              <strong>Como se vence:</strong> passar de 50% dos votos válidos já no 1º turno, ou vencer o 2º turno
              entre os 2 mais votados. Os 3 adversários também fazem campanha fora de tela — ficar parado é andar
              para trás — e mesmo quem lidera com folga pode ser surpreendido no dia da eleição. Nenhuma estratégia
              é 100% segura; boas decisões reduzem o risco, não o eliminam.
            </li>
          </ul>
          <p>Escolha um dos 4 candidatos abaixo para começar. Os outros 3 viram seus adversários.</p>
        </section>
        {seedReplay !== null && (
          <p className="aviso-replay">
            Jogando novamente com a <strong>mesma semente</strong> da última partida, para comparar perfis em
            igualdade de condições.
          </p>
        )}
      </div>

      <section className="bloco-nome-jogador">
        <label htmlFor="nome-jogador">
          <strong>Seu nome ou apelido</strong>
          {RANKING_HABILITADO && <span className="bloco-nome-jogador__aviso"> — vai aparecer no ranking público</span>}
        </label>
        <input
          id="nome-jogador"
          type="text"
          maxLength={40}
          placeholder="Como quer aparecer no ranking?"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
      </section>

      <div className="grid-candidatos">
        {CANDIDATO_IDS.map((id) => {
          const c = CANDIDATOS_BASE[id];
          const chaveIdeologia = `${c.costumes}_${c.economia}`;
          return (
            <article key={id} className="cartao-candidato" style={{ borderColor: CORES_CANDIDATO[id] }}>
              <div className="cartao-candidato__cabecalho">
                <h2 style={{ color: CORES_CANDIDATO[id] }}>{c.nome}</h2>
                <span className="badge">{RESUMO_IDEOLOGIA[chaveIdeologia]}</span>
              </div>

              <p className="cartao-candidato__apresentacao">{c.apresentacao}</p>

              <ul className="cartao-candidato__stats">
                <li>
                  <span>Intenção de voto</span>
                  <strong>{c.metricasIniciais.intencaoVoto}%</strong>
                </li>
                <li>
                  <span>Rejeição</span>
                  <strong>{c.metricasIniciais.rejeicao}%</strong>
                </li>
                <li>
                  <span>Orçamento total</span>
                  <strong>R$ {c.metricasIniciais.caixaMi} mi</strong>
                </li>
              </ul>
              <p className="cartao-candidato__nota-orcamento">
                Esse é todo o dinheiro disponível do início ao fim — não se renova a cada rodada. Gastar rápido
                demais no começo deixa pouco para a reta final.
              </p>

              <button
                type="button"
                className="botao-decisao botao-decisao--primario"
                disabled={!nomeValido}
                title={nomeValido ? undefined : "Digite seu nome ou apelido acima primeiro"}
                onClick={() => iniciar(id)}
              >
                Escolher {c.nome.split(" ")[0]}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
