// app/(tabs)/watchlist.tsx - REDESIGNED (Calm & Smooth UI)

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Platform,
    Pressable,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { WatchlistBottomSheet, WatchlistBottomSheetRef } from '../../components/WatchlistBottomSheet';
import { WatchlistItem, watchlistStorage } from '../../services/watchlistStorage';
import { spacing } from '../../theme';

export default function WatchlistScreen() {
    const [watchlists, setWatchlists] = useState<WatchlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const watchlistBottomSheetRef = useRef<WatchlistBottomSheetRef>(null);

    const loadWatchlists = async () => {
        try {
            setLoading(true);
            const data = await watchlistStorage.getWatchlists();
            setWatchlists(data);
        } catch (error) {
            console.error('Error loading watchlists:', error);
            Alert.alert('Error', 'Failed to load watchlists');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadWatchlists();
        setRefreshing(false);
    };

    const handleCreateWatchlist = () => {
        watchlistBottomSheetRef.current?.show();
    };

    const handleWatchlistPress = (watchlist: WatchlistItem) => {
        console.log('Navigating to watchlist:', watchlist.name);
        router.push(`/watchlist/${watchlist.id}`);
    };

    const handleDeleteWatchlist = async (watchlistId: string, watchlistName: string) => {
        Alert.alert(
            'Delete Watchlist',
            `Are you sure you want to delete "${watchlistName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await watchlistStorage.deleteWatchlist(watchlistId);
                            await loadWatchlists();
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete watchlist');
                        }
                    },
                },
            ]
        );
    };

    const handleAddToWatchlist = (watchlistIds: string[], stockSymbol: string) => {
        loadWatchlists();
    };

    useFocusEffect(
        useCallback(() => {
            loadWatchlists();
        }, [])
    );

    const renderWatchlistItem = ({ item, index }: { item: WatchlistItem; index: number }) => (
        <Pressable
            style={({ pressed }) => [
                styles.watchlistItem,
                pressed && styles.watchlistItemPressed,
            ]}
            onPress={() => handleWatchlistPress(item)}
        >
            <View style={styles.watchlistContent}>
                {/* Left side - Icon and Info */}
                <View style={styles.leftContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="bookmark" size={20} color="#00D4AA" />
                    </View>
                    <View style={styles.textContent}>
                        <Text style={styles.watchlistName} numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text style={styles.stockCount}>
                            {item.stocks.length} {item.stocks.length === 1 ? 'stock' : 'stocks'}
                        </Text>
                    </View>
                </View>

                {/* Right side - Actions */}
                <View style={styles.rightContent}>
                    <Pressable
                        style={styles.menuButton}
                        onPress={() => handleDeleteWatchlist(item.id, item.name)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="ellipsis-horizontal" size={16} color="#94A3B8" />
                    </Pressable>
                    <View style={styles.arrowContainer}>
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                    </View>
                </View>
            </View>
        </Pressable>
    );

    const renderHeader = () => (
        <SafeAreaView style={styles.headerSafeArea}>
            <View style={[
                styles.header,
                { paddingTop: Platform.OS === 'android' ? spacing.xl + 30 : spacing.md }
            ]}>
                <Text style={styles.greeting}>Good {getTimeGreeting()}</Text>
                <Text style={styles.title}>Watchlists</Text>
                <Text style={styles.subtitle}>
                    {watchlists.length > 0
                        ? `${watchlists.length} ${watchlists.length === 1 ? 'list' : 'lists'} created`
                        : 'Organize your favorite stocks'
                    }
                </Text>
            </View>
        </SafeAreaView>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyContent}>
                <View style={styles.emptyIconContainer}>
                    <Ionicons name="bookmark-outline" size={48} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyTitle}>Create your first watchlist</Text>
                <Text style={styles.emptyDescription}>
                    Keep track of stocks you're interested in by organizing them into watchlists
                </Text>
                <Pressable style={styles.createFirstButton} onPress={handleCreateWatchlist}>
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.createFirstButtonText}>Create Watchlist</Text>
                </Pressable>
            </View>
        </View>
    );

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#00D4AA" />
                    <Text style={styles.loadingText}>Loading watchlists...</Text>
                </View>
            );
        }

        if (watchlists.length === 0) {
            return renderEmptyState();
        }

        return (
            <View style={styles.listContainer}>
                {/* Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>My Watchlists</Text>
                    <Pressable style={styles.addButton} onPress={handleCreateWatchlist}>
                        <Ionicons name="add" size={18} color="#00D4AA" />
                    </Pressable>
                </View>

                {/* Watchlists List */}
                <View style={styles.listWrapper}>
                    <FlatList
                        data={watchlists}
                        renderItem={renderWatchlistItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor="#00D4AA"
                                colors={["#00D4AA"]}
                                progressBackgroundColor="#FFFFFF"
                            />
                        }
                        contentContainerStyle={styles.flatListContent}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                </View>
            </View>
        );
    };

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    };

    return (
        <View style={styles.container}>
            <StatusBar style="dark" backgroundColor="#FFFFFF" />

            {renderHeader()}
            {renderContent()}

            <WatchlistBottomSheet
                ref={watchlistBottomSheetRef}
                stockSymbol="TEMP"
                onAddToWatchlist={handleAddToWatchlist}
                isCreationOnly={true}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFBFC',
    },

    // Header Styles
    headerSafeArea: {
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingHorizontal: 24,
        paddingBottom: 24,
        backgroundColor: '#FFFFFF',
    },
    greeting: {
        fontSize: 14,
        fontWeight: '500',
        color: '#00D4AA',
        marginBottom: 4,
        textTransform: 'capitalize',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 6,
        letterSpacing: -0.4,
    },
    subtitle: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '400',
        lineHeight: 20,
    },

    // Loading State
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFBFC',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '500',
    },

    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        backgroundColor: '#FAFBFC',
    },
    emptyContent: {
        alignItems: 'center',
        maxWidth: 280,
    },
    emptyIconContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 32,
    },
    createFirstButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#00D4AA',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
        gap: 6,
    },
    createFirstButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },

    // List Container
    listContainer: {
        flex: 1,
        paddingTop: 8,
        backgroundColor: '#FAFBFC',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
        marginTop: 10
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0FDF9',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },

    // List Wrapper
    listWrapper: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 20,
    },
    flatListContent: {
        paddingVertical: 4,
    },

    // Watchlist Items
    watchlistItem: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
    },
    watchlistItemPressed: {
        backgroundColor: '#F9FAFB',
    },
    watchlistContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0FDF9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#D1FAE5',
    },
    textContent: {
        flex: 1,
    },
    watchlistName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    stockCount: {
        fontSize: 13,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    rightContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    arrowContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginLeft: 68,
        marginRight: 20,
    },
});