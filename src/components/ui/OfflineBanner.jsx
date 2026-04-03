import { useState, useEffect } from 'react';
import { useOffline } from '../../hooks/useOffline';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineBanner() {
  const isOffline = useOffline();
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    if (!isOffline) {
      setShowOnline(true);
      const t = setTimeout(() => setShowOnline(false), 3000);
      return () => clearTimeout(t);
    }
  }, [isOffline]);

  if (!isOffline && !showOnline) return null;

  return (
    <div className={[
      'flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold',
      'border-b transition-colors duration-300',
      isOffline
        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-300',
    ].join(' ')}>
      {isOffline
        ? <><WifiOff size={13} /> Offline mode — all core features available</>
        : <><Wifi size={13} /> Back online</>}
    </div>
  );
}
