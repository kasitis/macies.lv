
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppView } from '@/types.ts';
import { WORDLE_MAX_ATTEMPTS } from '@/constants.ts';
import { WORDLE_LV_WORDS, WORDLE_WORD_LENGTH } from '../../data/wordleWords.ts';
import Icon from './Icon.tsx';

type LetterState = 'correct' | 'present' | 'absent' | 'default';

interface Tile {
  letter: string;
  state: LetterState;
}

// Keyboard layout remains the same
const LATVIAN_KEYBOARD_LAYOUT: string[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Ā', 'Č', 'Ē', 'Ģ', 'Ī', 'Ķ', 'Ļ', 'Ņ', 'Š', 'Ū', 'Ž'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];


const getRandomWord = (): string => {
  return WORDLE_LV_WORDS[Math.floor(Math.random() * WORDLE_LV_WORDS.length)].toUpperCase();
};

const WordleLvView: React.FC = () => {
  const { translate, dispatch } = useAppContext();
  const [targetWord, setTargetWord] = useState<string>(getRandomWord());
  const [guesses, setGuesses] = useState<Tile[][]>(Array(WORDLE_MAX_ATTEMPTS).fill(null).map(() => Array(WORDLE_WORD_LENGTH).fill({ letter: '', state: 'default' })));
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [message, setMessage] = useState<string>('');
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [keyboardKeyStates, setKeyboardKeyStates] = useState<Record<string, LetterState>>({});
  const [hintUsed, setHintUsed] = useState<boolean>(false);


  const resetGame = useCallback(() => {
    setTargetWord(getRandomWord());
    setGuesses(Array(WORDLE_MAX_ATTEMPTS).fill(null).map(() => Array(WORDLE_WORD_LENGTH).fill({ letter: '', state: 'default' })));
    setCurrentAttempt(0);
    setCurrentGuess([]);
    setMessage('');
    setIsGameOver(false);
    setKeyboardKeyStates({});
    setHintUsed(false);
  }, []);



  const handleSubmitGuess = useCallback(() => {
    if (isGameOver) return;

    if (currentGuess.length !== WORDLE_WORD_LENGTH) {
      setMessage(translate('wordleInvalidWordLength', { length: WORDLE_WORD_LENGTH }));
      return;
    }

    const guessWord = currentGuess.join('').toUpperCase(); 
    
    if (!WORDLE_LV_WORDS.includes(guessWord)) {
      setMessage(translate('wordleNotInWordList'));
      return;
    }

    const newGuesses = [...guesses];
    const evaluation: Tile[] = Array(WORDLE_WORD_LENGTH).fill(null).map((_, i) => ({ letter: guessWord[i], state: 'absent' as LetterState }));
    const targetWordLetters = targetWord.split('');
    const tempKeyboardKeyStates = {...keyboardKeyStates};

    // First pass: Check for 'correct' letters
    for (let i = 0; i < WORDLE_WORD_LENGTH; i++) {
      if (guessWord[i] === targetWord[i]) {
        evaluation[i].state = 'correct';
        targetWordLetters[i] = ''; // Mark as used
        tempKeyboardKeyStates[guessWord[i]] = 'correct';
      }
    }

    // Second pass: Check for 'present' letters
    for (let i = 0; i < WORDLE_WORD_LENGTH; i++) {
      if (evaluation[i].state !== 'correct') { // Only if not already correct
        const letterIndexInTarget = targetWordLetters.indexOf(guessWord[i]);
        if (letterIndexInTarget !== -1) {
          evaluation[i].state = 'present';
          targetWordLetters[letterIndexInTarget] = ''; // Mark as used for this guess
          if (tempKeyboardKeyStates[guessWord[i]] !== 'correct') {
            tempKeyboardKeyStates[guessWord[i]] = 'present';
          }
        } else {
             if (tempKeyboardKeyStates[guessWord[i]] !== 'correct' && tempKeyboardKeyStates[guessWord[i]] !== 'present') {
                 tempKeyboardKeyStates[guessWord[i]] = 'absent';
             }
        }
      }
    }
    
    newGuesses[currentAttempt] = evaluation;
    setGuesses(newGuesses);
    setKeyboardKeyStates(tempKeyboardKeyStates); // Update keyboard state after full evaluation

    if (guessWord === targetWord) {
      setMessage(translate('wordleWinMessage', { word: targetWord }));
      setIsGameOver(true);
    } else if (currentAttempt + 1 >= WORDLE_MAX_ATTEMPTS) {
      setMessage(translate('wordleLossMessage', { word: targetWord }));
      setIsGameOver(true);
    } else {
      setMessage('');
    }
    
    setCurrentAttempt(prev => prev + 1);
    setCurrentGuess([]);

  }, [currentGuess, targetWord, currentAttempt, guesses, translate, isGameOver, keyboardKeyStates]);

  const handleKeyPress = useCallback((key: string) => {
    if (isGameOver) return;
    setMessage(''); 

    if (key === 'ENTER') {
      handleSubmitGuess();
    } else if (key === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (currentGuess.length < WORDLE_WORD_LENGTH && /^[A-ZĀČĒĢĪĶĻŅŠŪŽ]$/.test(key.toUpperCase())) {
      setCurrentGuess(prev => [...prev, key.toUpperCase()]);
    }
  }, [isGameOver, handleSubmitGuess, currentGuess.length]);
  
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return; 
        let key = e.key.toUpperCase();
        if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-ZĀČĒĢĪĶĻŅŠŪŽ]$/.test(key)) {
            e.preventDefault(); // Prevent default browser actions for these keys if game is active
            handleKeyPress(key);
        }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handleKeyPress]);

  const handleHintClick = () => {
    if (isGameOver || hintUsed || currentAttempt >= WORDLE_MAX_ATTEMPTS) return;

    let hintPlaced = false;
    let hintIndex = -1;

    for (let i = 0; i < WORDLE_WORD_LENGTH; i++) {
        // Find a position in targetWord that is not yet guessed correctly AND current guess at this position is not the correct letter
        if (keyboardKeyStates[targetWord[i]] !== 'correct' && currentGuess[i] !== targetWord[i]) {
            hintIndex = i;
            break; 
        }
    }
    // If all correct letters are known or placed in current guess, try to fill any empty spot with a correct letter.
    if (hintIndex === -1) {
        for (let i = 0; i < WORDLE_WORD_LENGTH; i++) {
            if (currentGuess[i] !== targetWord[i]) { // If current guess is wrong or empty
                hintIndex = i;
                break;
            }
        }
    }
    
    if (hintIndex !== -1) {
        const newCurrentGuess = [...currentGuess];
        while(newCurrentGuess.length <= hintIndex) {
            newCurrentGuess.push('');
        }
        const hintedLetter = targetWord[hintIndex];
        newCurrentGuess[hintIndex] = hintedLetter;
        setCurrentGuess(newCurrentGuess);

        const newKeyStates = {...keyboardKeyStates};
        newKeyStates[hintedLetter] = 'correct';
        setKeyboardKeyStates(newKeyStates);
        
        setHintUsed(true);
        setMessage(`${translate('wordleHint')}: ${hintedLetter}`);
        hintPlaced = true;
    }

    if (!hintPlaced) {
        setMessage(translate('wordleHintUsedOrUnavailable'));
    }
  };

  const getTileClasses = (state: LetterState, hasLetter: boolean): string => {
    let classes = "border-2 flex items-center justify-center text-2xl sm:text-3xl font-bold uppercase transition-all duration-300 transform ";
    if(state !== 'default' && hasLetter) {
        classes += "animate-flip ";
    } else if (hasLetter && state === 'default') {
        classes += "animate-pop-in ";
    }

    switch (state) {
      case 'correct': return classes + 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600 text-white';
      case 'present': return classes + 'bg-yellow-400 dark:bg-yellow-500 border-yellow-400 dark:border-yellow-500 text-white';
      case 'absent': return classes + 'bg-slate-400 dark:bg-slate-600 border-slate-400 dark:border-slate-600 text-white';
      default: return classes + 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-900 dark:text-slate-100';
    }
  };

  const getKeyboardKeyClasses = (keyState: LetterState | undefined): string => {
    let base = "h-12 sm:h-14 rounded font-semibold uppercase text-xs sm:text-sm transition-colors duration-150 flex items-center justify-center shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-slate-900 ";
    switch (keyState) {
      case 'correct': return base + 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700 text-white';
      case 'present': return base + 'bg-yellow-400 dark:bg-yellow-500 hover:bg-yellow-500 dark:hover:bg-yellow-600 text-white';
      case 'absent': return base + 'bg-slate-400 dark:bg-slate-600 hover:bg-slate-500 dark:hover:bg-slate-700 text-white opacity-80';
      default: return base + 'bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 py-4 max-w-md mx-auto">
      <div className="flex justify-between w-full items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          {translate('wordleLvGameTitle')}
        </h1>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.GAMES_HUB } })}
          className="py-1.5 px-3 text-xs rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1"
        >
          <Icon name="arrow-left" size="0.8em" /> {translate('navBackToGamesHub')}
        </button>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
        {translate('wordleAttemptsLeft', { count: WORDLE_MAX_ATTEMPTS - currentAttempt })}
      </p>

      <div className="grid gap-1.5 mb-4" aria-label="Wordle guess grid">
        {guesses.map((_row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid grid-cols-5 gap-1.5">
            {Array(WORDLE_WORD_LENGTH).fill(0).map((_, colIndex) => {
              const tile = rowIndex === currentAttempt && colIndex < currentGuess.length 
                            ? { letter: currentGuess[colIndex], state: 'default' as LetterState } 
                            : guesses[rowIndex][colIndex];
              const animationDelay = tile.state !== 'default' ? `${colIndex * 100}ms` : '0ms';
              return (
                <div
                  key={`tile-${rowIndex}-${colIndex}`}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-md shadow-sm ${getTileClasses(tile.state, !!tile.letter)}`}
                  style={{animationDelay: animationDelay}}
                  aria-live="polite"
                  aria-label={`Row ${rowIndex+1}, Column ${colIndex+1}, Letter ${tile.letter || 'empty'}, State ${tile.state}`}
                >
                  {tile.letter}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      {message && <p className={`text-sm font-medium p-2.5 rounded-md w-full text-center shadow ${isGameOver && message.includes(translate('wordleWinMessage', {word:''}).split(':')[0]) ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200 border border-green-300 dark:border-green-600' : isGameOver ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-600' : message.startsWith(translate('wordleHint')) ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 border border-blue-300 dark:border-blue-600' : 'bg-yellow-50 dark:bg-yellow-700/50 text-yellow-700 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-600'}`}>{message}</p>}

      <div className="flex items-center justify-center gap-2 w-full my-2">
        {!isGameOver && (
            <>
                <button
                onClick={resetGame} 
                className="py-2 px-4 text-sm rounded-md bg-orange-500 hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-semibold transition-colors shadow-sm"
                >
                {translate('wordleNewGame')}
                </button>
                <button
                onClick={handleHintClick}
                disabled={hintUsed || currentAttempt >= WORDLE_MAX_ATTEMPTS}
                className="py-2 px-4 text-sm rounded-md bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                >
                {translate('wordleHint')}
                </button>
            </>
        )}
        {isGameOver && (
            <button
            onClick={resetGame}
            className="py-2.5 px-6 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors shadow-sm"
            >
            {translate('wordlePlayAgain')}
            </button>
        )}
      </div>

      <div className="w-full space-y-1 sm:space-y-1.5 mt-auto" role="group" aria-label="Keyboard">
        {LATVIAN_KEYBOARD_LAYOUT.map((row, rowIndex) => (
          <div key={`kb-row-${rowIndex}`} className="flex justify-center gap-1 sm:gap-1.5">
            {row.map(key => {
              const keyState = keyboardKeyStates[key.toUpperCase()];
              const isSpecialKey = key === 'ENTER' || key === 'BACKSPACE';
              const buttonWidth = isSpecialKey ? 'flex-grow px-1.5 sm:px-2.5' : 'w-8 sm:w-10';
              
              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  disabled={isGameOver && !isSpecialKey} // Allow Enter/Backspace on game over for potential future features
                  className={`${buttonWidth} ${getKeyboardKeyClasses(keyState)}
                              disabled:opacity-70 disabled:cursor-not-allowed`}
                  aria-label={key === 'ENTER' ? translate('wordleKeyboardEnter') : key === 'BACKSPACE' ? translate('wordleKeyboardBackspace') : key}
                >
                  {key === 'BACKSPACE' ? <Icon name="delete" size="1.5em" /> : key === 'ENTER' ? <Icon name="corner-down-left" size="1.5em" /> : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <style>
        {`
        .animate-pop-in { animation: popIn 0.1s ease-out forwards; }
        @keyframes popIn { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        .animate-flip { animation: flip 0.5s ease forwards; backface-visibility: hidden; }
        @keyframes flip { 0% { transform: rotateX(0deg); } 50% { transform: rotateX(90deg); } 100% { transform: rotateX(0deg); } }
      `}
      </style>
    </div>
  );
};

export default WordleLvView;
