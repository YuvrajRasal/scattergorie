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
  limitToLast,
  writeBatch,
} from "firebase/firestore";

import { categories } from "../data/scattergoriesData";
import { motion } from "framer-motion";

// const categories = [
//   "Animal",
//   "Country",
//   "Food",
//   "Movie",
//   "Sports",
//   "Fruit",
//   "City",
//   "Famous Person",
// ];

const letters = "ABCDEFGHMPRSTLW".split("");

function Dummy() {
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState({
    category: categories[0],
    letter: letters[0],
  });
  const [hint, setHint] = useState("");
  //   true since game is alwyas on
  const [gameStarted, setGameStarted] = useState(true);
  const [turn, setTurn] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerScore, setPlayerScore] = useState(0);
  const [players, setPlayers] = useState([]);
  const [open, setOpen] = useState(false);
  const [displayLeaderBoard, setdisplayLeaderBoard] = useState(false);

  // References
  const gameRef = doc(db, "games", "defaultGame");
  const playersRef = collection(gameRef, "players");
  //
  const RoundLimit = 10;

  // 🔹 Join Game
  const handleJoin = async () => {
    if (!playerName) return alert("Enter your name");
    // currentb scenario game ia always created *************** no need fpr start icon
    // if (!gameStarted) return alert("Create");

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

  const restartGame = async () => {
    await setDoc(
      gameRef,
      {
        category: categories[0],
        letter: letters[0],
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
    setdisplayLeaderBoard(false);
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

    const playerDoc = doc(playersRef, playerId);
    const snap = await getDoc(playerDoc);

    if (snap.exists()) {
      const currentScore = snap.data().score || 0;
      if (currentScore > 0) {
        await updateDoc(playerDoc, { score: increment(-1) });
      }
    }
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
      //   game is always on
      //   { ...current, gameStarted: true, turn: 1 },
      { ...current, turn: 1 },
      { merge: true }
    );
  };

  // 🔹 End Game  (WORKS AS RESET) ******************************
  //   end game not used aas game cant be ended
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
    setdisplayLeaderBoard(false);
  };

  // 🔄 Sync game + player score
  useEffect(() => {
    const unsubGame = onSnapshot(gameRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurrent({ category: data.category, letter: data.letter });
        // game is alwways on
        // setGameStarted(data.gameStarted || false);
        setTurn(data.turn || 0);
        console.log("hello");

        if (data.turn == 1) {
          setdisplayLeaderBoard(false);
        }

        if (data?.turn > RoundLimit) {
          //   handleEndGame();
          setdisplayLeaderBoard(true);

          // Auto-hide leaderboard after 10 seconds
          //   setTimeout(() => {
          //     setdisplayLeaderBoard(false);
          //   }, 10000); // 10000 ms = 10 seconds
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

  //   const handleHint = async () => {
  //     try {
  //       const res = await fetch("/.netlify/functions/getHint", {
  //         method: "POST",
  //         body: JSON.stringify({
  //           category: current.category,
  //           letter: current.letter,
  //         }),
  //       });
  //       const data = await res.json();
  //       setHint(data.hints);
  //     } catch (err) {
  //       console.error("Error fetching hint:", err);
  //       setHint("⚠️ Could not fetch hint. Try again.");
  //     }
  //   };
  const handleHint = async () => {
    try {
      const prompt = encodeURIComponent(
        `In the Scattergories game, the category is "${current?.category}" and the letter is "${current?.letter}". 
Give me exactly 3 clues for a possible answer without revealing the word, speak out the hints one after another.`
      );

      // Open ChatGPT with the prompt prefilled
      window.open(`https://chat.openai.com/?q=${prompt}`, "_blank");
    } catch (err) {
      console.error("Error fetching hint:", err);
      setHint("⚠️ Could not fetch hint. Try again.");
    }
  };

  return (
    <div className="flex  flex-col items-center  h-screen bg-gradient-to-br from-blue-100 to-purple-200 p-4">
      <div className="flex flex-col sm:flex-row justify-between sm:space-x-4 mb-4">
        {!playerId && (
          <div className="flex items-center gap-4 ">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="p-2 border rounded-lg"
            />
            <button
              onClick={handleJoin}
              className="py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-700"
            >
              Join
            </button>
          </div>
        )}

        {/* {playerId && (
          <div className="flex justify-center mb-2 sm:mb-0 select-none text-center items-center">
            Score : {playerScore} | 👤 {playerName} |
            {gameStarted && (
              <span className=" font-semibold"> Turn: {turn}</span>
            )}
          </div>
        )} */}
        {/* 
          <div className="flex flex-wrap justify-center gap-3 mb-2 sm:mb-0 select-none">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium shadow-sm">
              🏆 Score: <span className="font-bold">{playerScore}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium shadow-sm">
              👤 {playerName}
            </div>
            {gameStarted && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium shadow-sm">
                🔄 Turn: <span className="font-bold">{turn}</span>
              </div>
            )}
          </div>
        )} */}
        {playerId && (
          <motion.div
            initial={{ width: 200, height: 40, borderRadius: 20 }}
            animate={{
              width: 300,
              height: 40,
              borderRadius: 30,
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="select-none mx-auto bg-black text-white shadow-lg px-6 py-3 flex items-center justify-around gap-4"
          >
            <motion.span
              key={playerScore} // re-triggers animation when score changes
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-yellow-400 font-semibold"
            >
              🪙 {playerScore}
            </motion.span>
            {/* <span className="text-yellow-400 font-semibold">
            🏆 {playerScore}
          </span> */}
            <span className="text-white font-medium uppercase">
              👤 {playerName}
            </span>
            <motion.span
              key={turn}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-green-400 font-semibold text-sm sm:text-base md:text-lg"
            >
              🎯 {turn > RoundLimit ? turn - 1 : turn} / {RoundLimit}
            </motion.span>
          </motion.div>
        )}

        {/* {playerId && (
          <motion.div
            initial={{ scale: 0.9, borderRadius: 20 }}
            animate={{ scale: 1, borderRadius: 30 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mx-auto bg-black text-white shadow-lg px-4 sm:px-6 py-3 
               flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-around 
               gap-3 sm:gap-6 rounded-2xl max-w-lg w-full"
          >
            <motion.span
              key={playerScore} // triggers animation when score changes
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="text-yellow-400 font-semibold text-sm sm:text-base md:text-lg"
            >
              🏆 {playerScore}
            </motion.span>

            <span className="text-white font-medium uppercase text-sm sm:text-base md:text-lg truncate max-w-[150px] sm:max-w-none">
              👤 {playerName}
            </span>

            <motion.span
              key={turn}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-green-400 font-semibold text-sm sm:text-base md:text-lg"
            >
              🔄 {turn}
            </motion.span>
          </motion.div>
        )} */}

        <div className="flex justify-between my-2">
          {/* game is alwyas on */}
          {/* {!gameStarted && (
            <button
              onClick={handleStartGame}
              className="py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 "
            >
              Start Game
            </button>
          )} */}
          {/* game is alwyas on  so cant be ended*/}
          {/* {gameStarted && playerId && !displayLeaderBoard && (
            <button
              onClick={handleEndGame}
              className="py-1 px-6 bg-red-500 text-white rounded-lg hover:bg-red-600 "
            >
              End Game
            </button>
          )} */}

          {gameStarted && playerId && !displayLeaderBoard && (
            <button
              onClick={restartGame}
              className="py-1 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 "
            >
              Restart Game
            </button>
          )}

          {playerId && !displayLeaderBoard && (
            <button
              onClick={handleExitGame}
              className=" py-1 px-6 bg-orange-500 text-white rounded-lg hover:bg-orange-600  ml-4"
            >
              Exit Game
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="relative  mb-6 select-none">
        {displayLeaderBoard && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div className="relative p-4 bg-white rounded-2xl shadow-lg max-w-md min-w-[230px]  mx-auto max-h-96 sm:max-h-96 overflow-y-auto uppercase">
              {/* Close button (top-right) */}
              {/* <button
                onClick={() => setdisplayLeaderBoard(false)}
                className="absolute top-0.5 right-1.5 text-red-500 hover:text-red-700 text-xl font-bold "
              >
                ✖
              </button> */}
              <h2 className="text-xl font-bold text-center mb-2 ">
                🏆 Leaderboard
              </h2>

              {players.length === 0 ? (
                <p className="text-gray-500 text-center">No scores yet</p>
              ) : (
                <ul className="space-y-2">
                  {players.map((p, i) => (
                    <li
                      key={p.id}
                      className={`flex justify-between items-center p-3 rounded-xl shadow-sm
                ${
                  i === 0
                    ? "bg-yellow-200 text-yellow-800 font-bold" // Gold
                    : i === 1
                    ? "bg-gray-200 text-gray-800 font-semibold" // Silver
                    : i === 2
                    ? "bg-orange-300 text-orange-900 font-medium" // Bronze
                    : "bg-gray-50"
                }`}
                    >
                      <span className="font-medium mr-2">
                        {i + 1}. {p.name}
                      </span>
                      <span className="font-bold text-blue-600">{p.score}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col  gap-4">
          <div
            onClick={handleCategoryClick}
            className={`select-none cursor-pointer space-y-4 bg-white rounded-xl shadow-lg p-6 w-72 h-48 sm:w-96 sm:h-64 flex flex-col justify-center items-center hover:bg-gray-100 transition ${
              displayLeaderBoard ? "opacity-30" : "opacity-100"
            }`}
          >
            <p className="text-2xl text-gray-600">Category</p>
            <p className="text-4xl font-semibold text-center">
              {current.category}
            </p>
          </div>

          <div
            onClick={handleLetterClick}
            className={`select-none cursor-pointer space-y-4 bg-white rounded-xl shadow-lg p-6 w-72 h-48 sm:w-96 sm:h-64 flex flex-col justify-center items-center hover:bg-gray-100 transition ${
              displayLeaderBoard ? "opacity-30" : "opacity-100"
            }`}
          >
            <p className="text-2xl text-gray-600 ">Letter</p>
            <p className="text-7xl font-bold text-blue-600">{current.letter}</p>
          </div>
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

      {!displayLeaderBoard ? (
        <div className="flex justify-between gap-12 w-full max-w-2xl">
          <button
            onClick={handleBack}
            className="flex-1 p-1 bg-gray-300 rounded-lg hover:bg-gray-400 text-lg"
          >
            Back
          </button>
          <button
            onClick={handleHint}
            className="flex-1 p-1 bg-yellow-400 rounded-lg hover:bg-yellow-500 text-lg"
          >
            Hint
          </button>
          <button
            onClick={handleFoul}
            className="flex-1 p-1 bg-red-400 rounded-lg hover:bg-red-500 text-lg"
          >
            Foul
          </button>
        </div>
      ) : (
        <div className="flex justify-between gap-12 w-full max-w-2xl">
          <button
            onClick={handleExitGame}
            className="flex-1 p-1 bg-orange-500 rounded-lg hover:bg-orange-700text-lg text-white"
          >
            Exit
          </button>
          <button
            onClick={() => restartGame()}
            className="flex-1 p-1 bg-blue-500 rounded-lg hover:bg-blue-700 text-lg text-white"
          >
            Restart
          </button>
          {/* game is alays ended so no need for end button */}
          {/* <button
            onClick={handleEndGame}
            className="flex-1 p-1 bg-red-500 rounded-lg hover:bg-red-700 text-lg text-white"
          >
            End
          </button> */}
        </div>
      )}

      {/* leaderboard */}

      {/*to remove extra players *******************/}
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
