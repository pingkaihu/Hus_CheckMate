import { GameProvider, useGame } from './context/GameContext';
import { WelcomeScreen } from './components/screens/WelcomeScreen';
import { MainScreen } from './components/screens/MainScreen';
import './App.css';

function GameRouter() {
  const { isInitialized } = useGame();
  return isInitialized ? <MainScreen /> : <WelcomeScreen />;
}

function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

export default App;
