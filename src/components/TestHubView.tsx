import React, { useEffect } from 'react'; 
import { useAppContext } from '../contexts/AppContext.tsx';
import { AppView } from '../types.ts';
import Icon from './Icon.tsx';

import type { IconName } from './Icon.tsx';

interface ActionCardProps {
  titleKey: string;
  iconName: IconName;
  targetView: AppView;
  editingIdForTarget?: string | null;
  disabled?: boolean;
}

const ActionCard: React.FC<ActionCardProps> = ({ titleKey, iconName, targetView, editingIdForTarget, disabled }) => {
  const { dispatch, translate, activeProfile } = useAppContext(); 

  const handleClick = () => {
    if (disabled || !activeProfile) return; 
    const payload: { view: AppView, editingId?: string | null, activeTestProfileId?: string | null } = 
        { view: targetView, activeTestProfileId: activeProfile.id }; 
    
    if (targetView === AppView.CREATE_EDIT_QUESTION && editingIdForTarget !== undefined) {
      payload.editingId = editingIdForTarget;
    }
    dispatch({ type: 'SET_VIEW', payload });
  };

  const cardClasses = `
    bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg 
    flex flex-col items-center text-center 
    transition-all duration-300 ease-in-out
    ${disabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'hover:shadow-xl hover:scale-105 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
    }
  `;
  const iconContainerClasses = `
    mb-4 p-3 rounded-full ${disabled ? 'bg-gray-200 dark:bg-gray-700' : 'bg-blue-100 dark:bg-blue-900'}
  `;
  const iconClasses = `
    w-8 h-8 ${disabled ? 'text-gray-400 dark:text-gray-500' : 'text-blue-500 dark:text-blue-400'}
  `;

  return (
    <div 
        className={cardClasses} 
        onClick={handleClick} 
        tabIndex={disabled ? -1 : 0} 
        onKeyPress={(e) => { if (e.key === 'Enter' && !disabled) handleClick(); }}
        aria-disabled={disabled}
    >
      <div className={iconContainerClasses}>
        <Icon name={iconName} className={iconClasses} size="2rem" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{translate(titleKey)}</h3>
    </div>
  );
};

const TestProfileHubView: React.FC = () => {
  const { state, dispatch, translate, activeProfile } = useAppContext();

  useEffect(() => {
    if (!activeProfile && state.activeView === AppView.TEST_PROFILE_HUB) { 
        dispatch({type: 'SET_VIEW', payload: {view: AppView.MY_TESTS, activeTestProfileId: null}});
    }
  }, [activeProfile, state.activeView, dispatch]);


  if (!activeProfile) {
    return <p className="text-center p-4 text-gray-600 dark:text-gray-400">{translate('msgError')}: No active test profile selected. Redirecting...</p>;
  }
  
  const canStartTest = activeProfile.questions.length > 0;

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center sm:text-left">
          {translate('testProfileHubTitle', { name: activeProfile.name })}
        </h1>
        <button
            onClick={() => dispatch({type: 'SET_VIEW', payload: {view: AppView.MY_TESTS, activeTestProfileId: null }})} 
            className="py-2 px-4 text-sm rounded-md bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors flex items-center gap-2 self-center sm:self-auto"
        >
            <Icon name="arrow-left" size="1em"/> {translate('testHubBackToAllTests')}
        </button>
      </div>
      
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            titleKey="testHubStartTest"
            iconName="play-circle"
            targetView={AppView.QUIZ}
            disabled={!canStartTest}
          />
          <ActionCard
            titleKey="testHubManageBank"
            iconName="list-checks"
            targetView={AppView.QUESTION_BANK}
          />
          <ActionCard
            titleKey="testHubAddQuestion"
            iconName="plus-circle"
            targetView={AppView.CREATE_EDIT_QUESTION}
            editingIdForTarget={null} 
          />
          <ActionCard
            titleKey="testHubViewStats"
            iconName="bar-chart-2"
            targetView={AppView.STATS}
          />
          <ActionCard
            titleKey="testHubConfigure"
            iconName="settings-2"
            targetView={AppView.TEST_SETTINGS}
          />
        </div>
      </section>
      {!canStartTest && (
          <p className="text-center text-sm text-orange-500 dark:text-orange-400 mt-4">
              {translate('quizNoQuestionsAvailable', {name: activeProfile.name})} {translate('quizNoQuestionsAdvice')}
          </p>
      )}
    </div>
  );
};

export default TestProfileHubView;