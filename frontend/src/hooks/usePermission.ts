import { useAuth } from '../context/AuthContext';

export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string) => {
    if (!user) return false;
    
    // Check if user is SUPER_ADMIN, BUSINESS_ADMIN, or has the special ALL_ACCESS permission
    if (user?.roles?.includes('SUPER_ADMIN') || user?.roles?.includes('BUSINESS_ADMIN') || user?.permissions?.includes('ALL_ACCESS')) {
      return true;
    }

    return (user?.permissions || []).includes(permission);
  };

  /**
   * Checks if user has any permission within a specific module
   * Useful for showing/hiding entire menu categories
   */
  const hasModuleAccess = (module: string) => {
    if (!user) return false;
    if (user?.roles?.includes('SUPER_ADMIN') || user?.roles?.includes('BUSINESS_ADMIN')) return true;
    
    return (user.permissions || []).some(p => p.startsWith(`${module}.`));
  };

  /**
   * Checks if user has any of the listed roles
   */
  const hasRole = (roleNames: string[]) => {
    if (!user) return false;
    return user.roles.some(r => roleNames.includes(r));
  };

  return { hasPermission, hasModuleAccess, hasRole };
};
