import { useState } from 'react';
import { assetsApi, incidentsApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import AiSuggestionPanel from '../components/AiSuggestionPanel';
import DataTable from '../components/DataTable';
import ErrorState from '../components/ErrorState';
import EvidencePanel from '../components/EvidencePanel';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import ShortId from '../components/ShortId';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
import { normalizeApiError } from '../utils/errors';
import { assetLabel, incidentLabel } from '../utils/display';
import { asArray, formatDate } from '../utils/format';
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES } from '../utils/enums';

const emptyIncidentForm = { assetId: '', title: '', description: '', severity: 'HIGH', status: 'OPEN' };

function validateIncident(form, assets) {
  if (!form.assetId) return 'Selecciona un activo real.';
  if (!assets.some((asset) => asset.id === form.assetId)) return 'El activo seleccionado no existe o no termino de cargar.';
  if (!form.title.trim()) return 'Ingresa un titulo.';
  if (!form.description.trim()) return 'Ingresa una descripcion.';
  if (!INCIDENT_SEVERITIES.includes(form.severity)) return 'Selecciona una severidad valida.';
  if (form.status && !INCIDENT_STATUSES.includes(form.status)) return 'Selecciona un estado valido.';
  return '';
}

function buildIncidentPayload(form, includeStatus = false) {
  const payload = {
    assetId: form.assetId,
    title: form.title.trim(),
    description: form.description.trim(),
    severity: form.severity,
  };
  if (includeStatus && form.status) payload.status = form.status;
  return payload;
}

function incidentToForm(incident) {
  return {
    assetId: incident.assetId || '',
    title: incident.title || '',
    description: incident.description || '',
    severity: incident.severity || 'HIGH',
    status: incident.status || 'OPEN',
  };
}

