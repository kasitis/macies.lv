import React, { useEffect } from 'react';
import DOMPurify from 'dompurify';

import { useAppContext } from '@/contexts/AppContext';
import { AppView, ArticleContentType } from '@/types';
import type { ArticleContentBlock } from '@/types';
import Icon from './Icon';

const ArticleView: React.FC = () => {
  const { state, dispatch, translate, activeArticle } = useAppContext();
  const { articleProgress, generalSettings } = state;

  useEffect(() => {
    if (!activeArticle && state.activeView === AppView.ARTICLE_VIEW) {
      dispatch({ type: 'SET_VIEW', payload: { view: AppView.ARTICLES_LIST } });
    }
  }, [activeArticle, state.activeView, dispatch]);

  if (!activeArticle) {
    return <p className="text-center p-4 text-slate-600 dark:text-slate-400">{translate('msgError')}: No active article. Redirecting...</p>;
  }

  const currentProgress = articleProgress.find(p => p.articleId === activeArticle.id);
  const isRead = currentProgress?.isRead || false;

  const handleToggleReadStatus = () => {
    if (isRead) {
      dispatch({ type: 'MARK_ARTICLE_AS_UNREAD', payload: activeArticle.id });
    } else {
      dispatch({ type: 'MARK_ARTICLE_AS_READ', payload: activeArticle.id });
    }
  };

  const renderContentBlock = (block: ArticleContentBlock) => {
    switch (block.type) {
      case ArticleContentType.HEADING:
        const Tag = `h${block.level}` as keyof JSX.IntrinsicElements;
        let headingClasses = "font-bold text-slate-900 dark:text-slate-100 mb-3 mt-5 ";
        if (block.level === 2) headingClasses += "text-2xl";
        else if (block.level === 3) headingClasses += "text-xl";
        else if (block.level === 4) headingClasses += "text-lg";
        else headingClasses += "text-base";
        return <Tag key={block.id} className={headingClasses}>{block.text}</Tag>;
      
      case ArticleContentType.PARAGRAPH:
        const cleanHtml = DOMPurify.sanitize(block.text);
        return <p key={block.id} className="text-slate-700 dark:text-slate-300 mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: cleanHtml }}></p>;
      
      case ArticleContentType.IMAGE:
        return (
          <figure key={block.id} className="my-5 text-center">
            <img src={block.src} alt={block.alt || activeArticle.title} className="max-w-full h-auto mx-auto rounded-lg shadow-md border border-slate-200 dark:border-slate-700" />
            {block.caption && <figcaption className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">{block.caption}</figcaption>}
          </figure>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <button
          onClick={() => dispatch({ type: 'SET_VIEW', payload: { view: AppView.ARTICLES_LIST } })}
          className="py-2 px-3 text-sm rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5 self-start sm:self-center"
        >
          <Icon name="arrow-left" size="1em" /> {translate('navBackToArticles')}
        </button>
         <button
          onClick={handleToggleReadStatus}
          className={`py-2 px-3 text-sm rounded-md font-semibold transition-colors flex items-center gap-1.5 shadow-sm
            ${isRead 
              ? 'bg-green-100 hover:bg-green-200 dark:bg-green-800/70 dark:hover:bg-green-700/70 text-green-700 dark:text-green-300' 
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200'}`}
        >
          <Icon name={isRead ? "check-circle" : "circle"} size="1em" /> 
          {isRead ? translate('statusRead') : translate('articleMarkAsRead')}
        </button>
      </div>
      
      {activeArticle.coverImage && (
         <img src={activeArticle.coverImage} alt={activeArticle.title} className="w-full h-64 object-cover rounded-xl mb-5 shadow-lg border border-slate-200 dark:border-slate-700" />
      )}

      <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-50 mb-3 text-center break-words">
        {activeArticle.title}
      </h1>
      
      <div className="text-xs text-slate-500 dark:text-slate-400 text-center mb-6">
        {activeArticle.author && <span className="mr-3">{translate('articleAuthor', {author: activeArticle.author})}</span>}
        <span>{translate('articlePublishedOn', {date: new Date(activeArticle.createdAt).toLocaleDateString(generalSettings.currentLanguage, { year: 'numeric', month: 'long', day: 'numeric' })})}</span>
        {activeArticle.category && <span className="ml-3 inline-block px-2 py-0.5 bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300 rounded-full">{activeArticle.category}</span>}
      </div>

      <article className="prose prose-slate dark:prose-invert max-w-none">
        {activeArticle.content && activeArticle.content.length > 0 
            ? activeArticle.content.map(block => renderContentBlock(block))
            : <p className="text-slate-600 dark:text-slate-400 italic">{translate('articleNoContentPlaceholder')}</p>
        }
      </article>
      
      {activeArticle.tags && activeArticle.tags.length > 0 && (
        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Tags:</p>
            <div className="flex flex-wrap gap-2">
                {activeArticle.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
      )}

    </div>
  );
};

export default ArticleView;