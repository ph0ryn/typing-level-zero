import { BarChart3, Clock3, Moon, Sun, Keyboard, LayoutDashboard } from "lucide-react";
import { NavLink, Outlet, Link, useLocation } from "react-router-dom";

import { useRecords } from "./shared/storage/recordsContext.tsx";
import { StorageErrorPanel } from "./shared/ui/components.tsx";
import { useTheme } from "./shared/ui/themeContext.tsx";

const navigation = [
  { icon: LayoutDashboard, label: "プレイ", to: "/" },
  { icon: BarChart3, label: "分析", to: "/analysis" },
  { icon: Keyboard, label: "キー分析", to: "/keys" },
  { icon: Clock3, label: "履歴", to: "/history" },
];

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
          {navigation.slice(0, 3).map(({ to }) => (
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
        {!isPlayPage ? (
          <aside className="side-navigation" aria-label="ページナビゲーション">
            {navigation.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                aria-label={label}
                className={({ isActive }) =>
                  isActive ? "side-navigation-link active" : "side-navigation-link"
                }
                end={to === "/"}
                to={to}
              >
                <Icon size={21} strokeWidth={1.7} />
                <span>{label}</span>
              </NavLink>
            ))}
          </aside>
        ) : null}
        <main className="main-content">
          <StorageErrorPanel error={error} onRetry={() => void reload()} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
