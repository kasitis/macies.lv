
import React, { useState, FormEvent } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { AppView, TestProfile } from '@/types.ts';
import Icon from './Icon.tsx';

const MyTestsView: React.FC = () => {
  const { state, dispatch, translate } = useAppContext();
  const { testProfiles } = state;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<TestProfile | null>(null);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');

  const openCreateModal = () => {
    setEditingProfile(null);
    setProfileName('');
    setProfileDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (profile: TestProfile) => {
    setEditingProfile(profile);
    setProfileName(profile.name);
    setProfileDescription(profile.description || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProfile(null);
  };

  const handleProfileSave = (e: FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgValidationError', textKey: 'testProfileNameRequired'}});
      return;
    }

    if (editingProfile) {
      dispatch({
        type: 'UPDATE_TEST_PROFILE_DETAILS',
        payload: { id: editingProfile.id, name: profileName, description: profileDescription },
      });
    } else {
      dispatch({
        type: 'CREATE_TEST_PROFILE',
        payload: { name: profileName, description: profileDescription },
      });
    }
    closeModal();
  };

  const handleDeleteProfile = (profileId: string, profileNameStr: string) => {
    dispatch({
      type: 'OPEN_CONFIRM_MODAL',
      payload: {
        titleKey: 'confirmDeleteTestProfileTitle',
        textKey: 'confirmDeleteTestProfileText',
        textReplacements: { name: profileNameStr },
        onConfirm: () => {
          dispatch({ type: 'DELETE_TEST_PROFILE', payload: profileId });
          dispatch({type: 'OPEN_MESSAGE_MODAL', payload: {titleKey: 'msgDeletedSuccess', textKey: 'testProfileDeleted'}});
        },
      },
    });
  };
  
  const openTestProfileHub = (profileId: string) => {
    dispatch({type: 'SET_ACTIVE_TEST_PROFILE_ID', payload: profileId});
    dispatch({type: 'SET_VIEW', payload: {view: AppView.TEST_PROFILE_HUB, activeTestProfileId: profileId }});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
          {translate('myTestsTitle')}
        </h1>
        <button
          onClick={openCreateModal}
          className="py-2.5 px-5 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
        >
          <Icon name="plus-circle" size="1.2em" /> {translate('myTestsCreateNew')}
        </button>
      </div>

      {testProfiles.length === 0 ? (
        <p className="text-center text-slate-500 dark:text-slate-400 py-10 text-lg">{translate('myTestsNoProfiles')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testProfiles.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(profile => (
            <div key={profile.id} className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2 truncate" title={profile.name}>{profile.name}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 min-h-[40px] line-clamp-2">{profile.description || ''}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    {translate('myTestsProfileQuestions')} <span className="font-medium text-slate-700 dark:text-slate-200">{profile.questions.length}</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                    {translate('myTestsProfileUpdated')} {new Date(profile.updatedAt).toLocaleDateString(state.generalSettings.currentLanguage)}
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                 <button
                    onClick={() => openTestProfileHub(profile.id)}
                    className="w-full sm:w-auto py-2 px-4 text-sm rounded-md bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
                >
                   <Icon name="folder-kanban" size="1em"/> {translate('myTestsOpenHub')}
                </button>
                <div className="flex space-x-2 justify-center">
                    <button
                        onClick={() => openEditModal(profile)}
                        title={translate('myTestsEditDetails')}
                        className="p-2 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors"
                    >
                        <Icon name="edit-2" size="1.1em"/>
                    </button>
                    <button
                        onClick={() => handleDeleteProfile(profile.id, profile.name)}
                        title={translate('myTestsDelete')}
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

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[50]">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-2xl w-full max-w-md">
            <h3 className="text-xl font-semibold mb-5 text-slate-900 dark:text-slate-100">
              {editingProfile ? translate('editTestProfileTitle') : translate('createTestProfileTitle')}
            </h3>
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label htmlFor="profileName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {translate('myTestsProfileNameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="profileName"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
                />
              </div>
              <div>
                <label htmlFor="profileDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {translate('myTestsProfileDescLabel')}
                </label>
                <textarea
                  id="profileDescription"
                  value={profileDescription}
                  onChange={(e) => setProfileDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm bg-white dark:bg-slate-700/50 text-slate-900 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
                >
                  {translate('modalCancel')}
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold transition-colors shadow-sm hover:shadow-md"
                >
                  {translate('saveTestProfile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTestsView;