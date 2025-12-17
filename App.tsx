import React from 'react';
import { GameCanvas } from './components/GameCanvas';

function App() {
  return (
    <div className="w-full h-screen bg-neutral-950 overflow-hidden">
      <GameCanvas />
    </div>
  );
}

export default App;
