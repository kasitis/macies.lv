
import React, { useState, useEffect, useCallback, FormEvent } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppView, GameDifficulty, OperationType, GameMode } from '@/types.ts';
import Icon from './Icon.tsx';

type GameState = 'setup' | 'playing' | 'gameOver';

interface Problem {
  text: string;
  answer: number;
}

const GAME_DURATION_SECONDS = 60;

const NumberCruncherView: React.FC = () => {
  const { translate, dispatch } = useAppContext();

  const [gameState, setGameState] = useState<GameState>('setup');
  const [difficulty, setDifficulty] = useState<GameDifficulty>(GameDifficulty.EASY);
  const [gameMode, setGameMode] = useState<GameMode>(OperationType.ADD);
  
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(GAME_DURATION_SECONDS);
  const [feedback, setFeedback] = useState<string>('');
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const answerInputRef = React.useRef<HTMLInputElement>(null);
  const inputBaseClasses = "block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400";


  const generateProblem = useCallback((): Problem => {
    let num1: number, num2: number, answer: number, problemText: string;
    let operationToUse = gameMode;

    if (gameMode === 'mixed') {
        const operations = [OperationType.ADD, OperationType.SUBTRACT, OperationType.MULTIPLY, OperationType.DIVIDE];
        operationToUse = operations[Math.floor(Math.random() * operations.length)];
    }

    const getRange = (d: GameDifficulty): [number, number, number] => {
        switch(d) {
            case GameDifficulty.MEDIUM: return [0, 50, 100]; 
            case GameDifficulty.HARD: return [0, 100, 200];  
            case GameDifficulty.EASY: 
            default: return [0, 10, 20]; 
        }
    };
    const [minOp, maxOp, ] = getRange(difficulty);

    const getMultiplierRange = (d: GameDifficulty): [number, number] => {
        switch(d) {
            case GameDifficulty.MEDIUM: return [0, 12];
            case GameDifficulty.HARD: return [-10, 20]; // Allow negative for hard mode multiplication
            case GameDifficulty.EASY:
            default: return [0, 5];
        }
    }
    const [minMult, maxMultOp] = getMultiplierRange(difficulty);


    switch (operationToUse) {
      case OperationType.ADD:
        num1 = Math.floor(Math.random() * (maxOp + 1)) + minOp;
        num2 = Math.floor(Math.random() * (maxOp + 1)) + minOp;
        if (difficulty === GameDifficulty.HARD) { // Allow negatives
            num1 = Math.floor(Math.random() * (maxOp - minOp + 1)) + minOp - (maxOp/2);
            num2 = Math.floor(Math.random() * (maxOp - minOp + 1)) + minOp - (maxOp/2);
        }
        answer = num1 + num2;
        problemText = `${num1} + ${num2} = ?`;
        break;
      case OperationType.SUBTRACT:
        num1 = Math.floor(Math.random() * (maxOp + 1)) + minOp;
        if (difficulty === GameDifficulty.HARD) {
            num2 = Math.floor(Math.random() * (maxOp + 1)) + minOp;
        } else {
             num2 = Math.floor(Math.random() * (num1 + 1)) + minOp; // Ensure num2 <= num1 for non-negative for Easy/Medium
        }
        answer = num1 - num2;
        problemText = `${num1} - ${num2} = ?`;
        break;
      case OperationType.MULTIPLY:
        num1 = Math.floor(Math.random() * (maxMultOp - minMult + 1)) + minMult;
        num2 = Math.floor(Math.random() * (maxMultOp - minMult + 1)) + minMult;
        answer = num1 * num2;
        problemText = `${num1} × ${num2} = ?`;
        break;
      case OperationType.DIVIDE:
        num2 = Math.floor(Math.random() * (maxMultOp > 0 ? maxMultOp : 10)) + (minMult >= 0 ? 1 : minMult); // Divisor > 0 or appropriate range
        if (num2 === 0) num2 = 1; // Ensure divisor is not zero
        answer = Math.floor(Math.random() * (maxMultOp > 0 ? maxMultOp : 10)) + (minMult >= 0 ? 0 : minMult); 
        num1 = num2 * answer; 
        problemText = `${num1} ÷ ${num2} = ?`;
        break;
      default: 
        num1 = 1; num2 = 1; answer = 2; problemText = '1 + 1 = ?';
    }
    return { text: problemText, answer };
  }, [difficulty, gameMode]);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(GAME_DURATION_SECONDS);
    setCurrentProblem(generateProblem());
    setUserAnswer('');
    setFeedback('');
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setGameState('gameOver');
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    answerInputRef.current?.focus();
  };

  const handleAnswerSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (userAnswer === '' || !currentProblem) return;

    const userAnswerNum = parseInt(userAnswer, 10);
    if (!isNaN(userAnswerNum) && userAnswerNum === currentProblem.answer) {
      setScore(prevScore => prevScore + 10);
      setFeedback(translate('ncCorrect'));
    } else {
      setScore(prevScore => prevScore > 5 ? prevScore - 5 : 0);
      setFeedback(`${translate('ncIncorrect')} ${currentProblem.text.replace('?', String(currentProblem.answer))}`);
    }
    setCurrentProblem(generateProblem());
    setUserAnswer('');
    answerInputRef.current?.focus();
  };
  
  useEffect(() => {
    return () => { 
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && answerInputRef.current) {
        answerInputRef.current.focus();
    }
  }, [gameState, currentProblem]);


  if (gameState === 'setup') {
    return (
      <div className="flex flex-col items-center space-y-6 p-4 max-w-lg mx-auto">
        <div className="flex justify-between w-full items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
            {translate('numberCruncherGameTitle')}
            </h1>
            <button
            onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.GAMES_HUB } })}
            className="py-1.5 px-3 text-xs rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1"
            >
            <Icon name="arrow-left" size="0.8em" /> {translate('navBackToGamesHub')}
            </button>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 text-center leading-relaxed">{translate('numberCruncherGameDesc')}</p>

        <div className="w-full space-y-4 pt-2">
          <div>
            <label htmlFor="nc-difficulty" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{translate('ncSelectDifficulty')}</label>
            <select id="nc-difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as GameDifficulty)}
              className={inputBaseClasses}>
              <option value={GameDifficulty.EASY}>{translate('ncDifficultyEasy')}</option>
              <option value={GameDifficulty.MEDIUM}>{translate('ncDifficultyMedium')}</option>
              <option value={GameDifficulty.HARD}>{translate('ncDifficultyHard')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="nc-mode" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{translate('ncSelectMode')}</label>
            <select id="nc-mode" value={gameMode} onChange={e => setGameMode(e.target.value as GameMode)}
              className={inputBaseClasses}>
              <option value={OperationType.ADD}>{translate('ncModeAdd')}</option>
              <option value={OperationType.SUBTRACT}>{translate('ncModeSubtract')}</option>
              <option value={OperationType.MULTIPLY}>{translate('ncModeMultiply')}</option>
              <option value={OperationType.DIVIDE}>{translate('ncModeDivide')}</option>
              <option value="mixed">{translate('ncModeMixed')}</option>
            </select>
          </div>
        </div>
        <button onClick={startGame} className="w-full py-3 px-6 rounded-md bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-bold text-lg transition-colors shadow-md hover:shadow-lg">
          {translate('ncStartGame')}
        </button>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="flex flex-col items-center space-y-6 p-4 max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{translate('ncGameOver')}</h1>
        <p className="text-2xl text-indigo-600 dark:text-indigo-400 font-semibold">{translate('ncFinalScore', { score })}</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
            <button onClick={() => setGameState('setup')} className="flex-1 py-3 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors shadow-sm">
            {translate('wordlePlayAgain')}
            </button>
            <button onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.GAMES_HUB } })} className="flex-1 py-3 px-4 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold transition-colors">
            {translate('navBackToGamesHub')}
            </button>
        </div>
      </div>
    );
  }

  // Playing state
  return (
    <div className="flex flex-col items-center space-y-5 p-4 max-w-lg mx-auto">
        <div className="flex justify-between w-full items-baseline">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
              {translate('ncScore', { score })}
            </h2>
            <div className="text-lg font-medium text-orange-500 dark:text-orange-400 flex items-center gap-1.5">
                <Icon name="clock" size="1.1em"/> 
                {translate('ncTimeLeft', { time: timeLeft })}
            </div>
        </div>
        
        {currentProblem && (
            <p className="text-4xl sm:text-5xl font-mono font-bold my-6 p-6 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-900 dark:text-slate-100 text-center w-full shadow-md">
            {currentProblem.text}
            </p>
        )}

        <form onSubmit={handleAnswerSubmit} className="w-full flex flex-col sm:flex-row gap-3 items-center">
            <label htmlFor="user-answer-nc" className="sr-only">{translate('ncEnterAnswer')}</label>
            <input
            type="number" 
            id="user-answer-nc"
            ref={answerInputRef}
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className={`flex-grow w-full sm:w-auto p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-xl text-center bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400`}
            placeholder={translate('ncEnterAnswer')}
            autoFocus
            />
            <button type="submit" className="w-full sm:w-auto py-3 px-6 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors shadow-sm">
            {translate('ncSubmitAnswer')}
            </button>
        </form>

        {feedback && (
            <p className={`mt-3 p-2.5 rounded-md text-sm font-medium w-full text-center shadow-sm
            ${feedback.startsWith(translate('ncCorrect')) ? 'bg-green-100 dark:bg-green-800/70 text-green-700 dark:text-green-200 border border-green-300 dark:border-green-600' : 'bg-red-100 dark:bg-red-800/70 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-600'}`}>
            {feedback}
            </p>
        )}
         <button
            onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current);
                setGameState('setup');
            }}
            className="mt-4 py-2 px-4 text-xs rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
        >
            {translate('navBackToGamesHub')}
        </button>
    </div>
  );
};

export default NumberCruncherView;