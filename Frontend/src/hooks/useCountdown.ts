import { useState, useEffect, useRef } from 'react';
import { getTimeLeft } from '../utils';

export const useCountdown = (endTime: string | null) => {
  const [state, setState] = useState<{ text: string; isEnding: boolean; isOver: boolean }>(
    endTime ? getTimeLeft(endTime) : { text: '', isEnding: false, isOver: false }
  );
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!endTime) return;
    const tick = () => setState(getTimeLeft(endTime));
    tick();
    intervalRef.current = window.setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [endTime]);

  return state;
};