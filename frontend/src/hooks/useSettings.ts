import { useState } from "react";

export type TempUnit = "celsius" | "fahrenheit";

export function useSettings() {
  const [tempUnit, setTempUnitState] = useState<TempUnit>(() => {
    return (localStorage.getItem("tempUnit") as TempUnit) || "celsius";
  });

  function setTempUnit(unit: TempUnit) {
    setTempUnitState(unit);
    localStorage.setItem("tempUnit", unit);
  }

  return { tempUnit, setTempUnit };
}
