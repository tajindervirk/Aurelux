import { createContext, useContext } from 'react';

export const PlayerContext = createContext(null);

export const usePlayerContext = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayerContext must be used within PlayerProvider');
  return ctx;
};
