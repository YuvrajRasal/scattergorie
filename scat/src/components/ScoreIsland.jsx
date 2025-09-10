import { motion } from "framer-motion";

export default function ScoreIsland({
  playerScore,
  playerName,
  turn,
  gameStarted,
}) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 
                 bg-black text-white rounded-3xl shadow-lg 
                 px-6 py-2 flex items-center gap-4 z-50"
    >
      <span className="text-sm sm:text-base font-semibold text-blue-400">
        🏆 {playerScore}
      </span>
      <span className="text-sm sm:text-base font-medium">👤 {playerName}</span>
      {gameStarted && (
        <span className="text-sm sm:text-base font-semibold text-purple-400">
          🔄 Turn: {turn}
        </span>
      )}
    </motion.div>
  );
}
