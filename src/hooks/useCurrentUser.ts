// src/hooks/useCurrentUser.ts
import { useState, useEffect, useCallback } from 'react';
import {
  getStoredCurrentUser,
  hasPermission,
  canAccessMenuItem,
  isMasterAdmin,
  isCmsUser,
  getEffectivePermissions,
  PermissionId
} from '../utils/permissions';

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<any>(() => getStoredCurrentUser());

  const reloadUser = useCallback(() => {
    setCurrentUser(getStoredCurrentUser());
  }, []);

  useEffect(() => {
    // Synchronisation avec les changements de stockage (connexion, déconnexion, mise à jour profil)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'maintenance_current_user' || e.key === 'maintenance_authenticated') {
        reloadUser();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('maintenance_user_updated', reloadUser);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('maintenance_user_updated', reloadUser);
    };
  }, [reloadUser]);

  const can = useCallback(
    (permission: PermissionId): boolean => {
      return hasPermission(currentUser, permission);
    },
    [currentUser]
  );

  const canAccess = useCallback(
    (menuId: string): boolean => {
      return canAccessMenuItem(menuId, currentUser);
    },
    [currentUser]
  );

  return {
    currentUser,
    reloadUser,
    can,
    canAccess,
    isMasterAdmin: isMasterAdmin(currentUser),
    isCms: isCmsUser(currentUser),
    effectivePermissions: getEffectivePermissions(currentUser)
  };
}
