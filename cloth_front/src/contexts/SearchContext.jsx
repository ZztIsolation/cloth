import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

export const useSearchContext = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};

export const SearchProvider = ({ children }) => {
  const [searchState, setSearchState] = useState({
    searchType: 'text',
    searchResults: [],
    searchQuery: '',
    searchTags: {},
    uploadedImage: null,
    ragImage: null,
    ragImageUrl: '',
    ragAiTags: null,
    ragAiResponse: '',
    ragSimilarityVector: null,
    ragResults: null,
    similarityThreshold: 0.8,
    hasSearched: false // 标记是否已经进行过搜索
  });

  const updateSearchState = (newState) => {
    setSearchState(prev => ({ ...prev, ...newState }));
  };

  const clearSearchState = () => {
    setSearchState({
      searchType: 'text',
      searchResults: [],
      searchQuery: '',
      searchTags: {},
      uploadedImage: null,
      ragImage: null,
      ragImageUrl: '',
      ragAiTags: null,
      ragAiResponse: '',
      ragSimilarityVector: null,
      ragResults: null,
      similarityThreshold: 0.8,
      hasSearched: false
    });
  };

  return (
    <SearchContext.Provider value={{
      searchState,
      updateSearchState,
      clearSearchState
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;