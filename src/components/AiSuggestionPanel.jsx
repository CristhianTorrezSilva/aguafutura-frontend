import { useState } from 'react';
import { aiApi } from '../api/services';
import { apiErrorMessage } from '../utils/errors';
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
      setError(apiErrorMessage(err, 'No se pudo obtener sugerencia de activo'));
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
      setError(apiErrorMessage(err, 'No se pudo obtener sugerencia de incidente'));
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
      setError(apiErrorMessage(err, 'No se pudo analizar activo'));
    } finally {
      setLoading('');
    }
  }

  return (
    <div className="panel">
      <h2 className="section-title">Asistente operativo IA</h2>
      {error && <div className="error">{error}</div>}
      <div className="actions">
        {assetId && (
          <>
            <button className="button secondary" type="button" onClick={loadAssetSuggestion} disabled={Boolean(loading)}>
              {loading === 'assetSuggestion' ? 'Consultando...' : 'Sugerir por activo'}
            </button>
            <button className="button secondary" type="button" onClick={loadAssetAnalysis} disabled={Boolean(loading)}>
              {loading === 'assetAnalysis' ? 'Analizando...' : 'Analizar activo'}
            </button>
          </>
        )}
        {incidentId && (
          <button className="button secondary" type="button" onClick={loadIncidentSuggestion} disabled={Boolean(loading)}>
            {loading === 'incidentSuggestion' ? 'Consultando...' : 'Sugerir por incidencia'}
          </button>
        )}
      </div>

      {suggestion && (
        <div className="ai-result">
          <div className="actions">
            <StatusBadge value={suggestion.aiUsed ? 'IA activa' : 'IA no usada'} />
            <StatusBadge value={suggestion.fallbackUsed ? 'Fallback deterministico' : 'Sin fallback'} />
          </div>
          <dl className="detail-list">
            <div><dt>Severidad sugerida</dt><dd><StatusBadge value={suggestion.severitySuggestion} /></dd></div>
            <div><dt>Prioridad sugerida</dt><dd><StatusBadge value={suggestion.prioritySuggestion} /></dd></div>
          </dl>
          <p className="ai-copy">{valueOrDash(suggestion.explanation)}</p>
        </div>
      )}

      {analysis && (
        <div className="ai-result">
          <dl className="detail-list">
            <div><dt>Anomalia</dt><dd>{valueOrDash(analysis.isAnomaly)}</dd></div>
          </dl>
          <p className="ai-copy">{valueOrDash(analysis.analysis)}</p>
          <p className="ai-copy">{valueOrDash(analysis.recommendation)}</p>
        </div>
      )}
    </div>
  );
}
