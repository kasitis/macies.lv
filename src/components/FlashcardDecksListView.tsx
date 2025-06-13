
import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppView } from '@/types.ts';
import Icon from './Icon.tsx';

const FlashcardDecksListView: React.FC = () => {
  const { state, dispatch, translate } = useAppContext();
  const { flashcardDecks } = state;

  const handleCreateNewDeck = () => {
    dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_CREATE_EDIT_DECK, editingId: null, activeFlashcardDeckId: null } });
  };

  const handleOpenDeckHub = (deckId: string) => {
    dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECK_HUB, activeFlashcardDeckId: deckId } });
  };

  const handleEditDeckDetails = (deckId: string) => {
    dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_CREATE_EDIT_DECK, editingId: deckId, activeFlashcardDeckId: deckId } });
  };

  const handleDeleteDeck = (deckId: string, deckName: string) => {
    dispatch({
      type: 'OPEN_CONFIRM_MODAL',
      payload: {
        titleKey: 'flashcardConfirmDeleteDeckTitle',
        textKey: 'flashcardConfirmDeleteDeckText',
        textReplacements: { name: deckName },
        onConfirm: () => {
          dispatch({ type: 'DELETE_FLASHCARD_DECK', payload: deckId });
          dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgDeletedSuccess', textKey: 'flashcardDeckDeleted' } });
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          {translate('flashcardDecksListTitle')}
        </h1>
        <div className="flex gap-3">
            <button
                onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.HOME }})}
                className="py-2 px-3 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
            >
                <Icon name="arrow-left" size="1em"/> {translate('navHome')}
            </button>
            <button
            onClick={handleCreateNewDeck}
            className="py-2.5 px-5 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
            >
            <Icon name="plus-circle" size="1.2em" /> {translate('flashcardCreateNewDeck')}
            </button>
        </div>
      </div>

      {flashcardDecks.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-10 text-lg">{translate('flashcardNoDecks')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...flashcardDecks].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(deck => (
            <div key={deck.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2 truncate" title={deck.name}>{deck.name}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 min-h-[40px] line-clamp-2">{deck.description || ''}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                  {translate('flashcardDeckCardsCount', { count: deck.flashcards.length })}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {translate('myTestsProfileUpdated')} {new Date(deck.updatedAt).toLocaleDateString(state.generalSettings.currentLanguage)}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                 <button
                    onClick={() => handleOpenDeckHub(deck.id)}
                    className="w-full sm:w-auto py-2 px-4 text-sm rounded-md bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                >
                   <Icon name="folder-kanban" size="1em"/> {translate('flashcardDeckOpenHub')}
                </button>
                <div className="flex space-x-2 justify-center">
                    <button
                        onClick={() => handleEditDeckDetails(deck.id)}
                        title={translate('flashcardDeckEditDetails')}
                        className="p-2 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                        <Icon name="edit-2" size="1.1em"/>
                    </button>
                    <button
                        onClick={() => handleDeleteDeck(deck.id, deck.name)}
                        title={translate('flashcardDeckDelete')}
                        className="p-2 rounded-md bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white transition-colors"
                    >
                        <Icon name="trash-2" size="1.1em"/>
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardDecksListView;
