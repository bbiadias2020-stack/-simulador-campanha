import type { CandidatoId } from "../engine/types";
import { supabase } from "./supabase";

export interface ComentarioRodada {
  jogoId: string;
  nome: string;
  candidatoId: CandidatoId;
  fase: string;
  faseNome: string;
  texto: string;
}

export interface ResultadoFinal {
  jogoId: string;
  nome: string;
  candidatoId: CandidatoId;
  candidatoNome: string;
  votosFinais: number;
  notaGovernabilidade: number;
  score: number;
  venceu: boolean;
  seed: number;
}

/**
 * Tudo aqui é "melhor esforço": se o Supabase não está configurado (dev local)
 * ou a escrita falha (sem internet, projeto fora do ar), a partida continua
 * normalmente — só o ranking/dashboard público fica sem esse registro.
 */
export async function enviarComentario(c: ComentarioRodada): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("comentarios").insert({
    jogo_id: c.jogoId,
    nome: c.nome,
    candidato_id: c.candidatoId,
    fase: c.fase,
    fase_nome: c.faseNome,
    texto: c.texto,
  });
  if (error) console.warn("Falha ao enviar comentário para o ranking público:", error.message);
}

export async function enviarResultadoFinal(r: ResultadoFinal): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("resultados").upsert(
    {
      id: r.jogoId,
      nome: r.nome,
      candidato_id: r.candidatoId,
      candidato_nome: r.candidatoNome,
      votos_finais: r.votosFinais,
      nota_governabilidade: r.notaGovernabilidade,
      score: r.score,
      venceu: r.venceu,
      seed: r.seed,
    },
    { onConflict: "id" },
  );
  if (error) console.warn("Falha ao enviar resultado para o ranking público:", error.message);
}

export interface PosicaoRanking {
  posicao: number;
  totalJogadores: number;
}

/** `null` quando o ranking público não está disponível (Supabase não configurado, ou a consulta falhou). */
export async function buscarPosicaoRanking(score: number): Promise<PosicaoRanking | null> {
  if (!supabase) return null;

  const [acima, total] = await Promise.all([
    supabase.from("resultados").select("id", { count: "exact", head: true }).gt("score", score),
    supabase.from("resultados").select("id", { count: "exact", head: true }),
  ]);

  if (acima.error || total.error || acima.count === null || total.count === null) {
    console.warn("Falha ao calcular posição no ranking:", acima.error?.message ?? total.error?.message);
    return null;
  }

  return { posicao: acima.count + 1, totalJogadores: total.count };
}
