# Simulador de Campanha Presidencial — Especificação para construção

Documento de entrada para o Claude Code. A primeira parte diz o que construir; a segunda traz o design do jogo; a terceira traz os dados iniciais em JSON.

---

## Parte 1 — Instruções para o Claude Code

### Objetivo
Construir um protótipo jogável de um simulador de tomada de decisão no estilo dos simuladores de Harvard (como o Benihana). O jogador é o marqueteiro de um candidato à Presidência. O perfil escolhido no início muda o terreno de todas as decisões.

O jogo se passa em **Bansh**, um país fictício. O nome vem das iniciais de quem criou o jogo: Beatriz, Ana Helena, Natally, Sarah e Henrique.

### Identidade visual
Siga o guia de marca de Bansh. O essencial:

- **Bandeira:** campo azul `#1D3A64`, faixa horizontal dourada `#E2BE74` no centro e um disco marfim `#F6F1E6` com uma estrela azul de cinco pontas. Proporção 3:2.
- **A estrela azul é a assinatura.** Usos: selo no cabeçalho, marcador das 6 rodadas (concluída = estrela azul cheia; atual = estrela azul sobre disco dourado; futura = contorno cinza), histórico de acertos dos conselheiros (1 a 5 estrelas) e opção selecionada. Sempre azul, nunca dourada ou girada.
- **Cores (tokens):** `azul-federacao #1D3A64`, `azul-noite #142B4B` (hover), `azul-claro #DCE4EF`, `ouro-faixa #E2BE74` (seleção e rodada atual, nunca texto), `ouro-texto #7E5B1C`, `marfim #F6F1E6` (fundo da página), `cartao #FFFDF8`, `ink #15233A` (texto), `ink-suave #4A5872`, `linha #D9D1C0`, `linha-forte #8C8472`, `positivo #2F6E5E`, `negativo #A8462F`.
- **Cores dos candidatos (só em dados, sempre com o nome ao lado):** Rafael `#BF7B2C`, Luana `#4A7CC2`, Helena `#6E4E99`, Augusto `#2F3A45`.
- **Neutralidade:** sem vermelho como destaque e sem a combinação verde-amarelo.
- **Tipografia (Google Fonts):** Archivo para títulos, Public Sans para texto, IBM Plex Mono para todos os números do painel.
- **Layout da tela de rodada:** cabeçalho azul com selo, nome e marcador de rodadas; faixa dourada de 8px logo abaixo; grade de 12 colunas, até 1280px, com a decisão em 8 colunas e o painel de métricas em 4 (360px). No celular, o painel desce para baixo da decisão.
- **Componentes:** `MarcadorRodada`, `CartaoMetrica` (valor em mono, variação com seta e sinal, margem de erro), `CartaoConselheiro` (estrelas, fala, recomendação, botão "Seguir este conselho") e `BotaoDecisao` (primário azul, secundário com borda, opção que fica dourada quando selecionada).
- **Acessibilidade:** texto com contraste de pelo menos 4,5:1, foco com anel azul de 2px, e nada depende só de cor.

### Stack sugerida (pode ser ajustada)
- Web app que roda no navegador, sem backend: React + TypeScript + Vite.
- Estado da partida salvo em `localStorage`, para poder pausar e retomar.
- Interface em português do Brasil.
- Gráficos simples (barras e pontos) com uma biblioteca leve, como Recharts.

### Arquitetura
- **Conteúdo separado da lógica.** Candidatos, métricas, segmentos, conselheiros, eventos e dilemas ficam em arquivos de dados (JSON ou TS) em `src/data/`, para a equipe editar sem mexer no código.
- **Pesos e fórmulas em um arquivo de configuração** (`src/config/balance.ts`). Todo número que afeta o resultado deve estar lá, nunca espalhado no código.
- **Motor do jogo puro e testável** (`src/engine/`): recebe estado + decisão e devolve o novo estado. Sem dependência da interface.
- **Aleatoriedade com semente** (seed), para a mesma partida poder ser repetida no debrief.

