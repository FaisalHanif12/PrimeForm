import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput,
  Alert,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as MailComposer from 'expo-mail-composer';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors, spacing, typography, fonts, radius } from '../../src/theme/colors';
import { useLanguage } from '../../src/context/LanguageContext';
import { useToast } from '../../src/context/ToastContext';
import DecorativeBackground from '../../src/components/DecorativeBackground';

const { width: screenWidth } = Dimensions.get('window');

interface ContactForm {
  name: string;
  email: string;
  problem: string;
}

export default function ContactPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactForm>({
    name: '',
    email: '',
    problem: ''
  });

  // Handle back navigation - return to sidebar menu
  const handleBack = () => {
    router.back();
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      showToast('error', 'Please enter your name');
      return false;
    }
    if (!formData.email.trim()) {
      showToast('error', 'Please enter your email');
      return false;
    }
    if (!formData.email.includes('@')) {
      showToast('error', 'Please enter a valid email address');
      return false;
    }
    if (!formData.problem.trim()) {
      showToast('error', 'Please describe your problem');
      return false;
    }
    if (formData.problem.trim().length < 10) {
      showToast('error', 'Please provide more details about your problem (at least 10 characters)');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    try {
      // Check if device can send emails
      const isAvailable = await MailComposer.isAvailableAsync();
      
      if (!isAvailable) {
        showToast('error', 'Email is not available on this device');
        return;
      }

      // Prepare email data
      const emailData = {
        recipients: ['mehrfaisal111@gmail.com'],
        subject: `PrimeForm Contact Form - ${formData.name}`,
        body: `
Name: ${formData.name}
Email: ${formData.email}
Problem: ${formData.problem}

This message was sent from the PrimeForm app contact form.
        `.trim(),
        isHtml: false,
      };

      // Open email composer
      const result = await MailComposer.composeAsync(emailData);
      
      if (result.status === 'sent') {
        showToast('success', 'Message sent successfully! We\'ll get back to you soon.');
        
        // Clear form data
        setFormData({
          name: '',
          email: '',
          problem: ''
        });
      } else if (result.status === 'cancelled') {
        showToast('info', 'Email cancelled');
      } else {
        showToast('error', 'Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      showToast('error', 'Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContactForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.formHeader}>
        <View style={styles.formIconContainer}>
          <Ionicons name="mail" size={32} color={colors.gold} />
        </View>
        <Text style={styles.formTitle}>Get in Touch</Text>
        <Text style={styles.formSubtitle}>
          Have a question or need help? Send us a message and we'll get back to you as soon as possible.
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(text) => handleInputChange('name', text)}
          placeholder="Enter your full name"
          placeholderTextColor={colors.mutedText}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email Address *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.email}
          onChangeText={(text) => handleInputChange('email', text)}
          placeholder="Enter your email address"
          placeholderTextColor={colors.mutedText}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Describe Your Problem *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.problem}
          onChangeText={(text) => handleInputChange('problem', text)}
          placeholder="Please describe your problem or question in detail..."
          placeholderTextColor={colors.mutedText}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>
          {formData.problem.length}/500 characters
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
        activeOpacity={0.8}
      >
        {isSubmitting ? (
          <View style={styles.submitButtonContent}>
            <Ionicons name="hourglass-outline" size={20} color={colors.background} />
            <Text style={styles.submitButtonText}>Sending...</Text>
          </View>
        ) : (
          <View style={styles.submitButtonContent}>
            <Ionicons name="send" size={20} color={colors.background} />
            <Text style={styles.submitButtonText}>Send Message</Text>
          </View>
        )}
      </TouchableOpacity>


    </View>
  );

  return (
    <DecorativeBackground>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color={colors.gold} />
          </TouchableOpacity>
          
          {renderContactForm()}
          
          <View style={styles.bottomSpacing} />
        </ScrollView>
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
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },

  backButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.md,
  },
  formContainer: {
    marginTop: spacing.xl,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  formIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  formTitle: {
    fontSize: typography.h3,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.heading,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: typography.body,
    color: colors.mutedText,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.white,
    fontFamily: fonts.body,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: typography.body,
    fontFamily: fonts.body,
  },
  textArea: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  characterCount: {
    fontSize: typography.small,
    color: colors.mutedText,
    fontFamily: fonts.body,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  submitButton: {
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: colors.cardBorder,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '600',
    fontFamily: fonts.body,
  },

  bottomSpacing: {
    height: 100,
  },
});
