import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppView } from '@/types.ts';
import Icon, { IconName } from './Icon.tsx'; // <-- FIX #1

interface GameCardProps {
  titleKey: string;
  descriptionKey: string;
  iconName: IconName; // <-- FIX #2
  targetView: AppView;
}

const GameCard: React.FC<GameCardProps> = ({ titleKey, descriptionKey, iconName, targetView }) => {
  const { dispatch, translate } = useAppContext();

  const handleClick = () => {
    dispatch({ type: 'SET_VIEW', payload: { view: targetView } });
  };

  return (
    <div 
      className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg flex flex-col items-center text-center transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.03] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
      onClick={handleClick}
      tabIndex={0}
      onKeyPress={(e) => { if (e.key === 'Enter') handleClick(); }}
    >
      <div className="mb-5 p-3.5 rounded-full bg-green-100 dark:bg-green-900/60">
        <Icon name={iconName} className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" size="2rem" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">{translate(titleKey)}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{translate(descriptionKey)}</p>
    </div>
  );
};

const GamesHubView: React.FC = () => {
  const { translate, dispatch } = useAppContext();

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 text-center sm:text-left">
          {translate('gamesHubTitle')}
        </h1>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.HOME } })}
          className="py-2 px-4 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-2 self-center sm:self-auto"
        >
          <Icon name="arrow-left" size="1em" /> {translate('navHome')}
        </button>
      </div>
      
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <GameCard
            titleKey="wordleLvGameTitle"
            descriptionKey="wordleLvGameDesc"
            iconName="edit-2" 
            targetView={AppView.WORDLE_LV}
          />
          <GameCard
            titleKey="numberCruncherGameTitle"
            descriptionKey="numberCruncherGameDesc"
            iconName="calculator"
            targetView={AppView.NUMBER_CRUNCHER}
          />
        </div>
      </section>
    </div>
  );
};

export default GamesHubView;