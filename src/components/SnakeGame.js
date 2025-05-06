import React, { useState, useEffect, useRef, useCallback } from 'react';
import './SnakeGame.css';

import pauseIcon from '../images/pause.png';
import resumeIcon from '../images/resume.png';
import restartIcon from '../images/restart.png';

const BOARD_SIZE = 20;
const SPEED = 90; // Faster for smoother feel
const INITIAL_SNAKE = [[10, 10]];
const INITIAL_FOOD = [5, 5];

const SnakeGame = () => {
  const [snakeState, setSnakeState] = useState(INITIAL_SNAKE);
  const [foodState, setFoodState] = useState(INITIAL_FOOD);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [score, setScore] = useState(0);

  const snakeRef = useRef(INITIAL_SNAKE);
  const foodRef = useRef(INITIAL_FOOD);
  const directionRef = useRef('RIGHT');
  const directionQueueRef = useRef([]);
  const lastMoveTimeRef = useRef(0);

  const isOpposite = (dir1, dir2) =>
    (dir1 === 'UP' && dir2 === 'DOWN') ||
    (dir1 === 'DOWN' && dir2 === 'UP') ||
    (dir1 === 'LEFT' && dir2 === 'RIGHT') ||
    (dir1 === 'RIGHT' && dir2 === 'LEFT');

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
    switch (dir) {
      case 'UP': head[0] -= 1; break;
      case 'DOWN': head[0] += 1; break;
      case 'LEFT': head[1] -= 1; break;
      case 'RIGHT': head[1] += 1; break;
    }

    const collided =
      head[0] < 0 || head[0] >= BOARD_SIZE || head[1] < 0 || head[1] >= BOARD_SIZE ||
      snake.some(([r, c]) => r === head[0] && c === head[1]);

    if (collided) {
      setIsGameOver(true);
      setIsRunning(false);
      return;
    }

    const hasEaten = head[0] === food[0] && head[1] === food[1];
    const newSnake = hasEaten ? [head, ...snake] : [head, ...snake.slice(0, -1)];

    snakeRef.current = newSnake;
    setSnakeState(newSnake);

    if (hasEaten) {
      setScore(prev => prev + 1);
      let newFood, attempts = 0;
      do {
        newFood = [
          Math.floor(Math.random() * BOARD_SIZE),
          Math.floor(Math.random() * BOARD_SIZE),
        ];
        attempts++;
      } while (newSnake.some(([r, c]) => r === newFood[0] && c === newFood[1]) && attempts < 100);
      foodRef.current = newFood;
      setFoodState(newFood);
    }
  }, []);

  useEffect(() => {
    let animationFrameId;

    const animate = (time) => {
      if (!isRunning) return;
      if (time - lastMoveTimeRef.current > SPEED) {
        moveSnake();
        lastMoveTimeRef.current = time;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    if (isRunning) {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, moveSnake]);

  const toggleGame = () => {
    if (isGameOver) resetGame();
    setIsRunning(prev => {
      if (!hasStarted) setHasStarted(true);
      return !prev;
    });
  };

  const resetGame = () => {
    const freshSnake = [[10, 10]];
    const freshFood = [5, 5];

    setSnakeState(freshSnake);
    setFoodState(freshFood);
    setIsRunning(false);
    setHasStarted(false);
    setIsGameOver(false);
    setScore(0);

    snakeRef.current = freshSnake;
    foodRef.current = freshFood;
    directionRef.current = 'RIGHT';
    directionQueueRef.current = [];
    lastMoveTimeRef.current = 0;
  };

  const renderBoard = () => {
    const grid = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const isSnake = snakeState.some(([r, c]) => r === row && c === col);
        const isHead = row === snakeState[0][0] && col === snakeState[0][1];
        const isFood = foodState[0] === row && foodState[1] === col;
        const isEven = (row + col) % 2 === 0;
  
        const cellClasses = `cell ${isEven ? 'light-cell' : 'dark-cell'} ${isFood ? 'food' : ''}`;
        grid.push(
          <div
            key={`${row}-${col}`}
            className={
              isHead ? `${cellClasses} snake-head` : isSnake ? `${cellClasses} snake` : cellClasses
            }
          >
            {isHead && (
              <div className="snake-face">
                {isGameOver ? 'XX' : '👀'}
                <span className="snake-mouth">👅</span>
              </div>
            )}
            {isFood && '🍎'}
          </div>
        );
      }
    }
    return grid;
  };
  

  return (
    <div className="snake-container">
      <h2 style={{ marginBottom: '5px' }}>Welcome to Snake Game</h2>
      <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>
        Score: {score}
      </div>
      <div className="controls-under-header" style={{ marginBottom: '2px' }}>
        <img
          src={isRunning ? pauseIcon : resumeIcon}
          alt={isRunning ? 'Pause' : 'Resume'}
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
      </div>
      <div className="board-wrapper">
        <div className="board">
          {renderBoard()}
          {isGameOver && <div className="game-over-message">Game Over!</div>}
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
