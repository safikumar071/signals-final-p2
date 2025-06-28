import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Settings2, Bell, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import AssetSwitcher from '../../components/AssetSwitcher';
import TimeframeSwitcher from '../../components/TimeframeSwitcher';
import ConnectionStatus from '@/components/ConnectionStatus';
import MarketOverview from '@/components/MarketOverview';
import NotificationSheet from '@/components/NotificationSheet';
import SetupGuide from '@/components/SetupGuide';
import { fetchMarketData, fetchTechnicalIndicators, fetchEconomicEvents, MarketData, TechnicalIndicator, EconomicEvent } from '../../lib/database';
import { getForexPrice } from '../../lib/forex';
import { fetchPriceSummary } from '../../lib/database'; // ⬅️ import the new function

const screenWidth = Dimensions.get('window').width;

type LivePriceData = {
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  volume: string | number;
  updated_at?: string; // optional, if you want to show last updated time
};

const getTradingViewInterval = (label: string): string => {
  const map: Record<string, string> = {
    '1M': '1',
    '5M': '5',
    '15M': '15',
    '1H': '60',
    '4H': '240',
    '1D': 'D',
    '1W': 'W',
  };
  return map[label] || '60'; // default to 1H
};


export default function HomeScreen() {
  const { colors, fontSizes } = useTheme();
  const [selectedAsset, setSelectedAsset] = useState<'XAU/USD' | 'BTC/USD'>('XAU/USD');
  const [timeframe, setTimeframe] = useState('1H');
  const [setupGuideVisible, setSetupGuideVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [technicalIndicators, setTechnicalIndicators] = useState<TechnicalIndicator[]>([]);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const tradingViewInterval = getTradingViewInterval(timeframe);
  // const [priceLoading, setPriceLoading] = useState(false);

  const fetchLivePrice = async () => {
    setPriceLoading(true);

    try {
      const data = await fetchPriceSummary(selectedAsset.toUpperCase());

      if (!data) throw new Error('Price summary not available');

      setCurrentData({
        price: data.current_price,
        change: data.change_amount,
        change_percent: data.change_percent,
        high: data.high_price,
        low: data.low_price,
        volume: data.volume ?? '-',
      });
    } catch (error) {
      console.error('❌ Error fetching price summary:', error);
    } finally {
      setPriceLoading(false);
    }
  };

  const [currentData, setCurrentData] = useState<LivePriceData>({
    price: 0,
    change: 0,
    change_percent: 0,
    high: 0,
    low: 0,
    volume: '-',
    updated_at: undefined, // optional, if you want to show last updated time
  });
  const [priceLoading, setPriceLoading] = useState(false);

  useEffect(() => {
    loadData();
    // fetchLivePrice();
  }, [selectedAsset]);

  const loadData = async () => {
    try {
      const [market, indicators, events] = await Promise.all([
        fetchMarketData(),
        fetchTechnicalIndicators(selectedAsset),
        fetchEconomicEvents(),
      ]);

      setMarketData(market);
      setTechnicalIndicators(indicators);
      setEconomicEvents(events);

      // 🔄 Set current live price from DB based on selectedAsset
      const assetData = market.find(item => item.pair === selectedAsset);
      if (assetData) {
        setCurrentData({
          price: assetData.price,
          change: assetData.change,
          change_percent: assetData.change_percent,
          high: assetData.high,
          low: assetData.low,
          volume: assetData.volume || '-', // fallback
          updated_at: assetData.updated_at,
        });
      }
    } catch (error) {
      console.error('Error loading home screen data:', error);
    } finally {
      setPriceLoading(false); // optional
    }
  };


  // Use live price if available
  if (livePrice) {
    currentData.price = livePrice;
  }

  const getTradingViewHTML = (symbol: string, interval: string): string => {
    const formattedSymbol = symbol.replace('/', '');
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          background-color: #f1f3f6;
        }
      </style>
    </head>
    <body>
      <iframe
        src="https://s.tradingview.com/widgetembed/?frameElementId=tv_embed&symbol=${formattedSymbol}&interval=${interval}&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=light&style=1&timezone=exchange"
        style="width:100%;height:100%;border:none;"
        sandbox="allow-scripts allow-same-origin"
      ></iframe>
    </body>
    </html>
  `;
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
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: fontSizes.title + 4,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    subtitle: {
      fontSize: fontSizes.medium,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    livePriceCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    livePriceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    pairTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
    },
    refreshButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    changeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    livePriceValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      fontFamily: 'Inter-Bold',
      marginBottom: 12,
    },
    priceLoading: {
      color: colors.textSecondary,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    statItem: {
      alignItems: 'center',
    },
    statLabel: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
    statValue: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    chartContainer: {
      height: 300,
      marginHorizontal: 20,
      marginBottom: 24,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: fontSizes.subtitle,
      fontWeight: 'bold',
      color: colors.text,
      // marginBottom: 16,
      fontFamily: 'Inter-Bold',
    },

    indicatorCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    indicatorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    indicatorName: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontFamily: 'Inter-Medium',
    },
    indicatorValue: {
      fontSize: fontSizes.medium,
      fontFamily: 'Inter-Medium',
    },
    indicatorStatus: {
      fontSize: fontSizes.small,
      fontFamily: 'Inter-Regular',
    },
    eventCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    eventHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    eventTime: {
      fontSize: fontSizes.medium,
      color: colors.primary,
      fontFamily: 'Inter-Medium',
    },
    impactBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    impactText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.text,
      fontFamily: 'Inter-SemiBold',
    },
    eventContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    currencyBadge: {
      fontSize: fontSizes.small,
      color: colors.primary,
      backgroundColor: `${colors.primary}20`,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      fontFamily: 'Inter-Medium',
    },
    eventName: {
      fontSize: fontSizes.medium,
      color: colors.text,
      flex: 1,
      fontFamily: 'Inter-Regular',
    },
    eventDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    eventDetail: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      fontFamily: 'Inter-Regular',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Gold & Silver Signals</Text>
          <Text style={styles.subtitle}>Live Trading Opportunities</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}
            onPress={() => setSetupGuideVisible(true)}
          >
            <Settings2 size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}
            onPress={() => setNotificationVisible(true)}
          >
            <Bell size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* <ConnectionStatus /> */}
      {/* <MarketOverview /> */}
      <AssetSwitcher selectedAsset={selectedAsset} onAssetChange={setSelectedAsset} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.livePriceCard}>
          <View style={styles.livePriceHeader}>
            <View>
              <Text style={styles.pairTitle}>{selectedAsset}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: fontSizes.medium }}>
                {currentData.updated_at
                  ? `Updated ${Math.ceil((Date.now() - new Date(currentData.updated_at).getTime()) / 60000)} minutes ago`
                  : 'Updated recently '}
              </Text>
            </View>
            <View style={styles.changeContainer}>
              {currentData.change >= 0 ? (
                <TrendingUp size={16} color={colors.success} />
              ) : (
                <TrendingDown size={16} color={colors.error} />
              )}
              <Text style={{ color: currentData.change >= 0 ? colors.success : colors.error }}>
                {currentData.change >= 0 ? '+' : ''}
                {isFinite(currentData.change_percent) ? currentData.change_percent.toFixed(2) : '0.00'}%
              </Text>
            </View>
          </View>

          <Text style={[
            styles.livePriceValue,
            priceLoading && styles.priceLoading
          ]}>
            {priceLoading
              ? 'Loading...'
              : `$${isFinite(currentData.price) ? currentData.price.toFixed(2) : '0.00'}`}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>High</Text>
              <Text style={styles.statValue}>
                ${isFinite(currentData.high) ? currentData.high.toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Low</Text>
              <Text style={styles.statValue}>
                ${isFinite(currentData.low) ? currentData.low.toFixed(2) : '0.00'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Volume</Text>
              <Text style={styles.statValue}>
                {currentData.volume || '-'}
              </Text>
            </View>
          </View>
        </View>

        <TimeframeSwitcher
          selectedTimeframe={timeframe}
          onTimeframeChange={setTimeframe}
        />

        {Platform.OS === 'web' ? (
          <View style={styles.chartContainer}>
            <iframe
              srcDoc={getTradingViewHTML(selectedAsset, tradingViewInterval)}
              style={{ width: '100%', height: '100%', border: 'none' }}
              sandbox="allow-scripts allow-same-origin"
            />
          </View>
        ) : (
          <View style={styles.chartContainer}>
            <WebView
              source={{ html: getTradingViewHTML(selectedAsset, tradingViewInterval) }}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              scalesPageToFit
            />
          </View>
        )}

        {/* Technical Indicators */}
        <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={styles.sectionTitle}>
            Technical Indicators
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: fontSizes.medium, marginBottom: 12 }} >
            {technicalIndicators[0]?.updated_at
              ? `Updated ${Math.ceil((Date.now() - new Date(technicalIndicators[0].updated_at).getTime()) / 60000)} minutes ago`
              : 'Updated recently '}
          </Text>

          <View style={{ gap: 12 }}>
            {technicalIndicators.map((indicator) => (
              <View key={indicator.id} style={styles.indicatorCard}>
                <View style={styles.indicatorHeader}>
                  <Text style={styles.indicatorName}>{indicator.indicator_name}</Text>
                  <Text style={[styles.indicatorValue, { color: indicator.color }]}>
                    {indicator.value}
                  </Text>
                </View>
                <Text style={[styles.indicatorStatus, { color: indicator.color }]}>
                  {indicator.status}
                </Text>
              </View>
            ))}
          </View>
        </View>


        {/* Economic Events */}
        {/* <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <Text style={{ fontSize: fontSizes.subtitle, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>Today's Economic Events</Text>
          <View style={{ gap: 12 }}>
            {economicEvents.map(event => (
              <View key={event.id} style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: fontSizes.medium, color: colors.primary }}>{event.time}</Text>
                  <View style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 4,
                    backgroundColor:
                      event.impact === 'high'
                        ? `${colors.error}33`
                        : event.impact === 'medium'
                          ? `${colors.warning}33`
                          : `${colors.textSecondary}33`,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: colors.text }}>{event.impact.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: fontSizes.small, color: colors.primary, backgroundColor: `${colors.primary}20`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>{event.currency}</Text>
                  <Text style={{ fontSize: fontSizes.medium, color: colors.text, flex: 1 }}>{event.event_name}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: fontSizes.small, color: colors.textSecondary }}>Forecast: {event.forecast}</Text>
                  <Text style={{ fontSize: fontSizes.small, color: colors.textSecondary }}>Previous: {event.previous}</Text>
                </View>
              </View>
            ))}
          </View>
        </View> */}
      </ScrollView>
      <NotificationSheet
        visible={notificationVisible}
        onClose={() => setNotificationVisible(false)}
      />

      <SetupGuide
        visible={setupGuideVisible}
        onClose={() => setSetupGuideVisible(false)}
      />
    </SafeAreaView>
  );
}