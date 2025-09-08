import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, fonts, radius } from '../theme/colors';

const { width: screenWidth } = Dimensions.get('window');

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
  const chartWidth = screenWidth - spacing.lg * 2;
  const chartHeight = 220;

  const renderCustomChart = () => {
    const values = data.datasets[0]?.data || [];
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;

    return (
      <View style={styles.customChart}>
        {/* Chart Area */}
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
                        backgroundColor: data.datasets[0]?.color || colors.primary
                      }
                    ]} 
                  />
                  <Text style={styles.barValue}>{Math.round(value)}</Text>
                </View>
              ))}
            </View>
          ) : (
            // Line/Area Chart
            <View style={styles.lineContainer}>
              <View style={styles.gridLines}>
                {[0, 25, 50, 75, 100].map((percent) => (
                  <View key={percent} style={[styles.gridLine, { bottom: `${percent}%` }]} />
                ))}
              </View>
              
              <View style={styles.dataLine}>
                {values.map((value, index) => {
                  const heightPercent = ((value - minValue) / range) * 100;
                  const leftPercent = (index / (values.length - 1)) * 100;
                  
                  return (
                    <View key={index}>
                      {/* Data Point */}
                      <View 
                        style={[
                          styles.dataPoint,
                          {
                            left: `${leftPercent}%`,
                            bottom: `${heightPercent}%`,
                            backgroundColor: data.datasets[0]?.color || colors.primary
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
                              backgroundColor: (data.datasets[0]?.color || colors.primary) + '30'
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
    const previous = values[values.length - 2];
    const trend = latest > previous ? 'up' : latest < previous ? 'down' : 'stable';

    return { average, max, min, latest, trend };
  };

  const insights = getInsights();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.period}>{period.charAt(0).toUpperCase() + period.slice(1)}</Text>
      </View>

      <View style={styles.chartContainer}>
        {renderCustomChart()}
      </View>

      {insights && (
        <View style={styles.insightsContainer}>
          <View style={styles.insightRow}>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Average</Text>
              <Text style={styles.insightValue}>{Math.round(insights.average)}</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Highest</Text>
              <Text style={styles.insightValue}>{insights.max}</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Lowest</Text>
              <Text style={styles.insightValue}>{insights.min}</Text>
            </View>
            <View style={styles.insightItem}>
              <Text style={styles.insightLabel}>Trend</Text>
              <Text style={[styles.insightValue, {
                color: insights.trend === 'up' ? colors.green : 
                      insights.trend === 'down' ? colors.error : colors.mutedText
              }]}>
                {insights.trend === 'up' ? '↗️' : insights.trend === 'down' ? '↘️' : '→'}
              </Text>
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
    padding: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
  period: {
    color: colors.mutedText,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.body,
    backgroundColor: colors.cardBorder + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  customChart: {
    width: '100%',
    height: 220,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    marginBottom: spacing.md,
  },
  
  // Bar Chart Styles
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingHorizontal: spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  bar: {
    width: '80%',
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
    minHeight: 4,
  },
  barValue: {
    color: colors.mutedText,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fonts.body,
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
    backgroundColor: colors.cardBorder + '40',
  },
  dataLine: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginBottom: -4,
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
    paddingHorizontal: spacing.sm,
  },
  chartLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
    textAlign: 'center',
    flex: 1,
  },
  insightsContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.md,
  },
  insightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightItem: {
    alignItems: 'center',
    flex: 1,
  },
  insightLabel: {
    color: colors.mutedText,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.body,
    marginBottom: spacing.xs,
  },
  insightValue: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.heading,
  },
});
