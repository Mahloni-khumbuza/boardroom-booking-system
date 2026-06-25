import React from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '../../../shared/components/layout/ScreenContainer';
import { PageHeader }      from '../../../shared/components/layout/PageHeader';

export function DashboardScreen() {
  return (
    <ScreenContainer>
      <PageHeader title="Dashboard" subtitle="Overview of your bookings" />
      <Text>Dashboard content coming soon.</Text>
    </ScreenContainer>
  );
}
