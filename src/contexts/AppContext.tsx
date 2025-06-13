import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useMemo, useState } from 'react';
import { 
    TestProfile, 
    Question, 
    TestSpecificSettings, 
    GeneralAppSettings, 
    QuizHistoryEntry, 
    Language, 
    AppView, 
    Translations,
    FlashcardDeck,
    Flashcard,
    Article,
    ArticleProgress
} from '@/types.ts';
import {
    LOCAL_STORAGE_GENERAL_SETTINGS_KEY,
    LOCAL_STORAGE_TEST_PROFILES_KEY,
    LOCAL_STORAGE_FLASHCARD_DECKS_KEY,
    LOCAL_STORAGE_ARTICLES_KEY,
    LOCAL_STORAGE_ARTICLE_PROGRESS_KEY,
    DEFAULT_GENERAL_APP_SETTINGS,
    DEFAULT_TEST_SPECIFIC_SETTINGS
} from '../constants.ts';
import { translations } from '../constants'; // <-- Use constants.ts for translations

// Helper
const generateNewId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

// Helper function to escape special regex characters
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
};

// State Interface
interface AppState {
  testProfiles: TestProfile[];
  flashcardDecks: FlashcardDeck[];
  articles: Article[];
  articleProgress: ArticleProgress[];
  generalSettings: GeneralAppSettings;
  activeView: AppView;
  activeTestProfileId: string | null;
  editingQuestionId: string | null; 
  activeFlashcardDeckId: string | null;
  editingFlashcardId: string | null;
  activeArticleId: string | null;
  
  isMessageModalOpen: boolean;
  messageModalContent: { titleKey: string; textKey: string; titleReplacements?: Record<string, string | number>; textReplacements?: Record<string, string | number>; };
  isConfirmModalOpen: boolean;
  confirmModalContent: { titleKey: string; textKey: string; textReplacements?: Record<string, string | number>; };
  confirmModalOnConfirm: (() => void) | null;
  isXlsxMappingModalOpen: boolean;
  xlsxSheetData: string[][] | null;
  xlsxFileName: string | null;
  xlsxConfirmCallback: ((mapping: Record<string, string>) => void) | null; 
}

