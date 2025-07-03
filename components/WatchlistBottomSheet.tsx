// components/WatchlistBottomSheet.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import ActionSheet, { ActionSheetRef, ScrollView } from 'react-native-actions-sheet';
import { WatchlistItem, watchlistStorage } from '../services/watchlistStorage';
import { Button } from './ui/Button';

interface WatchlistDisplayItem extends WatchlistItem {
    isSelected: boolean;
}

interface WatchlistBottomSheetProps {
    onAddToWatchlist: (watchlistIds: string[], stockSymbol: string) => void;
    stockSymbol: string;
}

export interface WatchlistBottomSheetRef {
    show: () => void;
    hide: () => void;
}

const WatchlistBottomSheet = forwardRef<WatchlistBottomSheetRef, WatchlistBottomSheetProps>(
    ({ onAddToWatchlist, stockSymbol }, ref) => {
        const actionSheetRef = React.useRef<ActionSheetRef>(null);
        const [watchlists, setWatchlists] = useState<WatchlistDisplayItem[]>([]);
        const [showCreateNew, setShowCreateNew] = useState(false);
        const [newWatchlistName, setNewWatchlistName] = useState('');
        const [loading, setLoading] = useState(false);
        const [creating, setCreating] = useState(false);

        useImperativeHandle(ref, () => ({
            show: () => {
                loadWatchlists();
                setShowCreateNew(false);
                setNewWatchlistName('');
                actionSheetRef.current?.show();
            },
            hide: () => {
                actionSheetRef.current?.hide();
                setShowCreateNew(false);
                setNewWatchlistName('');
            },
        }));

        const loadWatchlists = async () => {
            try {
                setLoading(true);
                const allWatchlists = await watchlistStorage.getWatchlists();

                // Check which watchlists already contain this stock
                const stockWatchlists = await watchlistStorage.getWatchlistsForStock(stockSymbol);
                const stockWatchlistIds = stockWatchlists.map(sw => sw.watchlistId);

                const displayWatchlists: WatchlistDisplayItem[] = allWatchlists.map(w => ({
                    ...w,
                    isSelected: stockWatchlistIds.includes(w.id),
                }));

                setWatchlists(displayWatchlists);
            } catch (error) {
                console.error('Error loading watchlists:', error);
                Alert.alert('Error', 'Failed to load watchlists');
            } finally {
                setLoading(false);
            }
        };

        const toggleWatchlistSelection = async (watchlistId: string) => {
            // Update UI immediately for better UX
            const targetWatchlist = watchlists.find(w => w.id === watchlistId);
            if (!targetWatchlist) return;

            const wasSelected = targetWatchlist.isSelected;

            // Update local state immediately
            setWatchlists(prev =>
                prev.map(w =>
                    w.id === watchlistId ? { ...w, isSelected: !w.isSelected } : w
                )
            );

            try {
                if (!wasSelected) {
                    // Add to watchlist
                    await watchlistStorage.addStockToWatchlists(stockSymbol, [watchlistId]);
                } else {
                    // Remove from watchlist
                    await watchlistStorage.removeStockFromWatchlist(stockSymbol, watchlistId);
                }

                // Update parent component
                const updatedWatchlists = watchlists.map(w =>
                    w.id === watchlistId ? { ...w, isSelected: !w.isSelected } : w
                );
                const selectedIds = updatedWatchlists.filter(w => w.isSelected).map(w => w.id);
                onAddToWatchlist(selectedIds, stockSymbol);

            } catch (error) {
                console.error('Error toggling watchlist:', error);
                // Revert UI change on error
                setWatchlists(prev =>
                    prev.map(w =>
                        w.id === watchlistId ? { ...w, isSelected: !w.isSelected } : w
                    )
                );
                Alert.alert('Error', 'Failed to update watchlist');
            }
        };

        const createNewWatchlist = async () => {
            const trimmedName = newWatchlistName.trim();
            if (!trimmedName) {
                Alert.alert('Invalid Name', 'Please enter a valid watchlist name');
                return;
            }

            try {
                setCreating(true);
                Keyboard.dismiss();

                // Create new watchlist
                const newWatchlist = await watchlistStorage.createWatchlist(trimmedName);

                // Add the current stock to this new watchlist
                await watchlistStorage.addStockToWatchlists(stockSymbol, [newWatchlist.id]);

                // Add to local state with selected = true
                const newDisplayWatchlist: WatchlistDisplayItem = {
                    ...newWatchlist,
                    stocks: [stockSymbol],
                    isSelected: true,
                };

                setWatchlists(prev => [newDisplayWatchlist, ...prev]);

                // Update parent component
                const selectedIds = [...watchlists.filter(w => w.isSelected).map(w => w.id), newWatchlist.id];
                onAddToWatchlist(selectedIds, stockSymbol);

                // Reset form
                setNewWatchlistName('');
                setShowCreateNew(false);

                // Show success message
                Alert.alert('Created!', `${stockSymbol} added to "${trimmedName}"`);

            } catch (error) {
                console.error('Error creating watchlist:', error);
                Alert.alert('Error', 'Failed to create watchlist');
            } finally {
                setCreating(false);
            }
        };

        const cancelCreateNew = () => {
            setShowCreateNew(false);
            setNewWatchlistName('');
            Keyboard.dismiss();
        };

        return (
            <ActionSheet
                ref={actionSheetRef}
                containerStyle={styles.actionSheetContainer}
                gestureEnabled={true}
                statusBarTranslucent
                drawUnderStatusBar={false}
                defaultOverlayOpacity={0.3}
                keyboardHandlerEnabled={true}
                closeOnPressBack={true}
            >

                <View style={styles.header}>
                    <View style={styles.dragHandle} />
                    <Text style={styles.headerTitle}>Add to Watchlist</Text>
                </View>

                <ScrollView>
                    <View style={styles.createInputRow}>
                        <TextInput
                            style={styles.createInput}
                            placeholder="New Watchlist Name"
                            value={newWatchlistName}
                            onChangeText={setNewWatchlistName}
                            maxLength={50}
                            editable={!creating}
                            returnKeyType="done"
                            onSubmitEditing={createNewWatchlist}
                        />
                        <Button
                            title={creating ? "Creating..." : "Create"}
                            onPress={createNewWatchlist}
                            disabled={!newWatchlistName.trim() || creating}
                            style={[
                                styles.createButton,
                                (!newWatchlistName.trim() || creating) && styles.createButtonDisabled
                            ]}
                        />
                    </View>

                    {/* Show here the watchlist items  */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#00D4AA" />
                            <Text style={styles.loadingText}>Loading your watchlists...</Text>
                        </View>
                    ) : watchlists.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="bookmark-outline" size={48} color="#CBD5E1" />
                            </View>
                            <Text style={styles.emptyTitle}>No watchlists yet</Text>
                            <Text style={styles.emptySubtitle}>Create your first watchlist to organize your stocks</Text>
                        </View>
                    ) : (
                        <View style={styles.watchlistsList}>
                            {watchlists.map((watchlist) => (
                                <Pressable
                                    key={watchlist.id}
                                    style={[
                                        styles.watchlistItem,
                                        watchlist.isSelected && styles.watchlistItemSelected
                                    ]}
                                    onPress={() => toggleWatchlistSelection(watchlist.id)}
                                    disabled={loading || creating}
                                >
                                    <View style={styles.watchlistIcon}>
                                        <Ionicons
                                            name={watchlist.isSelected ? "bookmark" : "bookmark-outline"}
                                            size={20}
                                            color={watchlist.isSelected ? "#00D4AA" : "#64748B"}
                                        />
                                    </View>

                                    <View style={styles.watchlistDetails}>
                                        <Text style={[
                                            styles.watchlistName,
                                            watchlist.isSelected && styles.watchlistNameSelected
                                        ]}>
                                            {watchlist.name}
                                        </Text>
                                        <Text style={styles.watchlistCount}>
                                            {watchlist.stocks.length} {watchlist.stocks.length === 1 ? 'stock' : 'stocks'}
                                        </Text>
                                    </View>

                                    <View style={[
                                        styles.checkIcon,
                                        watchlist.isSelected && styles.checkIconSelected
                                    ]}>
                                        {watchlist.isSelected && (
                                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                        )}
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {/* Show here the add button */}
                    <View style={styles.footer}>
                        <Button
                            title="Done"
                            onPress={() => actionSheetRef.current?.hide()}
                            style={styles.doneButton}
                        />
                    </View>
                </ScrollView>

            </ActionSheet>
        );
    }
);

WatchlistBottomSheet.displayName = "WatchlistBottomSheet";

const styles = StyleSheet.create({
    actionSheetContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '70%',
        padding: 10
    },
    sheetContent: {
        flex: 1,
        height: '100%',
    },

    // Header Styles
    header: {
        paddingTop: 8,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        alignItems: 'center',
    },
    dragHandle: {
        width: 36,
        height: 4,
        backgroundColor: '#CBD5E1',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    headerContent: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#00D4AA',
    },

    // Create Section Styles
    createSection: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
    },
    createNewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    createIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#00D4AA',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    createNewText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1E293B',
        flex: 1,
    },

    // Create Form Styles
    createForm: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#00D4AA',
    },
    createInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 10,
    },
    createInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#1E293B',
        marginRight: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#00D4AA',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    cancelButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createActions: {
        alignItems: 'flex-end',
    },
    createButton: {
        backgroundColor: '#00D4AA',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    createButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 20,
        marginVertical: 16,
    },

    // Watchlists ScrollView
    watchlistsScrollView: {
        flex: 1,
        paddingHorizontal: 20,
    },

    // Loading State
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 14,
        color: '#64748B',
        marginTop: 12,
        fontWeight: '500',
    },

    // Empty State
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        paddingHorizontal: 20,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#64748B',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
    },

    // Watchlists List
    watchlistsList: {
        paddingBottom: 20,
        paddingHorizontal: 10,
    },
    watchlistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    watchlistItemSelected: {
        borderColor: '#00D4AA',
        backgroundColor: '#F8FFFD',
    },
    watchlistIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    watchlistDetails: {
        flex: 1,
    },
    watchlistName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1E293B',
        marginBottom: 2,
    },
    watchlistNameSelected: {
        color: '#00D4AA',
        fontWeight: '600',
    },
    watchlistCount: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    checkIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    checkIconSelected: {
        backgroundColor: '#00D4AA',
        borderColor: '#00D4AA',
    },

    // Footer
    footer: {
        paddingHorizontal: 10,
        paddingTop: 16,
        paddingBottom: 32,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FFFFFF',
        marginTop: 20,
    },
    doneButton: {
        backgroundColor: '#00D4AA',
        paddingVertical: 14,
        borderRadius: 12,
        width: '100%',
    },
});

export default WatchlistBottomSheet;