### Escopo do MVP
1. **Tela inicial:** escolha de um dos 4 candidatos, com ficha completa e métricas iniciais. Os outros 3 viram adversários.
2. **6 rodadas**, uma por fase: Pré-campanha, Convenção, Campanha oficial, Debates, 1º turno, 2º turno (o 2º turno só acontece se ninguém passar de 50% dos votos válidos).
3. **Em cada rodada:**
   - Alocação de verba entre canais (TV, digital, comícios e carreatas, pesquisas, equipe jurídica), com retornos decrescentes.
   - 1 ou 2 dilemas. Antes de cada dilema, 2 ou 3 conselheiros dão opiniões que se contradizem.
   - Painel atualizado com todas as métricas, incluindo intenção de voto por segmento.
4. **Adversários simples:** cada um reage às jogadas (se o jogador ataca, ele contra-ataca; se o jogador ocupa o centro, ele radicaliza).
5. **Pesquisas com margem de erro:** o painel mostra números com ruído; pagar por pesquisa melhor reduz o ruído.
6. **Consequências atrasadas:** escolhas antiéticas dão ganho imediato e geram uma probabilidade oculta de estourar em rodadas futuras.
7. **Tela final:** resultado da eleição + placar em várias dimensões (votos, dívida de campanha, promessas feitas, cargos prometidos, nota de governabilidade) + linha do tempo das decisões e de quais conselheiros o jogador seguiu.
8. **Replay:** botão para jogar de novo com outro perfil e mesma semente, e comparar resultados lado a lado.

### Conteúdo mínimo do MVP
- Os 4 candidatos e os 4 conselheiros da Parte 3.
- Pelo menos 8 eventos ou dilemas, incluindo o exemplo do vídeo de 2015 (Parte 3) e pelo menos 3 dilemas éticos com consequência atrasada.

### O que ainda não está definido
As fórmulas de efeito, a lista completa de eventos e as regras de 2º turno ainda não existem. Proponha valores iniciais simples, deixe todos em `balance.ts`, e liste as suposições no README. Antes de escrever muitos eventos, mostre 2 ou 3 de exemplo para validação.

### Critérios de aceite
- Dá para jogar uma partida completa, do perfil à tela final, sem erros.
- Os 4 perfis têm caminho de vitória viável: rode uma simulação automática (ex.: 1.000 partidas com decisões aleatórias por perfil) e mostre a taxa de vitória de cada um. Nenhum perfil deve ficar muito acima ou abaixo dos outros.
- Mudar um peso em `balance.ts` muda o resultado sem precisar mexer em outro arquivo.
- O motor tem testes automatizados.

### Cuidados obrigatórios
- Todos os candidatos, partidos e conselheiros são fictícios. Não usar nomes de políticos ou partidos reais.
- Os efeitos de identidade descrevem como o eleitorado e a mídia reagem, nunca a competência do candidato.
- Os lados progressista e conservador precisam ter a mesma profundidade de conteúdo e a mesma chance de vitória.

---

## Parte 2 — Design do jogo

### Estrutura: rodadas = fases da campanha
Cada rodada do jogo é uma fase da campanha:

Pré-campanha → Convenção → Campanha oficial → Debates → 1º turno → 2º turno

Em cada rodada, o jogador repete o mesmo ciclo:

1. **Distribuir recursos** (TV, digital, comícios)
2. **Enfrentar dilemas** (1 ou 2, ouvindo o conselho)
3. **Ler o painel** (métricas atualizadas)
4. **Ajustar a estratégia** (antes da próxima fase)

### Criação do candidato
Cada atributo define as condições iniciais: intenção de voto por segmento, rejeição, espaço na mídia, acesso a doadores e quais ataques são mais prováveis.

- **Gênero e identidade:** mulher/homem, cis/trans
- **Ideologia em dois eixos:** economia (Estado ↔ mercado) e costumes (progressista ↔ conservador)
- **Raça, idade, região de origem, religião**
- **Trajetória:** outsider, político de carreira, ex-ministro, empresário, celebridade
- **Partido:** grande (mais fundo eleitoral e tempo de TV, menos autonomia) ou pequeno (pouco dinheiro, mais liberdade, precisa viralizar)
- **"Esqueleto no armário":** um ponto fraco do passado que volta como crise mais tarde

