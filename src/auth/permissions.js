export const ROLES = {
  ADMIN: 'ADMIN',
  COORDINATOR: 'COORDINATOR',
  TECHNICIAN: 'TECHNICIAN',
  AUDITOR: 'AUDITOR',
};

export const PERMISSIONS = {
  dashboardRead: [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.AUDITOR],
  zonesRead: [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.AUDITOR],
  zonesCreate: [ROLES.ADMIN, ROLES.COORDINATOR],
  assetsRead: [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.AUDITOR],
  assetsCreate: [ROLES.ADMIN, ROLES.COORDINATOR],
  consumptionsRead: [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.AUDITOR],
  consumptionsCreate: [ROLES.ADMIN, ROLES.COORDINATOR],
  incidentsRead: [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.AUDITOR],
  incidentsCreate: [ROLES.ADMIN, ROLES.COORDINATOR],
  workOrdersRead: [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.TECHNICIAN, ROLES.AUDITOR],
  workOrdersCreate: [ROLES.ADMIN, ROLES.COORDINATOR],
  evidenceRead: [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.TECHNICIAN, ROLES.AUDITOR],
  evidenceCreate: [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.TECHNICIAN],
  aiUse: [ROLES.ADMIN, ROLES.COORDINATOR],
};

export function hasAnyRole(userRoles, allowedRoles) {
  if (!allowedRoles?.length) {
    return true;
  }

  return userRoles.some((role) => allowedRoles.includes(role));
}
