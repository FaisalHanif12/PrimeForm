import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fonts, radius } from '../theme/colors';

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color: string;
    strokeWidth: number;
  }[];
}

interface ProgressChartProps {
  title: string;
  data: ChartData;
  type: 'line' | 'bar' | 'area';
  period: 'daily' | 'weekly' | 'monthly';
}

export default function ProgressChart({ title, data, type, period }: ProgressChartProps) {
  // Simple, consistent theme for all charts
  const getChartColor = () => {
    if (title === 'Calories Trend') {
      return colors.primary; // Green for calories
    } else if (title === 'Workout Performance') {
      return colors.primary; // Green for workouts
    } else { // Hydration Tracking
      return colors.blue; // Blue for hydration
    }
  };

  const chartColor = getChartColor();

  const renderChart = () => {
    const values = data.datasets[0]?.data || [];
    if (values.length === 0) return null;

    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartArea}>
          {type === 'bar' ? (
            // Bar Chart
            <View style={styles.barContainer}>
              {values.map((value, index) => (
                <View key={index} style={styles.barColumn}>
                  <View 
                    style={[
                      styles.bar,
                      { 
                        height: `${(value / maxValue) * 100}%`,
                        backgroundColor: chartColor
                      }
                    ]} 
                  />
                </View>
              ))}
            </View>
          ) : (
            // Line/Area Chart
            <View style={styles.lineContainer}>
              {/* Subtle grid lines */}
              <View style={styles.gridLines}>
                {[0, 25, 50, 75, 100].map((percent) => (
                  <View key={percent} style={[styles.gridLine, { bottom: `${percent}%` }]} />
                ))}
              </View>
              
              {/* Chart line/area */}
              <View style={styles.dataLine}>
                {values.map((value, index) => {
                  const heightPercent = ((value - minValue) / range) * 100;
                  const leftPercent = values.length > 1 ? (index / (values.length - 1)) * 100 : 50;
                  
                  return (
                    <View key={index}>
                      {/* Data Point */}
                      <View 
                        style={[
                          styles.dataPoint,
                          {
                            left: `${leftPercent}%`,
                            bottom: `${heightPercent}%`,
                            backgroundColor: chartColor
                          }
                        ]} 
                      />
                      
                      {/* Area Fill for area charts */}
                      {type === 'area' && (
                        <View 
                          style={[
                            styles.areaFill,
                            {
                              left: `${leftPercent}%`,
                              height: `${heightPercent}%`,
                              backgroundColor: chartColor + '20'
                            }
                          ]} 
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Labels */}
        <View style={styles.labelsContainer}>
          {data.labels.map((label, index) => (
            <Text key={index} style={styles.chartLabel}>{label}</Text>
          ))}
        </View>
      </View>
    );
  };

  const getInsights = () => {
    const values = data.datasets[0]?.data || [];
    if (values.length === 0) return null;

    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const latest = values[values.length - 1];
    const previous = values[values.length - 2] || latest;
    const trend = latest > previous ? 'up' : latest < previous ? 'down' : 'stable';

    // Find the index of highest and lowest values
    const maxIndex = values.findIndex(val => val === max);
    const minIndex = values.findIndex(val => val === min);
    
    // Get the period label for highest and lowest
    const highestPeriod = maxIndex >= 0 && maxIndex < data.labels.length ? data.labels[maxIndex] : '';
    const lowestPeriod = minIndex >= 0 && minIndex < data.labels.length ? data.labels[minIndex] : '';

    return { average, max, min, latest, trend, highestPeriod, lowestPeriod };
  };

  const insights = getInsights();

  return (
    <View style={styles.container}>
      {/* Clean Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </Text>
        </View>
      </View>

      {/* Chart Visualization */}
      {renderChart()}

      {/* Clean Insights */}
      {insights && (
        <View style={styles.insightsContainer}>
          <View style={styles.insightRow}>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Average</Text>
              <Text style={[styles.insightValue, { color: chartColor }]}>
                {Math.round(insights.average)}
              </Text>
            </View>

            <View style={styles.insightDivider} />

            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Highest</Text>
              <Text style={[styles.insightValue, { color: chartColor }]}>
                {Math.round(insights.max)}
              </Text>
            </View>

            <View style={styles.insightDivider} />

            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Lowest</Text>
              <Text style={[styles.insightValue, { color: chartColor }]}>
                {Math.round(insights.min)}
              </Text>
            </View>

            <View style={styles.insightDivider} />

            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Trend</Text>
              <View style={[
                styles.trendBadge,
                {
                  backgroundColor: insights.trend === 'up' ? colors.green + '20' : 
                                 insights.trend === 'down' ? colors.error + '20' : 
                                 colors.mutedText + '20',
                }
              ]}>
                <Text style={[
                  styles.trendText,
                  {
                    color: insights.trend === 'up' ? colors.green : 
                          insights.trend === 'down' ? colors.error : colors.mutedText
                  }
                ]}>
                  {insights.trend === 'up' ? '↑' : insights.trend === 'down' ? '↓' : '→'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.white,
    letterSpacing: 0.3,
  },
  periodBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.primary + '15',
  },
  periodText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.body,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartWrapper: {
    marginBottom: spacing.lg,
  },
  chartArea: {
    height: 180,
    marginBottom: spacing.sm,
  },
  
  // Bar Chart Styles
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: spacing.xs,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  bar: {
    width: '85%',
    borderRadius: radius.xs,
    minHeight: 4,
  },
  
  // Line/Area Chart Styles
  lineContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  dataLine: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  dataPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: -3,
    marginBottom: -3,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  areaFill: {
    position: 'absolute',
    width: 2,
    bottom: 0,
    marginLeft: -1,
  },
  
  // Labels
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  chartLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
    flex: 1,
  },
  
  // Insights
  insightsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.md,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightItem: {
    flex: 1,
    alignItems: 'center',
  },
  insightDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.cardBorder,
    marginHorizontal: spacing.xs,
  },
  insightLabel: {
    color: colors.mutedText,
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginBottom: spacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
    color: colors.white,
  },
  trendBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