**Princípio-chave:** o perfil muda o terreno, não a régua. Todo perfil precisa ter caminhos de vitória viáveis e obstáculos próprios.

### Os quatro candidatos
Os quatro perfis disputam a mesma eleição. Cada um ocupa um quadrante ideológico, e cada lado do eixo de costumes tem uma mulher e um homem:

| | Estado na economia | Mercado na economia |
| --- | --- | --- |
| **Progressista nos costumes** | Luana Prado (mulher trans, deputada federal) | Rafael Tanaka (homem cis, ex-prefeito) |
| **Conservador nos costumes** | Helena Siqueira (mulher cis, ex-governadora) | Augusto Brandão (homem cis, empresário outsider) |

| Aspecto | Luana Prado | Rafael Tanaka | Helena Siqueira | Augusto Brandão |
| --- | --- | --- | --- | --- |
| Gênero e identidade | Mulher trans | Homem cis | Mulher cis | Homem cis |
| Costumes | Progressista | Progressista | Conservadora | Conservador |
| Economia | Estado | Mercado | Estado | Mercado |
| Raça | Negra | Amarela (nipo-brasileiro) | Parda | Branca |
| Idade | 36 | 47 | 57 | 58 |
| Origem | Sudeste | Sul | Nordeste | Centro-Oeste |
| Religião | Sem religião | Católico | Evangélica | Católico |
| Trajetória | Deputada federal mais votada do estado | Ex-prefeito de capital | Ex-governadora | Empresário do agronegócio, outsider |
| Partido | Médio, em federação | Médio | Grande | Pequeno |
| Esqueleto no armário | Posts antigos com ataques pessoais a adversários | Delação cita doação não declarada | Contrato emergencial na saúde sob investigação | Multa ambiental em fazenda da família |
| Seguidores (todas as redes) | 9,8 mi | 1,9 mi | 1,1 mi | 7,2 mi |
| Engajamento médio | 4,1% | 1,8% | 2,4% | 5,3% |
| Ponto forte | Maior base digital, mobiliza jovens e voluntários | Imagem de gestor moderado, trânsito no centro | Máquina partidária e experiência de gestão | Discurso antissistema e engajamento alto |
| Obstáculo | Principal alvo de desinformação, sem experiência executiva | Pouco conhecido fora do Sul, visto como "morno" | Pouca presença digital, vista como "do sistema" | Sem experiência política, pouco tempo de TV |

### Métricas iniciais
Ninguém começa na frente em tudo. Helena lidera, mas carrega o maior risco jurídico; Rafael tem a menor rejeição, o que lhe dá potencial no 2º turno.

| Métrica | Luana | Rafael | Helena | Augusto |
| --- | --- | --- | --- | --- |
| Intenção de voto (%) | 18 | 11 | 24 | 21 |
| Rejeição (%) | 46 | 22 | 38 | 41 |
| Caixa inicial (R$ mi) | 45 | 55 | 85 | 30 |
| Tempo de TV (% do horário eleitoral) | 22 | 26 | 40 | 12 |
| Sentimento nas redes (0–100) | 52 | 56 | 47 | 54 |
| Coesão de aliados (0–100) | 78 | 70 | 58 | 64 |
| Credibilidade (0–100) | 61 | 66 | 54 | 57 |
| Risco jurídico (0–100) | 12 | 32 | 45 | 36 |

Os 26% restantes de intenção de voto são brancos, nulos e indecisos.

**Intenção de voto inicial por segmento (%):**

| Segmento | Luana | Rafael | Helena | Augusto |
| --- | --- | --- | --- | --- |
| Jovens (16–24 anos) | **31** | 12 | 14 | 22 |
| Mulheres | **25** | 12 | 23 | 17 |
| Evangélicos | 6 | 9 | **34** | 30 |
| Classe C | 17 | 10 | **28** | 19 |
| Nordeste | 19 | 6 | **36** | 10 |
| Sul | 12 | 21 | 15 | **33** |

Helena lidera em três segmentos, Luana em dois e Augusto no Sul. Rafael não lidera nenhum: o caminho dele passa pela baixa rejeição e pelo 2º turno.

