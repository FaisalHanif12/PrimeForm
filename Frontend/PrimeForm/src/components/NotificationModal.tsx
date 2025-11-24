import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../contexts/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ visible, onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationIcon,
    getNotificationColor,
    formatTime,
    clearError
  } = useNotifications();

  const { t } = useLanguage();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  // Handle notification press
  const handleNotificationPress = async (notification: any) => {
    if (selectionMode) {
      toggleNotificationSelection(notification._id);
    } else {
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }
    }
  };

  // Toggle notification selection
  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev => {
      if (prev.includes(notificationId)) {
        return prev.filter(id => id !== notificationId);
      } else {
        return [...prev, notificationId];
      }
    });
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    if (unreadCount === 0) {
      showToast('info', 'No unread notifications');
      return;
    }

    Alert.alert(
      'Mark All as Read',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Mark All', onPress: markAllAsRead }
      ]
    );
  };

  // Handle delete notification
  const handleDeleteNotification = (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteNotification(notificationId) }
      ]
    );
  };

  // Handle bulk actions
  const handleBulkAction = (action: 'markAsRead' | 'delete') => {
    if (selectedNotifications.length === 0) {
      showToast('info', 'No notifications selected');
      return;
    }

    const actionText = action === 'markAsRead' ? 'mark as read' : 'delete';
    Alert.alert(
      `Bulk ${actionText}`,
      `Are you sure you want to ${actionText} ${selectedNotifications.length} notification(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'markAsRead' ? 'Mark as Read' : 'Delete',
          style: action === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            if (action === 'markAsRead') {
              for (const id of selectedNotifications) {
                await markAsRead(id);
              }
            } else {
              for (const id of selectedNotifications) {
                await deleteNotification(id);
              }
            }
            setSelectedNotifications([]);
            setSelectionMode(false);
          }
        }
      ]
    );
  };

  // Clear error when modal opens
  useEffect(() => {
    if (visible && error) {
      clearError();
    }
  }, [visible]);

  // Render notification item
  const renderNotificationItem = (notification: any) => {
    const isSelected = selectedNotifications.includes(notification._id);
    const icon = getNotificationIcon(notification.type);
    const priorityColor = getNotificationColor(notification.priority);

    return (
      <TouchableOpacity
        key={notification._id}
        style={[
          styles.notificationItem,
          !notification.isRead && styles.unreadNotification,
          isSelected && styles.selectedNotification
        ]}
        onPress={() => handleNotificationPress(notification)}
        onLongPress={() => {
          if (!selectionMode) {
            setSelectionMode(true);
            toggleNotificationSelection(notification._id);
          }
        }}
        activeOpacity={0.7}
      >
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <View style={styles.iconContainer}>
              <Text style={styles.notificationIcon}>{icon}</Text>
              {!notification.isRead && <View style={[styles.unreadDot, { backgroundColor: priorityColor }]} />}
            </View>

            <View style={styles.notificationText}>
              <Text style={[
                styles.notificationTitle,
                !notification.isRead && styles.unreadTitle
              ]}>
                {notification.title}
              </Text>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {notification.message}
              </Text>
              <Text style={styles.notificationTime}>
                {formatTime(notification.createdAt)}
              </Text>
            </View>

            <View style={styles.notificationActions}>
              {selectionMode ? (
                <View style={[
                  styles.selectionCheckbox,
                  isSelected && styles.selectedCheckbox
                ]}>
                  {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteNotification(notification._id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.gold} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          <View style={styles.headerRight}>
            {selectionMode ? (
              <>
                <TouchableOpacity
                  onPress={() => handleBulkAction('markAsRead')}
                  style={styles.headerAction}
                >
                  <Ionicons name="checkmark-done" size={20} color={colors.gold} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleBulkAction('delete')}
                  style={styles.headerAction}
                >
                  <Ionicons name="trash" size={20} color="#FF6B6B" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setSelectionMode(false);
                    setSelectedNotifications([]);
                  }}
                  style={styles.headerAction}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerAction}>
                  <Ionicons name="checkmark-done-outline" size={20} color={colors.gold} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRefresh} style={styles.headerAction}>
                  <Ionicons name="refresh" size={20} color={colors.gold} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading && notifications.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.gold} />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="notifications-off" size={64} color="#666" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyMessage}>
                You're all caught up! New notifications will appear here.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.notificationsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.gold}
                  colors={[colors.gold]}
                />
              }
              showsVerticalScrollIndicator={false}
            >
              {notifications.map(renderNotificationItem)}
              <View style={styles.bottomPadding} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 10,
  },
  headerBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    marginLeft: 15,
    padding: 5,
  },
  cancelText: {
    color: colors.gold,
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.gold,
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: colors.gold,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  emptyMessage: {
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  unreadNotification: {
    borderColor: colors.gold,
    backgroundColor: colors.surface,
  },
  selectedNotification: {
    borderColor: '#4ECDC4',
    backgroundColor: '#1a2f3a',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  notificationIcon: {
    fontSize: 24,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  notificationText: {
    flex: 1,
    marginRight: 10,
  },
  notificationTitle: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  unreadTitle: {
    color: colors.gold,
    fontWeight: 'bold',
  },
  notificationMessage: {
    color: '#B0B0B0',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  notificationTime: {
    color: '#888',
    fontSize: 12,
  },
  notificationActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 5,
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  bottomPadding: {
    height: 20,
  },
});

export default NotificationModal;