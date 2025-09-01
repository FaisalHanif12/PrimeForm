import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useToast } from '../../src/context/ToastContext';





interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  popular?: boolean;
  priceId?: string;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle back navigation - return to sidebar menu
  const handleBack = () => {
    router.back();
  };

  // Pricing plans
  const pricingPlans: PricingPlan[] = [
    {
      name: language === 'en' ? 'Monthly' : 'ماہانہ',
      price: language === 'en' ? '$9.99' : '۹.۹۹$',
      period: language === 'en' ? '/month' : '/ماہ',
      features: [
        language === 'en' ? 'All Premium Features' : 'تمام پریمیم خصوصیات',
        language === 'en' ? 'Unlimited AI Plans' : 'لامحدود AI پلانز',
        language === 'en' ? 'AI Trainer Access' : 'AI ٹرینر تک رسائی',
        language === 'en' ? 'Streak Tracking' : 'اسٹریک ٹریکنگ',
        language === 'en' ? 'Priority Support' : 'ترجیحی سپورٹ'
      ],
      priceId: 'price_monthly'
    },
    {
      name: language === 'en' ? 'Yearly' : 'سالانہ',
      price: language === 'en' ? '$99.00' : '۹۹.۰۰$',
      period: language === 'en' ? '/year' : '/سال',
      features: [
        language === 'en' ? 'All Premium Features' : 'تمام پریمیم خصوصیات',
        language === 'en' ? 'Unlimited AI Plans' : 'لامحدود AI پلانز',
        language === 'en' ? 'AI Trainer Access' : 'AI ٹرینر تک رسائی',
        language === 'en' ? 'Streak Tracking' : 'اسٹریک ٹریکنگ',
        language === 'en' ? 'Priority Support' : 'ترجیحی سپورٹ',
        language === 'en' ? '20% Discount Applied' : '۲۰٪ ڈسکاؤنٹ لاگو'
      ],
      popular: true,
      priceId: 'price_yearly'
    }
  ];



  const handleSubscribe = async (plan: PricingPlan) => {
    if (!plan.priceId) {
      showToast('error', language === 'en' ? 'Plan not available' : 'پلان دستیاب نہیں');
      return;
    }

    setIsProcessing(true);
    
    try {
      // In a real app, you would integrate with Stripe or another payment processor
      Alert.alert(
        language === 'en' ? 'Subscribe to Premium' : 'پریمیم میں شامل ہوں',
        language === 'en' 
          ? `Subscribe to ${plan.name} plan for ${plan.price}${plan.period}?`
          : `${plan.name} پلان میں ${plan.price}${plan.period} کے لیے شامل ہوں؟`,
        [
          { text: language === 'en' ? 'Cancel' : 'منسوخ', style: 'cancel' },
          {
            text: language === 'en' ? 'Subscribe' : 'سبسکرائب',
            onPress: () => {
              // Simulate subscription process
              setTimeout(() => {
                showToast('success', language === 'en' ? 'Subscription successful!' : 'سبسکرپشن کامیاب!');
                setIsProcessing(false);
                setSelectedPlan(null);
              }, 2000);
            }
          }
        ]
      );
    } catch (error) {
      showToast('error', language === 'en' ? 'Subscription failed' : 'سبسکرپشن ناکام');
    } finally {
      setIsProcessing(false);
    }
  };



  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={handleBack}
      >
        <Ionicons name="arrow-back" size={24} color={colors.gold} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {language === 'en' ? 'Upgrade to Premium' : 'پریمیم میں اپ گریڈ کریں'}
      </Text>
      <View style={styles.headerRight} />
    </View>
  );



  const renderPricingSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {language === 'en' ? 'Choose Your Plan' : 'اپنا پلان منتخب کریں'}
      </Text>
      <View style={styles.pricingContainer}>
        {pricingPlans.map((plan, index) => (
          <View 
            key={index} 
            style={styles.pricingCard}
          >
            {plan.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>
                  {language === 'en' ? 'MOST POPULAR' : 'سب سے زیادہ مقبول'}
                </Text>
              </View>
            )}
            
            <View style={styles.pricingHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{plan.price}</Text>
                <Text style={styles.period}>{plan.period}</Text>
              </View>
            </View>

            <View style={styles.featuresList}>
              {plan.features.map((feature, featureIndex) => (
                <View key={featureIndex} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                selectedPlan === plan.priceId && styles.selectedButton,
                isProcessing && styles.processingButton
              ]}
              onPress={() => handleSubscribe(plan)}
              disabled={isProcessing}
            >
              <Text style={styles.subscribeButtonText}>
                {isProcessing 
                  ? (language === 'en' ? 'Processing...' : 'پروسیسنگ...')
                  : (language === 'en' ? 'Subscribe Now' : 'اب سبسکرائب کریں')
                }
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );



  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderPricingSection()}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: 'bold',
    color: colors.gold,
    fontFamily: fonts.heading,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  section: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.lg,
    fontFamily: fonts.heading,
  },
  pricingContainer: {
    gap: spacing.lg,
  },
  pricingCard: {
    backgroundColor: colors.cardBackground,
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
  },
  popularCard: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  selectedCard: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: spacing.lg,
    backgroundColor: colors.gold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  popularText: {
    color: colors.background,
    fontSize: typography.small,
    fontWeight: 'bold',
    fontFamily: fonts.body,
  },
  pricingHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  planName: {
    fontSize: typography.h4,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.sm,
    fontFamily: fonts.heading,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: typography.title,
    fontWeight: 'bold',
    color: colors.gold,
    fontFamily: fonts.heading,
  },
  period: {
    fontSize: typography.body,
    color: colors.mutedText,
    marginLeft: spacing.xs,
    fontFamily: fonts.body,
  },
  featuresList: {
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: typography.body,
    color: colors.white,
    marginLeft: spacing.sm,
    fontFamily: fonts.body,
  },
  subscribeButton: {
    backgroundColor: colors.gold,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: colors.green,
  },
  processingButton: {
    backgroundColor: colors.blue,
  },
  subscribeButtonText: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.body,
  },

  bottomPadding: {
    height: spacing.xl,
  },
});
