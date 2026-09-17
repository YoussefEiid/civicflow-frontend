import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiClient';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  setMaintenanceMode: (val: boolean) => void;
  checkMaintenanceStatus: () => Promise<boolean>;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isMaintenanceMode: false,
  setMaintenanceMode: () => {},
  checkMaintenanceStatus: async () => false
});

export const useMaintenance = () => useContext(MaintenanceContext);

interface MaintenanceProviderProps {
  children: React.ReactNode;
}

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({ children }) => {
  // Check build-time or runtime environment variable
  const rawEnvMaintenance = (import.meta as any).env?.VITE_MAINTENANCE_MODE;
  const isEnvMaintenance =
    rawEnvMaintenance === true ||
    rawEnvMaintenance === 'true' ||
    rawEnvMaintenance === '1' ||
    rawEnvMaintenance === 'yes';

  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(Boolean(isEnvMaintenance));

  const checkMaintenanceStatus = useCallback(async (): Promise<boolean> => {
    // If build-time variable is explicitly enabled, maintain true
    if (isEnvMaintenance) {
      setIsMaintenanceMode(true);
      return true;
    }

    try {
      // Direct query to maintenance status endpoint
      const res = await apiClient.get<{ maintenance: boolean }>('/maintenance/status', {
        skipAuth: true
      });
      const inMaintenance = Boolean(res?.maintenance);
      setIsMaintenanceMode(inMaintenance);
      return inMaintenance;
    } catch (err: any) {
      // If HTTP 503 was returned, backend is in maintenance mode
      if (err?.statusCode === 503 || err?.code === 'MAINTENANCE_MODE') {
        setIsMaintenanceMode(true);
        return true;
      }
      return false;
    }
  }, [isEnvMaintenance]);

  // Initial check on mount
  useEffect(() => {
    checkMaintenanceStatus();

    // Listen to global 503 / maintenance trigger from apiClient
    const handleMaintenanceEvent = () => {
      setIsMaintenanceMode(true);
    };

    window.addEventListener('civicflow_maintenance_mode', handleMaintenanceEvent);
    return () => {
      window.removeEventListener('civicflow_maintenance_mode', handleMaintenanceEvent);
    };
  }, [checkMaintenanceStatus]);

  return (
    <MaintenanceContext.Provider
      value={{
        isMaintenanceMode,
        setMaintenanceMode: setIsMaintenanceMode,
        checkMaintenanceStatus
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};