// Action Types
type Action =
  | { type: 'LOAD_INITIAL_DATA'; payload: { testProfiles: TestProfile[]; generalSettings: GeneralAppSettings; flashcardDecks: FlashcardDeck[]; articles: Article[]; articleProgress: ArticleProgress[]; } }
  | { type: 'SET_VIEW'; payload: { view: AppView, editingId?: string | null, activeTestProfileId?: string | null, activeFlashcardDeckId?: string | null, editingFlashcardId?: string | null, activeArticleId?: string | null } }
  | { type: 'SET_ACTIVE_TEST_PROFILE_ID'; payload: string | null } 
  | { type: 'UPDATE_GENERAL_SETTINGS'; payload: Partial<GeneralAppSettings> }
  | { type: 'CREATE_TEST_PROFILE'; payload: { name: string; description?: string } }
  | { type: 'UPDATE_TEST_PROFILE_DETAILS'; payload: { id: string; name: string; description?: string } }
  | { type: 'DELETE_TEST_PROFILE'; payload: string } 
  | { type: 'SET_QUESTIONS_FOR_PROFILE'; payload: { profileId: string, questions: Question[] } }
  | { type: 'ADD_QUESTION_TO_PROFILE'; payload: { profileId: string, question: Question } }
  | { type: 'UPDATE_QUESTION_IN_PROFILE'; payload: { profileId: string, question: Question } }
  | { type: 'DELETE_QUESTION_FROM_PROFILE'; payload: { profileId: string, questionId: string } }
  | { type: 'DELETE_BULK_QUESTIONS_FROM_PROFILE'; payload: { profileId: string, questionIds: string[] } }
  | { type: 'UPDATE_TEST_SPECIFIC_SETTINGS'; payload: { profileId: string, settings: Partial<TestSpecificSettings> } }
  | { type: 'ADD_HISTORY_TO_PROFILE'; payload: { profileId: string, historyEntry: QuizHistoryEntry } }
  | { type: 'CLEAR_HISTORY_FOR_PROFILE'; payload: string } 
  | { type: 'CLEAR_ALL_USER_DATA' } 
  | { type: 'OPEN_MESSAGE_MODAL'; payload: { titleKey: string; textKey: string; titleReplacements?: Record<string, string | number>; textReplacements?: Record<string, string | number>; } }
  | { type: 'CLOSE_MESSAGE_MODAL' }
  | { type: 'OPEN_CONFIRM_MODAL'; payload: { titleKey: string; textKey: string; onConfirm: () => void; textReplacements?: Record<string, string | number>; } }
  | { type: 'CLOSE_CONFIRM_MODAL' }
  | { type: 'OPEN_XLSX_MAPPING_MODAL'; payload: { sheetData: string[][]; fileName: string; onConfirm: (mapping: Record<string, string>) => void; } } 
  | { type: 'CLOSE_XLSX_MAPPING_MODAL' }
  // Flashcard Actions
  | { type: 'CREATE_FLASHCARD_DECK'; payload: { name: string; description?: string } }
  | { type: 'UPDATE_FLASHCARD_DECK_DETAILS'; payload: { id: string; name: string; description?: string } }
  | { type: 'DELETE_FLASHCARD_DECK'; payload: string } 
  | { type: 'ADD_FLASHCARD_TO_DECK'; payload: { deckId: string; card: Flashcard } }
  | { type: 'UPDATE_FLASHCARD_IN_DECK'; payload: { deckId: string; card: Flashcard } }
  | { type: 'DELETE_FLASHCARD_FROM_DECK'; payload: { deckId: string; cardId: string } }
  // Article Actions
  | { type: 'MARK_ARTICLE_AS_READ'; payload: string } // articleId
  | { type: 'MARK_ARTICLE_AS_UNREAD'; payload: string }; // articleId


const initialState: AppState = {
  testProfiles: [],
  flashcardDecks: [],
  articles: [],
  articleProgress: [],
  generalSettings: DEFAULT_GENERAL_APP_SETTINGS,
  activeView: AppView.HOME,
  activeTestProfileId: null,
  editingQuestionId: null,
  activeFlashcardDeckId: null,
  editingFlashcardId: null,
  activeArticleId: null,
  isMessageModalOpen: false,
  messageModalContent: { titleKey: '', textKey: '' },
  isConfirmModalOpen: false,
  confirmModalContent: { titleKey: '', textKey: '' },
  confirmModalOnConfirm: null,
  isXlsxMappingModalOpen: false,
  xlsxSheetData: null,
  xlsxFileName: null,
  xlsxConfirmCallback: null, 
};

