import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { GridStockCard } from '../../components/ui/GridStockCard';
import { SkeletonStockCard } from '../../components/ui/Skeleton';
import { alphaVantageApi } from '../../services/alphaVantageApi';
import { spacing } from '../../theme';
import { StockData, TopGainersLosersResponse } from '../../types/api';

export default function ExploreScreen() {
    const [marketData, setMarketData] = useState<TopGainersLosersResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMarketData = async (isRefresh = false) => {
        try {
            console.log(`🔄 ${isRefresh ? 'Refreshing' : 'Loading'} market data...`);

            if (!isRefresh) {
                setIsLoading(true);
            }
            setError(null);

            const response = await alphaVantageApi.getTopGainersLosers();

            console.log('✅ Successfully received market data');
            console.log('📊 Setting data in state...');

            setMarketData(response);

            // Verify data was set
            setTimeout(() => {
                console.log('🔍 Verifying data in state...');
                console.log('📊 Market data state:', response ? 'Has data' : 'No data');
                console.log('📊 Gainers in state:', response?.top_gainers?.length || 0);
                console.log('📊 Losers in state:', response?.top_losers?.length || 0);
            }, 100);

        } catch (err) {
            console.error('❌ Failed to fetch market data:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);

            if (!isRefresh) {
                Alert.alert(
                    'Error',
                    `Failed to load market data: ${errorMessage}`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Retry', onPress: () => fetchMarketData() }
                    ]
                );
            }
        } finally {
            setIsLoading(false);
            if (isRefresh) {
                setIsRefreshing(false);
            }
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchMarketData(true);
    };

    const handleStockPress = (stock: StockData) => {
        console.log('📱 Opening stock details for:', stock.ticker);
        router.push(`/stock/${stock.ticker}`);
    };

    const handleViewAll = (type: 'gainers' | 'losers') => {
        console.log(`📱 Opening view all for: ${type}`);
        router.push(`/view-all?type=${type}`);
    };

    useEffect(() => {
        fetchMarketData();
    }, []);

    // Get display data
    const topGainers = marketData?.top_gainers?.slice(0, 4) || [];
    const topLosers = marketData?.top_losers?.slice(0, 4) || [];

    console.log('🎨 Rendering with data:', {
        hasMarketData: !!marketData,
        gainersCount: topGainers.length,
        losersCount: topLosers.length,
        isLoading,
        error: !!error
    });

    return (
        <View style={styles.container}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {/* Enhanced Header with proper padding */}
            <SafeAreaView style={styles.safeArea}>
                <View style={[
                    styles.header,
                    {
                        paddingTop: Platform.OS === 'android' ? spacing.xl + 30 : spacing.md,
                        paddingBottom: spacing.lg
                    }
                ]}>
                    <View style={styles.headerContent}>
                        <Text style={styles.appName}>Froww</Text>
                        <Text style={styles.title}>Explore</Text>
                        <Text style={styles.subtitle}>Discover trending stocks in the market</Text>
                    </View>

                    {/* Market Status Indicator */}
                    <View style={styles.marketStatus}>
                        <View style={styles.marketDot} />
                        <Text style={styles.marketText}>Markets Open</Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* Enhanced Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor="#00D4AA"
                        colors={["#00D4AA"]}
                        progressBackgroundColor="#FFFFFF"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Loading State */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <View style={styles.sectionHeaderContainer}>
                            <Text style={styles.sectionTitle}>Top Gainers</Text>
                            <View style={styles.skeletonViewAll} />
                        </View>
                        <View style={styles.skeletonGrid}>
                            {[1, 2].map((key) => (
                                <SkeletonStockCard key={`skeleton-gainer-${key}`} style={styles.cardStyle} />
                            ))}
                        </View>
                        <View style={styles.skeletonGrid}>
                            {[3, 4].map((key) => (
                                <SkeletonStockCard key={`skeleton-gainer-${key}`} style={styles.cardStyle} />
                            ))}
                        </View>

                        <View style={styles.sectionHeaderContainer}>
                            <Text style={styles.sectionTitle}>Top Losers</Text>
                            <View style={styles.skeletonViewAll} />
                        </View>
                        <View style={styles.skeletonGrid}>
                            {[1, 2].map((key) => (
                                <SkeletonStockCard key={`skeleton-loser-${key}`} style={styles.cardStyle} />
                            ))}
                        </View>
                        <View style={styles.skeletonGrid}>
                            {[3, 4].map((key) => (
                                <SkeletonStockCard key={`skeleton-loser-${key}`} style={styles.cardStyle} />
                            ))}
                        </View>
                    </View>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <View style={styles.errorContainer}>
                        <View style={styles.errorIcon}>
                            <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
                        </View>
                        <Text style={styles.errorTitle}>Unable to fetch data</Text>
                        <Text style={styles.errorMessage}>
                            Please check your internet connection and try again
                        </Text>
                        <Pressable style={styles.retryButton} onPress={() => fetchMarketData()}>
                            <Ionicons name="refresh" size={18} color="#FFFFFF" />
                            <Text style={styles.retryText}>Retry</Text>
                        </Pressable>
                    </View>
                )}

                {/* Data State */}
                {marketData && !isLoading && !error && (
                    <View style={styles.dataContainer}>
                        {/* Top Gainers */}
                        {topGainers.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionTitleContainer}>
                                        <Ionicons name="trending-up" size={20} color="#00C896" />
                                        <Text style={styles.sectionTitle}>Top Gainers</Text>
                                    </View>
                                    <Pressable
                                        style={styles.viewAllButton}
                                        onPress={() => handleViewAll('gainers')}
                                    >
                                        <Text style={styles.viewAllText}>View All</Text>
                                        <Ionicons name="chevron-forward" size={14} color="#00D4AA" />
                                    </Pressable>
                                </View>
                                <View style={styles.stockGrid}>
                                    {topGainers.reduce((rows, stock, index) => {
                                        if (index % 2 === 0) {
                                            rows.push([stock]);
                                        } else {
                                            rows[rows.length - 1].push(stock);
                                        }
                                        return rows;
                                    }, [] as StockData[][]).map((row, rowIndex) => (
                                        <View key={`gainer-row-${rowIndex}`} style={styles.stockRow}>
                                            {row.map((stock, index) => (
                                                <GridStockCard
                                                    key={`gainer-${stock.ticker}-${rowIndex}-${index}`}
                                                    stock={stock}
                                                    onPress={() => handleStockPress(stock)}
                                                    style={styles.cardStyle}
                                                />
                                            ))}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Top Losers */}
                        {topLosers.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionTitleContainer}>
                                        <Ionicons name="trending-down" size={20} color="#FF6B6B" />
                                        <Text style={styles.sectionTitle}>Top Losers</Text>
                                    </View>
                                    <Pressable
                                        style={styles.viewAllButton}
                                        onPress={() => handleViewAll('losers')}
                                    >
                                        <Text style={styles.viewAllText}>View All</Text>
                                        <Ionicons name="chevron-forward" size={14} color="#00D4AA" />
                                    </Pressable>
                                </View>
                                <View style={styles.stockGrid}>
                                    {topLosers.reduce((rows, stock, index) => {
                                        if (index % 2 === 0) {
                                            rows.push([stock]);
                                        } else {
                                            rows[rows.length - 1].push(stock);
                                        }
                                        return rows;
                                    }, [] as StockData[][]).map((row, rowIndex) => (
                                        <View key={`loser-row-${rowIndex}`} style={styles.stockRow}>
                                            {row.map((stock, index) => (
                                                <GridStockCard
                                                    key={`loser-${stock.ticker}-${rowIndex}-${index}`}
                                                    stock={stock}
                                                    onPress={() => handleStockPress(stock)}
                                                    style={styles.cardStyle}
                                                />
                                            ))}
                                        </View>
                                    ))}
                                </View>
                            </View>
                        )}

                        {/* Empty State */}
                        {topGainers.length === 0 && topLosers.length === 0 && (
                            <View style={styles.emptyContainer}>
                                <View style={styles.emptyIcon}>
                                    <Ionicons name="bar-chart-outline" size={48} color="#94A3B8" />
                                </View>
                                <Text style={styles.emptyTitle}>No market data available</Text>
                                <Text style={styles.emptyMessage}>
                                    Market data will be available during trading hours. Please check back later.
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
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
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 0,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 4,
    },
    headerContent: {
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    appName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#00D4AA',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '400',
        lineHeight: 22,
    },
    marketStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    marketDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22C55E',
        marginRight: 6,
    },
    marketText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#15803D',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    content: {
        paddingBottom: 50,
    },
    loadingContainer: {
        padding: 20,
    },
    dataContainer: {
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        marginLeft: 8,
        letterSpacing: -0.2,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: 'transparent',
    },
    skeletonViewAll: {
        width: 60,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#E2E8F0',
    },
    viewAllText: {
        fontSize: 14,
        color: '#00D4AA',
        fontWeight: '600',
        marginRight: 4,
    },
    stockGrid: {
        gap: 12,
    },
    stockRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
    },
    skeletonGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 12,
    },
    cardStyle: {
        flex: 1,
        maxWidth: '48%',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 60,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 16,
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
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 20,
        paddingHorizontal: 16,
    },
    retryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00D4AA',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
        shadowColor: '#00D4AA',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginTop: 20,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyMessage: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },
});