import { useState } from 'react';
import { aiApi, assetsApi, incidentsApi } from '../api/services';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { asArray, valueOrDash } from '../utils/format';

export default function AiSuggestionsPage() {
  const assets = useAsync(() => assetsApi.list(), []);
  const incidents = useAsync(() => incidentsApi.list(), []);
  const [assetId, setAssetId] = useState('');
  const [incidentId, setIncidentId] = useState('');
  const [result, setResult] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchSuggestion(type) {
    setLoading(true);
    setError('');
    try {
      const response = type === 'asset'
        ? await aiApi.assetSuggestions(assetId)
        : await aiApi.incidentSuggestions(incidentId);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo obtener sugerencia AI');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAnalysis() {
    setLoading(true);
    setError('');
    try {
      const response = await aiApi.analyzeAsset(assetId);
      setAnalysis(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo analizar activo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <PageHeader title="AI Suggestions" description="Sugerencias reales desde el backend." />
      {error && <div className="error">{error}</div>}
      <div className="grid">
        <div className="panel">
          <h2 className="section-title">Por activo</h2>
          <FormField label="assetId">
            <select value={assetId} onChange={(event) => setAssetId(event.target.value)}>
              <option value="">Seleccionar activo</option>
              {asArray(assets.data).map((asset) => <option key={asset.id} value={asset.id}>{asset.name} ({asset.code})</option>)}
            </select>
          </FormField>
          <div className="actions">
            <button className="button" type="button" disabled={!assetId || loading} onClick={() => fetchSuggestion('asset')}>
              Consultar activo
            </button>
            <button className="button secondary" type="button" disabled={!assetId || loading} onClick={fetchAnalysis}>
              Analyze activo
            </button>
          </div>
        </div>

        <div className="panel">
          <h2 className="section-title">Por incidente</h2>
          <FormField label="incidentId">
            <select value={incidentId} onChange={(event) => setIncidentId(event.target.value)}>
              <option value="">Seleccionar incidente</option>
              {asArray(incidents.data).map((incident) => <option key={incident.id} value={incident.id}>{incident.title}</option>)}
            </select>
          </FormField>
          <div className="actions">
            <button className="button" type="button" disabled={!incidentId || loading} onClick={() => fetchSuggestion('incident')}>
              Consultar incidente
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="panel">
          <h2 className="section-title">Resultado</h2>
          <dl className="detail-list">
            <div><dt>severitySuggestion</dt><dd><StatusBadge value={result.severitySuggestion} /></dd></div>
            <div><dt>prioritySuggestion</dt><dd><StatusBadge value={result.prioritySuggestion} /></dd></div>
            <div><dt>aiUsed</dt><dd>{valueOrDash(result.aiUsed)}</dd></div>
            <div><dt>fallbackUsed</dt><dd>{valueOrDash(result.fallbackUsed)}</dd></div>
            <div><dt>explanation</dt><dd>{valueOrDash(result.explanation)}</dd></div>
          </dl>
        </div>
      )}

      {analysis && (
        <div className="panel">
          <h2 className="section-title">Analyze asset</h2>
          <dl className="detail-list">
            <div><dt>isAnomaly</dt><dd>{valueOrDash(analysis.isAnomaly)}</dd></div>
            <div><dt>analysis</dt><dd>{valueOrDash(analysis.analysis)}</dd></div>
            <div><dt>recommendation</dt><dd>{valueOrDash(analysis.recommendation)}</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}
