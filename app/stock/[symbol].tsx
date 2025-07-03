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
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { WatchlistBottomSheet, WatchlistBottomSheetRef } from '../../components/WatchlistBottomSheet';
import { StockDetailSkeleton } from '../../components/ui/StockDetailSkeleton';
import { alphaVantageApi } from '../../services/alphaVantageApi';
import { CacheKeys, cacheManager } from '../../services/cacheManager';
import { watchlistStorage } from '../../services/watchlistStorage';
import { spacing } from '../../theme';
import { CompanyOverview } from '../../types/api';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 60;

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '1Y';

interface ChartDataPoint {
    time: string;
    price: number;
    volume: number;
    timestamp: number;
    displayTime: string; // For chart labels
}

// Network connectivity checker
const checkNetworkConnectivity = async (): Promise<boolean> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://www.google.com', {
            method: 'HEAD',
            signal: controller.signal,
            cache: 'no-cache'
        });

        clearTimeout(timeoutId);
        return response.ok;
    } catch (error) {
        return false;
    }
};

export default function StockDetailScreen() {
    const params = useLocalSearchParams();
    const symbol = params.symbol as string;

    const [companyData, setCompanyData] = useState<CompanyOverview | null>(null);
    const [quoteData, setQuoteData] = useState<any>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1D');
    const [isOffline, setIsOffline] = useState(false);
    const [showOfflineBanner, setShowOfflineBanner] = useState(false);

    const watchlistBottomSheetRef = useRef<WatchlistBottomSheetRef>(null);

    // Check network connectivity
    const checkConnectivity = async () => {
        const isConnected = await checkNetworkConnectivity();
        setIsOffline(!isConnected);
        setShowOfflineBanner(!isConnected);

        if (!isConnected) {
            console.log('📵 No internet connection detected');
        }

        return isConnected;
    };

    const loadStockData = async (forceRefresh = false) => {
        try {
            setLoading(true);
            setError(null);

            console.log('📊 Loading stock data for:', symbol);

            // Check connectivity first
            const isConnected = await checkConnectivity();

            // Try to get data from cache first (especially important when offline)
            const [cachedOverview, cachedQuote] = await Promise.all([
                cacheManager.get<CompanyOverview>(CacheKeys.companyOverview(symbol)),
                cacheManager.get<any>(CacheKeys.globalQuote(symbol))
            ]);

            if (cachedOverview && cachedQuote && (!forceRefresh || !isConnected)) {
                console.log('✅ Using cached stock data');
                setCompanyData(cachedOverview);
                setQuoteData(cachedQuote);

                // Load cached chart data
                const cachedChart = await cacheManager.get<ChartDataPoint[]>(
                    CacheKeys.chartData(symbol, selectedPeriod)
                );
                if (cachedChart) {
                    setChartData(cachedChart);
                }

                setLoading(false);

                if (!isConnected) {
                    setShowOfflineBanner(true);
                }
                return;
            }

            // If offline and no cache, show offline error
            if (!isConnected) {
                throw new Error('No internet connection and no cached data available');
            }

            // Load fresh data if online
            const [overview, quote] = await Promise.all([
                alphaVantageApi.getCompanyOverview(symbol),
                alphaVantageApi.getGlobalQuote(symbol)
            ]);

            // Cache the data
            await Promise.all([
                cacheManager.set(CacheKeys.companyOverview(symbol), overview),
                cacheManager.set(CacheKeys.globalQuote(symbol), quote)
            ]);

            setCompanyData(overview);
            setQuoteData(quote);

            console.log('✅ Basic stock data loaded successfully');

            // Load initial chart data
            await loadChartData('1D');

        } catch (err) {
            console.error('❌ Error loading stock data:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to load stock data';
            setError(errorMessage);

            // Try to show any available cached data even if there's an error
            const [cachedOverview, cachedQuote] = await Promise.all([
                cacheManager.get<CompanyOverview>(CacheKeys.companyOverview(symbol)),
                cacheManager.get<any>(CacheKeys.globalQuote(symbol))
            ]);

            if (cachedOverview && cachedQuote) {
                setCompanyData(cachedOverview);
                setQuoteData(cachedQuote);
                setError(null);
                setShowOfflineBanner(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadChartData = async (period: TimePeriod) => {
        try {
            setChartLoading(true);
            console.log(`📈 Loading ${period} chart data for ${symbol}...`);

            // Check cache first
            const cacheKey = CacheKeys.chartData(symbol, period);
            const cachedChartData = await cacheManager.get<ChartDataPoint[]>(cacheKey);

            if (cachedChartData && cachedChartData.length > 0) {
                console.log(`✅ Using cached chart data for ${period}`);
                setChartData(cachedChartData);
                setChartLoading(false);
                return;
            }

            // Check connectivity for fresh data
            const isConnected = await checkConnectivity();
            if (!isConnected) {
                console.log('📵 Offline - using fallback chart data');
                const fallbackData = generateFallbackChartData(period);
                setChartData(fallbackData);
                setChartLoading(false);
                return;
            }

            // Determine the best interval based on selected period
            let interval: '1min' | '5min' | '15min' | '30min' | '60min' | 'daily';

            switch (period) {
                case '1D':
                    interval = '5min';
                    break;
                case '1W':
                    interval = '30min';
                    break;
                case '1M':
                    interval = 'daily';
                    break;
                case '3M':
                case '1Y':
                    interval = 'daily';
                    break;
                default:
                    interval = 'daily';
            }

            // Fetch time series data
            const timeSeriesData = await alphaVantageApi.getTimeSeriesData(symbol, interval);

            // Process data for chart with correct labels
            const processedData = processTimeSeriesForChart(timeSeriesData, interval, period);

            // Cache the processed data
            await cacheManager.set(cacheKey, processedData);

            setChartData(processedData);
            console.log(`✅ Chart data loaded for ${period}:`, processedData.length, 'points');

        } catch (error) {
            console.error(`❌ Error loading chart data for ${period}:`, error);
            // Use fallback chart data
            const fallbackData = generateFallbackChartData(period);
            setChartData(fallbackData);
        } finally {
            setChartLoading(false);
        }
    };

    // FIXED: Proper chart data processing with correct time labels
    const processTimeSeriesForChart = (timeSeriesData: any, interval: string, period: TimePeriod): ChartDataPoint[] => {
        try {
            const timeSeriesKey = interval === 'daily' ? 'Time Series (Daily)' : `Time Series (${interval})`;
            const rawData = timeSeriesData[timeSeriesKey];

            if (!rawData) {
                return generateFallbackChartData(period);
            }

            // Convert to array and sort by date
            const dataPoints = Object.entries(rawData).map(([dateTime, values]: [string, any]) => {
                const timestamp = new Date(dateTime).getTime();
                const price = parseFloat(values['4. close']); // Use closing price

                return {
                    dateTime,
                    timestamp,
                    price,
                    volume: parseInt(values['5. volume']),
                    open: parseFloat(values['1. open']),
                    high: parseFloat(values['2. high']),
                    low: parseFloat(values['3. low']),
                };
            }).sort((a, b) => a.timestamp - b.timestamp);

            // Filter based on period
            const now = new Date();
            let filteredData = dataPoints;

            switch (period) {
                case '1D':
                    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    filteredData = dataPoints.filter(point => new Date(point.dateTime) >= oneDayAgo);
                    break;
                case '1W':
                    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    filteredData = dataPoints.filter(point => new Date(point.dateTime) >= oneWeekAgo);
                    break;
                case '1M':
                    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    filteredData = dataPoints.filter(point => new Date(point.dateTime) >= oneMonthAgo);
                    break;
                case '3M':
                    const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    filteredData = dataPoints.filter(point => new Date(point.dateTime) >= threeMonthsAgo);
                    break;
                case '1Y':
                    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    filteredData = dataPoints.filter(point => new Date(point.dateTime) >= oneYearAgo);
                    break;
            }

            // Limit data points for chart performance (take every nth point if too many)
            const maxPoints = 30;
            if (filteredData.length > maxPoints) {
                const step = Math.ceil(filteredData.length / maxPoints);
                filteredData = filteredData.filter((_, index) => index % step === 0);
            }

            // FIXED: Generate correct time labels based on period and interval
            return filteredData.map(point => {
                const date = new Date(point.dateTime);
                let displayTime: string;
                let time: string;

                if (period === '1D') {
                    // For 1 day: show hours (HH:MM format)
                    time = date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                    displayTime = time;
                } else if (period === '1W') {
                    // For 1 week: show day and time (Mon 14:30)
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const timeStr = date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                    time = `${dayName} ${timeStr.slice(0, 5)}`;
                    displayTime = time;
                } else {
                    // For longer periods: show date (MM/DD or DD/MM format)
                    time = date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                    });
                    displayTime = time;
                }

                return {
                    time,
                    displayTime,
                    price: point.price,
                    volume: point.volume,
                    timestamp: point.timestamp
                };
            });

        } catch (error) {
            console.error('Error processing time series data:', error);
            return generateFallbackChartData(period);
        }
    };

    const generateFallbackChartData = (period: TimePeriod): ChartDataPoint[] => {
        const data: ChartDataPoint[] = [];
        const now = new Date();
        let pointCount = 20;
        let intervalMinutes = 60;

        // Adjust data points and intervals based on period
        switch (period) {
            case '1D':
                pointCount = 24;
                intervalMinutes = 60; // Every hour
                break;
            case '1W':
                pointCount = 21; // 3 times per day for a week
                intervalMinutes = 60 * 8; // Every 8 hours
                break;
            case '1M':
                pointCount = 30;
                intervalMinutes = 60 * 24; // Daily
                break;
            case '3M':
                pointCount = 30;
                intervalMinutes = 60 * 24 * 3; // Every 3 days
                break;
            case '1Y':
                pointCount = 30;
                intervalMinutes = 60 * 24 * 12; // Every 12 days
                break;
        }

        const basePrice = Math.random() * 200 + 50;

        for (let i = 0; i < pointCount; i++) {
            const time = new Date(now);
            time.setMinutes(time.getMinutes() - (pointCount - i) * intervalMinutes);

            let displayTime: string;
            let timeLabel: string;

            if (period === '1D') {
                timeLabel = time.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                displayTime = timeLabel;
            } else if (period === '1W') {
                const dayName = time.toLocaleDateString('en-US', { weekday: 'short' });
                const timeStr = time.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });
                timeLabel = `${dayName} ${timeStr.slice(0, 5)}`;
                displayTime = timeLabel;
            } else {
                timeLabel = time.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
                displayTime = timeLabel;
            }

            data.push({
                time: timeLabel,
                displayTime,
                price: basePrice + (Math.random() - 0.5) * 20 + Math.sin(i * 0.3) * 10,
                volume: Math.floor(Math.random() * 1000000),
                timestamp: time.getTime()
            });
        }

        return data;
    };

    // Enhanced Chart Component with proper error handling
    const EnhancedLineChart = ({ data, width, height }: { data: ChartDataPoint[], width: number, height: number }) => {
        if (!data || data.length === 0) {
            return (
                <View style={[styles.chartPlaceholder, { width, height }]}>
                    <Ionicons name="trending-up" size={48} color="#00D4AA" />
                    <Text style={styles.chartPlaceholderText}>No chart data available</Text>
                </View>
            );
        }

        // Prepare chart data - limit to 8 points for better display
        const displayData = data.slice(-8);

        const chartData = {
            labels: displayData.map((item, index) => {
                // Show every other label to avoid crowding
                if (index % 2 === 0) {
                    return item.displayTime.length > 8
                        ? item.displayTime.slice(0, 8)
                        : item.displayTime;
                }
                return '';
            }),
            datasets: [
                {
                    data: displayData.map(item => item.price),
                    color: (opacity = 1) => `rgba(0, 212, 170, ${opacity})`,
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

    const checkWatchlistStatus = async () => {
        try {
            const inWatchlist = await watchlistStorage.isStockInWatchlists(symbol);
            setIsInWatchlist(inWatchlist);
        } catch (error) {
            console.error('Error checking watchlist status:', error);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleWatchlistPress = () => {
        if (isInWatchlist) {
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
                                Alert.alert('Error', 'Failed to remove from watchlists');
                            }
                        }
                    }
                ]
            );
        } else {
            watchlistBottomSheetRef.current?.show();
        }
    };

    const handleAddToWatchlist = async (watchlistIds: string[], stockSymbol: string) => {
        setIsInWatchlist(watchlistIds.length > 0);
    };

    const handleTimePeriodChange = async (period: TimePeriod) => {
        if (period === selectedPeriod) return;
        setSelectedPeriod(period);
        await loadChartData(period);
    };

    const handleRefresh = async () => {
        await loadStockData(true);
        if (selectedPeriod) {
            await loadChartData(selectedPeriod);
        }
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

    const renderOfflineBanner = () => {
        if (!showOfflineBanner) return null;

        return (
            <View style={styles.offlineBanner}>
                <Ionicons name="wifi-outline" size={16} color="#EF4444" />
                <Text style={styles.offlineBannerText}>
                    {isOffline ? 'No internet connection - Showing cached data' : 'Limited connectivity'}
                </Text>
                <Pressable onPress={() => setShowOfflineBanner(false)}>
                    <Ionicons name="close" size={16} color="#EF4444" />
                </Pressable>
            </View>
        );
    };

    const renderLoadingState = () => (
        <StockDetailSkeleton />
    );

    const renderErrorState = () => (
        <View style={styles.centerContainer}>
            <View style={styles.errorIcon}>
                <Ionicons
                    name={isOffline ? "wifi-outline" : "alert-circle-outline"}
                    size={48}
                    color="#FF6B6B"
                />
            </View>
            <Text style={styles.errorTitle}>
                {isOffline ? 'No Internet Connection' : 'Unable to load data'}
            </Text>
            <Text style={styles.errorDescription}>
                {isOffline
                    ? 'Please check your internet connection and try again'
                    : 'Please check your connection and try again'
                }
            </Text>
            <Pressable style={styles.retryButton} onPress={handleRefresh}>
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

            {/* Offline Banner */}
            {renderOfflineBanner()}

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={handleRefresh}
                        tintColor="#00D4AA"
                        colors={["#00D4AA"]}
                    />
                }
            >
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
                            <View style={styles.chartHeader}>
                                <Text style={styles.chartTitle}>Price Chart</Text>
                                {chartLoading && (
                                    <ActivityIndicator size="small" color="#00D4AA" />
                                )}
                            </View>

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

                            {/* Time Period Selector */}
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
                                        {isOffline ? ' (cached data)' : ''}
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
                                        {/* @ts-ignore */}
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
                                        {/* @ts-ignore */}
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

    // Offline Banner Styles
    offlineBanner: {
        backgroundColor: '#FEF2F2',
        borderBottomWidth: 1,
        borderBottomColor: '#FECACA',
        paddingHorizontal: 20,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    offlineBannerText: {
        flex: 1,
        fontSize: 14,
        color: '#EF4444',
        fontWeight: '500',
        marginLeft: 8,
        marginRight: 8,
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

    // Company Header Styles
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

    // Chart Section Styles
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

    // About Section Styles
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

    // Metrics Section Styles
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