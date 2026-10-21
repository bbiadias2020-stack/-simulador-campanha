import type { ConselheiroId } from "../engine/types";

export interface ConselheiroBase {
  id: ConselheiroId;
  nome: string;
  papel: string;
  especialidade: string;
  vies: string;
  acertaMaisCom: string;
}

export const CONSELHEIROS_BASE: Record<ConselheiroId, ConselheiroBase> = {
  neusa: {
    id: "neusa",
    nome: "Neusa Lacerda",
    papel: "a veterana",
    especialidade: "30 anos de campanha, TV e jingle",
    vies: "Subestima as redes",
    acertaMaisCom: "Eleitores mais velhos, classe C, candidatos com muito tempo de TV",
  },
  caio: {
    id: "caio",
    nome: "Caio Fontes",
    papel: "o growth",
    especialidade: "Dados, memes e influenciadores",
    vies: "Topa a área cinzenta das regras do TSE",
    acertaMaisCom: "Jovens, candidatos com muitos seguidores",
  },
  sonia: {
    id: "sonia",
    nome: "Sônia Arruda",
    papel: "a jurídica",
    especialidade: "Direito eleitoral e gestão de crise",
    vies: "Trava a campanha por excesso de cautela",
    acertaMaisCom: "Crises com fake news e deepfake",
  },
  beto: {
    id: "beto",
    nome: "Beto Rangel",
    papel: "o coordenador político",
    especialidade: "Alianças e lideranças regionais",
    vies: "Defende interesses do partido e dos aliados",
    acertaMaisCom: "2º turno e negociações",
  },
};

export const CONSELHEIRO_IDS: ConselheiroId[] = ["neusa", "caio", "sonia", "beto"];
