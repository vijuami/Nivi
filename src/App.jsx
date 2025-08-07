import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { HomePage } from './components/HomePage';
import { FinanceManagerApp } from './components/FinanceManagerApp';
import { DocumentsPage } from './components/DocumentsPage';
import { VoiceDiaryPage } from './components/VoiceDiaryPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/finance" element={
          <AuthGuard>
            <FinanceManagerApp />
          </AuthGuard>
        } />
        <Route path="/documents" element={
          <AuthGuard>
            <DocumentsPage />
          </AuthGuard>
        } />
        <Route path="/voice-diary" element={
          <AuthGuard>
            <VoiceDiaryPage />
          </AuthGuard>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;