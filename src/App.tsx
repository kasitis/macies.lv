
import React, { useEffect } from 'react';
import { AppProvider, useAppContext } from './contexts/AppContext.js';
import { AppView } from './types.js';
import Layout from '@/components/Layout'; 
import HomeView from './components/HomeView.js';
import MyTestsView from './components/MyTestsView.js'; 
import TestProfileHubView from './components/TestProfileHubView.js'; 
import QuizView from './components/QuizView.js';
import QuestionBankView from './components/QuestionBankView.js';
import CreateEditQuestionView from './components/CreateEditQuestionView.js';
import StatsView from './components/StatsView.js';
import TestSettingsView from './components/SettingsView.js'; 
import GeneralSettingsView from './components/GeneralSettingsView.js'; 
import { MessageModal, ConfirmModal, XlsxCsvMappingModal } from './components/Modals.tsx';
import GamesHubView from '@/components/GamesHubView';
import WordleLvView from '@/components/WordleLvView';
import NumberCruncherView from '@/components/NumberCruncherView';
// Flashcard imports
import FlashcardDecksListView from './components/FlashcardDecksListView.js';
import CreateEditFlashcardDeckView from './components/CreateEditFlashcardDeckView.js';
import FlashcardDeckHubView from './components/FlashcardDeckHubView.js';
import CreateEditFlashcardView from './components/CreateEditFlashcardView.js';
import FlashcardStudyView from './components/FlashcardStudyView.js';
// Article imports
import ArticlesListView from './components/ArticlesListView.js';
import ArticleView from './components/ArticleView.js';



const AppContent: React.FC = () => {
  const { state, translate } = useAppContext();

  useEffect(() => {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      try {
        window.lucide.createIcons();
      } catch (e) {
        console.error("Error creating Lucide icons:", e);
      }
    }
  }, [state.activeView, state.isMessageModalOpen, state.isConfirmModalOpen, state.isXlsxMappingModalOpen]);

  useEffect(() => {
      document.title = translate('appTitle') + " (React)";
  }, [translate, state.generalSettings.currentLanguage]);


  const renderView = () => {
    switch (state.activeView) {
      case AppView.HOME:
        return <HomeView />;
      case AppView.MY_TESTS: 
        return <MyTestsView />;
      case AppView.TEST_PROFILE_HUB: 
        return <TestProfileHubView />;
      case AppView.QUIZ:
        return <QuizView />;
      case AppView.QUESTION_BANK:
        return <QuestionBankView />;
      case AppView.CREATE_EDIT_QUESTION:
        return <CreateEditQuestionView />;
      case AppView.STATS:
        return <StatsView />;
      case AppView.TEST_SETTINGS:
        return <TestSettingsView />;
      case AppView.GENERAL_SETTINGS:
        return <GeneralSettingsView />;
      case AppView.GAMES_HUB: 
        return <GamesHubView />;
      case AppView.WORDLE_LV: 
        return <WordleLvView />;
      case AppView.NUMBER_CRUNCHER: 
        return <NumberCruncherView />;
      // Flashcard Views
      case AppView.FLASHCARD_DECKS_LIST:
        return <FlashcardDecksListView />;
      case AppView.FLASHCARD_CREATE_EDIT_DECK:
        return <CreateEditFlashcardDeckView />;
      case AppView.FLASHCARD_DECK_HUB:
        return <FlashcardDeckHubView />;
      case AppView.FLASHCARD_CREATE_EDIT_CARD:
        return <CreateEditFlashcardView />;
      case AppView.FLASHCARD_STUDY_MODE:
        return <FlashcardStudyView />;
      // Article Views
      case AppView.ARTICLES_LIST:
        return <ArticlesListView />;
      case AppView.ARTICLE_VIEW:
        return <ArticleView />;
      // Chatbot View - Add a case if you have a specific AppView for it
      // For now, let's assume it's part of another view or you'll add it.
      // If ChatbotView is meant to be a main view, ensure AppView enum includes it.
      // Example: case AppView.CHATBOT: return <ChatbotView />;
      default:
        // For testing, temporarily set ChatbotView as default if no other matches
        // return <ChatbotView />; 
        return <HomeView />;
    }
  };

  return (
    <>
      <Layout>
        {renderView()}
      </Layout>
      <MessageModal />
      <ConfirmModal />
      <XlsxCsvMappingModal />
    </>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;