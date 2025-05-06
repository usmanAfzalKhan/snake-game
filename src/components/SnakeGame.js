import React, { useState, useEffect, useRef } from 'react';
import './SnakeGame.css';

const BOARD_SIZE = 20;
const SPEED = 120;
const INITIAL_SNAKE = [[10, 10]];
const INITIAL_FOOD = [5, 5];

const SnakeGame = () => {
  const [snakeState, setSnakeState] = useState(INITIAL_SNAKE);
  const [foodState, setFoodState] = useState(INITIAL_FOOD);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const snakeRef = useRef(INITIAL_SNAKE);
  const foodRef = useRef(INITIAL_FOOD);
  const directionRef = useRef('RIGHT');
  const directionQueueRef = useRef([]);
  const intervalRef = useRef(null);

  const isOpposite = (dir1, dir2) => {
    return (
      (dir1 === 'UP' && dir2 === 'DOWN') ||
      (dir1 === 'DOWN' && dir2 === 'UP') ||
      (dir1 === 'LEFT' && dir2 === 'RIGHT') ||
      (dir1 === 'RIGHT' && dir2 === 'LEFT')
    );
  };

  const handleKeyDown = (e) => {
    const keyMap = {
      ArrowUp: 'UP',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      ArrowRight: 'RIGHT',
    };
    const newDir = keyMap[e.key];
    if (newDir) {
      const lastInQueue = directionQueueRef.current.slice(-1)[0] || directionRef.current;
      if (!isOpposite(lastInQueue, newDir) && lastInQueue !== newDir) {
        directionQueueRef.current.push(newDir);
      }
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const moveSnake = () => {
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
    switch (dir) {
      case 'UP': head[0] -= 1; break;
      case 'DOWN': head[0] += 1; break;
      case 'LEFT': head[1] -= 1; break;
      case 'RIGHT': head[1] += 1; break;
      default: break;
    }

    if (head[0] < 0 || head[0] >= BOARD_SIZE || head[1] < 0 || head[1] >= BOARD_SIZE) {
      clearInterval(intervalRef.current);
      setIsGameOver(true);
      setIsRunning(false);
      return;
    }

    if (snake.some(([r, c]) => r === head[0] && c === head[1])) {
      clearInterval(intervalRef.current);
      setIsGameOver(true);
      setIsRunning(false);
      return;
    }

    const hasEaten = head[0] === food[0] && head[1] === food[1];
    const newSnake = hasEaten ? [head, ...snake] : [head, ...snake.slice(0, -1)];

    snakeRef.current = newSnake;
    setSnakeState(newSnake);

    if (hasEaten) {
      let newFood;
      let attempts = 0;
      do {
        newFood = [
          Math.floor(Math.random() * BOARD_SIZE),
          Math.floor(Math.random() * BOARD_SIZE),
        ];
        attempts++;
      } while (newSnake.some(seg => seg[0] === newFood[0] && seg[1] === newFood[1]) && attempts < 100);
      foodRef.current = newFood;
      setFoodState(newFood);
    }
  };

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(moveSnake, SPEED);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const resetGame = () => {
    const freshSnake = [[10, 10]];
    const freshFood = [5, 5];

    setIsGameOver(false);
    setSnakeState(freshSnake);
    setFoodState(freshFood);
    setIsRunning(false);

    snakeRef.current = freshSnake;
    foodRef.current = freshFood;
    directionRef.current = 'RIGHT';
    directionQueueRef.current = [];
  };

  const renderBoard = () => {
    const grid = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const isSnake = snakeState.some(([r, c]) => r === row && c === col);
        const isFood = foodState[0] === row && foodState[1] === col;
        grid.push(
          <div
            key={`${row}-${col}`}
            className={`cell ${isSnake ? 'snake' : ''} ${isFood ? 'food' : ''}`}
          />
        );
      }
    }
    return grid;
  };

  return (
    <div className="snake-container">
      <div className="board">{renderBoard()}</div>
      {isGameOver && <p className="game-over">Game Over!</p>}
      <div className="game-controls">
        <button onClick={() => setIsRunning(prev => !prev)}>
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button onClick={resetGame}>Reset</button>
      </div>
    </div>
  );
};

export default SnakeGame;
