import { useState } from 'react';
import { assetsApi, incidentsApi, workOrdersApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import DataTable from '../components/DataTable';
import EvidencePanel from '../components/EvidencePanel';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
import { asArray, formatDate } from '../utils/format';
import { WORK_ORDER_PRIORITIES } from '../utils/enums';

export default function WorkOrdersPage() {
  const workOrders = useAsync(() => workOrdersApi.list(), []);
  const { can } = useRoles();
  const canCreate = can(PERMISSIONS.workOrdersCreate);
  const assets = useAsync(() => canCreate ? assetsApi.list() : Promise.resolve({ data: [] }), [canCreate]);
  const incidents = useAsync(() => canCreate ? incidentsApi.list() : Promise.resolve({ data: [] }), [canCreate]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('');
  const [form, setForm] = useState({ assetId: '', incidentId: '', description: '', priority: 'HIGH' });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSubmitError('');
    try {
      await workOrdersApi.create(form);
      setForm({ assetId: '', incidentId: '', description: '', priority: 'HIGH' });
      await workOrders.reload();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'No se pudo crear orden');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="Ordenes de trabajo" description="Creacion y consulta de work orders." />
      {canCreate && <form className="panel" onSubmit={handleSubmit}>
        <h2 className="section-title">Nueva orden</h2>
        {submitError && <div className="error">{submitError}</div>}
        <div className="form-grid">
          <FormField label="assetId">
            <select value={form.assetId} onChange={(event) => setForm({ ...form, assetId: event.target.value })} required>
              <option value="">Seleccionar activo</option>
              {asArray(assets.data).map((asset) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.code})</option>)}
            </select>
          </FormField>
          <FormField label="incidentId">
            <select value={form.incidentId} onChange={(event) => setForm({ ...form, incidentId: event.target.value })} required>
              <option value="">Seleccionar incidente</option>
              {asArray(incidents.data).map((incident) => <option key={incident.id} value={incident.id}>{incident.title}</option>)}
            </select>
          </FormField>
          <FormField label="priority">
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              {WORK_ORDER_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </FormField>
          <FormField label="description">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required />
          </FormField>
        </div>
        <div className="actions">
          <button className="button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear orden'}</button>
        </div>
      </form>}

      {workOrders.loading ? <div className="loading">Cargando ordenes...</div> : workOrders.error ? <div className="error">{workOrders.error}</div> : (
        <DataTable
          rows={asArray(workOrders.data)}
          columns={[
            { key: 'id', header: 'id' },
            { key: 'assetId', header: 'assetId' },
            { key: 'incidentId', header: 'incidentId' },
            { key: 'description', header: 'description' },
            { key: 'status', header: 'status', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'priority', header: 'priority', render: (row) => <StatusBadge value={row.priority} /> },
            { key: 'assignedTo', header: 'assignedTo' },
            { key: 'scheduledAt', header: 'scheduledAt', render: (row) => formatDate(row.scheduledAt) },
            { key: 'completedAt', header: 'completedAt', render: (row) => formatDate(row.completedAt) },
            { key: 'createdAt', header: 'createdAt', render: (row) => formatDate(row.createdAt) },
            { key: 'select', header: 'evidence', render: (row) => <button className="button secondary" type="button" onClick={() => setSelectedWorkOrderId(row.id)}>Seleccionar</button> },
          ]}
        />
      )}
      {selectedWorkOrderId && <EvidencePanel referenceType="WORK_ORDER" referenceId={selectedWorkOrderId} />}
    </div>
  );
}
