import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import WatchlistBottomSheet, { WatchlistBottomSheetRef } from '../../components/WatchlistBottomSheet';
import { WatchlistItem, watchlistStorage } from '../../services/watchlistStorage';
import { colors, spacing, typography } from '../../theme';

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
        // Open the bottom sheet with a dummy stock symbol for creation
        // You can modify this to handle creation differently if needed
        watchlistBottomSheetRef.current?.show();
    };

    const handleDeleteWatchlist = async (watchlistId: string, watchlistName: string) => {
        Alert.alert(
            'Delete Watchlist',
            `Are you sure you want to delete "${watchlistName}"? This action cannot be undone.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await watchlistStorage.deleteWatchlist(watchlistId);
                            await loadWatchlists(); // Reload the list
                        } catch (error) {
                            console.error('Error deleting watchlist:', error);
                            Alert.alert('Error', 'Failed to delete watchlist');
                        }
                    },
                },
            ]
        );
    };

    const handleWatchlistPress = (watchlist: WatchlistItem) => {
        // Navigate to watchlist detail screen
        // You can implement navigation here
        console.log('Open watchlist:', watchlist.name);
        // navigation.navigate('WatchlistDetail', { watchlistId: watchlist.id });
    };

    const handleAddToWatchlist = (watchlistIds: string[], stockSymbol: string) => {
        // This callback is called when stocks are added/removed from watchlists
        console.log('Updated watchlists:', watchlistIds, 'for stock:', stockSymbol);
        loadWatchlists(); // Refresh the list to show updated counts
    };

    // Load watchlists when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadWatchlists();
        }, [])
    );

    const renderWatchlistItem = ({ item }: { item: WatchlistItem }) => (
        <Pressable
            style={styles.watchlistCard}
            onPress={() => handleWatchlistPress(item)}
        >
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="bookmark" size={24} color={colors.primary} />
                    </View>
                    <Pressable
                        style={styles.deleteButton}
                        onPress={() => handleDeleteWatchlist(item.id, item.name)}
                    >
                        <Ionicons name="trash-outline" size={20} color={colors.text.muted} />
                    </Pressable>
                </View>

                <Text style={styles.cardTitle}>{item.name}</Text>

                <View style={styles.cardFooter}>
                    <Text style={styles.stockCount}>
                        {item.stocks.length} {item.stocks.length === 1 ? 'stock' : 'stocks'}
                    </Text>
                    <Text style={styles.createdDate}>
                        Created {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>
            </View>
        </Pressable>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons
                name="heart-outline"
                size={64}
                color={colors.text.muted}
            />
            <Text style={styles.emptyTitle}>No Watchlists Yet</Text>
            <Text style={styles.emptyDescription}>
                Create your first watchlist to track your favorite stocks
            </Text>
            <Button
                title="Create Watchlist"
                onPress={handleCreateWatchlist}
                style={styles.button}
            />
        </View>
    );

    const renderHeader = () => (
        <View style={styles.header}>
            <Text style={styles.screenTitle}>My Watchlists</Text>
            {watchlists.length > 0 && (
                <Button
                    title="New List"
                    onPress={handleCreateWatchlist}
                    style={styles.headerButton}
                />
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading watchlists...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.content}>
                {watchlists.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <>
                        {renderHeader()}
                        <FlatList
                            data={watchlists}
                            renderItem={renderWatchlistItem}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={[colors.primary]}
                                />
                            }
                            contentContainerStyle={styles.listContainer}
                        />
                    </>
                )}
            </View>

            {/* Watchlist Bottom Sheet for creating new watchlists */}
            <WatchlistBottomSheet
                ref={watchlistBottomSheetRef}
                stockSymbol="TEMP" // Dummy symbol for creation
                onAddToWatchlist={handleAddToWatchlist}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: spacing.md,
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    screenTitle: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
    },
    headerButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
    },
    listContainer: {
        paddingBottom: spacing.lg,
    },
    watchlistCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cardContent: {
        padding: spacing.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButton: {
        padding: spacing.xs,
    },
    cardTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.sm,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stockCount: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.primary,
    },
    createdDate: {
        fontSize: typography.fontSize.xs,
        color: colors.text.muted,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    emptyDescription: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    button: {
        minWidth: 180,
    },
});