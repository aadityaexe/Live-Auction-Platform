import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User } from '../types';
import { authApi } from '../services/api/auth.api';
import { setAccessToken } from '../services/api/client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  loading: false,
  error: null,
  initialized: false,
};

export const initializeAuth = createAsyncThunk('auth/initialize', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authApi.getMe();
    return data.data;
  } catch {
    return rejectWithValue(null);
  }
});

export const loginUser = createAsyncThunk('auth/login', async (
  creds: { email: string; password: string },
  { rejectWithValue }
) => {
  try {
    const { data } = await authApi.login(creds);
    setAccessToken(data.accessToken);
    return { user: data.user, accessToken: data.accessToken };
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed';
    return rejectWithValue(msg);
  }
});

export const registerUser = createAsyncThunk('auth/register', async (
  payload: { username: string; email: string; password: string; role?: string },
  { rejectWithValue }
) => {
  try {
    const { data } = await authApi.register(payload);
    setAccessToken(data.accessToken);
    return { user: data.user, accessToken: data.accessToken };
  } catch (err: unknown) {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed';
    return rejectWithValue(msg);
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await authApi.logout(); } catch { /* best effort */ }
  setAccessToken(null);
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
      setAccessToken(action.payload);
    },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.loading = false;
      state.initialized = true;
      state.error = null;
      setAccessToken(null);
    },
    clearError: (state) => { state.error = null; },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) Object.assign(state.user, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => { state.loading = true; })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.loading = false; state.initialized = true;
        state.user = action.payload ?? null;
        state.accessToken = (typeof window !== 'undefined' ? sessionStorage.getItem('accessToken') : null);
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.loading = false; state.initialized = true; state.user = null;
        state.accessToken = null;
      })
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user as User;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user as User;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false; state.error = action.payload as string;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null; state.accessToken = null;
      });
  },
});

export const { setToken, clearAuth, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;