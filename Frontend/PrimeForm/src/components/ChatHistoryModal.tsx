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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { colors, spacing, fonts } from '../theme/colors';
import aiTrainerService from '../services/aiTrainerService';
import { ChatConversation } from '../services/aiTrainerService';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface ChatHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectConversation: (conversationId: string) => void;
  onNewChat?: () => void;
}

const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({ 
  visible, 
  onClose,
  onSelectConversation,
  onNewChat
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{ id: string; title: string } | null>(null);

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

  const handleNewChat = () => {
    if (onNewChat) {
      onNewChat();
      onClose();
    }
  };

  const handleDeleteConversation = (conversationId: string, conversationTitle: string) => {
    setConversationToDelete({ id: conversationId, title: conversationTitle });
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!conversationToDelete) return;
    
    try {
      await aiTrainerService.deleteConversation(conversationToDelete.id);
      showToast('success', 'Chat deleted successfully');
      await loadConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      showToast('error', 'Failed to delete chat');
    } finally {
      setDeleteModalVisible(false);
      setConversationToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteModalVisible(false);
    setConversationToDelete(null);
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

          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Chat Button */}
        <View style={styles.newChatContainer}>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={handleNewChat}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={24} color={colors.white} />
            <Text style={styles.newChatText}>New Chat</Text>
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

      {/* Custom Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDelete}
      >
        <TouchableOpacity
          style={styles.deleteModalOverlay}
          activeOpacity={1}
          onPress={cancelDelete}
        >
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(150)}
            style={styles.deleteModalContainer}
          >
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={styles.deleteModalContent}>
                {/* Icon */}
                <View style={styles.deleteModalIconContainer}>
                  <Ionicons name="trash" size={32} color="#FF6B6B" />
                </View>

                {/* Title */}
                <Text style={styles.deleteModalTitle}>Delete Chat</Text>

                {/* Message */}
                <Text style={styles.deleteModalMessage}>
                  Are you sure you want to delete "{conversationToDelete?.title}"?
                </Text>

                {/* Buttons */}
                <View style={styles.deleteModalButtons}>
                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.cancelButton]}
                    onPress={cancelDelete}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>CANCEL</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.deleteModalButton, styles.deleteButtonConfirm]}
                    onPress={confirmDelete}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.deleteButtonText}>DELETE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newChatContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    gap: spacing.sm,
  },
  newChatText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
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
  // Delete Modal Styles
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  deleteModalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  deleteModalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  deleteModalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  deleteModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.sm,
    fontFamily: fonts.heading,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: colors.mutedText,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
    fontFamily: fonts.body,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: spacing.md,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.inactive,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
    letterSpacing: 0.5,
  },
  deleteButtonConfirm: {
    backgroundColor: '#FF6B6B',
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.heading,
    letterSpacing: 0.5,
  },
});

export default ChatHistoryModal;

