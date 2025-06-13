
import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppView, Flashcard } from '@/types.ts';
import Icon from './Icon.tsx';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const FlashcardStudyView: React.FC = () => {
  const { dispatch, translate, activeFlashcardDeck } = useAppContext();
  
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);

  const initializeStudySession = useCallback(() => {
    if (activeFlashcardDeck) {
      setStudyCards(shuffled ? shuffleArray([...activeFlashcardDeck.flashcards]) : [...activeFlashcardDeck.flashcards]);
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [activeFlashcardDeck, shuffled]);

  useEffect(() => {
    if (!activeFlashcardDeck) {
      dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECKS_LIST } });
      return;
    }
    initializeStudySession();
  }, [activeFlashcardDeck, shuffled, dispatch, initializeStudySession]);

  const handleFlipCard = () => setIsFlipped(!isFlipped);

  const handleNextCard = () => {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };
  
  const handleToggleShuffle = () => {
      setShuffled(prev => !prev); 
      // initializeStudySession will be called by useEffect due to shuffled dependency change
  }

  const handleEndStudy = () => {
    if (activeFlashcardDeck) {
      dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECK_HUB, activeFlashcardDeckId: activeFlashcardDeck.id } });
    }
  };

  if (!activeFlashcardDeck || studyCards.length === 0) {
    return (
      <div className="text-center p-5">
        <p className="text-slate-600 dark:text-slate-400 mb-4">{activeFlashcardDeck ? translate('flashcardDeckNoCards') : translate('msgError')}</p>
        <button
            onClick={handleEndStudy}
            className="py-2 px-4 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 mx-auto"
        >
            <Icon name="arrow-left" size="1em"/> {translate('navBackToHub')}
        </button>
      </div>
    );
  }

  const currentCard = studyCards[currentIndex];
  const cardSideToShow = isFlipped ? currentCard.backText : currentCard.frontText;
  const imageToShow = isFlipped ? currentCard.backImageURL : currentCard.frontImageURL;

  return (
    <div className="flex flex-col items-center justify-center space-y-5 min-h-[70vh]">
      <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 text-center mb-1">
        {translate('flashcardStudyModeTitle', { name: activeFlashcardDeck.name })}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        {translate('flashcardCardXofY', { current: currentIndex + 1, total: studyCards.length })}
      </p>

      <div
        className={`w-full max-w-md h-72 sm:h-80 p-6 rounded-xl shadow-xl flex flex-col justify-center items-center text-center cursor-pointer 
                    bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                    transition-transform duration-500 ${isFlipped ? 'transform-style-3d rotate-y-180' : ''}`}
        onClick={handleFlipCard}
        role="button"
        tabIndex={0}
        aria-pressed={isFlipped}
        aria-label={isFlipped ? translate('flashcardBack') : translate('flashcardFront')}
      >
        <div className={`flex flex-col items-center justify-center ${isFlipped ? 'transform-style-3d rotate-y-180' : ''}`}>
          {imageToShow && (
            <img src={imageToShow} alt={isFlipped ? translate('flashcardBack') : translate('flashcardFront')} 
                 className="max-w-[80%] max-h-36 mb-3 rounded-md object-contain"
                 onError={(e) => (e.currentTarget.style.display='none')}
            />
          )}
          <p className="text-lg sm:text-xl text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{cardSideToShow || (imageToShow ? '' : `(${translate('optionEmptyOrImage')})`)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mt-3">
        <button
          onClick={handlePreviousCard}
          disabled={currentIndex === 0}
          className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          <Icon name="arrow-left" size="1em"/> {translate('flashcardPreviousCard')}
        </button>
        <button
          onClick={handleFlipCard}
          className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-md bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <Icon name="refresh-cw" size="1em"/> {translate('flashcardFlipCard')}
        </button>
        <button
          onClick={handleNextCard}
          disabled={currentIndex === studyCards.length - 1}
          className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
        >
          {translate('flashcardNextCard')} <Icon name="arrow-left" size="1em" className="transform rotate-180"/>
        </button>
      </div>

       <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mt-3">
          <button
            onClick={handleToggleShuffle}
            className={`w-full sm:w-auto flex-1 py-2 px-4 text-sm rounded-md font-medium transition-colors flex items-center justify-center gap-1.5
                        ${shuffled 
                            ? 'bg-teal-500 hover:bg-teal-600 dark:bg-teal-600 dark:hover:bg-teal-700 text-white' 
                            : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200'}`}
            >
            <Icon name="shuffle" size="1em"/> {translate('flashcardShuffleCards')} {shuffled ? '(On)' : '(Off)'}
            </button>
            <button
            onClick={handleEndStudy}
            className="w-full sm:w-auto flex-1 py-2 px-4 text-sm rounded-md bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
            <Icon name="list-checks" size="1em"/> {translate('flashcardStudyEnd')}
            </button>
       </div>
       <style>{`
        .transform-style-3d { transform-style: preserve-3d; }
        .rotate-y-180 { transform: rotateY(180deg); }
       `}</style>
    </div>
  );
};

export default FlashcardStudyView;
