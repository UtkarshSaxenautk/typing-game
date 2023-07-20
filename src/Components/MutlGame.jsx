import React, { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { Easy, Medium, Hard } from '../assets/Data';
import { useDarkMode } from '../DarkModeContext';
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams to get the multiplayer hash
import { LevelContext } from '../GameContext';

const socket = io('http://localhost:5000'); // Replace 'http://localhost:5000' with your server URL

const MultiplayerTypingTestGame = () => {
  const [text, setText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [percentageCompleted, setPercentageCompleted] = useState(0);
  const [timer, setTimer] = useState(60);
  const [wpm, setWpm] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [matchedDifficulty, setMatchedDifficulty] = useState(null);
  const [opponentInput, setOpponentInput] = useState('');
  const [opponentEndTime, setOpponentEndTime] = useState(null);
    const [opponentWpm, setOpponentWpm] = useState(0);
    const {level , setLevel} = useContext(LevelContext)
  const { isDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const { index } = useParams(); // Get the multiplayer hash from the URL

  useEffect(() => {
    // Listen for opponent typing progress from the server
    socket.on('opponent-typing', ({ userInput, endTime, wpm }) => {
      setOpponentInput(userInput);
      setOpponentEndTime(endTime);
      setOpponentWpm(wpm);
    });

    // Listen for game results from the server
    socket.on('game-results', ({ userWpm, opponentWpm }) => {
      setWpm(userWpm);
      setOpponentWpm(opponentWpm);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    // Start the game when both players are ready
    if (index != null) {
        if ( level == 'easy') {
           setText(Easy[index]);
        } else if (level == 'medium') {
            setText(Medium[index])
        } else {
            setText(Hard[index])
       }
      
      setIsGameStarted(true);
      setStartTime(new Date());
    }
  }, [matchedDifficulty, index]);

  useEffect(() => {
    if (isGameStarted && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prevTimer) => Math.max(prevTimer - 1, 0));
      }, 1000);

      return () => clearInterval(interval);
    }

    if (timer === 0 && !endTime) {
      setEndTime(new Date());
      setIsGameStarted(false);
      setTimer(0);
      // Calculate and emit user results to the server
      const timeInSeconds = (endTime - startTime) / 1000;
      const wordsTyped = userInput.trim().split(/\s+/).length;
      const calculatedWpm = Math.round((wordsTyped / timeInSeconds) * 60);
      socket.emit('game-results', { wpm: calculatedWpm });
    }
  }, [isGameStarted, timer, endTime, startTime, userInput]);

  useEffect(() => {
    if (endTime && percentageCompleted < 100) {
      const timeInSeconds = (endTime - startTime) / 1000;
      const wordsTyped = userInput.trim().split(/\s+/).length;
      const calculatedWpm = Math.round((wordsTyped / timeInSeconds) * 60);
      setWpm(Math.max(calculatedWpm, 0));
      // Emit typing progress to the server for the opponent to see
      socket.emit('opponent-typing', { userInput, endTime, wpm: calculatedWpm });
    }
  }, [endTime, percentageCompleted, startTime, userInput]);

  const getRandomStringFromArray = (array) => {
    if (!Array.isArray(array) || array.length === 0) {
      return null;
    }

    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  };

  const handleInputChange = (e) => {
    const { value } = e.target;
    setUserInput(value);

    // Calculate WPM, accuracy, and percentage completed in real-time
    const trimmedUserInput = value.trim();
    setWordCount(trimmedUserInput.split(/\s+/).length);

    const correctWords = text.trim().split(/\s+/);
    const typedWords = trimmedUserInput.split(/\s+/);

    let correctWordCount = 0;
    typedWords.forEach((word, index) => {
      if (word === correctWords[index]) {
        correctWordCount++;
      }
    });

    setAccuracy((correctWordCount / typedWords.length) * 100);
    setPercentageCompleted((trimmedUserInput.length / text.length) * 100);
  };

  const handleTextAreaClick = (e) => {
    if (!isGameStarted || endTime) {
      e.preventDefault();
    }
  };

  const isCorrectWord = (typedWord, correctWord) => typedWord === correctWord;

  return (
    <div className={`flex flex-col justify-center items-center h-screen ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className={`max-w-[600px] mx-auto my-8 p-4 border rounded-lg shadow ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`}>
        <h1 className={`text-2xl font-bold text-center mb-4 ${isDarkMode ? 'text-white' : 'text-black'}`}>Typing Test</h1>
        <div
          className={`h-40 overflow-y-scroll bg-gray-100 p-4 rounded-lg mb-4 ${
            isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
          }`}
          onCopy={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
        >
          {text.split(' ').map((word, index) => {
            const typedWord = userInput.trim().split(/\s+/)[index] || '';
            const isCorrect = isCorrectWord(typedWord, word);
            const color = isCorrect ? 'green' : 'red';

            return (
              <span key={index} style={{ color }}>
                {word}{' '}
              </span>
            );
          })}
        </div>
        <textarea
          className={`w-full p-2 border rounded mb-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
          rows="5"
          value={userInput}
          onChange={handleInputChange}
          onClick={handleTextAreaClick}
          disabled={!isGameStarted || endTime}
          placeholder="Start typing here..."
          style={{ caretColor: 'transparent' }}
        />
        <div className="text-center">
          {endTime || timer === 0 ? (
            <p className="text-green-600 font-bold">Time: {((endTime || 0) - startTime) / 1000} seconds</p>
          ) : (
            <p className="text-blue-600 font-bold">Time Remaining: {timer}s</p>
          )}
          <p className="text-gray-400">Your WPM: {wpm}</p>
          <p className="text-gray-400">Opponent's WPM: {opponentWpm}</p>
          <p className="text-gray-400">
            Percentage Completed: {percentageCompleted > 100 ? 100 : percentageCompleted.toFixed(2)}%
          </p>
          <p className="text-gray-400">Your Accuracy: {accuracy.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
};

export default MultiplayerTypingTestGame;
