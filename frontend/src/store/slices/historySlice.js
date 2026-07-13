import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/apiService';

export const fetchHistory = createAsyncThunk(
  'history/fetchHistory',
  async (_, thunkAPI) => {
    try {
      const response = await apiService.get('/user/history');
      if (response.success) {
        return response.data;
      }
      return thunkAPI.rejectWithValue('Failed to fetch history');
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch history'
      );
    }
  }
);

export const addToHistory = createAsyncThunk(
  'history/addToHistory',
  async (historyData, thunkAPI) => {
    try {
      const response = await apiService.post('/user/history', historyData);
      if (response.success) {
        return response.data;
      }
      return thunkAPI.rejectWithValue('Failed to add to history');
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to add to history'
      );
    }
  }
);

export const clearHistory = createAsyncThunk(
  'history/clearHistory',
  async (_, thunkAPI) => {
    try {
      const response = await apiService.delete('/user/history');
      if (response.success) {
        return [];
      }
      return thunkAPI.rejectWithValue('Failed to clear history');
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to clear history'
      );
    }
  }
);

export const removeSingleHistory = createAsyncThunk(
  'history/removeSingleHistory',
  async (tmdbId, thunkAPI) => {
    try {
      const response = await apiService.delete(`/user/history/${tmdbId}`);
      if (response.success) {
        return tmdbId; // Return ID to remove from state
      }
      return thunkAPI.rejectWithValue('Failed to remove history item');
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to remove history item'
      );
    }
  }
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchHistory.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchHistory.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchHistory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // Add
    builder.addCase(addToHistory.fulfilled, (state, action) => {
      state.items = action.payload;
    });

    // Clear
    builder.addCase(clearHistory.fulfilled, (state) => {
      state.items = [];
    });

    // Remove single
    builder.addCase(removeSingleHistory.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.tmdbId !== action.payload);
    });
  },
});

export const selectHistory = (state) => state.history;

export default historySlice.reducer;
