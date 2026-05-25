import { useState } from 'react';
import { zonesApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import DataTable from '../components/DataTable';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
import { asArray, formatDate } from '../utils/format';

export default function ZonesPage() {
  const { data, loading, error, reload } = useAsync(() => zonesApi.list(), []);
  const { can } = useRoles();
  const canCreate = can(PERMISSIONS.zonesCreate);
  const [form, setForm] = useState({ code: '', name: '' });
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);
  const rows = asArray(data);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSubmitError('');
    try {
      await zonesApi.create(form);
      setForm({ code: '', name: '' });
      await reload();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'No se pudo crear la zona');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="Zonas" description="Consulta y creacion de zonas operativas." />
      {canCreate && <form className="panel" onSubmit={handleSubmit}>
        <h2 className="section-title">Nueva zona</h2>
        {submitError && <div className="error">{submitError}</div>}
        <div className="form-grid">
          <FormField label="Code">
            <input value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} required />
          </FormField>
          <FormField label="Name">
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </FormField>
        </div>
        <div className="actions">
          <button className="button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear zona'}</button>
        </div>
      </form>}

      {loading ? <div className="loading">Cargando zonas...</div> : error ? <div className="error">{error}</div> : (
        <DataTable
          rows={rows}
          columns={[
            { key: 'id', header: 'id' },
            { key: 'code', header: 'code' },
            { key: 'name', header: 'name' },
            { key: 'enabled', header: 'enabled', render: (row) => <StatusBadge value={String(row.enabled)} /> },
            { key: 'createdAt', header: 'createdAt', render: (row) => formatDate(row.createdAt) },
          ]}
        />
      )}
    </div>
  );
}
