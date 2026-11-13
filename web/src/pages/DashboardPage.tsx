import { useEffect, useState } from "react";
import { api } from "../api";
import { Alert, Calendar, Chart, Check, Spark } from "../components/Icons";
import { formatDate, formatWeek, nextStepLabel } from "../format";
import {
  SOURCE_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  type NextStep,
  type Stats,
} from "../types";

interface Props {
  userName: string;
  onGoToBoard: () => void;
}

function insightFor(stats: Stats): string {
  if (stats.overdue.length > 0) {
    return `Você tem ${stats.overdue.length} follow-up${stats.overdue.length > 1 ? "s" : ""} atrasado${stats.overdue.length > 1 ? "s" : ""}. Responder rápido costuma ser o que mais move um processo.`;
  }
  if (stats.offers > 0) {
    return `Você já tem ${stats.offers} oferta${stats.offers > 1 ? "s" : ""} na mesa. Negocie com calma e compare os próximos passos.`;
  }
  if (stats.responseRate >= 30) {
    return `Sua taxa de resposta é de ${stats.responseRate}% — acima da média em buscas ativas. Continue mantendo o funil cheio.`;
  }
  return `Sua taxa de resposta está em ${stats.responseRate}%. Personalizar a candidatura para cada vaga costuma aumentar bastante esse número.`;
}

function StepList({
  items,
  late,
}: {
  items: NextStep[];
  late?: boolean;
}) {
  return (
    <ul className="step-list">
      {items.map((item) => (
        <li key={item.id} className={late ? "late" : ""}>
          <span className="date-badge">{formatDate(item.nextStepAt)}</span>
          <div>
            <strong>{item.company}</strong>
            <span className="muted small">{item.role}</span>
            {item.nextStepNote && (
              <span className="step-note">{item.nextStepNote}</span>
            )}
          </div>
          <span className={`step-when${late ? " late" : ""}`}>
            {late && <Alert size={13} />}
            {item.nextStepAt ? nextStepLabel(item.nextStepAt) : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DashboardPage({ userName, onGoToBoard }: Props) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api
      .stats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Não foi possível carregar as estatísticas.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <div className="board-state">Calculando suas métricas…</div>;
  }

  if (!stats) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <h1>Visão geral</h1>
          </div>
        </header>
        <p className="alert error" role="alert">
          <Alert size={16} />
          {error || "Não foi possível carregar as estatísticas."}
        </p>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className="page">
        <header className="page-header">
          <div>
            <h1>Visão geral</h1>
            <p className="muted">Olá, {userName}. Vamos começar?</p>
          </div>
        </header>
        <div className="empty-state">
          <div className="empty-icon">
            <Chart size={26} />
          </div>
          <h2>Ainda não há dados para analisar</h2>
          <p className="muted">
            Cadastre sua primeira candidatura e o dashboard passa a mostrar
            funil, taxa de resposta e próximos passos.
          </p>
          <button type="button" className="btn primary" onClick={onGoToBoard}>
            Ir para o quadro
          </button>
        </div>
      </div>
    );
  }

  const maxFunnel = Math.max(
    1,
    ...STATUS_ORDER.map((status) => stats.byStatus[status]),
  );
  const maxWeekly = Math.max(1, ...stats.weekly.map((week) => week.count));
  const maxSource = Math.max(1, ...stats.topSources.map((item) => item.count));
  const totalSteps = stats.overdue.length + stats.upcoming.length;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Visão geral</h1>
          <p className="muted">
            Olá, {userName}. Este é o retrato da sua busca por vagas.
          </p>
        </div>
      </header>

      <div className="kpi-grid">
        <article className="kpi">
          <span className="kpi-label">Total</span>
          <strong className="kpi-value">{stats.total}</strong>
          <span className="kpi-hint">candidaturas registradas</span>
        </article>
        <article className="kpi">
          <span className="kpi-label">Em andamento</span>
          <strong className="kpi-value">{stats.active}</strong>
          <span className="kpi-hint">aguardando retorno</span>
        </article>
        <article className="kpi">
          <span className="kpi-label">Entrevistas</span>
          <strong className="kpi-value">{stats.interviews}</strong>
          <span className="kpi-hint">processos ativos</span>
        </article>
        <article className="kpi">
          <span className="kpi-label">Ofertas</span>
          <strong className="kpi-value accent">{stats.offers}</strong>
          <span className="kpi-hint">propostas recebidas</span>
        </article>
        <article className="kpi">
          <span className="kpi-label">Taxa de resposta</span>
          <strong className="kpi-value">{stats.responseRate}%</strong>
          <span className="kpi-hint">respostas / candidaturas enviadas</span>
        </article>
      </div>

      <p className="insight">
        <Spark size={18} />
        {insightFor(stats)}
      </p>

      <div className="dash-grid">
        <section className="panel">
          <header className="panel-header">
            <h2>Funil de candidaturas</h2>
            <span className="muted small">por etapa atual</span>
          </header>

          <div className="funnel">
            {STATUS_ORDER.map((status) => {
              const count = stats.byStatus[status];
              return (
                <div className="funnel-row" key={status}>
                  <span className="funnel-label">{STATUS_LABELS[status]}</span>
                  <div className="funnel-track">
                    <div
                      className={`funnel-bar status-${status}`}
                      style={{ width: `${(count / maxFunnel) * 100}%` }}
                    />
                  </div>
                  <span className="funnel-count">{count}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="panel">
          <header className="panel-header">
            <h2>Atividade recente</h2>
            <span className="muted small">últimas 8 semanas</span>
          </header>

          <div className="weekly">
            {stats.weekly.map((week) => (
              <div className="week" key={week.weekStart}>
                <div className="week-track">
                  <div
                    className="week-bar"
                    style={{ height: `${(week.count / maxWeekly) * 100}%` }}
                    title={`${week.count} candidatura(s)`}
                  />
                </div>
                <span className="week-label">{formatWeek(week.weekStart)}</span>
                <span className="week-count">{week.count}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <header className="panel-header">
            <h2>Próximos passos</h2>
            <span className="muted small">{totalSteps} agendados</span>
          </header>

          {totalSteps === 0 ? (
            <p className="panel-empty">
              <Calendar size={16} />
              Nenhum próximo passo agendado. Defina datas de follow-up nos seus
              cards para não perder o timing.
            </p>
          ) : (
            <div className="steps">
              {stats.overdue.length > 0 && (
                <div className="step-group">
                  <h3 className="step-title late">
                    <Alert size={14} />
                    Atrasados
                  </h3>
                  <StepList items={stats.overdue} late />
                </div>
              )}
              {stats.upcoming.length > 0 && (
                <div className="step-group">
                  <h3 className="step-title">A seguir</h3>
                  <StepList items={stats.upcoming} />
                </div>
              )}
            </div>
          )}
        </section>

        <section className="panel">
          <header className="panel-header">
            <h2>Onde as vagas aparecem</h2>
            <span className="muted small">por fonte</span>
          </header>

          <ul className="source-list">
            {stats.topSources.map((item) => (
              <li key={item.source}>
                <div className="source-row">
                  <span>{SOURCE_LABELS[item.source]}</span>
                  <span className="muted small">{item.count}</span>
                </div>
                <div className="source-track">
                  <div
                    className="source-bar"
                    style={{ width: `${(item.count / maxSource) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          {stats.topSources.length === 0 && (
            <p className="panel-empty">
              <Check size={16} />
              Registre a fonte ao criar as candidaturas para descobrir de onde
              vêm as melhores oportunidades.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
