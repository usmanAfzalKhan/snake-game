import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} from 'react';
import './SnakeGame.css';

import pauseIcon from '../images/pause.png';
import resumeIcon from '../images/resume.png';
import restartIcon from '../images/restart.png';

const BOARD_SIZE = 20;
const SPEED = 120;
const INITIAL_SNAKE = [[10, 10]];
const INITIAL_FOOD = [5, 5];

const SnakeGame = () => {
  const [snakeState, setSnakeState] = useState(INITIAL_SNAKE);
  const [foodState, setFoodState] = useState(INITIAL_FOOD);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [score, setScore] = useState(0);

  const snakeRef = useRef(INITIAL_SNAKE);
  const foodRef = useRef(INITIAL_FOOD);
  const directionRef = useRef('RIGHT');
  const directionQueueRef = useRef([]);
  const lastMoveTimeRef = useRef(performance.now());
  const requestRef = useRef(null);

  const eatSound = useRef(new Audio(require('../images/eat.mp3')));
  const gameOverSound = useRef(new Audio(require('../images/gameover.mp3')));
  const collisionSound = useRef(new Audio(require('../images/collision.mp3')));

  useEffect(() => {
    eatSound.current.load();
    collisionSound.current.load();
    gameOverSound.current.load();
  }, []);

  const isOpposite = (dir1, dir2) => (
    (dir1 === 'UP' && dir2 === 'DOWN') ||
    (dir1 === 'DOWN' && dir2 === 'UP') ||
    (dir1 === 'LEFT' && dir2 === 'RIGHT') ||
    (dir1 === 'RIGHT' && dir2 === 'LEFT')
  );

  const handleKeyDown = (e) => {
    const keyMap = {
      ArrowUp: 'UP',
      ArrowDown: 'DOWN',
      ArrowLeft: 'LEFT',
      ArrowRight: 'RIGHT',
    };
    const newDir = keyMap[e.key];
    if (newDir) {
      const last = directionQueueRef.current.slice(-1)[0] || directionRef.current;
      if (!isOpposite(last, newDir) && last !== newDir) {
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
    if (dir === 'UP') head[0]--;
    if (dir === 'DOWN') head[0]++;
    if (dir === 'LEFT') head[1]--;
    if (dir === 'RIGHT') head[1]++;

    const hitWall = head[0] < 0 || head[0] >= BOARD_SIZE || head[1] < 0 || head[1] >= BOARD_SIZE;
    const hitSelf = snake.some(([r, c]) => r === head[0] && c === head[1]);

    if (hitWall || hitSelf) {
      setIsGameOver(true);
      setIsRunning(false);
      if (soundOn) {
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

    if (hasEaten && soundOn) {
      eatSound.current.pause();
      eatSound.current.currentTime = 0;
      eatSound.current.playbackRate = 1.7;
      eatSound.current.play();
    }

    if (hasEaten) {
      setScore(prev => prev + 1);

      let newFood;
      do {
        newFood = [
          Math.floor(Math.random() * BOARD_SIZE),
          Math.floor(Math.random() * BOARD_SIZE),
        ];
      } while (newSnake.some(seg => seg[0] === newFood[0] && seg[1] === newFood[1]));
      foodRef.current = newFood;
      setFoodState(newFood);
    }
  }, [soundOn]);

  const animate = useCallback((time) => {
    if (!isRunning || isGameOver) return;

    const elapsed = time - lastMoveTimeRef.current;
    if (elapsed > SPEED) {
      moveSnake();
      lastMoveTimeRef.current = time;
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [isRunning, isGameOver, moveSnake]);

  useEffect(() => {
    if (isRunning) {
      lastMoveTimeRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(requestRef.current);
  }, [isRunning, animate]);

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
    setScore(0);
    setIsRunning(false);
    setHasStarted(false);
    setIsGameOver(false);

    snakeRef.current = freshSnake;
    foodRef.current = freshFood;
    directionRef.current = 'RIGHT';
    directionQueueRef.current = [];
    lastMoveTimeRef.current = performance.now();
  };

  const toggleSound = () => setSoundOn(prev => !prev);

  const board = useMemo(() => {
    const grid = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const isSnake = snakeState.some(([r, c]) => r === row && c === col);
        const isHead = row === snakeState[0][0] && col === snakeState[0][1];
        const isFood = foodState[0] === row && foodState[1] === col;
        const isEven = (row + col) % 2 === 0;

        const cellClass = `cell ${isEven ? 'light-cell' : 'dark-cell'} ${isFood ? 'food' : ''}`;
        grid.push(
          <div
            key={`${row}-${col}`}
            className={
              isHead ? `${cellClass} snake-head` : isSnake ? `${cellClass} snake` : cellClass
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
  }, [snakeState, foodState, isGameOver]);

  return (
    <div className="snake-container">
      <h2 style={{ marginBottom: '5px' }}>Welcome to Snake Game</h2>
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
        <button
          className="control-icon"
          onClick={toggleSound}
          style={{
            backgroundColor: 'rgba(255,255,255,0.15)',
            border: 'none',
            fontSize: '18px',
            lineHeight: '1',
          }}
        >
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>
      <h4 style={{ margin: '10px 0' }}>Score: {score}</h4>
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
