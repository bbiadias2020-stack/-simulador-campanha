import type { Metricas } from "../../engine/types";
import { CartaoMetrica } from "./CartaoMetrica";

const ROTULOS: Record<keyof Metricas, string> = {
  intencaoVoto: "Intenção de voto",
  rejeicao: "Rejeição",
  caixaMi: "Caixa (R$ mi)",
  tempoTV: "Tempo de TV",
  sentimento: "Sentimento nas redes",
  coesao: "Coesão de aliados",
  credibilidade: "Credibilidade",
  riscoJuridico: "Risco jurídico",
};

const INVERTIDAS = new Set<keyof Metricas>(["rejeicao", "riscoJuridico"]);

const ORDEM: (keyof Metricas)[] = [
  "intencaoVoto",
  "rejeicao",
  "caixaMi",
  "tempoTV",
  "sentimento",
  "coesao",
  "credibilidade",
  "riscoJuridico",
];

interface Props {
  metricas: Metricas;
  metricasAnteriores?: Metricas;
  margemErroIntencaoVoto?: number;
}

export function PainelMetricas({ metricas, metricasAnteriores, margemErroIntencaoVoto }: Props) {
  return (
    <div className="painel-metricas">
      {ORDEM.map((chave) => (
        <CartaoMetrica
          key={chave}
          rotulo={ROTULOS[chave]}
          valor={metricas[chave]}
          valorAnterior={metricasAnteriores?.[chave]}
          margemErro={chave === "intencaoVoto" ? margemErroIntencaoVoto : undefined}
          invertido={INVERTIDAS.has(chave)}
        />
      ))}
    </div>
  );
}
