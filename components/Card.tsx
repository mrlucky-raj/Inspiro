import React from 'react';
import { Post, PostType } from '../types';

interface CardProps {
  post: Post;
  onClick: () => void;
}

const CardContent: React.FC<{ post: Post }> = ({ post }) => {
  const mediaContent = (icon: React.ReactNode, cover: string) => (
    <div className="relative w-full bg-slate-900 group">
      <img src={cover} alt={post.title} className="w-full opacity-90 group-hover:opacity-70 transition-opacity duration-300" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/20 transition-colors duration-300">
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-full transform scale-90 group-hover:scale-100 transition-transform duration-300">
           {icon}
        </div>
      </div>
    </div>
  );
  
  switch (post.type) {
    case PostType.Image:
      return (
        <div className="relative w-full bg-slate-900 group">
          <img src={post.fileUrl || ''} alt={post.title} className="w-full group-hover:opacity-80 transition-opacity duration-300" />
        </div>
      );
    case PostType.Video:
      return mediaContent(
        <svg className="w-10 h-10 text-white/90" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>,
        post.coverUrl || ''
      );
    case PostType.Audio:
        return mediaContent(
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-white/90" viewBox="0 0 20 20" fill="currentColor">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3V3z" />
            </svg>,
            post.coverUrl || ''
        );
    case PostType.Note:
      return (
        <div className="p-5 min-h-[150px] flex flex-col">
           <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2">{post.title}</h3>
           <p className="text-sm text-slate-700 dark:text-slate-300/80 whitespace-pre-wrap font-sans line-clamp-6">{post.noteText}</p>
        </div>
      );
    case PostType.Quote:
      return (
        <div className="p-6 relative flex flex-col justify-center min-h-[150px]">
          <span className="absolute top-2 left-3 text-8xl font-serif text-slate-400/50 dark:text-slate-600/50 select-none" aria-hidden="true">“</span>
          <blockquote className="relative z-10 text-center font-serif italic text-xl text-slate-800 dark:text-slate-200">
            {post.quoteText}
          </blockquote>
          {post.source && <cite className="block text-right mt-4 text-sm text-slate-600 dark:text-slate-400 not-italic">— {post.source}</cite>}
        </div>
      );
    default:
      return null;
  }
};

const Card: React.FC<CardProps> = ({ post, onClick }) => {
  const baseClasses = "rounded-xl overflow-hidden shadow-lg hover:shadow-2xl dark:shadow-lg dark:shadow-black/25 dark:hover:shadow-2xl dark:hover:shadow-black/40 cursor-pointer group transform hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 w-full mb-6 break-inside-avoid";

  const isMedia = [PostType.Image, PostType.Video, PostType.Audio].includes(post.type);

  const glassClasses = !isMedia 
    ? "bg-white/70 dark:bg-neutral-800/70 backdrop-blur-lg border border-slate-200/80 dark:border-neutral-700/60"
    : "";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${glassClasses}`}
    >
      <CardContent post={post} />
    </div>
  );
};

export default Card;