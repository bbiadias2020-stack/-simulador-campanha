import type { CandidatoId } from "../engine/types";

/**
 * Cores dos candidatos — só usadas em dados (gráficos, legendas, bordas), sempre
 * com o nome ao lado. Derivadas da paleta da bandeira de Bansh (azul-federação +
 * dourado): os dois progressistas em tom de azul, os dois conservadores em tom de
 * dourado/bronze, cada par com uma variação clara/escura para diferenciar.
 */
export const CORES_CANDIDATO: Record<CandidatoId, string> = {
  luana: "#1D3A64", // azul-federação — progressista
  rafael: "#3E6698", // azul médio — progressista
  helena: "#7E5B1C", // ouro-texto — conservadora
  augusto: "#4F3912", // dourado escuro/bronze — conservador
};
