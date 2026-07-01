import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ScreenContainer,
  PageHeader,
  EmptyState,
  LoadingState,
  ErrorState,
} from '../../../shared';
import {
  useListNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  type Notification,
  type NotificationType,
} from '../../../api';
import { colors, spacing, typography } from '../../../design-system';

const TYPE_ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  info:                      'information-circle-outline',
  system:                    'settings-outline',
  booking_created:           'calendar-outline',
  booking_approval_required: 'hourglass-outline',
  booking_approved:          'checkmark-circle-outline',
  booking_rejected:          'close-circle-outline',
  booking_cancelled:         'ban-outline',
  booking_updated:           'create-outline',
  booking_reminder:          'alarm-outline',
  facilities_request:        'construct-outline',
  room_blocked:              'lock-closed-outline',
};

const TYPE_COLORS: Record<NotificationType, string> = {
  info:                      colors.info.main,
  system:                    colors.neutral[600],
  booking_created:           colors.primary[500],
  booking_approval_required: colors.warning.dark,
  booking_approved:          colors.success.main,
  booking_rejected:          colors.danger.main,
  booking_cancelled:         colors.neutral[600],
  booking_updated:           colors.primary[400],
  booking_reminder:          colors.warning.main,
  facilities_request:        colors.info.dark,
  room_blocked:              colors.danger.dark,
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

interface NotificationItemProps {
  item: Notification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ item, onMarkRead, onDelete }: NotificationItemProps) {
  const iconName  = TYPE_ICONS[item.type] ?? 'notifications-outline';
  const iconColor = TYPE_COLORS[item.type] ?? colors.primary[500];

  const handleDelete = () => {
    Alert.alert('Delete notification', 'Remove this notification?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.item, !item.isRead && styles.itemUnread]}
      onPress={() => !item.isRead && onMarkRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={1}>
            {item.title}
          </Text>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.timestamp}>{formatRelativeTime(item.createdAt)}</Text>
      </View>

      <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={8}>
        <Ionicons name="trash-outline" size={18} color={colors.text.secondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function NotificationsScreen() {
  const {
    data: notifications,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useListNotificationsQuery();

  const [markRead]   = useMarkReadMutation();
  const [markAll]    = useMarkAllReadMutation();
  const [deleteNote] = useDeleteNotificationMutation();

  const handleMarkRead = useCallback((id: string) => {
    void markRead(id);
  }, [markRead]);

  const handleDelete = useCallback((id: string) => {
    void deleteNote(id);
  }, [deleteNote]);

  const handleMarkAll = useCallback(() => {
    void markAll();
  }, [markAll]);

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  if (isLoading) return <LoadingState message="Loading notifications..." />;

  if (isError) {
    return (
      <ScreenContainer>
        <PageHeader title="Notifications" />
        <ErrorState message="Failed to load notifications." onRetry={refetch} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false}>
      <View style={styles.header}>
        <PageHeader title="Notifications" />
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllBtn} onPress={handleMarkAll}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications ?? []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            item={item}
            onMarkRead={handleMarkRead}
            onDelete={handleDelete}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="No notifications yet"
            message="Booking confirmations and reminders will appear here."
          />
        }
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={
          (!notifications || notifications.length === 0) ? styles.emptyContainer : styles.listContent
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingRight:   spacing[2],
  },
  markAllBtn: {
    paddingVertical:   spacing[1],
    paddingHorizontal: spacing[2],
  },
  markAllText: {
    color:      colors.text.link,
    fontSize:   typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  listContent: {
    paddingBottom: spacing[6],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  item: {
    flexDirection:     'row',
    alignItems:        'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[3],
    backgroundColor:   colors.surface,
  },
  itemUnread: {
    backgroundColor: colors.primary[50],
  },
  iconWrap: {
    width:         40,
    height:        40,
    borderRadius:  20,
    alignItems:    'center',
    justifyContent: 'center',
    marginRight:   spacing[3],
    flexShrink:    0,
  },
  content: {
    flex:        1,
    marginRight: spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    marginBottom:  spacing[0.5],
  },
  title: {
    flex:       1,
    fontSize:   typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color:      colors.text.primary,
  },
  titleUnread: {
    fontWeight: typography.fontWeight.bold,
  },
  unreadDot: {
    width:        8,
    height:       8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
    marginLeft:   spacing[1],
    flexShrink:   0,
  },
  message: {
    fontSize:     typography.fontSize.sm,
    color:        colors.text.secondary,
    lineHeight:   typography.fontSize.sm * 1.5,
    marginBottom: spacing[1],
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color:    colors.text.disabled,
  },
  deleteBtn: {
    padding:   spacing[1],
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  separator: {
    height:          1,
    backgroundColor: colors.border,
    marginLeft:      spacing[4] + 40 + spacing[3],
  },
});
