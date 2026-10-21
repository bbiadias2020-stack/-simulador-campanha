interface Props {
  rotulo: string;
  valor: number;
  valorAnterior?: number;
  margemErro?: number;
  invertido?: boolean;
}

/** Valor grande em mono + barra de progresso, variação com seta e sinal, margem de erro. */
export function CartaoMetrica({ rotulo, valor, valorAnterior, margemErro, invertido }: Props) {
  const delta = valorAnterior === undefined ? null : Math.round((valor - valorAnterior) * 10) / 10;
  const subiu = delta !== null && delta > 0;
  const desceu = delta !== null && delta < 0;
  const corBoa = invertido ? desceu : subiu;
  const corRuim = invertido ? subiu : desceu;
  const larguraBarra = Math.max(0, Math.min(100, valor));

  return (
    <div className="cartao-metrica">
      <span className="cartao-metrica__rotulo">{rotulo}</span>
      <span className="cartao-metrica__valor">
        {Math.round(valor * 10) / 10}
        {margemErro !== undefined && <span className="cartao-metrica__margem"> ±{margemErro}</span>}
      </span>
      {delta !== null && delta !== 0 && (
        <span className={`cartao-metrica__delta ${corBoa ? "cartao-metrica__delta--positivo" : ""} ${corRuim ? "cartao-metrica__delta--negativo" : ""}`}>
          {subiu ? "▲" : "▼"} {subiu ? "+" : ""}
          {delta}
        </span>
      )}
      <div className="cartao-metrica__barra-fundo">
        <div
          className={`cartao-metrica__barra ${invertido ? "cartao-metrica__barra--invertido" : ""}`}
          style={{ width: `${larguraBarra}%` }}
        />
      </div>
    </div>
  );
}
