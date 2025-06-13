
import React, { useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { APP_FIELDS_FOR_MAPPING, MAX_PREVIEW_ROWS } from '@/constants.ts';
import { MappedAppField } from '@/types.ts';

export const MessageModal: React.FC = () => {
  const { state, dispatch, translate } = useAppContext();

  if (!state.isMessageModalOpen) return null;

  const isError = state.messageModalContent.titleKey.toLowerCase().includes('error');

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-sm text-center">
        <h3 className={`text-lg font-semibold mb-3 ${isError ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
          {translate(state.messageModalContent.titleKey, state.messageModalContent.titleReplacements)}
        </h3>
        <p className="text-sm mb-5 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
          {translate(state.messageModalContent.textKey, state.messageModalContent.textReplacements)}
        </p>
        <button
          onClick={() => dispatch({ type: 'CLOSE_MESSAGE_MODAL' })}
          className="w-full py-2.5 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors shadow-sm"
        >
          {translate('modalOK')}
        </button>
      </div>
    </div>
  );
};

export const ConfirmModal: React.FC = () => {
  const { state, dispatch, translate } = useAppContext();

  if (!state.isConfirmModalOpen) return null;

  const handleConfirm = () => {
    if (state.confirmModalOnConfirm) {
      state.confirmModalOnConfirm();
    }
    dispatch({ type: 'CLOSE_CONFIRM_MODAL' });
  };

  const handleCancel = () => {
    dispatch({ type: 'CLOSE_CONFIRM_MODAL' });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-3 text-center text-slate-900 dark:text-slate-100">
          {translate(state.confirmModalContent.titleKey, state.confirmModalContent.textReplacements)}
        </h3>
        <p className="text-sm mb-5 text-center text-slate-700 dark:text-slate-300">
          {translate(state.confirmModalContent.textKey, state.confirmModalContent.textReplacements)}
        </p>
        <div className="flex justify-end space-x-3 mt-5">
          <button
            onClick={handleCancel}
            className="py-2 px-4 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            {translate('modalCancel')}
          </button>
          <button
            onClick={handleConfirm}
            className="py-2 px-4 rounded-md bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white font-semibold transition-colors shadow-sm"
          >
            {translate('modalConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const XlsxCsvMappingModal: React.FC = () => {
    const { state, dispatch, translate } = useAppContext();
    const [userMapping, setUserMapping] = React.useState<Record<string, string>>({});
    const inputBaseClasses = "block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400 dark:focus:border-indigo-400";


    useEffect(() => {
        if (state.isXlsxMappingModalOpen && state.xlsxSheetData && state.xlsxSheetData.length > 0) {
            const headers = state.xlsxSheetData[0];
            const initialMapping: Record<string, string> = {};
            APP_FIELDS_FOR_MAPPING.forEach(appField => {
                const appFieldLabelSimple = (appField.labelArgs ? translate(appField.labelKey, appField.labelArgs) : translate(appField.labelKey)).toLowerCase().replace(/[^a-z0-9]/gi, '');
                const foundHeader = headers.find(header => {
                    const headerSimple = header.toLowerCase().replace(/[^a-z0-9]/gi, '');
                    return headerSimple.includes(appFieldLabelSimple) || appFieldLabelSimple.includes(headerSimple) || appField.key.toLowerCase() === headerSimple;
                });
                if (foundHeader) {
                    initialMapping[appField.key] = foundHeader;
                } else {
                    initialMapping[appField.key] = ""; 
                }
            });
            setUserMapping(initialMapping);
        } else {
            setUserMapping({}); 
        }
    }, [state.isXlsxMappingModalOpen, state.xlsxSheetData, translate]);


    if (!state.isXlsxMappingModalOpen || !state.xlsxSheetData) return null;

    const headers = state.xlsxSheetData[0] || [];
    const previewData = state.xlsxSheetData.slice(1, MAX_PREVIEW_ROWS + 1);

    const handleMappingChange = (appFieldKey: string, selectedHeader: string) => {
        setUserMapping(prev => ({ ...prev, [appFieldKey]: selectedHeader }));
    };
    
    const handleImportButtonClick = () => {
        if (state.xlsxConfirmCallback) {
            state.xlsxConfirmCallback(userMapping);
        }
        dispatch({ type: 'CLOSE_XLSX_MAPPING_MODAL' });
    };


    return (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[80]">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl w-full max-w-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
                <h3 className="text-xl font-semibold mb-3 text-center text-slate-900 dark:text-slate-100">{translate('modalMappingTitle')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-5 text-center">{translate('modalMappingDescription')}</p>

                <div className="mb-5">
                    <h4 className="text-md font-semibold mb-1.5 text-slate-800 dark:text-slate-200">{translate('mapDetectedHeaders')}</h4>
                    <div className="text-xs p-2.5 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-700/30 max-h-24 overflow-y-auto text-slate-700 dark:text-slate-300">
                        {headers.join(', ')}
                    </div>
                </div>

                <div className="space-y-3.5 mb-5">
                    {APP_FIELDS_FOR_MAPPING.map((appField: MappedAppField) => (
                        <div key={appField.key} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                            <label htmlFor={`map-select-${appField.key}`} className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:text-right">
                                {translate('mapToFieldLabel', { fieldName: appField.labelArgs ? translate(appField.labelKey, appField.labelArgs) : translate(appField.labelKey) })}
                                {appField.required ? <span className="text-red-500"> *</span> : ''}
                            </label>
                            <select
                                id={`map-select-${appField.key}`}
                                value={userMapping[appField.key] || ""}
                                onChange={(e) => handleMappingChange(appField.key, e.target.value)}
                                className={inputBaseClasses}
                            >
                                <option value="">{translate('mapDoNotImport')}</option>
                                {headers.map((header, index) => (
                                    <option key={`${header}-${index}`} value={header}>{header}</option>
                                ))}
                            </select>
                            {appField.tipKey && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 sm:col-span-2 sm:text-right -mt-1.5 italic">{translate(appField.tipKey)}</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mb-5">
                    <h4 className="text-md font-semibold mb-1.5 text-slate-800 dark:text-slate-200">{translate('mapPreviewData', { count: MAX_PREVIEW_ROWS })}</h4>
                    <div className="overflow-x-auto border border-slate-300 dark:border-slate-600 rounded-md">
                        <table className="w-full text-xs border-collapse">
                            <thead className="bg-slate-100 dark:bg-slate-700">
                                <tr>
                                    {headers.map((header, index) => (
                                        <th key={index} className="border border-slate-200 dark:border-slate-600 p-2 text-left text-slate-700 dark:text-slate-300 font-medium">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-slate-800">
                                {previewData.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="even:bg-slate-50 dark:even:bg-slate-700/50">
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="border border-slate-200 dark:border-slate-600 p-2 text-slate-700 dark:text-slate-300">{cell}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                    <button
                        onClick={() => dispatch({ type: 'CLOSE_XLSX_MAPPING_MODAL' })}
                        className="py-2 px-4 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
                    >
                        {translate('modalCancel')}
                    </button>
                    <button
                        onClick={handleImportButtonClick}
                        className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors shadow-sm"
                    >
                        {translate('btnStartImport')}
                    </button>
                </div>
            </div>
        </div>
    );
};