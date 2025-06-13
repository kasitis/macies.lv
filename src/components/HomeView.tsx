
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppView } from '@/types.ts';
import Icon from '@/components/Icon';

import type { IconName } from '@/components/Icon';

interface ModuleCardProps {
  titleKey: string;
  descriptionKey: string;
  iconName: IconName;
  targetView?: AppView;
  comingSoon?: boolean;
  iconColorClass?: string; 
}

const ModuleCard: React.FC<ModuleCardProps> = ({ titleKey, descriptionKey, iconName, targetView, comingSoon, iconColorClass = 'indigo' }) => {
  const { dispatch, translate } = useAppContext();

  const handleClick = () => {
    if (targetView && !comingSoon) {
      dispatch({ type: 'SET_VIEW', payload: { view: targetView } });
    }
  };

  const cardClasses = `
    bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg 
    flex flex-col items-center text-center 
    transition-all duration-300 ease-in-out
    ${comingSoon
      ? 'opacity-60 cursor-default'
      : 'hover:shadow-2xl hover:scale-[1.03] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
    }
  `;

  const colorConfig = {
    indigo: {
      bg: 'bg-indigo-100 dark:bg-indigo-900/60',
      text: 'text-indigo-600 dark:text-indigo-400',
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/60',
      text: 'text-green-600 dark:text-green-400',
    },
    sky: { 
      bg: 'bg-sky-100 dark:bg-sky-900/60',
      text: 'text-sky-600 dark:text-sky-400',
    },
    amber: { 
      bg: 'bg-amber-100 dark:bg-amber-900/60',
      text: 'text-amber-600 dark:text-amber-400',
    },
    rose: { 
      bg: 'bg-rose-100 dark:bg-rose-900/60',
      text: 'text-rose-600 dark:text-rose-400',
    },
    slate: { 
      bg: 'bg-slate-200 dark:bg-slate-700',
      text: 'text-slate-400 dark:text-slate-500',
    }
  };
  
  const currentBgColor = comingSoon ? colorConfig.slate.bg : (colorConfig[iconColorClass as keyof typeof colorConfig]?.bg || colorConfig.indigo.bg);
  const currentTextColor = comingSoon ? colorConfig.slate.text : (colorConfig[iconColorClass as keyof typeof colorConfig]?.text || colorConfig.indigo.text);


  const iconContainerClasses = `
    mb-5 p-3.5 rounded-full ${currentBgColor}
  `;
  const iconClasses = `
    w-7 h-7 sm:w-8 sm:h-8 ${currentTextColor}
  `;

  return (
    <div className={cardClasses} onClick={!comingSoon ? handleClick : undefined} tabIndex={!comingSoon ? 0 : -1} onKeyPress={(e) => { if (e.key === 'Enter' && !comingSoon) handleClick(); }}>
      <div className={iconContainerClasses}>
        <Icon name={iconName} className={iconClasses} size="2rem" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-slate-800 dark:text-slate-100">{translate(titleKey)}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
        {translate(descriptionKey)}
        {comingSoon && <span className="block text-xs italic mt-1.5 text-slate-500 dark:text-slate-400">{translate('homeComingSoon')}</span>}
      </p>
    </div>
  );
};

const HomeView: React.FC = () => {
  return (
    <div className="space-y-8 py-4">
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          <ModuleCard
            titleKey="homeInteractiveTestsTitle"
            descriptionKey="homeInteractiveTestsDesc"
            iconName="file-text"
            targetView={AppView.MY_TESTS}
            iconColorClass="indigo"
          />
           <ModuleCard
            titleKey="homeFlashcardsTitle"
            descriptionKey="homeFlashcardsDesc"
            iconName="copy"
            targetView={AppView.FLASHCARD_DECKS_LIST}
            comingSoon={false}
            iconColorClass="amber" 
          />
          <ModuleCard
            titleKey="homeGamesTitle" 
            descriptionKey="homeGamesDesc" 
            iconName="play-circle" 
            targetView={AppView.GAMES_HUB} 
            comingSoon={false} 
            iconColorClass="green"
          />
          <ModuleCard
            titleKey="homeArticlesTitle"
            descriptionKey="homeArticlesDesc"
            iconName="book-open" 
            targetView={AppView.ARTICLES_LIST}
            comingSoon={false} 
            iconColorClass="rose" 
          />
        </div>
      </section>
    </div>
  );
};

export default HomeView;