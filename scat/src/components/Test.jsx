import { db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";

function Test() {
  useEffect(() => {
    // Listen to Firestore
    const unsub = onSnapshot(doc(db, "games", "defaultGame"), (docSnap) => {
      if (docSnap.exists()) {
        console.log("📡 Firestore Data:", docSnap.data());
      } else {
        console.log("❌ No data found");
      }
    });

    return () => unsub();
  }, []);

  const writeTest = async () => {
    await setDoc(doc(db, "games", "defaultGame"), {
      test: Date.now(),
    });
    console.log("✅ Wrote to Firestore");
  };

  return (
    <div>
      <h2>Scattergories 🎲</h2>
      <button onClick={writeTest}>Write Test</button>
    </div>
  );
}

export default Test;
