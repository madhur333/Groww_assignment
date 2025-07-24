import React, { createContext, useContext, useState } from 'react';

type SearchContextType = {
  searchValue: string;
  setSearchValue: (v: string) => void;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
};

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const [searchValue, setSearchValue] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  return (
    <SearchContext.Provider value={{ searchValue, setSearchValue, showSearch, setShowSearch }}>
      {children}
    </SearchContext.Provider>
  );
};

export function useSearchContext() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearchContext must be used within SearchProvider');
  return ctx;
}