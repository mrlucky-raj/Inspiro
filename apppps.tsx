import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Post, PostType } from '../types';
import { ActiveMediaState } from '../App';
import { useSwipe } from './useSwipe';

interface MediaPlayerProps {
  data: NonNullable<ActiveMediaState>;
  onClose: () => void;
  onMinimize: () => void;
  onRestore: () => void;
  onNext: () => void;
  onPrev: () => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds === Infinity) return '0:00';
  const floorSeconds = Math.floor(seconds);
  const min = Math.floor(floorSeconds / 60);
  const sec = floorSeconds % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const NavButton: React.FC<{ direction: 'prev' | 'next'; onClick: (e: React.MouseEvent) => void; disabled: boolean }> = ({ direction, onClick, disabled }) => {
    if (disabled) return null;
    return (
        <button
            onClick={onClick}
            className={`absolute top-1/2 -translate-y-1/2 ${direction === 'prev' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'} z-50 h-10 w-10 sm:h-14 sm:w-14 bg-white/20 text-white rounded-full items-center justify-center backdrop-blur-md hover:bg-white/30 transition-all opacity-60 hover:opacity-100 disabled:opacity-0 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white hidden sm:flex`}
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

const MinimizedPlayer: React.FC<MediaPlayerProps> = ({ data, onClose, onMinimize, onRestore, onNext, onPrev, hasNext, hasPrev }) => {
  const { post } = data;
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const isMedia = post.type === PostType.Audio || post.type === PostType.Video;

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(prev => !prev);
  }, []);
  
  // Effect to declaratively control play/pause state
  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !isMedia) return;

    if (isPlaying) {
      media.play().catch(() => setIsPlaying(false)); // Handle autoplay block
    } else {
      media.pause();
    }
  }, [isPlaying, isMedia]);

  // This effect ensures playback continues when transitioning from minimized to modal.
  useEffect(() => {
    const media = mediaRef.current;
    if (isMedia && data.mode === 'modal' && isPlaying && media?.paused) {
      media.play().catch(() => setIsPlaying(false));
    }
  }, [data.mode, isPlaying, isMedia]);

  // Effect to setup a new media item (post) and its event listeners
  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !isMedia) return;

    const handleLoadedMetadata = () => {
      setDuration(media.duration);
      if (data.currentTime) {
        media.currentTime = data.currentTime;
      }
    };
    const handleTimeUpdate = () => {
      if (!isFinite(media.duration)) return;
      setCurrentTime(media.currentTime);
      setProgress((media.currentTime / media.duration) * 100);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    media.addEventListener('loadedmetadata', handleLoadedMetadata);
    media.addEventListener('timeupdate', handleTimeUpdate);
    media.addEventListener('play', handlePlay);
    media.addEventListener('pause', handlePause);
    
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);

    return () => {
      media.removeEventListener('loadedmetadata', handleLoadedMetadata);
      media.removeEventListener('timeupdate', handleTimeUpdate);
      media.removeEventListener('play', handlePlay);
      media.removeEventListener('pause', handlePause);
    };
  }, [post._id, isMedia]);

  // Effect for Media Session API: Metadata and Action Handlers
  useEffect(() => {
    if (!isMedia || !('mediaSession' in navigator)) return;

    if (post) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: post.title,
        artist: 'Unknown Artist',
        album: 'Inspiro',
        artwork: post.coverUrl ? [{ src: post.coverUrl }] : [],
      });

      const handleNext = () => { if (hasNext) onNext(); };
      const handlePrev = () => { if (hasPrev) onPrev(); };
      
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
    }

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
    };
  }, [post, onNext, onPrev, hasNext, hasPrev, togglePlay, isMedia]);

  // Effect for Media Session API: Playback State
  useEffect(() => {
    if (isMedia && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying, isMedia]);

  // Final cleanup for media session on component unmount
  useEffect(() => {
    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.playbackState = 'none';
      }
    };
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const progressBar = progressBarRef.current;
    const media = mediaRef.current;
    if (progressBar && media && isFinite(media.duration)) {
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      media.currentTime = percentage * media.duration;
    }
  }, []);
  
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const isModal = data.mode === 'modal';
  const isVideo = post.type === PostType.Video;
  const MediaElement = isVideo ? 'video' : 'audio';

  const swipeHandlers = useSwipe({
      onSwipedLeft: () => { if (hasNext) onNext(); },
      onSwipedRight: () => { if (hasPrev) onPrev(); },
      onSwipedUp: onClose,
      onSwipedDown: onMinimize,
  });

  const rootClasses = isModal
    ? "fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-lg flex justify-center items-center z-50 p-2 sm:p-4 animate-fade-in"
    : `fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50 ${isVideo ? 'w-48 sm:w-64 h-28 sm:h-36' : 'w-[320px] sm:w-[340px] h-[100px]'} bg-black/30 backdrop-blur-2xl rounded-xl shadow-2xl border border-white/10 overflow-hidden flex items-center justify-center transition-all duration-300 animate-fade-in cursor-pointer`;

  const mediaElementClasses = [
    isVideo ? 'w-full h-full' : 'hidden',
    isModal && isVideo ? 'max-w-full max-h-[80vh] rounded-lg bg-black object-contain shadow-2xl' : '',
    !isModal && isVideo ? 'object-cover pointer-events-none' : ''
  ].filter(Boolean).join(' ');

  const handleBackdropClick = isModal ? onMinimize : onRestore;

  return (
    <div className={rootClasses} 
        onClick={handleBackdropClick}
        {...(isModal ? swipeHandlers : {})}
    >
        {isMedia && (
            <MediaElement
                ref={mediaRef}
                src={post.fileUrl || ''}
                muted={false}
                playsInline
                loop
                controls={isModal && isVideo}
                className={mediaElementClasses}
                onClick={isModal && isVideo ? (e) => togglePlay(e) : undefined}
            />
        )}

        {isModal && (
            <>
                <button onClick={(e) => { stopPropagation(e); onClose(); }} className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 h-10 w-10 sm:h-12 sm:w-12 bg-white/20 text-white rounded-full items-center justify-center backdrop-blur-md hover:bg-white/30 transition-all focus:outline-none focus:ring-2 focus:ring-white hidden sm:flex" aria-label="Close">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                <NavButton direction="prev" onClick={(e) => { stopPropagation(e); onPrev(); }} disabled={!hasPrev} />

                <div className="relative" onClick={stopPropagation}>
                    {post.type === PostType.Audio && (
                        <div className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden bg-black/30 backdrop-blur-2xl border border-white/10">
                            <div className="w-full aspect-square p-4 relative group cursor-pointer" onClick={togglePlay}>
                                <img src={post.coverUrl || ''} alt={post.title} className="w-full h-full object-cover rounded-xl shadow-lg" />
                                <div className="absolute inset-4 flex items-center justify-center bg-black/20 rounded-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-full">
                                        {isPlaying 
                                            ? <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                            : <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white ml-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 pt-2 text-white">
                                <div className="text-center"><h2 className="text-2xl font-bold tracking-tight">{post.title}</h2>{post.description && <p className="text-sm text-slate-300 mt-1 truncate">{post.description}</p>}</div>
                                <div className="mt-6 w-full">
                                    <div ref={progressBarRef} onClick={handleSeek} className="w-full h-2 bg-white/20 rounded-full cursor-pointer group my-2 transition"><div className="h-full bg-slate-200 rounded-full relative" style={{ width: `${progress}%` }}><div className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 bg-slate-200 rounded-full shadow-md transform opacity-0 group-hover:opacity-100 transition-opacity"></div></div></div>
                                    <div className="flex justify-between text-xs font-medium text-slate-400"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <NavButton direction="next" onClick={(e) => { stopPropagation(e); onNext(); }} disabled={!hasNext} />
            </>
        )}
        
        {!isModal && isMedia && (
            <>
                {isVideo && (
                    <>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                         <button onClick={(e) => { stopPropagation(e); onClose(); }} className="absolute top-1 right-1 z-10 w-7 h-7 flex items-center justify-center rounded-full text-white bg-black/30 hover:bg-black/50 transition-colors" aria-label="Close player">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </>
                )}
                {!isVideo && (
                    <div className="relative p-3 flex items-center gap-4 w-full h-full">
                        <img src={post.coverUrl || ''} alt={post.title} className="w-16 h-16 rounded-md object-cover shadow-sm flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-base text-white truncate">{post.title}</p>
                            <div ref={progressBarRef} onClick={handleSeek} className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group mt-2">
                                <div className="h-full bg-slate-300 rounded-full relative" style={{ width: `${progress}%` }}>
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-3 bg-slate-300 rounded-full transform opacity-0 group-hover:opacity-100 transition-opacity shadow-md"></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-slate-400 mt-1">
                                <span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span>
                            </div>
                        </div>
                        <div className="flex items-center self-center pl-1">
                            <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10 transition-colors">
                                {isPlaying ? <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 ml-0.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>}
                            </button>
                        </div>
                        <button onClick={(e) => { stopPropagation(e); onClose(); }} className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center rounded-full text-slate-300 hover:bg-white/10 transition-colors" aria-label="Close player">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                )}
            </>
        )}
    </div>
  );
};

export default MinimizedPlayer;
