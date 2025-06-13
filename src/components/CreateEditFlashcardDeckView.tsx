
import React, { useState, useEffect, FormEvent } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppView } from '@/types.ts';
import Icon from './Icon.tsx';

const CreateEditFlashcardDeckView: React.FC = () => {
  const { state, dispatch, translate } = useAppContext();
  const { editingFlashcardId: editingDeckId } = state; // editingFlashcardId is used for deck ID here

  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');

  useEffect(() => {
    if (editingDeckId) {
      const deckToEdit = state.flashcardDecks.find(d => d.id === editingDeckId);
      if (deckToEdit) {
        setDeckName(deckToEdit.name);
        setDeckDescription(deckToEdit.description || '');
      } else {
        // Deck not found, perhaps navigate away or show error
        dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECKS_LIST } });
      }
    } else {
      setDeckName('');
      setDeckDescription('');
    }
  }, [editingDeckId, state.flashcardDecks, dispatch]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!deckName.trim()) {
      dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgValidationError', textKey: 'flashcardDeckNameRequired' } });
      return;
    }

    if (editingDeckId) {
      dispatch({
        type: 'UPDATE_FLASHCARD_DECK_DETAILS',
        payload: { id: editingDeckId, name: deckName.trim(), description: deckDescription.trim() },
      });
    } else {
      dispatch({
        type: 'CREATE_FLASHCARD_DECK',
        payload: { name: deckName.trim(), description: deckDescription.trim() },
      });
    }
    dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgSettingsSaved', textKey: 'flashcardDeckSaved' } });
    dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECKS_LIST } });
  };
  
  const inputBaseClasses = "block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400";

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {editingDeckId ? translate('flashcardDeckEditDetails') : translate('flashcardCreateNewDeck')}
        </h2>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECKS_LIST } })}
          className="py-2 px-3 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <Icon name="arrow-left" size="1em" /> {translate('navBackToDecks')}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="deckName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {translate('flashcardDeckNameLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="deckName"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            required
            className={inputBaseClasses}
          />
        </div>
        <div>
          <label htmlFor="deckDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {translate('flashcardDeckDescLabel')}
          </label>
          <textarea
            id="deckDescription"
            value={deckDescription}
            onChange={(e) => setDeckDescription(e.target.value)}
            rows={3}
            className={`${inputBaseClasses} min-h-[80px]`}
          />
        </div>
        <div className="flex justify-end space-x-3 pt-3">
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECKS_LIST } })}
            className="py-2.5 px-5 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            {translate('formCancelBtn')}
          </button>
          <button
            type="submit"
            className="py-2.5 px-5 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            {translate('flashcardSaveDeck')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditFlashcardDeckView;
