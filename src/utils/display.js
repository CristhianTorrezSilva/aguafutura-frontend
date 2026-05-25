import { formatShortId } from './ids';

export function zoneLabel(zone) {
  if (!zone) return '-';
  const code = zone.code || zone.zoneCode;
  const name = zone.name || zone.zoneName || zone.displayName;
  if (code && name) return `${code} · ${name}`;
  return name || code || formatShortId(zone.id || zone.zoneId);
}

export function assetLabel(asset) {
  if (!asset) return '-';
  const code = asset.assetCode || asset.code;
  const name = asset.assetName || asset.name || asset.displayName;
  if (code && name) return `${code} · ${name}`;
  return asset.displayName || name || code || formatShortId(asset.id || asset.assetId);
}

export function incidentLabel(incident) {
  if (!incident) return '-';
  const title = incident.incidentTitle || incident.title || incident.displayName;
  const parts = [title, incident.severity, incident.status].filter(Boolean);
  return parts.length ? parts.join(' · ') : formatShortId(incident.id || incident.incidentId);
}

export function workOrderLabel(workOrder) {
  if (!workOrder) return '-';
  const title = workOrder.workOrderCode || workOrder.code || workOrder.title || 'Orden de trabajo';
  const asset = workOrder.assetName || workOrder.assetCode || workOrder.displayName;
  return [title, workOrder.status, asset].filter(Boolean).join(' · ');
}

export function tenantLabel({ tenantName, tenantShortId, tenantId }) {
  return tenantName || tenantShortId || formatShortId(tenantId);
}
