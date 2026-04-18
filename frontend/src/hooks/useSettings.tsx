import { createContext, useContext, useState, type ReactNode } from "react";

export type TempUnit = "celsius" | "fahrenheit";

interface SettingsContextValue {
  tempUnit: TempUnit;
  setTempUnit: (unit: TempUnit) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [tempUnit, setTempUnitState] = useState<TempUnit>(() => {
    return (localStorage.getItem("tempUnit") as TempUnit) || "celsius";
  });

  const setTempUnit = (unit: TempUnit) => {
    setTempUnitState(unit);
    localStorage.setItem("tempUnit", unit);
  };

  return (
    <SettingsContext.Provider value={{ tempUnit, setTempUnit }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
