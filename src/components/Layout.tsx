import React, { ReactNode } from 'react';
import { useAppContext } from '../contexts/AppContext.tsx';
import { AppView } from '../types.ts';
import Icon from './Icon.tsx';
import styled from 'styled-components';

const LayoutContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px; // Added padding left and right for spacing
  /* If you prefer a border instead of padding, you could use:
     border-left: 5px solid #333;
     border-right: 5px solid #333;
  */
`;

const Header: React.FC = () => {
  const { translate, dispatch, state } = useAppContext();
  const isActive = state.activeView === AppView.GENERAL_SETTINGS;
  
  return (
    <div className="bg-white dark:bg-slate-900 w-full mb-2 p-3.5 rounded-lg shadow-md flex justify-between items-center">
      <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white">{translate('appTitle')}</h1>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="text-xs text-right hidden sm:block">
          <span className="text-slate-500 dark:text-slate-400">{translate('dataSource')}: </span>
          <span className="font-mono text-slate-700 dark:text-slate-300">{translate('dataSourceBrowserMemory')}</span>
        </div>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.GENERAL_SETTINGS }})}
          title={translate('navSettingsGeneral')}
          className={`p-2 rounded-full transition-colors duration-150 
                      ${isActive 
                        ? 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
        >
          <Icon name="settings" className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`} />
        </button>
      </div>
    </div>
  );
};

import type { IconName } from './Icon.tsx';

interface NavItemProps {
  view: AppView;
  iconName: IconName;
  labelKey: string;
}

const NavItem: React.FC<NavItemProps> = ({ view, iconName, labelKey }) => {
  const { state, dispatch, translate } = useAppContext();
  
  const handleClick = () => {
    const payload: { view: AppView, activeTestProfileId?: string | null } = { view };
    if (view === AppView.HOME || view === AppView.MY_TESTS) {
        payload.activeTestProfileId = null; 
    }
    dispatch({ type: 'SET_VIEW', payload });
  };
  
  let isActive = state.activeView === view;

  // Broader active state for MY_TESTS encompassing all test-related sub-views
  if (view === AppView.MY_TESTS) {
    const testModuleRelatedViews = [
        AppView.MY_TESTS, 
        AppView.TEST_PROFILE_HUB, 
        AppView.QUIZ, 
        AppView.QUESTION_BANK, 
        AppView.CREATE_EDIT_QUESTION, 
        AppView.STATS, 
        AppView.TEST_SETTINGS
    ];
    isActive = testModuleRelatedViews.includes(state.activeView);
  }

  const navButtonBase = "py-2.5 px-3 sm:px-4 rounded-md flex items-center gap-2 transition-colors duration-150 text-sm sm:text-base font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:focus-visible:ring-indigo-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900";
  const activeClasses = "bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300";
  const inactiveClasses = "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700";

  return (
    <button
      onClick={handleClick}
      className={`${navButtonBase} ${isActive ? activeClasses : inactiveClasses}`}
    >
      <Icon name={iconName} className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
      <span className="hidden sm:inline">{translate(labelKey)}</span>
      <span className="sm:hidden">{translate(labelKey).substring(0,5)}..</span>
    </button>
  );
};

const Navigation: React.FC = () => {
  const navItems: NavItemProps[] = [
    { view: AppView.HOME, iconName: 'home', labelKey: 'navHome' },
    { view: AppView.MY_TESTS, iconName: 'list', labelKey: 'navMyTests' }, 
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 w-full mb-4 p-2 rounded-lg shadow-md flex flex-wrap justify-center sm:justify-start items-center gap-1 sm:gap-2">
      {navItems.map(item => <NavItem key={item.view + item.labelKey} {...item} />)}
    </nav>
  );
};

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="dark min-h-screen">
      <LayoutContainer>
        <Header />
        <Navigation />
        <main className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-lg shadow-xl w-full min-h-[60vh]">
          {children}
        </main>
      </LayoutContainer>
    </div>
  );
};

export default Layout;