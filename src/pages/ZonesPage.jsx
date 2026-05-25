import { useState } from 'react';
import { zonesApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import DataTable from '../components/DataTable';
import ErrorState from '../components/ErrorState';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import ShortId from '../components/ShortId';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
import { normalizeApiError } from '../utils/errors';
import { asArray, formatDate } from '../utils/format';

const emptyForm = { code: '', name: '', description: '', enabled: true };

function normalizeZoneCode(value) {
  return value.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9_-]/g, '');
}

function validateZone(form) {
  if (!form.code.trim()) return 'Ingresa un codigo de zona. Ejemplo: ZN-NORTE.';
  if (form.code.length < 3) return 'El codigo debe tener al menos 3 caracteres.';
  if (form.code.length > 30) return 'El codigo no puede superar 30 caracteres.';
  if (!/^[A-Z0-9_-]+$/.test(form.code)) return 'Usa solo letras, numeros, guion o guion bajo.';
  if (!form.name.trim()) return 'Ingresa un nombre de zona claro.';
  return '';
}

function buildZonePayload(form, originalZone) {
  const payload = {
    code: form.code.trim(),
    name: form.name.trim(),
  };

  if (form.description.trim() || originalZone?.description !== undefined) {
    payload.description = form.description.trim();
  }

  if (originalZone?.enabled !== undefined || originalZone?.active !== undefined) {
    payload.enabled = form.enabled;
  }

  return payload;
}

function buildZoneCreatePayload(form) {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
  };
}

function zoneToForm(zone) {
  return {
    code: zone.code || '',
    name: zone.name || '',
    description: zone.description || '',
    enabled: zone.enabled ?? zone.active ?? true,
  };
}

function ZoneForm({ title, form, setForm, error, saving, submitLabel, savingLabel, onSubmit, onCancel, originalZone }) {
  const showDescription = Boolean(originalZone);

  return (
    <form className="panel" onSubmit={onSubmit}>
      <h2 className="section-title">{title}</h2>
      {error && <ErrorState {...error} />}
      <div className="form-grid">
        <FormField
          label="Codigo de zona"
          help="Usa un codigo corto y facil de reconocer. Por ejemplo: ZN-NORTE para Zona Norte."
        >
          <input
            value={form.code}
            maxLength={30}
            onChange={(event) => setForm({ ...form, code: normalizeZoneCode(event.target.value) })}
            placeholder="Ej: ZN-NORTE, ZN-CENTRO, ZN-SUR"
            required
          />
        </FormField>
        <FormField label="Nombre de zona">
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="Zona Norte"
            required
          />
        </FormField>
        {showDescription && (
          <FormField label="Descripcion">
            <input
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Sector operativo, cobertura o referencia"
            />
          </FormField>
        )}
        {(originalZone?.enabled !== undefined || originalZone?.active !== undefined) && (
          <FormField label="Estado activo">
            <select value={String(form.enabled)} onChange={(event) => setForm({ ...form, enabled: event.target.value === 'true' })}>
              <option value="true">Activa</option>
              <option value="false">Inactiva</option>
            </select>
          </FormField>
        )}
      </div>
      <div className="actions">
        <button className="button" type="submit" disabled={saving}>{saving ? savingLabel : submitLabel}</button>
        {onCancel && <button className="button secondary" type="button" onClick={onCancel} disabled={saving}>Cancelar</button>}
      </div>
    </form>
  );
}

