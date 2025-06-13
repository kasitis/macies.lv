

export enum Language {
  LV = 'lv',
  EN = 'en',
  UK = 'uk',
}

export enum AppView {
  HOME = 'home',
  MY_TESTS = 'my-tests', 
  TEST_PROFILE_HUB = 'test-profile-hub', 
  QUIZ = 'quiz',
  QUESTION_BANK = 'question-bank',
  CREATE_EDIT_QUESTION = 'create-edit-question',
  STATS = 'stats',
  TEST_SETTINGS = 'test-settings',
  GENERAL_SETTINGS = 'general-settings',
  GAMES_HUB = 'games-hub',
  WORDLE_LV = 'wordle-lv',
  NUMBER_CRUNCHER = 'number-cruncher',
  // Flashcard Views
  FLASHCARD_DECKS_LIST = 'flashcard-decks-list',
  FLASHCARD_DECK_HUB = 'flashcard-deck-hub',
  FLASHCARD_CREATE_EDIT_DECK = 'flashcard-create-edit-deck',
  FLASHCARD_CREATE_EDIT_CARD = 'flashcard-create-edit-card',
  FLASHCARD_STUDY_MODE = 'flashcard-study-mode',
  // Article Views
  ARTICLES_LIST = 'articles-list',
  ARTICLE_VIEW = 'article-view',
  SETTINGS = "SETTINGS",
  SETTINGS_VIEW = "SETTINGS_VIEW",
  Example = "Example",
  Profile = "Profile",
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple-choice',
  TRUE_FALSE = 'true-false',
  FILL_IN_THE_BLANK = 'fill-in-the-blank',
}

export interface QuestionOption {
  text: string;
  imageURL: string | null;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  topic?: string;
  questionImageURL: string | null;
  options: QuestionOption[];
  correctOptionText: string;
  optionsRendered?: QuestionOption[]; 
}

export interface Option {
  text: string;
  imageURL: string | null;
}

export enum AnswerNumberingStyle {
  NUMBERS = 'numbers',
  LETTERS_UPPER = 'letters_upper',
  LETTERS_LOWER = 'letters_lower',
  NONE = 'none',
}

export interface TestSpecificSettings {
  numQuestions: number;
  useAllQuestions: boolean;
  randomizeQuestions: boolean;
  randomizeAnswers: boolean;
  answerNumberingStyle: AnswerNumberingStyle;
  enableTimer: boolean; 
  timerDurationMinutes: number;
}

export interface GeneralAppSettings {
  currentLanguage: Language;
  darkMode: boolean;
}

export interface QuizHistoryEntry {
  date: string;
  score: number;
  totalPossible: number;
  percentage: number;
  questionsInQuiz: number;
  timeTakenSeconds: number | null;
}

export interface TestProfile {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
  settings: TestSpecificSettings;
  history: QuizHistoryEntry[];
  createdAt: string; 
  updatedAt: string; 
}

// Flashcard Types
export interface Flashcard {
  id: string;
  frontText: string;
  backText: string;
  frontImageURL?: string | null;
  backImageURL?: string | null;
}

export interface FlashcardDeck {
  id: string;
  name: string;
  description?: string;
  flashcards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}

// Article Types
export enum ArticleContentType {
  PARAGRAPH = 'paragraph',
  HEADING = 'heading',
  IMAGE = 'image',
  // Add more types like LIST, QUOTE etc. if needed
}

export interface ArticleContentBlockBase {
  id: string;
  type: ArticleContentType;
}

export interface ArticleParagraphBlock extends ArticleContentBlockBase {
  type: ArticleContentType.PARAGRAPH;
  text: string; // Can contain basic HTML like <b>, <i>, <a>
}

export interface ArticleHeadingBlock extends ArticleContentBlockBase {
  type: ArticleContentType.HEADING;
  text: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export interface ArticleImageBlock extends ArticleContentBlockBase {
  type: ArticleContentType.IMAGE;
  src: string;
  alt?: string;
  caption?: string;
}

export type ArticleContentBlock = ArticleParagraphBlock | ArticleHeadingBlock | ArticleImageBlock;

export interface Article {
  id: string;
  title: string;
  excerpt?: string;
  coverImage?: string; // URL
  author?: string;
  category?: string;
  tags?: string[];
  content: ArticleContentBlock[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface ArticleProgress {
  articleId: string;
  isRead: boolean;
  lastReadAt?: string; // ISO date string
}


export interface Translations {
  [key: string]: string | Translations;
}

export interface LanguagePack {
  [Language.LV]: Translations;
  [Language.EN]: Translations;
  [Language.UK]: Translations;
}

export interface MappedAppField {
    key: string;
    labelKey: string;
    labelArgs?: {[key: string]: string | number};
    required: boolean;
    group: 'main' | 'options';
    tipKey?: string;
}

// For Number Cruncher Game
export enum GameDifficulty {
    EASY = 'easy',
    MEDIUM = 'medium',
    HARD = 'hard',
}

export enum OperationType {
    ADD = 'add',
    SUBTRACT = 'subtract',
    MULTIPLY = 'multiply',
    DIVIDE = 'divide',
}

export type GameMode = OperationType | 'mixed';


declare global {
  interface Window {
    XLSX: any;
    lucide: {
        createIcons: () => void;
    };
  }
}