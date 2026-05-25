import { useState } from 'react';
import { Link } from 'react-router-dom';
import { assetsApi, zonesApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import ShortId from '../components/ShortId';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
import { apiErrorMessage } from '../utils/errors';
import { zoneLabel } from '../utils/display';
import { asArray, formatDate } from '../utils/format';
import { ASSET_TYPES } from '../utils/enums';

export default function AssetsPage() {
  const assets = useAsync(() => assetsApi.list(), []);
  const zones = useAsync(() => zonesApi.list(), []);
  const { can } = useRoles();
  const canCreate = can(PERMISSIONS.assetsCreate);
  const [form, setForm] = useState({
    zoneId: '',
    code: '',
    name: '',
    type: 'METER',
    locationDescription: '',
  });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const rows = asArray(assets.data);
  const zoneRows = asArray(zones.data);
  const zonesById = new Map(zoneRows.map((zone) => [zone.id, zone]));

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSubmitError('');
    try {
      await assetsApi.create(form);
      setForm({ zoneId: '', code: '', name: '', type: 'METER', locationDescription: '' });
      await assets.reload();
    } catch (err) {
      setSubmitError(apiErrorMessage(err, 'No se pudo crear el activo'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Infraestructura" title="Activos hidricos" description="Registra medidores, grifos, tanques o canerias y relacionalos con una zona." />
      {canCreate && <form className="panel" onSubmit={handleSubmit}>
        <h2 className="section-title">Nuevo activo</h2>
        {submitError && <div className="error">{submitError}</div>}
        <div className="form-grid">
          <FormField label="Zona">
            <select value={form.zoneId} onChange={(event) => setForm({ ...form, zoneId: event.target.value })} required>
              <option value="">Seleccionar zona</option>
              {zoneRows.map((zone) => <option key={zone.id} value={zone.id}>{zoneLabel(zone)}</option>)}
            </select>
          </FormField>
          <FormField label="Codigo">
            <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} placeholder="MTR-001" required />
          </FormField>
          <FormField label="Nombre">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Medidor principal" required />
          </FormField>
          <FormField label="Tipo">
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              {ASSET_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </FormField>
          <FormField label="Ubicacion">
            <input value={form.locationDescription} onChange={(event) => setForm({ ...form, locationDescription: event.target.value })} placeholder="Calle, sector o punto de referencia" required />
          </FormField>
        </div>
        <div className="actions">
          <button className="button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear activo'}</button>
        </div>
      </form>}

      {assets.loading ? <div className="loading">Cargando activos...</div> : assets.error ? <div className="error">{assets.error}</div> : (
        <DataTable
          rows={rows}
          columns={[
            { key: 'id', header: 'Detalle', render: (row) => <Link className="button secondary" to={`/assets/${row.id}`}>Ver detalle</Link>, searchable: false },
            { key: 'zoneId', header: 'Zona', render: (row) => row.zoneName || row.zoneCode ? [row.zoneCode, row.zoneName].filter(Boolean).join(' · ') : zoneLabel(zonesById.get(row.zoneId)) },
            { key: 'code', header: 'Codigo' },
            { key: 'name', header: 'Nombre' },
            { key: 'type', header: 'Tipo', render: (row) => <StatusBadge value={row.type} /> },
            { key: 'locationDescription', header: 'Ubicacion' },
            { key: 'enabled', header: 'Estado', render: (row) => <StatusBadge value={row.enabled ? 'ENABLED' : 'DISABLED'} /> },
            { key: 'createdAt', header: 'Creacion', render: (row) => formatDate(row.createdAt) },
            { key: 'assetId', header: 'ID', render: (row) => <ShortId value={row.id} />, searchable: false },
          ]}
        />
      )}
    </div>
  );
}
