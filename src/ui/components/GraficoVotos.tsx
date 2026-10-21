import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CandidatoBase, CandidatoId } from "../../engine/types";
import { CORES_CANDIDATO } from "../paleta";

interface Props {
  votosFinais: Record<CandidatoId, number>;
  candidatosBase: Record<CandidatoId, CandidatoBase>;
}

export function GraficoVotos({ votosFinais, candidatosBase }: Props) {
  const dados = (Object.keys(votosFinais) as CandidatoId[]).map((id) => ({
    id,
    nome: candidatosBase[id].nome,
    votos: votosFinais[id],
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} unit="%" />
        <Tooltip />
        <Bar dataKey="votos">
          {dados.map((d) => (
            <Cell key={d.id} fill={CORES_CANDIDATO[d.id]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
