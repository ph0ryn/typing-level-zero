import { Moon, Sun } from "lucide-react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";

import { useRecords } from "./shared/storage/recordsContext.tsx";
import { StorageErrorPanel } from "./shared/ui/components.tsx";
import { useTheme } from "./shared/ui/themeContext.tsx";

const navigation = [{ to: "/" }, { to: "/analysis" }, { to: "/keys" }, { to: "/history" }];

export function AppLayout() {
  const { error, reload } = useRecords();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const isPlayPage = location.pathname === "/" || location.pathname === "";
  const ThemeIcon = theme === "light" ? Moon : Sun;

  return (
    <div className={`app-shell app-shell-${isPlayPage ? "play" : "dashboard"}`}>
      <header className="topbar">
        <Link className="brand" to="/">
          Typing Level Zero
        </Link>
        <nav className="top-navigation" aria-label="メインナビゲーション">
          {navigation.map(({ to }) => (
            <NavLink
              key={to}
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              end={to === "/"}
              to={to}
            >
              {to === "/" ? "/" : to}
            </NavLink>
          ))}
        </nav>
        <button
          aria-label={theme === "light" ? "ダークテーマに切り替える" : "ライトテーマに切り替える"}
          className="icon-button"
          type="button"
          onClick={toggleTheme}
        >
          <ThemeIcon size={20} strokeWidth={1.8} />
        </button>
      </header>

      <div className="app-body">
        <main className="main-content">
          <StorageErrorPanel error={error} onRetry={() => void reload()} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
