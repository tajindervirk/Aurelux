import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/apiService';

// Read initial login flag from localStorage (used only to attempt fetching user profile on refresh)
const initialLoginFlag = localStorage.getItem('aurelux_logged_in') === 'true';

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, thunkAPI) => {
    try {
      const response = await apiService.post('/auth/login', credentials);
      if (response.success) {
        localStorage.setItem('aurelux_logged_in', 'true');
        return { user: response.user };
      }
      return thunkAPI.rejectWithValue(response.message);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      const response = await apiService.post('/auth/register', userData);
      if (response.success) {
        localStorage.setItem('aurelux_logged_in', 'true');
        return { user: response.user };
      }
      return thunkAPI.rejectWithValue(response.message);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/me',
  async (_, thunkAPI) => {
    try {
      const response = await apiService.get('/auth/me');
      if (response.success) {
        return response.user;
      }
      return thunkAPI.rejectWithValue(response.message);
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to fetch user profile'
      );
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await apiService.post('/auth/logout');
  } catch (error) {
    console.error('Logout failed on server', error);
  } finally {
    localStorage.removeItem('aurelux_logged_in');
  }
  return null;
});

const initialState = {
  user: null,
  isAuthenticated: initialLoginFlag,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // --- Login ---
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // --- Register ---
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // --- Fetch Current User ---
    builder.addCase(fetchCurrentUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCurrentUser.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload;
    });
    builder.addCase(fetchCurrentUser.rejected, (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      localStorage.removeItem('aurelux_logged_in'); // Cleanup flag if verify fails
    });

    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
    });
  },
});

export const { clearError } = authSlice.actions;

export const selectAuth = (state) => state.auth;

export default authSlice.reducer;
