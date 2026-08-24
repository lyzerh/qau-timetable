import React, { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PwaUpdater() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {offlineReady && (
        <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-5">
          <span className="text-sm">应用已就绪，可离线使用</span>
          <button onClick={close} className="text-slate-300 hover:text-white">✕</button>
        </div>
      )}
      {needRefresh && (
        <div className="bg-[#2D5A27] text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-5">
          <span className="text-sm font-medium">发现新版本</span>
          <div className="flex gap-2">
            <button onClick={() => updateServiceWorker(true)} className="px-3 py-1 bg-white text-[#2D5A27] text-xs font-bold rounded">
              立即更新
            </button>
            <button onClick={close} className="text-white/80 hover:text-white px-2">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
