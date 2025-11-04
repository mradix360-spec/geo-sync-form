import { useAuth } from '@/contexts/AuthContext';

export const useRole = () => {
  const { user } = useAuth();
  
  const hasRole = (role: string | string[]) => {
    if (!user?.roles) return false;
    const roles = Array.isArray(role) ? role : [role];
    return user.roles.some(r => roles.includes(r));
  };

  const isSuperAdmin = () => hasRole('super_admin');
  const isAdmin = () => hasRole(['super_admin', 'org_admin']);
  const isAnalyst = () => hasRole('analyst');
  const isFieldUser = () => hasRole('field_staff');
  const canCreateForms = () => hasRole(['super_admin', 'org_admin', 'analyst']);
  const canAssignForms = () => hasRole(['super_admin', 'org_admin', 'analyst']);
  const canPublishForms = () => hasRole(['super_admin', 'org_admin', 'analyst']);
  const canCreateMaps = () => hasRole(['super_admin', 'org_admin', 'analyst']);
  const canCreateDashboards = () => hasRole(['super_admin', 'org_admin', 'analyst']);
  const canViewMaps = () => hasRole(['super_admin', 'org_admin', 'analyst']);
  const canViewDashboards = () => hasRole(['super_admin', 'org_admin', 'analyst']);
  const canManageAssets = () => hasRole(['super_admin', 'org_admin', 'analyst']);
  const canCreateInspections = () => hasRole(['super_admin', 'org_admin', 'analyst']);
  const canPerformInspections = () => hasRole(['field_staff', 'analyst', 'org_admin', 'super_admin']);

  return {
    hasRole,
    isSuperAdmin,
    isAdmin,
    isAnalyst,
    isFieldUser,
    canCreateForms,
    canAssignForms,
    canPublishForms,
    canCreateMaps,
    canCreateDashboards,
    canViewMaps,
    canViewDashboards,
    canManageAssets,
    canCreateInspections,
    canPerformInspections,
    roles: user?.roles || []
  };
};
