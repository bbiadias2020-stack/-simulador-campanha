import { CONSELHEIROS_BASE } from "../../data/conselheiros";
import { ORDEM_FASES } from "../../engine/types";
import type { DecisaoLogEntry } from "../../engine/types";
import { NOME_FASE } from "../nomesFase";

interface Props {
  historico: DecisaoLogEntry[];
  onFechar: () => void;
}

/** Histórico sempre acessível durante a partida — não só no fim de jogo. */
export function PainelHistorico({ historico, onFechar }: Props) {
  const porFase = ORDEM_FASES.map((fase) => ({
    fase,
    entradas: historico.filter((d) => d.fase === fase),
  })).filter((grupo) => grupo.entradas.length > 0);

  return (
    <div className="overlay-historico" onClick={onFechar}>
      <div className="painel-historico" onClick={(e) => e.stopPropagation()}>
        <div className="painel-historico__cabecalho">
          <h2>Histórico da campanha</h2>
          <button type="button" className="botao-decisao botao-decisao--secundario" onClick={onFechar}>
            Fechar
          </button>
        </div>

        {porFase.length === 0 && <p>Nada registrado ainda — as decisões desta campanha vão aparecer aqui.</p>}

        {porFase.map(({ fase, entradas }) => (
          <section key={fase} className="painel-historico__fase">
            <h3>{NOME_FASE[fase]}</h3>
            <ul>
              {entradas.map((d, i) => (
                <li key={i} className={d.tipo === "crise" ? "painel-historico__item--crise" : ""}>
                  <span>{d.descricao}</span>
                  {d.conselheiroSeguidoId && (
                    <span className="painel-historico__conselheiro">
                      seguiu {CONSELHEIROS_BASE[d.conselheiroSeguidoId].nome}
                      {d.acertou !== undefined && (d.acertou ? " ✓ acerto" : " ✗ erro")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