export default function IncidentsPage() {
  const incidents = useAsync(() => incidentsApi.list(), []);
  const assets = useAsync(() => assetsApi.list(), []);
  const { can } = useRoles();
  const canCreate = can(PERMISSIONS.incidentsCreate);
  const canManage = can(PERMISSIONS.incidentsUpdate);
  const canDelete = can(PERMISSIONS.incidentsDelete);
  const canUseAi = can(PERMISSIONS.aiUse);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [form, setForm] = useState(emptyIncidentForm);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [editingIncident, setEditingIncident] = useState(null);
  const [editForm, setEditForm] = useState(emptyIncidentForm);
  const [editError, setEditError] = useState(null);
  const [closingIncident, setClosingIncident] = useState(null);
  const [closeError, setCloseError] = useState(null);
  const assetRows = asArray(assets.data);
  const assetsById = new Map(assetRows.map((asset) => [asset.id, asset]));
  const selectedIncident = asArray(incidents.data).find((incident) => incident.id === selectedIncidentId);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateIncident(form, assetRows);
    if (validationError) {
      setSubmitError({ message: validationError });
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await incidentsApi.create(buildIncidentPayload(form));
      setForm(emptyIncidentForm);
      await incidents.reload();
    } catch (err) {
      setSubmitError(normalizeApiError(err, 'No se pudo crear incidente'));
    } finally {
      setSaving(false);
    }
  }

  function openEdit(incident) {
    setEditingIncident(incident);
    setEditForm(incidentToForm(incident));
    setEditError(null);
  }

  async function handleEdit(event) {
    event.preventDefault();
    const validationError = validateIncident(editForm, assetRows);
    if (validationError) {
      setEditError({ message: validationError });
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      await incidentsApi.update(editingIncident.id, buildIncidentPayload(editForm, true));
      setEditingIncident(null);
      await incidents.reload();
    } catch (err) {
      setEditError(normalizeApiError(err, 'No se pudo actualizar incidente'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmClose() {
    setSaving(true);
    setCloseError(null);
    try {
      await incidentsApi.remove(closingIncident.id);
      setClosingIncident(null);
      await incidents.reload();
    } catch (err) {
      setCloseError(normalizeApiError(err, 'No se pudo cerrar incidente'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Riesgo operativo" title="Incidencias" description="Registra problemas reportados y asignarlos a un activo para priorizacion." />
      {canCreate && <form className="panel" onSubmit={handleSubmit}>
        <h2 className="section-title">Nuevo incidente</h2>
        {submitError && <ErrorState {...submitError} />}
        <div className="form-grid">
          <FormField label="Activo">
            <select value={form.assetId} onChange={(event) => setForm({ ...form, assetId: event.target.value })} required>
              <option value="">Seleccionar activo</option>
              {assetRows.map((asset) => <option key={asset.id} value={asset.id}>{assetLabel(asset)}</option>)}
            </select>
          </FormField>
          <FormField label="Titulo">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Fuga detectada en sector norte" required />
          </FormField>
          <FormField label="Severidad">
            <select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })}>
              {INCIDENT_SEVERITIES.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
            </select>
          </FormField>
          <FormField label="Descripcion">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe el hallazgo, ubicacion e impacto observado" required />
          </FormField>
        </div>
        <div className="actions">
          <button className="button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear incidente'}</button>
        </div>
      </form>}

      {incidents.loading ? <div className="loading">Cargando incidentes...</div> : incidents.error ? <div className="error">{incidents.error}</div> : (
        <DataTable
          rows={asArray(incidents.data)}
          columns={[
            { key: 'id', header: 'ID', render: (row) => <ShortId value={row.id} />, searchable: false },
            { key: 'assetId', header: 'Activo', render: (row) => row.assetName || row.assetCode ? [row.assetCode, row.assetName].filter(Boolean).join(' · ') : assetLabel(assetsById.get(row.assetId)) },
            { key: 'title', header: 'Titulo' },
            { key: 'description', header: 'Descripcion' },
            { key: 'severity', header: 'Severidad', render: (row) => <StatusBadge value={row.severity} /> },
            { key: 'status', header: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'createdAt', header: 'Creacion', render: (row) => formatDate(row.createdAt) },
            { key: 'select', header: 'Detalle', render: (row) => <button className="button secondary" type="button" onClick={() => setSelectedIncidentId(row.id)}>Ver evidencia/IA</button>, searchable: false },
            ...(canManage ? [{
              key: 'actions',
              header: 'Acciones',
              render: (row) => (
                <div className="row-actions">
                  <button className="button secondary" type="button" onClick={() => openEdit(row)}>Editar</button>
                  {canDelete && <button className="button danger" type="button" onClick={() => { setClosingIncident(row); setCloseError(null); }}>Cerrar</button>}
                </div>
              ),
              searchable: false,
            }] : []),
          ]}
        />
      )}
      {selectedIncidentId && (
        <>
          {canUseAi && <AiSuggestionPanel incidentId={selectedIncidentId} />}
          <EvidencePanel referenceType="INCIDENT" referenceId={selectedIncidentId} referenceLabel={incidentLabel(selectedIncident)} />
        </>
      )}
      {editingIncident && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Editar incidente">
            <form className="panel" onSubmit={handleEdit}>
              <h2 className="section-title">Editar incidente</h2>
              {editError && <ErrorState {...editError} />}
              <div className="form-grid">
                <FormField label="Activo">
                  <select value={editForm.assetId} onChange={(event) => setEditForm({ ...editForm, assetId: event.target.value })} required>
                    <option value="">Seleccionar activo</option>
                    {assetRows.map((asset) => <option key={asset.id} value={asset.id}>{assetLabel(asset)}</option>)}
                  </select>
                </FormField>
                <FormField label="Titulo">
                  <input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} required />
                </FormField>
                <FormField label="Severidad">
                  <select value={editForm.severity} onChange={(event) => setEditForm({ ...editForm, severity: event.target.value })}>
                    {INCIDENT_SEVERITIES.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
                  </select>
                </FormField>
                <FormField label="Estado">
                  <select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}>
                    {INCIDENT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </FormField>
                <FormField label="Descripcion">
                  <textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} required />
                </FormField>
              </div>
              <div className="actions">
                <button className="button secondary" type="button" onClick={() => setEditingIncident(null)} disabled={saving}>Cancelar</button>
                <button className="button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {closingIncident && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirm-panel" role="dialog" aria-modal="true" aria-label="Cerrar incidente">
            <h2 className="section-title">Cerrar incidente</h2>
            {closeError && <ErrorState {...closeError} />}
            <p>Esta accion enviara DELETE al backend para cerrar/desactivar el incidente.</p>
            <div className="confirm-target">
              <strong>{closingIncident.title}</strong>
              <span>{closingIncident.status}</span>
            </div>
            <div className="actions">
              <button className="button secondary" type="button" onClick={() => setClosingIncident(null)} disabled={saving}>Cancelar</button>
              <button className="button danger" type="button" onClick={confirmClose} disabled={saving}>{saving ? 'Cerrando...' : 'Cerrar incidente'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
