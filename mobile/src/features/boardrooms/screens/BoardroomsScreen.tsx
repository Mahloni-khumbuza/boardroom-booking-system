import React from 'react';
import { ScreenContainer, PageHeader, EmptyState } from '../../../shared';

export function BoardroomsScreen() {
  return (
    <ScreenContainer>
      <PageHeader title="Boardrooms" subtitle="Available rooms" />
      <EmptyState
        icon="business-outline"
        title="Boardrooms coming soon"
        message="Browse and search available boardrooms here."
      />
    </ScreenContainer>
  );
}
