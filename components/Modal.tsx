import React, { useEffect, useCallback } from 'react';
import { Post, PostType } from '../types';
import { useSwipe } from './useSwipe';

interface ModalProps {
  post: Post;
  currentIndex: number;
  totalPosts: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const ModalContent: React.FC<{ post: Post }> = ({ post }) => {
  switch (post.type) {
    case PostType.Image:
      return <img src={post.fileUrl || ''} alt={post.title} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />;
    case PostType.Note:
      return (
        <div className="p-6 sm:p-8 bg-black/30 backdrop-blur-2xl rounded-xl shadow-2xl w-[90vw] max-w-2xl border border-white/10">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white">{post.title}</h2>
            <div className="max-h-[60vh] overflow-y-auto pr-2">
              <p className="text-slate-200 whitespace-pre-wrap font-sans text-sm sm:text-base">{post.noteText}</p>
            </div>
        </div>
      );
    case PostType.Quote:
      return (
        <div className="p-8 sm:p-12 bg-black/30 backdrop-blur-2xl rounded-xl shadow-2xl text-center w-[90vw] max-w-2xl border border-white/10">
            <blockquote className="text-2xl sm:text-3xl font-bold text-white italic">
                “{post.quoteText}”
            </blockquote>
            {post.source && <cite className="block text-lg sm:text-xl text-slate-400 mt-6 not-italic">- {post.source}</cite>}
        </div>
      );
    default:
      // This modal no longer handles Audio/Video, they are handled by the persistent player.
      return null;
  }
};

const NavButton: React.FC<{ direction: 'prev' | 'next'; onClick: () => void; disabled: boolean }> = ({ direction, onClick, disabled }) => {
    if (disabled) return null;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <button
            onClick={handleClick}
            className={`absolute top-1/2 -translate-y-1/2 ${direction === 'prev' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'} z-50 h-10 w-10 sm:h-14 sm:w-14 bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-all opacity-60 hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white`}
            aria-label={direction === 'prev' ? 'Previous item' : 'Next item'}
            disabled={disabled}
        >
            {direction === 'prev' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            )}
        </button>
    );
};

const Modal: React.FC<ModalProps> = ({ post, currentIndex, totalPosts, onClose, onNext, onPrev }) => {
    
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
           if (event.key === 'Escape') onClose();
           if (event.key === 'ArrowRight' && currentIndex < totalPosts - 1) onNext();
           if (event.key === 'ArrowLeft' && currentIndex > 0) onPrev();
        };
        window.addEventListener('keydown', handleKeyDown);
    
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, onNext, onPrev, currentIndex, totalPosts]);

  const isTouchDevice = 'ontouchstart' in window;

  const swipeHandlers = useSwipe({
    onSwipedLeft: () => { if (currentIndex < totalPosts - 1) onNext(); },
    onSwipedRight: () => { if (currentIndex > 0) onPrev(); },
    onSwipedUp: onClose,
    onSwipedDown: onClose, // No minimize state, so close on swipe down
  });

  return (
    <div 
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg flex justify-center items-center z-50 p-2 sm:p-4 animate-fade-in"
        onClick={onClose}
        {...swipeHandlers}
    >
      <button 
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 h-10 w-10 sm:h-12 sm:w-12 bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Close"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {!isTouchDevice && <NavButton direction="prev" onClick={onPrev} disabled={currentIndex === 0} />}
      
      <div 
        className="relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <ModalContent post={post} />
      </div>
      
      {!isTouchDevice && <NavButton direction="next" onClick={onNext} disabled={currentIndex === totalPosts - 1} />}
    </div>
  );
};

export default Modal;
