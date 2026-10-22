import type { Dilema } from "../engine/types";

/**
 * Os 15 eventos/dilemas do jogo (mínimo de 8 exigido pela spec, com 5 éticos de
 * consequência atrasada — mínimo de 3). Distribuídos pelas 9 fases da campanha,
 * incluindo os de categoria "alianca" (Convenção) e "grupo_focal" (Meio de
 * campanha) que dão a essas fases uma cara própria, além dos de "indecisos".
 *
 * Os números de `efeitos` e `efeitosPorSegmento` são a suposição inicial de
 * balanceamento (ver README). `efeitos` já passa pelo multiplicador do
 * conselheiro seguido; `efeitosPorSegmento` também, mas numa escala menor.
 *
 * `reacao`: prévia (manchete/post/fala de eleitor-persona) mostrada assim que o
 * jogador seleciona a opção, antes de confirmar — não afeta o estado do jogo,
 * é só feedback narrativo imediato.
 */
export const DILEMAS: Dilema[] = [
  {
    id: "video-2015",
    fase: "campanha_oficial",
    titulo: "Um vídeo de 2015 com uma fala polêmica do candidato viraliza",
    descricao:
      "Nas últimas 24 horas, um vídeo antigo do candidato voltou a circular com uma fala que pode ser interpretada de formas diferentes. A imprensa já pede posicionamento.",
    categoria: "crise_desinformacao",
    opcoes: [
      {
        id: "A",
        texto: "Pedir desculpas no horário eleitoral",
        efeitos: { rejeicao: -3, sentimento: 3 },
        efeitosPorSegmento: { jovens: 3, mulheres: 2, evangelicos: -1 },
        reacao: 'Manchete: "Candidato pede desculpas ao vivo; redes se dividem entre perdão e deboche."',
      },
      {
        id: "B",
        texto: "Contextualizar o momento em que a fala ocorreu",
        efeitos: { sentimento: 1, rejeicao: -1 },
        reacao: 'Comentarista no telejornal: "A explicação foi técnica demais — ninguém parece convencido nem revoltado."',
      },
      {
        id: "C",
        texto: "Dobrar a aposta e reafirmar a fala",
        efeitos: { rejeicao: 5, sentimento: -3 },
        efeitosPorSegmento: { jovens: -4, evangelicos: 3, sul: 2 },
        reacao: 'Post viral: "Finalmente alguém que não se curva à cultura do cancelamento!" — os comentários disparam, dos dois lados.',
      },
      {
        id: "D",
        texto: "Ignorar e mudar de pauta",
        efeitos: { sentimento: -1, rejeicao: 1 },
        reacao: 'Jornal: "Candidato evita o assunto pela terceira vez em entrevista."',
      },
      {
        id: "E",
        texto: "Pagar perícia técnica no vídeo",
        oculta: true,
        liberadaPorConselheiroId: "sonia",
        efeitos: { sentimento: 6, rejeicao: -5, riscoJuridico: -5, caixaMi: -3 },
        reacao: "Nota da assessoria: perícia aponta inconsistências no vídeo — a equipe jurídica já prepara o direito de resposta.",
      },
    ],
    opinioes: [
      {
        conselheiroId: "neusa",
        recomendaOpcaoId: "A",
        fala: "Peça desculpas no horário eleitoral, olhando para a câmera. O eleitor perdoa quem assume o erro.",
      },
      {
        conselheiroId: "caio",
        recomendaOpcaoId: "D",
        fala: "Não pede desculpa. Vira meme e muda a pauta em 24 horas, tenho três influenciadores prontos.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "E",
        fala: "Antes de responder, vamos periciar o vídeo. Se for montagem, pedimos direito de resposta no TSE.",
      },
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "D",
        fala: "Os aliados querem silêncio. Qualquer resposta reabre o assunto.",
      },
    ],
  },
  {
    id: "tom-pre-campanha",
    fase: "pre_campanha",
    titulo: "Identidade como bandeira ou foco em economia?",
    descricao:
      "A equipe precisa decidir o eixo central do discurso de pré-campanha: fazer da identidade do candidato uma bandeira política ou concentrar a comunicação em economia e gestão.",
    categoria: "padrao",
    opcoes: [
      {
        id: "A",
        texto: "Fazer da identidade uma bandeira",
        efeitos: { coesao: 3, sentimento: 2, rejeicao: 3 },
        efeitosPorSegmento: { jovens: 4, mulheres: 3, evangelicos: -3 },
        reacao: "Vira trending topic — mas também aparecem os primeiros memes hostis.",
      },
      {
        id: "B",
        texto: "Focar o discurso em economia e gestão",
        efeitos: { credibilidade: 3, sentimento: 1, rejeicao: -1 },
        efeitosPorSegmento: { classeC: 3, sul: 2, jovens: -1 },
        reacao: 'Editorial econômico: "Finalmente um discurso que fala de números, não de bandeiras."',
      },
      {
        id: "C",
        texto: "Equilibrar os dois temas sem se comprometer fortemente com nenhum",
        efeitos: { credibilidade: 1, rejeicao: -2 },
        efeitosPorSegmento: { jovens: 1, mulheres: 1, classeC: 1, sul: 1 },
        reacao: 'Analista político: "Um discurso seguro, mas que não empolga nenhum lado."',
      },
    ],
    opinioes: [
      {
        conselheiroId: "neusa",
        recomendaOpcaoId: "B",
        fala: "Fala de identidade assusta o eleitor mais velho. Fale de gestão e emprego.",
      },
      {
        conselheiroId: "caio",
        recomendaOpcaoId: "A",
        fala: "Identidade é o que viraliza. Bandeira forte gera engajamento e doação via Pix.",
      },
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "C",
        fala: "O partido não quer bandeira que assuste os aliados. Equilibra os dois discursos.",
      },
    ],
  },
  {
    id: "disparo-whatsapp",
    fase: "campanha_oficial",
    titulo: "Disparo em massa no WhatsApp, fora das regras do TSE",
    descricao:
      "Um apoiador oferece uma base de milhões de contatos para disparo em massa de mensagens, sem o rótulo exigido pela legislação eleitoral.",
    categoria: "etico",
    opcoes: [
      {
        id: "A",
        texto: "Aceitar o disparo em massa",
        antietica: true,
        efeitos: { intencaoVoto: 4, sentimento: 2 },
        efeitosPorSegmento: { classeC: 3 },
        reacao: "A mensagem já circula entre avós e tios nos grupos de família — e também já tem gente denunciando ao TSE.",
      },
      {
        id: "B",
        texto: "Recusar e usar só os canais oficiais",
        efeitos: { riscoJuridico: -2, credibilidade: 2, sentimento: 1 },
        reacao: 'Nota oficial: "Campanha reafirma compromisso só com canais declarados" — pouco alcance, zero risco.',
      },
    ],
    opinioes: [
      {
        conselheiroId: "neusa",
        recomendaOpcaoId: "A",
        fala: "O zap chega em quem a gente mais precisa: o eleitor mais velho. Todo mundo faz isso.",
      },
      {
        conselheiroId: "caio",
        recomendaOpcaoId: "A",
        fala: "Topamos a área cinzenta, o retorno é imediato e ninguém nunca foi punido por isso.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "B",
        fala: "Isso é ilegal e rastreável. Se vazar, é multa, perda de tempo de TV e pode render até cassação.",
      },
    ],
  },
  {
    id: "escandalo-aliado",
    fase: "convencao",
    titulo: "Um aliado importante da coligação é flagrado em um escândalo de corrupção",
    descricao:
      "Horas antes da convenção, um dos principais aliados da coligação é alvo de uma operação por desvio de recursos públicos.",
    categoria: "padrao",
    opcoes: [
      {
        id: "A",
        texto: "Romper publicamente com o aliado",
        efeitos: { credibilidade: 4, coesao: -5, sentimento: 1 },
        reacao: "O vídeo do rompimento viraliza — aliados históricos ligam furiosos para a coordenação da campanha.",
      },
      {
        id: "B",
        texto: "Apoiar discretamente, sem romper em público",
        efeitos: { coesao: 2, credibilidade: -4, riscoJuridico: 2 },
        reacao: 'Um jornalista pergunta em entrevista: "Por que o silêncio?" — a pergunta ecoa nas redes o dia todo.',
      },
      {
        id: "C",
        texto: "Pedir investigação interna antes de decidir",
        efeitos: { credibilidade: 1, coesao: -1, rejeicao: -1 },
        reacao: 'A nota cautelosa é recebida com ceticismo: "Isso é só para ganhar tempo", diz um comentarista.',
      },
    ],
    opinioes: [
      {
        conselheiroId: "caio",
        recomendaOpcaoId: "A",
        fala: "Romper já e gravar um vídeo. Isso viraliza bem e limpa a nossa imagem nas redes.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "C",
        fala: "Apure antes de agir. Romper sem prova também pode virar processo.",
      },
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "B",
        fala: "Esse aliado controla votos em três estados. Não dá para romper agora.",
      },
    ],
  },
  {
    id: "coligacao-rachada",
    fase: "campanha_intermediaria",
    titulo: "Um partido aliado ameaça deixar a coligação no meio da campanha",
    descricao:
      "A sigla reclama de pouco tempo de TV e pouca influência nas decisões da campanha, e ameaça publicamente romper se não ganhar mais espaço.",
    categoria: "negociacao",
    opcoes: [
      {
        id: "A",
        texto: "Ceder mais tempo de TV e um espaço na chapa",
        efeitos: { coesao: 5, tempoTV: -2 },
        reacao: "O acordo é fechado em reunião fechada — mas o tempo de TV cedido não passa despercebido pela imprensa.",
      },
      {
        id: "B",
        texto: "Negar o pedido e arriscar o rompimento",
        efeitos: { coesao: -6, credibilidade: 2 },
        reacao: "A sigla rompe publicamente — um editorial elogia a postura firme, mas as bases locais ficam feridas.",
      },
      {
        id: "C",
        texto: "Buscar meio-termo com apoio financeiro em vez de tempo de TV",
        efeitos: { coesao: 2, caixaMi: -8 },
        reacao: "O acordo financeiro resolve por ora, mas drena parte do caixa que sobraria para a reta final.",
      },
    ],
    opinioes: [
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "A",
        fala: "Sem essa sigla, perdemos prefeitos decisivos em três cidades. Cede o espaço.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "C",
        fala: "Compromisso de tempo de TV é documento público e difícil de desfazer. Resolve com dinheiro, não com palco.",
      },
      {
        conselheiroId: "neusa",
        recomendaOpcaoId: "B",
        fala: "Ceder agora é abrir precedente. Os outros aliados também vão querer mais.",
      },
    ],
  },
  {
    id: "tragedia-nacional",
    fase: "campanha_intermediaria",
    titulo: "Uma tragédia de grandes proporções atinge o país",
    descricao: "Aparecer no local é solidariedade ou oportunismo? A equipe precisa decidir rápido.",
    categoria: "padrao",
    opcoes: [
      {
        id: "A",
        texto: "Viajar até o local e aparecer pessoalmente",
        efeitos: { sentimento: 4, rejeicao: -2, credibilidade: 1 },
        reacao: "A imagem do candidato no local domina os telejornais — alguns elogiam, outros acusam de aparecer para a foto.",
      },
      {
        id: "B",
        texto: "Suspender a agenda de campanha em respeito às vítimas",
        efeitos: { sentimento: 2, credibilidade: 2 },
        reacao: "A nota de pesar é bem recebida, mas a campanha perde um dia inteiro de exposição.",
      },
      {
        id: "C",
        texto: "Mandar nota oficial e manter a agenda normal",
        efeitos: { sentimento: -2, rejeicao: 2 },
        reacao: 'Um comentarista observa: "Parecer indiferente numa hora dessas pode custar caro."',
      },
    ],
    opinioes: [
      {
        conselheiroId: "neusa",
        recomendaOpcaoId: "A",
        fala: "Presença física emociona o eleitor mais tradicional. Precisa aparecer na TV lá do local.",
      },
      {
        conselheiroId: "caio",
        recomendaOpcaoId: "B",
        fala: "Qualquer aparição nesse momento pode virar meme negativo. Melhor recuo nas redes.",
      },
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "C",
        fala: "Os aliados já têm compromissos marcados essa semana. Suspender agenda custa caro.",
      },
    ],
  },
  {
    id: "influenciador-problematico",
    fase: "pre_campanha",
    titulo: "Um influenciador com milhões de seguidores oferece apoio público",
    descricao:
      "O apoio dele garantiria alcance enorme, mas ele tem histórico recente de discurso de ódio contra minorias.",
    categoria: "etico",
    opcoes: [
      {
        id: "A",
        texto: "Aceitar o apoio e divulgar amplamente a parceria",
        antietica: true,
        efeitos: { intencaoVoto: 5, sentimento: 3 },
        efeitosPorSegmento: { jovens: 4 },
        reacao: "A publicação com o influenciador bate recorde de visualizações — e também de denúncias.",
      },
      {
        id: "B",
        texto: "Recusar publicamente o apoio",
        efeitos: { credibilidade: 3, rejeicao: -1, intencaoVoto: -1 },
        reacao: "O post do influenciador rebatendo a recusa viraliza entre a base dele, mas fora dali a recusa é elogiada.",
      },
    ],
    opinioes: [
      {
        conselheiroId: "caio",
        recomendaOpcaoId: "A",
        fala: "O alcance dele é gigante. Vale o risco, a gente administra a repercussão depois.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "B",
        fala: "Essa associação vira munição contra nós até o fim da campanha. Recusa.",
      },
      {
        conselheiroId: "neusa",
        recomendaOpcaoId: "B",
        fala: "O eleitor mais tradicional não perdoa esse tipo de aliança.",
      },
    ],
  },
  {
    id: "pesquisa-vaza",
    fase: "debates",
    titulo: "Uma pesquisa interna desastrosa vaza para a imprensa na véspera do debate",
    descricao: "Os números internos, bem piores que os divulgados, caem na mão de um jornalista horas antes do debate.",
    categoria: "padrao",
    opcoes: [
      {
        id: "A",
        texto: "Negar a validade da pesquisa",
        efeitos: { credibilidade: -2, sentimento: -1 },
        reacao: "Agências de checagem já estão apurando a negativa — a credibilidade da resposta é posta em xeque.",
      },
      {
        id: "B",
        texto: "Confirmar e explicar a metodologia",
        efeitos: { credibilidade: 3, sentimento: 1 },
        reacao: 'Matéria no jornal: "Transparência rara numa campanha" — poucos leem até o fim, mas o tom é elogioso.',
      },
      {
        id: "C",
        texto: "Atacar quem vazou e investigar a própria equipe",
        efeitos: { coesao: -3, riscoJuridico: 1 },
        reacao: "Dentro da própria equipe, o clima esfria — ninguém sabe em quem confiar agora.",
      },
    ],
    opinioes: [
      {
        conselheiroId: "neusa",
        recomendaOpcaoId: "A",
        fala: "Pesquisa não é urna. Nega e segue o jogo, o eleitor esquece rápido.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "B",
        fala: "Transparência aqui reduz risco de imagem e jurídico. Explica a metodologia.",
      },
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "C",
        fala: "Vazamento interno é traição. Isso precisa de resposta dura para não se repetir.",
      },
    ],
  },
  {
    id: "caixa-dois",
    fase: "campanha_oficial",
    titulo: "Um doador oferece recursos por fora da contabilidade oficial",
    descricao: "O valor resolveria o caixa da reta final, mas não pode ser declarado à Justiça Eleitoral.",
    categoria: "etico",
    opcoes: [
      {
        id: "A",
        texto: "Aceitar o recurso por fora (caixa 2)",
        antietica: true,
        efeitos: { caixaMi: 15, intencaoVoto: 1 },
        reacao: "O caixa da campanha respira — mas um operador financeiro já comenta o acordo fora do protocolo combinado.",
      },
      {
        id: "B",
        texto: "Recusar e manter só doações declaradas",
        efeitos: { credibilidade: 2, riscoJuridico: -1 },
        reacao: "Nenhuma manchete, nenhum problema — a campanha segue apertada, mas limpa.",
      },
    ],
    opinioes: [
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "A",
        fala: "Sem esse caixa, não sobrevivemos até o 2º turno. O partido precisa disso.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "B",
        fala: "Isso é crime eleitoral. O risco de cassação não vale o dinheiro.",
      },
      {
        conselheiroId: "caio",
        recomendaOpcaoId: "B",
        fala: "Gasto não declarado sempre deixa rastro digital. Alguém vaza.",
      },
    ],
  },
  {
    id: "ia-deepfake",
    fase: "debates",
    titulo: "A equipe sugere um vídeo de IA do adversário, sem rótulo, para o debate",
    descricao: "O conteúdo sintético é convincente, mas usá-lo sem identificação viola as regras do TSE para 2026.",
    categoria: "etico",
    opcoes: [
      {
        id: "A",
        texto: "Usar o conteúdo de IA sem rótulo",
        antietica: true,
        // Pesquisa real: deepfakes têm efeito eleitoral mensurável baixo (reforçam
        // quem já concordava, não convertem) e são mais fáceis de desmascarar
        // tecnicamente — ganho imediato menor que o padrão antiético, risco de
        // estourar maior.
        ganhoImediatoAntieticoOverride: 1.15,
        probabilidadeEstouroOverride: 0.35,
        efeitos: { intencaoVoto: 3, sentimento: 2 },
        reacao: "O clipe viraliza em minutos — e também surgem os primeiros pedidos de perícia técnica ao TSE.",
      },
      {
        id: "B",
        texto: "Usar o conteúdo, mas com rótulo claro de conteúdo sintético",
        efeitos: { intencaoVoto: 1, credibilidade: 1 },
        reacao: "O conteúdo circula, mas o rótulo tira parte do impacto — ainda assim, ninguém processa a campanha.",
      },
      {
        id: "C",
        texto: "Não usar esse tipo de conteúdo",
        efeitos: { credibilidade: 3, riscoJuridico: -1 },
        reacao: "Nada acontece — e é exatamente esse o ponto.",
      },
    ],
    opinioes: [
      {
        conselheiroId: "caio",
        recomendaOpcaoId: "A",
        fala: "Ninguém vai checar rótulo no calor do debate. O que importa é a repercussão.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "C",
        fala: "Deepfake sem rótulo é cassação praticamente garantida se for rastreado até nós.",
      },
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "B",
        fala: "O rótulo nos protege juridicamente e ainda ataca o adversário.",
      },
    ],
  },
  {
    id: "prometer-inviavel",
    fase: "campanha_intermediaria",
    titulo: "Lideranças regionais pedem cargos e verbas que o orçamento não cobre",
    descricao: "Em troca de apoio decisivo em três estados, as lideranças exigem compromissos de cargos específicos no governo.",
    categoria: "negociacao",
    opcoes: [
      {
        id: "A",
        texto: "Prometer os cargos e verbas pedidos",
        antietica: true,
        efeitos: { coesao: 6, intencaoVoto: 2 },
        gerarPromessa: {
          descricao: "Cargos e verbas prometidos a lideranças regionais além do orçamento previsto",
          custoGovernabilidade: 8,
        },
        reacao: "Lideranças regionais fecham a aliança sorridentes — e já fazem a lista de nomes para os cargos.",
      },
      {
        id: "B",
        texto: "Negociar apoio sem prometer cargos específicos",
        efeitos: { coesao: 1, credibilidade: 2 },
        reacao: "A reunião termina sem acordo fechado — mas também sem compromissos impossíveis de cumprir.",
      },
    ],
    opinioes: [
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "A",
        fala: "Sem isso, perdemos o apoio regional decisivo para o 2º turno.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "B",
        fala: "Prometer cargo que não se pode cumprir é passivo jurídico e político depois da posse.",
      },
      {
        conselheiroId: "neusa",
        recomendaOpcaoId: "B",
        fala: "O que se promete agora, cobram no primeiro dia de governo.",
      },
    ],
  },
  {
    id: "indecisos-mobilizacao",
    fase: "reta_final",
    titulo: "Como converter quem ainda está indeciso, vota branco ou nulo?",
    descricao:
      "Faltam poucos dias para a votação e uma fatia relevante do eleitorado ainda não decidiu — ou decidiu não decidir.",
    categoria: "indecisos",
    opcoes: [
      {
        id: "A",
        texto: "Investir pesado em mobilização de voto útil",
        capturaIndecisos: true,
        efeitos: { intencaoVoto: 5, caixaMi: -12 },
        efeitosPorSegmento: { jovens: 2 },
        reacao: 'A campanha inunda redes e ruas com o apelo ao "voto que decide" — parte dos indecisos responde, outra parte reclama da pressão.',
      },
      {
        id: "B",
        texto: "Ignorar os indecisos e blindar a base",
        efeitos: { coesao: 4, rejeicao: -1 },
        reacao: "A militância se sente priorizada e se mobiliza ainda mais — mas o pool de indecisos segue intocado.",
      },
      {
        id: "C",
        texto: "Fazer um apelo emocional direto ao voto de protesto",
        capturaIndecisos: true,
        efeitos: { intencaoVoto: 2, rejeicao: 2 },
        reacao: "O apelo emociona parte do público, mas outra parte acha oportunista — a repercussão fica dividida.",
      },
    ],
    opinioes: [
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "A",
        fala: "Esse eleitor decide a eleição. Vale todo o esforço que sobrar de caixa.",
      },
      {
        conselheiroId: "caio",
        recomendaOpcaoId: "C",
        fala: "Um vídeo emocional bem feito viraliza igual bomba. Vamos no sentimento.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "B",
        fala: "Mexer com quem ainda não decidiu é imprevisível. Foca em quem já é nosso.",
      },
    ],
  },
  {
    id: "indecisos-debate-abstencao",
    fase: "reta_final",
    titulo: "Um movimento pelo voto nulo organizado ganha força nas redes",
    descricao: "Páginas e perfis grandes defendem abertamente não votar em nenhum dos candidatos como forma de protesto.",
    categoria: "indecisos",
    opcoes: [
      {
        id: "A",
        texto: "Debater publicamente por que o voto importa",
        efeitos: { credibilidade: 2, sentimento: 1 },
        reacao: "O discurso é respeitado, mas soa professoral demais para quem já decidiu não votar.",
      },
      {
        id: "B",
        texto: "Ignorar o movimento e deixar o campo livre",
        efeitos: {},
        reacao: "Sem resposta da campanha, o movimento cresce sem contestação — e o pool de indecisos não diminui.",
      },
      {
        id: "C",
        texto: "Pagar uma campanha digital direcionada pró-voto-útil para esse público",
        capturaIndecisos: true,
        efeitos: { caixaMi: -6, intencaoVoto: 3 },
        reacao: "Anúncios segmentados aparecem exatamente no feed de quem cogitava votar nulo — a conversão é real, mas pequena.",
      },
    ],
    opinioes: [
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "C",
        fala: "Isso é guerra de atenção. Compra o espaço e fala direto com esse público.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "A",
        fala: "Debater com respeito é mais seguro do que tentar comprar atenção de quem já decidiu não escolher.",
      },
      {
        conselheiroId: "neusa",
        recomendaOpcaoId: "B",
        fala: "Dar atenção a esse movimento só dá mais palco pra ele. Deixa morrer sozinho.",
      },
    ],
  },
  {
    id: "alianca-politica",
    fase: "convencao",
    titulo: "Com qual bloco fechar aliança para a convenção?",
    descricao:
      "Três grupos oferecem apoio formal em troca de espaço na campanha. A escolha define boa parte da base organizada até a eleição.",
    categoria: "alianca",
    opcoes: [
      {
        id: "A",
        texto: "Fechar com o bloco sindical e popular",
        efeitos: { coesao: 5, credibilidade: -2 },
        efeitosPorSegmento: { classeC: 4, nordeste: 3 },
        gerarPromessa: {
          descricao: "Cargos prometidos ao bloco sindical e popular na composição de governo",
          custoGovernabilidade: 6,
        },
        reacao: "O acordo é fechado em grande ato público — a militância sindical se mobiliza, mas a imprensa econômica já questiona o custo político.",
      },
      {
        id: "B",
        texto: "Fechar com o bloco empresarial e do agronegócio",
        efeitos: { caixaMi: 10, sentimento: -1 },
        efeitosPorSegmento: { sul: 4, classeC: -1 },
        reacao: "O caixa da campanha recebe um reforço considerável — mas nas redes, parte da militância histórica reclama da aproximação.",
      },
      {
        id: "C",
        texto: "Fechar com lideranças religiosas conservadoras",
        efeitos: { tempoTV: 3 },
        efeitosPorSegmento: { evangelicos: 5, jovens: -2 },
        reacao: "A aliança garante bom espaço em emissoras regionais — e também as primeiras críticas de setores progressistas da base.",
      },
      {
        id: "D",
        texto: "Manter independência, sem fechar aliança agora",
        efeitos: { credibilidade: 2, coesao: -2 },
        reacao: "A postura é elogiada como coerente por analistas — mas, sem aliados fortes, a estrutura de campanha nas ruas fica mais magra.",
      },
    ],
    opinioes: [
      {
        conselheiroId: "beto",
        recomendaOpcaoId: "A",
        fala: "O bloco sindical entrega estrutura em todo o país. É a aliança mais sólida que podemos fechar agora.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "D",
        fala: "Toda aliança formal nessa altura vira munição depois. Eu seguraria qualquer compromisso por enquanto.",
      },
      {
        conselheiroId: "caio",
        recomendaOpcaoId: "C",
        fala: "O alcance das lideranças religiosas em certas regiões é gigante. Isso muda o jogo digital também.",
      },
    ],
  },
  {
    id: "grupo-focal-reacao",
    fase: "campanha_intermediaria",
    titulo: "O grupo focal contratado traz reações duras sobre a campanha até aqui",
    descricao:
      "Falas de eleitores-persona reunidas num grupo focal mostram uma percepção dividida: parte vê o candidato como autêntico, parte como distante. Como a campanha reage a esse retrato?",
    categoria: "grupo_focal",
    opcoes: [
      {
        id: "A",
        texto: "Mudar o tom da comunicação para ser mais direta e simples",
        efeitos: { sentimento: 3, credibilidade: 1 },
        reacao: "A comunicação fica mais informal nos próximos dias — o grupo focal seguinte já reage melhor, mas parte da equipe acha a mudança arriscada perto da reta final.",
      },
      {
        id: "B",
        texto: "Ignorar o grupo focal — é uma amostra pequena demais",
        efeitos: { credibilidade: -1 },
        reacao: "A equipe segue com a estratégia atual — alguns assessores insistem que uma leitura isolada não deveria mudar o rumo da campanha.",
      },
      {
        id: "C",
        texto: "Investir em pesquisa qualitativa maior antes de decidir qualquer mudança",
        efeitos: { caixaMi: -5, credibilidade: 2 },
        reacao: "Os dados chegam mais sólidos alguns dias depois — a decisão fica mais segura, mas o tempo e o dinheiro gastos pesam no fim do mês.",
      },
    ],
    opinioes: [
      {
        conselheiroId: "caio",
        recomendaOpcaoId: "A",
        fala: "Grupo focal pequeno já antecipa tendência digital. Ajusta o tom agora, antes que vire bola de neve nas redes.",
      },
      {
        conselheiroId: "neusa",
        recomendaOpcaoId: "C",
        fala: "Uma leitura qualitativa maior evita decisão precipitada. Isso aqui pode ser ruído, não sinal.",
      },
      {
        conselheiroId: "sonia",
        recomendaOpcaoId: "B",
        fala: "Mudar de estratégia no meio da campanha por uma amostra pequena é mais risco do que ganho.",
      },
    ],
  },
];
