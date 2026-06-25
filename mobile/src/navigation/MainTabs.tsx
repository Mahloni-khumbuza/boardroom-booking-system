import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabParamList } from './types';
import { DashboardScreen }     from '../features/dashboard/screens/DashboardScreen';
import { BoardroomsScreen }    from '../features/boardrooms/screens/BoardroomsScreen';
import { BookingsScreen }      from '../features/bookings/screens/BookingsScreen';
import { NotificationsScreen } from '../features/notifications/screens/NotificationsScreen';
import { ProfileScreen }       from '../features/profile/screens/ProfileScreen';
import { colors, typography } from '../design-system';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<keyof MainTabParamList, { active: TabIconName; inactive: TabIconName }> = {
  Dashboard:     { active: 'home',            inactive: 'home-outline' },
  Boardrooms:    { active: 'business',        inactive: 'business-outline' },
  Bookings:      { active: 'calendar',        inactive: 'calendar-outline' },
  Notifications: { active: 'notifications',   inactive: 'notifications-outline' },
  Profile:       { active: 'person',          inactive: 'person-outline' },
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name as keyof MainTabParamList];
          const name  = focused ? icons.active : icons.inactive;
          return <Ionicons name={name} size={size} color={color} />;
        },
        tabBarActiveTintColor:   colors.primary[500],
        tabBarInactiveTintColor: colors.text.secondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
        },
        tabBarLabelStyle: {
          fontSize:   typography.fontSize.xs,
          fontWeight: typography.fontWeight.medium,
        },
      })}
    >
      <Tab.Screen name="Dashboard"     component={DashboardScreen} />
      <Tab.Screen name="Boardrooms"    component={BoardroomsScreen} />
      <Tab.Screen name="Bookings"      component={BookingsScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile"       component={ProfileScreen} />
    </Tab.Navigator>
  );
}
