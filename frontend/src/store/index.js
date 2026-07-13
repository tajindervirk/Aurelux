import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import moviesReducer from './slices/moviesSlice';
import favoritesReducer from './slices/favoritesSlice';
import watchlistReducer from './slices/watchlistSlice';
import historyReducer from './slices/historySlice';
import providerReducer from './slices/providerSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    movies: moviesReducer,
    favorites: favoritesReducer,
    watchlist: watchlistReducer,
    history: historyReducer,
    providers: providerReducer,
  },
  devTools: process.env.NODE_ENV !== 'production',
});

/**
 * @typedef {ReturnType<typeof store.getState>} RootState
 * @typedef {typeof store.dispatch} AppDispatch
 */

export default store;
