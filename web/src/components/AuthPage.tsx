import { useState, type FormEvent } from "react";
import { api } from "../api";
import { Check, Logo, Spark } from "./Icons";
import type { User } from "../types";

type Mode = "login" | "register";

interface Props {
  onAuthenticated: (user: User) => void;
}

const FEATURES = [
  "Kanban com arrastar e soltar para cada etapa do processo",
  "Dashboard com taxa de resposta, funil e atividade semanal",
  "Próximos passos com alerta de follow-up atrasado",
];

export function AuthPage({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user =
        mode === "login"
          ? await api.login(email, password)
          : await api.register(name, email, password);
      onAuthenticated(user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo() {
    setError("");
    setLoading(true);
    try {
      const user = await api.login("demo@devtrack.dev", "devtrack123");
      onAuthenticated(user);
    } catch {
      setError(
        "Conta demo indisponível. Rode `npm run seed` no terminal e tente de novo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-pitch">
        <div className="brand">
          <Logo size={34} />
          <div>
            <strong>DevTrack</strong>
            <span>candidaturas</span>
          </div>
        </div>

        <h1>
          Organize sua busca.
          <br />
          Conquiste a vaga.
        </h1>
        <p className="lead">
          Um quadro visual para acompanhar cada candidatura, entrevista e
          follow-up — sem planilhas perdidas.
        </p>

        <ul className="feature-list">
          {FEATURES.map((feature) => (
            <li key={feature}>
              <Check size={16} />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mini-board" aria-hidden>
          <div className="mini-column">
            <span>Aplicadas</span>
            <div className="mini-card">
              <i className="dot blue" />
              Nubank
            </div>
            <div className="mini-card">
              <i className="dot amber" />
              iFood
            </div>
          </div>
          <div className="mini-column">
            <span>Entrevistas</span>
            <div className="mini-card highlight">
              <i className="dot violet" />
              Hotmart
            </div>
          </div>
          <div className="mini-column">
            <span>Ofertas</span>
            <div className="mini-card">
              <i className="dot green" />
              Loft
            </div>
          </div>
        </div>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              className={mode === "register" ? "active" : ""}
              onClick={() => switchMode("register")}
            >
              Criar conta
            </button>
          </div>

          <h2>{mode === "login" ? "Bem-vindo de volta" : "Comece agora"}</h2>
          <p className="muted">
            {mode === "login"
              ? "Acesse seu quadro e continue de onde parou."
              : "Leva menos de um minuto e é grátis."}
          </p>

          {mode === "register" && (
            <label className="field">
              <span>Nome</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                required
                minLength={2}
              />
            </label>
          )}

          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "register" ? "Mínimo de 8 caracteres" : "Sua senha"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              minLength={mode === "register" ? 8 : 1}
            />
          </label>

          {error && <p className="alert error">{error}</p>}

          <button type="submit" className="btn primary block" disabled={loading}>
            {loading
              ? "Aguarde…"
              : mode === "login"
                ? "Entrar"
                : "Criar minha conta"}
          </button>

          <button
            type="button"
            className="btn ghost block"
            onClick={handleDemo}
            disabled={loading}
          >
            <Spark size={16} />
            Ver demonstração com dados de exemplo
          </button>

          <p className="auth-hint">
            Conta demo: <code>demo@devtrack.dev</code> /{" "}
            <code>devtrack123</code>
          </p>
        </form>
      </section>
    </div>
  );
}
