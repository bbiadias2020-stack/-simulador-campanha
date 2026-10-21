import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const CHAVE = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * `null` quando as variáveis de ambiente não estão configuradas (ex.: rodando
 * local sem `.env`, ou o deploy ainda não foi ligado a um projeto Supabase).
 * Todo código que usa isso deve tratar `null` sem quebrar o jogo — salvar
 * resultado/comentário é "melhor esforço", nunca bloqueia a partida.
 */
export const supabase: SupabaseClient | null =
  URL && CHAVE ? createClient(URL, CHAVE) : null;

export const RANKING_HABILITADO = supabase !== null;
