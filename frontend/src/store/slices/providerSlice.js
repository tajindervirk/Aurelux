import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/apiService';

export const fetchProviders = createAsyncThunk(
  'providers/fetchAll',
  async (_, thunkAPI) => {
    try {
      const response = await apiService.get('/providers');
      if (response.success) {
        return response.data;
      }
      return thunkAPI.rejectWithValue('Failed to fetch providers');
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Error fetching providers'
      );
    }
  }
);

const initialState = {
  providers: [],
  loading: false,
  error: null,
};

const providerSlice = createSlice({
  name: 'providers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchProviders.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProviders.fulfilled, (state, action) => {
      state.loading = false;
      state.providers = action.payload;
    });
    builder.addCase(fetchProviders.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const selectProviders = (state) => state.providers.providers;
export const selectProvidersLoading = (state) => state.providers.loading;

export default providerSlice.reducer;
