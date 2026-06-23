import React, { useState } from 'react';
import AppLayout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UploadEmails from './pages/UploadEmails';
import EmailsTable from './pages/EmailsTable';
import PipelineRuns from './pages/PipelineRuns';

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'upload':
        return <UploadEmails />;
      case 'emails':
        return <EmailsTable />;
      case 'runs':
        return <PipelineRuns />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppLayout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderContent()}
    </AppLayout>
  );
}
