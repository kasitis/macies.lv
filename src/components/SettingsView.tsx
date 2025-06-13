
import React, { useEffect, useState, useMemo } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AnswerNumberingStyle, TestSpecificSettings, AppView } from '@/types.ts';
import { DEFAULT_TEST_SPECIFIC_SETTINGS } from '@/constants.ts';
import Icon from './Icon.tsx';


const TestSettingsView: React.FC = () => {
  const { state, dispatch, translate, activeProfile } = useAppContext();
  
  const [currentSettings, setCurrentSettings] = useState<TestSpecificSettings>(
    activeProfile ? activeProfile.settings : DEFAULT_TEST_SPECIFIC_SETTINGS
  );

  const settingsSignature = useMemo(() => 
    JSON.stringify(activeProfile?.settings || DEFAULT_TEST_SPECIFIC_SETTINGS), 
    [activeProfile?.settings]
  );

  useEffect(() => {
    if (activeProfile) {
      setCurrentSettings(prev => ({
        ...DEFAULT_TEST_SPECIFIC_SETTINGS,
        ...prev, 
        ...activeProfile.settings 
      }));
    } else if(state.activeView === AppView.TEST_SETTINGS) { 
      setCurrentSettings(DEFAULT_TEST_SPECIFIC_SETTINGS); 
      dispatch({ type: 'SET_VIEW', payload: { view: AppView.MY_TESTS, activeTestProfileId: null } });
    }
  }, [activeProfile, settingsSignature, state.activeView, dispatch]);

  const handleSettingChange = (key: keyof TestSpecificSettings, value: any) => {
    setCurrentSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const handleSaveSettings = () => {
    if (activeProfile) {
      if(currentSettings.enableTimer && currentSettings.timerDurationMinutes <= 0){
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgValidationError', textKey: 'timerMustBePositive'}});
        return;
      }
      dispatch({ 
        type: 'UPDATE_TEST_SPECIFIC_SETTINGS', 
        payload: { profileId: activeProfile.id, settings: currentSettings } 
      });
      dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgSettingsSaved', textKey: 'msgSettingsSavedDetail'}});
    } else {
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgError', textKey: 'msgSavingErrorDetail'}});
    }
  };
  
  const numQuestionsInProfile = activeProfile?.questions?.length || 0;
  const inputBaseClasses = "block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400";
  const toggleBaseClasses = "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900";
  const toggleEnabledClasses = "bg-indigo-600 dark:bg-indigo-500";
  const toggleDisabledClasses = "bg-slate-300 dark:bg-slate-600";
  const toggleKnobClasses = "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-300 shadow ring-0 transition duration-200 ease-in-out";


  if (!activeProfile) {
    return <p className="text-center p-4 text-slate-600 dark:text-slate-400">{translate('msgError')}: No active test profile. Redirecting...</p>;
  }

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
        {/* Timer Settings */}
        <div className="pt-5 first:pt-0">
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
                        value={currentSettings.timerDurationMinutes}
                        onChange={(e) => handleSettingChange('timerDurationMinutes', parseInt(e.target.value) || 1)}
                        className={`${inputBaseClasses} w-28`}
                    />
                </div>
            )}
        </div>

        {/* Existing Settings */}
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
        
        <div className="pt-5">
            <label htmlFor="num-questions" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{translate('settingsNumQuestions')}</label>
            <div className="flex items-center mt-1">
            <input 
                type="number" 
                id="num-questions" 
                min="1" 
                max={numQuestionsInProfile > 0 ? numQuestionsInProfile : undefined}
                value={currentSettings.useAllQuestions ? numQuestionsInProfile : currentSettings.numQuestions}
                disabled={currentSettings.useAllQuestions || numQuestionsInProfile === 0}
                onChange={(e) => {
                    let val = parseInt(e.target.value);
                    if (isNaN(val) || val < 1) val = 1;
                    if (numQuestionsInProfile > 0 && val > numQuestionsInProfile) val = numQuestionsInProfile;
                    handleSettingChange('numQuestions', val);
                }}
                className={`${inputBaseClasses} w-28 disabled:bg-slate-100 dark:disabled:bg-slate-700/30 disabled:cursor-not-allowed`}
            />
            <label htmlFor="all-questions-checkbox" className="ml-4 flex items-center cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
                <input 
                type="checkbox"
                id="all-questions-checkbox"
                checked={currentSettings.useAllQuestions}
                disabled={numQuestionsInProfile === 0}
                onChange={(e) => handleSettingChange('useAllQuestions', e.target.checked)}
                className="h-4 w-4 rounded mr-1.5 border-slate-400 dark:border-slate-500 text-indigo-600 dark:text-indigo-500 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer disabled:cursor-not-allowed"
                /> 
                {translate('settingsAllQuestions')} ({numQuestionsInProfile})
            </label>
            </div>
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