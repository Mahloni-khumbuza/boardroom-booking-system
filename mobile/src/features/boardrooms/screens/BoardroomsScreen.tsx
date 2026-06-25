import React from 'react';
import { Text } from 'react-native';
import { ScreenContainer } from '../../../shared/components/layout/ScreenContainer';
import { PageHeader }      from '../../../shared/components/layout/PageHeader';

export function BoardroomsScreen() {
  return (
    <ScreenContainer>
      <PageHeader title="Boardrooms" subtitle="Available rooms" />
      <Text>Boardrooms content coming soon.</Text>
    </ScreenContainer>
  );
}
