
import React, { useState, useEffect, ChangeEvent, FormEvent, useCallback, useRef } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Question, QuestionType, QuestionOption, AppView } from '@/types.ts';
import Icon from './Icon.tsx';
import { MAX_FORM_OPTIONS, MAX_IMAGE_SIZE_KB } from '@/constants.ts';

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


const CreateEditQuestionView: React.FC = () => {
  const { state, dispatch, translate, activeProfile } = useAppContext();
  const { editingQuestionId } = state;

  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [topic, setTopic] = useState('');
  const [questionImage, setQuestionImage] = useState<string | null>(null);
  const [options, setOptions] = useState<QuestionOption[]>([
    { text: '', imageURL: null }, { text: '', imageURL: null }
  ]);
  const [correctOptionText, setCorrectOptionText] = useState('');
  const [formStatus, setFormStatus] = useState('');

  const questionTextInputRef = useRef<HTMLTextAreaElement>(null);

  const resetFormForNewQuestion = useCallback(() => {
    setQuestionText('');
    setQuestionImage(null);
    if (questionType === QuestionType.TRUE_FALSE) {
        setOptions([
            { text: translate('optionTrue'), imageURL: null },
            { text: translate('optionFalse'), imageURL: null }
        ]);
        setCorrectOptionText(translate('optionTrue')); 
    } else {
        setOptions([{ text: '', imageURL: null }, { text: '', imageURL: null }]);
        setCorrectOptionText('');
    }
    if (questionTextInputRef.current) {
        questionTextInputRef.current.focus();
    }
  }, [questionType, translate]);


  const resetFormForProfile = useCallback(() => {
    if (!activeProfile) return;

    if (editingQuestionId) {
      const qToEdit = activeProfile.questions.find((q: { id: string; }) => q.id === editingQuestionId);
      if (qToEdit) {
        setQuestionText(qToEdit.question);
        setQuestionType(qToEdit.type);
        setTopic(qToEdit.topic || '');
        setQuestionImage(qToEdit.questionImageURL);
        const initialOptions = qToEdit.type === QuestionType.TRUE_FALSE
            ? [{ text: translate('optionTrue'), imageURL: null }, { text: translate('optionFalse'), imageURL: null }]
            : JSON.parse(JSON.stringify(qToEdit.options)); 
        setOptions(initialOptions);
        setCorrectOptionText(qToEdit.correctOptionText);
      } else {
        dispatch({ type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgError', textKey: 'msgQuestionNotFoundEdit' } });
        dispatch({ type: 'SET_VIEW', payload: { view: AppView.QUESTION_BANK, activeTestProfileId: activeProfile.id } });
      }
    } else {
      resetFormForNewQuestion();
    }
  }, [activeProfile, editingQuestionId, dispatch, translate, resetFormForNewQuestion]);

  useEffect(() => {
    if (!activeProfile && state.activeView === AppView.CREATE_EDIT_QUESTION) {
        dispatch({ type: 'SET_VIEW', payload: { view: AppView.MY_TESTS, activeTestProfileId: null } });
        return;
    }
    resetFormForProfile();
  }, [activeProfile, editingQuestionId, resetFormForProfile, dispatch, state.activeView]); 

  useEffect(() => {
    if (editingQuestionId) return; 

    if (questionType === QuestionType.TRUE_FALSE) {
        const trueText = translate('optionTrue');
        const falseText = translate('optionFalse');
        setOptions([
            { text: trueText, imageURL: null },
            { text: falseText, imageURL: null }
        ]);
        if (correctOptionText !== trueText && correctOptionText !== falseText) {
            setCorrectOptionText(trueText);
        }
    } else if (questionType === QuestionType.FILL_IN_THE_BLANK) {
        setOptions([]);
        setCorrectOptionText(''); 
    } else if (questionType === QuestionType.MULTIPLE_CHOICE) {
        if (options.length < 2) {
            setOptions([{ text: '', imageURL: null }, { text: '', imageURL: null }]);
        }
        if ([translate('optionTrue'), translate('optionFalse')].includes(correctOptionText)) {
            setCorrectOptionText('');
        }
    }
  }, [questionType, translate, editingQuestionId, correctOptionText]);


  const handleQuestionImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await readFileAsBase64(file);
        setQuestionImage(base64);
      } catch (error: any) {
        const fileSize = error.message.split('Your file: ')[1]?.split('KB')[0] || 'N/A';
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgFileTooLarge', textKey: 'msgFileTooLargeDetail', textReplacements: {maxSize: String(MAX_IMAGE_SIZE_KB), fileSize: fileSize}}});
        e.target.value = "";
      }
    } else {
        setQuestionImage(null);
    }
  };

  const handleOptionTextChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index].text = value;
    setOptions(newOptions);
  };

  const handleOptionImageChange = async (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await readFileAsBase64(file);
        const newOptions = [...options];
        newOptions[index].imageURL = base64;
        setOptions(newOptions);
      } catch (error: any) {
        const fileSize = error.message.split('Your file: ')[1]?.split('KB')[0] || 'N/A';
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgFileTooLarge', textKey: 'msgFileTooLargeDetail', textReplacements: {maxSize: String(MAX_IMAGE_SIZE_KB), fileSize: fileSize}}});
        e.target.value = "";
      }
    } else {
        const newOptions = [...options];
        newOptions[index].imageURL = null;
        setOptions(newOptions);
    }
  };

  const addOption = () => {
    if (options.length < MAX_FORM_OPTIONS) {
      setOptions([...options, { text: '', imageURL: null }]);
    } else {
      dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgMaxOptionsReached', textKey: 'msgMaxOptionsDetail', textReplacements: {max: String(MAX_FORM_OPTIONS)}}});
    }
  };

  const removeOption = (index: number) => {
    if (questionType === QuestionType.MULTIPLE_CHOICE && options.length <= 2) {
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgValidationError', textKey: 'msgNeedAtLeastTwoOptions' }});
        return;
    }
    const removedOptionText = options[index]?.text;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    if (removedOptionText && removedOptionText.trim() === correctOptionText.trim() && correctOptionText.trim() !== "") {
        setCorrectOptionText('');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!activeProfile) {
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgError', textKey: 'msgSavingErrorDetail' }}); 
        return;
    }
    setFormStatus(translate('formStatusSaving'));

    if (!questionText.trim()) {
        dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgValidationError', textKey: 'msgErrorQuestionTextMissing' }});
        setFormStatus(''); return;
    }

    let finalOptions = [...options];
    let finalCorrectOptionText = correctOptionText;

    if (questionType === QuestionType.MULTIPLE_CHOICE) {
        const validOptions = finalOptions.filter(opt => opt.text.trim() !== "" || opt.imageURL !== null);
        if (validOptions.length < 2) {
            dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgValidationError', textKey: 'msgNeedAtLeastTwoOptions' }});
            setFormStatus(''); return;
        }
        
        const isCorrectOptionTextAmongOptionValues = finalOptions.some(opt => opt.text.trim() === correctOptionText.trim());
        const isCorrectOptionTextAPlaceholder = correctOptionText.startsWith("__empty_or_image_");

        if (!isCorrectOptionTextAmongOptionValues && !isCorrectOptionTextAPlaceholder && correctOptionText.trim() === '') { 
             dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgValidationError', textKey: 'msgChooseCorrectAnswer' }});
             setFormStatus(''); return;
        }
        
        if (isCorrectOptionTextAPlaceholder) {
            const idx = parseInt(correctOptionText.split('_').pop() || "-1");
            if(idx >= 0 && idx < finalOptions.length && finalOptions[idx].text.trim() === '') {
                dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgValidationError', textKey: 'msgOptionIsImageOnlyCorrect' }});
                 setFormStatus(''); return;
            }
             finalCorrectOptionText = finalOptions[idx] ? finalOptions[idx].text.trim() : ""; 
        }

    } else if (questionType === QuestionType.TRUE_FALSE) {
        finalOptions = [{ text: translate('optionTrue'), imageURL: null }, { text: translate('optionFalse'), imageURL: null }];
        if (![translate('optionTrue'), translate('optionFalse')].includes(correctOptionText)) {
             dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgValidationError', textKey: 'msgChooseCorrectAnswer' }});
             setFormStatus(''); return;
        }
    } else if (questionType === QuestionType.FILL_IN_THE_BLANK) {
        if (!correctOptionText.trim()) {
            dispatch({type: 'OPEN_MESSAGE_MODAL', payload: { titleKey: 'msgValidationError', textKey: 'msgMustEnterFillInAnswer' }});
            setFormStatus(''); return;
        }
        finalOptions = [];
    }

    const questionData: Question = {
      id: editingQuestionId || generateId(),
      question: questionText.trim(),
      type: questionType,
      topic: topic.trim() || undefined,
      questionImageURL: questionImage,
      options: finalOptions,
      correctOptionText: finalCorrectOptionText.trim()
    };

    if (editingQuestionId) {
      dispatch({ type: 'UPDATE_QUESTION_IN_PROFILE', payload: {profileId: activeProfile.id, question: questionData }});
      setFormStatus(translate('formStatusChangesSaved'));
      setTimeout(() => {
        setFormStatus('');
        dispatch({ type: 'SET_VIEW', payload: { view: AppView.QUESTION_BANK, activeTestProfileId: activeProfile.id } });
      }, 1500);
    } else {
      dispatch({ type: 'ADD_QUESTION_TO_PROFILE', payload: {profileId: activeProfile.id, question: questionData }});
      setFormStatus(translate('formStatusSaved'));
      setTimeout(() => {
        setFormStatus('');
        resetFormForNewQuestion(); 
      }, 1500);
    }
  };

  const mcOptionSelectValues = options.map((opt, idx) => ({
      value: opt.text.trim() || `__empty_or_image_${idx}__`,
      label: opt.text.trim() 
          ? `${translate('optionVariant')} ${idx + 1}: ${opt.text.substring(0,40)}${opt.text.length > 40 ? '...' : ''}` 
          : `${translate('optionVariant')} ${idx + 1} ${translate('optionEmptyOrImage')}`
  }));

  if (!activeProfile) {
    return <p className="text-center p-4 text-slate-600 dark:text-slate-400">{translate('msgError')}: No active test profile. Redirecting...</p>;
  }

  const inputBaseClasses = "block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 text-center sm:text-left">
          {editingQuestionId ? translate('formTitleEdit') : translate('formTitleAdd')}
          <span className="text-sm block font-normal text-slate-500 dark:text-slate-400">({translate('qBankTitle', {name: activeProfile.name})})</span>
        </h2>
        <button
            onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.QUESTION_BANK, activeTestProfileId: activeProfile.id }})}
            className="py-2 px-3 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
        >
            <Icon name="arrow-left" size="1em"/> {translate('qBankBackToQuestionBank')}
        </button>
      </div>
      <div className="text-xs text-orange-600 dark:text-orange-400 mb-4 text-center p-2.5 bg-orange-50 dark:bg-orange-900/30 rounded-md border border-orange-200 dark:border-orange-700/50">
        <Icon name="alert-triangle" size="1em" className="inline-block mr-1.5 align-middle" />
        <span>{translate('formImageWarning', { maxSize: String(MAX_IMAGE_SIZE_KB) })}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 max-w-xl mx-auto">
        <div>
          <label htmlFor="q-form-type" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{translate('formQuestionTypeLabel')}</label>
          <select
            id="q-form-type"
            value={questionType}
            onChange={(e) => {
                setQuestionType(e.target.value as QuestionType);
                if (!editingQuestionId) {
                    if (e.target.value === QuestionType.TRUE_FALSE) {
                        const trueText = translate('optionTrue');
                        setOptions([{ text: trueText, imageURL: null }, { text: translate('optionFalse'), imageURL: null }]);
                        setCorrectOptionText(trueText);
                    } else if (e.target.value === QuestionType.FILL_IN_THE_BLANK) {
                        setOptions([]);
                        setCorrectOptionText('');
                    } else {
                        setOptions([{ text: '', imageURL: null }, { text: '', imageURL: null }]);
                        setCorrectOptionText('');
                    }
                }
            }}
            className={inputBaseClasses}
          >
            <option value={QuestionType.MULTIPLE_CHOICE}>{translate('qTypeMultipleChoice')}</option>
            <option value={QuestionType.TRUE_FALSE}>{translate('qTypeTrueFalse')}</option>
            <option value={QuestionType.FILL_IN_THE_BLANK}>{translate('qTypeFillInBlank')}</option>
          </select>
        </div>

        <div>
          <label htmlFor="q-form-text" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{translate('formQuestionTextLabel')} <span className="text-red-500">*</span></label>
          <textarea
            id="q-form-text"
            ref={questionTextInputRef}
            rows={3} required
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className={`${inputBaseClasses} min-h-[80px]`}
          />
        </div>

        <div>
          <label htmlFor="q-form-topic" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{translate('formTopicLabel')}</label>
          <input
            type="text"
            id="q-form-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={translate('formTopicPlaceholder')}
            className={inputBaseClasses}
          />
        </div>

        <div>
          <label htmlFor="q-form-image-file" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">{translate('formQuestionImageLabel', {maxSize: MAX_IMAGE_SIZE_KB})}</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="file"
              id="q-form-image-file"
              key={questionImage || 'q-image-input'}
              accept="image/*"
              onChange={handleQuestionImageChange}
              className={`block w-full text-sm p-1.5 border border-slate-300 dark:border-slate-600 rounded-md 
                         file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold 
                         file:bg-indigo-50 dark:file:bg-indigo-800/50 file:text-indigo-600 dark:file:text-indigo-300 
                         hover:file:bg-indigo-100 dark:hover:file:bg-indigo-700/50
                         bg-white dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 cursor-pointer`}
              aria-label={translate('formQuestionImageLabel')}
            />
            {questionImage &&
              <button type="button" onClick={() => {setQuestionImage(null); const el = document.getElementById('q-form-image-file') as HTMLInputElement; if(el) el.value = "";}} className="p-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-slate-800">
                  <Icon name="trash-2" size="1em"/>
              </button>}
          </div>
          {questionImage && <img src={questionImage} alt={translate('altPreview')} className={`mt-2 max-w-[100px] max-h-[60px] border-2 border-indigo-400 dark:border-indigo-500 rounded-md object-cover shadow-sm`} />}
        </div>

        {questionType !== QuestionType.FILL_IN_THE_BLANK && (
          <div className="space-y-4 pt-2">
            <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200">{translate('formOptionsLabel')}</h3>
            {options.map((opt, index) => (
              <div key={index} className="p-3.5 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2 bg-slate-50 dark:bg-slate-800/40 relative">
                <div className="flex justify-between items-center">
                  <label htmlFor={`q-form-option-text-${index}`} className="block text-xs font-medium text-slate-600 dark:text-slate-400">{translate('optionVariant')} {index + 1}</label>
                  {(questionType === QuestionType.MULTIPLE_CHOICE && options.length > 2) &&
                    <button type="button" onClick={() => removeOption(index)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 text-xs py-0.5 px-1.5 rounded-md leading-none focus:outline-none focus:ring-1 focus:ring-red-500" aria-label={`${translate('qBankDeleteBtn')} ${translate('optionVariant')} ${index + 1}`}>
                        <Icon name="trash-2" size="0.9em"/>
                    </button>}
                </div>
                <input
                  type="text"
                  id={`q-form-option-text-${index}`}
                  placeholder={`${translate('optionVariant')}...`}
                  value={opt.text}
                  readOnly={questionType === QuestionType.TRUE_FALSE}
                  onChange={(e) => handleOptionTextChange(index, e.target.value)}
                  className={`mt-1 ${inputBaseClasses}
                              ${questionType === QuestionType.TRUE_FALSE
                                ? 'bg-slate-100 dark:bg-slate-700 cursor-default text-slate-700 dark:text-slate-300'
                                : ''}`}
                />
                {questionType !== QuestionType.TRUE_FALSE && (
                  <>
                    <div className="flex items-center gap-2 mt-1.5">
                        <input
                        type="file"
                        accept="image/*"
                        id={`q-form-option-image-file-${index}`}
                        key={opt.imageURL || `opt-image-input-${index}`}
                        onChange={(e) => handleOptionImageChange(index, e)}
                        className={`q-form-option-image-file block w-full text-sm p-1.5 border border-slate-300 dark:border-slate-600 rounded-md 
                                   file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold 
                                   file:bg-indigo-50 dark:file:bg-indigo-800/50 file:text-indigo-600 dark:file:text-indigo-300 
                                   hover:file:bg-indigo-100 dark:hover:file:bg-indigo-700/50
                                   bg-white dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 cursor-pointer`}
                        aria-label={`${translate('optionImageLabel')} ${index + 1}`}
                        />
                        {opt.imageURL &&
                        <button type="button" onClick={() => {const newOpt = [...options]; newOpt[index].imageURL = null; setOptions(newOpt); const el = document.getElementById(`q-form-option-image-file-${index}`) as HTMLInputElement; if(el) el.value = "";}} className="p-1.5 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 dark:focus:ring-offset-slate-800" aria-label={`${translate('qBankDeleteBtn')} ${translate('optionImageLabel')} ${index + 1}`}>
                           <Icon name="trash-2" size="1em"/>
                        </button>}
                    </div>
                    {opt.imageURL && <img src={opt.imageURL} alt={translate('altPreview')} className={`mt-2 max-w-[80px] max-h-[50px] border-2 border-indigo-400 dark:border-indigo-500 rounded-md object-cover shadow-sm`} />}
                  </>
                )}
              </div>
            ))}
            {questionType === QuestionType.MULTIPLE_CHOICE && options.length < MAX_FORM_OPTIONS &&
              <button type="button" onClick={addOption} className="py-2 px-4 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors font-medium flex items-center gap-1.5">
                <Icon name="plus-circle" size="1em"/> {translate('formAddOptionBtn')}
              </button>
            }
          </div>
        )}

        <div className="pt-1">
          <label htmlFor="q-form-correct-answer" className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
            {questionType === QuestionType.FILL_IN_THE_BLANK ? translate('formCorrectAnswerLabel') : translate('formCorrectOptionLabel')} <span className="text-red-500">*</span>
          </label>
          {questionType === QuestionType.MULTIPLE_CHOICE &&
            <select
              id="q-form-correct-answer"
              value={correctOptionText}
              onChange={(e) => setCorrectOptionText(e.target.value)}
              required={options.filter(opt => opt.text.trim() !== "" || opt.imageURL !== null).length > 0}
              className={inputBaseClasses}
            >
              <option value="" disabled>{translate('msgChooseCorrectAnswer')}</option>
              {mcOptionSelectValues.map(optV => (
                <option key={optV.value} value={optV.value}>{optV.label}</option>
              ))}
            </select>
          }
          {questionType === QuestionType.TRUE_FALSE &&
            <select
              id="q-form-correct-answer"
              value={correctOptionText}
              onChange={(e) => setCorrectOptionText(e.target.value)}
              required
              className={inputBaseClasses}
            >
              <option value={translate('optionTrue')}>{translate('optionTrue')}</option>
              <option value={translate('optionFalse')}>{translate('optionFalse')}</option>
            </select>
          }
          {questionType === QuestionType.FILL_IN_THE_BLANK &&
            <input
              id="q-form-correct-answer"
              type="text"
              value={correctOptionText}
              onChange={(e) => setCorrectOptionText(e.target.value)}
              required
              placeholder={translate('formFillCorrectAnswerPlaceholder')}
              className={inputBaseClasses}
            />
          }
        </div>

        <div className="mt-8 flex justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.QUESTION_BANK, activeTestProfileId: activeProfile?.id || null } })}
              className="py-2.5 px-5 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
            >
              {translate('formCancelBtn')}
            </button>
          <button
            type="submit"
            className="py-2.5 px-5 rounded-md bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold transition-colors shadow-sm hover:shadow-md"
          >
            {editingQuestionId ? translate('formSaveChangesBtn') : translate('formSaveQuestionBtn')}
          </button>
        </div>
        {formStatus && <p className="mt-4 text-sm text-center text-slate-600 dark:text-slate-400">{formStatus}</p>}
      </form>
    </div>
  );
};

export default CreateEditQuestionView;