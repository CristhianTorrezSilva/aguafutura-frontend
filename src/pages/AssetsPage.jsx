import { useState } from 'react';
import { Link } from 'react-router-dom';
import { assetsApi, zonesApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import DataTable from '../components/DataTable';
import ErrorState from '../components/ErrorState';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import ShortId from '../components/ShortId';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
import { apiErrorMessage, normalizeApiError } from '../utils/errors';
import { zoneLabel } from '../utils/display';
import { asArray, formatDate } from '../utils/format';
import { ASSET_TYPES } from '../utils/enums';

const emptyAssetForm = {
  zoneId: '',
  code: '',
  name: '',
  type: 'METER',
  locationDescription: '',
};

function normalizeAssetCode(value) {
  return value.toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9_-]/g, '');
}

function validateAsset(form, zoneRows) {
  if (!form.zoneId) return 'Selecciona una zona real antes de crear el activo.';
  if (!zoneRows.some((zone) => zone.id === form.zoneId)) return 'La zona seleccionada no existe o no termino de cargar.';
  if (!form.code.trim()) return 'Ingresa un codigo de activo. Ejemplo: AST-001.';
  if (!form.name.trim()) return 'Ingresa un nombre de activo.';
  if (!form.type) return 'Selecciona un tipo de activo.';
  if (!ASSET_TYPES.includes(form.type)) return 'Selecciona un tipo de activo valido.';
  if (!form.locationDescription.trim()) return 'Ingresa una ubicacion o referencia del activo.';
  return '';
}

function buildAssetPayload(form) {
  return {
    zoneId: form.zoneId,
    code: form.code.trim(),
    name: form.name.trim(),
    type: form.type,
    locationDescription: form.locationDescription.trim(),
  };
}

function assetToForm(asset) {
  return {
    zoneId: asset.zoneId || '',
    code: asset.code || '',
    name: asset.name || '',
    type: asset.type || 'METER',
    locationDescription: asset.locationDescription || '',
  };
}

function AssetForm({ title, form, setForm, zoneRows, error, saving, submitLabel, onSubmit, onCancel }) {
  return (
    <form className="panel" onSubmit={onSubmit}>
      <h2 className="section-title">{title}</h2>
      {error && (typeof error === 'string' ? <div className="error">{error}</div> : <ErrorState {...error} />)}
      <div className="form-grid">
        <FormField label="Zona">
          <select value={form.zoneId} onChange={(event) => setForm({ ...form, zoneId: event.target.value })} required>
            <option value="">Seleccionar zona</option>
            {zoneRows.map((zone) => <option key={zone.id} value={zone.id}>{zoneLabel(zone)}</option>)}
          </select>
        </FormField>
        <FormField label="Codigo">
          <input value={form.code} maxLength={30} onChange={(event) => setForm({ ...form, code: normalizeAssetCode(event.target.value) })} placeholder="AST-001" required />
        </FormField>
        <FormField label="Nombre">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Medidor principal" required />
        </FormField>
        <FormField label="Tipo">
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} required>
            {ASSET_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </FormField>
        <FormField label="Ubicacion">
          <input value={form.locationDescription} onChange={(event) => setForm({ ...form, locationDescription: event.target.value })} placeholder="Calle, sector o punto de referencia" required />
        </FormField>
      </div>
      <div className="actions">
        <button className="button" type="submit" disabled={saving || !zoneRows.length}>{saving ? 'Guardando...' : submitLabel}</button>
        {onCancel && <button className="button secondary" type="button" onClick={onCancel} disabled={saving}>Cancelar</button>}
        {!zoneRows.length && <span className="form-note">Crea una zona antes de registrar activos.</span>}
      </div>
    </form>
  );
}

