import { useEffect, useState } from "react";
import { api, readToken } from "./api";
import { AuthPage } from "./components/AuthPage";
import { Board as BoardIcon, Chart, Logo, LogOut } from "./components/Icons";
import { initials } from "./format";
import { BoardPage } from "./pages/BoardPage";
import { DashboardPage } from "./pages/DashboardPage";
import type { User } from "./types";

type Tab = "board" | "dashboard";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [tab, setTab] = useState<Tab>("board");

  useEffect(() => {
    if (!readToken()) {
      setBooting(false);
      return;
    }

    api
      .me()
      .then(setUser)
      .catch(() => api.logout())
      .finally(() => setBooting(false));
  }, []);

  function logout() {
    api.logout();
    setUser(null);
    setTab("board");
  }

  if (booting) {
    return (
      <div className="boot">
        <Logo size={44} />
        <p>Carregando DevTrack…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthenticated={setUser} />;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Logo />
          <div>
            <strong>DevTrack</strong>
            <span>candidaturas</span>
          </div>
        </div>

        <nav className="nav" aria-label="Navegação principal">
          <button
            type="button"
            className={tab === "board" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("board")}
          >
            <BoardIcon size={18} />
            Quadro
          </button>
          <button
            type="button"
            className={tab === "dashboard" ? "nav-item active" : "nav-item"}
            onClick={() => setTab("dashboard")}
          >
            <Chart size={18} />
            Visão geral
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{initials(user.name)}</span>
            <div className="user-info">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          <button type="button" className="btn ghost small" onClick={logout}>
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <main className="content">
        {tab === "board" ? (
          <BoardPage />
        ) : (
          <DashboardPage
            userName={user.name.split(" ")[0] ?? user.name}
            onGoToBoard={() => setTab("board")}
          />
        )}
      </main>
    </div>
  );
}
