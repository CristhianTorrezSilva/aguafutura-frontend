import { useState } from 'react';
import { assetsApi, incidentsApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import AiSuggestionPanel from '../components/AiSuggestionPanel';
import DataTable from '../components/DataTable';
import EvidencePanel from '../components/EvidencePanel';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
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

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSubmitError('');
    try {
      await incidentsApi.create(form);
      setForm({ assetId: '', title: '', description: '', severity: 'HIGH' });
      await incidents.reload();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'No se pudo crear incidente');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="Incidentes" description="Registro y seguimiento de incidentes." />
      {canCreate && <form className="panel" onSubmit={handleSubmit}>
        <h2 className="section-title">Nuevo incidente</h2>
        {submitError && <div className="error">{submitError}</div>}
        <div className="form-grid">
          <FormField label="assetId">
            <select value={form.assetId} onChange={(event) => setForm({ ...form, assetId: event.target.value })} required>
              <option value="">Seleccionar activo</option>
              {asArray(assets.data).map((asset) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.code})</option>)}
            </select>
          </FormField>
          <FormField label="title">
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
          </FormField>
          <FormField label="severity">
            <select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })}>
              {INCIDENT_SEVERITIES.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
            </select>
          </FormField>
          <FormField label="description">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
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
            { key: 'id', header: 'id' },
            { key: 'assetId', header: 'assetId' },
            { key: 'title', header: 'title' },
            { key: 'description', header: 'description' },
            { key: 'severity', header: 'severity', render: (row) => <StatusBadge value={row.severity} /> },
            { key: 'status', header: 'status', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'createdAt', header: 'createdAt', render: (row) => formatDate(row.createdAt) },
            { key: 'select', header: 'evidence/ai', render: (row) => <button className="button secondary" type="button" onClick={() => setSelectedIncidentId(row.id)}>Seleccionar</button> },
          ]}
        />
      )}
      {selectedIncidentId && (
        <>
          {canUseAi && <AiSuggestionPanel incidentId={selectedIncidentId} />}
          <EvidencePanel referenceType="INCIDENT" referenceId={selectedIncidentId} />
        </>
      )}
    </div>
  );
}
