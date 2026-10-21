import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SEGMENTOS } from "../../data/segmentos";
import type { CandidatoBase, CandidatoId, CandidatoEstado } from "../../engine/types";
import { CORES_CANDIDATO } from "../paleta";

interface Props {
  candidatos: Record<CandidatoId, CandidatoEstado>;
  candidatosBase: Record<CandidatoId, CandidatoBase>;
}

export function GraficoSegmentos({ candidatos, candidatosBase }: Props) {
  const ids = Object.keys(candidatos) as CandidatoId[];
  const dados = SEGMENTOS.map((segmento) => {
    const linha: Record<string, number | string> = { segmento: segmento.nome };
    for (const id of ids) {
      linha[id] = Math.round(candidatos[id].intencaoPorSegmento[segmento.id] * 10) / 10;
    }
    return linha;
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={dados} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="segmento" tick={{ fontSize: 13 }} interval={0} height={40} />
        <YAxis tick={{ fontSize: 13 }} unit="%" />
        <Tooltip />
        <Legend formatter={(id: string) => candidatosBase[id as CandidatoId]?.nome ?? id} />
        {ids.map((id) => (
          <Bar key={id} dataKey={id} fill={CORES_CANDIDATO[id]} name={candidatosBase[id].nome} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
