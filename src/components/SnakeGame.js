// SnakeGame.js - Responsive Snake Game with Firebase Score Logging, Mobile Support, and Optimized Gameplay

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import "./SnakeGame.css";
import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

// Control icons
import pauseIcon from "../images/pause.png";
import resumeIcon from "../images/resume.png";
import restartIcon from "../images/restart.png";

// Game settings
const SPEED = 100; // milliseconds between frames
const isMobileDevice = /Mobi|Android/i.test(navigator.userAgent); // Check for mobile

const SnakeGame = () => {
  // Game state
  const [boardSize, setBoardSize] = useState(window.innerWidth < 500 ? 12 : 20);
  const [snakeState, setSnakeState] = useState([]);
  const [foodState, setFoodState] = useState([5, 5]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [score, setScore] = useState(0);

  // References to mutable state (avoid re-renders)
  const snakeRef = useRef([]);
  const foodRef = useRef([5, 5]);
  const directionRef = useRef("RIGHT");
  const directionQueueRef = useRef([]);
  const lastMoveTimeRef = useRef(performance.now());
  const requestRef = useRef(null);

  // Audio
  const eatSound = useRef(new Audio(require("../images/eat.mp3")));
  const gameOverSound = useRef(new Audio(require("../images/gameover.mp3")));
  const collisionSound = useRef(new Audio(require("../images/collision.mp3")));

  // Preload audio on mount
  useEffect(() => {
    eatSound.current.load();
    collisionSound.current.load();
    gameOverSound.current.load();
  }, []);

  // Handle dynamic board size
  useEffect(() => {
    const handleResize = () => {
      setBoardSize(window.innerWidth < 500 ? 12 : 20);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Center snake at start
  useEffect(() => {
    const center = Math.floor(boardSize / 2);
    const centeredSnake = [[center, center]];
    setSnakeState(centeredSnake);
    snakeRef.current = centeredSnake;
  }, [boardSize]);

  // 🚫 Prevent mobile scrolling during touch (UX fix)
  useEffect(() => {
    const preventScroll = (e) => e.preventDefault();
    document.body.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      document.body.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  // 🔄 Save score to Firebase
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

  // Direction logic: prevent reversing into self
  const isOpposite = useCallback(
    (dir1, dir2) =>
      (dir1 === "UP" && dir2 === "DOWN") ||
      (dir1 === "DOWN" && dir2 === "UP") ||
      (dir1 === "LEFT" && dir2 === "RIGHT") ||
      (dir1 === "RIGHT" && dir2 === "LEFT"),
    []
  );

  // 🎮 Handle keyboard input
  const handleKeyDown = useCallback(
    (e) => {
      const keyMap = {
        ArrowUp: "UP",
        ArrowDown: "DOWN",
        ArrowLeft: "LEFT",
        ArrowRight: "RIGHT",
      };
      const newDir = keyMap[e.key];
      if (newDir) {
        const last = directionQueueRef.current.slice(-1)[0] || directionRef.current;
        if (!isOpposite(last, newDir) && last !== newDir) {
          directionQueueRef.current.push(newDir);
        }
      }
    },
    [isOpposite]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // 📱 Handle mobile swipe input
  useEffect(() => {
    let startX = 0,
      startY = 0;
    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        const newDir =
          Math.abs(dx) > Math.abs(dy)
            ? dx > 0 ? "RIGHT" : "LEFT"
            : dy > 0 ? "DOWN" : "UP";
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

  // 🐍 Move the snake
  const moveSnake = useCallback(() => {
    const snake = [...snakeRef.current];
    const food = foodRef.current;

    // Apply new direction from queue
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

    // Collision detection
    const hitWall = head[0] < 0 || head[0] >= boardSize || head[1] < 0 || head[1] >= boardSize;
    const hitSelf = snake.some(([r, c]) => r === head[0] && c === head[1]);

    if (hitWall || hitSelf) {
      setIsGameOver(true);
      setIsRunning(false);
      saveScoreToDB(score);
      if (soundOn && !isMobileDevice) {
        collisionSound.current.currentTime = 0;
        collisionSound.current.play();
        setTimeout(() => {
          gameOverSound.current.currentTime = 0;
          gameOverSound.current.play();
        }, 200);
      }
      cancelAnimationFrame(requestRef.current);
      return;
    }

    const hasEaten = head[0] === food[0] && head[1] === food[1];
    const newSnake = hasEaten ? [head, ...snake] : [head, ...snake.slice(0, -1)];

    snakeRef.current = newSnake;
    setSnakeState(newSnake);

    if (hasEaten && soundOn && !isMobileDevice) {
      try {
        eatSound.current.pause();
        eatSound.current.currentTime = 0;
        eatSound.current.playbackRate = 1.7;
        eatSound.current.play();
      } catch (err) {
        console.warn("Eat sound error:", err.message);
      }
    }

    // 🍎 Re-spawn food in random location not on snake
    if (hasEaten) {
      setScore((prev) => prev + 1);

      let newFoodCandidate = [0, 0];
      let isOnSnake = true;
      const isOccupied = ([r, c]) =>
        r === newFoodCandidate[0] && c === newFoodCandidate[1];

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

  // 🎞️ Game animation loop
  const animate = useCallback(
    (time) => {
      if (!isRunning || isGameOver) return;
      const elapsed = time - lastMoveTimeRef.current;
      if (elapsed > SPEED) {
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

  // 🎮 Controls
  const toggleGame = () => {
    if (isGameOver) resetGame();
    setIsRunning((prev) => {
      if (!hasStarted) setHasStarted(true);
      return !prev;
    });
  };

  const resetGame = () => {
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
  };

  const toggleSound = () => setSoundOn((prev) => !prev);

  // 🧱 Render the game board
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
      <h4 className="score-display">Score: {score}</h4>
      <div className="board-wrapper">
        <div className="board">
          {board}
          {isGameOver && <div className="game-over-message">Game Over!</div>}
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
