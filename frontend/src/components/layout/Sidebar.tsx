import { NavLink } from "react-router-dom";
import { useCapabilities } from "../../hooks/useCapabilities";
import { useTheme, type Theme } from "../../hooks/useTheme";
import { useSettings } from "../../hooks/useSettings";
import { logout } from "../../api/client";
import "../../styles/components/layout.css";

interface SidebarProps {
  connected: boolean;
}

export function Sidebar({ connected }: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const { tempUnit, setTempUnit } = useSettings();
  const { data: capabilities } = useCapabilities();

  const handleSignOut = () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span
          className={`sidebar-live-dot ${connected ? "sidebar-live-dot--ok" : "sidebar-live-dot--down"}`}
          title={connected ? "Connected" : "Disconnected"}
        />
        <span>Homelab</span>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Services</div>

        <NavLink to="/" end className="sidebar-link">
          <svg
            className="sidebar-icon"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <rect x="2" y="2" width="5" height="5" rx="1" />
            <rect x="9" y="2" width="5" height="5" rx="1" />
            <rect x="2" y="9" width="5" height="5" rx="1" />
            <rect x="9" y="9" width="5" height="5" rx="1" />
          </svg>
          <span>Dashboard</span>
        </NavLink>

        {capabilities?.servicepatrol && (
          <NavLink to="/servicepatrol" className="sidebar-link">
            <svg
              className="sidebar-icon"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="8" cy="8" r="6" />
              <path d="M8 5v3l2 2" />
            </svg>
            <span>ServicePatrol</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-settings">
        <div className="sidebar-section-label">Settings</div>

        <div className="sidebar-setting-row">
          <span className="sidebar-setting-label">Theme</span>
          <div className="sidebar-seg">
            <ThemeButton
              current={theme}
              value="system"
              onClick={setTheme}
              label="System"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect x="2" y="3" width="12" height="8" rx="1" />
                <path d="M6 13h4M8 11v2" />
              </svg>
            </ThemeButton>
            <ThemeButton
              current={theme}
              value="light"
              onClick={setTheme}
              label="Light"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="8" cy="8" r="3" />
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.5 1.5M11.5 11.5L13 13M3 13l1.5-1.5M11.5 4.5L13 3" />
              </svg>
            </ThemeButton>
            <ThemeButton
              current={theme}
              value="dark"
              onClick={setTheme}
              label="Dark"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M13 9A6 6 0 017 3a5 5 0 106 6z" />
              </svg>
            </ThemeButton>
          </div>
        </div>

        <div className="sidebar-setting-row">
          <span className="sidebar-setting-label">Temp</span>
          <div className="sidebar-seg">
            <button
              className={`sidebar-seg-btn ${tempUnit === "celsius" ? "sidebar-seg-btn--on" : ""}`}
              onClick={() => setTempUnit("celsius")}
            >
              °C
            </button>
            <button
              className={`sidebar-seg-btn ${tempUnit === "fahrenheit" ? "sidebar-seg-btn--on" : ""}`}
              onClick={() => setTempUnit("fahrenheit")}
            >
              °F
            </button>
          </div>
        </div>
      </div>

      <button className="sidebar-signout" onClick={handleSignOut}>
        <svg
          className="sidebar-icon"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M6 2h-3v12h3M10 5l3 3-3 3M13 8h-7" />
        </svg>
        <span>Sign out</span>
      </button>
    </aside>
  );
}

interface ThemeButtonProps {
  current: Theme;
  value: Theme;
  onClick: (t: Theme) => void;
  label: string;
  children: React.ReactNode;
}

function ThemeButton({
  current,
  value,
  onClick,
  label,
  children,
}: ThemeButtonProps) {
  return (
    <button
      className={`sidebar-seg-btn ${current === value ? "sidebar-seg-btn--on" : ""}`}
      onClick={() => onClick(value)}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
