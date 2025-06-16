import React, { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AnswerNumberingStyle, TestSpecificSettings, AppView } from '@/types.ts';
import { DEFAULT_TEST_SPECIFIC_SETTINGS } from '@/constants.ts';
import Icon from './Icon.tsx';

type SelectionMode = 'all' | 'total' | 'topic';

const TestSettingsView: React.FC = () => {
  const { state, dispatch, translate, activeProfile } = useAppContext();
  
  const [currentSettings, setCurrentSettings] = useState<TestSpecificSettings>(
    activeProfile ? { ...DEFAULT_TEST_SPECIFIC_SETTINGS, ...activeProfile.settings } : { ...DEFAULT_TEST_SPECIFIC_SETTINGS }
  );
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('all');

  const questionsByTopic = useMemo(() => {
    if (!activeProfile) return {};
    return activeProfile.questions.reduce((acc, q) => {
      const topicName = q.topic || translate('qBankNotSpecified');
      if (!acc[topicName]) acc[topicName] = 0;
      acc[topicName]++;
      return acc;
    }, {} as Record<string, number>);
  }, [activeProfile, translate]);

  const uniqueTopics = useMemo(() => Object.keys(questionsByTopic).sort(), [questionsByTopic]);

  useEffect(() => {
    if (activeProfile) {
      const initialSettings = { 
        ...DEFAULT_TEST_SPECIFIC_SETTINGS, 
        ...activeProfile.settings,
        topicQuestionCounts: activeProfile.settings.topicQuestionCounts || {}, // Ensure it's an object
      };
      setCurrentSettings(initialSettings);
      
      if (initialSettings.useAllQuestions) {
        setSelectionMode('all');
      } else if (initialSettings.selectByTopic && Object.keys(initialSettings.topicQuestionCounts).length > 0) {
        setSelectionMode('topic');
      } else {
        setSelectionMode('total');
      }
    } else if(state.activeView === AppView.TEST_SETTINGS) { 
      setCurrentSettings({ ...DEFAULT_TEST_SPECIFIC_SETTINGS, topicQuestionCounts: {} }); 
      setSelectionMode('all');
      dispatch({ type: 'SET_VIEW', payload: { view: AppView.MY_TESTS, activeTestProfileId: null } });
    }
  }, [activeProfile, state.activeView, dispatch]);

  const handleSettingChange = (key: keyof TestSpecificSettings, value: any) => {
    setCurrentSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSelectionModeChange = (mode: SelectionMode) => {
    setSelectionMode(mode);
    let newUseAll = false;
    let newSelectByTopic = false;

    if (mode === 'all') {
        newUseAll = true;
    } else if (mode === 'total') {
        newSelectByTopic = false;
    } else { // topic
        newSelectByTopic = true;
    }
    
    setCurrentSettings(prev => {
        const updatedSettings = {
            ...prev,
            useAllQuestions: newUseAll,
            selectByTopic: newSelectByTopic,
        };
        if (mode === 'topic') {
            const initializedCounts = { ...prev.topicQuestionCounts };
            uniqueTopics.forEach(topic => {
                if (initializedCounts[topic] === undefined) {
                    initializedCounts[topic] = 0;
                }
            });
            updatedSettings.topicQuestionCounts = initializedCounts;
        }
        return updatedSettings;
    });
  };


  const handleTopicCountChange = (topic: string, countStr: string) => {
    // Handle empty string case
    if (countStr === '') {
        setCurrentSettings(prev => ({
            ...prev,
            topicQuestionCounts: { ...prev.topicQuestionCounts, [topic]: 0 }
        }));
        return;
    }

    const count = parseInt(countStr, 10);
    const available = questionsByTopic[topic] || 0;
    
    if (isNaN(count) || count < 0) {
        setCurrentSettings(prev => ({
            ...prev,
            topicQuestionCounts: { ...prev.topicQuestionCounts, [topic]: 0 }
        }));
        return;
    }
    
    if (count > available) {
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgValidationError', textKey: 'msgErrorTopicCountExceedsAvailable', textReplacements: { topicName: topic, available: available, selected: count}}});
        setCurrentSettings(prev => ({
            ...prev,
            topicQuestionCounts: { ...prev.topicQuestionCounts, [topic]: available }
        }));
        return;
    }

    setCurrentSettings(prev => ({
        ...prev,
        topicQuestionCounts: {
            ...prev.topicQuestionCounts,
            [topic]: count
        }
    }));
  };
  
  const handleSaveSettings = () => {
    if (activeProfile) {
      let settingsToSave = { ...currentSettings };

      // Ensure numQuestions has a valid value before saving
      if (!settingsToSave.numQuestions || settingsToSave.numQuestions < 1) {
        settingsToSave.numQuestions = 1;
      }

      if(settingsToSave.enableTimer && settingsToSave.timerDurationMinutes <= 0){
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgValidationError', textKey: 'timerMustBePositive'}});
        return;
      }

      if (settingsToSave.selectByTopic) {
        const totalSelectedByTopic = Object.values(settingsToSave.topicQuestionCounts || {}).reduce((sum, num) => sum + (Number(num) || 0), 0);
        if (totalSelectedByTopic === 0) {
          dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgValidationError', textKey: 'msgErrorNoQuestionsSelectedByTopic' } });
          return;
        }
      }
      
      dispatch({ 
        type: 'UPDATE_TEST_SPECIFIC_SETTINGS', 
        payload: { profileId: activeProfile.id, settings: settingsToSave } 
      });
      dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgSettingsSaved', textKey: 'msgSettingsSavedDetail'}});
    } else {
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgError', textKey: 'msgSavingErrorDetail'}});
    }
  };
  
  const numQuestionsInProfile = activeProfile?.questions?.length || 0;
  const totalSelectedByTopic = useMemo(() => {
    return Object.values(currentSettings.topicQuestionCounts || {}).reduce((sum, count) => sum + (Number(count) || 0), 0);
  }, [currentSettings.topicQuestionCounts]);

  const inputBaseClasses = "block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400";
  const toggleBaseClasses = "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900";
  const toggleEnabledClasses = "bg-indigo-600 dark:bg-indigo-500";
  const toggleDisabledClasses = "bg-slate-300 dark:bg-slate-600";
  const toggleKnobClasses = "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-300 shadow ring-0 transition duration-200 ease-in-out";


  if (!activeProfile) {
    return <p className="text-center p-4 text-slate-600 dark:text-slate-400">{translate('msgError')}: No active test profile. Redirecting...</p>;
  }

  const selectionModeTranslations: Record<SelectionMode, string> = {
    all: 'settingsSelectionModeAll',
    total: 'settingsSelectionModeTotalNum',
    topic: 'settingsSelectionModeByTopic'
};

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center sm:text-left break-all">
          {translate('testSettingsTitle', { name: activeProfile.name })}
        </h2>
        <button
            onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.TEST_PROFILE_HUB, activeTestProfileId: activeProfile.id }})}
            className="py-2 px-3 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
        >
            <Icon name="arrow-left" size="1em"/> {translate('navBackToHub')}
        </button>
      </div>
      
      <div className="space-y-5 divide-y divide-slate-200 dark:divide-slate-700">
        {/* Question Selection Mode */}
        <div className="pt-5 first:pt-0">
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">{translate('settingsSelectionModeTitle')}</label>
            <div className="space-y-2">
                {(['all', 'total', 'topic'] as SelectionMode[]).map(mode => (
                    <div key={mode} className="flex items-center">
                        <input 
                            type="radio"
                            id={`selection-mode-${mode}`}
                            name="selectionMode"
                            value={mode}
                            checked={selectionMode === mode}
                            onChange={() => handleSelectionModeChange(mode)}
                            className="h-4 w-4 text-indigo-600 border-slate-300 dark:border-slate-500 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-slate-700 dark:checked:bg-indigo-500"
                        />
                        <label htmlFor={`selection-mode-${mode}`} className="ml-2 block text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                            {translate(selectionModeTranslations[mode])}
                        </label>
                    </div>
                ))}
            </div>
        </div>

        {/* Total Number of Questions (if mode is 'total') */}
        {selectionMode === 'total' && (
            <div className="pt-5">
                <label htmlFor="num-questions" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{translate('settingsNumQuestions')}</label>
                <input 
                    type="number" 
                    id="num-questions" 
                    min="1" 
                    max={numQuestionsInProfile > 0 ? numQuestionsInProfile : undefined}
                    value={currentSettings.numQuestions || ''}
                    disabled={numQuestionsInProfile === 0 || currentSettings.useAllQuestions || currentSettings.selectByTopic}
                    onChange={(e) => {
                        const val = e.target.value === '' ? '' : parseInt(e.target.value);
                        if (val === '') {
                            handleSettingChange('numQuestions', '');
                        } else {
                            if (numQuestionsInProfile > 0 && val > numQuestionsInProfile) {
                                handleSettingChange('numQuestions', numQuestionsInProfile);
                            } else if (val < 1) {
                                handleSettingChange('numQuestions', '');
                            } else {
                                handleSettingChange('numQuestions', val);
                            }
                        }
                    }}
                    onBlur={() => {
                        if (!currentSettings.numQuestions) {
                            handleSettingChange('numQuestions', 1);
                        }
                    }}
                    className={`${inputBaseClasses} w-28 disabled:bg-slate-100 dark:disabled:bg-slate-700/30 disabled:cursor-not-allowed`}
                />
                 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total available questions: {numQuestionsInProfile}</p>
            </div>
        )}

        {/* Questions per Topic (if mode is 'topic') */}
        {selectionMode === 'topic' && (
            <div className="pt-5 space-y-3">
                <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300">{translate('settingsPerTopicTitle')}</h3>
                {uniqueTopics.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">{translate('qBankNoQuestions', { name: activeProfile.name })}</p>}
                <div className="grid grid-cols-2 gap-2">
                    {uniqueTopics.map(topic => (
                        <div key={topic} className="flex items-center justify-between bg-white dark:bg-slate-800 p-1.5 rounded-md border border-slate-200 dark:border-slate-700">
                            <div className="flex flex-col min-w-0">
                                <label 
                                    htmlFor={`topic-q-count-${topic.replace(/\s/g, '-')}`} 
                                    className="text-sm text-slate-700 dark:text-slate-300 truncate" 
                                    title={topic}
                                >
                                    {topic.length > 20 ? topic.substring(0, 20) + '...' : topic}
                                </label>
                                <span className="text-xs text-slate-500 dark:text-slate-400">({questionsByTopic[topic]})</span>
                            </div>
                            <input
                                type="number"
                                id={`topic-q-count-${topic.replace(/\s/g, '-')}`}
                                min="0"
                                max={questionsByTopic[topic] || 0}
                                value={currentSettings.topicQuestionCounts?.[topic] || (document.activeElement?.id === `topic-q-count-${topic.replace(/\s/g, '-')}` ? '' : '0')}
                                onChange={(e) => handleTopicCountChange(topic, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className={`${inputBaseClasses} w-14 text-center py-1`}
                                aria-label={`Number of questions for topic ${topic}`}
                            />
                        </div>
                    ))}
                </div>
                {uniqueTopics.length > 0 && (
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 pt-2">
                        {translate('settingsTotalTopicQuestions', { count: totalSelectedByTopic })}
                    </p>
                )}
            </div>
        )}


        {/* Timer Settings */}
        <div className="pt-5">
            <div className="flex items-center justify-between p-1">
                <label htmlFor="enable-timer-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">{translate('settingsEnableTimer')}</label>
                <button
                    id="enable-timer-toggle"
                    onClick={() => handleSettingChange('enableTimer', !currentSettings.enableTimer)}
                    type="button"
                    className={`${currentSettings.enableTimer ? toggleEnabledClasses : toggleDisabledClasses} ${toggleBaseClasses}`}
                    role="switch"
                    aria-checked={currentSettings.enableTimer}
                >
                    <span className="sr-only">{translate('settingsEnableTimer')}</span>
                    <span className={`${currentSettings.enableTimer ? 'translate-x-5' : 'translate-x-0'} ${toggleKnobClasses}`}></span>
                </button>
            </div>

            {currentSettings.enableTimer && (
                <div className="mt-3 pl-1">
                    <label htmlFor="timer-duration" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{translate('settingsTimerDurationMinutes')}</label>
                    <input 
                        type="number" 
                        id="timer-duration" 
                        min="1"
                        value={currentSettings.timerDurationMinutes || ''}
                        onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseInt(e.target.value);
                            if (val === '') {
                                handleSettingChange('timerDurationMinutes', '');
                            } else {
                                handleSettingChange('timerDurationMinutes', val < 1 ? '' : val);
                            }
                        }}
                        onBlur={() => {
                            if (!currentSettings.timerDurationMinutes) {
                                handleSettingChange('timerDurationMinutes', 1);
                            }
                        }}
                        className={`${inputBaseClasses} w-28`}
                    />
                </div>
            )}
        </div>
        
        <div className="pt-5">
            <label htmlFor="answer-numbering-style" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{translate('settingsAnswerNumbering')}</label>
            <select 
            id="answer-numbering-style"
            value={currentSettings.answerNumberingStyle}
            onChange={(e) => handleSettingChange('answerNumberingStyle', e.target.value as AnswerNumberingStyle)}
            className={inputBaseClasses}
            >
            <option value={AnswerNumberingStyle.NUMBERS}>{translate('numberingNumbers')}</option>
            <option value={AnswerNumberingStyle.LETTERS_UPPER}>{translate('numberingLettersUpper')}</option>
            <option value={AnswerNumberingStyle.LETTERS_LOWER}>{translate('numberingLettersLower')}</option>
            <option value={AnswerNumberingStyle.NONE}>{translate('numberingNone')}</option>
            </select>
        </div>
        
        <div className="pt-5 flex items-center justify-between p-1">
            <label htmlFor="randomize-questions-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">{translate('settingsRandomQuestions')}</label>
            <button
                id="randomize-questions-toggle"
                onClick={() => handleSettingChange('randomizeQuestions', !currentSettings.randomizeQuestions)}
                type="button"
                className={`${currentSettings.randomizeQuestions ? toggleEnabledClasses : toggleDisabledClasses} ${toggleBaseClasses}`}
                role="switch"
                aria-checked={currentSettings.randomizeQuestions}
            >
                <span className="sr-only">{translate('settingsRandomQuestions')}</span>
                <span className={`${currentSettings.randomizeQuestions ? 'translate-x-5' : 'translate-x-0'} ${toggleKnobClasses}`}></span>
            </button>
        </div>
        <div className="pt-5 flex items-center justify-between p-1">
            <label htmlFor="randomize-answers-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">{translate('settingsRandomAnswers')}</label>
            <button
                id="randomize-answers-toggle"
                onClick={() => handleSettingChange('randomizeAnswers', !currentSettings.randomizeAnswers)}
                type="button"
                className={`${currentSettings.randomizeAnswers ? toggleEnabledClasses : toggleDisabledClasses} ${toggleBaseClasses}`}
                role="switch"
                aria-checked={currentSettings.randomizeAnswers}
            >
                <span className="sr-only">{translate('settingsRandomAnswers')}</span>
                <span className={`${currentSettings.randomizeAnswers ? 'translate-x-5' : 'translate-x-0'} ${toggleKnobClasses}`}></span>
            </button>
        </div>
      </div>


      <div className="mt-8 flex justify-center pt-4">
        <button 
          onClick={handleSaveSettings}
          disabled={!activeProfile}
          className="py-2.5 px-8 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors disabled:opacity-60 shadow-md hover:shadow-lg"
        >
          {translate('settingsSaveBtn')} 
        </button>
      </div>
    </div>
  );
};


export default TestSettingsView;
