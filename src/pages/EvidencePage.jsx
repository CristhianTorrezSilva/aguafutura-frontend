import { useEffect, useMemo, useState } from 'react';
import { evidenceApi } from '../api/services';
import EvidencePanel from '../components/EvidencePanel';
import ErrorState from '../components/ErrorState';
import FormField from '../components/FormField';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import { apiErrorMessage } from '../utils/errors';
import { asArray } from '../utils/format';

const referenceTypes = [
  { value: 'ASSET', label: 'Activo hidrico' },
  { value: 'INCIDENT', label: 'Incidencia' },
  { value: 'WORK_ORDER', label: 'Orden de trabajo' },
];

function labelFor(item) {
  return item?.displayName || item?.label || item?.name || item?.title || item?.code || item?.id || '-';
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function referenceOptionId(item) {
  const candidates = [item?.id, item?.referenceId, item?.uuid, item?.resourceId, item?.entityId, item?.value];
  return candidates.find(isUuid) || '';
}

export default function EvidencePage() {
  const [reference, setReference] = useState({ referenceType: 'ASSET', referenceId: '' });
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadOptions() {
      setLoadingOptions(true);
      setError('');
      setReference((current) => ({ ...current, referenceId: '' }));
      try {
        const response = await evidenceApi.referenceOptions(reference.referenceType);
        if (active) {
          setOptions(asArray(response.data));
        }
      } catch (err) {
        if (active) {
          setOptions([]);
          setError(apiErrorMessage(err, 'No se pudieron cargar las referencias.'));
        }
      } finally {
        if (active) {
          setLoadingOptions(false);
        }
      }
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, [reference.referenceType]);

  const selectedOption = useMemo(
    () => options.find((item) => referenceOptionId(item) === reference.referenceId),
    [options, reference.referenceId]
  );

  return (
    <div className="page">
      <PageHeader eyebrow="Trazabilidad" title="Evidencia" description="Adjunta fotos o documentos a activos, incidencias u ordenes sin copiar IDs manualmente." />
      <div className="panel">
        <h2 className="section-title">Referencia</h2>
        {error && <ErrorState message={error} />}
        <p className="helper-copy">Selecciona primero si la evidencia pertenece a un activo, una incidencia o una orden de trabajo. Luego elige el elemento relacionado. No necesitas copiar ningun ID.</p>
        <div className="form-grid">
          <FormField label="Tipo de referencia">
            <select
              value={reference.referenceType}
              onChange={(event) => setReference({ referenceType: event.target.value, referenceId: '' })}
            >
              {referenceTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </FormField>
          <FormField label="Selecciona el elemento">
            <select
              value={reference.referenceId}
              onChange={(event) => setReference({ ...reference, referenceId: event.target.value })}
              disabled={loadingOptions}
            >
              <option value="">{loadingOptions ? 'Cargando opciones...' : 'Seleccionar elemento relacionado'}</option>
              {options.map((item) => {
                const optionId = referenceOptionId(item);
                return (
                  <option key={optionId || labelFor(item)} value={optionId} disabled={!optionId}>
                    {labelFor(item)}
                  </option>
                );
              })}
            </select>
          </FormField>
        </div>
        {loadingOptions && <LoadingState message="Cargando referencias..." />}
      </div>

      {reference.referenceId && (
        <EvidencePanel
          referenceType={reference.referenceType}
          referenceId={reference.referenceId}
          referenceLabel={labelFor(selectedOption)}
        />
      )}
    </div>
  );
}
