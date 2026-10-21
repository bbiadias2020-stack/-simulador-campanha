/**
 * Simulação automática para o critério de aceite: joga N partidas por perfil com
 * decisões aleatórias e reporta a taxa de vitória de cada um, para checar que
 * nenhum perfil fica muito acima ou abaixo dos outros. Rodar com `npm run simulate`
 * (aceita um número opcional de partidas por perfil: `npm run simulate -- 2000`).
 */
import { CANDIDATO_IDS } from "../data/candidatos";
import { aplicarAlocacaoVerba, avancarFase, criarNovoJogo, resolverDilema } from "../engine/engine";
import { randomFloat } from "../engine/rng";
import { dilemasDaFase } from "../engine/selecaoConteudo";
import type { AlocacaoVerba, CandidatoId, GameState, TomCampanha } from "../engine/types";

const N_PARTIDAS = Number(process.argv[2] ?? 1000);
const CANAIS = ["tv", "digital", "comicios", "pesquisas", "juridica"] as const;
const TONS: TomCampanha[] = ["propositivo", "ataque", "moderado"];

class Rng {
  private cursor = 0;
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    return randomFloat(this.seed, this.cursor++);
  }
}

function alocacaoAleatoria(caixaDisponivel: number, rng: Rng): AlocacaoVerba {
  const pesos = CANAIS.map(() => rng.next());
  const soma = pesos.reduce((a, b) => a + b, 0);
  const fracaoGasta = 0.2 + rng.next() * 0.6; // gasta entre 20% e 80% da caixa disponível
  const total = Math.max(caixaDisponivel, 0) * fracaoGasta;
  const alocacao = {} as AlocacaoVerba;
  CANAIS.forEach((canal, i) => {
    alocacao[canal] = soma > 0 ? Math.round((pesos[i] / soma) * total * 10) / 10 : 0;
  });
  return alocacao;
}

function escolherAleatorio<T>(lista: T[], rng: Rng): T {
  return lista[Math.floor(rng.next() * lista.length)];
}

function jogarPartidaAleatoria(jogadorId: CandidatoId, seedJogo: number, seedDecisoes: number): GameState {
  let state = criarNovoJogo(jogadorId, seedJogo);
  const rng = new Rng(seedDecisoes);
  let rodadas = 0;

  while (!state.terminado && rodadas < 10) {
    const jogador = state.candidatos[state.jogadorId];
    state = aplicarAlocacaoVerba(state, alocacaoAleatoria(jogador.metricas.caixaMi, rng));

    for (const dilema of dilemasDaFase(state)) {
      const opcoesVisiveis = dilema.opcoes.filter((o) => !o.oculta);
      const opcao = escolherAleatorio(opcoesVisiveis, rng);
      const seguirConselheiro = rng.next() < 0.6;
      const conselheiroId = seguirConselheiro ? escolherAleatorio(dilema.opinioes, rng).conselheiroId : undefined;
      state = resolverDilema(state, dilema, opcao.id, conselheiroId);
    }

    state = avancarFase(state, escolherAleatorio(TONS, rng));
    rodadas += 1;
  }

  return state;
}

function main() {
  console.log(`Simulando ${N_PARTIDAS} partidas aleatórias por perfil (${N_PARTIDAS * 4} partidas no total)...\n`);

  const vitorias: Record<CandidatoId, number> = { luana: 0, rafael: 0, helena: 0, augusto: 0 };
  const governabilidadeSoma: Record<CandidatoId, number> = { luana: 0, rafael: 0, helena: 0, augusto: 0 };
  const segundoTurnoCount: Record<CandidatoId, number> = { luana: 0, rafael: 0, helena: 0, augusto: 0 };

  for (const jogadorId of CANDIDATO_IDS) {
    const offsetPerfil = CANDIDATO_IDS.indexOf(jogadorId) * 10_000_000;
    for (let i = 0; i < N_PARTIDAS; i++) {
      const seedJogo = offsetPerfil + i * 2 + 1;
      const seedDecisoes = offsetPerfil + i * 2 + 2;
      const resultado = jogarPartidaAleatoria(jogadorId, seedJogo, seedDecisoes);

      if (resultado.resultado?.vencedorId === jogadorId) vitorias[jogadorId] += 1;
      governabilidadeSoma[jogadorId] += resultado.resultado?.notaGovernabilidade ?? 0;
      if (resultado.resultado?.foiSegundoTurno) segundoTurnoCount[jogadorId] += 1;
    }
  }

  console.log(
    "Perfil".padEnd(10),
    "Taxa de vitória".padEnd(18),
    "Foi a 2º turno".padEnd(16),
    "Governabilidade média",
  );
  for (const id of CANDIDATO_IDS) {
    const taxa = ((vitorias[id] / N_PARTIDAS) * 100).toFixed(1);
    const segTurno = ((segundoTurnoCount[id] / N_PARTIDAS) * 100).toFixed(1);
    const gov = (governabilidadeSoma[id] / N_PARTIDAS).toFixed(1);
    console.log(id.padEnd(10), `${taxa}%`.padEnd(18), `${segTurno}%`.padEnd(16), gov);
  }

  const taxas = CANDIDATO_IDS.map((id) => (vitorias[id] / N_PARTIDAS) * 100);
  console.log(`\nMaior taxa de vitória: ${Math.max(...taxas).toFixed(1)}%`);
  console.log(`Menor taxa de vitória: ${Math.min(...taxas).toFixed(1)}%`);
  console.log(`Diferença: ${(Math.max(...taxas) - Math.min(...taxas)).toFixed(1)} pontos percentuais`);
}

main();
