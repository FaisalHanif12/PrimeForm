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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { colors, spacing, fonts } from '../theme/colors';
import aiTrainerService from '../services/aiTrainerService';
import { ChatConversation } from '../services/aiTrainerService';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ChatHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({ 
  visible, 
  onClose,
  onSelectConversation 
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadConversations();
    }
  }, [visible]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const allConversations = await aiTrainerService.getAllConversations();
      setConversations(allConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      showToast('error', 'Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    onSelectConversation(conversationId);
    onClose();
  };

  const handleDeleteConversation = (conversationId: string, conversationTitle: string) => {
    Alert.alert(
      'Delete Chat',
      `Are you sure you want to delete "${conversationTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await aiTrainerService.deleteConversation(conversationId);
              showToast('success', 'Chat deleted successfully');
              await loadConversations();
            } catch (error) {
              console.error('Error deleting conversation:', error);
              showToast('error', 'Failed to delete chat');
            }
          }
        }
      ]
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderConversationItem = (conversation: ChatConversation) => {
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const preview = lastMessage 
      ? (lastMessage.message.substring(0, 60) + (lastMessage.message.length > 60 ? '...' : ''))
      : 'No messages yet';

    return (
      <Animated.View 
        key={conversation.id}
        entering={FadeInDown.delay(100)}
        style={styles.conversationItem}
      >
        <TouchableOpacity
          style={styles.conversationContent}
          onPress={() => handleSelectConversation(conversation.id)}
          activeOpacity={0.7}
        >
          <View style={styles.conversationIcon}>
            <Ionicons name="chatbubbles" size={20} color={colors.primary} />
          </View>

          <View style={styles.conversationText}>
            <Text style={styles.conversationTitle} numberOfLines={1}>
              {conversation.title}
            </Text>
            <Text style={styles.conversationPreview} numberOfLines={1}>
              {preview}
            </Text>
            <View style={styles.conversationMeta}>
              <Text style={styles.conversationDate}>
                {formatDate(conversation.updatedAt)} • {formatTime(conversation.updatedAt)}
              </Text>
              <Text style={styles.messageCount}>
                {conversation.messages.length} {conversation.messages.length === 1 ? 'message' : 'messages'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteConversation(conversation.id, conversation.title)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </Animated.View>
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
              <Ionicons name="close" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chat History</Text>
          </View>

          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {loading && conversations.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading chat history...</Text>
            </View>
          ) : conversations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.mutedText} />
              <Text style={styles.emptyTitle}>No Chat History</Text>
              <Text style={styles.emptyMessage}>
                Your previous conversations will appear here. Start a new chat to begin!
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.conversationsList}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                  colors={[colors.primary]}
                />
              }
              showsVerticalScrollIndicator={false}
            >
              {conversations.map(renderConversationItem)}
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
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    fontFamily: fonts.heading,
  },
  refreshButton: {
    padding: spacing.xs,
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
    color: colors.mutedText,
    marginTop: spacing.md,
    fontFamily: fonts.body,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    fontFamily: fonts.heading,
  },
  emptyMessage: {
    color: colors.mutedText,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.body,
  },
  conversationsList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  conversationContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 217, 100, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  conversationText: {
    flex: 1,
  },
  conversationTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.xs,
    fontFamily: fonts.heading,
  },
  conversationPreview: {
    color: colors.mutedText,
    fontSize: 14,
    marginBottom: spacing.xs,
    fontFamily: fonts.body,
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationDate: {
    color: colors.mutedText,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  messageCount: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  deleteButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
  },
  bottomPadding: {
    height: spacing.xl,
  },
});

export default ChatHistoryModal;

