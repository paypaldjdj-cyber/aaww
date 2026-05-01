import { createContext, useContext, useState, useEffect } from "react";
import { getSettings } from "./api";

export const SettingsContext = createContext();

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});

  const refreshSettings = () => {
    getSettings().then(setSettings).catch(console.error);
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
