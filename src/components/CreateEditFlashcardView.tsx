
import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppView, Flashcard } from '@/types.ts';
import Icon from './Icon.tsx';
import { MAX_IMAGE_SIZE_KB } from '@/constants.ts';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const readFileAsBase64 = (file: File): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    if (!file) { resolve(null); return; }
    if (file.size > MAX_IMAGE_SIZE_KB * 1024) {
      reject(new Error(`File too large. Max size: ${MAX_IMAGE_SIZE_KB}KB. Your file: ${(file.size / 1024).toFixed(1)}KB.`));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};


const CreateEditFlashcardView: React.FC = () => {
  const { state, dispatch, translate, activeFlashcardDeck } = useAppContext();
  const { editingFlashcardId, activeFlashcardDeckId } = state;

  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [frontImage, setFrontImage] = useState<string | null | undefined>(null);
  const [backImage, setBackImage] = useState<string | null | undefined>(null);

  useEffect(() => {
    if (!activeFlashcardDeck) {
      dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECKS_LIST } });
      return;
    }
    if (editingFlashcardId) {
      const cardToEdit = activeFlashcardDeck.flashcards.find((c: { id: string; }) => c.id === editingFlashcardId);
      if (cardToEdit) {
        setFrontText(cardToEdit.frontText);
        setBackText(cardToEdit.backText);
        setFrontImage(cardToEdit.frontImageURL);
        setBackImage(cardToEdit.backImageURL);
      } else {
        dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECK_HUB, activeFlashcardDeckId } });
      }
    } else {
      setFrontText('');
      setBackText('');
      setFrontImage(null);
      setBackImage(null);
    }
  }, [editingFlashcardId, activeFlashcardDeck, activeFlashcardDeckId, dispatch]);
  
  const handleImageChange = async (
    e: ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<string | null | undefined>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await readFileAsBase64(file);
        setter(base64);
      } catch (error: any) {
        const fileSize = error.message.split('Your file: ')[1]?.split('KB')[0] || 'N/A';
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgFileTooLarge', textKey: 'msgFileTooLargeDetail', textReplacements: {maxSize: String(MAX_IMAGE_SIZE_KB), fileSize: fileSize}}});
        e.target.value = ""; // Reset file input
      }
    } else {
      setter(null);
    }
  };


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!activeFlashcardDeckId) return;

    if (!frontText.trim()) {
      dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgValidationError', textKey: 'flashcardCardFrontTextRequired' } });
      return;
    }

    const cardData: Flashcard = {
      id: editingFlashcardId || generateId(),
      frontText: frontText.trim(),
      backText: backText.trim(),
      frontImageURL: frontImage,
      backImageURL: backImage,
    };

    if (editingFlashcardId) {
      dispatch({ type: 'UPDATE_FLASHCARD_IN_DECK', payload: { deckId: activeFlashcardDeckId, card: cardData } });
    } else {
      dispatch({ type: 'ADD_FLASHCARD_TO_DECK', payload: { deckId: activeFlashcardDeckId, card: cardData } });
    }
    dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgSettingsSaved', textKey: 'flashcardCardSaved' } });
    dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECK_HUB, activeFlashcardDeckId } });
  };

  const inputBaseClasses = "block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400";
  const fileInputClasses = `block w-full text-sm p-1.5 border border-slate-300 dark:border-slate-600 rounded-md file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 dark:file:bg-indigo-800/50 file:text-indigo-600 dark:file:text-indigo-300 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-700/50 bg-white dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 cursor-pointer`;

  if (!activeFlashcardDeck) {
    return <p className="text-center p-4 text-slate-600 dark:text-slate-400">{translate('msgError')}: No active deck. Redirecting...</p>;
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center sm:text-left">
          {editingFlashcardId ? translate('flashcardCreateEditCardTitleEdit') : translate('flashcardCreateEditCardTitleAdd')}
          <span className="text-sm block font-normal text-slate-500 dark:text-slate-400">({translate('flashcardDeckHubTitle', {name: activeFlashcardDeck.name})})</span>
        </h2>
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECK_HUB, activeFlashcardDeckId } })}
          className="py-2 px-3 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
        >
          <Icon name="arrow-left" size="1em" /> {translate('navBackToHub')}
        </button>
      </div>
      <div className="text-xs text-orange-600 dark:text-orange-400 mb-4 text-center p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-md border border-orange-200 dark:border-orange-700/50">
        <Icon name="alert-triangle" size="1em" className="inline-block mr-1.5 align-middle" />
        <span>{translate('formImageWarning', { maxSize: String(MAX_IMAGE_SIZE_KB) })}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="fc-front-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            {translate('flashcardFrontTextLabel')} <span className="text-red-500">*</span>
          </label>
          <textarea id="fc-front-text" value={frontText} onChange={e => setFrontText(e.target.value)} required rows={3} className={`${inputBaseClasses} min-h-[80px]`} />
        </div>
        <div>
          <label htmlFor="fc-front-image" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{translate('flashcardFrontImageLabel')}</label>
          <div className="flex items-center gap-2 mt-1">
            <input type="file" id="fc-front-image" accept="image/*" key={frontImage || 'front-image-key'} onChange={e => handleImageChange(e, setFrontImage)} className={fileInputClasses} />
            {frontImage && <button type="button" onClick={() => {setFrontImage(null); const el = document.getElementById('fc-front-image') as HTMLInputElement; if(el) el.value = "";}} className="p-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"><Icon name="trash-2" size="1em"/></button>}
          </div>
          {frontImage && <img src={frontImage} alt={translate('altPreview')} className="mt-2 max-w-[100px] max-h-[60px] border-2 border-indigo-400 dark:border-indigo-500 rounded-md object-cover shadow-sm" />}
        </div>

        <div>
          <label htmlFor="fc-back-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{translate('flashcardBackTextLabel')}</label>
          <textarea id="fc-back-text" value={backText} onChange={e => setBackText(e.target.value)} rows={3} className={`${inputBaseClasses} min-h-[80px]`} />
        </div>
        <div>
          <label htmlFor="fc-back-image" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{translate('flashcardBackImageLabel')}</label>
           <div className="flex items-center gap-2 mt-1">
            <input type="file" id="fc-back-image" accept="image/*" key={backImage || 'back-image-key'} onChange={e => handleImageChange(e, setBackImage)} className={fileInputClasses} />
            {backImage && <button type="button" onClick={() => {setBackImage(null); const el = document.getElementById('fc-back-image') as HTMLInputElement; if(el) el.value = "";}} className="p-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"><Icon name="trash-2" size="1em"/></button>}
          </div>
          {backImage && <img src={backImage} alt={translate('altPreview')} className="mt-2 max-w-[100px] max-h-[60px] border-2 border-indigo-400 dark:border-indigo-500 rounded-md object-cover shadow-sm" />}
        </div>

        <div className="flex justify-end space-x-3 pt-3">
          <button type="button" onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.FLASHCARD_DECK_HUB, activeFlashcardDeckId } })}
            className="py-2.5 px-5 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-semibold transition-colors">
            {translate('formCancelBtn')}
          </button>
          <button type="submit"
            className="py-2.5 px-5 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors shadow-sm hover:shadow-md">
            {translate('flashcardSaveCard')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditFlashcardView;
