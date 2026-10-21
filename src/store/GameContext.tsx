import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { aplicarAlocacaoVerba, aplicarPlataforma, avancarFase, criarNovoJogo, resolverDilema } from "../engine/engine";
import type {
  AlocacaoVerba,
  CandidatoId,
  ConselheiroId,
  Dilema,
  EnfasePlataforma,
  GameState,
  TomCampanha,
} from "../engine/types";
import { carregarEstado, limparEstado, salvarEstado, salvarNoHistorico } from "./persistence";

type Action =
  | { type: "ESCOLHER_CANDIDATO"; jogadorId: CandidatoId; seed: number }
  | { type: "APLICAR_VERBA"; alocacao: AlocacaoVerba }
  | { type: "APLICAR_PLATAFORMA"; enfases: EnfasePlataforma }
  | { type: "RESOLVER_DILEMA"; dilema: Dilema; opcaoId: string; conselheiroSeguidoId?: ConselheiroId; porOmissao?: boolean }
  | { type: "AVANCAR_FASE"; tom: TomCampanha }
  | { type: "REINICIAR" };

function reducer(state: GameState | null, action: Action): GameState | null {
  switch (action.type) {
    case "ESCOLHER_CANDIDATO":
      return criarNovoJogo(action.jogadorId, action.seed);
    case "APLICAR_VERBA":
      return state ? aplicarAlocacaoVerba(state, action.alocacao) : state;
    case "APLICAR_PLATAFORMA":
      return state ? aplicarPlataforma(state, action.enfases) : state;
    case "RESOLVER_DILEMA":
      return state
        ? resolverDilema(state, action.dilema, action.opcaoId, action.conselheiroSeguidoId, action.porOmissao)
        : state;
    case "AVANCAR_FASE": {
      if (!state) return state;
      const novoEstado = avancarFase(state, action.tom);
      if (novoEstado.terminado && novoEstado.resultado) {
        salvarNoHistorico({
          jogadorId: novoEstado.jogadorId,
          seed: novoEstado.seed,
          resultado: novoEstado.resultado,
          dataISO: new Date().toISOString(),
        });
      }
      return novoEstado;
    }
    case "REINICIAR":
      limparEstado();
      return null;
    default:
      return state;
  }
}

const GameStateContext = createContext<GameState | null>(null);
const GameDispatchContext = createContext<Dispatch<Action> | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, null, () => carregarEstado());

  useEffect(() => {
    if (state) salvarEstado(state);
  }, [state]);

  return (
    <GameStateContext.Provider value={state}>
      <GameDispatchContext.Provider value={dispatch}>{children}</GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}

export function useGameState(): GameState | null {
  return useContext(GameStateContext);
}

export function useGameDispatch(): Dispatch<Action> {
  const dispatch = useContext(GameDispatchContext);
  if (!dispatch) throw new Error("useGameDispatch precisa estar dentro de um GameProvider");
  return dispatch;
}
