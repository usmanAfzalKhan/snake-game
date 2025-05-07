// React core imports
import React, {
  useState,      // to store state variables
  useEffect,     // to run code on component mount or update
  useRef,        // to persist variables without causing re-renders
  useCallback,   // to memoize functions for performance
  useMemo        // to memoize computed results (like rendering the board)
} from "react";

// Game styling
import "./SnakeGame.css";

// Firebase imports
import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Web Audio API handlers and sound files
import { loadSound, playSound } from "../utils/audioManager";
import eatSoundFile from "../images/eat.mp3";
import gameOverSoundFile from "../images/gameover.mp3";
import collisionSoundFile from "../images/collision.mp3";

// UI icons
import pauseIcon from "../images/pause.png";
import resumeIcon from "../images/resume.png";
import restartIcon from "../images/restart.png";

// Game speed in milliseconds
// Controls how often the snake moves. Lower = faster snake.
const SPEED = 100;

// Check if user is playing on a mobile device
const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent);

// Main functional component for the Snake Game
// Manages game state, input, rendering, and logic.
const SnakeGame = () => {
  // Board size depending on screen size
  const [boardSize, setBoardSize] = useState(window.innerWidth < 500 ? 12 : 20);

  // Snake's current segments (head is index 0)
  const [snakeState, setSnakeState] = useState([]);

  // Food location on the board
  const [foodState, setFoodState] = useState([5, 5]);

  // Game status flags
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // Sound toggle
  const [soundOn, setSoundOn] = useState(true);

  // Player score
  const [score, setScore] = useState(0);

  // Refs to persist values between renders
  const snakeRef = useRef([]);
  const foodRef = useRef([5, 5]);
  const directionRef = useRef("RIGHT");
  const directionQueueRef = useRef([]); // Stores pending direction changes
  const lastMoveTimeRef = useRef(performance.now()); // For tracking time between moves
  const requestRef = useRef(null); // requestAnimationFrame ID

  // Load sound files into memory for instant playback
  useEffect(() => {
    const initSounds = async () => {
      await loadSound("eat", eatSoundFile);
      await loadSound("collision", collisionSoundFile);
      await loadSound("gameover", gameOverSoundFile);
    };
    initSounds();
  }, []);

  // Adjust the game board size when screen resizes
  useEffect(() => {
    const handleResize = () => {
      const newSize = window.innerWidth < 500 ? 12 : 20;
      setBoardSize(newSize);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set initial snake position at the board's center
  useEffect(() => {
    const center = Math.floor(boardSize / 2);
    const centeredSnake = [[center, center]];
    setSnakeState(centeredSnake);
    snakeRef.current = centeredSnake;
  }, [boardSize]);

  // Prevent browser scroll during touch events (important for mobile)
  useEffect(() => {
    const preventScroll = (e) => e.preventDefault();
    document.body.addEventListener("touchmove", preventScroll, { passive: false });
    return () => document.body.removeEventListener("touchmove", preventScroll);
  }, []);

  // Save score to Firebase if user is logged in
  const saveScoreToDB = async (score) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    try {
      await addDoc(collection(db, "scores"), {
        userId: user.uid,
        score,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error saving score:", err);
    }
  };

  // Prevent invalid direction reversals
  const isOpposite = useCallback(
    (dir1, dir2) =>
      (dir1 === "UP" && dir2 === "DOWN") ||
      (dir1 === "DOWN" && dir2 === "UP") ||
      (dir1 === "LEFT" && dir2 === "RIGHT") ||
      (dir1 === "RIGHT" && dir2 === "LEFT"),
    []
  );

  // Resets game state when player restarts
  const resetGame = useCallback(() => {
    const center = Math.floor(boardSize / 2);
    const freshSnake = [[center, center]];
    const freshFood = [5, 5];
    setSnakeState(freshSnake);
    setFoodState(freshFood);
    setScore(0);
    setIsRunning(false);
    setHasStarted(false);
    setIsGameOver(false);
    snakeRef.current = freshSnake;
    foodRef.current = freshFood;
    directionRef.current = "RIGHT";
    directionQueueRef.current = [];
    lastMoveTimeRef.current = performance.now();
  }, [boardSize]);

  // Handle keyboard input (arrows and spacebar)
  const handleKeyDown = useCallback(
    (e) => {
      const keyMap = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
      };
      const newDir = keyMap[e.key];

      // Start or restart game on spacebar
      if (e.code === "Space") {
        e.preventDefault();
        if (isGameOver) {
          resetGame();
        }
        setIsRunning((prev) => {
          if (!hasStarted) setHasStarted(true);
          return !prev;
        });
        return;
      }

      // Queue direction change if valid
      if (newDir) {
        const last = directionQueueRef.current.slice(-1)[0] || directionRef.current;
        if (!isOpposite(last, newDir) && last !== newDir) {
          directionQueueRef.current.push(newDir);
        }
      }
    },
    [isOpposite, isGameOver, hasStarted, resetGame]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Handle swipe gestures on mobile devices
  useEffect(() => {
    let startX = 0, startY = 0;
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        const newDir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "RIGHT" : "LEFT") : (dy > 0 ? "DOWN" : "UP");
        const last = directionQueueRef.current.slice(-1)[0] || directionRef.current;
        if (!isOpposite(last, newDir) && last !== newDir) {
          directionQueueRef.current.push(newDir);
        }
      }
    };
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpposite]);

  // Core game loop: update snake position and check collisions
  const moveSnake = useCallback(() => {
    const snake = [...snakeRef.current];
    const food = foodRef.current;

    if (directionQueueRef.current.length > 0) {
      const nextDir = directionQueueRef.current.shift();
      if (!isOpposite(directionRef.current, nextDir)) {
        directionRef.current = nextDir;
      }
    }

    const dir = directionRef.current;
    const head = [...snake[0]];
    if (dir === "UP") head[0]--;
    if (dir === "DOWN") head[0]++;
    if (dir === "LEFT") head[1]--;
    if (dir === "RIGHT") head[1]++;

    // Check wall and self collisions
    const hitWall = head[0] < 0 || head[0] >= boardSize || head[1] < 0 || head[1] >= boardSize;
    const hitSelf = snake.some(([r, c]) => r === head[0] && c === head[1]);

    if (hitWall || hitSelf) {
      setIsGameOver(true);
      setIsRunning(false);
      saveScoreToDB(score);
      if (soundOn && !isMobileDevice) {
        playSound("collision");
        setTimeout(() => playSound("gameover"), 200);
      }
      cancelAnimationFrame(requestRef.current);
      return;
    }

    const hasEaten = head[0] === food[0] && head[1] === food[1];
    const newSnake = hasEaten ? [head, ...snake] : [head, ...snake.slice(0, -1)];
    snakeRef.current = newSnake;
    setSnakeState(newSnake);

    // Play sound if food is eaten
    if (hasEaten && soundOn && !isMobileDevice) {
      playSound("eat", 1.7);
    }

    // Generate new food
    if (hasEaten) {
      setScore((prev) => prev + 1);
      let newFoodCandidate = [0, 0];
      let isOnSnake = true;
      const isOccupied = ([r, c]) => r === newFoodCandidate[0] && c === newFoodCandidate[1];
      while (isOnSnake) {
        newFoodCandidate = [
          Math.floor(Math.random() * boardSize),
          Math.floor(Math.random() * boardSize),
        ];
        isOnSnake = newSnake.some(isOccupied);
      }
      foodRef.current = newFoodCandidate;
      setFoodState(newFoodCandidate);
    }
  }, [soundOn, score, boardSize, isOpposite]);

  // Request animation frame loop
  const animate = useCallback(
    (time) => {
      if (!isRunning || isGameOver) {
        cancelAnimationFrame(requestRef.current);
        return;
      }
      const elapsed = time - lastMoveTimeRef.current;
      if (elapsed >= SPEED) {
        moveSnake();
        lastMoveTimeRef.current = time;
      }
      requestRef.current = requestAnimationFrame(animate);
    },
    [isRunning, isGameOver, moveSnake]
  );

  useEffect(() => {
    if (isRunning) {
      lastMoveTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, animate]);

  const toggleGame = () => {
    if (isGameOver) resetGame();
    setIsRunning((prev) => {
      if (!hasStarted) setHasStarted(true);
      return !prev;
    });
  };

  const toggleSound = () => setSoundOn((prev) => !prev);

  // Render game board cells
  const board = useMemo(() => {
    if (!snakeState.length) return null;
    const grid = [];
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const isSnake = snakeState.some(([r, c]) => r === row && c === col);
        const isHead = row === snakeState[0][0] && col === snakeState[0][1];
        const isFood = foodState[0] === row && foodState[1] === col;
        const isEven = (row + col) % 2 === 0;

        const cellClass = `cell ${isEven ? "light-cell" : "dark-cell"} ${
          isFood ? "food" : ""
        }`;
        grid.push(
          <div
            key={`${row}-${col}`}
            className={
              isHead
                ? `${cellClass} snake-head`
                : isSnake
                ? `${cellClass} snake`
                : cellClass
            }
          >
            {isHead && (
              <div className="snake-face">
                {isGameOver ? "XX" : "👀"}
                <span className="snake-mouth">👅</span>
              </div>
            )}
            {isFood && "🍎"}
          </div>
        );
      }
    }
    return grid;
  }, [snakeState, foodState, isGameOver, boardSize]);

  return (
    <div className="snake-container">
      <div className="controls-under-header">
        <img
          src={isRunning ? pauseIcon : resumeIcon}
          alt={isRunning ? "Pause" : "Resume"}
          className="control-icon"
          onClick={toggleGame}
        />
        {hasStarted && (
          <img
            src={restartIcon}
            alt="Restart"
            className="control-icon"
            onClick={resetGame}
          />
        )}
        <button className="sound-toggle" onClick={toggleSound}>
          {soundOn ? "🔊" : "🔇"}
        </button>
      </div>
      <p className="score-display">Score: {score}</p>
      <div className="board-wrapper">
        <div className="board">{board}</div>
        {isGameOver && <div className="game-over-message">Game Over!</div>}
      </div>
      <div style={{ marginTop: '40px', color: '#aaa', fontSize: '12px' }}>
        <p>Tip: Use your arrow keys to control the snake. On desktop, zoom out for a better experience!</p>
      </div>
    </div>
  );
};

export default SnakeGame;
