import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { FinanceManagerApp } from './components/FinanceManagerApp';
import { DocumentsPage } from './components/DocumentsPage';
import { VoiceDiaryPage } from './components/VoiceDiaryPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/finance" element={<FinanceManagerApp />} />
      <Route path="/documents" element={<DocumentsPage />} />
      <Route path="/voice-diary" element={<VoiceDiaryPage />} />
    </Routes>
  );
}

export default App;