import type { SegmentoId } from "../engine/types";

export interface SegmentoInfo {
  id: SegmentoId;
  nome: string;
}

export const SEGMENTOS: SegmentoInfo[] = [
  { id: "jovens", nome: "Jovens (16–24 anos)" },
  { id: "mulheres", nome: "Mulheres" },
  { id: "evangelicos", nome: "Evangélicos" },
  { id: "classeC", nome: "Classe C" },
  { id: "nordeste", nome: "Nordeste" },
  { id: "sul", nome: "Sul" },
];

/** % de intenção de voto que começa como brancos, nulos e indecisos. */
export const INDECISOS_INICIAL = 26;
