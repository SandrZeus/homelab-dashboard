import { useNavigate } from "react-router-dom";
import { logout } from "../../api/client";
import type { Theme } from "../../hooks/useTheme";
import type { TempUnit } from "../../hooks/useSettings";
import "../../styles/components/settings.css";

interface Props {
  onClose: () => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  tempUnit: TempUnit;
  setTempUnit: (u: TempUnit) => void;
}

const themes: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const tempUnits: { value: TempUnit; label: string }[] = [
  { value: "celsius", label: "°C" },
  { value: "fahrenheit", label: "°F" },
];

export function SettingsModal({
  onClose,
  theme,
  setTheme,
  tempUnit,
  setTempUnit,
}: Props) {
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2 className="settings-title">Settings</h2>
          <button className="settings-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="settings-section">
          <p className="settings-section-label">Appearance</p>
          <div className="settings-options">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`settings-option ${theme === t.value ? "settings-option--active" : ""}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-section">
          <p className="settings-section-label">Temperature Unit</p>
          <div className="settings-options">
            {tempUnits.map((u) => (
              <button
                key={u.value}
                onClick={() => setTempUnit(u.value)}
                className={`settings-option ${tempUnit === u.value ? "settings-option--active" : ""}`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div className="settings-divider" />

        <button className="settings-logout" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
