import { useEffect, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebase";

export default function GameLobby({ onJoin }) {
  const [gameId, setGameId] = useState("");
  const [newGameName, setNewGameName] = useState("");
  const [playerName, setPlayerName] = useState("");

  const gamesRef = collection(db, "games");

  // Create a new game session
  const handleCreateGame = async () => {
    if (!newGameName.trim()) {
      alert("Enter a game name!");
      return;
    }

    const newGameRef = doc(gamesRef, newGameName);
    await setDoc(newGameRef, {
      category: null,
      letter: null,
      gameStarted: false,
      turn: 0,
    });

    alert(
      `✅ Game "${newGameName}" created! Share this name to let others join.`
    );
    setGameId(newGameName);
  };

  // Join an existing game session
  const handleJoinGame = async () => {
    if (!gameId.trim()) {
      alert("Enter a game ID to join!");
      return;
    }
    if (!playerName.trim()) {
      alert("Enter your name!");
      return;
    }

    const gameRef = doc(db, "games", gameId);
    const gameSnap = await getDoc(gameRef);

    if (!gameSnap.exists()) {
      alert("⚠️ Game not found. Check the ID!");
      return;
    }

    const playersRef = collection(db, "games", gameId, "players");
    const q = query(playersRef, where("name", "==", playerName));
    const existing = await getDocs(q);
    if (!existing.empty) {
      alert("⚠️ A player with this name already exists in this game.");
      return;
    }

    await addDoc(playersRef, { name: playerName, score: 0 });
    alert(`🎮 You joined game "${gameId}" as ${playerName}!`);
    onJoin(gameId, playerName); // go inside Maincard for this session
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-6">
      <h1 className="text-3xl font-bold mb-6">Scattergories Lobby 🎲</h1>

      {/* Create game */}
      <div className="bg-white p-6 rounded-2xl shadow-lg w-80 mb-6 text-center">
        <h2 className="text-lg font-semibold mb-3">Create Game</h2>
        <input
          type="text"
          value={newGameName}
          onChange={(e) => setNewGameName(e.target.value)}
          placeholder="Game ID (e.g. friends-group)"
          className="w-full px-4 py-2 border rounded-lg mb-4"
        />
        <button
          onClick={handleCreateGame}
          className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          ➕ Create
        </button>
      </div>

      {/* Join game */}
      <div className="bg-white p-6 rounded-2xl shadow-lg w-80 text-center">
        <h2 className="text-lg font-semibold mb-3">Join Game</h2>
        <input
          type="text"
          value={gameId}
          onChange={(e) => setGameId(e.target.value)}
          placeholder="Enter Game ID"
          className="w-full px-4 py-2 border rounded-lg mb-3"
        />
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-2 border rounded-lg mb-4"
        />
        <button
          onClick={handleJoinGame}
          className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          🔗 Join
        </button>
      </div>
    </div>
  );
}
