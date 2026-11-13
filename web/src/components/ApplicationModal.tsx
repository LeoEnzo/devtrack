import { useEffect, useState, type FormEvent } from "react";
import { ApiError, api, type ApplicationPayload } from "../api";
import { todayIso } from "../format";
import {
  PRIORITY_LABELS,
  SOURCE_LABELS,
  STATUS_ORDER,
  STATUS_SHORT,
  WORK_MODE_LABELS,
  type Application,
  type Priority,
  type Source,
  type Status,
  type WorkMode,
} from "../types";
import { X } from "./Icons";

interface Props {
  application: Application | null;
  onClose: () => void;
  onSaved: (application: Application) => void;
}

const STATUS_OPTIONS = STATUS_ORDER.map((status) => ({
  value: status,
  label: STATUS_SHORT[status],
}));

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = (
  ["low", "medium", "high"] as Priority[]
).map((value) => ({ value, label: PRIORITY_LABELS[value] }));

const WORK_MODE_OPTIONS: { value: WorkMode; label: string }[] = (
  ["remote", "hybrid", "onsite"] as WorkMode[]
).map((value) => ({ value, label: WORK_MODE_LABELS[value] }));

const SOURCE_OPTIONS: { value: Source; label: string }[] = (
  ["linkedin", "gupy", "indeed", "referral", "company", "other"] as Source[]
).map((value) => ({ value, label: SOURCE_LABELS[value] }));

function initialValues(application: Application | null): ApplicationPayload {
  if (application) {
    return {
      company: application.company,
      role: application.role,
      location: application.location,
      workMode: application.workMode,
      source: application.source,
      status: application.status,
      priority: application.priority,
      salary: application.salary,
      url: application.url,
      notes: application.notes,
      appliedAt: application.appliedAt,
      nextStepAt: application.nextStepAt,
      nextStepNote: application.nextStepNote,
    };
  }

  return {
    company: "",
    role: "",
    location: "",
    workMode: "remote",
    source: "linkedin",
    status: "applied",
    priority: "medium",
    salary: "",
    url: "",
    notes: "",
    appliedAt: todayIso(),
    nextStepAt: null,
    nextStepNote: "",
  };
}

export function ApplicationModal({ application, onClose, onSaved }: Props) {
  const [values, setValues] = useState<ApplicationPayload>(() =>
    initialValues(application),
  );
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function set<K extends keyof ApplicationPayload>(
    key: K,
    value: ApplicationPayload[K],
  ) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    if (!values.company.trim() || !values.role.trim()) {
      setError("Preencha empresa e cargo para salvar.");
      return;
    }

    setSaving(true);
    try {
      const payload: ApplicationPayload = {
        ...values,
        company: values.company.trim(),
        role: values.role.trim(),
        nextStepAt: values.nextStepAt || null,
      };
      const saved = application
        ? await api.updateApplication(application.id, payload)
        : await api.createApplication(payload);
      onSaved(saved);
    } catch (caught) {
      if (caught instanceof ApiError && Array.isArray(caught.details)) {
        const mapped: Record<string, string> = {};
        for (const detail of caught.details as {
          field?: string;
          message?: string;
        }[]) {
          if (detail.field && detail.message) mapped[detail.field] = detail.message;
        }
        setFieldErrors(mapped);
        if (Object.keys(mapped).length > 0) {
          setError("Revise os campos destacados.");
        } else {
          setError(caught.message);
        }
      } else {
        setError(caught instanceof Error ? caught.message : "Erro ao salvar.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">
              {application ? "Editar candidatura" : "Nova candidatura"}
            </h2>
            <p className="muted">
              {application
                ? "Atualize os dados ou mova a etapa do processo."
                : "Registre a vaga para não perder o prazo de follow-up."}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        <form className="modal-body" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Empresa *</span>
              <input
                value={values.company}
                onChange={(event) => set("company", event.target.value)}
                placeholder="Ex.: Nubank"
                autoFocus
                required
              />
              {fieldErrors.company && (
                <em className="field-error">{fieldErrors.company}</em>
              )}
            </label>

            <label className="field">
              <span>Cargo *</span>
              <input
                value={values.role}
                onChange={(event) => set("role", event.target.value)}
                placeholder="Ex.: Dev Front-end Jr"
                required
              />
              {fieldErrors.role && (
                <em className="field-error">{fieldErrors.role}</em>
              )}
            </label>

            <label className="field">
              <span>Etapa</span>
              <select
                value={values.status}
                onChange={(event) => set("status", event.target.value as Status)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Prioridade</span>
              <select
                value={values.priority}
                onChange={(event) =>
                  set("priority", event.target.value as Priority)
                }
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Modelo</span>
              <select
                value={values.workMode}
                onChange={(event) =>
                  set("workMode", event.target.value as WorkMode)
                }
              >
                {WORK_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Fonte</span>
              <select
                value={values.source}
                onChange={(event) => set("source", event.target.value as Source)}
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Local</span>
              <input
                value={values.location}
                onChange={(event) => set("location", event.target.value)}
                placeholder="Remoto, São Paulo…"
              />
            </label>

            <label className="field">
              <span>Faixa salarial</span>
              <input
                value={values.salary}
                onChange={(event) => set("salary", event.target.value)}
                placeholder="R$ 5.000 – R$ 7.000"
              />
            </label>

            <label className="field">
              <span>Data da candidatura</span>
              <input
                type="date"
                value={values.appliedAt}
                onChange={(event) => set("appliedAt", event.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Próximo passo em</span>
              <input
                type="date"
                value={values.nextStepAt ?? ""}
                onChange={(event) =>
                  set("nextStepAt", event.target.value || null)
                }
              />
            </label>

            <label className="field span-2">
              <span>Qual é o próximo passo</span>
              <input
                value={values.nextStepNote}
                onChange={(event) => set("nextStepNote", event.target.value)}
                placeholder="Ex.: Enviar teste técnico até sexta"
              />
            </label>

            <label className="field span-2">
              <span>Link da vaga</span>
              <input
                type="url"
                value={values.url}
                onChange={(event) => set("url", event.target.value)}
                placeholder="https://…"
              />
              {fieldErrors.url && (
                <em className="field-error">{fieldErrors.url}</em>
              )}
            </label>

            <label className="field span-2">
              <span>Anotações</span>
              <textarea
                rows={3}
                value={values.notes}
                onChange={(event) => set("notes", event.target.value)}
                placeholder="Contato do recrutador, detalhes da vaga, feedback…"
              />
            </label>
          </div>

          {error && <p className="alert error">{error}</p>}

          <footer className="modal-footer">
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Salvando…" : application ? "Salvar alterações" : "Adicionar ao quadro"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
