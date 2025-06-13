
import React, {useEffect} from 'react'; 
import { useAppContext } from '@/contexts/AppContext';
import Icon from './Icon.tsx';
import { AppView } from '@/types.ts'; 

const formatDisplayTime = (totalSeconds: number | null, translateFn: (key: string, replacements?: Record<string, string | number>) => string): string => {
  if (totalSeconds === null || totalSeconds === undefined) {
    return translateFn('timerNotEnabled');
  }
  if (totalSeconds < 0) return translateFn('timerNotEnabled'); 

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return translateFn('timeMinutesSeconds', { minutes, seconds });
};


const StatsView: React.FC = () => {
  const { state, dispatch, translate, activeProfile } = useAppContext();
  
  useEffect(() => {
    if (!activeProfile && state.activeView === AppView.STATS) {
        dispatch({ type: 'SET_VIEW', payload: { view: AppView.MY_TESTS, activeTestProfileId: null } });
    }
  }, [activeProfile, state.activeView, dispatch]);


  if (!activeProfile) {
    return <p className="text-center p-4 text-slate-600 dark:text-slate-400">{translate('msgError')}: No active test profile selected. Redirecting...</p>;
  }

  const historyForProfile = activeProfile.history;
  const totalTests = historyForProfile.length;
  const averageScore = totalTests > 0 ? (historyForProfile.reduce((sum: any, item: { percentage: any; }) => sum + item.percentage, 0) / totalTests).toFixed(1) : '0';
  const bestScore = totalTests > 0 ? Math.max(...historyForProfile.map((item: { percentage: any; }) => item.percentage)).toFixed(1) : '0';

  const handleClearHistory = () => {
    dispatch({type: 'OPEN_CONFIRM_MODAL', payload: {
      titleKey: 'statsClearHistoryConfirm',
      textKey: 'statsClearHistoryConfirmDetail',
      textReplacements: { name: activeProfile.name }, 
      onConfirm: () => {
        if (activeProfile) {
          dispatch({ type: 'CLEAR_HISTORY_FOR_PROFILE', payload: activeProfile.id });
          dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'statsHistoryCleared', textKey: 'statsHistoryClearedDetail', textReplacements: { name: activeProfile.name } }});
        }
      }
    }});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center sm:text-left break-all">
          {translate('statsTitle', {name: activeProfile.name})}
        </h2>
        <button
            onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.TEST_PROFILE_HUB, activeTestProfileId: activeProfile.id }})}
            className="py-2 px-3 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
        >
            <Icon name="arrow-left" size="1em"/> {translate('navBackToHub')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl shadow-lg text-center">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{translate('statsTotalTests')}</h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{totalTests}</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl shadow-lg text-center">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{translate('statsAverageScore')}</h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{averageScore}%</p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl shadow-lg text-center">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{translate('statsBestScore')}</h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{bestScore}%</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{translate('statsHistoryTitle')}</h3>
        {historyForProfile.length > 0 && (
            <button 
                onClick={handleClearHistory}
                className="py-1.5 px-3 text-xs rounded-md bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-sm hover:shadow-md"
            >
                <Icon name="trash-2" size="0.9em" />
                {translate('statsClearHistoryBtn')}
            </button>
        )}
      </div>
      <div className="max-h-[50vh] overflow-y-auto pr-1 space-y-3 custom-scrollbar">
        {historyForProfile.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400 text-center p-6 text-lg">{translate('statsNoHistory', { name: activeProfile.name })}</p>
        ) : (
          [...historyForProfile].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item, index) => (
            <div key={index + '-' + item.date} className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow duration-300">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {translate('statsTestOn')} {new Date(item.date).toLocaleString(state.generalSettings.currentLanguage, { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <p className="text-base font-semibold text-slate-800 dark:text-slate-100 my-0.5">
                {translate('statsScore')} {item.score}/{item.totalPossible} ({item.percentage}%)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {translate('statsTimeTaken')} {formatDisplayTime(item.timeTakenSeconds, translate)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StatsView;