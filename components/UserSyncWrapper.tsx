'use client';

import { useUserSync } from '../hooks/useUserSync';
import { ReactNode } from 'react';

interface UserSyncWrapperProps {
  children: ReactNode;
}

export function UserSyncWrapper({ children }: UserSyncWrapperProps) {
  useUserSync();
  return <>{children}</>;
}
