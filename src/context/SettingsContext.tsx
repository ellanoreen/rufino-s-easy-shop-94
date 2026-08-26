import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface SettingsContextType {
  installationFee: number;
  updateInstallationFee: (fee: number) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [installationFee, setInstallationFee] = useState<number>(0);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.installation_fee !== undefined) {
          setInstallationFee(Number(data.installation_fee));
        }
      })
      .catch(err => console.error('Failed to fetch settings:', err));
  }, []);

  const updateInstallationFee = useCallback(async (fee: number) => {
    try {
      await fetch('/api/settings/installation_fee', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: fee }),
      });
      setInstallationFee(fee);
    } catch (err) {
      console.error('Failed to update installation fee:', err);
    }
  }, []);

  return (
    <SettingsContext.Provider value={{ installationFee, updateInstallationFee }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
