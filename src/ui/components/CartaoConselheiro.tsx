import { CONSELHEIROS_BASE } from "../../data/conselheiros";
import type { ConselheiroId, HistoricoConselheiro, OpiniaoConselheiro } from "../../engine/types";
import { EstrelasAvaliacao } from "./EstrelaAzul";

interface Props {
  opiniao: OpiniaoConselheiro;
  historico: HistoricoConselheiro;
  selecionado: boolean;
  onSeguir: (id: ConselheiroId) => void;
}

const ICONE_CONSELHEIRO: Record<ConselheiroId, string> = {
  neusa: "🎙️",
  caio: "📈",
  sonia: "⚖️",
  beto: "🤝",
};

const COR_CONSELHEIRO: Record<ConselheiroId, string> = {
  neusa: "#1d3a64",
  caio: "#3e6698",
  sonia: "#7e5b1c",
  beto: "#4f3912",
};

export function CartaoConselheiro({ opiniao, historico, selecionado, onSeguir }: Props) {
  const conselheiro = CONSELHEIROS_BASE[opiniao.conselheiroId];
  const cor = COR_CONSELHEIRO[opiniao.conselheiroId];
  return (
    <div
      className={`cartao-conselheiro ${selecionado ? "cartao-conselheiro--selecionado" : ""}`}
      style={{ borderTopColor: cor }}
    >
      <div className="cartao-conselheiro__cabecalho">
        <span className="cartao-conselheiro__icone" style={{ background: cor }}>
          {ICONE_CONSELHEIRO[opiniao.conselheiroId]}
        </span>
        <div>
          <strong>{conselheiro.nome}</strong>
          <span className="cartao-conselheiro__papel">{conselheiro.papel}</span>
        </div>
        <EstrelasAvaliacao acertos={historico.acertos} erros={historico.erros} />
      </div>
      <p className="cartao-conselheiro__fala">"{opiniao.fala}"</p>
      <p className="cartao-conselheiro__recomendacao">Recomenda: opção {opiniao.recomendaOpcaoId}</p>
      <button
        type="button"
        className={`botao-decisao botao-decisao--secundario ${selecionado ? "botao-decisao--selecionada" : ""}`}
        onClick={() => onSeguir(opiniao.conselheiroId)}
      >
        {selecionado ? "Seguindo este conselho ✓" : "Seguir este conselho"}
      </button>
    </div>
  );
}
