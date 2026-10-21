import { ORDEM_FASES } from "../../engine/types";
import { EstrelaAzul } from "./EstrelaAzul";

export const NOME_CURTO_FASE: Record<string, string> = {
  pre_campanha: "Pré-campanha",
  plataforma_governo: "Plataforma",
  convencao: "Convenção",
  campanha_oficial: "Campanha",
  campanha_intermediaria: "Meio",
  debates: "Debates",
  reta_final: "Indecisos",
  primeiro_turno: "1º turno",
  segundo_turno: "2º turno",
};

interface Props {
  faseIndex: number;
  /** Clicar numa fase já concluída abre o histórico — "ver as fases anteriores". */
  onClicarFaseConcluida?: () => void;
}

export function MarcadorRodada({ faseIndex, onClicarFaseConcluida }: Props) {
  return (
    <ol className="marcador-rodada">
      {ORDEM_FASES.map((fase, i) => {
        const concluida = i < faseIndex;
        return (
          <li key={fase} className={i === faseIndex ? "marcador-rodada__item--atual" : ""}>
            {concluida && onClicarFaseConcluida ? (
              <button type="button" className="marcador-rodada__botao" onClick={onClicarFaseConcluida}>
                <EstrelaAzul variante="cheia" tamanho={18} />
                <span>{NOME_CURTO_FASE[fase]}</span>
              </button>
            ) : (
              <>
                <EstrelaAzul variante={i === faseIndex ? "atual-rodada" : "contorno"} tamanho={18} />
                <span>{NOME_CURTO_FASE[fase]}</span>
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}
