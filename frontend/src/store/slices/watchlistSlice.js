import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/apiService';

export const fetchWatchlist = createAsyncThunk(
  'watchlist/fetchWatchlist',
  async (_, thunkAPI) => {
    try {
      const response = await apiService.get('/user/watchlist');
      if (response.success) {
        return response.data;
      }
      return thunkAPI.rejectWithValue('Failed to fetch watchlist');
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch watchlist'
      );
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'watchlist/addToWatchlist',
  async (movieData, thunkAPI) => {
    try {
      const response = await apiService.post('/user/watchlist', movieData);
      if (response.success) {
        return response.data;
      }
      return thunkAPI.rejectWithValue('Failed to add to watchlist');
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to add to watchlist'
      );
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'watchlist/removeFromWatchlist',
  async (tmdbId, thunkAPI) => {
    try {
      const response = await apiService.delete(`/user/watchlist/${tmdbId}`);
      if (response.success) {
        return response.data;
      }
      return thunkAPI.rejectWithValue('Failed to remove from watchlist');
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to remove from watchlist'
      );
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchWatchlist.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchWatchlist.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchWatchlist.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Add Optimistic
    builder.addCase(addToWatchlist.pending, (state, action) => {
      const exists = state.items.find((i) => i.tmdbId === action.meta.arg.tmdbId);
      if (!exists) {
        state.items.push(action.meta.arg);
      }
    });
    builder.addCase(addToWatchlist.fulfilled, (state, action) => {
      state.items = action.payload;
    });
    builder.addCase(addToWatchlist.rejected, (state, action) => {
      state.items = state.items.filter((i) => i.tmdbId !== action.meta.arg.tmdbId);
      state.error = action.payload;
    });

    // Remove Optimistic
    builder.addCase(removeFromWatchlist.pending, (state, action) => {
      state.items = state.items.filter((i) => i.tmdbId !== action.meta.arg);
    });
    builder.addCase(removeFromWatchlist.fulfilled, (state, action) => {
      state.items = action.payload;
    });
    builder.addCase(removeFromWatchlist.rejected, (state, action) => {
      state.error = action.payload;
    });
  },
});

export const selectWatchlist = (state) => state.watchlist;
export const selectIsInWatchlist = (state, tmdbId) =>
  state.watchlist.items.some((item) => item.tmdbId === tmdbId);

export default watchlistSlice.reducer;
