import { analyticsApi } from '../api/services';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import PageHeader from '../components/PageHeader';
import { useAsync } from '../hooks/useAsync';

function Breakdown({ title, data }) {
  const entries = Object.entries(data || {});
  const max = Math.max(...entries.map(([, value]) => Number(value) || 0), 0);

  return (
    <div className="panel">
      <h2 className="section-title">{title}</h2>
      {entries.length ? (
        <div className="breakdown-list">
          {entries.map(([key, value]) => (
            <div className="breakdown-row" key={key}>
              <strong>{key}</strong>
              <div className="breakdown-bar">
                <span style={{ width: `${max ? ((Number(value) || 0) / max) * 100 : 0}%` }} />
              </div>
              <span className="badge">{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message="El backend aun no devuelve datos para este desglose." />
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error } = useAsync(() => analyticsApi.dashboard(), []);

  if (loading) return <div className="page"><LoadingState message="Cargando centro operativo..." /></div>;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Operaciones"
        badge="Live"
        title="Centro operativo hidrico"
        description="Resumen ejecutivo de infraestructura, consumo, incidencias, ordenes y evidencia operacional."
      />
      {error && <ErrorState message={error} />}

      <section className="command-hero">
        <h2>Vista municipal unificada</h2>
        <p>Monitorea activos, respuesta operativa e inteligencia aplicada desde una sola consola conectada al backend real.</p>
      </section>

      <div className="grid">
        <div className="metric-card"><span>Activos</span><strong>{data?.totalAssets ?? 0}</strong><small>Infraestructura registrada</small></div>
        <div className="metric-card"><span>Consumo total</span><strong>{data?.totalConsumptionVolume ?? 0}</strong><small>Volumen consolidado</small></div>
        <div className="metric-card"><span>Incidencias</span><strong>{data?.totalIncidents ?? 0}</strong><small>Eventos operativos</small></div>
        <div className="metric-card"><span>Ordenes</span><strong>{data?.totalWorkOrders ?? 0}</strong><small>Trabajo planificado</small></div>
        <div className="metric-card"><span>Evidencias</span><strong>{data?.totalEvidence ?? 0}</strong><small>Archivos trazables</small></div>
      </div>

      <div className="grid">
        <Breakdown title="Incidentes por severidad" data={data?.incidentsBySeverity} />
        <Breakdown title="Incidentes por estado" data={data?.incidentsByStatus} />
        <Breakdown title="Ordenes por estado" data={data?.workOrdersByStatus} />
      </div>
    </div>
  );
}
