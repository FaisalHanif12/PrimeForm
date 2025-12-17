import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

class NotificationService {
    constructor() {
        this.baseURL = `${API_BASE_URL}/notifications`;
    }

    // Get auth token from storage
    async getAuthToken() {
        try {
            const token = await AsyncStorage.getItem('authToken');
            return token;
        } catch (error) {
            console.error('Error getting auth token:', error);
            return null;
        }
    }

    // Create headers with auth token
    async createHeaders() {
        const token = await this.getAuthToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    // Get all notifications for the user
    async getNotifications(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                includeRead = true
            } = options;

            const headers = await this.createHeaders();
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                includeRead: includeRead.toString()
            });

            const response = await fetch(`${this.baseURL}?${queryParams}`, {
                method: 'GET',
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch notifications');
            }

            return {
                success: true,
                notifications: data.data.notifications,
                unreadCount: data.data.unreadCount,
                pagination: data.data.pagination
            };
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return {
                success: false,
                error: error.message,
                notifications: [],
                unreadCount: 0
            };
        }
    }

    // Get unread notification count
    async getUnreadCount() {
        try {
            const headers = await this.createHeaders();
            const response = await fetch(`${this.baseURL}/unread-count`, {
                method: 'GET',
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch unread count');
            }

            return {
                success: true,
                unreadCount: data.data.unreadCount
            };
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return {
                success: false,
                error: error.message,
                unreadCount: 0
            };
        }
    }

    // Mark a specific notification as read
    async markAsRead(notificationId) {
        try {
            const headers = await this.createHeaders();
            const response = await fetch(`${this.baseURL}/${notificationId}/read`, {
                method: 'PATCH',
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to mark notification as read');
            }

            return {
                success: true,
                notification: data.data.notification
            };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Mark all notifications as read
    async markAllAsRead() {
        try {
            const headers = await this.createHeaders();
            const response = await fetch(`${this.baseURL}/mark-all-read`, {
                method: 'PATCH',
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to mark all notifications as read');
            }

            return {
                success: true,
                unreadCount: data.data.unreadCount
            };
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Delete a specific notification
    async deleteNotification(notificationId) {
        try {
            const headers = await this.createHeaders();
            const response = await fetch(`${this.baseURL}/${notificationId}`, {
                method: 'DELETE',
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete notification');
            }

            return {
                success: true,
                message: data.data.message
            };
        } catch (error) {
            console.error('Error deleting notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Get notification statistics
    async getNotificationStats() {
        try {
            const headers = await this.createHeaders();
            const response = await fetch(`${this.baseURL}/stats`, {
                method: 'GET',
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch notification stats');
            }

            return {
                success: true,
                stats: data.data.stats
            };
        } catch (error) {
            console.error('Error fetching notification stats:', error);
            return {
                success: false,
                error: error.message,
                stats: {
                    total: 0,
                    unread: 0,
                    read: 0,
                    byType: {}
                }
            };
        }
    }

    // Bulk operations on notifications
    async bulkOperations(action, notificationIds) {
        try {
            const headers = await this.createHeaders();
            const response = await fetch(`${this.baseURL}/bulk`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    action,
                    notificationIds
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to perform bulk operation');
            }

            return {
                success: true,
                message: data.data.message,
                processedCount: data.data.processedCount,
                unreadCount: data.data.unreadCount
            };
        } catch (error) {
            console.error('Error performing bulk operation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Create test notification (development only)
    async createTestNotification(title, message, type = 'general', priority = 'medium') {
        try {
            const headers = await this.createHeaders();
            const response = await fetch(`${this.baseURL}/test`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    title,
                    message,
                    type,
                    priority
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create test notification');
            }

            return {
                success: true,
                notification: data.data.notification
            };
        } catch (error) {
            console.error('Error creating test notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Create a new notification
    async createNotification(notificationData) {
        try {
            const headers = await this.createHeaders();
            const response = await fetch(this.baseURL, {
                method: 'POST',
                headers,
                body: JSON.stringify(notificationData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create notification');
            }

            return {
                success: true,
                notification: data.data.notification
            };
        } catch (error) {
            console.error('Error creating notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Send welcome notification for new user account creation
    async sendWelcomeNotification(userEmail) {
        try {
            const headers = await this.createHeaders();
            const response = await fetch(`${this.baseURL}/welcome`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userEmail,
                    type: 'welcome',
                    title: 'Welcome to Pure Body! 🎉',
                    message: 'Your account has been created successfully. Start your fitness journey today!',
                    priority: 'high',
                    metadata: { isWelcome: true }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to send welcome notification');
            }

            return {
                success: true,
                notification: data.data.notification
            };
        } catch (error) {
            console.error('Error sending welcome notification:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Format notification time for display
    formatNotificationTime(timestamp) {
        try {
            const now = new Date();
            const notificationTime = new Date(timestamp);
            const diffInMs = now - notificationTime;
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            if (diffInDays > 0) {
                return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
            } else if (diffInHours > 0) {
                return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
            } else if (diffInMinutes > 0) {
                return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
            } else {
                return 'Just now';
            }
        } catch (error) {
            console.error('Error formatting notification time:', error);
            return 'Unknown time';
        }
    }

    // Get notification icon based on type
    getNotificationIcon(type) {
        const iconMap = {
            welcome: '🎉',
            diet_plan_created: '🥗',
            workout_plan_created: '💪',
            general: '📢'
        };
        return iconMap[type] || '📢';
    }

    // Get notification color based on priority
    getNotificationColor(priority) {
        const colorMap = {
            high: '#FF6B6B',
            medium: '#4ECDC4',
            low: '#95E1D3'
        };
        return colorMap[priority] || '#4ECDC4';
    }
}

// Create and export a singleton instance
const notificationService = new NotificationService();
export default notificationService;