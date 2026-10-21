/**
 * A estrela azul de cinco pontas é a assinatura visual da marca Bansh: selo no
 * cabeçalho, marcador das rodadas, histórico de acertos dos conselheiros (1 a 5
 * estrelas) e indicador de opção selecionada. Sempre azul, nunca dourada ou girada.
 */
const CAMINHO_ESTRELA =
  "M12 2 14.59 8.36 21.51 9.1 16.26 13.97 17.77 20.9 12 17.27 6.23 20.9 7.74 13.97 2.49 9.1 9.41 8.36Z";

export type VarianteEstrela = "cheia" | "contorno" | "atual-rodada" | "selo";

interface Props {
  variante?: VarianteEstrela;
  tamanho?: number;
}

export function EstrelaAzul({ variante = "cheia", tamanho = 20 }: Props) {
  if (variante === "atual-rodada") {
    return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="var(--ouro-faixa)" />
        <path d={CAMINHO_ESTRELA} fill="var(--azul-federacao)" />
      </svg>
    );
  }
  if (variante === "selo") {
    return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="var(--marfim)" />
        <path d={CAMINHO_ESTRELA} fill="var(--azul-federacao)" />
      </svg>
    );
  }
  if (variante === "contorno") {
    return (
      <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d={CAMINHO_ESTRELA} stroke="var(--linha-forte)" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" aria-hidden="true">
      <path d={CAMINHO_ESTRELA} fill="var(--azul-federacao)" />
    </svg>
  );
}

/** Histórico de acertos de um conselheiro, de 1 a 5 estrelas azuis. */
export function EstrelasAvaliacao({ acertos, erros }: { acertos: number; erros: number }) {
  const total = acertos + erros;
  const nota = total === 0 ? 0 : Math.max(1, Math.round((acertos / total) * 5));
  return (
    <span className="estrelas-avaliacao" aria-label={total === 0 ? "sem histórico ainda" : `${nota} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <EstrelaAzul key={i} variante={i < nota ? "cheia" : "contorno"} tamanho={13} />
      ))}
    </span>
  );
}
