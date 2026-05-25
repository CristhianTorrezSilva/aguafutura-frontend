import { useState } from 'react';
import { aiApi, assetsApi, incidentsApi } from '../api/services';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useAsync } from '../hooks/useAsync';
import { apiErrorMessage } from '../utils/errors';
import { assetLabel, incidentLabel } from '../utils/display';
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
      setError(apiErrorMessage(err, 'No se pudo obtener sugerencia AI'));
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
      setError(apiErrorMessage(err, 'No se pudo analizar activo'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <PageHeader eyebrow="Inteligencia operacional" title="Asistente IA" description="Sugerencias y analisis generados por el backend para apoyar decisiones operativas." />
      {error && <div className="error">{error}</div>}
      <div className="grid">
        <div className="panel">
          <h2 className="section-title">Por activo</h2>
          <FormField label="Activo">
            <select value={assetId} onChange={(event) => setAssetId(event.target.value)}>
              <option value="">Seleccionar activo</option>
              {asArray(assets.data).map((asset) => <option key={asset.id} value={asset.id}>{assetLabel(asset)}</option>)}
            </select>
          </FormField>
          <div className="actions">
            <button className="button" type="button" disabled={!assetId || loading} onClick={() => fetchSuggestion('asset')}>
              Sugerir por activo
            </button>
            <button className="button secondary" type="button" disabled={!assetId || loading} onClick={fetchAnalysis}>
              Analizar activo
            </button>
          </div>
        </div>

        <div className="panel">
          <h2 className="section-title">Por incidente</h2>
          <FormField label="Incidencia">
            <select value={incidentId} onChange={(event) => setIncidentId(event.target.value)}>
              <option value="">Seleccionar incidente</option>
              {asArray(incidents.data).map((incident) => <option key={incident.id} value={incident.id}>{incidentLabel(incident)}</option>)}
            </select>
          </FormField>
          <div className="actions">
            <button className="button" type="button" disabled={!incidentId || loading} onClick={() => fetchSuggestion('incident')}>
              Sugerir por incidencia
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="panel">
          <h2 className="section-title">Resultado operativo</h2>
          <div className="ai-result">
            <div className="actions">
              <StatusBadge value={result.aiUsed ? 'IA activa' : 'IA no usada'} />
              <StatusBadge value={result.fallbackUsed ? 'Fallback deterministico' : 'Sin fallback'} />
            </div>
            <dl className="detail-list">
              <div><dt>Severidad sugerida</dt><dd><StatusBadge value={result.severitySuggestion} /></dd></div>
              <div><dt>Prioridad sugerida</dt><dd><StatusBadge value={result.prioritySuggestion} /></dd></div>
            </dl>
            <p className="ai-copy">{valueOrDash(result.explanation)}</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="panel">
          <h2 className="section-title">Analisis del activo</h2>
          <div className="ai-result">
            <dl className="detail-list">
              <div><dt>Anomalia</dt><dd>{valueOrDash(analysis.isAnomaly)}</dd></div>
            </dl>
            <p className="ai-copy">{valueOrDash(analysis.analysis)}</p>
            <p className="ai-copy">{valueOrDash(analysis.recommendation)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
