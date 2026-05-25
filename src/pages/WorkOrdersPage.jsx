import { useState } from 'react';
import { assetsApi, incidentsApi, workOrdersApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import DataTable from '../components/DataTable';
import EvidencePanel from '../components/EvidencePanel';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import ShortId from '../components/ShortId';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
import { apiErrorMessage } from '../utils/errors';
import { assetLabel, incidentLabel, workOrderLabel } from '../utils/display';
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
  const assetRows = asArray(assets.data);
  const incidentRows = asArray(incidents.data);
  const assetsById = new Map(assetRows.map((asset) => [asset.id, asset]));
  const incidentsById = new Map(incidentRows.map((incident) => [incident.id, incident]));
  const selectedWorkOrder = asArray(workOrders.data).find((workOrder) => workOrder.id === selectedWorkOrderId);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSubmitError('');
    try {
      await workOrdersApi.create(form);
      setForm({ assetId: '', incidentId: '', description: '', priority: 'HIGH' });
      await workOrders.reload();
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'No se pudo crear orden'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Ejecucion" title="Ordenes de trabajo" description="Gestiona el trabajo tecnico asociado a incidencias." />
      {canCreate && <form className="panel" onSubmit={handleSubmit}>
        <h2 className="section-title">Nueva orden</h2>
        {submitError && <div className="error">{submitError}</div>}
        <div className="form-grid">
          <FormField label="Activo">
            <select value={form.assetId} onChange={(event) => setForm({ ...form, assetId: event.target.value })} required>
              <option value="">Seleccionar activo</option>
              {assetRows.map((asset) => <option key={asset.id} value={asset.id}>{assetLabel(asset)}</option>)}
            </select>
          </FormField>
          <FormField label="Incidencia">
            <select value={form.incidentId} onChange={(event) => setForm({ ...form, incidentId: event.target.value })} required>
              <option value="">Seleccionar incidente</option>
              {incidentRows.map((incident) => <option key={incident.id} value={incident.id}>{incidentLabel(incident)}</option>)}
            </select>
          </FormField>
          <FormField label="Prioridad">
            <select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
              {WORK_ORDER_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </FormField>
          <FormField label="Descripcion">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Trabajo requerido, alcance y condiciones de campo" required />
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
            { key: 'id', header: 'ID', render: (row) => <ShortId value={row.id} />, searchable: false },
            { key: 'assetId', header: 'Activo', render: (row) => row.assetName || row.assetCode ? [row.assetCode, row.assetName].filter(Boolean).join(' · ') : assetLabel(assetsById.get(row.assetId)) },
            { key: 'incidentId', header: 'Incidencia', render: (row) => row.incidentTitle || incidentLabel(incidentsById.get(row.incidentId)) },
            { key: 'description', header: 'Descripcion' },
            { key: 'status', header: 'Estado', render: (row) => <StatusBadge value={row.status} /> },
            { key: 'priority', header: 'Prioridad', render: (row) => <StatusBadge value={row.priority} /> },
            { key: 'assignedTo', header: 'Asignado a' },
            { key: 'scheduledAt', header: 'Programada', render: (row) => formatDate(row.scheduledAt) },
            { key: 'completedAt', header: 'Completada', render: (row) => formatDate(row.completedAt) },
            { key: 'createdAt', header: 'Creacion', render: (row) => formatDate(row.createdAt) },
            { key: 'select', header: 'Evidencia', render: (row) => <button className="button secondary" type="button" onClick={() => setSelectedWorkOrderId(row.id)}>Ver evidencia</button>, searchable: false },
          ]}
        />
      )}
      {selectedWorkOrderId && <EvidencePanel referenceType="WORK_ORDER" referenceId={selectedWorkOrderId} referenceLabel={workOrderLabel(selectedWorkOrder)} />}
    </div>
  );
}
