import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { colors, spacing, fonts, radius } from '../theme/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');

interface ExerciseCompleteModalProps {
  visible: boolean;
  exerciseName: string;
  sets: number;
  reps: number;
  totalReps: number;
  onClose: () => void;
}

export default function ExerciseCompleteModal({
  visible,
  exerciseName,
  sets,
  reps,
  totalReps,
  onClose,
}: ExerciseCompleteModalProps) {
  const { t } = useLanguage();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.modalContainer}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalContent}>
              {/* Title */}
              <Animated.View
                entering={FadeInDown.delay(100).duration(400)}
                style={styles.titleContainer}
              >
                <Text style={styles.title}>{t('sportMode.exercise.complete.title')}</Text>
              </Animated.View>

              {/* Message */}
              <Animated.View
                entering={FadeInDown.delay(200).duration(400)}
                style={styles.messageContainer}
              >
                <Text style={styles.message}>
                  {t('sportMode.exercise.complete.message')} {sets} {t('sportMode.exercise.set')} {exerciseName}.
                </Text>
              </Animated.View>

              {/* Stats */}
              <Animated.View
                entering={FadeInDown.delay(300).duration(400)}
                style={styles.statsContainer}
              >
                <View style={styles.statsCard}>
                  <View style={styles.statsRow}>
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                    </View>
                    <Text style={styles.statsText}>
                      {reps} {t('sportMode.stats.reps')} × {sets} {t('sportMode.stats.sets')} = {totalReps} {t('sportMode.exercise.complete.totalReps')}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* Done Button */}
              <Animated.View
                entering={FadeInDown.delay(400).duration(400)}
                style={styles.buttonContainer}
              >
                <TouchableOpacity
                  style={styles.doneButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.green, colors.green + 'DD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.doneButtonText}>{t('sportMode.exercise.complete.done')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl + spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.4,
    shadowRadius: 25,
    elevation: 15,
  },
  titleContainer: {
    marginBottom: spacing.lg,
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.headingBold,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  messageContainer: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
    width: '100%',
  },
  message: {
    fontSize: 16,
    color: colors.mutedText,
    fontFamily: fonts.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    width: '100%',
    marginBottom: spacing.xl + spacing.md,
  },
  statsCard: {
    backgroundColor: colors.green + '15',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.green + '40',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  checkmarkContainer: {
    marginRight: spacing.xs,
  },
  statsText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.green,
    fontFamily: fonts.heading,
    textAlign: 'center',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
  },
  doneButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    width: '100%',
  },
  buttonGradient: {
    paddingVertical: spacing.md + spacing.xs,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.white,
    fontFamily: fonts.headingBold,
    letterSpacing: 0.5,
  },
});

