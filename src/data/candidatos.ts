import type { CandidatoBase } from "../engine/types";

/**
 * Os 4 perfis fictícios (Parte 3 da spec). Nenhum nome, partido ou fato real.
 * Todos os valores aqui são ponto de partida de balanceamento — ver src/config/balance.ts
 * e o README para as suposições assumidas.
 */
export const CANDIDATOS_BASE: Record<string, CandidatoBase> = {
  luana: {
    id: "luana",
    nome: "Luana Prado",
    genero: "Mulher trans",
    costumes: "progressista",
    economia: "estado",
    raca: "Negra",
    idade: 36,
    origem: "Sudeste",
    religiao: "Sem religião",
    trajetoria: "Deputada federal mais votada do estado",
    partido: "medio_federacao",
    esqueleto: "Posts antigos com ataques pessoais a adversários",
    seguidores: 9_800_000,
    engajamento: 0.041,
    pontoForte: "Maior base digital, mobiliza jovens e voluntários",
    obstaculo: "Principal alvo de desinformação, sem experiência executiva",
    apresentacao:
      "Sou Luana Prado, 36 anos, a deputada federal mais votada do meu estado. Mulher trans, negra, sem papas na " +
      "língua quando o assunto é defender quem o sistema historicamente deixou de fora. Minha força está nas " +
      "redes — quase 10 milhões de seguidores e a militância mais mobilizada dessa disputa —, mas sei que serei " +
      "o principal alvo de fake news da campanha, e que nunca ter comandado um governo vai pesar contra mim. " +
      "Tenho posts antigos que prometem voltar para me assombrar. Ainda assim, é com essa base que pretendo vencer.",
    metricasIniciais: {
      intencaoVoto: 18,
      rejeicao: 46,
      caixaMi: 45,
      tempoTV: 22,
      sentimento: 52,
      coesao: 78,
      credibilidade: 61,
      riscoJuridico: 12,
    },
    intencaoPorSegmentoInicial: {
      jovens: 31,
      mulheres: 25,
      evangelicos: 6,
      classeC: 17,
      nordeste: 19,
      sul: 12,
    },
  },
  rafael: {
    id: "rafael",
    nome: "Rafael Tanaka",
    genero: "Homem cis",
    costumes: "progressista",
    economia: "mercado",
    raca: "Amarela (nipo-brasileiro)",
    idade: 47,
    origem: "Sul",
    religiao: "Católico",
    trajetoria: "Ex-prefeito de capital",
    partido: "medio",
    esqueleto: "Delação cita doação não declarada",
    seguidores: 1_900_000,
    engajamento: 0.018,
    pontoForte: "Imagem de gestor moderado, trânsito no centro",
    obstaculo: 'Pouco conhecido fora do Sul, visto como "morno"',
    apresentacao:
      "Sou Rafael Tanaka, 47 anos, ex-prefeito de uma capital do Sul, onde entreguei uma gestão que o eleitorado " +
      "considera equilibrada. Nipo-brasileiro, católico, e minha marca é o centro: converso tanto com quem quer " +
      "mais mercado quanto com quem desconfia dele. O problema é que pouca gente me conhece fora do Sul, e tem " +
      "quem me ache \"morno\" demais para uma disputa dessas. Uma delação recente também cita uma doação que eu " +
      "não declarei — isso pode voltar a me perseguir. Minha aposta é ser a opção mais aceitável quando a poeira baixar.",
    metricasIniciais: {
      intencaoVoto: 16,
      rejeicao: 22,
      caixaMi: 55,
      tempoTV: 26,
      sentimento: 56,
      coesao: 70,
      credibilidade: 66,
      riscoJuridico: 32,
    },
    intencaoPorSegmentoInicial: {
      jovens: 12,
      mulheres: 12,
      evangelicos: 9,
      classeC: 10,
      nordeste: 6,
      sul: 21,
    },
  },
  helena: {
    id: "helena",
    nome: "Helena Siqueira",
    genero: "Mulher cis",
    costumes: "conservador",
    economia: "estado",
    raca: "Parda",
    idade: 57,
    origem: "Nordeste",
    religiao: "Evangélica",
    trajetoria: "Ex-governadora",
    partido: "grande",
    esqueleto: "Contrato emergencial na saúde sob investigação",
    seguidores: 1_100_000,
    engajamento: 0.024,
    pontoForte: "Máquina partidária e experiência de gestão",
    obstaculo: 'Pouca presença digital, vista como "do sistema"',
    apresentacao:
      "Sou Helena Siqueira, 57 anos, ex-governadora e hoje a candidata com mais estrutura nessa eleição: o maior " +
      "partido, o maior caixa, o maior tempo de TV. Parda, evangélica, nascida no Nordeste, carrego anos de " +
      "experiência de gestão que meus adversários não têm. Mas essa mesma experiência cobra um preço: um " +
      "contrato emergencial da saúde do meu governo está sob investigação, e nas redes sou vista como \"do " +
      "sistema\" — uma etiqueta que pretendo provar que está errada.",
    metricasIniciais: {
      intencaoVoto: 21,
      rejeicao: 38,
      caixaMi: 85,
      tempoTV: 40,
      sentimento: 47,
      coesao: 58,
      credibilidade: 54,
      riscoJuridico: 45,
    },
    intencaoPorSegmentoInicial: {
      jovens: 14,
      mulheres: 23,
      evangelicos: 34,
      classeC: 28,
      nordeste: 36,
      sul: 15,
    },
  },
  augusto: {
    id: "augusto",
    nome: "Augusto Brandão",
    genero: "Homem cis",
    costumes: "conservador",
    economia: "mercado",
    raca: "Branca",
    idade: 58,
    origem: "Centro-Oeste",
    religiao: "Católico",
    trajetoria: "Empresário do agronegócio, outsider",
    partido: "pequeno",
    esqueleto: "Multa ambiental em fazenda da família",
    seguidores: 7_200_000,
    engajamento: 0.053,
    pontoForte: "Discurso antissistema e engajamento alto",
    obstaculo: "Sem experiência política, pouco tempo de TV",
    apresentacao:
      "Sou Augusto Brandão, 58 anos, empresário do agronegócio e outsider assumido nessa disputa. Branco, " +
      "católico, do Centro-Oeste, nunca ocupei um cargo público — e uso isso a meu favor: não devo satisfação a " +
      "nenhum padrinho político. Tenho o maior engajamento da corrida e uma base disposta a brigar por mim nas " +
      "redes, mas meu partido é pequeno, meu tempo de TV é o menor de todos, e uma multa ambiental na fazenda da " +
      "minha família pode virar munição contra mim. Quem me conhece sabe: não vim para jogar o jogo de sempre.",
    metricasIniciais: {
      intencaoVoto: 19,
      rejeicao: 41,
      caixaMi: 30,
      tempoTV: 12,
      sentimento: 54,
      coesao: 64,
      credibilidade: 57,
      riscoJuridico: 36,
    },
    intencaoPorSegmentoInicial: {
      jovens: 22,
      mulheres: 17,
      evangelicos: 30,
      classeC: 19,
      nordeste: 10,
      sul: 33,
    },
  },
};

export const CANDIDATO_IDS = ["luana", "rafael", "helena", "augusto"] as const;
