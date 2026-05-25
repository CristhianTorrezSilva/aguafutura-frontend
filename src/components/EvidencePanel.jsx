import { useEffect, useMemo, useState } from 'react';
import { evidenceApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import { useRoles } from '../hooks/useRoles';
import { normalizeApiError } from '../utils/errors';
import { asArray, formatDate, valueOrDash } from '../utils/format';
import DataTable from './DataTable';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import FormField from './FormField';
import LoadingState from './LoadingState';
import ShortId from './ShortId';

const referenceTypeLabels = {
  ASSET: 'Activo hidrico',
  INCIDENT: 'Incidencia',
  WORK_ORDER: 'Orden de trabajo',
};

export default function EvidencePanel({ referenceType, referenceId, referenceLabel }) {
  const { can } = useRoles();
  const canUpload = can(PERMISSIONS.evidenceCreate);
  const [file, setFile] = useState(null);
  const [description, setDescription] = useState('');
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  useEffect(() => {
    setRows([]);
    setLoaded(false);
    setError('');
    loadEvidence();
    // loadEvidence is intentionally kept local to preserve the existing reload flow.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceType, referenceId]);

  async function loadEvidence() {
    if (!referenceType || !referenceId) return;
    setLoading(true);
    setError('');
    try {
      const response = await evidenceApi.list(referenceType, referenceId);
      setRows(asArray(response.data));
      setLoaded(true);
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo cargar evidencia.'));
    } finally {
      setLoading(false);
    }
  }

  async function uploadEvidence(event) {
    event.preventDefault();
    if (!file) return;
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('referenceType', referenceType);
      formData.append('referenceId', referenceId);
      formData.append('file', file);
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      await evidenceApi.upload(formData);
      setFile(null);
      setDescription('');
      await loadEvidence();
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo subir evidencia.'));
    } finally {
      setSaving(false);
    }
  }

  async function downloadEvidence(row) {
    const evidenceId = row.id || row.evidenceId;
    if (!evidenceId) {
      setError({ message: 'La evidencia no tiene ID de descarga.' });
      return;
    }

    try {
      const response = await evidenceApi.download(evidenceId);
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = row.fileName || row.filename || `evidence-${evidenceId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo descargar evidencia.'));
    }
  }

  return (
    <div className="panel">
      <h2 className="section-title">Evidencia</h2>
      {error && <ErrorState {...(typeof error === 'string' ? { message: error } : error)} />}

      {canUpload && (
        <form onSubmit={uploadEvidence}>
          <div className="form-grid">
            <FormField label="Tipo de referencia">
              <input value={referenceTypeLabels[referenceType] || referenceType} readOnly />
            </FormField>
            <FormField label="Elemento relacionado" help="El ID se usa internamente; no necesitas copiarlo.">
              <input value={referenceLabel || ''} readOnly />
            </FormField>
            <FormField label="Archivo">
              <input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </FormField>
            <FormField label="Descripcion opcional">
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Detalle breve del archivo adjunto" />
            </FormField>
          </div>
          {previewUrl && <div className="actions"><img className="preview" src={previewUrl} alt="Preview evidencia" /></div>}
          <div className="actions">
            <button className="button" type="submit" disabled={saving || !file || !referenceId}>
              {saving ? 'Subiendo evidencia...' : 'Subir evidencia'}
            </button>
          </div>
        </form>
      )}

      <div className="actions">
        <button className="button secondary" type="button" onClick={loadEvidence} disabled={loading || !referenceId}>
          {loading ? 'Cargando...' : 'Listar evidencias'}
        </button>
      </div>

      {loading && <LoadingState message="Cargando evidencia..." />}
      {!loading && loaded && !rows.length && <EmptyState message="Sin evidencias para esta referencia" />}
      {!loading && Boolean(rows.length) && (
        <DataTable
          rows={rows}
          columns={[
            { key: 'id', header: 'ID', render: (row) => <ShortId value={row.id || row.evidenceId} />, searchable: false },
            { key: 'referenceType', header: 'Tipo', render: (row) => referenceTypeLabels[row.referenceType] || valueOrDash(row.referenceType) },
            { key: 'referenceId', header: 'Referencia', render: (row) => referenceLabel || <ShortId value={row.referenceId} /> },
            { key: 'fileName', header: 'Archivo', render: (row) => valueOrDash(row.fileName || row.filename) },
            { key: 'description', header: 'Descripcion', render: (row) => valueOrDash(row.description) },
            { key: 'createdAt', header: 'Creacion', render: (row) => formatDate(row.createdAt) },
            { key: 'download', header: 'Accion', render: (row) => <button className="button secondary" type="button" onClick={() => downloadEvidence(row)}>Descargar</button>, searchable: false },
          ]}
        />
      )}
    </div>
  );
}
