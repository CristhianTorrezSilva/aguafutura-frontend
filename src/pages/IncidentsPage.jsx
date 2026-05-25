import { useState } from 'react';
import { assetsApi, incidentsApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import AiSuggestionPanel from '../components/AiSuggestionPanel';
import DataTable from '../components/DataTable';
import EvidencePanel from '../components/EvidencePanel';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import ShortId from '../components/ShortId';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
import { apiErrorMessage } from '../utils/errors';
import { assetLabel, incidentLabel } from '../utils/display';
import { asArray, formatDate } from '../utils/format';
import { INCIDENT_SEVERITIES } from '../utils/enums';

export default function IncidentsPage() {
  const incidents = useAsync(() => incidentsApi.list(), []);
  const assets = useAsync(() => assetsApi.list(), []);
  const { can } = useRoles();
  const canCreate = can(PERMISSIONS.incidentsCreate);
  const canUseAi = can(PERMISSIONS.aiUse);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [form, setForm] = useState({ assetId: '', title: '', description: '', severity: 'HIGH' });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const assetRows = asArray(assets.data);
  const assetsById = new Map(assetRows.map((asset) => [asset.id, asset]));
  const selectedIncident = asArray(incidents.data).find((incident) => incident.id === selectedIncidentId);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSubmitError('');
    try {
      await incidentsApi.create(form);
      setForm({ assetId: '', title: '', description: '', severity: 'HIGH' });
      await incidents.reload();
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'No se pudo crear incidente'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Riesgo operativo" title="Incidencias" description="Registra problemas reportados y asignarlos a un activo para priorizacion." />
      {canCreate && <form className="panel" onSubmit={handleSubmit}>
        <h2 className="section-title">Nuevo incidente</h2>
        {submitError && <div className="error">{submitError}</div>}
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
          ]}
        />
      )}
      {selectedIncidentId && (
        <>
          {canUseAi && <AiSuggestionPanel incidentId={selectedIncidentId} />}
          <EvidencePanel referenceType="INCIDENT" referenceId={selectedIncidentId} referenceLabel={incidentLabel(selectedIncident)} />
        </>
      )}
    </div>
  );
}
