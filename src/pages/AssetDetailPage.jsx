import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { assetsApi, consumptionsApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import AiSuggestionPanel from '../components/AiSuggestionPanel';
import DataTable from '../components/DataTable';
import ErrorState from '../components/ErrorState';
import EvidencePanel from '../components/EvidencePanel';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import ShortId from '../components/ShortId';
import { useAsync } from '../hooks/useAsync';
import { useRoles } from '../hooks/useRoles';
import { toDatetimeLocalValue } from '../utils/dates';
import { normalizeApiError } from '../utils/errors';
import { assetLabel, zoneLabel } from '../utils/display';
import { asArray, formatDate } from '../utils/format';
import { UNIT_TYPES } from '../utils/enums';

function validateConsumption(form) {
  if (!form.readingDate) return 'Ingresa la fecha de lectura.';
  if (form.value === '' || Number.isNaN(Number(form.value))) return 'Ingresa un valor numerico valido.';
  if (Number(form.value) < 0) return 'El valor no puede ser negativo.';
  if (!UNIT_TYPES.includes(form.unit)) return 'Selecciona una unidad valida.';
  return '';
}

function buildConsumptionPayload(form, assetId) {
  return {
    assetId,
    readingDate: form.readingDate,
    value: Number(form.value),
    unit: form.unit,
  };
}

function consumptionToForm(consumption, assetId) {
  return {
    assetId,
    readingDate: consumption.readingDate ? String(consumption.readingDate).slice(0, 16) : toDatetimeLocalValue(),
    value: consumption.value ?? '',
    unit: consumption.unit || 'CUBIC_METERS',
  };
}

export default function AssetDetailPage() {
  const { assetId } = useParams();
  const consumptions = useAsync(() => consumptionsApi.byAsset(assetId), [assetId]);
  const assets = useAsync(() => assetsApi.list(), []);
  const { can } = useRoles();
  const canCreateConsumption = can(PERMISSIONS.consumptionsCreate);
  const canEditConsumption = can(PERMISSIONS.consumptionsUpdate);
  const canUseAi = can(PERMISSIONS.aiUse);
  const asset = asArray(assets.data).find((item) => item.id === assetId);
  const [form, setForm] = useState({
    assetId,
    readingDate: toDatetimeLocalValue(),
    value: '',
    unit: 'CUBIC_METERS',
  });
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [editingConsumption, setEditingConsumption] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateConsumption(form);
    if (validationError) {
      setSubmitError({ message: validationError });
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await consumptionsApi.create(buildConsumptionPayload(form, assetId));
      setForm({ assetId, readingDate: toDatetimeLocalValue(), value: '', unit: 'CUBIC_METERS' });
      await consumptions.reload();
    } catch (err) {
      setSubmitError(normalizeApiError(err, 'No se pudo registrar consumo'));
    } finally {
      setSaving(false);
    }
  }

  function openEditConsumption(consumption) {
    setEditingConsumption(consumption);
    setEditForm(consumptionToForm(consumption, assetId));
    setEditError(null);
  }

  async function handleEditConsumption(event) {
    event.preventDefault();
    const validationError = validateConsumption(editForm);
    if (validationError) {
      setEditError({ message: validationError });
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      await consumptionsApi.update(editingConsumption.id || editingConsumption.consumptionId, buildConsumptionPayload(editForm, assetId));
      setEditingConsumption(null);
      setEditForm(null);
      await consumptions.reload();
    } catch (err) {
      setEditError(normalizeApiError(err, 'No se pudo actualizar consumo'));
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
        {submitError && <ErrorState {...submitError} />}
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
            ...(canEditConsumption ? [{
              key: 'actions',
              header: 'Acciones',
              render: (row) => <button className="button secondary" type="button" onClick={() => openEditConsumption(row)}>Editar</button>,
              searchable: false,
            }] : []),
          ]}
          emptyMessage="Este activo aun no tiene consumos registrados."
        />
      )}
      {editingConsumption && editForm && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Editar consumo">
            <form className="panel" onSubmit={handleEditConsumption}>
              <h2 className="section-title">Editar consumo</h2>
              {editError && <ErrorState {...editError} />}
              <div className="form-grid">
                <FormField label="Fecha de lectura">
                  <input type="datetime-local" value={editForm.readingDate} onChange={(event) => setEditForm({ ...editForm, readingDate: event.target.value })} required />
                </FormField>
                <FormField label="Valor">
                  <input type="number" value={editForm.value} onChange={(event) => setEditForm({ ...editForm, value: event.target.value })} required />
                </FormField>
                <FormField label="Unidad">
                  <select value={editForm.unit} onChange={(event) => setEditForm({ ...editForm, unit: event.target.value })}>
                    {UNIT_TYPES.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="actions">
                <button className="button secondary" type="button" onClick={() => setEditingConsumption(null)} disabled={saving}>Cancelar</button>
                <button className="button" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {canUseAi && <AiSuggestionPanel assetId={assetId} />}
      <EvidencePanel referenceType="ASSET" referenceId={assetId} referenceLabel={assetLabel(asset)} />
    </div>
  );
}