// Reducer
const appReducer = (state: AppState, action: Action): AppState => {
  let updatedTestProfiles;
  let updatedFlashcardDecks;
  let updatedArticleProgress;

  switch (action.type) {
    case 'LOAD_INITIAL_DATA':
      return { 
        ...state, 
        testProfiles: action.payload.testProfiles, 
        generalSettings: action.payload.generalSettings,
        flashcardDecks: action.payload.flashcardDecks,
        articles: action.payload.articles,
        articleProgress: action.payload.articleProgress,
        activeView: AppView.HOME, 
        activeTestProfileId: null, 
        editingQuestionId: null,
        activeFlashcardDeckId: null,
        editingFlashcardId: null,
        activeArticleId: null,
      };
    case 'SET_VIEW':
      let newActiveTestProfileId = state.activeTestProfileId;
      if (action.payload.activeTestProfileId !== undefined) {
        newActiveTestProfileId = action.payload.activeTestProfileId;
      }
      
      const newEditingQuestionId = action.payload.view === AppView.CREATE_EDIT_QUESTION
                                  ? (action.payload.editingId !== undefined ? action.payload.editingId : state.editingQuestionId) 
                                  : null; 

      let newActiveFlashcardDeckId = state.activeFlashcardDeckId;
      if (action.payload.activeFlashcardDeckId !== undefined) {
          newActiveFlashcardDeckId = action.payload.activeFlashcardDeckId;
      }
      const newEditingFlashcardId = (action.payload.view === AppView.FLASHCARD_CREATE_EDIT_DECK || action.payload.view === AppView.FLASHCARD_CREATE_EDIT_CARD)
                                  ? (action.payload.editingId !== undefined ? action.payload.editingId : (action.payload.view === AppView.FLASHCARD_CREATE_EDIT_DECK ? state.activeFlashcardDeckId : state.editingFlashcardId))
                                  : null;
      
      let newActiveArticleId = state.activeArticleId;
      if (action.payload.activeArticleId !== undefined) {
          newActiveArticleId = action.payload.activeArticleId;
      }
                                  
      const nonProfileSpecificViews: AppView[] = [
          AppView.HOME, AppView.MY_TESTS, AppView.GENERAL_SETTINGS, 
          AppView.GAMES_HUB, AppView.WORDLE_LV, AppView.NUMBER_CRUNCHER, 
          AppView.FLASHCARD_DECKS_LIST, AppView.ARTICLES_LIST
      ];
      
      if (nonProfileSpecificViews.includes(action.payload.view)) {
        if (action.payload.activeTestProfileId === undefined) newActiveTestProfileId = null;
        if (action.payload.activeFlashcardDeckId === undefined) newActiveFlashcardDeckId = null;
        if (action.payload.activeArticleId === undefined) newActiveArticleId = null;
      } else if (action.payload.view !== AppView.ARTICLE_VIEW && action.payload.activeArticleId === undefined){
        newActiveArticleId = null; // Clear active article if not an article view and not explicitly set
      }
      
      return { 
        ...state, 
        activeView: action.payload.view, 
        editingQuestionId: newEditingQuestionId, 
        activeTestProfileId: newActiveTestProfileId,
        activeFlashcardDeckId: newActiveFlashcardDeckId,
        editingFlashcardId: newEditingFlashcardId,
        activeArticleId: newActiveArticleId,
      };
    
    case 'SET_ACTIVE_TEST_PROFILE_ID':
        return { ...state, activeTestProfileId: action.payload };

    case 'UPDATE_GENERAL_SETTINGS':
      const newGeneralSettings = { ...state.generalSettings, ...action.payload };
      try {
        localStorage.setItem(LOCAL_STORAGE_GENERAL_SETTINGS_KEY, JSON.stringify(newGeneralSettings));
      } catch (error) {
        console.error("Error saving general settings to localStorage:", error);
      }
      return { ...state, generalSettings: newGeneralSettings };

    case 'CREATE_TEST_PROFILE':
      const newProfile: TestProfile = {
        id: generateNewId(),
        name: action.payload.name,
        description: action.payload.description,
        questions: [],
        settings: { ...DEFAULT_TEST_SPECIFIC_SETTINGS },
        history: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedTestProfiles = [...state.testProfiles, newProfile];
      try {
        localStorage.setItem(LOCAL_STORAGE_TEST_PROFILES_KEY, JSON.stringify(updatedTestProfiles));
      } catch (error) {
        console.error("Error saving test profiles to localStorage:", error);
      }
      return { 
          ...state, 
          testProfiles: updatedTestProfiles, 
          activeView: AppView.MY_TESTS, 
          activeTestProfileId: null     
      };

    case 'UPDATE_TEST_PROFILE_DETAILS':
      updatedTestProfiles = state.testProfiles.map(profile =>
        profile.id === action.payload.id
          ? { ...profile, name: action.payload.name, description: action.payload.description, updatedAt: new Date().toISOString() }
          : profile
      );
      try {
        localStorage.setItem(LOCAL_STORAGE_TEST_PROFILES_KEY, JSON.stringify(updatedTestProfiles));
      } catch (error) {
        console.error("Error saving test profiles to localStorage:", error);
      }
      return { ...state, testProfiles: updatedTestProfiles };

    case 'DELETE_TEST_PROFILE':
      updatedTestProfiles = state.testProfiles.filter(profile => profile.id !== action.payload);
      try {
        localStorage.setItem(LOCAL_STORAGE_TEST_PROFILES_KEY, JSON.stringify(updatedTestProfiles));
      } catch (error) {
        console.error("Error saving test profiles to localStorage:", error);
      }
      const newActiveIdOnDelete = state.activeTestProfileId === action.payload ? null : state.activeTestProfileId;
      return { 
        ...state, 
        testProfiles: updatedTestProfiles, 
        activeTestProfileId: newActiveIdOnDelete,
        activeView: updatedTestProfiles.length > 0 ? AppView.MY_TESTS : AppView.HOME 
      };
    
    case 'SET_QUESTIONS_FOR_PROFILE':
        updatedTestProfiles = state.testProfiles.map(p => 
            p.id === action.payload.profileId ? {...p, questions: action.payload.questions, updatedAt: new Date().toISOString()} : p
        );
        try {
            localStorage.setItem(LOCAL_STORAGE_TEST_PROFILES_KEY, JSON.stringify(updatedTestProfiles));
        } catch (error) {
            console.error("Error saving test profiles to localStorage:", error);
        }
        return {...state, testProfiles: updatedTestProfiles};

    case 'ADD_QUESTION_TO_PROFILE':
      updatedTestProfiles = state.testProfiles.map(p =>
        p.id === action.payload.profileId ? { ...p, questions: [...p.questions, action.payload.question], updatedAt: new Date().toISOString() } : p
      );
      try {
        localStorage.setItem(LOCAL_STORAGE_TEST_PROFILES_KEY, JSON.stringify(updatedTestProfiles));
      } catch (error) {
        console.error("Error saving test profiles to localStorage:", error);
      }
      return { ...state, testProfiles: updatedTestProfiles };

    case 'UPDATE_QUESTION_IN_PROFILE':
      updatedTestProfiles = state.testProfiles.map(p =>
        p.id === action.payload.profileId
          ? { ...p, questions: p.questions.map(q => q.id === action.payload.question.id ? action.payload.question : q), updatedAt: new Date().toISOString() }
          : p
      );
      try {
        localStorage.setItem(LOCAL_STORAGE_TEST_PROFILES_KEY, JSON.stringify(updatedTestProfiles));
      } catch (error) {
        console.error("Error saving test profiles to localStorage:", error);
      }
      return { ...state, testProfiles: updatedTestProfiles };

    case 'DELETE_QUESTION_FROM_PROFILE':
      updatedTestProfiles = state.testProfiles.map(p =>
        p.id === action.payload.profileId
          ? { ...p, questions: p.questions.filter(q => q.id !== action.payload.questionId), updatedAt: new Date().toISOString() }
          : p
      );
      try {
        localStorage.setItem(LOCAL_STORAGE_TEST_PROFILES_KEY, JSON.stringify(updatedTestProfiles));
      } catch (error) {
        console.error("Error saving test profiles to localStorage:", error);
      }
      return { ...state, testProfiles: updatedTestProfiles };
      
    case 'DELETE_BULK_QUESTIONS_FROM_PROFILE':
        updatedTestProfiles = state.testProfiles.map(p =>
            p.id === action.payload.profileId
            ? { ...p, questions: p.questions.filter(q => !action.payload.questionIds.includes(q.id)), updatedAt: new Date().toISOString() }
            : p
        );
        try {
            localStorage.setItem(LOCAL_STORAGE_TEST_PROFILES_KEY, JSON.stringify(updatedTestProfiles));
        } catch (error) {
            console.error("Error saving test profiles to localStorage:", error);
        }
        return { ...state, testProfiles: updatedTestProfiles };

    case 'UPDATE_TEST_SPECIFIC_SETTINGS':
      updatedTestProfiles = state.testProfiles.map(p =>
        p.id === action.payload.profileId
          ? { ...p, settings: { ...p.settings, ...action.payload.settings }, updatedAt: new Date().toISOString() }
          : p
      );
      try {
        localStorage.setItem(LOCAL_STORAGE_TEST_PROFILES_KEY, JSON.stringify(updatedTestProfiles));
      } catch (error) {
        console.error("Error saving test profiles to localStorage:", error);
      }
      return { ...state, testProfiles: updatedTestProfiles };

    case 'ADD_HISTORY_TO_PROFILE':
      updatedTestProfiles = state.testProfiles.map(p =>
        p.id === action.payload.profileId
          ? { ...p, history: [...p.history, action.payload.historyEntry], updatedAt: new Date().toISOString() }
          : p
      );
      try {
        localStorage.setItem(LOCAL_STORAGE_TEST_PROFILES_KEY, JSON.stringify(updatedTestProfiles));
      } catch (error) {
        console.error("Error saving test profiles to localStorage:", error);
      }
      return { ...state, testProfiles: updatedTestProfiles };

    case 'CLEAR_HISTORY_FOR_PROFILE':
        updatedTestProfiles = state.testProfiles.map(p =>
            p.id === action.payload ? { ...p, history: [], updatedAt: new Date().toISOString() } : p
        );
        try {
            localStorage.setItem(LOCAL_STORAGE_TEST_PROFILES_KEY, JSON.stringify(updatedTestProfiles));
        } catch (error) {
            console.error("Error saving test profiles to localStorage:", error);
        }
        return { ...state, testProfiles: updatedTestProfiles };

    case 'CLEAR_ALL_USER_DATA':
        try {
            localStorage.removeItem(LOCAL_STORAGE_TEST_PROFILES_KEY);
            localStorage.removeItem(LOCAL_STORAGE_FLASHCARD_DECKS_KEY);
            localStorage.removeItem(LOCAL_STORAGE_ARTICLES_KEY);
            localStorage.removeItem(LOCAL_STORAGE_ARTICLE_PROGRESS_KEY);
        } catch (error) {
            console.error("Error clearing user data from localStorage:", error);
        }
        localStorage.setItem(LOCAL_STORAGE_GENERAL_SETTINGS_KEY, JSON.stringify(DEFAULT_GENERAL_APP_SETTINGS));
        return { ...initialState, generalSettings: { ...DEFAULT_GENERAL_APP_SETTINGS }, flashcardDecks: [], articles: [], articleProgress: [] };

    // Flashcard Reducers
    case 'CREATE_FLASHCARD_DECK':
      const newDeck: FlashcardDeck = {
        id: generateNewId(),
        name: action.payload.name,
        description: action.payload.description,
        flashcards: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedFlashcardDecks = [...state.flashcardDecks, newDeck];
      try {
        localStorage.setItem(LOCAL_STORAGE_FLASHCARD_DECKS_KEY, JSON.stringify(updatedFlashcardDecks));
      } catch (error) { console.error("Error saving flashcard decks:", error); }
      return { ...state, flashcardDecks: updatedFlashcardDecks, activeView: AppView.FLASHCARD_DECKS_LIST, activeFlashcardDeckId: null };

    case 'UPDATE_FLASHCARD_DECK_DETAILS':
      updatedFlashcardDecks = state.flashcardDecks.map(deck =>
        deck.id === action.payload.id
          ? { ...deck, name: action.payload.name, description: action.payload.description, updatedAt: new Date().toISOString() }
          : deck
      );
      try { localStorage.setItem(LOCAL_STORAGE_FLASHCARD_DECKS_KEY, JSON.stringify(updatedFlashcardDecks)); } catch (error) { console.error("Error saving flashcard decks:", error); }
      return { ...state, flashcardDecks: updatedFlashcardDecks };

    case 'DELETE_FLASHCARD_DECK':
      updatedFlashcardDecks = state.flashcardDecks.filter(deck => deck.id !== action.payload);
      try { localStorage.setItem(LOCAL_STORAGE_FLASHCARD_DECKS_KEY, JSON.stringify(updatedFlashcardDecks)); } catch (error) { console.error("Error saving flashcard decks:", error); }
      return { ...state, flashcardDecks: updatedFlashcardDecks, activeFlashcardDeckId: state.activeFlashcardDeckId === action.payload ? null : state.activeFlashcardDeckId };

    case 'ADD_FLASHCARD_TO_DECK':
      updatedFlashcardDecks = state.flashcardDecks.map(deck =>
        deck.id === action.payload.deckId
          ? { ...deck, flashcards: [...deck.flashcards, action.payload.card], updatedAt: new Date().toISOString() }
          : deck
      );
      try { localStorage.setItem(LOCAL_STORAGE_FLASHCARD_DECKS_KEY, JSON.stringify(updatedFlashcardDecks)); } catch (error) { console.error("Error saving flashcard decks:", error); }
      return { ...state, flashcardDecks: updatedFlashcardDecks };

    case 'UPDATE_FLASHCARD_IN_DECK':
      updatedFlashcardDecks = state.flashcardDecks.map(deck =>
        deck.id === action.payload.deckId
          ? { ...deck, flashcards: deck.flashcards.map(card => card.id === action.payload.card.id ? action.payload.card : card), updatedAt: new Date().toISOString() }
          : deck
      );
      try { localStorage.setItem(LOCAL_STORAGE_FLASHCARD_DECKS_KEY, JSON.stringify(updatedFlashcardDecks)); } catch (error) { console.error("Error saving flashcard decks:", error); }
      return { ...state, flashcardDecks: updatedFlashcardDecks };

    case 'DELETE_FLASHCARD_FROM_DECK':
      updatedFlashcardDecks = state.flashcardDecks.map(deck =>
        deck.id === action.payload.deckId
          ? { ...deck, flashcards: deck.flashcards.filter(card => card.id !== action.payload.cardId), updatedAt: new Date().toISOString() }
          : deck
      );
      try { localStorage.setItem(LOCAL_STORAGE_FLASHCARD_DECKS_KEY, JSON.stringify(updatedFlashcardDecks)); } catch (error) { console.error("Error saving flashcard decks:", error); }
      return { ...state, flashcardDecks: updatedFlashcardDecks };
    
    // Article Reducers
    case 'MARK_ARTICLE_AS_READ':
        updatedArticleProgress = state.articleProgress.filter(p => p.articleId !== action.payload); // Remove old entry if exists
        updatedArticleProgress.push({ articleId: action.payload, isRead: true, lastReadAt: new Date().toISOString() });
        try { localStorage.setItem(LOCAL_STORAGE_ARTICLE_PROGRESS_KEY, JSON.stringify(updatedArticleProgress)); } catch (error) { console.error("Error saving article progress:", error); }
        return { ...state, articleProgress: updatedArticleProgress };

    case 'MARK_ARTICLE_AS_UNREAD':
        updatedArticleProgress = state.articleProgress.map(p => 
            p.articleId === action.payload ? { ...p, isRead: false, lastReadAt: new Date().toISOString() } : p
        );
        // If article was not in progress list, add it as unread
        if (!updatedArticleProgress.find(p => p.articleId === action.payload)) {
            updatedArticleProgress.push({ articleId: action.payload, isRead: false, lastReadAt: new Date().toISOString() });
        }
        try { localStorage.setItem(LOCAL_STORAGE_ARTICLE_PROGRESS_KEY, JSON.stringify(updatedArticleProgress)); } catch (error) { console.error("Error saving article progress:", error); }
        return { ...state, articleProgress: updatedArticleProgress };
        
    // Modal Reducers
    case 'OPEN_MESSAGE_MODAL':
      return { ...state, isMessageModalOpen: true, messageModalContent: action.payload };
    case 'CLOSE_MESSAGE_MODAL':
      return { ...state, isMessageModalOpen: false };
    case 'OPEN_CONFIRM_MODAL':
      return { ...state, isConfirmModalOpen: true, confirmModalContent: { titleKey: action.payload.titleKey, textKey: action.payload.textKey, textReplacements: action.payload.textReplacements }, confirmModalOnConfirm: action.payload.onConfirm };
    case 'CLOSE_CONFIRM_MODAL':
      return { ...state, isConfirmModalOpen: false, confirmModalOnConfirm: null };
    case 'OPEN_XLSX_MAPPING_MODAL':
      return { ...state, isXlsxMappingModalOpen: true, xlsxSheetData: action.payload.sheetData, xlsxFileName: action.payload.fileName, xlsxConfirmCallback: action.payload.onConfirm };
    case 'CLOSE_XLSX_MAPPING_MODAL':
      return { ...state, isXlsxMappingModalOpen: false, xlsxSheetData: null, xlsxFileName: null, xlsxConfirmCallback: null };
    default:
      return state;
  }
};

// Context
interface AppContextProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  translate: (key: string, replacements?: Record<string, string | number>) => string;
  activeProfile: TestProfile | undefined;
  activeFlashcardDeck: FlashcardDeck | undefined;
  activeArticle: Article | undefined;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Provider Component
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const storedTestProfiles = localStorage.getItem(LOCAL_STORAGE_TEST_PROFILES_KEY);
    const storedGeneralSettings = localStorage.getItem(LOCAL_STORAGE_GENERAL_SETTINGS_KEY);
    const storedFlashcardDecks = localStorage.getItem(LOCAL_STORAGE_FLASHCARD_DECKS_KEY);
    const storedArticles = localStorage.getItem(LOCAL_STORAGE_ARTICLES_KEY);
    const storedArticleProgress = localStorage.getItem(LOCAL_STORAGE_ARTICLE_PROGRESS_KEY);


    let testProfiles = [];
    try {
        testProfiles = storedTestProfiles ? JSON.parse(storedTestProfiles) : [];
    } catch (e) {
        console.error("Failed to parse stored test profiles, defaulting to empty array.", e);
    }

    let flashcardDecks = [];
    try {
        flashcardDecks = storedFlashcardDecks ? JSON.parse(storedFlashcardDecks) : [];
    } catch (e) {
        console.error("Failed to parse stored flashcard decks, defaulting to empty array.", e);
    }

    let articles = []; // Replace with actual article loading/fetching if needed
    try {
        // Example: articles = storedArticles ? JSON.parse(storedArticles) : MOCK_ARTICLES;
        articles = storedArticles ? JSON.parse(storedArticles) : []; 
    } catch (e) {
        console.error("Failed to parse stored articles, defaulting to empty array.", e);
    }
    
    let articleProgress = [];
    try {
        articleProgress = storedArticleProgress ? JSON.parse(storedArticleProgress) : [];
    } catch (e) {
        console.error("Failed to parse stored article progress, defaulting to empty array.", e);
    }
    
    let loadedGeneralSettings = { ...DEFAULT_GENERAL_APP_SETTINGS };
    
    if (storedGeneralSettings) {
        try {
            const parsedStoredSettings = JSON.parse(storedGeneralSettings);
            
            if (parsedStoredSettings.currentLanguage && Object.values(Language).includes(parsedStoredSettings.currentLanguage)) {
                loadedGeneralSettings.currentLanguage = parsedStoredSettings.currentLanguage;
            }

            if (parsedStoredSettings.hasOwnProperty('darkMode')) {
                const dmValue = parsedStoredSettings.darkMode;
                if (dmValue === true || (typeof dmValue === 'string' && dmValue.toLowerCase() === 'true')) {
                    loadedGeneralSettings.darkMode = true;
                } else {
                    loadedGeneralSettings.darkMode = false; 
                }
            } else {
                loadedGeneralSettings.darkMode = false;
            }
        } catch (e) {
            console.error("Failed to parse stored general settings, will use app defaults.", e);
            loadedGeneralSettings.darkMode = DEFAULT_GENERAL_APP_SETTINGS.darkMode; 
        }
    } else {
        loadedGeneralSettings.darkMode = DEFAULT_GENERAL_APP_SETTINGS.darkMode;
    }
    
    if (typeof loadedGeneralSettings.darkMode !== 'boolean') {
        loadedGeneralSettings.darkMode = false;
    }
    
    dispatch({ type: 'LOAD_INITIAL_DATA', payload: { testProfiles, generalSettings: loadedGeneralSettings, flashcardDecks, articles, articleProgress } });
  }, []);

  useEffect(() => {
    if (state.generalSettings.darkMode === true) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    document.documentElement.lang = state.generalSettings.currentLanguage;
  }, [state.generalSettings.darkMode, state.generalSettings.currentLanguage]);


  const translate = useCallback((key: string, replacements: Record<string, string | number> = {}): string => {
    const langPack = translations[state.generalSettings.currentLanguage] || translations[Language.EN];
    let text: string;
    const keyParts = key.split('.');
    let currentLevel: Translations | string = langPack;
    for (const part of keyParts) {
        if (typeof currentLevel === 'object' && currentLevel !== null && part in currentLevel) {
            currentLevel = currentLevel[part] as Translations | string;
        } else {
            if (state.generalSettings.currentLanguage !== Language.EN) {
                let enLevel: Translations | string = translations[Language.EN];
                for (const enPart of keyParts) {
                     if (typeof enLevel === 'object' && enLevel !== null && enPart in enLevel) {
                        enLevel = enLevel[enPart] as Translations | string;
                    } else {
                        enLevel = `KEY_NOT_FOUND_IN_EN: ${key}`;
                        break;
                    }
                }
                if (typeof enLevel === 'string' && !enLevel.startsWith('KEY_NOT_FOUND_IN_EN')) {
                    currentLevel = enLevel; 
                    break; 
                }
            }
            currentLevel = `KEY_NOT_FOUND: ${key}`; 
            break;
        }
    }
    text = typeof currentLevel === 'string' ? currentLevel : `COMPLEX_KEY_NOT_FOUND: ${key}`;

    for (const placeholder in replacements) {
      const escapedPlaceholder = escapeRegExp(placeholder);
      text = text.replace(new RegExp(`\\{${escapedPlaceholder}\\}`, 'g'), String(replacements[placeholder]));
    }
    return text;
  }, [state.generalSettings.currentLanguage]);

  const activeProfile = useMemo(() => 
    state.testProfiles.find(p => p.id === state.activeTestProfileId),
    [state.testProfiles, state.activeTestProfileId]
  );

  const activeFlashcardDeck = useMemo(() => 
    state.flashcardDecks.find(deck => deck.id === state.activeFlashcardDeckId),
    [state.flashcardDecks, state.activeFlashcardDeckId]
  );

  const activeArticle = useMemo(() =>
    state.articles.find(article => article.id === state.activeArticleId),
    [state.articles, state.activeArticleId]
  );

  // Force dark mode always true.
  const [] = useState(true);
  
  // Replace toggle with a no-op so the button has no effect.

  return (
    <AppContext.Provider value={{ state, dispatch, translate, activeProfile, activeFlashcardDeck, activeArticle }}>
      {children}
    </AppContext.Provider>
  );
};

// Custom Hook
export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};