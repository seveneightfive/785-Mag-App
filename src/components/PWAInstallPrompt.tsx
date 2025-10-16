import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('pwa-install-dismissed') === 'true';
  });

  useEffect(() => {
    if (isDismissed) {
      const dismissTime = localStorage.getItem('pwa-install-dismiss-time');
      if (dismissTime) {
        const daysSinceDismiss = (Date.now() - parseInt(dismissTime)) / (1000 * 60 * 60 * 24);
        if (daysSinceDismiss > 7) {
          setIsDismissed(false);
          localStorage.removeItem('pwa-install-dismissed');
          localStorage.removeItem('pwa-install-dismiss-time');
        }
      }
    }
  }, [isDismissed]);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-dismiss-time', Date.now().toString());
  };

  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 bg-gradient-to-r from-[#FFCE03] to-[#FFA500] rounded-2xl shadow-2xl p-6 z-50 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-black/60 hover:text-black transition-colors"
        aria-label="Dismiss"
      >
        <X size={20} />
      </button>

      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
          <img
            src="/icon-192.png"
            alt="785mag"
            className="w-12 h-12 rounded-lg"
          />
        </div>

        <div className="flex-1 pt-1">
          <h3 className="text-lg font-bold text-black mb-1">
            Install 785mag
          </h3>
          <p className="text-sm text-black/80 mb-4">
            Get instant access to events, artists, and venues. Works offline!
          </p>

          <button
            onClick={handleInstall}
            className="w-full bg-black text-[#FFCE03] px-6 py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-gray-900 transition-all transform hover:scale-105 shadow-lg"
          >
            <Download size={18} />
            <span>Install App</span>
          </button>
        </div>
      </div>
    </div>
  );
};
