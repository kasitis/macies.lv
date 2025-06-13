
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Question, AppView, QuestionType, AnswerNumberingStyle, TestSpecificSettings, QuestionOption } from '@/types.ts';
import Icon from './Icon.tsx';

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const getOptionPrefix = (style: AnswerNumberingStyle, index: number): string => {
    switch (style) {
        case AnswerNumberingStyle.NUMBERS:
            return `${Number(index) + 1}. `;
        case AnswerNumberingStyle.LETTERS_UPPER:
            return `${String.fromCharCode(65 + Number(index))}. `;
        case AnswerNumberingStyle.LETTERS_LOWER:
            return `${String.fromCharCode(97 + Number(index))}. `;
        case AnswerNumberingStyle.NONE:
        default:
            return '';
    }
};

const formatTime = (totalSeconds: number, translateFn: (key: string, replacements?: Record<string, string | number>) => string): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return translateFn('timeMinutesSeconds', { minutes, seconds });
};

const QuizView: React.FC = () => {
  const { state, dispatch, translate, activeProfile } = useAppContext();
  
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<(number | string | null)[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResultsView, setShowResultsView] = useState(false);
  const [currentTestSettings, setCurrentTestSettings] = useState<TestSpecificSettings | null>(null);
  
  const [quizStartTime, setQuizStartTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isSubmittingRef = useRef(false);

  const currentLanguage = state.generalSettings.currentLanguage; 

  const handleSubmitQuiz = useCallback((isTimeUp: boolean = false) => {
     if (!activeProfile || currentQuizQuestions.length === 0 || isSubmittingRef.current) return; 
     isSubmittingRef.current = true;
     
     if(!isTimeUp && currentQuestionIndex < currentQuizQuestions.length) {
        const currentQ = currentQuizQuestions[Number(currentQuestionIndex)];
        if (currentQ.type === QuestionType.FILL_IN_THE_BLANK && (userAnswers[currentQuestionIndex] === null || String(userAnswers[currentQuestionIndex]).trim() === "")) {
            dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgAttention', textKey: 'msgPleaseAnswerLast' }});
            isSubmittingRef.current = false;
            return;
        } else if ((currentQ.type === QuestionType.MULTIPLE_CHOICE || currentQ.type === QuestionType.TRUE_FALSE) && userAnswers[currentQuestionIndex] === null) {
            dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgAttention', textKey: 'msgPleaseAnswerLast' }});
            isSubmittingRef.current = false;
            return;
        }
     }
    
    let score = 0;
    currentQuizQuestions.forEach((q, index) => {
      const userAnswer = userAnswers[index];
      let isCorrect = false;
      if (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) {
        if (typeof userAnswer === 'number' && q.optionsRendered && q.optionsRendered[userAnswer]) {
          isCorrect = q.optionsRendered[userAnswer].text === q.correctOptionText;
        }
      } else if (q.type === QuestionType.FILL_IN_THE_BLANK) {
        if (typeof userAnswer === 'string') { 
          isCorrect = userAnswer.trim().toLowerCase() === q.correctOptionText.trim().toLowerCase();
        }
      }
      if (isCorrect) score++;
    });

    const totalPossible = currentQuizQuestions.length;
    const percentage = totalPossible > 0 ? (score / totalPossible) * 100 : 0;
    
    let timeTakenSeconds: number | null = null;
    if (currentTestSettings?.enableTimer && quizStartTime) {
        const endTime = Date.now();
        const durationSeconds = currentTestSettings.timerDurationMinutes * 60;
        timeTakenSeconds = Math.min(Math.floor((endTime - quizStartTime) / 1000), durationSeconds);
    }

    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    
    dispatch({ 
      type: 'ADD_HISTORY_TO_PROFILE', 
      payload: {
        profileId: activeProfile.id,
        historyEntry: {
            date: new Date().toISOString(),
            score,
            totalPossible,
            percentage: parseFloat(percentage.toFixed(1)),
            questionsInQuiz: currentQuizQuestions.length,
            timeTakenSeconds,
        }
      }
    });
    setShowResultsView(true); 
    if (isTimeUp) {
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'quizTimeUpTitle', textKey: 'quizTimeUpMessage'}});
    }
  }, [activeProfile, currentQuizQuestions, userAnswers, currentQuestionIndex, dispatch, currentTestSettings, quizStartTime]);


  const setupNewQuizAttempt = useCallback(() => {
    isSubmittingRef.current = false;
    if (!activeProfile || !activeProfile.questions || !activeProfile.settings) {
        setCurrentQuizQuestions([]);
        setCurrentTestSettings(null);
        setShowResultsView(false);
        setQuizStartTime(null);
        setRemainingTime(null);
        if (timerIdRef.current) clearInterval(timerIdRef.current);
        return;
    }
    
    const profileQuestionsSource: Question[] = activeProfile.questions;
    const profileSettings: TestSpecificSettings = {
      ...{ enableTimer: false, timerDurationMinutes: 30 }, 
      ...activeProfile.settings
    };
    
    setCurrentTestSettings(profileSettings);

    if (profileQuestionsSource.length === 0) {
      setCurrentQuizQuestions([]);
      if (timerIdRef.current) clearInterval(timerIdRef.current);
      setQuizStartTime(null);
      setRemainingTime(null);
      return;
    }

    let questionsToUse = profileSettings.randomizeQuestions ? shuffleArray(profileQuestionsSource) : [...profileQuestionsSource];
    
    let numToTake = questionsToUse.length;
    if (!profileSettings.useAllQuestions && profileSettings.numQuestions > 0 && profileSettings.numQuestions < questionsToUse.length) {
        numToTake = profileSettings.numQuestions;
    } else if (!profileSettings.useAllQuestions && profileSettings.numQuestions <= 0) {
        numToTake = Math.min(10, questionsToUse.length); 
    }

    const preparedQuizQuestions = questionsToUse.slice(0, numToTake).map(q => {
        let optionsWithOptionsRendered: QuestionOption[];
        const currentOptions = q.options ? [...q.options] : [];
        if (q.type === QuestionType.TRUE_FALSE) {
            optionsWithOptionsRendered = [
                { text: translate('optionTrue'), imageURL: null },
                { text: translate('optionFalse'), imageURL: null }
            ];
        } else {
            optionsWithOptionsRendered = profileSettings.randomizeAnswers ? shuffleArray(currentOptions) : currentOptions;
        }
        return { ...q, optionsRendered: optionsWithOptionsRendered };
    });
    
    setCurrentQuizQuestions(preparedQuizQuestions);
    setUserAnswers(new Array(preparedQuizQuestions.length).fill(null));
    setCurrentQuestionIndex(0);
    setShowResultsView(false); 
    
    if (profileSettings.enableTimer && profileSettings.timerDurationMinutes > 0) {
        setQuizStartTime(Date.now());
        setRemainingTime(profileSettings.timerDurationMinutes * 60);
    } else {
        setQuizStartTime(null);
        setRemainingTime(null);
        if (timerIdRef.current) clearInterval(timerIdRef.current);
    }

  }, [activeProfile, translate, currentLanguage]);


  const questionsSignature = useMemo(() => JSON.stringify(activeProfile?.questions || []), [activeProfile?.questions]);
  const settingsSignature = useMemo(() => JSON.stringify(activeProfile?.settings || {}), [activeProfile?.settings]);

  useEffect(() => {
    if (activeProfile && !showResultsView) {
        setupNewQuizAttempt();
    } else if (!activeProfile && state.activeView === AppView.QUIZ) {
        setCurrentQuizQuestions([]);
        setCurrentTestSettings(null);
        setShowResultsView(false);
        if (timerIdRef.current) clearInterval(timerIdRef.current);
        setQuizStartTime(null);
        setRemainingTime(null);
        dispatch({ type: 'SET_VIEW', payload: { view: AppView.MY_TESTS, activeTestProfileId: null } });
    }
  }, [
    activeProfile?.id,      
    questionsSignature,     
    settingsSignature,      
    showResultsView,        
    setupNewQuizAttempt,    
    state.activeView,       
    dispatch
  ]);

  useEffect(() => {
    if (currentTestSettings?.enableTimer && quizStartTime && !showResultsView && currentQuizQuestions.length > 0) {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
      timerIdRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - quizStartTime) / 1000);
        const newRemaining = (currentTestSettings.timerDurationMinutes * 60) - elapsedSeconds;
        
        setRemainingTime(newRemaining > 0 ? newRemaining : 0);

        if (newRemaining <= 0) {
          if (timerIdRef.current) clearInterval(timerIdRef.current);
          timerIdRef.current = null;
          if (!isSubmittingRef.current) { 
            handleSubmitQuiz(true);
          }
        }
      }, 1000);
    } else {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    }
    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
      }
    };
  }, [currentTestSettings, quizStartTime, showResultsView, handleSubmitQuiz, currentQuizQuestions.length]);


  const handleAnswerSelect = (answer: number | string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuizQuestions.length === 0) return;
    const currentQ = currentQuizQuestions[Number(currentQuestionIndex)];
    if (currentQ.type === QuestionType.FILL_IN_THE_BLANK && (userAnswers[currentQuestionIndex] === null || String(userAnswers[currentQuestionIndex]).trim() === "")) {
        dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgAttention', textKey: 'msgPleaseEnterAnswer' }});
        return;
    } else if ((currentQ.type === QuestionType.MULTIPLE_CHOICE || currentQ.type === QuestionType.TRUE_FALSE) && userAnswers[currentQuestionIndex] === null) {
        dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgAttention', textKey: 'msgPleaseSelectAnswer' }});
        return;
    }

    if (currentQuestionIndex < currentQuizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleTryAgain = () => {
    setShowResultsView(false); 
  };

  const handleBackToHub = () => {
    if (!activeProfile) return;
    setShowResultsView(false); 
    if (timerIdRef.current) clearInterval(timerIdRef.current);
    setQuizStartTime(null);
    setRemainingTime(null);
    dispatch({ type: 'SET_VIEW', payload: { view: AppView.TEST_PROFILE_HUB, activeTestProfileId: activeProfile.id } });
  };


  if (!activeProfile) {
    return (
        <div className="text-center p-8">
            <p className="dark:text-slate-300">{translate('msgError')}: No active test profile. Redirecting...</p>
        </div>
    );
  }

  if ((!currentTestSettings && activeProfile.questions.length > 0 && !showResultsView) || (currentQuizQuestions.length === 0 && activeProfile.questions.length > 0 && !showResultsView)) {
      return (
          <div className="text-center p-8">
              <p className="text-slate-600 dark:text-slate-300">Loading quiz for '{activeProfile.name}'...</p>
          </div>
      );
  }
  
  if (currentQuizQuestions.length === 0 && currentTestSettings && !showResultsView) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">{translate('quizNoQuestionsAvailable', {name: activeProfile.name})}</h2>
        <p className="mb-6 text-slate-600 dark:text-slate-300">{translate('quizNoQuestionsAdvice')}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <button 
            onClick={() => {
              dispatch({type: 'SET_VIEW', payload: { view: AppView.CREATE_EDIT_QUESTION, activeTestProfileId: activeProfile.id }})
            }} 
            className="py-2.5 px-5 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white transition-colors shadow-sm hover:shadow-md"
          >
            {translate('quizGoToAddFromEmpty')}
          </button>
          <button 
            onClick={() => dispatch({type: 'SET_VIEW', payload: { view: AppView.TEST_SETTINGS, activeTestProfileId: activeProfile.id }})}
            className="py-2.5 px-5 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors"
          >
            {translate('quizGoToSettingsFromEmpty')}
          </button>
        </div>
      </div>
    );
  }


  if (showResultsView) {
    let calculatedScore = 0;
    currentQuizQuestions.forEach((q, index) => {
        const ans = userAnswers[index];
        let isCorrect = false;
        if (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) {
            if (typeof ans === 'number' && q.optionsRendered && q.optionsRendered[ans]) {
                isCorrect = q.optionsRendered[ans].text === q.correctOptionText;
            }
        } else if (q.type === QuestionType.FILL_IN_THE_BLANK) {
            if (typeof ans === 'string') {
                isCorrect = ans.trim().toLowerCase() === q.correctOptionText.trim().toLowerCase();
            }
        }
        if (isCorrect) calculatedScore++;
    });
    const calculatedPercentage = currentQuizQuestions.length > 0 ? (calculatedScore / currentQuizQuestions.length) * 100 : 0;


    return (
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-slate-900 dark:text-slate-100">{translate('quizResultsTitle')}</h2>
        <p className="text-xl mb-6 text-slate-800 dark:text-slate-200">
          {translate('quizYourScore', { score: calculatedScore, totalPossible: currentQuizQuestions.length, percentage: calculatedPercentage.toFixed(1) })}
        </p>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1 text-left mb-6 custom-scrollbar">
          {currentQuizQuestions.map((q, index) => {
            const userAnswer = userAnswers[index];
            let isUserAnswerCorrect = false; 
            let userAnswerText = ""; 
            let correctOptionDisplayText = q.correctOptionText; 

            if (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) {
                const chosenOptionObject = (typeof userAnswer === 'number' && q.optionsRendered) ? q.optionsRendered[userAnswer] : undefined;
                userAnswerText = chosenOptionObject ? chosenOptionObject.text : translate('quizAnswerNotAnswered', {correctAnswer: ""}).split(".")[0].trim(); 
                if (chosenOptionObject) isUserAnswerCorrect = chosenOptionObject.text === q.correctOptionText;
            } else if (q.type === QuestionType.FILL_IN_THE_BLANK) {
                userAnswerText = userAnswer !== null && typeof userAnswer === 'string' ? userAnswer.trim() : translate('quizAnswerNotAnswered', {correctAnswer: ""}).split(".")[0].trim();
                if (typeof userAnswer === 'string' && userAnswer !== null) {
                    isUserAnswerCorrect = userAnswer.trim().toLowerCase() === q.correctOptionText.trim().toLowerCase();
                }
            }
            
            const baseOptionClasses = "text-sm p-2.5 rounded-md border";
            const correctOptionResultClasses = "bg-green-50 dark:bg-green-900/50 border-green-500 dark:border-green-600 text-green-700 dark:text-green-300";
            const incorrectOptionSelectedClasses = "bg-red-50 dark:bg-red-900/50 border-red-500 dark:border-red-600 text-red-700 dark:text-red-300";
            const neutralOptionClasses = "bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300";
            
            return (
              <div key={q.id + '-result-' + index} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg mb-3 bg-white dark:bg-slate-800 shadow-sm">
                {q.questionImageURL && <img src={q.questionImageURL} alt={translate('altQuestionImage')} className="question-image my-2 max-h-40 mx-auto rounded-md border border-slate-200 dark:border-slate-700" onError={(e) => (e.currentTarget.style.display='none')} />}
                <h3 className="font-semibold mb-1.5 text-slate-800 dark:text-slate-100">{Number(index) + 1}. {q.question}</h3>
                
                { (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) && q.optionsRendered && currentTestSettings &&
                    <ul className="list-none space-y-1.5 mt-2">
                    {q.optionsRendered.map((opt, optIdx) => {
                        let liClasses = `${baseOptionClasses} `;
                        const isSelectedAnswerByUser = typeof userAnswer === 'number' && userAnswer === optIdx;
                        const isTheCorrectDbAnswer = opt.text === q.correctOptionText;

                        if (isTheCorrectDbAnswer) {
                            liClasses += correctOptionResultClasses;
                             if(isSelectedAnswerByUser) liClasses += " ring-2 ring-offset-1 ring-green-500 dark:ring-green-400 dark:ring-offset-slate-800"; 
                        } else if (isSelectedAnswerByUser && !isTheCorrectDbAnswer) {
                            liClasses += incorrectOptionSelectedClasses;
                        } else {
                            liClasses += neutralOptionClasses;
                        }
                        
                        return (
                            <li key={optIdx + '-li-res-' + q.id} className={`${liClasses}`}>
                                {opt.imageURL && <img src={opt.imageURL} alt={translate('altOptionImage')} className="option-image max-h-20 mx-auto my-1 rounded border border-slate-200 dark:border-slate-600" onError={(e) => (e.currentTarget.style.display='none')} />}
                                <span className="option-text">{getOptionPrefix(currentTestSettings.answerNumberingStyle, optIdx)}{opt.text}</span>
                            </li>
                        );
                    })}
                    </ul>
                }
                { q.type === QuestionType.FILL_IN_THE_BLANK &&
                    <div className={`p-2.5 border rounded-md text-sm mt-2 ${isUserAnswerCorrect ? correctOptionResultClasses : incorrectOptionSelectedClasses}`}>
                         {translate('quizYourAnswerWas', { userAnswer: userAnswerText, correctAnswer: q.correctOptionText })}
                    </div>
                }
                {!isUserAnswerCorrect && userAnswer !== null && (q.type === QuestionType.MULTIPLE_CHOICE || q.type === QuestionType.TRUE_FALSE) && (
                    <p className="text-sm mt-2 font-medium text-green-600 dark:text-green-400">
                         {translate('quizCorrectAnswerWas', { correctAnswer: correctOptionDisplayText })}
                    </p>
                )}
                 {userAnswer === null && (
                    <p className="text-sm text-orange-500 dark:text-orange-400 mt-2">
                        {translate('quizAnswerNotAnswered', { correctAnswer: correctOptionDisplayText })}
                    </p>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3">
            <button 
              onClick={handleTryAgain} 
              className="py-2.5 px-6 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors w-full sm:w-auto shadow-sm hover:shadow-md"
            >
              {translate('quizTryAgainBtn')}
            </button>
            <button
                onClick={handleBackToHub}
                className="py-2.5 px-6 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5"
            >
                <Icon name="arrow-left" size="1em"/> {translate('navBackToHub')}
            </button>
        </div>
      </div>
    );
  }
  
  if (currentQuizQuestions.length === 0 || !currentQuizQuestions[currentQuestionIndex] || !currentTestSettings) {
    return (
        <div className="text-center p-8">
            <p className="text-slate-600 dark:text-slate-300">Preparing quiz...</p>
        </div>
    );
  }

  const currentQuestion = currentQuizQuestions[currentQuestionIndex];
  const progressPercentage = currentQuizQuestions.length > 0 ? ((currentQuestionIndex + 1) / currentQuizQuestions.length) * 100 : 0;
  const answerNumberingStyle = currentTestSettings.answerNumberingStyle || AnswerNumberingStyle.NUMBERS;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-slate-900 dark:text-slate-100 break-all">
        {activeProfile.name}
      </h1>
      {currentTestSettings.enableTimer && remainingTime !== null && (
        <div className="text-center text-lg font-medium my-2 text-orange-500 dark:text-orange-400 flex items-center justify-center gap-2">
            <Icon name="clock" size="1.2em"/>
            {translate('quizTimeRemaining', { time: formatTime(remainingTime, translate) })}
        </div>
      )}
      <div className="mb-3 mt-1 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 h-3 shadow-inner">
        <div 
            className="h-full bg-indigo-500 dark:bg-indigo-600 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${progressPercentage}%` }}
            role="progressbar"
            aria-valuenow={progressPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={translate('quizQuestionOf', { current: currentQuestionIndex + 1, total: currentQuizQuestions.length })}
        ></div>
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-3 text-right">
        {translate('quizQuestionOf', { current: currentQuestionIndex + 1, total: currentQuizQuestions.length })}
      </div>
      <div className="mb-6">
        {currentQuestion.questionImageURL && 
          <img 
            src={currentQuestion.questionImageURL} 
            alt={translate('altQuestionImage')} 
            className="max-w-full h-auto max-h-64 mx-auto mb-4 rounded-md block border border-slate-200 dark:border-slate-700 shadow-sm"
            onError={(e) => (e.currentTarget.style.display='none')}
          />
        }
        <h2 className="text-lg sm:text-xl font-semibold mb-5 text-center text-slate-800 dark:text-slate-100 leading-relaxed">{currentQuestion.question}</h2>
        
        <div className={`grid grid-cols-1 ${currentQuestion.type === QuestionType.MULTIPLE_CHOICE ? 'md:grid-cols-2' : ''} gap-3`}>
          {(currentQuestion.type === QuestionType.MULTIPLE_CHOICE || currentQuestion.type === QuestionType.TRUE_FALSE) && currentQuestion.optionsRendered ? (
            currentQuestion.optionsRendered.map((option, index) => {
              const isSelected = userAnswers[currentQuestionIndex] === index;
              return (
                <div key={index + '-option-live' + currentQuestion.id}>
                  <input 
                    type="radio" 
                    name={`question-${currentQuestion.id}`} 
                    id={`q${currentQuestionIndex}_option${index}`} 
                    value={index} 
                    checked={isSelected}
                    onChange={() => handleAnswerSelect(index)}
                    className="hidden" 
                    aria-labelledby={`q${currentQuestionIndex}_option${index}_label`}
                  />
                  <label 
                    id={`q${currentQuestionIndex}_option${index}_label`}
                    htmlFor={`q${currentQuestionIndex}_option${index}`} 
                    className={`block p-3.5 border rounded-lg cursor-pointer transition-all 
                                text-center text-slate-700 dark:text-slate-200 text-sm sm:text-base
                                ${isSelected 
                                  ? 'bg-indigo-100 dark:bg-indigo-800 border-indigo-500 dark:border-indigo-500 font-semibold ring-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-1 dark:ring-offset-slate-900' 
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                                }`}
                  >
                    {option.imageURL && 
                      <img 
                        src={option.imageURL} 
                        alt={translate('altOptionImage')} 
                        className="max-w-[100px] max-h-[70px] mx-auto mb-2 rounded border border-slate-200 dark:border-slate-700 block"
                        onError={(e) => (e.currentTarget.style.display='none')}
                      />
                    }
                    <span className="block">{getOptionPrefix(answerNumberingStyle, index)}{option.text}</span>
                  </label>
                </div>
              );
            })
          ) : currentQuestion.type === QuestionType.FILL_IN_THE_BLANK ? ( 
            <div>
              <label htmlFor="fill-in-blank-answer" className="sr-only">{translate('formFillCorrectAnswerPlaceholder')}</label>
              <input 
                id="fill-in-blank-answer"
                type="text" 
                value={userAnswers[currentQuestionIndex] as string || ''}
                onChange={(e) => handleAnswerSelect(e.target.value)}
                className="mt-1 block w-full p-3 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-base bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400"
                placeholder={translate('formFillCorrectAnswerPlaceholder')}
                aria-label={translate('formFillCorrectAnswerPlaceholder')}
              />
            </div>
          ) : null }
        </div>
      </div>

      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)} 
          disabled={currentQuestionIndex === 0}
          className="py-2.5 px-5 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {translate('quizPreviousBtn')}
        </button>
        {currentQuestionIndex === currentQuizQuestions.length - 1 ? (
          <button 
            onClick={() => handleSubmitQuiz(false)} 
            className="py-2.5 px-5 rounded-md bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            {translate('quizSubmitBtn')}
          </button>
        ) : (
          <button 
            onClick={handleNextQuestion} 
            className="py-2.5 px-5 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            {translate('quizNextBtn')}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizView;