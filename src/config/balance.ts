import type { AreaPolitica, CanalVerba, SegmentoId } from "../engine/types";

/**
 * Todo número que afeta o resultado do jogo vive aqui. Nada de números espalhados
 * no motor ou na UI — mudar um peso aqui muda o resultado sem tocar em outro arquivo.
 *
 * Os valores são suposições iniciais de balanceamento (a spec avisa que ainda não
 * existem fórmulas validadas). Ver README para a lista de suposições e para os
 * resultados da simulação de 1.000 partidas por perfil usada para calibrar isto.
 */

// ---------------------------------------------------------------------------
// Plataforma de governo (promessas por área, sem custo de caixa)
// ---------------------------------------------------------------------------

/** efeito(ênfase) = ênfase (0–10) × este peso, antes da afinidade de segmento. */
export const PESO_ENFASE_AREA = 0.5;

/** Quais segmentos cada área de política pública sensibiliza mais. */
export const AFINIDADE_SEGMENTO_AREA: Record<AreaPolitica, Partial<Record<SegmentoId, number>>> = {
  saude: { classeC: 1.5, nordeste: 1.3 },
  seguranca: { sul: 1.4, evangelicos: 1.3 },
  educacao: { jovens: 1.6, mulheres: 1.2 },
  economia: { classeC: 1.3, sul: 1.2 },
};

/** A partir desse nível de ênfase (0–10), a prioridade vira promessa formal de governo. */
export const LIMIAR_ENFASE_VIRA_PROMESSA = 7;
/** Custo de governabilidade por ponto de ênfase acima do limiar, por área prometida. */
export const CUSTO_GOVERNABILIDADE_POR_PONTO_ENFASE = 1.5;
/**
 * A partir desse nível de ênfase, cada ponto custa EXTRA em cima do custo normal
 * (não substitui, soma) — presidentes reais cumprem só 23%-47% das promessas de
 * campanha; prometer tudo em tudo (ênfase máxima em várias áreas) é o padrão mais
 * associado a desgaste de governabilidade, não uma promessa isolada e moderada.
 */
export const LIMIAR_ENFASE_PROMESSA_EXTREMA = 8;
export const CUSTO_GOVERNABILIDADE_EXTRA_PROMESSA_EXTREMA = 2;

/**
 * Dívida de campanha "contamina" a margem de manobra do governo: acima deste
 * patamar de dívida, cada ponto de governabilidade que uma promessa custaria
 * custa proporcionalmente mais — espelha casos reais em que dívida de campanha
 * não paga persegue o mandato depois da eleição.
 */
export const LIMIAR_DIVIDA_PLATAFORMA_ARRISCADA = 10;
/** Fração extra de custo de governabilidade por R$1mi de dívida acima do limiar. */
export const FATOR_CUSTO_GOVERNABILIDADE_DIVIDA_PLATAFORMA = 0.05;

// ---------------------------------------------------------------------------
// Cassação (risco jurídico alto demais encerra a campanha antes do fim)
// ---------------------------------------------------------------------------

/**
 * Acima deste patamar de risco jurídico, a campanha passa a correr risco real de
 * cassação a cada rodada — nem todo mundo chega inteiro ao fim da campanha.
 */
export const LIMIAR_RISCO_CASSACAO = 70;
/** Chance de cassação por rodada bem no limiar (70 de risco jurídico). */
export const PROB_BASE_CASSACAO = 0.12;
/** Cada ponto de risco jurídico acima do limiar soma a essa fração na chance de cassação. */
export const FATOR_PROB_CASSACAO_POR_PONTO = 0.01;
/** Teto de chance de cassação numa única rodada, mesmo com risco jurídico no máximo. */
export const PROB_MAX_CASSACAO = 0.6;

/**
 * Recurso de urgência na Justiça Eleitoral: casos reais (ex.: disputa sobre a 14ª
 * Emenda nos EUA em 2023-2024) mostram que cassação raramente é automática —
 * litígio ativo pode reduzir o risco daquela rodada específica, mesmo sem
 * eliminar o risco jurídico de base. Disponível só quando o risco já cruzou
 * LIMIAR_RISCO_CASSACAO; custa caixa (ou vira dívida, como qualquer gasto).
 */
