"use client";

import React from 'react';
import { UserProfileCard } from '@/components/UserProfileCard';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProfileSectionProps {
  isCollapsed: boolean;
}

export const SidebarProfileSection: React.FC<SidebarProfileSectionProps> = ({ isCollapsed }) => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="mb-6">
      <UserProfileCard isCollapsed={isCollapsed} />
    </div>
  );
};