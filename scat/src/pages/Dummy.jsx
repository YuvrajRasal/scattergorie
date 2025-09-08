import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  increment,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

const categories = [
  "Animal",
  "Country",
  "Food",
  "Movie",
  "Sports",
  "Fruit",
  "City",
  "Famous Person",
];

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function Dummy() {
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState({
    category: categories[0],
    letter: letters[0],
  });
  const [hint, setHint] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [turn, setTurn] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerScore, setPlayerScore] = useState(0);
  const [players, setPlayers] = useState([]);
  const [open, setOpen] = useState(false);

  // References
  const gameRef = doc(db, "games", "defaultGame");
  const playersRef = collection(gameRef, "players");

  // 🔹 Join Game
  const handleJoin = async () => {
    if (!playerName) return alert("Enter your name");
    if (!gameStarted) return alert("Create");

    // 🔍 Check if this name already exists
    const lowercased_playername = playerName.toLowerCase();
    const playersRef = collection(db, "games", "defaultGame", "players");
    const q = query(playersRef, where("name", "==", lowercased_playername));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      alert("This name is already taken! Please choose another.");
      return;
    }

    // ✅ Create unique player document
    const newPlayerId = Date.now().toString(); // simple unique ID
    await setDoc(doc(playersRef, newPlayerId), {
      name: playerName,
      score: 0,
      answers: [],
    });

    setPlayerId(newPlayerId);
    alert(`Welcome ${playerName}! You joined the game.`);
  };

  const fetchLeaderboard = async () => {
    const playersRef = collection(db, "games", "defaultGame", "players");
    const q = query(playersRef, orderBy("score", "desc"));
    const querySnapshot = await getDocs(q);

    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    setPlayers(data);
    setOpen(true); // show leaderboard
  };
  //--------------------
  useEffect(() => {
    const playersRef = collection(db, "games", "defaultGame", "players");
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPlayers(list);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "games", "defaultGame", "players", id));
  };
  //

  // 🔹 Get random category/letter
  const getRandomCategory = () =>
    categories[Math.floor(Math.random() * categories.length)];
  const getRandomLetter = () =>
    letters[Math.floor(Math.random() * letters.length)];

  // 🔹 Tap Category
  const handleCategoryClick = async () => {
    if (!playerId) return alert("Join the game first!");
    const newCategory = getRandomCategory();
    const newTurn = turn + 1;

    await setDoc(
      gameRef,
      { category: newCategory, turn: newTurn },
      { merge: true }
    );

    // increment player score
    await updateDoc(doc(playersRef, playerId), { score: increment(1) });

    setHistory([...history, current]);
    setHint("");
  };

  // 🔹 Tap Letter
  const handleLetterClick = async () => {
    if (!playerId) return alert("Join the game first!");
    const newLetter = getRandomLetter();
    const newTurn = turn + 1;

    await setDoc(
      gameRef,
      { letter: newLetter, turn: newTurn },
      { merge: true }
    );

    // increment player score
    await updateDoc(doc(playersRef, playerId), { score: increment(1) });

    setHistory([...history, current]);
    setHint("");
  };

  // 🔹 Back
  const handleBack = async () => {
    if (!playerId) return alert("Join the game first!");
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    const newTurn = Math.max(turn - 1, 0);

    setHistory(history.slice(0, -1));
    setCurrent(prev);
    setHint("");

    await setDoc(
      gameRef,
      { category: prev.category, letter: prev.letter, turn: newTurn },
      { merge: true }
    );

    // decrement player score
    await updateDoc(doc(playersRef, playerId), { score: increment(-1) });
  };

  // 🔹 Foul
  const handleFoul = async () => {
    if (!playerId) return alert("Join the game first!");
    await updateDoc(doc(playersRef, playerId), { score: increment(-1) });
  };

  //exit game
  const handleExitGame = async () => {
    if (!playerId) return;
    try {
      await deleteDoc(doc(db, "games", "defaultGame", "players", playerId));
      setPlayerId(""); // reset locally
      setPlayerName("");
      alert("You have exited the game.");
    } catch (error) {
      console.error("Error exiting game: ", error);
    }
  };

  // 🔹 Start Game
  const handleStartGame = async () => {
    await setDoc(
      gameRef,
      { ...current, gameStarted: true, turn: 1 },
      { merge: true }
    );
  };

  // 🔹 End Game
  const handleEndGame = async () => {
    await setDoc(
      gameRef,
      {
        category: categories[0],
        letter: letters[0],
        gameStarted: false,
        turn: 1,
      },
      { merge: true }
    );

    setHistory([]);
    setHint("");
    setPlayerScore(0);

    // reset all players’ scores
    const snapshot = await getDocs(playersRef);
    snapshot.forEach(async (docSnap) => {
      await updateDoc(docSnap.ref, { score: 0 });
    });
  };

  // 🔄 Sync game + player score
  useEffect(() => {
    const unsubGame = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrent({ category: data.category, letter: data.letter });
        setGameStarted(data.gameStarted || false);
        setTurn(data.turn || 0);
        if (data?.turn > 25) {
        }
      }
    });

    let unsubPlayer;
    if (playerId) {
      unsubPlayer = onSnapshot(doc(playersRef, playerId), (docSnap) => {
        if (docSnap.exists()) setPlayerScore(docSnap.data().score);
      });
    }

    return () => {
      unsubGame();
      if (unsubPlayer) unsubPlayer();
    };
  }, [playerId]);

  const handleHint = async () => {
    const hintResponse = await getHint(current.category, current.letter);
    setHint(hintResponse); // show in hint box
  };

  return (
    <div className="flex flex-col items-center  h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-4">
      <div className="flex justify-between space-x-4">
        {!playerId && (
          <div className="flex flex-row items-center gap-4 mb-3">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="p-2 border rounded-lg"
            />
            <button
              onClick={handleJoin}
              className="py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Join Game
            </button>
          </div>
        )}
        {!gameStarted && (
          <button
            onClick={handleStartGame}
            className="py-1 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 mb-6"
          >
            Start Game
          </button>
        )}
        {gameStarted && (
          <button
            onClick={handleEndGame}
            className="py-1 px-6 bg-red-500 text-white rounded-lg hover:bg-red-600 mb-4"
          >
            End Game
          </button>
        )}

        {playerId && (
          <div className="mb-4">
            👤 {playerName} | Score: {playerScore} |
            {gameStarted && (
              <span className="mb-4 text-lg font-semibold"> Turn: {turn}</span>
            )}
          </div>
        )}

        {playerId && (
          <button
            onClick={handleExitGame}
            className="py-1 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600 mb-4 ml-4"
          >
            Exit Game
          </button>
        )}
      </div>

      {/* Cards */}
      <div className="flex gap-6 mb-3">
        <div
          onClick={handleCategoryClick}
          className="select-none cursor-pointer space-y-4  bg-white rounded-xl shadow-lg p-6 w-56 h-56 flex flex-col justify-center items-center hover:bg-gray-100"
        >
          <p className="text-2xl text-gray-600">Category</p>
          <p className="text-5xl font-semibold text-center">
            {current.category}
          </p>
        </div>

        <div
          onClick={handleLetterClick}
          className="select-none cursor-pointer  space-y-2  bg-white rounded-xl shadow-lg p-6 w-56 h-56 flex flex-col justify-center items-center hover:bg-gray-100"
        >
          <p className="text-2xl text-gray-600 ">Letter</p>
          <p className="text-7xl font-bold text-blue-600">{current.letter}</p>
        </div>
      </div>

      {hint && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-yellow-100 p-4 rounded-lg text-lg text-gray-700 w-full max-w-xl text-center shadow-xl z-50 flex justify-between items-center">
          💡 {hint}
          <button
            className="items-start justify-start text-red"
            onClick={() => {
              setHint(null);
            }}
          >
            ❌
          </button>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between gap-12 w-full max-w-2xl">
        <button
          onClick={handleBack}
          className="flex-1 bg-gray-300 rounded-lg hover:bg-gray-400 text-lg"
        >
          ⬅ Back
        </button>
        <button
          onClick={handleHint}
          className="flex-1 bg-yellow-400 rounded-lg hover:bg-yellow-500 text-lg"
        >
          💡 Hint
        </button>
        <button
          onClick={handleFoul}
          className="flex-1 bg-red-400 rounded-lg hover:bg-red-500 text-lg"
        >
          ⚠ Foul
        </button>
      </div>
      {/* leaderboard */}
      {/* <div>
        <button
          onClick={fetchLeaderboard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Leaderboard
        </button>

        {open && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-2">Leaderboard</h2>
            <ul>
              {players.map((p, i) => (
                <li key={p.id} className="py-1">
                  {i + 1}. {p.name} —{" "}
                  <span className="font-semibold">{p.score}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setOpen(false)}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md"
            >
              Close
            </button>
          </div>
        )}
      </div> */}
      {/* players */}
      {/* <div className="p-4 bg-white rounded-2xl shadow-lg max-w-lg mx-auto my-2">
        <h2 className="text-xl font-bold text-center mb-4 ">Players</h2>
        {players.length === 0 ? (
          <p className="text-gray-500 text-center">No players joined yet</p>
        ) : (
          <ul className="space-y-2 w-full">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex justify-between space-x-2 items-center p-3 bg-gray-100 rounded-xl"
              >
                <span className="font-medium uppercase">{player.name}</span>
                <button
                  onClick={() => handleDelete(player.id)}
                  className=" px-1 py-1  text-white rounded-md hover:bg-red-600 transition"
                >
                  ❌
                </button>
              </li>
            ))}
          </ul>
        )}
      </div> */}
    </div>
  );
}

export default Dummy;