export const CUSTO_RECURSO_JURIDICO_MI = 8;
/** Quanto o recurso multiplica a chance de cassação da rodada (reduz, não zera). */
export const FATOR_REDUCAO_CASSACAO_COM_RECURSO = 0.5;

// ---------------------------------------------------------------------------
// Falência de campanha (dívida descontrolada também encerra a campanha antes do fim)
// ---------------------------------------------------------------------------

/**
 * Acima deste patamar de dívida (R$ mi), a campanha passa a correr risco real de
 * ter as contas rejeitadas e ser retirada da disputa — quem investe demais em
 * verba e estoura o caixa também pode perder, não só quem é antiético.
 */
export const LIMIAR_DIVIDA_FALENCIA = 40;
/** Chance de falência por rodada bem no limiar (R$ 40 mi de dívida). */
export const PROB_BASE_FALENCIA = 0.1;
/** Cada R$ 1 mi de dívida acima do limiar soma a essa fração na chance de falência. */
export const FATOR_PROB_FALENCIA_POR_MI = 0.015;
/** Teto de chance de falência numa única rodada, mesmo com dívida enorme. */
export const PROB_MAX_FALENCIA = 0.6;

// ---------------------------------------------------------------------------
// Pressão de tempo (decisões de dilema)
// ---------------------------------------------------------------------------

/** Tempo (em segundos) que o jogador tem para decidir um dilema antes do cronômetro zerar. */
export const TEMPO_LIMITE_DILEMA_SEGUNDOS = 45;

/**
 * Se o tempo esgota sem NENHUMA opção selecionada (não é o caso de já ter
 * escolhido e só não ter clicado em confirmar), a campanha "trava" na hora e
 * isso pesa: além dos efeitos da opção escolhida automaticamente, aplica esta
 * penalidade fixa — quem não decide também corre risco.
 */
export const PENALIDADE_INDECISAO_SENTIMENTO = -4;
export const PENALIDADE_INDECISAO_CREDIBILIDADE = -3;

// ---------------------------------------------------------------------------
// Verba (alocação de recursos por canal, com retornos decrescentes)
// ---------------------------------------------------------------------------

/** efeito(gasto) = PESO_CANAL * sqrt(gasto) * FATOR_ESCALA_VERBA, truncado em TETO_EFEITO_VERBA. */
export const FATOR_ESCALA_VERBA = 0.9;
export const TETO_EFEITO_VERBA = 6;

/** Quanto 1 unidade de "efeito" de cada canal move cada métrica. */
export const PESOS_CANAL: Record<CanalVerba, { intencaoVoto: number; tempoTV: number; sentimento: number; coesao: number; riscoJuridico: number }> = {
  tv: { intencaoVoto: 0.8, tempoTV: 1.0, sentimento: 0.1, coesao: 0, riscoJuridico: 0 },
  digital: { intencaoVoto: 0.6, tempoTV: 0, sentimento: 0.8, coesao: 0, riscoJuridico: 0 },
  comicios: { intencaoVoto: 0.5, tempoTV: 0, sentimento: 0.2, coesao: 0.6, riscoJuridico: 0 },
  pesquisas: { intencaoVoto: 0, tempoTV: 0, sentimento: 0, coesao: 0, riscoJuridico: 0 },
  juridica: { intencaoVoto: 0, tempoTV: 0, sentimento: 0, coesao: 0, riscoJuridico: -1.2 },
};

/** Quais segmentos cada canal favorece mais (multiplicador extra de intenção de voto). */
export const AFINIDADE_SEGMENTO_CANAL: Partial<Record<CanalVerba, Partial<Record<SegmentoId, number>>>> = {
  tv: { classeC: 1.4, nordeste: 1.2 },
  digital: { jovens: 1.6 },
  comicios: { nordeste: 1.2, sul: 1.1 },
};

