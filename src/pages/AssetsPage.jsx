import { useState } from 'react';
import { Link } from 'react-router-dom';
import { assetsApi, zonesApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
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

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSubmitError('');
    try {
      await assetsApi.create(form);
      setForm({ zoneId: '', code: '', name: '', type: 'METER', locationDescription: '' });
      await assets.reload();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'No se pudo crear el activo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="Activos" description="Medidores, bombas, tanques, tuberias, valvulas y sensores." />
      {canCreate && <form className="panel" onSubmit={handleSubmit}>
        <h2 className="section-title">Nuevo activo</h2>
        {submitError && <div className="error">{submitError}</div>}
        <div className="form-grid">
          <FormField label="zoneId">
            <select value={form.zoneId} onChange={(event) => setForm({ ...form, zoneId: event.target.value })} required>
              <option value="">Seleccionar zona</option>
              {zoneRows.map((zone) => <option key={zone.id} value={zone.id}>{zone.name} ({zone.code})</option>)}
            </select>
          </FormField>
          <FormField label="code">
            <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
          </FormField>
          <FormField label="name">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </FormField>
          <FormField label="type">
            <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
              {ASSET_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </FormField>
          <FormField label="locationDescription">
            <input value={form.locationDescription} onChange={(event) => setForm({ ...form, locationDescription: event.target.value })} required />
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
            { key: 'id', header: 'id', render: (row) => <Link to={`/assets/${row.id}`}>{row.id}</Link> },
            { key: 'zoneId', header: 'zoneId' },
            { key: 'code', header: 'code' },
            { key: 'name', header: 'name' },
            { key: 'type', header: 'type', render: (row) => <StatusBadge value={row.type} /> },
            { key: 'locationDescription', header: 'locationDescription' },
            { key: 'enabled', header: 'enabled', render: (row) => <StatusBadge value={String(row.enabled)} /> },
            { key: 'createdAt', header: 'createdAt', render: (row) => formatDate(row.createdAt) },
          ]}
        />
      )}
    </div>
  );
}
