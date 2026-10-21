import "./App.css";
import { GameProvider, useGameState } from "./store/GameContext";
import { TelaFinal } from "./ui/TelaFinal";
import { TelaInicial } from "./ui/TelaInicial";
import { TelaRodada } from "./ui/TelaRodada";

function Roteador() {
  const state = useGameState();
  if (!state) return <TelaInicial />;
  if (state.terminado) return <TelaFinal />;
  return <TelaRodada />;
}

function App() {
  return (
    <GameProvider>
      <Roteador />
    </GameProvider>
  );
}

export default App;