### Painel de indicadores
O coração do jogo é o trade-off entre segmentos: quase toda decisão agrada uns e afasta outros.

- Intenção de voto por segmento
- Rejeição (costuma decidir o 2º turno)
- Caixa (fundo eleitoral + doações)
- Tempo de TV e rádio
- Sentimento nas redes, seguidores e engajamento
- Coesão de aliados e partido
- Credibilidade
- Risco jurídico (TSE)

### Tipos de decisão
- **Estratégicas (início):** escolha do vice, alianças, slogan, temas prioritários
- **Verba (toda rodada):** TV, impulsionamento digital, comícios e carreatas, pesquisas, equipe jurídica. Com retornos decrescentes.
- **Tom:** propositivo ou de ataque. Dilema central que muda conforme o perfil: fazer da identidade uma bandeira ou focar em economia?
- **Mídia:** sabatina no telejornal, podcast, debate (preparar, atacar, ignorar o adversário)
- **2º turno:** negociar apoio dos derrotados em troca de concessões; moderar ou manter o discurso

### Crises e eventos
A probabilidade de cada evento varia conforme o candidato escolhido.

- Deepfake ou fake news contra o candidato
- Escândalo de um aliado
- Tragédia nacional: aparecer no local é solidariedade ou oportunismo?
- Um influenciador gigante oferece apoio, mas tem histórico problemático
- Pesquisa desastrosa vaza na véspera do debate

**Exemplo:** na semana 4, um vídeo do candidato de 2015 com uma fala polêmica viraliza. Opções: (A) pedir desculpas, (B) contextualizar, (C) dobrar a aposta, (D) mudar de pauta. O efeito depende do perfil:

- **Base jovem e urbana:** desculpas recuperam votos; dobrar a aposta derruba.
- **Outsider antissistema:** desculpas soam como fraqueza para a base. Dobrar a aposta consolida o núcleo, mas trava o crescimento no centro.
- **Mudar de pauta:** só funciona com caixa para inundar a mídia com outro assunto. Sem isso, a crise dura mais duas rodadas.

### Conselho de marqueteiros
Antes de cada decisão, dois ou três marqueteiros da equipe dão opiniões que se contradizem, e o jogador escolhe quem seguir.

| Marqueteiro | Especialidade | Viés | Acerta mais com |
| --- | --- | --- | --- |
| Neusa Lacerda, a veterana | 30 anos de campanha, TV e jingle | Subestima as redes | Eleitores mais velhos, classe C, candidatos com muito tempo de TV |
| Caio Fontes, o growth | Dados, memes e influenciadores | Topa a área cinzenta das regras do TSE | Jovens, candidatos com muitos seguidores |
| Sônia Arruda, a jurídica | Direito eleitoral e gestão de crise | Trava a campanha por excesso de cautela | Crises com fake news e deepfake |
| Beto Rangel, o coordenador político | Alianças e lideranças regionais | Defende interesses do partido e dos aliados | 2º turno e negociações |

- **A opinião certa depende do perfil:** Caio acerta mais com Luana e Augusto, que têm bases digitais grandes, e erra mais com Helena.
- **Histórico de acertos:** o jogo registra quem acertou em cada rodada, e o jogador consulta esse histórico antes de decidir.
- **Agenda oculta:** às vezes um conselheiro defende um interesse próprio, revelado rodadas depois.
- **Conselheiro ignorado reage:** quem é ignorado várias vezes pode sair da campanha ou vazar informações para a imprensa.

**Exemplo, no caso do vídeo de 2015:**

- **Neusa:** "Peça desculpas no horário eleitoral, olhando para a câmera. O eleitor perdoa quem assume o erro."
- **Caio:** "Não pede desculpa. Vira meme e muda a pauta em 24 horas, tenho três influenciadores prontos."
- **Sônia:** "Antes de responder, vamos periciar o vídeo. Se for montagem, pedimos direito de resposta no TSE."
- **Beto:** "Os aliados querem silêncio. Qualquer resposta reabre o assunto."

A fala da Sônia revela uma opção escondida: o vídeo pode estar editado, mas isso só se descobre pagando a perícia.

