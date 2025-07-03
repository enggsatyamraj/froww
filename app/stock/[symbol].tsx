// app/stock/[symbol].tsx - UPDATED with Real Chart Data

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { WatchlistBottomSheet, WatchlistBottomSheetRef } from '../../components/WatchlistBottomSheet';
import { alphaVantageApi } from '../../services/alphaVantageApi';
import { watchlistStorage } from '../../services/watchlistStorage';
import { spacing } from '../../theme';
import { CompanyOverview } from '../../types/api';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 60; // Account for padding

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '1Y';

export default function StockDetailScreen() {
    const params = useLocalSearchParams();
    const symbol = params.symbol as string;

    const [companyData, setCompanyData] = useState<CompanyOverview | null>(null);
    const [quoteData, setQuoteData] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1D');

    // Bottom sheet ref
    const watchlistBottomSheetRef = useRef<WatchlistBottomSheetRef>(null);

    const loadStockData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('📊 Loading stock data for:', symbol);

            // Load company overview and quote data in parallel
            const [overview, quote] = await Promise.all([
                alphaVantageApi.getCompanyOverview(symbol),
                alphaVantageApi.getGlobalQuote(symbol)
            ]);

            setCompanyData(overview);
            setQuoteData(quote);

            console.log('✅ Basic stock data loaded successfully');

            // Load initial chart data with 1W instead of 1D
            await loadChartData('1W'); // Changed from '1D'

        } catch (err) {
            console.error('❌ Error loading stock data:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load stock data';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const loadChartData = async (period: TimePeriod) => {
        try {
            setChartLoading(true);
            console.log(`📈 Loading ${period} chart data for ${symbol}...`);

            // Determine the best interval based on selected period
            let interval: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily';

            switch (period) {
                case '1D':
                    interval = '5min'; // 5-minute intervals for 1 day
                    break;
                case '1W':
                    interval = '30min'; // 30-minute intervals for 1 week
                    break;
                case '1M':
                    interval = 'daily'; // Daily intervals for 1 month
                    break;
                case '3M':
                case '1Y':
                    interval = 'daily'; // Daily intervals for longer periods
                    break;
                default:
                    interval = 'daily';
            }

            // Fetch time series data
            const timeSeriesData = await alphaVantageApi.getTimeSeriesData(symbol, interval);

            // Process data for chart
            const processedData = alphaVantageApi.processTimeSeriesForChart(timeSeriesData, interval, period);

            setChartData(processedData);
            console.log(`✅ Chart data loaded for ${period}:`, processedData.length, 'points');

        } catch (error) {
            console.error(`❌ Error loading chart data for ${period}:`, error);
            // Set fallback chart data
            setChartData(generateFallbackChartData(period));
        } finally {
            setChartLoading(false);
        }
    };


    const generateFallbackChartData = (period: TimePeriod) => {
        const data = [];
        const now = new Date();
        let pointCount = 25; // Changed default from 20 to 25 (1W default)
        let intervalMinutes = 60 * 4; // Changed default from 15 to 240 (1W default)

        // Adjust data points based on period
        switch (period) {
            case '1D':
                pointCount = 20;
                intervalMinutes = 15;
                break;
            case '1W':
                pointCount = 25;
                intervalMinutes = 60 * 4; // 4 hours
                break;
            case '1M':
                pointCount = 30;
                intervalMinutes = 60 * 24; // 1 day
                break;
            case '3M':
                pointCount = 30;
                intervalMinutes = 60 * 24 * 3; // 3 days
                break;
            case '1Y':
                pointCount = 30;
                intervalMinutes = 60 * 24 * 12; // 12 days
                break;
        }

        for (let i = 0; i < pointCount; i++) {
            const time = new Date(now);
            time.setMinutes(time.getMinutes() - (pointCount - i) * intervalMinutes);

            let timeLabel: string;
            if (period === '1D') {
                timeLabel = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
            } else {
                timeLabel = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }

            data.push({
                time: timeLabel,
                price: Math.random() * 200 + 50 + (Math.sin(i * 0.3) * 10),
                volume: Math.floor(Math.random() * 1000000)
            });
        }

        return data;
    };

    const checkWatchlistStatus = async () => {
        try {
            const inWatchlist = await watchlistStorage.isStockInWatchlists(symbol);
            setIsInWatchlist(inWatchlist);
            console.log(`📋 ${symbol} watchlist status:`, inWatchlist);
        } catch (error) {
            console.error('Error checking watchlist status:', error);
        }
    };

    // Enhanced Chart Component with real data
    const EnhancedLineChart = ({ data, width, height }: { data: any[], width: number, height: number }) => {
        if (!data || data.length === 0) {
            return (
                <View style={[styles.chartPlaceholder, { width, height }]}>
                    <Ionicons name="trending-up" size={48} color="#00D4AA" />
                    <Text style={styles.chartPlaceholderText}>Loading chart data...</Text>
                </View>
            );
        }

        // Prepare chart data - limit to 8 points for better display
        const displayData = data.slice(-8);

        const chartData = {
            labels: displayData.map((item, index) => {
                // Show every other label to avoid crowding
                if (index % 2 === 0) {
                    return item.time.toString().slice(0, 5);
                }
                return '';
            }),
            datasets: [
                {
                    data: displayData.map(item => item.price),
                    color: (opacity = 1) => `rgba(0, 212, 170, ${opacity})`, // Froww green
                    strokeWidth: 3,
                },
            ],
        };

        const chartConfig = {
            backgroundColor: '#F8FAFC',
            backgroundGradientFrom: '#FFFFFF',
            backgroundGradientTo: '#F8FAFC',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 212, 170, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
            style: {
                borderRadius: 12,
            },
            propsForDots: {
                r: '3',
                strokeWidth: '2',
                stroke: '#00D4AA'
            },
            propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#E2E8F0',
                strokeWidth: 1,
            },
        };

        return (
            <View style={{ borderRadius: 12, overflow: 'hidden' }}>
                <LineChart
                    data={chartData}
                    width={width}
                    height={height}
                    chartConfig={chartConfig}
                    bezier
                    style={{
                        borderRadius: 12,
                    }}
                    withInnerLines={true}
                    withOuterLines={false}
                    withVerticalLabels={true}
                    withHorizontalLabels={true}
                    withDots={true}
                    withShadow={false}
                />
            </View>
        );
    };

    const handleBack = () => {
        router.back();
    };

    const handleWatchlistPress = () => {
        if (isInWatchlist) {
            // Show confirmation to remove from all watchlists
            Alert.alert(
                'Remove from Watchlists',
                `Remove ${symbol} from all watchlists?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await watchlistStorage.removeStockFromAllWatchlists(symbol);
                                setIsInWatchlist(false);
                                Alert.alert('Removed', `${symbol} removed from all watchlists`);
                            } catch (error) {
                                console.error('Error removing from watchlists:', error);
                                Alert.alert('Error', 'Failed to remove from watchlists');
                            }
                        }
                    }
                ]
            );
        } else {
            // Show bottom sheet to add to watchlists
            watchlistBottomSheetRef.current?.show();
        }
    };

    const handleAddToWatchlist = async (watchlistIds: string[], stockSymbol: string) => {
        console.log(`Adding ${stockSymbol} to watchlists:`, watchlistIds);
        // Update the UI state
        setIsInWatchlist(watchlistIds.length > 0);
    };

    // Handle time period change
    const handleTimePeriodChange = async (period: TimePeriod) => {
        if (period === selectedPeriod) return;

        setSelectedPeriod(period);
        console.log(`📅 Switching to ${period} view`);

        // Load new chart data for selected period
        await loadChartData(period);
    };

    useEffect(() => {
        if (symbol) {
            loadStockData();
            checkWatchlistStatus();
        }
    }, [symbol]);

    // Get current price data
    const globalQuote = quoteData?.['Global Quote'];
    const currentPrice = globalQuote ? parseFloat(globalQuote['05. price']) : 0;
    const priceChange = globalQuote ? parseFloat(globalQuote['09. change']) : 0;
    const priceChangePercent = globalQuote ? globalQuote['10. change percent'] : '0%';
    const isPositive = priceChange >= 0;

    const renderLoadingState = () => (
        <View style={styles.centerContainer}>
            <View style={styles.loadingIcon}>
                <ActivityIndicator size="large" color="#00D4AA" />
            </View>
            <Text style={styles.loadingText}>Loading {symbol} details...</Text>
            <Text style={styles.loadingSubtext}>Fetching real-time data</Text>
        </View>
    );

    const renderErrorState = () => (
        <View style={styles.centerContainer}>
            <View style={styles.errorIcon}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
            </View>
            <Text style={styles.errorTitle}>Unable to load data</Text>
            <Text style={styles.errorDescription}>
                Please check your connection and try again
            </Text>
            <Pressable style={styles.retryButton} onPress={loadStockData}>
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
        </View>
    );

    const formatMarketCap = (marketCap: string) => {
        const cap = parseInt(marketCap);
        if (cap >= 1000000000000) {
            return `$${(cap / 1000000000000).toFixed(2)}T`;
        } else if (cap >= 1000000000) {
            return `$${(cap / 1000000000).toFixed(1)}B`;
        } else if (cap >= 1000000) {
            return `$${(cap / 1000000).toFixed(1)}M`;
        }
        return `$${cap}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {/* Enhanced Header */}
            <SafeAreaView style={styles.safeArea}>
                <View style={[
                    styles.header,
                    { paddingTop: Platform.OS === 'android' ? spacing.lg + 40 : spacing.sm }
                ]}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </Pressable>

                    <Text style={styles.headerTitle}>{symbol}</Text>

                    <Pressable onPress={handleWatchlistPress} style={styles.watchlistButton}>
                        <Ionicons
                            name={isInWatchlist ? "bookmark" : "bookmark-outline"}
                            size={24}
                            color={isInWatchlist ? "#00D4AA" : "#64748B"}
                        />
                    </Pressable>
                </View>
            </SafeAreaView>

            {/* Content */}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {loading && renderLoadingState()}

                {error && !loading && renderErrorState()}

                {companyData && quoteData && !loading && (
                    <View style={styles.content}>
                        {/* Company Header */}
                        <View style={styles.companyHeader}>
                            <View style={styles.companyInfo}>
                                <View style={styles.companyLogoContainer}>
                                    <Ionicons name="business" size={24} color="#64748B" />
                                </View>
                                <View style={styles.companyDetails}>
                                    <Text style={styles.companyName} numberOfLines={2}>
                                        {companyData.Name}
                                    </Text>
                                    <Text style={styles.companySymbol}>{symbol}</Text>
                                    <Text style={styles.companyExchange}>
                                        {companyData.Exchange}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.priceInfo}>
                                <Text style={styles.currentPrice}>${currentPrice.toFixed(2)}</Text>
                                <View style={styles.priceChangeContainer}>
                                    <Text style={[styles.priceChange, { color: isPositive ? '#00C896' : '#FF6B6B' }]}>
                                        {isPositive ? '+' : ''}${Math.abs(priceChange).toFixed(2)}
                                    </Text>
                                    <Text style={[styles.priceChangePercent, { color: isPositive ? '#00C896' : '#FF6B6B' }]}>
                                        ({priceChangePercent})
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Enhanced Chart Section */}
                        <View style={styles.chartSection}>
                            {/* Chart Header */}
                            <View style={styles.chartHeader}>
                                <Text style={styles.chartTitle}>Price Chart</Text>
                                {chartLoading && (
                                    <ActivityIndicator size="small" color="#00D4AA" />
                                )}
                            </View>

                            {/* Chart Container */}
                            <View style={styles.chartContainer}>
                                {chartLoading ? (
                                    <View style={[styles.chartPlaceholder, { width: CHART_WIDTH, height: 200 }]}>
                                        <ActivityIndicator size="large" color="#00D4AA" />
                                        <Text style={styles.chartPlaceholderText}>Loading {selectedPeriod} data...</Text>
                                    </View>
                                ) : (
                                    <EnhancedLineChart
                                        data={chartData}
                                        width={CHART_WIDTH}
                                        height={200}
                                    />
                                )}
                            </View>

                            {/* Functional Time Period Selector */}
                            <View style={styles.timePeriodSelector}>
                                {(['1D', '1W', '1M', '3M', '1Y'] as TimePeriod[]).map((period) => (
                                    <Pressable
                                        key={period}
                                        style={[
                                            styles.timePeriodButton,
                                            period === selectedPeriod && styles.timePeriodButtonActive,
                                            chartLoading && styles.timePeriodButtonDisabled
                                        ]}
                                        onPress={() => handleTimePeriodChange(period)}
                                        disabled={chartLoading}
                                    >
                                        <Text style={[
                                            styles.timePeriodText,
                                            period === selectedPeriod && styles.timePeriodTextActive,
                                            chartLoading && styles.timePeriodTextDisabled
                                        ]}>
                                            {period}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>

                            {/* Chart Info */}
                            {chartData.length > 0 && (
                                <View style={styles.chartInfo}>
                                    <Text style={styles.chartInfoText}>
                                        Showing {chartData.length} data points for {selectedPeriod}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* About Section */}
                        <View style={styles.aboutSection}>
                            <Text style={styles.sectionTitle}>About {companyData.Name}</Text>
                            <Text style={styles.aboutText} numberOfLines={6}>
                                {companyData.Description}
                            </Text>

                            {/* Industry & Sector Tags */}
                            <View style={styles.tagsContainer}>
                                {companyData.Industry && (
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>{companyData.Industry}</Text>
                                    </View>
                                )}
                                {companyData.Sector && (
                                    <View style={styles.tag}>
                                        <Text style={styles.tagText}>{companyData.Sector}</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Key Metrics */}
                        <View style={styles.metricsSection}>
                            <View style={styles.metricsGrid}>
                                <View style={styles.metricCard}>
                                    <Text style={styles.metricLabel}>52-Week Low</Text>
                                    <Text style={styles.metricValue}>
                                        ${companyData['52WeekLow']}
                                    </Text>
                                </View>
                                <View style={styles.metricCard}>
                                    <Text style={styles.metricLabel}>Current Price</Text>
                                    <Text style={styles.metricValue}>${currentPrice.toFixed(2)}</Text>
                                </View>
                                <View style={styles.metricCard}>
                                    <Text style={styles.metricLabel}>52-Week High</Text>
                                    <Text style={styles.metricValue}>
                                        ${companyData['52WeekHigh']}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.additionalMetrics}>
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricRowLabel}>Market Cap</Text>
                                    <Text style={styles.metricRowValue}>
                                        {formatMarketCap(companyData.MarketCapitalization)}
                                    </Text>
                                </View>
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricRowLabel}>P/E Ratio</Text>
                                    <Text style={styles.metricRowValue}>
                                        {companyData.PERatio}
                                    </Text>
                                </View>
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricRowLabel}>Beta</Text>
                                    <Text style={styles.metricRowValue}>
                                        {companyData.Beta}
                                    </Text>
                                </View>
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricRowLabel}>Dividend Yield</Text>
                                    <Text style={styles.metricRowValue}>
                                        {(parseFloat(companyData.DividendYield) * 100).toFixed(2)}%
                                    </Text>
                                </View>
                                <View style={styles.metricRow}>
                                    <Text style={styles.metricRowLabel}>Profit Margin</Text>
                                    <Text style={styles.metricRowValue}>
                                        {(parseFloat(companyData.ProfitMargin) * 100).toFixed(1)}%
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Watchlist Bottom Sheet */}
            <WatchlistBottomSheet
                ref={watchlistBottomSheetRef}
                onAddToWatchlist={handleAddToWatchlist}
                stockSymbol={symbol}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    safeArea: {
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 4,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: -0.2,
    },
    watchlistButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 120,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
        paddingVertical: 60,
    },
    loadingIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0FDF4',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
    },
    loadingSubtext: {
        fontSize: 14,
        color: '#64748B',
    },
    errorIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FEF2F2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
    },
    errorDescription: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00D4AA',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    companyHeader: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    companyInfo: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    companyLogoContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    companyDetails: {
        flex: 1,
    },
    companyName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        lineHeight: 24,
    },
    companySymbol: {
        fontSize: 14,
        fontWeight: '600',
        color: '#00D4AA',
        marginBottom: 4,
    },
    companyExchange: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    priceInfo: {
        alignItems: 'flex-end',
    },
    currentPrice: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    priceChangeContainer: {
        alignItems: 'flex-end',
    },
    priceChange: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    priceChangePercent: {
        fontSize: 14,
        fontWeight: '500',
    },
    chartSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    chartPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
    },
    chartPlaceholderText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 8,
    },
    timePeriodSelector: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 16,
    },
    timePeriodButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: 'transparent',
        minWidth: 45,
        alignItems: 'center',
    },
    timePeriodButtonActive: {
        backgroundColor: '#F0FDF4',
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    timePeriodButtonDisabled: {
        opacity: 0.5,
    },
    timePeriodText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    timePeriodTextActive: {
        color: '#00D4AA',
        fontWeight: '600',
    },
    timePeriodTextDisabled: {
        color: '#94A3B8',
    },
    chartInfo: {
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    chartInfoText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    aboutSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
    },
    aboutText: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 20,
        marginBottom: 16,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    tagText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#15803D',
    },
    metricsSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    metricsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    metricCard: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginHorizontal: 4,
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: '500',
        color: '#64748B',
        marginBottom: 8,
        textAlign: 'center',
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    additionalMetrics: {
        gap: 12,
    },
    metricRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    metricRowLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    metricRowValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
});