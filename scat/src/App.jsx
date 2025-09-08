import "./App.css";
import { useState } from "react";
import Maincard from "./components/Maincard";
import Test from "./components/Test";

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
function App() {
  const [history, setHistory] = useState([]);
  const [current, setCurrent] = useState({
    category: categories[0],
    letter: letters[0],
  });
  const [hint, setHint] = useState("");

  // Generate random category + letter
  const getRandomCard = () => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const letter = letters[Math.floor(Math.random() * letters.length)];
    return { category, letter };
  };

  // Next button
  const handleNext = () => {
    setHistory([...history, current]);
    setCurrent(getRandomCard());
    setHint("");
  };

  // Back button
  const handleBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrent(prev);
    setHint("");
  };

  // Hint button (dummy hint for now)
  const handleHint = () => {
    setHint(
      `Try something starting with "${current.letter}" in category "${current.category}".`
    );
  };

  return (
    <>
      {/* <div className="flex w-fullflex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-purple-200">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center w-96 ">
          <h2 className="text-2xl font-bold mb-4">Scattergories 🎲</h2>

          <div className="mb-6">
            <p className="text-lg text-gray-600">Category</p>
            <p className="text-2xl font-semibold text-teal-600">
              {current.category}
            </p>
          </div>

          <div className="mb-6">
            <p className="text-lg text-gray-600">Letter</p>
            <p className="text-4xl font-bold text-blue-600">{current.letter}</p>
          </div>

          {hint && (
            <div className="bg-yellow-100 p-3 rounded-lg mb-4 text-gray-700">
              💡 {hint}
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              ⬅ Back
            </button>
            <button
              onClick={handleHint}
              className="px-4 py-2 bg-yellow-400 rounded-lg hover:bg-yellow-500"
            >
              💡 Hint
            </button>
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              ➡ Next
            </button>
          </div>
        </div>
      </div> */}
      <Maincard />
      {/* <Test /> */}
    </>
  );
}

export default App;
