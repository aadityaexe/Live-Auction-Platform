import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from '../types';
import { notificationApi } from '../services/api/other.api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

const initialState: NotificationState = { notifications: [], unreadCount: 0, loading: false };

export const fetchNotifications = createAsyncThunk('notifications/fetch', async () => {
  const { data } = await notificationApi.getNotifications({ limit: 50 });
  return data;
});

export const markRead = createAsyncThunk('notifications/markRead', async (id: string) => {
  await notificationApi.markRead(id);
  return id;
});

export const markAllRead = createAsyncThunk('notifications/markAllRead', async () => {
  await notificationApi.markAllRead();
});

const notifSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications = [action.payload, ...state.notifications];
      if (!action.payload.isRead) state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => { state.loading = true; })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(markRead.fulfilled, (state, action) => {
        const n = state.notifications.find(n => n._id === action.payload);
        if (n && !n.isRead) { n.isRead = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.notifications.forEach(n => { n.isRead = true; });
        state.unreadCount = 0;
      });
  },
});

export const { addNotification } = notifSlice.actions;
export default notifSlice.reducer;