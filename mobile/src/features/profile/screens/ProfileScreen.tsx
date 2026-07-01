import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectUserProfile } from '../../../store/slices/user.slice';
import { authService } from '../../auth/services/auth.service';
import {
  ScreenContainer,
  PageHeader,
  SectionCard,
  ConfirmationModal,
  DangerButton,
} from '../../../shared';
import { colors, spacing, typography } from '../../../design-system';
import { capitalize } from '../../../shared/utils/format.utils';

export function ProfileScreen() {
  const dispatch = useAppDispatch();
  const profile  = useAppSelector(selectUserProfile);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut,    setIsLoggingOut]    = useState(false);

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    await authService.logout(dispatch);
    // RootNavigator detects isAuthenticated=false and unmounts MainTabs automatically.
  };

  return (
    <ScreenContainer>
      <PageHeader title="Profile" />

      {profile && (
        <>
          <SectionCard title="Personal Information">
            <ProfileRow label="Full name"   value={`${profile.firstName} ${profile.lastName}`} />
            <ProfileRow label="Email"       value={profile.email} />
            <ProfileRow label="Role"        value={capitalize(profile.role)} />
            {profile.department  && <ProfileRow label="Department" value={profile.department} />}
            {profile.jobTitle    && <ProfileRow label="Job title"  value={profile.jobTitle} />}
            {profile.phoneNumber && <ProfileRow label="Phone"      value={profile.phoneNumber} />}
          </SectionCard>
        </>
      )}

      <View style={styles.logoutWrap}>
        <DangerButton label="Sign Out" onPress={() => setShowLogoutModal(true)} />
      </View>

      <ConfirmationModal
        visible={showLogoutModal}
        title="Sign out"
        message="Are you sure you want to sign out?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        isDangerous
        isLoading={isLoggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setShowLogoutModal(false)}
      />
    </ScreenContainer>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize:   typography.fontSize.sm,
    color:      colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    flex:       1,
  },
  rowValue: {
    fontSize:  typography.fontSize.sm,
    color:     colors.text.primary,
    flex:      2,
    textAlign: 'right',
  },
  logoutWrap: { marginTop: spacing[6] },
});
