import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Post, PostType } from './types';
import Header from './components/Header';
import Gallery from './components/Gallery';
import MinimizedPlayer from './components/MinimizedPlayer';
import Modal from './components/Modal';
import { mockPosts } from './data/mockData';

export type ActiveMediaState = {
  post: Post;
  index: number;
  mode: 'modal' | 'minimized';
  currentTime?: number;
} | null;

export type ActiveModalState = {
  post: Post;
  index: number;
} | null;

const isMediaPost = (type: PostType) => [PostType.Audio, PostType.Video].includes(type);
const POSTS_CACHE_KEY = 'inspiro_posts';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMedia, setActiveMedia] = useState<ActiveMediaState>(null);
  const [activeModal, setActiveModal] = useState<ActiveModalState>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const USE_MOCK_DATA = true;

  useEffect(() => {
    // When a full-screen modal is active, prevent the body from scrolling
    if (activeMedia?.mode === 'modal' || activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup when component unmounts or activePost changes
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeMedia, activeModal]);

  useEffect(() => {
    // 1. Try to load from cache for an instant UI
    try {
      const cachedData = localStorage.getItem(POSTS_CACHE_KEY);
      if (cachedData) {
        setPosts(JSON.parse(cachedData));
        setIsLoading(false);
      } else {
        setIsLoading(true); // No cache, so we are definitely loading
      }
    } catch {
      // If cache is corrupt, ignore and start fresh
      setIsLoading(true);
    }
    
    // 2. "Fetch" new data and update cache
    if (USE_MOCK_DATA) {
        // Simulate network delay
        setTimeout(() => {
            setPosts(mockPosts);
            try {
              localStorage.setItem(POSTS_CACHE_KEY, JSON.stringify(mockPosts));
            } catch (e) {
              console.error("Failed to cache posts:", e);
            }
            setIsLoading(false);
        }, 500);
    } else {
        // fetchPostsFromApi(); // API fetching logic would go here
    }
  }, []);

  const filteredPosts = useMemo(() => {
    if (!searchQuery) return posts;
    const lowercasedQuery = searchQuery.toLowerCase();
    return posts.filter(post =>
      post.title.toLowerCase().includes(lowercasedQuery) ||
      (post.description && post.description.toLowerCase().includes(lowercasedQuery)) ||
      (post.noteText && post.noteText.toLowerCase().includes(lowercasedQuery)) ||
      (post.quoteText && post.quoteText.toLowerCase().includes(lowercasedQuery))
    );
  }, [posts, searchQuery]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);
  
  const handleCardClick = useCallback((post: Post) => {
    const index = filteredPosts.findIndex(p => p._id === post._id);
    if (index === -1) return;

    if (isMediaPost(post.type)) {
      if (activeMedia?.post._id === post._id && activeMedia.mode === 'minimized') {
        setActiveMedia(prev => ({ ...prev!, mode: 'modal' }));
      } else {
        setActiveMedia({ post, index, mode: 'modal', currentTime: post.initialTime || 0 });
      }
      setActiveModal(null);
    } else {
      setActiveModal({ post, index });
    }
  }, [filteredPosts, activeMedia]);

  const handleCloseMedia = useCallback(() => setActiveMedia(null), []);
  const handleMinimizeMedia = useCallback(() => setActiveMedia(prev => prev ? { ...prev, mode: 'minimized' } : null), []);
  const handleRestoreMedia = useCallback(() => setActiveMedia(prev => prev ? { ...prev, mode: 'modal' } : null), []);

  const handleCloseModal = useCallback(() => setActiveModal(null), []);

  const handleNext = useCallback(() => {
    const currentIndex = activeMedia?.index ?? activeModal?.index;
    if (typeof currentIndex !== 'number' || currentIndex >= filteredPosts.length - 1) return;
    
    const newIndex = currentIndex + 1;
    const nextPost = filteredPosts[newIndex];
    
    if (isMediaPost(nextPost.type)) {
        setActiveMedia({ post: nextPost, index: newIndex, mode: 'modal', currentTime: 0 });
        setActiveModal(null);
    } else {
        setActiveModal({ post: nextPost, index: newIndex });
    }
  }, [activeMedia, activeModal, filteredPosts]);

  const handlePrev = useCallback(() => {
    const currentIndex = activeMedia?.index ?? activeModal?.index;
    if (typeof currentIndex !== 'number' || currentIndex <= 0) return;

    const newIndex = currentIndex - 1;
    const prevPost = filteredPosts[newIndex];

    if (isMediaPost(prevPost.type)) {
        setActiveMedia({ post: prevPost, index: newIndex, mode: 'modal', currentTime: 0 });
        setActiveModal(null);
    } else {
        setActiveModal({ post: prevPost, index: newIndex });
    }
  }, [activeMedia, activeModal, filteredPosts]);

  const currentIndex = activeMedia?.index ?? activeModal?.index ?? -1;

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 font-sans relative">
      <div className="relative z-10 flex flex-col min-h-screen">
          <Header 
            searchQuery={searchQuery} 
            onSearchChange={handleSearchChange}
            onClearSearch={handleClearSearch}
          />
          <main className="container mx-auto px-4 py-8 flex-grow">
            {isLoading ? (
              <div className="text-center text-slate-500 dark:text-slate-400">Loading content...</div>
            ) : error ? (
              <div className="text-center max-w-2xl mx-auto p-6 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800/50 rounded-lg shadow-md">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Failed to Load Content</h3>
                <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
                 <div className="mt-4 text-left text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-md">
                    <p className="font-bold">Troubleshooting Steps:</p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Ensure the <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">projectId</code> in <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">App.tsx</code> is correct.</li>
                        <li>
                            Go to your Sanity project settings, navigate to the API tab, and add the following URL to your CORS origins:
                            <br />
                            <strong className="block text-center my-1 font-mono">{`https://google-labs-studio-proxy.googleusercontent.com`}</strong>
                        </li>
                    </ol>
                </div>
              </div>
            ) : (
              <Gallery posts={filteredPosts} onCardClick={handleCardClick} />
            )}
          </main>
          {activeMedia && (
            <MinimizedPlayer 
                data={activeMedia}
                onClose={handleCloseMedia}
                onMinimize={handleMinimizeMedia}
                onRestore={handleRestoreMedia}
                onNext={handleNext}
                onPrev={handlePrev}
                hasNext={currentIndex < filteredPosts.length - 1}
                hasPrev={currentIndex > 0}
            />
          )}
          {activeModal && (
            <Modal
                post={activeModal.post}
                currentIndex={activeModal.index}
                totalPosts={filteredPosts.length}
                onClose={handleCloseModal}
                onNext={handleNext}
                onPrev={handlePrev}
            />
          )}
      </div>
    </div>
  );
};

export default App;
