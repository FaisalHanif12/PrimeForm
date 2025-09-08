import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInLeft, FadeInRight, SlideInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useAuthContext } from '../../src/context/AuthContext';
import { useToast } from '../../src/context/ToastContext';
import DashboardHeader from '../../src/components/DashboardHeader';
import BottomNavigation from '../../src/components/BottomNavigation';
import Sidebar from '../../src/components/Sidebar';
import DecorativeBackground from '../../src/components/DecorativeBackground';
import aiTrainerService from '../../src/services/aiTrainerService';

const { width: screenWidth } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: Date;
  category?: 'workout' | 'diet' | 'motivation' | 'general';
}

interface TrainerInsight {
  id: string;
  title: string;
  description: string;
  category: 'workout' | 'diet' | 'recovery' | 'motivation';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  icon: string;
}

interface WorkoutRecommendation {
  id: string;
  title: string;
  description: string;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    notes?: string;
  }>;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focus: string[];
}

export default function AITrainerScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuthContext();
  const { showToast } = useToast();
  
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'chat' | 'insights' | 'recommendations'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [insights, setInsights] = useState<TrainerInsight[]>([]);
  const [recommendations, setRecommendations] = useState<WorkoutRecommendation[]>([]);

  useEffect(() => {
    loadAITrainerData();
  }, []);

  const loadAITrainerData = async () => {
    try {
      setIsLoading(true);
      
      // Check if user has premium subscription
      const hasSubscription = await checkPremiumSubscription();
      if (!hasSubscription) {
        showToast('warning', 'AI Trainer is available for Premium subscribers only.');
        router.push('/(dashboard)/subscription');
        return;
      }

      // Load chat history
      const chatResponse = await aiTrainerService.getChatHistory();
      if (chatResponse.success && chatResponse.data) {
        setChatMessages(chatResponse.data);
      }

      // Load insights
      const insightsResponse = await aiTrainerService.getPersonalizedInsights();
      if (insightsResponse.success && insightsResponse.data) {
        setInsights(insightsResponse.data);
      }

      // Load recommendations
      const recommendationsResponse = await aiTrainerService.getWorkoutRecommendations();
      if (recommendationsResponse.success && recommendationsResponse.data) {
        setRecommendations(recommendationsResponse.data);
      }

      // Add welcome message if no chat history
      if (chatMessages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          type: 'ai',
          message: `👋 Hello ${user?.fullName || 'there'}! I'm your AI Trainer, powered by advanced fitness intelligence. I'm here to help you optimize your workouts, nutrition, and overall fitness journey. What would you like to know?`,
          timestamp: new Date(),
          category: 'general'
        };
        setChatMessages([welcomeMessage]);
      }

    } catch (error) {
      console.error('Failed to load AI trainer data:', error);
      showToast('error', 'Failed to load AI trainer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPremiumSubscription = async (): Promise<boolean> => {
    // TODO: Implement actual subscription check
    // For now, return true for development
    return true;
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: currentMessage.trim(),
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    try {
      const response = await aiTrainerService.sendMessage(currentMessage.trim());
      
      if (response.success && response.data) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          message: response.data.message,
          timestamp: new Date(),
          category: response.data.category,
        };
        
        setChatMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      showToast('error', 'Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleProfilePress = () => {
    setSidebarVisible(true);
  };

  const handleSidebarMenuPress = async (action: string) => {
    switch (action) {
      case 'profile':
        router.push('/(dashboard)');
        break;
      case 'streak':
        router.push('/(dashboard)/streak');
        break;
      case 'ai-trainer':
        // Already on AI trainer page
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
          console.error('Logout failed:', error);
          showToast('error', 'Failed to logout. Please try again.');
        }
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleTabPress = (tab: 'home' | 'diet' | 'gym' | 'workout' | 'progress') => {
    if (tab === 'home') {
      router.push('/(dashboard)');
    } else if (tab === 'workout') {
      router.push('/(dashboard)/workout');
    } else if (tab === 'diet') {
      router.push('/(dashboard)/diet');
    } else if (tab === 'gym') {
      router.push('/(dashboard)/gym');
    } else if (tab === 'progress') {
      router.push('/(dashboard)/progress');
    }
  };

  const renderTabSelector = () => (
    <Animated.View entering={FadeInUp.delay(200)} style={styles.tabSelector}>
      {(['chat', 'insights', 'recommendations'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tabButton,
            selectedTab === tab && styles.tabButtonActive
          ]}
          onPress={() => setSelectedTab(tab)}
        >
          <Text style={[
            styles.tabButtonText,
            selectedTab === tab && styles.tabButtonTextActive
          ]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </Animated.View>
  );

  const renderChat = () => (
    <KeyboardAvoidingView 
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {chatMessages.map((message, index) => (
          <Animated.View
            key={message.id}
            entering={FadeInUp.delay(index * 50)}
            style={[
              styles.messageContainer,
              message.type === 'user' ? styles.userMessageContainer : styles.aiMessageContainer
            ]}
          >
            <View style={[
              styles.messageBubble,
              message.type === 'user' ? styles.userMessageBubble : styles.aiMessageBubble
            ]}>
              {message.type === 'ai' && (
                <View style={styles.aiHeader}>
                  <Text style={styles.aiIcon}>🤖</Text>
                  <Text style={styles.aiLabel}>AI Trainer</Text>
                  {message.category && (
                    <View style={[styles.categoryBadge, getCategoryStyle(message.category)]}>
                      <Text style={styles.categoryBadgeText}>
                        {message.category.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              <Text style={[
                styles.messageText,
                message.type === 'user' ? styles.userMessageText : styles.aiMessageText
              ]}>
                {message.message}
              </Text>
              <Text style={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </Animated.View>
        ))}
        
        {isTyping && (
          <Animated.View entering={FadeInUp} style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>AI Trainer is typing...</Text>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </Animated.View>
        )}
      </ScrollView>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Ask your AI trainer anything..."
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
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'workout': return { backgroundColor: colors.primary };
      case 'diet': return { backgroundColor: colors.green };
      case 'motivation': return { backgroundColor: colors.gold };
      default: return { backgroundColor: colors.mutedText };
    }
  };

  const renderInsights = () => (
    <Animated.View entering={FadeInUp.delay(300)} style={styles.insightsContainer}>
      <Text style={styles.sectionTitle}>🧠 Personalized Insights</Text>
      <View style={styles.insightsList}>
        {insights.map((insight) => (
          <View key={insight.id} style={[
            styles.insightCard,
            insight.priority === 'high' && styles.insightCardHigh
          ]}>
            <View style={styles.insightHeader}>
              <Text style={styles.insightIcon}>{insight.icon}</Text>
              <View style={styles.insightTitleContainer}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <View style={styles.insightBadges}>
                  <View style={[styles.categoryBadge, getCategoryStyle(insight.category)]}>
                    <Text style={styles.categoryBadgeText}>
                      {insight.category.toUpperCase()}
                    </Text>
                  </View>
                  <View style={[styles.priorityBadge, getPriorityStyle(insight.priority)]}>
                    <Text style={styles.priorityBadgeText}>
                      {insight.priority.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.insightDescription}>{insight.description}</Text>
            {insight.actionable && (
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Take Action</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high': return { backgroundColor: colors.error };
      case 'medium': return { backgroundColor: colors.warning };
      case 'low': return { backgroundColor: colors.mutedText };
      default: return { backgroundColor: colors.mutedText };
    }
  };

  const renderRecommendations = () => (
    <Animated.View entering={FadeInUp.delay(300)} style={styles.recommendationsContainer}>
      <Text style={styles.sectionTitle}>💪 Workout Recommendations</Text>
      <View style={styles.recommendationsList}>
        {recommendations.map((recommendation) => (
          <View key={recommendation.id} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
              <View style={styles.recommendationMeta}>
                <View style={[styles.difficultyBadge, getDifficultyStyle(recommendation.difficulty)]}>
                  <Text style={styles.difficultyBadgeText}>
                    {recommendation.difficulty.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.recommendationDuration}>
                  {recommendation.duration} min
                </Text>
              </View>
            </View>
            
            <Text style={styles.recommendationDescription}>
              {recommendation.description}
            </Text>
            
            <View style={styles.focusAreas}>
              {recommendation.focus.map((focus, index) => (
                <View key={index} style={styles.focusTag}>
                  <Text style={styles.focusTagText}>{focus}</Text>
                </View>
              ))}
            </View>
            
            <View style={styles.exercisesList}>
              <Text style={styles.exercisesTitle}>Exercises:</Text>
              {recommendation.exercises.slice(0, 3).map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.sets} sets × {exercise.reps}
                  </Text>
                </View>
              ))}
              {recommendation.exercises.length > 3 && (
                <Text style={styles.moreExercises}>
                  +{recommendation.exercises.length - 3} more exercises
                </Text>
              )}
            </View>
            
            <TouchableOpacity style={styles.startWorkoutButton}>
              <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </Animated.View>
  );

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return { backgroundColor: colors.green };
      case 'intermediate': return { backgroundColor: colors.warning };
      case 'advanced': return { backgroundColor: colors.error };
      default: return { backgroundColor: colors.mutedText };
    }
  };

  if (isLoading) {
    return (
      <DecorativeBackground>
        <SafeAreaView style={styles.safeArea}>
          <DashboardHeader 
            userName={user?.fullName || t('common.user')}
            onProfilePress={handleProfilePress}
            onNotificationPress={() => console.log('Notifications pressed')}
            notificationCount={0}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Initializing AI Trainer...</Text>
          </View>
          <BottomNavigation 
            activeTab="progress"
            onTabPress={handleTabPress}
          />
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
          onNotificationPress={() => console.log('Notifications pressed')}
          notificationCount={0}
        />

        <View style={styles.container}>
          {/* Hero Section */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.heroSection}>
            <Text style={styles.heroTitle}>🤖 AI Trainer</Text>
            <Text style={styles.heroSubtitle}>Premium Feature - Your Personal Fitness Coach</Text>
          </Animated.View>

          {/* Tab Selector */}
          {renderTabSelector()}

          {/* Content */}
          {selectedTab === 'chat' && renderChat()}
          {selectedTab === 'insights' && (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {renderInsights()}
              <View style={styles.bottomSpacing} />
            </ScrollView>
          )}
          {selectedTab === 'recommendations' && (
            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {renderRecommendations()}
              <View style={styles.bottomSpacing} />
            </ScrollView>
          )}
        </View>

        <BottomNavigation 
          activeTab="progress"
          onTabPress={handleTabPress}
        />

        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onMenuItemPress={handleSidebarMenuPress}
          userName={user?.fullName || t('common.user')}
          userEmail={user?.email || 'user@example.com'}
          userInfo={null}
          badges={[]}
        />
      </SafeAreaView>
    </DecorativeBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.mutedText,
    fontSize: typography.body,
    fontFamily: fonts.body,
    marginTop: spacing.md,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
    fontFamily: fonts.heading,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.body,
    textAlign: 'center',
  },

  // Tab Selector
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },
  tabButtonTextActive: {
    color: colors.white,
  },

  // Chat
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    marginBottom: spacing.md,
  },
  messagesContent: {
    paddingVertical: spacing.md,
  },
  messageContainer: {
    marginBottom: spacing.md,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  userMessageBubble: {
    backgroundColor: colors.primary,
  },
  aiMessageBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  aiIcon: {
    fontSize: 16,
  },
  aiLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  messageText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: fonts.body,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.white,
  },
  aiMessageText: {
    color: colors.white,
  },
  messageTime: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginTop: spacing.xs,
    opacity: 0.7,
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  typingBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typingText: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  messageInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    fontFamily: fonts.body,
    maxHeight: 100,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  sendButtonDisabled: {
    backgroundColor: colors.mutedText,
    opacity: 0.5,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },

  // Badges
  categoryBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  categoryBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },
  priorityBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  priorityBadgeText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  difficultyBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    fontFamily: fonts.heading,
  },

  // Insights
  insightsContainer: {
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: fonts.heading,
    marginBottom: spacing.lg,
  },
  insightsList: {
    gap: spacing.md,
  },
  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  insightCardHigh: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  insightIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  insightTitleContainer: {
    flex: 1,
  },
  insightTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    marginBottom: spacing.xs,
  },
  insightBadges: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  insightDescription: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.heading,
  },

  // Recommendations
  recommendationsContainer: {
    paddingVertical: spacing.md,
  },
  recommendationsList: {
    gap: spacing.lg,
  },
  recommendationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  recommendationTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    flex: 1,
    marginRight: spacing.md,
  },
  recommendationMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  recommendationDuration: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  recommendationDescription: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  focusAreas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  focusTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  focusTagText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
  },
  exercisesList: {
    marginBottom: spacing.md,
  },
  exercisesTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  exerciseName: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    flex: 1,
  },
  exerciseDetails: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
  },
  moreExercises: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.body,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  startWorkoutButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  startWorkoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },
});