export default function ZonesPage() {
  const { data, loading, error, reload } = useAsync(() => zonesApi.list(), []);
  const { can } = useRoles();
  const canManage = can(PERMISSIONS.zonesUpdate);
  const canCreate = can(PERMISSIONS.zonesCreate);
  const canDelete = can(PERMISSIONS.zonesDelete);
  const [form, setForm] = useState(emptyForm);
  const [submitError, setSubmitError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editError, setEditError] = useState(null);
  const [deletingZone, setDeletingZone] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [notice, setNotice] = useState('');
  const rows = asArray(data);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateZone(form);
    if (validationError) {
      setSubmitError({ message: validationError });
      return;
    }

    setSaving(true);
    setSubmitError(null);
    setNotice('');
    try {
      await zonesApi.create(buildZoneCreatePayload(form));
      setForm(emptyForm);
      setNotice('Zona creada correctamente.');
      await reload();
    } catch (err) {
      setSubmitError(normalizeApiError(err, 'No se pudo crear la zona.'));
    } finally {
      setSaving(false);
    }
  }

  function openEdit(zone) {
    setEditingZone(zone);
    setEditForm(zoneToForm(zone));
    setEditError(null);
    setNotice('');
  }

  async function handleEdit(event) {
    event.preventDefault();
    const validationError = validateZone(editForm);
    if (validationError) {
      setEditError({ message: validationError });
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      await zonesApi.update(editingZone.id, buildZonePayload(editForm, editingZone));
      setEditingZone(null);
      setNotice('Cambios guardados correctamente.');
      await reload();
    } catch (err) {
      setEditError(normalizeApiError(err, 'No se pudieron guardar los cambios.'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    setDeleteError(null);
    try {
      await zonesApi.remove(deletingZone.id);
      setDeletingZone(null);
      setNotice('Zona desactivada correctamente.');
      await reload();
    } catch (err) {
      setDeleteError(normalizeApiError(err, 'No se pudo desactivar la zona.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Infraestructura" title="Zonas operativas" description="Organiza los activos hidricos por sectores operativos. Usa codigos cortos como ZN-NORTE." />
      {notice && <div className="success-message">{notice}</div>}
      {canCreate && (
        <ZoneForm
          title="Nueva zona"
          form={form}
          setForm={setForm}
          error={submitError}
          saving={saving && !editingZone && !deletingZone}
          submitLabel="Crear zona"
          savingLabel="Guardando..."
          onSubmit={handleSubmit}
        />
      )}

      {loading ? <div className="loading">Cargando zonas...</div> : error ? <div className="error">{error}</div> : (
        <DataTable
          rows={rows}
          emptyTitle="No hay zonas registradas todavia."
          emptyMessage="Comienza creando una zona operativa como ZN-NORTE o ZN-CENTRO."
          columns={[
            { key: 'displayName', header: 'Zona', render: (row) => row.displayName || [row.code, row.name].filter(Boolean).join(' · ') },
            { key: 'code', header: 'Codigo' },
            { key: 'name', header: 'Nombre' },
            { key: 'description', header: 'Descripcion' },
            { key: 'enabled', header: 'Estado', render: (row) => <StatusBadge value={(row.enabled ?? row.active ?? true) ? 'Activa' : 'Inactiva'} /> },
            { key: 'createdAt', header: 'Creacion', render: (row) => formatDate(row.createdAt) },
            ...(canManage ? [{
              key: 'actions',
              header: 'Acciones',
              render: (row) => (
                <div className="row-actions">
                  <button className="button secondary" type="button" onClick={() => openEdit(row)}>Editar</button>
                  {canDelete && <button className="button danger" type="button" onClick={() => { setDeletingZone(row); setDeleteError(null); }}>Desactivar</button>}
                </div>
              ),
              searchable: false,
            }] : []),
            { key: 'id', header: 'ID', render: (row) => <ShortId value={row.id} />, searchable: false },
          ]}
        />
      )}

      {editingZone && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Editar zona">
            <ZoneForm
              title="Editar zona"
              form={editForm}
              setForm={setEditForm}
              error={editError}
              saving={saving}
              submitLabel="Guardar cambios"
              savingLabel="Guardando cambios..."
              onSubmit={handleEdit}
              onCancel={() => setEditingZone(null)}
              originalZone={editingZone}
            />
          </div>
        </div>
      )}

      {deletingZone && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirm-panel" role="dialog" aria-modal="true" aria-label="Desactivar zona">
            <h2 className="section-title">Desactivar zona</h2>
            {deleteError && <ErrorState {...deleteError} />}
            <p>Esta accion desactivara la zona. No se perdera el historial asociado.</p>
            <div className="confirm-target">
              <strong>{deletingZone.code}</strong>
              <span>{deletingZone.name}</span>
            </div>
            <div className="actions">
              <button className="button secondary" type="button" onClick={() => setDeletingZone(null)} disabled={saving}>Cancelar</button>
              <button className="button danger" type="button" onClick={confirmDelete} disabled={saving}>{saving ? 'Desactivando...' : 'Desactivar zona'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
