import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Post, PostType } from './types';
import Header from './components/Header';
import Gallery from './components/Gallery';
import MinimizedPlayer from './components/MinimizedPlayer';
import Modal from './components/Modal';
import { mockPosts } from './data/mockData';

export type ActivePostState = {
  post: Post;
  index: number;
  mode: 'modal' | 'minimized';
  currentTime?: number;
} | null;

const isMediaPost = (type: PostType) => [PostType.Audio, PostType.Video].includes(type);
const POSTS_CACHE_KEY = 'inspiro_posts';

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMedia, setActiveMedia] = useState<ActivePostState>(null);
  const [activeModal, setActiveModal] = useState<{ post: Post, index: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const USE_MOCK_DATA = false;

    const fetchPostsFromApi = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 🔹 ACTION REQUIRED: Replace this placeholder with your actual Sanity Project ID.
        // You can find it on your project's dashboard at manage.sanity.io.
        const projectId = "ku4jpatm"; 

        // Fix: Removed obsolete project ID check that was causing a TypeScript error.
        // The projectId is now hardcoded, making the comparison always false.

        const query = encodeURIComponent(`
          *[_type == "post"] | order(createdAt desc) {
            _id,
            title,
            type,
            description,
            quoteText,
            noteText,
            source,
            tags,
            createdAt,
            "fileUrl": media.asset->url,
            "coverUrl": coverImage.asset->url
          }
        `);

        const url = `https://${projectId}.api.sanity.io/v2021-10-21/data/query/production?query=${query}`;

        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Sanity API Error: ${errorData.error?.description || response.statusText}`);
        }
        
        const data = await response.json();

        if (data.result) {
          setPosts(data.result);
        } else {
          console.error("No results from Sanity:", data);
        }
      } catch (err: any) {
        console.error("Error fetching posts:", err);
        let errorMessage = err.message;
        if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
            errorMessage += '. This is often a CORS issue. Please ensure you have added the correct origin to your Sanity project\'s CORS settings.';
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
  

  useEffect(() => {
    // When a full-screen modal is active, prevent the body from scrolling
    if (activeMedia?.mode === 'modal' || activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup when component unmounts
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
        fetchPostsFromApi(); // API fetching logic would go here
        
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
      // If clicking the currently minimized media post, restore it
      if (activeMedia?.post._id === post._id && activeMedia?.mode === 'minimized') {
        setActiveMedia(prev => ({ ...prev!, mode: 'modal' }));
      } else {
        setActiveMedia({ post, index, mode: 'modal', currentTime: post.initialTime || 0 });
      }
      setActiveModal(null); // Close non-media modal if open
    } else {
      // It's a non-media post
      setActiveModal({ post, index });
      // If a media post is in modal mode, minimize it
      if (activeMedia?.mode === 'modal') {
        setActiveMedia(prev => ({ ...prev!, mode: 'minimized' }));
      }
    }
  }, [filteredPosts, activeMedia]);

  const handleNavigate = useCallback((direction: 'next' | 'prev') => {
    const currentItem = activeMedia?.mode === 'modal' ? activeMedia : activeModal;
    if (!currentItem) return;

    const currentIndex = currentItem.index;
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex < 0 || newIndex >= filteredPosts.length) return;

    const newPost = filteredPosts[newIndex];

    if (isMediaPost(newPost.type)) {
      setActiveMedia({ post: newPost, index: newIndex, mode: 'modal', currentTime: 0 });
      setActiveModal(null);
    } else {
      setActiveModal({ post: newPost, index: newIndex });
      if (activeMedia?.mode === 'modal') {
        setActiveMedia(prev => ({ ...prev!, mode: 'minimized' }));
      }
    }
  }, [activeMedia, activeModal, filteredPosts]);

  const handleNext = useCallback(() => handleNavigate('next'), [handleNavigate]);
  const handlePrev = useCallback(() => handleNavigate('prev'), [handleNavigate]);


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
                onClose={() => setActiveMedia(null)}
                onMinimize={() => setActiveMedia(prev => prev ? { ...prev, mode: 'minimized' } : null)}
                onRestore={() => setActiveMedia(prev => prev ? { ...prev, mode: 'modal' } : null)}
                onNext={handleNext}
                onPrev={handlePrev}
                hasNext={activeMedia.index < filteredPosts.length - 1}
                hasPrev={activeMedia.index > 0}
            />
          )}
          {activeModal && (
            <Modal
              post={activeModal.post}
              currentIndex={activeModal.index}
              totalPosts={filteredPosts.length}
              onClose={() => setActiveModal(null)}
              onNext={handleNext}
              onPrev={handlePrev}
            />
          )}
      </div>
    </div>
  );
};

export default App;
