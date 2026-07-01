import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import type { MainTabParamList, MainStackParamList } from './types';
import { DashboardScreen }  from '../features/dashboard/screens/DashboardScreen';
import { BoardroomsScreen } from '../features/boardrooms/screens/BoardroomsScreen';
import { BookingsScreen }   from '../features/bookings/screens/BookingsScreen';
import { useGetUnreadCountQuery } from '../api';
import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated } from '../store/slices/auth.slice';
import { colors, typography } from '../design-system';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabIconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<keyof MainTabParamList, { active: TabIconName; inactive: TabIconName }> = {
  Dashboard:  { active: 'home',     inactive: 'home-outline' },
  Boardrooms: { active: 'business', inactive: 'business-outline' },
  Bookings:   { active: 'calendar', inactive: 'calendar-outline' },
};

function NotificationBell() {
  const navigation     = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const { data }       = useGetUnreadCountQuery(undefined, { skip: !isAuthenticated, pollingInterval: 30000, refetchOnMountOrArgChange: true });
  const unread         = data?.unread ?? 0;

  return (
    <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.bellBtn}>
      <Ionicons name="notifications-outline" size={24} color={colors.text.primary} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 99 ? '99+' : String(unread)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function HeaderLeft() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  return (
    <View style={styles.headerLeft}>
      <NotificationBell />
      <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        <Ionicons name="person-outline" size={24} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );
}

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitle: '',
        headerRight: () => <HeaderLeft />,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontSize:   typography.fontSize.lg,
          fontWeight: typography.fontWeight.semibold,
        },
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
      <Tab.Screen name="Dashboard"  component={DashboardScreen} />
      <Tab.Screen name="Boardrooms" component={BoardroomsScreen} />
      <Tab.Screen name="Bookings"   component={BookingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    marginRight:   8,
    gap:           8,
  },
  bellBtn: {
    position: 'relative',
  },
  badge: {
    position:        'absolute',
    top:             -4,
    right:           -4,
    minWidth:        16,
    height:          16,
    borderRadius:    8,
    backgroundColor: colors.danger.main,
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color:      colors.text.inverse,
    fontSize:   9,
    fontWeight: '700',
    lineHeight: 12,
  },
});
