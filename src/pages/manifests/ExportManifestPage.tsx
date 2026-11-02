import React from 'react';
import { useApp } from '../../context/AppContext';
import { EgmFilingModule } from '../../egm-filing';

export const ExportManifestPage: React.FC = () => {
  const { egmFilings, setEgmFilings, showToast, currentUser } = useApp();

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <EgmFilingModule
        initialFilings={egmFilings}
        currentUser={currentUser ? { name: currentUser.name, title: currentUser.role } : undefined}
        onFilingsChange={updated => setEgmFilings(updated)}
        onToast={(type, title, desc) => showToast(type, title, desc)}
      />
    </div>
  );
};
