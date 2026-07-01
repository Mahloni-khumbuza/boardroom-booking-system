import React from 'react';
import { ScreenContainer, PageHeader, EmptyState } from '../../../shared';

export function DashboardScreen() {
  return (
    <ScreenContainer>
      <PageHeader title="Dashboard" subtitle="Overview of your bookings" />
      <EmptyState
        icon="home-outline"
        title="Dashboard coming soon"
        message="Booking statistics and upcoming meetings will appear here."
      />
    </ScreenContainer>
  );
}
