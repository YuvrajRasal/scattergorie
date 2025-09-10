export default function ExternalHintButton({ category, letter }) {
  const handleHint = () => {
    const prompt = encodeURIComponent(
      `In the Scattergories game, the category is "${category}" and the letter is "${letter}". 
Give me exactly 3 clues for a possible answer without revealing the word.`
    );

    // Open ChatGPT with the prompt prefilled
    window.open(`https://chat.openai.com/?q=${prompt}`, "_blank");
  };

  return (
    <button
      onClick={handleHint}
      className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
    >
      Get Hint (via ChatGPT)
    </button>
  );
}
