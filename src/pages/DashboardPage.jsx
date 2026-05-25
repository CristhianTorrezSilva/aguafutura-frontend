import { analyticsApi } from '../api/services';
import PageHeader from '../components/PageHeader';
import { useAsync } from '../hooks/useAsync';

function Breakdown({ title, data }) {
  const entries = Object.entries(data || {});

  return (
    <div className="panel">
      <h2 className="section-title">{title}</h2>
      {entries.length ? (
        <div className="detail-list">
          {entries.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">Sin datos</div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error } = useAsync(() => analyticsApi.dashboard(), []);

  if (loading) return <div className="page"><div className="loading">Cargando dashboard...</div></div>;

  return (
    <div className="page">
      <PageHeader title="Dashboard" description="Resumen operativo de AguaFutura AI." />
      {error && <div className="error">{error}</div>}

      <div className="grid">
        <div className="metric-card"><span>Total assets</span><strong>{data?.totalAssets ?? 0}</strong></div>
        <div className="metric-card"><span>Consumo total</span><strong>{data?.totalConsumptionVolume ?? 0}</strong></div>
        <div className="metric-card"><span>Incidentes</span><strong>{data?.totalIncidents ?? 0}</strong></div>
        <div className="metric-card"><span>Ordenes</span><strong>{data?.totalWorkOrders ?? 0}</strong></div>
        <div className="metric-card"><span>Evidencias</span><strong>{data?.totalEvidence ?? 0}</strong></div>
      </div>

      <div className="grid">
        <Breakdown title="Incidentes por severidad" data={data?.incidentsBySeverity} />
        <Breakdown title="Incidentes por estado" data={data?.incidentsByStatus} />
        <Breakdown title="Ordenes por estado" data={data?.workOrdersByStatus} />
      </div>
    </div>
  );
}
