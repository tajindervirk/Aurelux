import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/apiService';

export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (_, thunkAPI) => {
    try {
      const response = await apiService.get('/user/favorites');
      if (response.success) {
        return response.data; // array of items
      }
      return thunkAPI.rejectWithValue('Failed to fetch favorites');
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch favorites'
      );
    }
  }
);

export const addFavorite = createAsyncThunk(
  'favorites/addFavorite',
  async (movieData, thunkAPI) => {
    try {
      const response = await apiService.post('/user/favorites', movieData);
      if (response.success) {
        return response.data;
      }
      return thunkAPI.rejectWithValue('Failed to add favorite');
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to add favorite'
      );
    }
  }
);

export const removeFavorite = createAsyncThunk(
  'favorites/removeFavorite',
  async (tmdbId, thunkAPI) => {
    try {
      const response = await apiService.delete(`/user/favorites/${tmdbId}`);
      if (response.success) {
        return response.data;
      }
      return thunkAPI.rejectWithValue('Failed to remove favorite');
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to remove favorite'
      );
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchFavorites.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchFavorites.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchFavorites.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Add Optimized Optimistic vs Payload
    // By spec, we do optimistic update here in pending, or since we get the full list
    // back in the payload, we can just replace it in fulfilled. We will replace it 
    // in fulfilled to ensure perfect sync (simplest). If user explicitly needs true 
    // pending-state UI-level optimistic update, they can do a manual dispatch in UI.
    // For Redux async thunk, doing it manually is possible via meta.arg.
    builder.addCase(addFavorite.pending, (state, action) => {
      // Optimistic Add
      const exists = state.items.find((i) => i.tmdbId === action.meta.arg.tmdbId);
      if (!exists) {
        state.items.push(action.meta.arg);
      }
    });
    builder.addCase(addFavorite.fulfilled, (state, action) => {
      // API source of truth
      state.items = action.payload;
    });
    builder.addCase(addFavorite.rejected, (state, action) => {
      // Revert Optimistic Add
      state.items = state.items.filter((i) => i.tmdbId !== action.meta.arg.tmdbId);
      state.error = action.payload;
    });

    // Remove Optimistic vs Payload
    builder.addCase(removeFavorite.pending, (state, action) => {
      // Keep track of what we removed? Usually just re-filter optimistically
      state.items = state.items.filter((i) => i.tmdbId !== action.meta.arg);
    });
    builder.addCase(removeFavorite.fulfilled, (state, action) => {
      state.items = action.payload;
    });
    builder.addCase(removeFavorite.rejected, (state, action) => {
      // It's harder to restore without the full object, so we rely on fetch 
      // or we can ignore revert if we fetch frequently.
      state.error = action.payload;
    });
  },
});

export const selectFavorites = (state) => state.favorites;
export const selectIsFavorite = (state, tmdbId) =>
  state.favorites.items.some((item) => item.tmdbId === tmdbId);

export default favoritesSlice.reducer;