export default function AssetsPage() {
  const assets = useAsync(() => assetsApi.list(), []);
  const zones = useAsync(() => zonesApi.list(), []);
  const { can } = useRoles();
  const canCreate = can(PERMISSIONS.assetsCreate);
  const canManage = can(PERMISSIONS.assetsUpdate);
  const canDelete = can(PERMISSIONS.assetsDelete);
  const [form, setForm] = useState(emptyAssetForm);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editForm, setEditForm] = useState(emptyAssetForm);
  const [editError, setEditError] = useState(null);
  const [deletingAsset, setDeletingAsset] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [notice, setNotice] = useState('');
  const rows = asArray(assets.data);
  const zoneRows = asArray(zones.data);
  const zonesById = new Map(zoneRows.map((zone) => [zone.id, zone]));

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateAsset(form, zoneRows);
    if (validationError) {
      setSubmitError({ message: validationError });
      return;
    }

    setSaving(true);
    setSubmitError(null);
    setNotice('');
    try {
      await assetsApi.create(buildAssetPayload(form));
      setForm(emptyAssetForm);
      setNotice('Activo creado correctamente.');
      await assets.reload();
    } catch (err) {
      setSubmitError(normalizeApiError(err, 'No se pudo crear el activo'));
    } finally {
      setSaving(false);
    }
  }

  function openEdit(asset) {
    setEditingAsset(asset);
    setEditForm(assetToForm(asset));
    setEditError(null);
    setNotice('');
  }

  async function handleEdit(event) {
    event.preventDefault();
    const validationError = validateAsset(editForm, zoneRows);
    if (validationError) {
      setEditError({ message: validationError });
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      await assetsApi.update(editingAsset.id, buildAssetPayload(editForm));
      setEditingAsset(null);
      setNotice('Activo actualizado correctamente.');
      await assets.reload();
    } catch (err) {
      setEditError(normalizeApiError(err, 'No se pudo actualizar el activo'));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setSaving(true);
    setDeleteError(null);
    try {
      await assetsApi.remove(deletingAsset.id);
      setDeletingAsset(null);
      setNotice('Activo desactivado correctamente.');
      await assets.reload();
    } catch (err) {
      setDeleteError(normalizeApiError(err, 'No se pudo desactivar el activo'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Infraestructura" title="Activos hidricos" description="Registra medidores, grifos, tanques o canerias y relacionalos con una zona." />
      {notice && <div className="success-message">{notice}</div>}
      {canCreate && (
        <AssetForm
          title="Nuevo activo"
          form={form}
          setForm={setForm}
          zoneRows={zoneRows}
          error={submitError}
          saving={saving && !editingAsset && !deletingAsset}
          submitLabel="Crear activo"
          onSubmit={handleSubmit}
        />
      )}

      {assets.loading ? <div className="loading">Cargando activos...</div> : assets.error ? <div className="error">{assets.error}</div> : (
        <DataTable
          rows={rows}
          columns={[
            { key: 'id', header: 'Detalle', render: (row) => <Link className="button secondary" to={`/assets/${row.id}`}>Ver detalle</Link>, searchable: false },
            { key: 'displayName', header: 'Activo', render: (row) => row.displayName || [row.code, row.name].filter(Boolean).join(' · ') },
            { key: 'zoneId', header: 'Zona', render: (row) => row.zoneName || row.zoneCode ? [row.zoneCode, row.zoneName].filter(Boolean).join(' · ') : zoneLabel(zonesById.get(row.zoneId)) },
            { key: 'code', header: 'Codigo' },
            { key: 'name', header: 'Nombre' },
            { key: 'type', header: 'Tipo', render: (row) => <StatusBadge value={row.type} /> },
            { key: 'locationDescription', header: 'Ubicacion' },
            { key: 'enabled', header: 'Estado', render: (row) => <StatusBadge value={row.enabled ? 'ENABLED' : 'DISABLED'} /> },
            { key: 'createdAt', header: 'Creacion', render: (row) => formatDate(row.createdAt) },
            ...(canManage ? [{
              key: 'actions',
              header: 'Acciones',
              render: (row) => (
                <div className="row-actions">
                  <button className="button secondary" type="button" onClick={() => openEdit(row)}>Editar</button>
                  {canDelete && <button className="button danger" type="button" onClick={() => { setDeletingAsset(row); setDeleteError(null); }}>Desactivar</button>}
                </div>
              ),
              searchable: false,
            }] : []),
            { key: 'assetId', header: 'ID', render: (row) => <ShortId value={row.id} />, searchable: false },
          ]}
        />
      )}

      {editingAsset && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Editar activo">
            <AssetForm
              title="Editar activo"
              form={editForm}
              setForm={setEditForm}
              zoneRows={zoneRows}
              error={editError}
              saving={saving}
              submitLabel="Guardar cambios"
              onSubmit={handleEdit}
              onCancel={() => setEditingAsset(null)}
            />
          </div>
        </div>
      )}

      {deletingAsset && (
        <div className="modal-backdrop" role="presentation">
          <div className="confirm-panel" role="dialog" aria-modal="true" aria-label="Desactivar activo">
            <h2 className="section-title">Desactivar activo</h2>
            {deleteError && <ErrorState {...deleteError} />}
            <p>Esta accion desactivara el activo. No se perdera el historial asociado.</p>
            <div className="confirm-target">
              <strong>{deletingAsset.displayName || deletingAsset.code}</strong>
              <span>{deletingAsset.name}</span>
            </div>
            <div className="actions">
              <button className="button secondary" type="button" onClick={() => setDeletingAsset(null)} disabled={saving}>Cancelar</button>
              <button className="button danger" type="button" onClick={confirmDelete} disabled={saving}>{saving ? 'Desactivando...' : 'Desactivar activo'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
