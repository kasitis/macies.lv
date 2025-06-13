
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Language } from '@/types.ts';
import Icon from './Icon.tsx';

const GeneralSettingsView: React.FC = () => {
  const { state, dispatch, translate } = useAppContext();
  const { generalSettings } = state; 

  const handleLanguageChange = (lang: Language) => {
      dispatch({ type: 'UPDATE_GENERAL_SETTINGS', payload: { currentLanguage: lang } });
  };

  const handleDarkModeToggle = () => {
    dispatch({ type: 'UPDATE_GENERAL_SETTINGS', payload: { darkMode: !generalSettings.darkMode } });
  };

  const handleClearAllData = () => {
    dispatch({type: 'OPEN_CONFIRM_MODAL', payload: {
      titleKey: 'msgClearAllDataConfirm', 
      textKey: 'settingsClearDataWarning', 
      onConfirm: () => {
        dispatch({ type: 'CLEAR_ALL_USER_DATA' }); 
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgDataCleared', textKey: 'msgDataClearedDetail' }});
      }
    }});
  };

  const inputBaseClasses = "block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400";
  const toggleBaseClasses = "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900";
  const toggleEnabledClasses = "bg-indigo-600 dark:bg-indigo-500";
  const toggleDisabledClasses = "bg-slate-300 dark:bg-slate-600";
  const toggleKnobClasses = "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white dark:bg-slate-300 shadow ring-0 transition duration-200 ease-in-out";

  return (
    <div className="space-y-8 max-w-md mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-slate-900 dark:text-slate-100">{translate('generalSettingsTitle')}</h2>

      <div className="pt-2 space-y-5 divide-y divide-slate-200 dark:divide-slate-700">
        <div className="pt-4 first:pt-0">
          <label htmlFor="language-selector" className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">{translate('settingsLanguageTitle')}</label>
          <select 
            id="language-selector" 
            value={generalSettings.currentLanguage}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className={inputBaseClasses}
          >
            <option value={Language.LV}>Latviešu</option>
            <option value={Language.EN}>English</option>
            <option value={Language.UK}>Українська</option>
          </select>
        </div>

        <div className="pt-5">
            <div className="flex items-center justify-between">
                <label htmlFor="dark-mode-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                {translate('settingsDarkMode')}
                </label>
                <button
                    id="dark-mode-toggle"
                    onClick={handleDarkModeToggle}
                    type="button"
                    className={`${generalSettings.darkMode ? toggleEnabledClasses : toggleDisabledClasses} ${toggleBaseClasses}`}
                    role="switch"
                    aria-checked={generalSettings.darkMode}
                >
                    <span className="sr-only">{translate('settingsDarkMode')}</span>
                    <span
                        aria-hidden="true"
                        className={`${generalSettings.darkMode ? 'translate-x-5' : 'translate-x-0'} ${toggleKnobClasses}`}
                    >
                    <span
                            className={`${generalSettings.darkMode ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'} absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                            aria-hidden="true"
                        >
                            <Icon name="sun" className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        </span>
                        <span
                            className={`${generalSettings.darkMode ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'} absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                            aria-hidden="true"
                        >
                            <Icon name="moon" className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                        </span>
                    </span>
                </button>
            </div>
        </div>
      
        <div className="pt-5">
            <h3 className="text-md font-semibold mb-2 text-slate-700 dark:text-slate-300">{translate('settingsDataManagement')}</h3>
            <button 
            onClick={handleClearAllData}
            className="w-full py-2.5 px-4 rounded-md flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white font-semibold transition-colors shadow-sm hover:shadow-md"
            >
            <Icon name="trash-2" size="1.1em" />
            {translate('settingsClearDataBtn')}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">{translate('settingsClearDataWarning')}</p>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettingsView;