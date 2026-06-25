import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../../../shared/components/layout/ScreenContainer';
import { PageHeader }      from '../../../shared/components/layout/PageHeader';
import { DangerButton }    from '../../../shared/components/buttons/DangerButton';
import { useAppDispatch }  from '../../../store/hooks';
import { authService }     from '../../auth/services/auth.service';
import { colors, spacing } from '../../../design-system';

export function ProfileScreen() {
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    await authService.logout(dispatch);
  };

  return (
    <ScreenContainer>
      <PageHeader title="Profile" />
      <Text style={styles.placeholder}>Profile content coming soon.</Text>
      <View style={styles.logoutWrap}>
        <DangerButton label="Sign Out" onPress={handleLogout} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: { color: colors.text.secondary, marginBottom: spacing[8] },
  logoutWrap:  { marginTop: 'auto' },
});
