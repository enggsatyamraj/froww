// app/view-all.tsx

import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { GridStockCard } from '../components/ui/GridStockCard';
import { alphaVantageApi } from '../services/alphaVantageApi';
import { spacing } from '../theme';
import { StockData } from '../types/api';

export default function ViewAllScreen() {
    const params = useLocalSearchParams();
    const type = params.type as 'gainers' | 'losers';

    const [data, setData] = useState<StockData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const pageTitle = type === 'gainers' ? 'Top Gainers' : 'Top Losers';
    const isGainers = type === 'gainers';

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await alphaVantageApi.getTopGainersLosers();
            const stockData = type === 'gainers' ? response.top_gainers : response.top_losers;
            setData(stockData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleStockPress = (stock: StockData) => {
        console.log('📈 Navigate to stock detail:', stock.ticker);
        router.push(`/stock/${stock.ticker}`);
    };

    const handleBack = () => {
        router.back();
    };

    const handleInfoPress = () => {
        const infoMessage = isGainers
            ? "Top Gainers shows stocks with the highest percentage increase in price during the current trading session. These stocks are experiencing strong upward momentum."
            : "Top Losers shows stocks with the highest percentage decrease in price during the current trading session. These stocks are experiencing downward pressure.";

        Alert.alert(
            pageTitle,
            infoMessage,
            [{ text: 'Got it', style: 'default' }]
        );
    };

    useEffect(() => {
        loadData();
    }, [type]);

    const renderStockCard = ({ item, index }: { item: StockData; index: number }) => (
        <View style={styles.cardContainer}>
            <GridStockCard
                stock={item}
                onPress={() => handleStockPress(item)}
                style={styles.gridItem}
            />
        </View>
    );

    const renderLoadingState = () => (
        <View style={styles.centerContainer}>
            <View style={styles.loadingIcon}>
                <ActivityIndicator size="large" color="#00D4AA" />
            </View>
            <Text style={styles.loadingText}>Loading {pageTitle.toLowerCase()}...</Text>
            <Text style={styles.loadingSubtext}>Fetching latest market data</Text>
        </View>
    );

    const renderErrorState = () => (
        <View style={styles.centerContainer}>
            <View style={styles.errorIcon}>
                <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
            </View>
            <Text style={styles.errorTitle}>Unable to load data</Text>
            <Text style={styles.errorDescription}>
                Please check your internet connection and try again
            </Text>
            <Pressable style={styles.retryButton} onPress={loadData}>
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Try Again</Text>
            </Pressable>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.centerContainer}>
            <View style={styles.emptyIcon}>
                <Ionicons
                    name={isGainers ? "trending-up-outline" : "trending-down-outline"}
                    size={48}
                    color="#94A3B8"
                />
            </View>
            <Text style={styles.emptyTitle}>No {type} available</Text>
            <Text style={styles.emptyDescription}>
                Market data for {type} is not available at the moment. Please try again later.
            </Text>
        </View>
    );

    const renderHeader = () => (
        <View style={styles.listHeader}>
            <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{data.length}</Text>
                    <Text style={styles.statLabel}>Stocks</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <View style={styles.statIconContainer}>
                        <Ionicons
                            name={isGainers ? "trending-up" : "trending-down"}
                            size={16}
                            color={isGainers ? "#00C896" : "#FF6B6B"}
                        />
                    </View>
                    <Text style={styles.statLabel}>
                        {isGainers ? "Gaining" : "Losing"}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {/* Enhanced Header with proper padding */}
            <SafeAreaView style={styles.safeArea}>
                <View style={[
                    styles.header,
                    { paddingTop: Platform.OS === 'android' ? spacing.lg + 40 : spacing.sm }
                ]}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </Pressable>

                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{pageTitle}</Text>
                    </View>

                    <Pressable onPress={handleInfoPress} style={styles.infoButton}>
                        <Ionicons name="information-circle-outline" size={24} color="#64748B" />
                    </Pressable>
                </View>
            </SafeAreaView>

            {/* Content */}
            <View style={styles.content}>
                {loading && renderLoadingState()}

                {error && !loading && renderErrorState()}

                {!loading && !error && data.length === 0 && renderEmptyState()}

                {!loading && !error && data.length > 0 && (
                    <FlatList
                        data={data}
                        renderItem={renderStockCard}
                        keyExtractor={(item, index) => `${type}_${item.ticker}_${index}`}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContainer}
                        ListHeaderComponent={renderHeader}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        columnWrapperStyle={styles.row}
                    />
                )}
            </View>
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
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: -0.2,
    },
    infoButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    listContainer: {
        paddingBottom: 120,
    },
    listHeader: {
        marginBottom: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#000',
        // shadowOffset: {
        //     width: 0,
        //     height: 4,
        // },
        // shadowOpacity: 0.08,
        // shadowRadius: 12,
        elevation: 1,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 20,
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 0,
    },
    cardContainer: {
        flex: 1,
        paddingHorizontal: 6,
    },
    gridItem: {
        flex: 1,
        marginHorizontal: 0,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginTop: 40,
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
        textAlign: 'center',
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
    errorDescription: {
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
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
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
    emptyDescription: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },
});