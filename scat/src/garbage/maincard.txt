import { useState, useEffect } from "react";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

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

function Maincard() {
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

  // Reference to Firestore doc
  const gameRef = doc(db, "games", "defaultGame");

  const getRandomCategory = () =>
    categories[Math.floor(Math.random() * categories.length)];

  const getRandomLetter = () =>
    letters[Math.floor(Math.random() * letters.length)];

  const handleCategoryClick = async () => {
    const newCategory = getRandomCategory();
    const newTurn = turn + 1;

    const handleJoin = () => {
      if (!playerName) return alert("Enter your name");
      setPlayerId(Date.now().toString()); // simple unique ID
    };

    //category
    await setDoc(
      gameRef,
      {
        category: newCategory || categories[0],
        letter: current.letter || letters[0],
        turn: newTurn,
      },
      { merge: true }
    );

    setHistory([...history, current]);
    setHint("");
  };

  //letter
  const handleLetterClick = async () => {
    const newLetter = getRandomLetter();
    const newTurn = turn + 1;

    await setDoc(
      gameRef,
      {
        category: current.category || categories[0],
        letter: newLetter || letters[0],
        turn: newTurn,
      },
      { merge: true }
    );

    setHistory([...history, current]);
    setHint("");
  };

  //start
  const handleStartGame = async () => {
    await setDoc(
      gameRef,
      {
        ...current,
        gameStarted: true,
        turn: 1,
      },
      { merge: true }
    );
  };

  //end
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
  };

  //Back
  const handleBack = async () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    const newTurn = Math.max(turn - 1, 0); // avoid negative turn

    setHistory(history.slice(0, -1));
    setCurrent(prev);
    setHint("");

    await setDoc(
      gameRef,
      {
        category: prev.category,
        letter: prev.letter,
        turn: newTurn,
      },
      { merge: true }
    );
  };

  const handleHint = () => {
    setHint(
      `Try something starting with "${current.letter}" in category "${current.category}".`
    );
  };

  // 🔄 Sync with Firestore
  useEffect(() => {
    const initializeGame = async () => {
      const docSnap = await getDoc(gameRef);
      if (!docSnap.exists()) {
        await setDoc(gameRef, {
          category: categories[0],
          letter: letters[0],
        });
      }
    };

    initializeGame();

    const unsub = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrent({ category: data.category, letter: data.letter });
        setGameStarted(data.gameStarted || false);
        setTurn(data.turn || 0);
      }
    });

    return () => unsub();
  }, []);
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-4">
      <h2 className="text-3xl font-bold mb-6">Scattergories 🎲</h2>
      {!gameStarted && (
        <button
          onClick={handleStartGame}
          className="py-3 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 mb-6"
        >
          Start Game
        </button>
      )}

      {gameStarted && (
        <div className="mb-4 text-lg font-semibold">Turn: {turn}</div>
      )}

      {gameStarted && (
        <button
          onClick={handleEndGame}
          className="py-3 px-6 bg-red-500 text-white rounded-lg hover:bg-red-600 mb-4"
        >
          End Game
        </button>
      )}

      {/* Cards */}
      <div className="flex gap-6 mb-6">
        {/* Category Card */}
        <div
          onClick={handleCategoryClick}
          className="cursor-pointer bg-white rounded-xl shadow-lg p-6 w-40 h-40 flex flex-col justify-center items-center hover:bg-gray-100"
        >
          <p className="text-lg text-gray-600">Category</p>
          <p className="text-xl font-semibold">{current.category}</p>
        </div>

        {/* Letter Card */}
        <div
          onClick={handleLetterClick}
          className="cursor-pointer bg-white rounded-xl shadow-lg p-6 w-40 h-40 flex flex-col justify-center items-center hover:bg-gray-100"
        >
          <p className="text-lg text-gray-600">Letter</p>
          <p className="text-5xl font-bold text-blue-600">{current.letter}</p>
        </div>
      </div>

      {/* Hint */}
      {hint && (
        <div className="bg-yellow-100 p-4 rounded-lg mb-6 text-lg text-gray-700 w-full max-w-md text-center">
          💡 {hint}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between gap-4 w-full max-w-md">
        <button
          onClick={handleBack}
          className="flex-1 py-3 bg-gray-300 rounded-lg hover:bg-gray-400 text-lg"
        >
          ⬅ Back
        </button>
        <button
          onClick={handleHint}
          className="flex-1 py-3 bg-yellow-400 rounded-lg hover:bg-yellow-500 text-lg"
        >
          💡 Hint
        </button>
      </div>
    </div>
  );
}

export default Maincard;
