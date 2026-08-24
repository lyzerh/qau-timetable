/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import SchedulePage from './pages/SchedulePage';
import ImportPage from './pages/ImportPage';
import SettingsPage from './pages/SettingsPage';
import DebugPage from './pages/DebugPage';
import { initSettings } from './storage/db';

export default function App() {
  useEffect(() => {
    initSettings();
  }, []);

  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SchedulePage />} />
          <Route path="import" element={<ImportPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="debug/parser" element={<DebugPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