### Dilemas éticos com consequência atrasada
A escolha antiética dá ganho imediato e cria uma chance oculta de estourar rodadas depois, com multa, perda de tempo de TV, escândalo ou até cassação.

- Usar conteúdo de IA sem rótulo ou deepfake (proibido pelo TSE)
- Disparo em massa no WhatsApp
- Caixa 2
- Responder fake news com outra fake news
- Expor a vida pessoal do adversário
- Prometer o que é inviável

### Mecânicas que enriquecem o jogo
- **Pesquisas com margem de erro:** dados imprecisos; pagar por pesquisa quantitativa ou grupo focal melhora a leitura.
- **Adversário que reage:** se o jogador ataca, ele contra-ataca; se o jogador ocupa o centro, ele radicaliza.
- **Grupo focal fictício:** falas curtas de eleitores-persona reagindo à campanha.
- **Placar final em várias dimensões:** votos, dívida de campanha, promessas feitas e cargos prometidos aos aliados, que viram uma nota de "governabilidade".
- **Replay com outro perfil:** no debrief, a turma compara as mesmas decisões em perfis diferentes.

---

## Parte 3 — Dados iniciais (JSON)

Todos os valores são fictícios e servem de ponto de partida para o balanceamento.

```json
{
  "pais": "Bansh",
  "indecisos": 26,
  "segmentos": [
    { "id": "jovens", "nome": "Jovens (16–24 anos)" },
    { "id": "mulheres", "nome": "Mulheres" },
    { "id": "evangelicos", "nome": "Evangélicos" },
    { "id": "classeC", "nome": "Classe C" },
    { "id": "nordeste", "nome": "Nordeste" },
    { "id": "sul", "nome": "Sul" }
  ],
  "candidatos": [
    {
      "id": "luana",
      "nome": "Luana Prado",
      "genero": "Mulher trans",
      "costumes": "progressista",
      "economia": "estado",
      "raca": "Negra",
      "idade": 36,
      "origem": "Sudeste",
      "religiao": "Sem religião",
      "trajetoria": "Deputada federal mais votada do estado",
      "partido": "medio_federacao",
      "esqueleto": "Posts antigos com ataques pessoais a adversários",
      "seguidores": 9800000,
      "engajamento": 0.041,
      "pontoForte": "Maior base digital, mobiliza jovens e voluntários",
      "obstaculo": "Principal alvo de desinformação, sem experiência executiva",
      "metricas": { "intencaoVoto": 18, "rejeicao": 46, "caixaMi": 45, "tempoTV": 22, "sentimento": 52, "coesao": 78, "credibilidade": 61, "riscoJuridico": 12 },
      "intencaoPorSegmento": { "jovens": 31, "mulheres": 25, "evangelicos": 6, "classeC": 17, "nordeste": 19, "sul": 12 }
    },
    {
      "id": "rafael",
      "nome": "Rafael Tanaka",
      "genero": "Homem cis",
      "costumes": "progressista",
      "economia": "mercado",
      "raca": "Amarela (nipo-brasileiro)",
      "idade": 47,
      "origem": "Sul",
      "religiao": "Católico",
      "trajetoria": "Ex-prefeito de capital",
      "partido": "medio",
      "esqueleto": "Delação cita doação não declarada",
      "seguidores": 1900000,
      "engajamento": 0.018,
      "pontoForte": "Imagem de gestor moderado, trânsito no centro",
      "obstaculo": "Pouco conhecido fora do Sul, visto como \"morno\"",
      "metricas": { "intencaoVoto": 11, "rejeicao": 22, "caixaMi": 55, "tempoTV": 26, "sentimento": 56, "coesao": 70, "credibilidade": 66, "riscoJuridico": 32 },
      "intencaoPorSegmento": { "jovens": 12, "mulheres": 12, "evangelicos": 9, "classeC": 10, "nordeste": 6, "sul": 21 }
    },
    {
      "id": "helena",
      "nome": "Helena Siqueira",
      "genero": "Mulher cis",
      "costumes": "conservador",
      "economia": "estado",
      "raca": "Parda",
      "idade": 57,
      "origem": "Nordeste",
      "religiao": "Evangélica",
      "trajetoria": "Ex-governadora",
      "partido": "grande",
      "esqueleto": "Contrato emergencial na saúde sob investigação",
      "seguidores": 1100000,
      "engajamento": 0.024,
      "pontoForte": "Máquina partidária e experiência de gestão",
      "obstaculo": "Pouca presença digital, vista como \"do sistema\"",
      "metricas": { "intencaoVoto": 24, "rejeicao": 38, "caixaMi": 85, "tempoTV": 40, "sentimento": 47, "coesao": 58, "credibilidade": 54, "riscoJuridico": 45 },
      "intencaoPorSegmento": { "jovens": 14, "mulheres": 23, "evangelicos": 34, "classeC": 28, "nordeste": 36, "sul": 15 }
    },
    {
      "id": "augusto",
      "nome": "Augusto Brandão",
      "genero": "Homem cis",
      "costumes": "conservador",
      "economia": "mercado",
      "raca": "Branca",
      "idade": 58,
      "origem": "Centro-Oeste",
      "religiao": "Católico",
      "trajetoria": "Empresário do agronegócio, outsider",
      "partido": "pequeno",
      "esqueleto": "Multa ambiental em fazenda da família",
      "seguidores": 7200000,
      "engajamento": 0.053,
      "pontoForte": "Discurso antissistema e engajamento alto",
      "obstaculo": "Sem experiência política, pouco tempo de TV",
      "metricas": { "intencaoVoto": 21, "rejeicao": 41, "caixaMi": 30, "tempoTV": 12, "sentimento": 54, "coesao": 64, "credibilidade": 57, "riscoJuridico": 36 },
      "intencaoPorSegmento": { "jovens": 22, "mulheres": 17, "evangelicos": 30, "classeC": 19, "nordeste": 10, "sul": 33 }
    }
  ],
  "conselheiros": [
    { "id": "neusa", "nome": "Neusa Lacerda", "papel": "a veterana", "especialidade": "30 anos de campanha, TV e jingle", "vies": "Subestima as redes", "acertaMaisCom": "Eleitores mais velhos, classe C, candidatos com muito tempo de TV" },
    { "id": "caio", "nome": "Caio Fontes", "papel": "o growth", "especialidade": "Dados, memes e influenciadores", "vies": "Topa a área cinzenta das regras do TSE", "acertaMaisCom": "Jovens, candidatos com muitos seguidores" },
    { "id": "sonia", "nome": "Sônia Arruda", "papel": "a jurídica", "especialidade": "Direito eleitoral e gestão de crise", "vies": "Trava a campanha por excesso de cautela", "acertaMaisCom": "Crises com fake news e deepfake" },
    { "id": "beto", "nome": "Beto Rangel", "papel": "o coordenador político", "especialidade": "Alianças e lideranças regionais", "vies": "Defende interesses do partido e dos aliados", "acertaMaisCom": "2º turno e negociações" }
  ],
  "eventoExemplo": {
    "id": "video-2015",
    "rodada": "campanha_oficial",
    "titulo": "Um vídeo de 2015 com uma fala polêmica do candidato viraliza",
    "opcoes": [
      { "id": "A", "texto": "Pedir desculpas" },
      { "id": "B", "texto": "Contextualizar" },
      { "id": "C", "texto": "Dobrar a aposta" },
      { "id": "D", "texto": "Mudar de pauta" },
      { "id": "E", "texto": "Pagar perícia no vídeo", "oculta": true, "liberadaPor": "sonia" }
    ],
    "opinioes": [
      { "conselheiro": "neusa", "recomenda": "A", "fala": "Peça desculpas no horário eleitoral, olhando para a câmera. O eleitor perdoa quem assume o erro." },
      { "conselheiro": "caio", "recomenda": "D", "fala": "Não pede desculpa. Vira meme e muda a pauta em 24 horas, tenho três influenciadores prontos." },
      { "conselheiro": "sonia", "recomenda": "E", "fala": "Antes de responder, vamos periciar o vídeo. Se for montagem, pedimos direito de resposta no TSE." },
      { "conselheiro": "beto", "recomenda": "D", "fala": "Os aliados querem silêncio. Qualquer resposta reabre o assunto." }
    ]
  }
}
```
