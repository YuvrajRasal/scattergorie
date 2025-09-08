import "./App.css";
import { useState } from "react";
import Maincard from "./components/Maincard";
import Test from "./components/Test";
import GameLobby from "./pages/GameLobby";
import Dummy from "./pages/Dummy";

function App() {
  return (
    <>
      {/* <Maincard /> */}
      {/* <GameLobby
        onJoin={(gameId, playerName) => setSession({ gameId, playerName })}
      /> */}
      {/* <Test /> */}
      <Dummy />
    </>
  );
}

export default App;
