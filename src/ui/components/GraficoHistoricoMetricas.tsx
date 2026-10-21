import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SnapshotMetricas } from "../../engine/types";
import { NOME_CURTO_FASE } from "./MarcadorRodada";

interface Props {
  historico: SnapshotMetricas[];
}

const LINHAS: { chave: keyof SnapshotMetricas["metricas"]; nome: string; cor: string }[] = [
  { chave: "intencaoVoto", nome: "Intenção de voto", cor: "#1d3a64" },
  { chave: "rejeicao", nome: "Rejeição", cor: "#a8462f" },
  { chave: "sentimento", nome: "Sentimento nas redes", cor: "#7e5b1c" },
  { chave: "credibilidade", nome: "Credibilidade", cor: "#2f6e5e" },
];

/** Histórico rodada a rodada das métricas do jogador — "como cheguei até aqui". */
export function GraficoHistoricoMetricas({ historico }: Props) {
  if (historico.length < 2) return null;

  const dados = historico.map((snap, i) => ({
    rodada: `${i + 1}. ${NOME_CURTO_FASE[snap.fase] ?? snap.fase}`,
    ...snap.metricas,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={dados} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="rodada" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 13 }} unit="%" />
        <Tooltip />
        <Legend />
        {LINHAS.map((linha) => (
          <Line
            key={linha.chave}
            type="monotone"
            dataKey={linha.chave}
            name={linha.nome}
            stroke={linha.cor}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