// ---------------------------------------------------------------------------
// Pesquisas (ruído do painel)
// ---------------------------------------------------------------------------

/** Desvio-padrão do ruído de pesquisa com investimento acumulado = 0. */
export const RUIDO_PESQUISA_BASE = 4.5;
/** Cada R$1mi acumulado em pesquisas reduz o desvio-padrão, até o piso abaixo. */
export const RUIDO_REDUCAO_POR_MI = 0.12;
export const RUIDO_PESQUISA_MINIMO = 0.8;

// ---------------------------------------------------------------------------
// Conselho de marqueteiros
// ---------------------------------------------------------------------------

/** Multiplicador de efeito quando se segue o conselheiro com melhor "fit" para a situação. */
export const BONUS_CONSELHEIRO_BOM_FIT = 1.35;
/** Multiplicador quando se segue o conselheiro com pior fit. */
export const PENALIDADE_CONSELHEIRO_MAU_FIT = 0.65;
/** Quantas vezes um conselheiro pode ser ignorado antes de reagir (sair ou vazar informação). */
export const LIMITE_VEZES_IGNORADO = 3;

// ---------------------------------------------------------------------------
// Risco oculto / consequência atrasada (dilemas antiéticos)
// ---------------------------------------------------------------------------

/** Ganho imediato extra (multiplicador) de uma opção marcada como antiética. */
export const BONUS_IMEDIATO_ANTIETICO = 1.5;
/** Probabilidade-base de estourar, por rodada, de um risco oculto recém-criado. */
export const PROB_BASE_ESTOURO_RISCO = 0.22;
/** A probabilidade sobe por rodada que passa sem estourar (crise "represada"). */
export const INCREMENTO_PROB_POR_RODADA = 0.08;
/** Depois de quantas rodadas sem estourar o risco se dissolve (prescreve). */
export const RODADAS_MAX_RISCO_OCULTO = 3;

// ---------------------------------------------------------------------------
// Adversários (IA simples)
// ---------------------------------------------------------------------------

/**
 * Os 3 adversários também fazem campanha fora de tela (orçamento e esforço que
 * o jogo não simula em detalhe) — cada rodada eles somam esse tanto de intenção
 * de voto, em média, só por continuar na disputa. Sem isso, qualquer alocação
 * de verba do jogador (mesmo distraída) vence quase sempre, porque os 3
 * adversários ficam parados a não ser quando reagem ao tom. Com isso, decisões
 * ruins (ex.: gastar tudo em pesquisas/jurídica, que não movem intenção de
 * voto) deixam o jogador pra trás de verdade.
 */
export const CRESCIMENTO_ORGANICO_ADVERSARIO_MEDIO = 1.0;
/** Desvio-padrão desse ganho por rodada — não é sempre o mesmo número. */
export const CRESCIMENTO_ORGANICO_ADVERSARIO_DESVIO = 0.9;

/** Se o jogador ataca, o adversário atacado ganha isso em intenção de voto do núcleo duro... */
export const CONTRA_ATAQUE_GANHO_NUCLEO = 1.2;
/** ...mas perde isso de sentimento geral (polarização). */
export const CONTRA_ATAQUE_PERDA_SENTIMENTO = 1.5;
/**
 * "Candidato ocioso ganha": estudo publicado (AJPS, meta-análise de 33 estudos)
 * mostra que, numa disputa de 3+ candidatos, quando dois trocam ataques o
 * candidato que fica de fora ganha em média +3,7pp de voto. Todo adversário que
 * NÃO é o jogador nem o alvo do ataque ganha isso quando o jogador ataca —
 * atacar fortalece o líder visado (núcleo duro) E fortalece quem nem entrou na
 * briga, tornando essa escolha de tom mais arriscada do que parece.
 */
export const BONUS_CANDIDATO_OCIOSO_ATAQUE = 0.9;
/** Se o jogador modera/ocupa o centro, adversários ideologicamente distantes radicalizam: */
export const RADICALIZACAO_GANHO_SEGMENTO_AFIM = 1.8;
export const RADICALIZACAO_PERDA_CENTRO = 1.0;

