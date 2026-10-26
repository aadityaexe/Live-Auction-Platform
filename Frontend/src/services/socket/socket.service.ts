import { io, Socket } from 'socket.io-client';
import type { LiveBidEvent, AuctionJoinedEvent, AuctionEndedEvent, Notification } from '../../types';
import { getAccessToken } from '../api/client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || '';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      auth: {
        token: getAccessToken()
      }
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinAuctionRoom = (auctionId: string) => {
  const s = getSocket();
  s.emit('auction:join', auctionId);
};

export const leaveAuctionRoom = (auctionId: string) => {
  const s = getSocket();
  s.emit('auction:leave', auctionId);
};

export const joinUserRoom = (userId: string) => {
  const s = getSocket();
  s.emit('user:join', userId);
};

export const onBid = (cb: (data: LiveBidEvent) => void) => {
  const s = getSocket();
  s.on('auction:bid', cb);
  return () => s.off('auction:bid', cb);
};

export const onAuctionJoined = (cb: (data: AuctionJoinedEvent) => void) => {
  const s = getSocket();
  s.on('auction:joined', cb);
  return () => s.off('auction:joined', cb);
};

export const onAuctionStarted = (cb: (data: { auctionId: string; status: string; currentPrice: number }) => void) => {
  const s = getSocket();
  s.on('auction:started', cb);
  return () => s.off('auction:started', cb);
};

export const onAuctionEnded = (cb: (data: AuctionEndedEvent) => void) => {
  const s = getSocket();
  s.on('auction:ended', cb);
  return () => s.off('auction:ended', cb);
};

export const onNotification = (cb: (data: Notification) => void) => {
  const s = getSocket();
  s.on('notification:new', cb);
  return () => s.off('notification:new', cb);
};

export const onSocketError = (cb: (data: { message: string; code: string }) => void) => {
  const s = getSocket();
  s.on('auction:error', cb);
  return () => s.off('auction:error', cb);
};