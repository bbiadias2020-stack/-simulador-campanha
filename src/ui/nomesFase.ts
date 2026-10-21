import type { Fase } from "../engine/types";

export const NOME_FASE: Record<Fase, string> = {
  pre_campanha: "Pré-campanha",
  plataforma_governo: "Plataforma de Governo",
  convencao: "Convenção",
  campanha_oficial: "Campanha oficial",
  campanha_intermediaria: "Meio de campanha",
  debates: "Debates",
  reta_final: "Reta final: indecisos",
  primeiro_turno: "1º turno",
  segundo_turno: "2º turno",
};
