import React, { useState } from 'react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
}

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3C12 3 6 9 6 12C6 15 8 21 12 21C16 21 18 15 18 12C18 9 12 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12C13.6569 12 15 10.6569 15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const AppTitle: React.FC<{ desktop?: boolean }> = ({ desktop = false }) => (
  <a 
    href="#" 
    onClick={(e) => { e.preventDefault(); window.scrollTo(0,0); }} 
    className="flex items-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-offset-slate-50 dark:focus:ring-offset-[#1e1e1e] focus:ring-sky-500 rounded-lg -m-2 p-2"
    aria-label="Inspiro Home"
  >
    <Logo className={desktop ? "h-8 w-8 text-slate-900 dark:text-white" : "h-7 w-7 text-slate-900 dark:text-white"} />
    <span className={`${desktop ? 'text-3xl' : 'text-2xl'} font-extrabold text-slate-900 dark:text-white tracking-tight`}>
      Inspiro
    </span>
  </a>
);

const Header: React.FC<HeaderProps> = ({ searchQuery, onSearchChange, onClearSearch }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-slate-50/70 dark:bg-[#1e1e1e]/60 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/50 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center gap-4">
        {/* Desktop Header */}
        <div className="hidden sm:flex justify-between items-center w-full">
          <AppTitle desktop />
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={onSearchChange}
                className="w-64 bg-slate-100/70 dark:bg-slate-800/70 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 border border-slate-300/50 dark:border-slate-700/50 rounded-full py-2 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all duration-300 shadow-sm"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={onClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  aria-label="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex sm:hidden justify-between items-center w-full h-10">
          {!isSearchOpen ? (
            <>
              <AppTitle />
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                  aria-label="Open search"
                >
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center w-full gap-2 animate-fade-in">
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors"
                aria-label="Close search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={onSearchChange}
                  autoFocus
                  className="w-full bg-slate-100/70 dark:bg-slate-800/70 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 border border-slate-300/50 dark:border-slate-700/50 rounded-full py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-400 transition-all duration-300"
                />
                {searchQuery && (
                  <button
                    onClick={onClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                    aria-label="Clear search"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;