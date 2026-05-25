import { Navigate, Route, Routes } from 'react-router-dom';
import { PERMISSIONS } from '../auth/permissions';
import ProtectedRoute from '../auth/ProtectedRoute';
import RoleGuard from '../auth/RoleGuard';
import AppLayout from '../components/AppLayout';
import AiSuggestionsPage from '../pages/AiSuggestionsPage';
import AssetDetailPage from '../pages/AssetDetailPage';
import AssetsPage from '../pages/AssetsPage';
import DashboardPage from '../pages/DashboardPage';
import EvidencePage from '../pages/EvidencePage';
import ForbiddenPage from '../pages/ForbiddenPage';
import IncidentsPage from '../pages/IncidentsPage';
import LoginPage from '../pages/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProfilePage from '../pages/ProfilePage';
import WorkOrdersPage from '../pages/WorkOrdersPage';
import ZonesPage from '../pages/ZonesPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forbidden" element={<ForbiddenPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<RoleGuard allowedRoles={PERMISSIONS.dashboardRead}><DashboardPage /></RoleGuard>} />
          <Route path="zones" element={<RoleGuard allowedRoles={PERMISSIONS.zonesRead}><ZonesPage /></RoleGuard>} />
          <Route path="assets" element={<RoleGuard allowedRoles={PERMISSIONS.assetsRead}><AssetsPage /></RoleGuard>} />
          <Route path="assets/:assetId" element={<RoleGuard allowedRoles={PERMISSIONS.assetsRead}><AssetDetailPage /></RoleGuard>} />
          <Route path="incidents" element={<RoleGuard allowedRoles={PERMISSIONS.incidentsRead}><IncidentsPage /></RoleGuard>} />
          <Route path="work-orders" element={<RoleGuard allowedRoles={PERMISSIONS.workOrdersRead}><WorkOrdersPage /></RoleGuard>} />
          <Route path="evidence" element={<RoleGuard allowedRoles={PERMISSIONS.evidenceRead}><EvidencePage /></RoleGuard>} />
          <Route
            path="ai-suggestions"
            element={
              <RoleGuard allowedRoles={PERMISSIONS.aiUse}>
                <AiSuggestionsPage />
              </RoleGuard>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
}
