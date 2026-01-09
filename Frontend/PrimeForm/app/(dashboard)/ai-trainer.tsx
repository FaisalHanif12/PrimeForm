import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import userProfileService from '../../src/services/userProfileService';
import Storage from '../../src/utils/storage';
import DashboardHeader from '../../src/components/DashboardHeader';
import Sidebar from '../../src/components/Sidebar';
import ProfilePage from '../../src/components/ProfilePage';
import NotificationModal from '../../src/components/NotificationModal';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import ChatHistoryModal from '../../src/components/ChatHistoryModal';
import aiTrainerService from '../../src/services/aiTrainerService';
import { showRewardedAd } from '../../src/ads/showRewarded';
import { AdUnits } from '../../src/ads/adUnits';
import MarkdownText from '../../src/components/MarkdownText';
import { useNotificationCount } from '../../src/hooks/useNotificationCount';

const { width: screenWidth } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  category?: 'workout' | 'diet' | 'motivation' | 'general';
}

export default function AITrainerScreen() {
  const router = useRouter();
  const { t, language, transliterateText, transliterateName } = useLanguage();
  const { unreadCount } = useNotificationCount();
  const { user } = useAuthContext();
  const { showToast } = useToast();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [visibleCount, setVisibleCount] = useState(15); // UI pagination: show last 15 messages by default
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  useEffect(() => {
    loadChatHistory();
  }, []);

  // Ensure we always show at least the last 15 messages, and never more than exist.
  useEffect(() => {
    setVisibleCount(prev => {
      const minVisible = 15;
      const current = Math.max(prev, minVisible);
      return Math.min(chatMessages.length, current || minVisible);
    });
  }, [chatMessages.length]);

  const visibleMessages = chatMessages.length > visibleCount
    ? chatMessages.slice(-visibleCount)
    : chatMessages;

  const canLoadMore = chatMessages.length > visibleMessages.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + 15, chatMessages.length));
  };

  const loadChatHistory = async () => {
    try {
      setIsLoading(true);

      // Check subscription (mock)
      const hasSubscription = true;
      if (!hasSubscription) {
        showToast('warning', t('aiTrainer.premiumOnly'));
        router.push('/(dashboard)/subscription');
        return;
      }

      const chatResponse = await aiTrainerService.getChatHistory();
      if (chatResponse.success && chatResponse.data && chatResponse.data.length > 0) {
        setChatMessages(chatResponse.data);
      } else {
        // If no conversation exists, create a new one with welcome message
        const userName = user?.fullName 
          ? (language === 'ur' ? transliterateName(user.fullName) : user.fullName)
          : '';
        const welcomeText = userName
          ? t('aiTrainer.welcome').replace('{name}', userName)
          : t('aiTrainer.welcome.guest');
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          type: 'ai',
          message: welcomeText,
          timestamp: new Date(),
          category: 'general'
        };
        setChatMessages([welcomeMessage]);
      }

    } catch (error) {
      showToast('error', t('aiTrainer.error.loadHistory'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conversationId: string) => {
    try {
      setIsLoading(true);
      const response = await aiTrainerService.loadConversation(conversationId);
      if (response.success && response.data) {
        setChatMessages(response.data);
        scrollToBottom();
      } else {
        showToast('error', t('aiTrainer.error.loadConversation'));
      }
    } catch (error) {
      showToast('error', t('aiTrainer.error.loadConversation'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      setIsLoading(true);
      // Create a new conversation
      const newConversationId = await aiTrainerService.createNewConversation();
      
      // Reset chat messages with welcome message
      const userName = user?.fullName 
        ? (language === 'ur' ? transliterateName(user.fullName) : user.fullName)
        : '';
      const welcomeText = userName
        ? t('aiTrainer.welcome').replace('{name}', userName)
        : t('aiTrainer.welcome.guest');
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'ai',
        message: welcomeText,
        timestamp: new Date(),
        category: 'general'
      };
      
      setChatMessages([welcomeMessage]);
      setCurrentMessage('');
      scrollToBottom();
      showToast('success', t('aiTrainer.success.newChat'));
    } catch (error) {
      console.error('Error creating new chat:', error);
      showToast('error', t('aiTrainer.error.newChat'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    console.log('🎬 [AI TRAINER] === handleSendMessage CALLED ===');
    console.log('🎬 [AI TRAINER] Current message:', currentMessage?.substring(0, 50));
    
    if (!currentMessage.trim()) {
      console.log('⚠️ [AI TRAINER] Empty message, returning');
      return;
    }

    // Get user ID for tracking
    const { getCurrentUserId, getUserCacheKey } = await import('../../src/utils/cacheKeys');
    const userId = await getCurrentUserId();
    console.log('🎬 [AI TRAINER] User ID:', userId);
    
    if (!userId) {
      console.log('❌ [AI TRAINER] No user ID, showing auth error');
      showToast('warning', t('aiTrainer.error.notAuthenticated'));
      return;
    }

    const today = new Date();
    const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
    console.log('🎬 [AI TRAINER] Date key:', dateKey);

    // ✅ CRITICAL: Check daily message limit FIRST (before showing ad)
    // Daily usage limit: max 3 messages per user per day
    try {
      const usageKey = await getUserCacheKey(`ai_trainer_usage_${dateKey}`, userId);
      const rawUsage = await Storage.getItem(usageKey);
      const currentCount = rawUsage ? Number(rawUsage) || 0 : 0;
      console.log('🎬 [AI TRAINER] Usage count today:', currentCount, '/ 3');

      if (currentCount >= 3) {
        console.log('❌ [AI TRAINER] Daily limit reached (3/3)');
        showToast('warning', t('aiTrainer.limit.reached'));
        return; // Stop here if limit reached
      }
    } catch (error) {
      console.error('❌ [AI TRAINER] Error checking daily limit:', error);
      // If something goes wrong with the limit check, still allow the message
    }

    // Check if user has already watched rewarded ad today (once per day)
    const adWatchedKey = await getUserCacheKey(`ai_trainer_ad_watched_${dateKey}`, userId);
    const hasWatchedAdToday = await Storage.getItem(adWatchedKey) === 'true';
    console.log('🎬 [AI TRAINER] Ad watched today:', hasWatchedAdToday);
    console.log('🎬 [AI TRAINER] Ad watched key:', adWatchedKey);

    // If ad not watched today, show rewarded ad first
    if (!hasWatchedAdToday) {
      console.log('📺 [AI TRAINER] Ad NOT watched today - showing rewarded ad...');
      console.log('📺 [AI TRAINER] Ad Unit ID:', AdUnits.rewardedTrainer);
      
      // ✅ CRITICAL: Add timeout fallback in case ad never loads or callbacks never fire
      let adCallbackFired = false;
      const adTimeout = setTimeout(() => {
        if (!adCallbackFired) {
          console.log('⏱️ [AI TRAINER] Ad load timeout (10s) - proceeding without ad');
          showToast('warning', 'Ad timed out. Proceeding with message...');
          proceedWithSendingMessage();
        }
      }, 10000); // 10 second timeout
      
      // Show rewarded ad
      try {
        showRewardedAd(AdUnits.rewardedTrainer, {
          onEarned: async () => {
            if (adCallbackFired) return; // Prevent double execution
            adCallbackFired = true;
            clearTimeout(adTimeout);
            console.log('🎉 [AI TRAINER] onEarned callback triggered!');
            // Mark ad as watched for today
            await Storage.setItem(adWatchedKey, 'true');
            console.log('✅ [AI TRAINER] Ad marked as watched for today');
            // Proceed with sending message after ad is watched
            console.log('📤 [AI TRAINER] Proceeding with message send...');
            await proceedWithSendingMessage();
          },
          onError: (error) => {
            if (adCallbackFired) return; // Prevent double execution
            adCallbackFired = true;
            clearTimeout(adTimeout);
            console.error('❌ [AI TRAINER] Rewarded ad error:', error);
            console.error('❌ [AI TRAINER] Error message:', error?.message);
            console.error('❌ [AI TRAINER] Error code:', (error as any)?.code);
            // If ad fails, still allow sending message (graceful degradation)
            showToast('warning', 'Ad could not be loaded. Proceeding with message...');
            proceedWithSendingMessage();
          },
          onClosed: () => {
            if (adCallbackFired) return; // Prevent double execution
            adCallbackFired = true;
            clearTimeout(adTimeout);
            console.log('🔒 [AI TRAINER] Ad closed by user');
            // Ad was closed without watching - don't send message
            // User can try again by clicking send button
          }
        });
        console.log('📺 [AI TRAINER] showRewardedAd() called, waiting for callbacks...');
      } catch (error) {
        // Catch any synchronous errors from showRewardedAd
        clearTimeout(adTimeout);
        console.error('❌ [AI TRAINER] Exception calling showRewardedAd:', error);
        showToast('error', 'Ad system error. Proceeding with message...');
        proceedWithSendingMessage();
      }
      return; // Exit early, message will be sent after ad is watched
    }

    console.log('✅ [AI TRAINER] Ad already watched today, proceeding directly');
    // Ad already watched today, proceed directly
    await proceedWithSendingMessage();
  };

  // Separate function to handle the actual message sending logic
  const proceedWithSendingMessage = async () => {
    if (!currentMessage.trim()) return;

    // ✅ CRITICAL: Increment usage count BEFORE sending message to prevent race conditions
    // Note: Limit check is already done in handleSendMessage before showing ad
    try {
      const { getCurrentUserId, getUserCacheKey } = await import('../../src/utils/cacheKeys');
      const userId = await getCurrentUserId();
      
      if (!userId) {
        showToast('warning', t('aiTrainer.error.notAuthenticated'));
        return;
      }

      const today = new Date();
      const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD
      // ✅ CRITICAL: Use user-specific key for usage tracking (preserved across logout/login)
      const usageKey = await getUserCacheKey(`ai_trainer_usage_${dateKey}`, userId);

      const rawUsage = await Storage.getItem(usageKey);
      const currentCount = rawUsage ? Number(rawUsage) || 0 : 0;

      // Double-check limit (defensive programming - should never reach here if limit already hit)
      if (currentCount >= 3) {
        showToast('warning', t('aiTrainer.limit.reached'));
        return;
      }

      // Increment and persist usage before sending to avoid race conditions
      await Storage.setItem(usageKey, String(currentCount + 1));
    } catch (error) {
      console.error('Error incrementing AI Trainer usage count:', error);
      // If something goes wrong, still try to send the message
    }

    // ✅ CRITICAL: Ensure we have a current conversation (using user-specific key)
    const { getCurrentUserId, getUserCacheKey } = await import('../../src/utils/cacheKeys');
    const userId = await getCurrentUserId();
    if (userId) {
      const currentConversationIdKey = await getUserCacheKey('ai_trainer_current_conversation_id', userId);
      const currentConversationId = await Storage.getItem(currentConversationIdKey);
      if (!currentConversationId) {
        await aiTrainerService.createNewConversation();
      }
    } else {
      // No user ID, create new conversation anyway
      await aiTrainerService.createNewConversation();
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: currentMessage.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage.trim();
    setCurrentMessage('');
    setIsTyping(true);
    Keyboard.dismiss();

    try {
      const response = await aiTrainerService.sendMessage(messageToSend, language);

      if (response.success && response.data) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          message: response.data.message,
          timestamp: new Date(),
          category: response.data.category,
        };

        setChatMessages(prev => [...prev, aiMessage]);
        scrollToBottom();
      }
    } catch (error) {
      showToast('error', t('aiTrainer.error.send'));
    } finally {
      setIsTyping(false);
    }
  };

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleNotificationPress = () => {
    setNotificationModalVisible(true);
  };

  const handleSidebarMenuPress = async (action: string) => {
    setSidebarVisible(false);
    
    switch (action) {
      case 'profile':
        setShowProfilePage(true);
        break;
      case 'streak':
        router.push('/(dashboard)/streak');
        break;
      case 'ai-trainer':
        break;
      case 'language':
        router.push('/(dashboard)/language');
        break;
      case 'sport-mode':
        router.push('/(dashboard)/sport-mode');
        break;
      case 'settings':
        router.push('/(dashboard)/settings');
        break;
      case 'subscription':
        router.push('/(dashboard)/subscription');
        break;
      case 'contact':
        router.push('/(dashboard)/contact');
        break;
      case 'logout':
        try {
          const { authService } = await import('../../src/services/authService');
          await authService.logout();
          router.replace('/auth/login');
        } catch (error) {
          showToast('error', t('aiTrainer.error.logout'));
        }
        break;
    }
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // Load user info - fetch from API if cache is empty
  const loadUserInfo = async () => {
    try {
      // First try cache
      const cachedData = await userProfileService.getCachedData();
      if (cachedData && cachedData.data) {
        setUserInfo(cachedData.data);
        return;
      }

      // If no cache, fetch from API
      const response = await userProfileService.getUserProfile();
      if (response.success && response.data) {
        setUserInfo(response.data);
      }
    } catch (error) {
      // Failed to load user info
    }
  };

  const handleUpdateUserInfo = (updatedInfo: any) => {
    setUserInfo(updatedInfo);
  };

  // Load user info when profile page is opened
  useEffect(() => {
    if (showProfilePage && !userInfo) {
      loadUserInfo();
    }
  }, [showProfilePage]);

  if (isLoading) {
    return (
      <DecorativeBackground>
        <SafeAreaView style={styles.safeArea}>
          <DashboardHeader
            userName={user?.fullName || t('common.user')}
            onProfilePress={handleProfilePress}
            onNotificationPress={handleNotificationPress}
            notificationCount={unreadCount}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('aiTrainer.loading')}</Text>
          </View>
        </SafeAreaView>
      </DecorativeBackground>
    );
  }

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        <DashboardHeader
          userName={user?.fullName || t('common.user')}
          onProfilePress={handleProfilePress}
          onNotificationPress={handleNotificationPress}
          notificationCount={unreadCount}
        />

        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>{t('aiTrainer.title')}</Text>
                <Text style={styles.headerSubtitle}>{t('aiTrainer.subtitle')}</Text>
              </View>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => setHistoryModalVisible(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="time-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={[
              styles.messagesContent,
              { paddingBottom: 100 } // Space for input
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          >
            {canLoadMore && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
                activeOpacity={0.7}
              >
                <Text style={styles.loadMoreText}>{t('aiTrainer.loadMore')}</Text>
              </TouchableOpacity>
            )}

            {visibleMessages.map((message, index) => (
              <Animated.View
                key={message.id}
                entering={FadeInUp.delay(index * 50)}
                style={[
                  styles.messageRow,
                  message.type === 'user' ? styles.userRow : styles.aiRow
                ]}
              >
                {message.type === 'ai' && (
                  <View style={styles.aiAvatar}>
                    <Ionicons name="fitness" size={20} color={colors.white} />
                  </View>
                )}

                <View style={[
                  styles.messageBubble,
                  message.type === 'user' ? styles.userBubble : styles.aiBubble
                ]}>
                  {message.type === 'ai' ? (
                    <MarkdownText
                      text={language === 'ur' 
                        ? transliterateText(message.message)
                        : message.message}
                      textStyle={styles.aiMessageText}
                    />
                  ) : (
                    <Text style={[
                      styles.messageText,
                      styles.userMessageText
                    ]}>
                      {language === 'ur' 
                        ? transliterateText(message.message)
                        : message.message}
                    </Text>
                  )}
                  <Text style={[
                    styles.messageTime,
                    message.type === 'user' ? styles.userMessageTime : styles.aiMessageTime
                  ]}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </Animated.View>
            ))}

            {isTyping && (
              <Animated.View entering={FadeIn} style={styles.typingContainer}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="fitness" size={20} color={colors.white} />
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              </Animated.View>
            )}
          </ScrollView>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            style={styles.keyboardAvoidingView}
          >
            <View style={[styles.inputWrapper, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.messageInput}
                  placeholder={t('aiTrainer.placeholder')}
                  placeholderTextColor={colors.mutedText}
                  value={currentMessage}
                  onChangeText={setCurrentMessage}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !currentMessage.trim() && styles.sendButtonDisabled]}
                  onPress={handleSendMessage}
                  disabled={!currentMessage.trim() || isTyping}
                >
                  <Ionicons name="send" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>

        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={user?.fullName || t('common.user')}
          userEmail={user?.email || 'user@example.com'}
          userInfo={null}
          badges={[]}
        />

        {/* Notification Modal */}
        <NotificationModal
          visible={notificationModalVisible}
          onClose={() => setNotificationModalVisible(false)}
        />

        {/* Profile Page */}
        <ProfilePage
          visible={showProfilePage}
          onClose={() => {
            setShowProfilePage(false);
            setSidebarVisible(true);
          }}
          userInfo={userInfo}
          onUpdateUserInfo={handleUpdateUserInfo}
        />

        {/* Chat History Modal */}
        <ChatHistoryModal
          visible={historyModalVisible}
          onClose={() => setHistoryModalVisible(false)}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onDelete={async () => {
            // Reload chat history when current conversation is deleted
            await loadChatHistory();
          }}
        />
      </SafeAreaView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
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
  headerContainer: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '500',
    fontFamily: fonts.heading,
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  headerSubtitle: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.body,
    marginTop: 2,
  },
  historyButton: {
    position: 'absolute',
    // Calculate exact center alignment with notification icon:
    // Notification center = spacing.lg (20) + spacing.sm (10) + iconContainer/2 (22) = 52px from right
    // History icon center should be at same position: 52px from right
    // Icon is 24px, so center is 12px from icon edge
    // Button has spacing.sm (10px) padding, so: right = 52 - 12 - 10 = 30px
    right: 30,
    padding: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  messagesContent: {
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loadMoreButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: fonts.body,
    fontWeight: '500',
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    alignItems: 'flex-end',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginBottom: 4,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.cardBackground,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.body,
  },
  userMessageText: {
    color: colors.white,
  },
  aiMessageText: {
    color: colors.white,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
    fontFamily: fonts.body,
  },
  userMessageTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  aiMessageTime: {
    color: colors.mutedText,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginLeft: spacing.xs,
  },
  typingBubble: {
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  inputWrapper: {
    padding: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 25,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  messageInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.body,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  sendButtonDisabled: {
    backgroundColor: colors.mutedText,
    opacity: 0.5,
  },
});
