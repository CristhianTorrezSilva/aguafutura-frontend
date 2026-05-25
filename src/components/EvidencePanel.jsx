import { useMemo, useState } from 'react';
import { evidenceApi } from '../api/services';
import { PERMISSIONS } from '../auth/permissions';
import { useRoles } from '../hooks/useRoles';
import { asArray, formatDate, valueOrDash } from '../utils/format';
import DataTable from './DataTable';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import FormField from './FormField';
import LoadingState from './LoadingState';

export default function EvidencePanel({ referenceType, referenceId }) {
  const { can } = useRoles();
  const canUpload = can(PERMISSIONS.evidenceCreate);
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  async function loadEvidence() {
    if (!referenceType || !referenceId) return;
    setLoading(true);
    setError('');
    try {
      const response = await evidenceApi.list(referenceType, referenceId);
      setRows(asArray(response.data));
      setLoaded(true);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo cargar evidencia');
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
      await evidenceApi.upload(formData);
      setFile(null);
      await loadEvidence();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo subir evidencia');
    } finally {
      setSaving(false);
    }
  }

  async function downloadEvidence(row) {
    if (!row.url) {
      setError('La evidencia no tiene URL de descarga devuelta por backend');
      return;
    }

    try {
      const response = await evidenceApi.download(row.url);
      const blobUrl = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = row.fileName || row.filename || `evidence-${row.id || 'file'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo descargar evidencia');
    }
  }

  return (
    <div className="panel">
      <h2 className="section-title">Evidencia {referenceType}</h2>
      {error && <ErrorState message={error} />}

      {canUpload && (
        <form onSubmit={uploadEvidence}>
          <div className="form-grid">
            <FormField label="referenceType">
              <input value={referenceType} readOnly />
            </FormField>
            <FormField label="referenceId">
              <input value={referenceId || ''} readOnly />
            </FormField>
            <FormField label="file">
              <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            </FormField>
          </div>
          {previewUrl && <div className="actions"><img className="preview" src={previewUrl} alt="Preview evidencia" /></div>}
          <div className="actions">
            <button className="button" type="submit" disabled={saving || !file || !referenceId}>
              {saving ? 'Subiendo...' : 'Subir imagen'}
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
            { key: 'id', header: 'id', render: (row) => valueOrDash(row.id || row.evidenceId) },
            { key: 'referenceType', header: 'referenceType' },
            { key: 'referenceId', header: 'referenceId' },
            { key: 'fileName', header: 'fileName', render: (row) => valueOrDash(row.fileName || row.filename) },
            { key: 'url', header: 'url' },
            { key: 'createdAt', header: 'createdAt', render: (row) => formatDate(row.createdAt) },
            { key: 'download', header: 'download', render: (row) => <button className="button secondary" type="button" onClick={() => downloadEvidence(row)}>Descargar</button> },
          ]}
        />
      )}
    </div>
  );
}
