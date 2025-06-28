import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {
  Clock,
  Target,
  TriangleAlert as AlertTriangle,
  CheckIcon,
  X,
} from 'lucide-react-native';
import { Signal } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

interface SignalCardProps {
  signal: Signal;
}

export default function SignalCard({ signal }: SignalCardProps) {
  const { colors, fontSizes } = useTheme();
  const [visible, setVisible] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'closed':
        return colors.textSecondary;
      case 'pending':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const signalTime = new Date(timestamp);
    const diff = now.getTime() - signalTime.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const formatPrice = (price: number) => {
    if (signal.pair.includes('XAU') || signal.pair.includes('XAG')) {
      return price.toFixed(2);
    }
    return price.toFixed(4);
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    pairContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pair: {
      fontSize: fontSizes.large,
      fontWeight: 'bold',
      color: colors.text,
    },
    typeLabel: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor:
        signal.type === 'BUY'
          ? `${colors.success}20`
          : `${colors.error}20`,
    },
    typeLabelText: {
      fontSize: fontSizes.large,
      color: signal.type === 'BUY' ? colors.success : colors.error,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    metaInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    timeText: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
    },
    accuracyText: {
      fontSize: fontSizes.medium,
      color: colors.success,
    },
    riskReward: {
      fontSize: fontSizes.small,
      color: colors.secondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    bottomSheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: '70%',
      flex: 1,
      overflow: 'scroll',
      shadowColor: '#000',
      paddingBottom: 40,
    },
    sheetTitle: {
      fontSize: fontSizes.title,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 12,
    },
    sheetItem: {
      fontSize: fontSizes.large,
      color: colors.text,
      marginBottom: 6,
    },
    sheetDescription: {
      marginTop: 12,
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      lineHeight: 20,
    },

    takeProfitContainer: {
      marginTop: 12,
      gap: 8,
      marginBottom: 12,
    },

    takeProfitItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },

    takeProfitText: {
      fontSize: fontSizes.large,
      color: colors.text,
      fontFamily: 'Inter-Medium',
      gap: 8,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },

  });
  function calculatePips(signal: Signal) {
    const entryPrice = signal.entry_price;
    const takeProfitLevels = signal.take_profit_levels;
    const stopLoss = signal.stop_loss;

    const maxProfit = takeProfitLevels.reduce(
      (max, current) => Math.max(max, current - entryPrice),
      0
    );

    const maxLoss = stopLoss - entryPrice;

    const pips = maxProfit - maxLoss;

    return pips.toFixed(2);
  }

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={() => setVisible(true)}>
        <View style={styles.header}>
          <View style={styles.pairContainer}>
            <Text style={styles.pair}>{signal.pair}</Text>
            <View style={styles.typeLabel}>
              <Text style={styles.typeLabelText}>{signal.type}</Text>
            </View>

          </View>
          <Text style={{ color: getStatusColor(signal.status) }}>
            {signal.status.toUpperCase()}
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.metaInfo}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.timeText}>{getTimeAgo(signal.timestamp)}</Text>
            <Text style={styles.timeText}>•</Text>
            <Text style={styles.accuracyText}>{signal.accuracy}% accuracy</Text>
          </View>
          {signal.risk_reward && (
            <Text style={styles.riskReward}>R:R {signal.risk_reward}</Text>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setVisible(false)}>
          <Pressable style={styles.bottomSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={styles.sheetTitle}>{signal.pair} ({signal.type})</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setVisible(false)}>
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.sheetItem}>
              Entry Price: {formatPrice(signal.entry_price)}
            </Text>
            <View style={styles.takeProfitContainer}>
              {signal.take_profit_levels.map((tp, index) => {
                const isReached = signal.current_price !== undefined && signal.current_price !== null && signal.current_price >= tp;

                return (
                  <View key={index} style={styles.takeProfitItem}>
                    <Text style={styles.takeProfitText}>
                      Take Profit-{index + 1}:
                    </Text>
                    <Text style={styles.takeProfitText}>
                      {formatPrice(tp)}
                      <CheckIcon
                        size={16}
                        color={isReached ? colors.success : colors.textSecondary}
                      />
                    </Text>

                  </View>
                );
              })}
            </View>

            <Text style={styles.sheetItem}>
              Stop Loss: {formatPrice(signal.stop_loss)}
            </Text>
            <Text style={styles.sheetItem}>
              R:R: {signal.risk_reward}
            </Text>

            {signal.description && (
              <Text style={styles.sheetDescription}>{signal.description}</Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
