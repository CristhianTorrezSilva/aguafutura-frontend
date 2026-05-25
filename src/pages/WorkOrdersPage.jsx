import { useState } from 'react';
import { assetsApi, incidentsApi, workOrdersApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
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
import { assetLabel, incidentLabel, workOrderLabel } from '../utils/display';
import { asArray, formatDate } from '../utils/format';
import { WORK_ORDER_PRIORITIES, WORK_ORDER_STATUSES } from '../utils/enums';

const emptyWorkOrderForm = { assetId: '', incidentId: '', description: '', priority: 'HIGH', status: 'PENDING' };

function validateWorkOrder(form, assets, incidents) {
  if (!form.assetId) return 'Selecciona un activo real.';
  if (!assets.some((asset) => asset.id === form.assetId)) return 'El activo seleccionado no existe o no termino de cargar.';
  if (!form.incidentId) return 'Selecciona una incidencia real.';
  if (!incidents.some((incident) => incident.id === form.incidentId)) return 'La incidencia seleccionada no existe o no termino de cargar.';
  if (!form.description.trim()) return 'Ingresa una descripcion.';
  if (!WORK_ORDER_PRIORITIES.includes(form.priority)) return 'Selecciona una prioridad valida.';
  if (form.status && !WORK_ORDER_STATUSES.includes(form.status)) return 'Selecciona un estado valido.';
  return '';
}

function buildWorkOrderPayload(form, includeStatus = false) {
  const payload = {
    assetId: form.assetId,
    incidentId: form.incidentId,
    description: form.description.trim(),
    priority: form.priority,
  };
  if (includeStatus && form.status) payload.status = form.status;
  return payload;
}

function workOrderToForm(workOrder) {
  return {
    assetId: workOrder.assetId || '',
    incidentId: workOrder.incidentId || '',
    description: workOrder.description || '',
    priority: workOrder.priority || 'HIGH',
    status: workOrder.status || 'PENDING',
  };
}

export default function WorkOrdersPage() {
  const workOrders = useAsync(() => workOrdersApi.list(), []);
  const { can } = useRoles();
  const canCreate = can(PERMISSIONS.workOrdersCreate);
  const canManage = can(PERMISSIONS.workOrdersUpdate);
  const canDelete = can(PERMISSIONS.workOrdersDelete);
  const shouldLoadFormOptions = canCreate || canManage;
  const assets = useAsync(() => shouldLoadFormOptions ? assetsApi.list() : Promise.resolve({ data: [] }), [shouldLoadFormOptions]);
  const incidents = useAsync(() => shouldLoadFormOptions ? incidentsApi.list() : Promise.resolve({ data: [] }), [shouldLoadFormOptions]);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('');
  const [form, setForm] = useState(emptyWorkOrderForm);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState(null);
  const [editForm, setEditForm] = useState(emptyWorkOrderForm);
  const [editError, setEditError] = useState(null);
  const [cancellingWorkOrder, setCancellingWorkOrder] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const assetRows = asArray(assets.data);
  const incidentRows = asArray(incidents.data);
  const assetsById = new Map(assetRows.map((asset) => [asset.id, asset]));
  const incidentsById = new Map(incidentRows.map((incident) => [incident.id, incident]));
  const selectedWorkOrder = asArray(workOrders.data).find((workOrder) => workOrder.id === selectedWorkOrderId);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateWorkOrder(form, assetRows, incidentRows);
    if (validationError) {
      setSubmitError({ message: validationError });
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await workOrdersApi.create(buildWorkOrderPayload(form));
      setForm(emptyWorkOrderForm);
      await workOrders.reload();
    } catch (err) {
      setSubmitError(normalizeApiError(err, 'No se pudo crear orden'));
    } finally {
      setSaving(false);
    }
  }

  function openEdit(workOrder) {
    setEditingWorkOrder(workOrder);
    setEditForm(workOrderToForm(workOrder));
    setEditError(null);
  }

  async function handleEdit(event) {
    event.preventDefault();
    const validationError = validateWorkOrder(editForm, assetRows, incidentRows);
    if (validationError) {
      setEditError({ message: validationError });
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      await workOrdersApi.update(editingWorkOrder.id, buildWorkOrderPayload(editForm, true));
      setEditingWorkOrder(null);
      await workOrders.reload();
    } catch (err) {
      setEditError(normalizeApiError(err, 'No se pudo actualizar orden'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmCancel() {
    setSaving(true);
    setCancelError(null);
    try {
      await workOrdersApi.remove(cancellingWorkOrder.id);
      setCancellingWorkOrder(null);
      await workOrders.reload();
    } catch (err) {
      setCancelError(normalizeApiError(err, 'No se pudo cancelar orden'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Ejecucion" title="Ordenes de trabajo" description="Gestiona el trabajo tecnico asociado a incidencias." />
      {canCreate && <form className="panel" onSubmit={handleSubmit}>
        <h2 className="section-title">Nueva orden</h2>
        {submitError && <ErrorState {...submitError} />}
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
            ...(canManage ? [{
              key: 'actions',
              header: 'Acciones',
              render: (row) => (
                <div className="row-actions">
                  <button className="button secondary" type="button" onClick={() => openEdit(row)}>Editar</button>
                  {canDelete && <button className="button danger" type="button" onClick={() => { setCancellingWorkOrder(row); setCancelError(null); }}>Cancelar</button>}
                </div>
              ),
              searchable: false,
            }] : []),
          ]}
        />
      )}
      {selectedWorkOrderId && <EvidencePanel referenceType="WORK_ORDER" referenceId={selectedWorkOrderId} referenceLabel={workOrderLabel(selectedWorkOrder)} />}
      {editingWorkOrder && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Editar orden">
            <form className="panel" onSubmit={handleEdit}>
              <h2 className="section-title">Editar orden</h2>
              {editError && <ErrorState {...editError} />}
              <div className="form-grid">
                <FormField label="Activo">
                  <select value={editForm.assetId} onChange={(event) => setEditForm({ ...editForm, assetId: event.target.value })} required>
                    <option value="">Seleccionar activo</option>
                    {assetRows.map((asset) => <option key={asset.id} value={asset.id}>{assetLabel(asset)}</option>)}
                  </select>
                </FormField>
                <FormField label="Incidencia">
                  <select value={editForm.incidentId} onChange={(event) => setEditForm({ ...editForm, incidentId: event.target.value })} required>
                    <option value="">Seleccionar incidente</option>
                    {incidentRows.map((incident) => <option key={incident.id} value={incident.id}>{incidentLabel(incident)}</option>)}
                  </select>
                </FormField>
                <FormField label="Prioridad">
                  <select value={editForm.priority} onChange={(event) => setEditForm({ ...editForm, priority: event.target.value })}>
                    {WORK_ORDER_PRIORITIES.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                </FormField>
                <FormField label="Estado">
                  <select value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}>
                    {WORK_ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </FormField>
                <FormField label="Descripcion">
                  <textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} required />
                </FormField>
              </div>
              <div className="actions">
                <button className="button secondary" type="button" onClick={() => setEditingWorkOrder(null)} disabled={saving}>Cancelar</button>
                <button className="button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {cancellingWorkOrder && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirm-panel" role="dialog" aria-modal="true" aria-label="Cancelar orden">
            <h2 className="section-title">Cancelar orden</h2>
            {cancelError && <ErrorState {...cancelError} />}
            <p>Esta accion enviara DELETE al backend para cancelar/desactivar la orden de trabajo.</p>
            <div className="confirm-target">
              <strong>{workOrderLabel(cancellingWorkOrder)}</strong>
              <span>{cancellingWorkOrder.status}</span>
            </div>
            <div className="actions">
              <button className="button secondary" type="button" onClick={() => setCancellingWorkOrder(null)} disabled={saving}>Cancelar</button>
              <button className="button danger" type="button" onClick={confirmCancel} disabled={saving}>{saving ? 'Cancelando...' : 'Cancelar orden'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
