import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { assetsApi, consumptionsApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import AiSuggestionPanel from '../components/AiSuggestionPanel';
import DataTable from '../components/DataTable';
import EvidencePanel from '../components/EvidencePanel';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
import { asArray, formatDate } from '../utils/format';
import { UNIT_TYPES } from '../utils/enums';

export default function AssetDetailPage() {
  const { assetId } = useParams();
  const consumptions = useAsync(() => consumptionsApi.byAsset(assetId), [assetId]);
  const assets = useAsync(() => assetsApi.list(), []);
  const { can } = useRoles();
  const canCreateConsumption = can(PERMISSIONS.consumptionsCreate);
  const canUseAi = can(PERMISSIONS.aiUse);
  const asset = asArray(assets.data).find((item) => item.id === assetId);
  const [form, setForm] = useState({
    assetId,
    readingDate: '2026-05-25T09:00:00',
    value: 120,
    unit: 'CUBIC_METERS',
  });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSubmitError('');
    try {
      await consumptionsApi.create({ ...form, value: Number(form.value), assetId });
      await consumptions.reload();
    } catch (err) {
      setSubmitError(err.response?.data?.message || err.message || 'No se pudo registrar consumo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="Detalle de activo" description={assetId} />
      <div className="panel">
        <h2 className="section-title">Activo seleccionado</h2>
        <dl className="detail-list">
          <div><dt>id</dt><dd>{assetId}</dd></div>
          <div><dt>code</dt><dd>{asset?.code || '-'}</dd></div>
          <div><dt>name</dt><dd>{asset?.name || '-'}</dd></div>
          <div><dt>type</dt><dd>{asset?.type || '-'}</dd></div>
          <div><dt>zoneId</dt><dd>{asset?.zoneId || '-'}</dd></div>
          <div><dt>locationDescription</dt><dd>{asset?.locationDescription || '-'}</dd></div>
        </dl>
      </div>
      {canCreateConsumption && <form className="panel" onSubmit={handleSubmit}>
        <h2 className="section-title">Nuevo consumo</h2>
        {submitError && <div className="error">{submitError}</div>}
        <div className="form-grid">
          <FormField label="readingDate">
            <input type="datetime-local" value={form.readingDate} onChange={(event) => setForm({ ...form, readingDate: event.target.value })} required />
          </FormField>
          <FormField label="value">
            <input type="number" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} required />
          </FormField>
          <FormField label="unit">
            <select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })}>
              {UNIT_TYPES.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
            </select>
          </FormField>
        </div>
        <div className="actions">
          <button className="button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Registrar consumo'}</button>
        </div>
      </form>}

      {consumptions.loading ? <div className="loading">Cargando consumos...</div> : consumptions.error ? <div className="error">{consumptions.error}</div> : (
        <DataTable
          rows={asArray(consumptions.data)}
          columns={[
            { key: 'readingDate', header: 'readingDate', render: (row) => formatDate(row.readingDate) },
            { key: 'value', header: 'value' },
            { key: 'unit', header: 'unit' },
            { key: 'createdAt', header: 'createdAt', render: (row) => formatDate(row.createdAt) },
          ]}
        />
      )}
      {canUseAi && <AiSuggestionPanel assetId={assetId} />}
      <EvidencePanel referenceType="ASSET" referenceId={assetId} />
    </div>
  );
}
