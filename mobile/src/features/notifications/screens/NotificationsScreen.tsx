import React from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '../../../shared/components/layout/ScreenContainer';
import { PageHeader }      from '../../../shared/components/layout/PageHeader';

export function NotificationsScreen() {
  return (
    <ScreenContainer>
      <PageHeader title="Notifications" />
      <Text>Notifications content coming soon.</Text>
    </ScreenContainer>
  );
}
