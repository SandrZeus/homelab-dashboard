import type { Theme } from "../../hooks/useTheme";
import "../../styles/components/theme-toggle.css";

const options: { value: Theme; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  return (
    <div className="theme-toggle">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => setTheme(o.value)}
          className={`theme-toggle-btn ${theme === o.value ? "theme-toggle-btn--active" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
