import React from 'react';
import { ScreenContainer, PageHeader, EmptyState } from '../../../shared';

export function BookingsScreen() {
  return (
    <ScreenContainer>
      <PageHeader title="Bookings" subtitle="Your upcoming bookings" />
      <EmptyState
        icon="calendar-outline"
        title="Bookings coming soon"
        message="View, create, and manage your room bookings here."
      />
    </ScreenContainer>
  );
}
