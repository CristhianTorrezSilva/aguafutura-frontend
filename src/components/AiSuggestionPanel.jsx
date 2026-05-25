import { useState } from 'react';
import { aiApi } from '../api/services';
import { valueOrDash } from '../utils/format';
import StatusBadge from './StatusBadge';

export default function AiSuggestionPanel({ assetId, incidentId }) {
  const [suggestion, setSuggestion] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  async function loadAssetSuggestion() {
    setLoading('assetSuggestion');
    setError('');
    try {
      const response = await aiApi.assetSuggestions(assetId);
      setSuggestion(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo obtener sugerencia de activo');
    } finally {
      setLoading('');
    }
  }

  async function loadIncidentSuggestion() {
    setLoading('incidentSuggestion');
    setError('');
    try {
      const response = await aiApi.incidentSuggestions(incidentId);
      setSuggestion(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo obtener sugerencia de incidente');
    } finally {
      setLoading('');
    }
  }

  async function loadAssetAnalysis() {
    setLoading('assetAnalysis');
    setError('');
    try {
      const response = await aiApi.analyzeAsset(assetId);
      setAnalysis(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo analizar activo');
    } finally {
      setLoading('');
    }
  }

  return (
    <div className="panel">
      <h2 className="section-title">AI</h2>
      {error && <div className="error">{error}</div>}
      <div className="actions">
        {assetId && (
          <>
            <button className="button secondary" type="button" onClick={loadAssetSuggestion} disabled={Boolean(loading)}>
              {loading === 'assetSuggestion' ? 'Consultando...' : 'Suggestion activo'}
            </button>
            <button className="button secondary" type="button" onClick={loadAssetAnalysis} disabled={Boolean(loading)}>
              {loading === 'assetAnalysis' ? 'Analizando...' : 'Analyze activo'}
            </button>
          </>
        )}
        {incidentId && (
          <button className="button secondary" type="button" onClick={loadIncidentSuggestion} disabled={Boolean(loading)}>
            {loading === 'incidentSuggestion' ? 'Consultando...' : 'Suggestion incidente'}
          </button>
        )}
      </div>

      {suggestion && (
        <dl className="detail-list">
          <div><dt>severitySuggestion</dt><dd><StatusBadge value={suggestion.severitySuggestion} /></dd></div>
          <div><dt>prioritySuggestion</dt><dd><StatusBadge value={suggestion.prioritySuggestion} /></dd></div>
          <div><dt>aiUsed</dt><dd>{valueOrDash(suggestion.aiUsed)}</dd></div>
          <div><dt>fallbackUsed</dt><dd>{valueOrDash(suggestion.fallbackUsed)}</dd></div>
          <div><dt>explanation</dt><dd>{valueOrDash(suggestion.explanation)}</dd></div>
        </dl>
      )}

      {analysis && (
        <dl className="detail-list">
          <div><dt>isAnomaly</dt><dd>{valueOrDash(analysis.isAnomaly)}</dd></div>
          <div><dt>analysis</dt><dd>{valueOrDash(analysis.analysis)}</dd></div>
          <div><dt>recommendation</dt><dd>{valueOrDash(analysis.recommendation)}</dd></div>
        </dl>
      )}
    </div>
  );
}
