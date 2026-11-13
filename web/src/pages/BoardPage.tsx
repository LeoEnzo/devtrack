import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { ApplicationModal } from "../components/ApplicationModal";
import {
  Alert,
  Calendar,
  ExternalLink,
  Pencil,
  Pin,
  Plus,
  Search,
  Trash,
} from "../components/Icons";
import { daysFromToday, formatDate, nextStepLabel, timeAgo } from "../format";
import {
  SOURCE_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  WORK_MODE_LABELS,
  type Application,
  type Status,
} from "../types";

export function BoardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Application | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<Status | null>(null);

  useEffect(() => {
    let active = true;

    api
      .listApplications()
      .then((list) => {
        if (active) setApplications(list);
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Não foi possível carregar as candidaturas.",
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return applications;

    return applications.filter((application) =>
      [application.company, application.role, application.location, application.notes]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [applications, search]);

  const summary = useMemo(() => {
    const byStatus = Object.fromEntries(
      STATUS_ORDER.map((status) => [status, 0]),
    ) as Record<Status, number>;

    for (const application of applications) {
      byStatus[application.status] += 1;
    }

    return {
      total: applications.length,
      active: byStatus.applied + byStatus.screening + byStatus.interview,
      interviews: byStatus.interview,
      offers: byStatus.offer,
    };
  }, [applications]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(application: Application) {
    setEditing(application);
    setModalOpen(true);
  }

  function handleSaved(saved: Application) {
    setApplications((list) => {
      const exists = list.some((item) => item.id === saved.id);
      return exists
        ? list.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...list];
    });
    setModalOpen(false);
    setEditing(null);
  }

  async function move(application: Application, status: Status) {
    if (application.status === status) return;

    const previous = applications;
    setApplications((list) =>
      list.map((item) =>
        item.id === application.id ? { ...item, status } : item,
      ),
    );
    setError("");

    try {
      const updated = await api.updateApplication(application.id, { status });
      setApplications((list) =>
        list.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (caught) {
      setApplications(previous);
      setError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível mover a candidatura.",
      );
    }
  }

  async function remove(application: Application) {
    const confirmed = window.confirm(
      `Remover a candidatura de ${application.company}? Essa ação não pode ser desfeita.`,
    );
    if (!confirmed) return;

    try {
      await api.deleteApplication(application.id);
      setApplications((list) => list.filter((item) => item.id !== application.id));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Não foi possível remover.",
      );
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Candidaturas</h1>
          <p className="muted">
            Arraste os cards para atualizar a etapa de cada processo.
          </p>
        </div>

        <div className="page-actions">
          <div className="search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar empresa, cargo…"
              aria-label="Buscar candidaturas"
            />
          </div>
          <button type="button" className="btn primary" onClick={openNew}>
            <Plus size={16} />
            Nova candidatura
          </button>
        </div>
      </header>

      {applications.length > 0 && (
        <div className="summary-bar">
          <span>
            <strong>{summary.total}</strong> candidaturas
          </span>
          <span className="sep" />
          <span>
            <strong>{summary.active}</strong> em andamento
          </span>
          <span className="sep" />
          <span>
            <strong>{summary.interviews}</strong> entrevistas
          </span>
          <span className="sep" />
          <span>
            <strong>{summary.offers}</strong> ofertas
          </span>
        </div>
      )}

      {error && (
        <p className="alert error" role="alert">
          <Alert size={16} />
          {error}
        </p>
      )}

      {loading ? (
        <div className="board-state">Carregando candidaturas…</div>
      ) : applications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <Plus size={26} />
          </div>
          <h2>Seu quadro está pronto</h2>
          <p className="muted">
            Cadastre a primeira vaga para acompanhar prazos, entrevistas e
            follow-ups em um só lugar.
          </p>
          <button type="button" className="btn primary" onClick={openNew}>
            <Plus size={16} />
            Adicionar candidatura
          </button>
        </div>
      ) : (
        <>
          {search.trim() !== "" && filtered.length === 0 && (
            <p className="board-state">
              Nenhuma candidatura encontrada para “{search.trim()}”.
            </p>
          )}

          <div className="board-scroll">
            <div className="board">
              {STATUS_ORDER.map((status) => {
                const items = filtered.filter(
                  (application) => application.status === status,
                );

                return (
                  <section
                    key={status}
                    className={`column${dragOverStatus === status ? " drag-over" : ""}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = "move";
                      setDragOverStatus(status);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragOverStatus(null);
                      setDraggingId(null);
                      const id =
                        event.dataTransfer.getData("text/plain") || draggingId;
                      const application = applications.find(
                        (item) => item.id === id,
                      );
                      if (application) void move(application, status);
                    }}
                  >
                    <header className="column-header">
                      <span className={`status-dot status-${status}`} />
                      <h2>{STATUS_LABELS[status]}</h2>
                      <span className="count">{items.length}</span>
                    </header>

                    <div className="column-body">
                      {items.map((application) => {
                        const overdue =
                          application.nextStepAt !== null &&
                          daysFromToday(application.nextStepAt) < 0 &&
                          application.status !== "rejected" &&
                          application.status !== "offer";

                        return (
                          <article
                            key={application.id}
                            className={`card${draggingId === application.id ? " dragging" : ""}`}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData(
                                "text/plain",
                                application.id,
                              );
                              event.dataTransfer.effectAllowed = "move";
                              setDraggingId(application.id);
                            }}
                            onDragEnd={() => {
                              setDraggingId(null);
                              setDragOverStatus(null);
                            }}
                          >
                            <div className="card-top">
                              <span
                                className={`priority priority-${application.priority}`}
                                title={`Prioridade ${application.priority}`}
                              />
                              <div className="card-titles">
                                <h3>{application.company}</h3>
                                <p>{application.role}</p>
                              </div>
                              <div className="card-actions">
                                {application.url && (
                                  <a
                                    className="icon-btn"
                                    href={application.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="Abrir vaga"
                                    aria-label="Abrir vaga"
                                  >
                                    <ExternalLink size={15} />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => openEdit(application)}
                                  title="Editar"
                                  aria-label="Editar candidatura"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn danger"
                                  onClick={() => void remove(application)}
                                  title="Remover"
                                  aria-label="Remover candidatura"
                                >
                                  <Trash size={15} />
                                </button>
                              </div>
                            </div>

                            <div className="card-meta">
                              <span>{WORK_MODE_LABELS[application.workMode]}</span>
                              {application.location && (
                                <span>
                                  <Pin size={13} />
                                  {application.location}
                                </span>
                              )}
                              {application.salary && (
                                <span className="salary">{application.salary}</span>
                              )}
                            </div>

                            {application.nextStepAt && (
                              <div
                                className={`next-step${overdue ? " late" : ""}`}
                              >
                                {overdue ? (
                                  <Alert size={13} />
                                ) : (
                                  <Calendar size={13} />
                                )}
                                <span>
                                  {formatDate(application.nextStepAt)} ·{" "}
                                  {nextStepLabel(application.nextStepAt)}
                                </span>
                              </div>
                            )}

                            {application.nextStepNote && (
                              <p
                                className="next-note"
                                title={application.nextStepNote}
                              >
                                {application.nextStepNote}
                              </p>
                            )}

                            <footer className="card-footer">
                              <span className="source">
                                {SOURCE_LABELS[application.source]}
                              </span>
                              <span className="ago">
                                {timeAgo(application.appliedAt)}
                              </span>
                            </footer>
                          </article>
                        );
                      })}

                      {items.length === 0 && (
                        <p className="column-empty">Solte um card aqui</p>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </>
      )}

      {modalOpen && (
        <ApplicationModal
          application={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
