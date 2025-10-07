import { useAuth } from '@/contexts/AuthContext';

export const useRole = () => {
  const { user } = useAuth();
  
  const hasRole = (role: string | string[]) => {
    if (!user?.roles) return false;
    const roles = Array.isArray(role) ? role : [role];
    return user.roles.some(r => roles.includes(r));
  };

  const isAdmin = () => hasRole(['super_admin', 'org_admin']);
  const isAnalyst = () => hasRole('analyst');
  const isFieldUser = () => hasRole('field_staff');
  const canCreateForms = () => hasRole(['super_admin', 'org_admin', 'analyst']);
  const canAssignForms = () => hasRole(['super_admin', 'org_admin', 'analyst']);
  const canPublishForms = () => hasRole(['super_admin', 'org_admin', 'analyst']);

  return {
    hasRole,
    isAdmin,
    isAnalyst,
    isFieldUser,
    canCreateForms,
    canAssignForms,
    canPublishForms,
    roles: user?.roles || []
  };
};
