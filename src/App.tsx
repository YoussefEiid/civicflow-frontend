import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { ToastProvider } from './context/ToastContext';
import { MaintenanceProvider } from './context/MaintenanceContext';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/common/ErrorBoundary';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <MaintenanceProvider>
          <ToastProvider>
            <AuthProvider>
              <DataProvider>
                <AppRoutes />
              </DataProvider>
            </AuthProvider>
          </ToastProvider>
        </MaintenanceProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;
