# Simulador de Campanha Presidencial — Bansh

Protótipo jogável de simulador de decisão: você é o marqueteiro-chefe de um dos 4
candidatos fictícios à Presidência de Bansh (país fictício), ao longo de 9 fases de
campanha, até a eleição.

Ver `simulador-campanha-spec.md` para a especificação completa (design, dados
iniciais e identidade visual da marca).

## Rodando o projeto

```bash
npm install
npm run dev        # app em http://localhost:5173
npm run test       # suíte de testes do motor (vitest)
npm run simulate   # 1000 partidas aleatórias por perfil, relatório de taxa de vitória
npm run build       # build de produção
```

## Ranking público e dashboard ao vivo (opcional)

O jogo pede nome/apelido na tela inicial, pede um comentário obrigatório sobre
a decisão ao final de cada rodada, e ao final mostra a posição da pessoa num
ranking público (score = metade % de votos finais, metade nota de
governabilidade). Isso usa [Supabase](https://supabase.com) (gratuito) como
backend — sem isso configurado, o jogo funciona normalmente em modo solo, só
sem ranking.

**Passo a passo:**

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. No SQL Editor do projeto, rode o conteúdo de `supabase-schema.sql` (cria as
   tabelas `resultados` e `comentarios`, com leitura/escrita pública e
   Realtime ligado).
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon
   public**.
4. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY` com esses valores.
5. `npm run build` e publique a pasta `dist/` (Vercel, Netlify, GitHub Pages —
   qualquer hospedagem estática serve; o app não tem backend próprio).
6. Abra `dashboard/index.html`, preencha as mesmas duas chaves no topo do
   `<script>` (não lê `.env` — é uma página estática independente, sem
   processo de build), e publique esse arquivo em outro lugar (pode ser um
   segundo site, ou até só abrir localmente). Ele mostra o ranking e os
   comentários de todo mundo, atualizando sozinho via Supabase Realtime.

**Importante:** as tabelas ficam com leitura e escrita abertas para qualquer
visitante (sem login) — é o jeito mais simples de deixar qualquer pessoa com
o link jogar e aparecer no ranking, mas também significa que, tecnicamente,
alguém poderia inserir dados falsos direto na API. Para uma turma/grupo
fechado isso tende a não ser problema; para divulgação bem aberta, considere
adicionar um `CHECK` nos valores (0–100) ou um `rate limit` na tabela depois.

## Arquitetura

- `src/data/` — conteúdo (candidatos, conselheiros, segmentos, dilemas/eventos). Edite
  aqui sem mexer em lógica.
- `src/config/balance.ts` — **todo** peso/fórmula que afeta o resultado. Mudar um
  número aqui muda o jogo sem tocar em outro arquivo.
- `src/engine/` — motor puro e testável (`GameState` + decisão → novo `GameState`).
  Sem React, sem `localStorage`, sem `Math.random()` direto (RNG tem seed, para o
  replay ser determinístico).
- `src/store/` — ponte do motor com React (`GameContext`, `useReducer`) e persistência
  em `localStorage`.
- `src/ui/` — telas e componentes, seguindo a identidade visual da marca Bansh (ver
  spec): estrela azul como assinatura, tokens de cor, Archivo/Public Sans/IBM Plex Mono.
- `src/sim/simulate.ts` — simulação de partidas com decisões aleatórias, para checar
  o balanceamento entre os 4 perfis.

## Suposições de balanceamento (ainda não validadas por playtesting humano)

A spec deixa as fórmulas de efeito em aberto. Pontos de partida assumidos, todos em
`src/config/balance.ts`:

- **Verba com retornos decrescentes:** `efeito = min(√gasto × 0.9, 6)` por canal.
  TV favorece Classe C/Nordeste; digital favorece jovens; comícios favorecem
  Nordeste/Sul; equipe jurídica só reduz risco jurídico; pesquisa não persuade,
  só reduz o ruído do painel.
- **Conselheiro de bom fit multiplica o efeito em 1.35×; de mau fit, em 0.65×**
  (interpolado linearmente pelo fit 0–1 do conselheiro para aquela situação).
- **Risco oculto (dilema antiético):** ganho imediato ×1.5, 22% de chance de
  estourar por rodada, subindo 8 p.p. a cada rodada que passa sem estourar, por
  até 3 rodadas (depois disso, prescreve).
- **1º turno:** usamos "votos efetivos" = intenção de voto × (1 − 0,3 × rejeição/100)
  — parte de quem diz que vota no candidato não aparece na urna quando a rejeição
  é alta. Vence quem passa de 50% dos votos efetivos normalizados entre os 4.
- **2º turno:** votos dos eliminados se transferem por proximidade ideológica
  (mesma posição em costumes e/ou economia pesa mais), e o resultado final ainda é
  ajustado pela rejeição relativa dos 2 finalistas (intensidade 0.6) — é o
  mecanismo que dá ao perfil de baixa rejeição (Rafael, na ficha da spec) o
  caminho de vitória que a spec descreve.
- **Adversários** são 3 heurísticas reativas, não campanhas simuladas por completo:
  reagem ao tom escolhido pelo jogador (ataque → o líder entre eles contra-ataca;
  ocupar o centro → o mais distante ideologicamente radicaliza), sem orçamento ou
  dilemas próprios. Além disso, a cada rodada eles somam um pouco de `intencaoVoto`
  por conta própria (`CRESCIMENTO_ORGANICO_ADVERSARIO_MEDIO`, ruidoso por
  candidato/rodada) — campanha que o jogo não simula em detalhe, mas que existe. Sem
  isso, qualquer alocação de verba do jogador (mesmo distraída) vencia quase sempre,
  porque os adversários ficavam parados a não ser quando reagiam ao tom: decisões
  ruins (gastar tudo em pesquisas/jurídica, ignorar segmentos, não seguir o
  conselheiro de bom fit) agora custam a eleição de verdade, não só pontos no
  placar.
- **Surpresa de última hora:** a apuração (1º e 2º turno) aplica um choque gaussiano
  determinístico por candidato (`SURPRESA_ELEICAO_BASE`, desvio-padrão 9 p.p. de
  voto efetivo, reduzido por investimento acumulado em pesquisas até o piso de 3 —
  ver `SURPRESA_ELEICAO_REDUCAO_POR_MI`/`SURPRESA_ELEICAO_MINIMA`). Nenhuma
  liderança é 100% garantida: mesmo jogando bem e chegando na frente, uma corrida
  apertada pode virar no dia da eleição. Investir em pesquisas não compra voto, mas
  reduz esse risco — é a mesma métrica que já reduzia a margem de erro exibida no
  painel, agora com peso real no resultado.
- **Simplificação importante:** a intenção de voto por segmento (painel/gráfico) é
  só informativa — 1º e 2º turno usam a métrica global `intencaoVoto`, não a soma
  dos segmentos. Isso significa que pontos fortes "de base" (ex.: Luana nos jovens)
  não entram diretamente na conta da eleição no MVP atual.
- **Pool de indecisos/brancos/nulos:** começa em 26% (`INDECISOS_INICIAL`) e só
  diminui quando uma opção de dilema marcada `capturaIndecisos` é escolhida — nesse
  caso, o ganho de `intencaoVoto` da opção é debitado do pool (não "nasce do nada").
  A fase `reta_final` concentra esse mecanismo, mas qualquer dilema pode usá-lo.
- **Cronômetro por dilema:** 45s (`TEMPO_LIMITE_DILEMA_SEGUNDOS`). Zerou sem decisão
  → confirma a opção já selecionada (ou a primeira visível, se nada foi escolhido) e
  segue — pressão real, mas nunca trava o jogo.
- **Confronto do conselheiro:** ao escolher uma opção que diverge da recomendação do
  conselheiro de melhor fit para aquele dilema, ele contesta e o jogador precisa
  confirmar de novo ("Confirmar mesmo assim") ou reconsiderar — não afeta o estado,
  é só fricção antes de travar a decisão.
- **Nem toda rodada é alocação de verba (`TIPO_RODADA`):** Convenção e Debates giram
  só em torno de dilema(s) e tom; Plataforma de Governo é uma rodada própria, sem
  custo de caixa (ver abaixo). Só Pré-campanha, Campanha oficial, Meio de campanha,
  Reta final, 1º e 2º turno pedem alocação de verba — menos repetitivo, e cada fase
  com identidade própria. Quem não investe não cresce, mas também não é toda rodada
  que dá pra investir: parte do jogo é decisão de conteúdo (plataforma, dilemas,
  tom), não só orçamento.
- **Plataforma de Governo** (fase logo após a Pré-campanha): o jogador distribui
  ênfase 0–10 entre 4 áreas (Saúde, Segurança, Educação, Economia), sem custar caixa.
  Cada ponto de ênfase soma `intencaoVoto` (0.5 por ponto, `PESO_ENFASE_AREA`) e, por
  área, pesa mais em segmentos com afinidade temática (ex.: Educação favorece jovens;
  Segurança favorece Sul/evangélicos — ver `AFINIDADE_SEGMENTO_AREA`). A partir de
  ênfase 7 (`LIMIAR_ENFASE_VIRA_PROMESSA`), a área vira uma promessa formal de
  governo, que custa nota de governabilidade no placar final — prometer muito em
  todas as áreas rende voto agora e governabilidade baixa depois.
- **Aliança Política** (dilema na Convenção, categoria `"alianca"`): escolher entre
  bloco sindical/popular, empresarial/agro, religioso conservador ou manter
  independência — cada opção favorece segmentos e canais diferentes (ex.: aliança
  sindical gera promessa formal; aliança empresarial engorda a caixa).
- **Grupo Focal** (dilema no Meio de campanha, categoria `"grupo_focal"`): reage a um
  retrato qualitativo dividido do eleitorado — mudar o tom, ignorar por amostra
  pequena, ou investir em mais pesquisa qualitativa antes de decidir.
- **Briefing do 2º turno:** ao se classificar, antes da rodada de verba normal
  aparece uma tela só informativa (não mexe no estado) mostrando os 2 finalistas
  lado a lado (intenção de voto, rejeição, base principal por segmento) e, para
  cada candidato eliminado no 1º turno, para qual finalista seus eleitores tendem
  a pender (reaproveita a mesma lógica de afinidade ideológica da apuração real —
  `afinidadeTransferencia` em `secondRound.ts` — então o que o jogador vê bate com
  o que realmente vai acontecer na transferência de votos).
- **Vitória tem "como", não só "quem":** a tela final classifica a vitória em
  selos combináveis — `classificarVitoria` em `score.ts` — com base na margem
  sobre o 2º colocado (ampla ≥15 p.p., apertada ≤5 p.p.), na rejeição final do
  vencedor e na nota de governabilidade (vitória contestada: rejeição >55% ou
  governabilidade <50), e na dívida de campanha (vitória com dívida nas alturas:
  ≥R$18 mi, abaixo do limiar de falência que encerraria a campanha antes do fim).
  Sem nenhum desses gatilhos, cai no selo padrão "vitória consolidada".
- **Saída antecipada (cassação e falência):** acima de 70 de risco jurídico, cada
  rodada tem uma chance real (12% no limiar, +1 p.p. por ponto acima, até 60%) de a
  campanha ser encerrada por decisão judicial. O mesmo vale para dívida acima de
  R$ 40 mi (10% no limiar, +1,5 p.p. por R$ mi, até 60%) — contas rejeitadas tiram a
  candidatura da disputa. As duas mexem em métricas que o jogador já controla
  (risco jurídico e verba/dívida), então são risco real de más decisões, não
  punição aleatória gratuita. Também é possível não passar para o 2º turno — se o
  candidato do jogador não ficar entre os 2 mais votados no 1º turno, a partida
  termina ali, sem continuar jogando um 2º turno que o candidato nem disputa.
- **Recurso de urgência na Justiça Eleitoral:** disponível na etapa de tom sempre
  que o risco jurídico já passou do limiar de cassação. Custa R$ 8 mi (vira dívida
  se faltar caixa) e reduz pela metade a chance de cassação daquela rodada
  específica — litígio ativo atrasa a decisão, mas não garante vitória (baseado em
  casos reais onde cassação raramente é automática).
- **Candidato "ocioso" ganha:** quando o jogador ataca, o adversário-alvo ganha no
  núcleo duro (como já existia), mas os adversários que NÃO são o alvo também
  ganham um pouco de intenção de voto — baseado em estudo publicado (meta-análise
  de 33 estudos) mostrando que, numa disputa de 3+ candidatos, quem fica de fora de
  uma troca de ataques sai ganhando. Atacar agora fortalece até dois adversários ao
  mesmo tempo, não só um — o tom "de ataque" fica mais arriscado do que parece.
- **Desinformação não é toda igual:** opções antiéticas podem sobrescrever o ganho
  imediato e a chance de estourar padrão (`ganhoImediatoAntieticoOverride`/
  `probabilidadeEstouroOverride` por opção). O deepfake sem rótulo, por exemplo,
  tem ganho imediato menor e risco de estourar maior que o padrão — pesquisa real
  mostra que manipulação sofisticada tem efeito eleitoral mensurável baixo e é mais
  fácil de desmascarar tecnicamente do que desinformação coordenada em massa.
- **Prometer demais tem custo crescente:** ênfase de plataforma acima de 8 (de 10)
  soma um custo extra de governabilidade por ponto, além do custo normal — presidentes
  reais cumprem só 23%-47% das promessas de campanha; prometer tudo em tudo pesa
  desproporcionalmente mais do que uma promessa isolada e moderada. Dívida de
  campanha alta no momento da Plataforma de Governo também aumenta esse custo —
  dívida "contamina" a margem de manobra do mandato.

## Resultado da simulação (critério de aceite)

`npm run simulate` com 1000 partidas aleatórias por perfil (4000 no total), já com
a saída antecipada por cassação/falência ativa:

| Perfil  | Taxa de vitória | Foi a 2º turno | Governabilidade média |
| ------- | ---------------: | --------------: | ----------------------: |
| Luana   | 53.1%            | 80.6%            | 74.4                    |
| Rafael  | 75.7%            | 80.9%            | 72.4                    |
| Helena  | 72.0%            | 78.4%            | 60.2                    |
| Augusto | 46.8%            | 71.6%            | 66.1                    |

**Leitura:** com o crescimento orgânico dos adversários e a surpresa de última hora
(ver seção de suposições acima), decisão aleatória deixou de ser quase garantia de
vitória — a média caiu de ~93% para ~66%, e os 2 perfis mais arriscados da ficha
(Luana: maior rejeição relativa e alvo preferencial de desinformação; Augusto: menor
caixa e menor tempo de TV, o "azarão" da corrida) agora perdem com uma frequência
real, em vez de vencerem quase sempre por inércia. Rafael (baixa rejeição) e Helena
(mais estrutura, mas também mais risco jurídico) seguem fortes, batendo o
comportamento de "caminho de vitória" que a spec descreve para cada perfil — mas
nenhum dos quatro vence de forma garantida, nem com decisões aleatórias nem, pela
mecânica de surpresa de última hora, com decisões boas.

## Limitações conhecidas do MVP

- Recarregar a página **no meio de uma rodada** reinicia as etapas locais da UI
  (verba → dilemas → tom), o que permite alocar verba duas vezes na mesma rodada
  se o jogador recarregar depois de confirmar. O estado do motor em si nunca fica
  inconsistente, só a sessão de decisões da rodada atual.
- A opção "oculta" (ex.: perícia da Sônia no vídeo de 2015) é só uma revelação de
  interface — fica num `<details>` separado — não há um gate de jogo que exija
  seguir o conselheiro antes de habilitá-la.
- Caixa de campanha nunca é reabastecida por doações durante a partida; só diminui
  com a verba alocada (ou vira dívida se faltar dinheiro).

## Conteúdo do MVP

- 4 candidatos, 4 conselheiros (Parte 3 da spec).
- 9 fases: Pré-campanha → Plataforma de Governo → Convenção → Campanha oficial →
  Meio de campanha → Debates → Reta final (indecisos) → 1º turno → 2º turno.
- 15 dilemas/eventos distribuídos pelas fases, sendo 5 com consequência ética
  atrasada (disparo em massa, caixa 2, IA/deepfake sem rótulo, influenciador
  problemático, promessa de cargos inviáveis) — acima do mínimo de 3 pedido pela
  spec. Toda opção tem uma `reacao` (manchete/post/fala de eleitor-persona) exibida
  assim que é selecionada, antes de confirmar.
- Motor com 78 testes automatizados (`src/engine/__tests__/`), incluindo uma
  partida completa simulada do início ao fim para os 4 perfis.
