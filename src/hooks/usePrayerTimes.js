import { useState, useEffect, useCallback } from 'react';
import { calculatePrayerTimes, getCurrentAndNextPrayer, MAKKAH_COORDS } from '../utils/prayerTimes';

export function usePrayerTimes(latitude, longitude) {
  const lat = latitude || MAKKAH_COORDS.latitude;
  const lng = longitude || MAKKAH_COORDS.longitude;

  const [prayerTimes, setPrayerTimes] = useState(null);
  const [currentNext, setCurrentNext] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const compute = useCallback(() => {
    const times = calculatePrayerTimes(lat, lng);
    const cn = getCurrentAndNextPrayer(times);
    setPrayerTimes(times);
    setCurrentNext(cn);
  }, [lat, lng]);

  useEffect(() => {
    compute();
    const interval = setInterval(compute, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [compute]);

  // Countdown timer (updates every second)
  useEffect(() => {
    if (!currentNext?.next?.time) return;
    const tick = () => {
      const ms = currentNext.next.time - new Date();
      setCountdown(ms > 0 ? ms : 0);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [currentNext]);

  return { prayerTimes, currentNext, countdown };
}
