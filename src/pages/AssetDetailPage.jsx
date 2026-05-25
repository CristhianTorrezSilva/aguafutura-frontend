import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { assetsApi, consumptionsApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import AiSuggestionPanel from '../components/AiSuggestionPanel';
import DataTable from '../components/DataTable';
import EvidencePanel from '../components/EvidencePanel';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import ShortId from '../components/ShortId';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
import { toDatetimeLocalValue } from '../utils/dates';
import { apiErrorMessage } from '../utils/errors';
import { assetLabel, zoneLabel } from '../utils/display';
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
    readingDate: toDatetimeLocalValue(),
    value: '',
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
      setSubmitError(apiErrorMessage(err, 'No se pudo registrar consumo'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Activo hidrico" title={asset?.name || 'Detalle de activo'} description={asset?.code || `ID ${assetId}`} />
      <div className="panel">
        <h2 className="section-title">Ficha operativa</h2>
        <dl className="detail-list">
          <div><dt>ID</dt><dd><ShortId value={assetId} copyable /></dd></div>
          <div><dt>Codigo</dt><dd>{asset?.code || '-'}</dd></div>
          <div><dt>Nombre</dt><dd>{asset?.name || '-'}</dd></div>
          <div><dt>Tipo</dt><dd>{asset?.type || '-'}</dd></div>
          <div><dt>Zona</dt><dd>{asset?.zoneName || asset?.zoneCode ? [asset.zoneCode, asset.zoneName].filter(Boolean).join(' · ') : zoneLabel({ id: asset?.zoneId })}</dd></div>
          <div><dt>Ubicacion</dt><dd>{asset?.locationDescription || '-'}</dd></div>
        </dl>
      </div>
      {canCreateConsumption && <form className="panel" onSubmit={handleSubmit}>
        <h2 className="section-title">Nuevo consumo</h2>
        {submitError && <div className="error">{submitError}</div>}
        <div className="form-grid">
          <FormField label="Fecha de lectura">
            <input type="datetime-local" value={form.readingDate} onChange={(event) => setForm({ ...form, readingDate: event.target.value })} required />
          </FormField>
          <FormField label="Valor">
            <input type="number" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} placeholder="120" required />
          </FormField>
          <FormField label="Unidad">
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
            { key: 'readingDate', header: 'Fecha de lectura', render: (row) => formatDate(row.readingDate) },
            { key: 'value', header: 'Valor' },
            { key: 'unit', header: 'Unidad' },
            { key: 'createdAt', header: 'Creacion', render: (row) => formatDate(row.createdAt) },
          ]}
          emptyMessage="Este activo aun no tiene consumos registrados."
        />
      )}
      {canUseAi && <AiSuggestionPanel assetId={assetId} />}
      <EvidencePanel referenceType="ASSET" referenceId={assetId} referenceLabel={assetLabel(asset)} />
    </div>
  );
}
