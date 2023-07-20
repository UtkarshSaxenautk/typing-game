import "./App.css";
import TypingTestGame from "./Components/Game";
import Home from "./Components/Home";
import { LevelContext } from "./GameContext";
import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SinglePlayer from "./Components/SinglePlayer";
import Multiplayer from "./Components/Multiplayer";
import { DarkModeProvider, useDarkMode } from "./DarkModeContext";


const ToggleButton = () => {
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="absolute top-4 right-4">
      <label className="flex items-center cursor-pointer">
        <input type="checkbox" className="form-checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
        <span className={`ml-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Dark Mode</span>
      </label>
    </div>
  );
};
function App() {
  const [level, setLevel] = useState("easy");
  return (
    <BrowserRouter>
      <DarkModeProvider>
         <ToggleButton />
        <LevelContext.Provider value={{ level, setLevel }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/single-game" element={<SinglePlayer />} />
            <Route path="/multi-game" element={<Multiplayer />} />
            <Route path="/start" element={<TypingTestGame />} />
          </Routes>
        </LevelContext.Provider>
      </DarkModeProvider>
    </BrowserRouter>
  );
}

export default App;
