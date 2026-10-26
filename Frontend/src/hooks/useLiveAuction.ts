import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../store/hooks';
import { applyLiveBid, applyAuctionEnded, setLiveStatus } from '../store/auctionSlice';
import { addNotification } from '../store/notificationSlice';
import type { Notification } from '../types';
import {
  connectSocket, joinAuctionRoom, leaveAuctionRoom,
  onBid, onAuctionJoined, onAuctionStarted, onAuctionEnded, onNotification
} from '../services/socket/socket.service';

export const useLiveAuction = (auctionId: string | null) => {
  const dispatch = useAppDispatch();
  const cleanupRefs = useRef<Array<() => void>>([]);

  useEffect(() => {
    if (!auctionId) return;

    const socket = connectSocket();

    const onConnect = () => {
      joinAuctionRoom(auctionId);
    };

    if (socket.connected) {
      joinAuctionRoom(auctionId);
    }
    
    socket.on('connect', onConnect);

    const cleanBid = onBid((data) => {
      dispatch(applyLiveBid(data));
    });

    const cleanJoined = onAuctionJoined((data) => {
      if (data.auctionId === auctionId) {
        dispatch(setLiveStatus(data.status));
      }
    });

    const cleanStarted = onAuctionStarted((data) => {
      if (String(data.auctionId) === auctionId) {
        dispatch(setLiveStatus('LIVE'));
      }
    });

    const cleanEnded = onAuctionEnded((data) => {
      if (String(data.auctionId) === auctionId) {
        dispatch(applyAuctionEnded(data));
      }
    });

    const cleanNotif = onNotification((data: Notification) => {
      dispatch(addNotification(data));
    });

    cleanupRefs.current = [
      () => socket.off('connect', onConnect),
      cleanBid, cleanJoined, cleanStarted, cleanEnded, cleanNotif,
    ];

    return () => {
      cleanupRefs.current.forEach(fn => fn());
      if (auctionId) leaveAuctionRoom(auctionId);
    };
  }, [auctionId, dispatch]);
};