// ---------------------------------------------------------------------------
// Segundo turno
// ---------------------------------------------------------------------------

/** % de votos válidos para vencer já no 1º turno. */
export const LIMIAR_VITORIA_PRIMEIRO_TURNO = 50;
/**
 * Rejeição também pesa no 1º turno: parte de quem "diz" que vota no candidato
 * não aparece na urna quando a rejeição dele é alta (suposição de balanceamento,
 * ver README). votosEfetivos = intençãoVoto * (1 - PESO * rejeição / 100).
 */
export const PESO_REJEICAO_PRIMEIRO_TURNO = 0.3;
/** Quanto uma concessão/promessa no 2º turno custa na nota de governabilidade. */
export const CUSTO_GOVERNABILIDADE_POR_PROMESSA = 6;
/** Quanto apoio negociado no 2º turno transfere de votos do aliado eliminado. */
export const TRANSFERENCIA_VOTO_ALIADO_2T = 0.55;
/**
 * Força do efeito da rejeição no 2º turno (0 = rejeição não importa, 1 = efeito
 * linear total). Quem tem menos rejeição retém proporcionalmente mais do seu
 * total votos num confronto direto — é o caminho de vitória de perfis que não
 * lideram nenhum segmento mas chegam ao 2º turno com rejeição baixa.
 */
export const INTENSIDADE_REJEICAO_SEGUNDO_TURNO = 0.6;

// ---------------------------------------------------------------------------
// Surpresa de última hora (mesmo liderando, o resultado nunca é 100% garantido)
// ---------------------------------------------------------------------------

/**
 * Desvio-padrão (pontos percentuais de voto efetivo) do choque de última hora
 * aplicado a cada candidato na apuração, com investimento acumulado em
 * pesquisas = 0. Modela erro de pesquisa/comportamento de eleitor no dia da
 * eleição: mesmo quem joga bem e lidera com folga pode ser surpreendido — só
 * reduz o risco, nunca zera.
 */
export const SURPRESA_ELEICAO_BASE = 9;
/** Cada R$1mi acumulado em pesquisas reduz esse desvio-padrão, até o piso abaixo. */
export const SURPRESA_ELEICAO_REDUCAO_POR_MI = 0.12;
/** Piso do desvio-padrão da surpresa, mesmo com investimento máximo em pesquisas. */
export const SURPRESA_ELEICAO_MINIMA = 3;

// ---------------------------------------------------------------------------
// Placar final
// ---------------------------------------------------------------------------

export const NOTA_GOVERNABILIDADE_BASE = 70;
export const PESO_COESAO_GOVERNABILIDADE = 0.25;
export const PESO_CREDIBILIDADE_GOVERNABILIDADE = 0.15;

// ---------------------------------------------------------------------------
// Classificação da vitória (ver src/engine/score.ts) — vencer não é só um
// resultado: o "como" também aparece na tela final.
// ---------------------------------------------------------------------------

/** Margem sobre o 2º colocado (pontos percentuais) a partir da qual a vitória é "ampla". */
export const LIMIAR_MARGEM_VITORIA_AMPLA = 15;
/** Margem sobre o 2º colocado abaixo da qual a vitória é "apertada". */
export const LIMIAR_MARGEM_VITORIA_APERTADA = 5;
/** Dívida de campanha (R$ mi) a partir da qual a vitória já nasce endividada (abaixo do limiar de falência, que encerraria a campanha antes). */
export const LIMIAR_DIVIDA_VITORIA_PROBLEMATICA = 18;
/** Nota de governabilidade abaixo da qual a vitória é vista como contestada/fragilizada. */
export const LIMIAR_GOVERNABILIDADE_VITORIA_CONTESTADA = 50;
/** Rejeição final do vencedor acima da qual a oposição não reconhece o resultado como legítimo. */
export const LIMIAR_REJEICAO_VITORIA_CONTESTADA = 55;
