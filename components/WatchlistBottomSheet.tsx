// components/WatchlistBottomSheet.tsx - Updated with Done button in header

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

interface WatchlistDisplayItem extends WatchlistItem {
    isSelected: boolean;
}

interface WatchlistBottomSheetProps {
    onAddToWatchlist: (watchlistIds: string[], stockSymbol: string) => void;
    stockSymbol: string;
    isCreationOnly?: boolean; // New prop to indicate creation-only mode
}

export interface WatchlistBottomSheetRef {
    show: () => void;
    hide: () => void;
}

export const WatchlistBottomSheet = forwardRef<WatchlistBottomSheetRef, WatchlistBottomSheetProps>(
    ({ onAddToWatchlist, stockSymbol, isCreationOnly = false }, ref) => {
        const actionSheetRef = React.useRef<ActionSheetRef>(null);
        const [watchlists, setWatchlists] = useState<WatchlistDisplayItem[]>([]);
        const [newWatchlistName, setNewWatchlistName] = useState('');
        const [loading, setLoading] = useState(false);
        const [creating, setCreating] = useState(false);
        const [nameError, setNameError] = useState<string | null>(null);

        useImperativeHandle(ref, () => ({
            show: () => {
                loadWatchlists();
                setNewWatchlistName('');
                setNameError(null);
                actionSheetRef.current?.show();
            },
            hide: () => {
                actionSheetRef.current?.hide();
                setNewWatchlistName('');
                setNameError(null);
            },
        }));

        const loadWatchlists = async () => {
            try {
                setLoading(true);
                const allWatchlists = await watchlistStorage.getWatchlists();

                let displayWatchlists: WatchlistDisplayItem[];

                if (isCreationOnly) {
                    // For creation-only mode, show all watchlists as non-selectable
                    displayWatchlists = allWatchlists.map(w => ({
                        ...w,
                        isSelected: false, // Always false in creation mode
                    }));
                } else {
                    // For stock detail mode, check which watchlists already contain this stock
                    const stockWatchlists = await watchlistStorage.getWatchlistsForStock(stockSymbol);
                    const stockWatchlistIds = stockWatchlists.map(sw => sw.watchlistId);

                    displayWatchlists = allWatchlists.map(w => ({
                        ...w,
                        isSelected: stockWatchlistIds.includes(w.id),
                    }));
                }

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

        const validateWatchlistName = (name: string): string | null => {
            const trimmedName = name.trim();

            if (!trimmedName) {
                return 'Please enter a watchlist name';
            }

            if (trimmedName.length < 2) {
                return 'Name must be at least 2 characters';
            }

            if (trimmedName.length > 50) {
                return 'Name must be less than 50 characters';
            }

            // Check for duplicate names (case-insensitive)
            const existingNames = watchlists.map(w => w.name.toLowerCase());
            if (existingNames.includes(trimmedName.toLowerCase())) {
                return 'A watchlist with this name already exists';
            }

            return null;
        };

        const createNewWatchlist = async () => {
            const trimmedName = newWatchlistName.trim();
            const validationError = validateWatchlistName(trimmedName);

            if (validationError) {
                setNameError(validationError);
                return;
            }

            try {
                setCreating(true);
                setNameError(null);
                Keyboard.dismiss();

                console.log('🔄 Creating new watchlist:', trimmedName);

                // Create new watchlist WITHOUT adding the current stock
                const newWatchlist = await watchlistStorage.createWatchlist(trimmedName);

                console.log('✅ Watchlist created successfully:', newWatchlist);

                // Add to local state with selected = false (NOT selected by default)
                const newDisplayWatchlist: WatchlistDisplayItem = {
                    ...newWatchlist,
                    stocks: [], // Empty initially
                    isSelected: false, // NOT selected by default
                };

                setWatchlists(prev => [newDisplayWatchlist, ...prev]);

                // Reset form
                setNewWatchlistName('');
                setNameError(null);

                // Notify parent component to refresh the list
                onAddToWatchlist([], stockSymbol);

                // Show success alert with auto-close callback
                Alert.alert(
                    'Success!',
                    `Watchlist "${trimmedName}" created successfully`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                // Close the bottom sheet after alert is dismissed
                                console.log('🔽 Closing bottom sheet after success');
                                // actionSheetRef.current?.hide();
                            }
                        }
                    ]
                );

            } catch (error) {
                console.error('❌ Error creating watchlist:', error);
                setNameError('Failed to create watchlist. Please try again.');
            } finally {
                setCreating(false);
            }
        };

        const handleNameChange = (text: string) => {
            setNewWatchlistName(text);
            // Clear error when user starts typing
            if (nameError) {
                setNameError(null);
            }
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

                {/* Updated Header with Done button */}
                <View style={styles.header}>
                    {/* <View style={styles.dragHandle} /> */}
                    <View style={styles.headerContent}>
                        {/* <View style={styles.placeholder} /> */}
                        <Text style={styles.headerTitle}>
                            {isCreationOnly ? 'Create Watchlist' : 'Add to Watchlist'}
                        </Text>
                        <Pressable
                            style={styles.doneButton}
                            onPress={() => actionSheetRef.current?.hide()}
                        >
                            <Ionicons name="close" size={24} color="#64748B" />
                        </Pressable>
                    </View>
                </View>

                <ScrollView>
                    <View style={styles.createSection}>
                        <Text style={styles.createLabel}>Create New Watchlist</Text>
                        <View style={styles.createInputRow}>
                            <TextInput
                                style={[
                                    styles.createInput,
                                    nameError && styles.createInputError
                                ]}
                                placeholder="Enter watchlist name"
                                value={newWatchlistName}
                                onChangeText={handleNameChange}
                                maxLength={50}
                                editable={!creating}
                                returnKeyType="done"
                                onSubmitEditing={createNewWatchlist}
                                autoCapitalize="words"
                            />
                            <Pressable
                                style={[
                                    styles.createButton,
                                    (!newWatchlistName.trim() || creating || !!nameError) && styles.createButtonDisabled
                                ]}
                                onPress={createNewWatchlist}
                                disabled={!newWatchlistName.trim() || creating || !!nameError}
                            >
                                <Text style={[
                                    styles.createButtonText,
                                    (!newWatchlistName.trim() || creating || !!nameError) && styles.createButtonTextDisabled
                                ]}>
                                    {creating ? "Creating..." : "Create"}
                                </Text>
                            </Pressable>
                        </View>
                        {nameError && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="warning" size={14} color="#EF4444" />
                                <Text style={styles.errorText}>{nameError}</Text>
                            </View>
                        )}
                    </View>

                    {watchlists.length > 0 && <View style={styles.divider} />}

                    {/* Watchlist Items */}
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
                            <Text style={styles.emptySubtitle}>Create your first watchlist above to get started</Text>
                        </View>
                    ) : (
                        <View style={styles.watchlistsList}>
                            {!isCreationOnly && (
                                <Text style={styles.existingLabel}>Existing Watchlists</Text>
                            )}
                            {watchlists.map((watchlist) => (
                                <Pressable
                                    key={watchlist.id}
                                    style={[
                                        styles.watchlistItem,
                                        watchlist.isSelected && styles.watchlistItemSelected,
                                        isCreationOnly && styles.watchlistItemNonSelectable
                                    ]}
                                    onPress={() => !isCreationOnly && toggleWatchlistSelection(watchlist.id)}
                                    disabled={loading || creating || isCreationOnly}
                                >
                                    <View style={styles.watchlistIcon}>
                                        <Ionicons
                                            name={watchlist.isSelected ? "bookmark" : "bookmark-outline"}
                                            size={20}
                                            color={isCreationOnly ? "#9CA3AF" : (watchlist.isSelected ? "#00D4AA" : "#64748B")}
                                        />
                                    </View>

                                    <View style={styles.watchlistDetails}>
                                        <Text style={[
                                            styles.watchlistName,
                                            watchlist.isSelected && styles.watchlistNameSelected,
                                            isCreationOnly && styles.watchlistNameNonSelectable
                                        ]}>
                                            {watchlist.name}
                                        </Text>
                                    </View>

                                    {!isCreationOnly && (
                                        <View style={[
                                            styles.checkIcon,
                                            watchlist.isSelected && styles.checkIconSelected
                                        ]}>
                                            {watchlist.isSelected && (
                                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                            )}
                                        </View>
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    )}
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
        height: '75%',
        padding: 10
    },

    // Updated Header Styles
    header: {
        paddingTop: 8,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
    },
    placeholder: {
        width: 60, // Same width as Done button for perfect centering
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
        textAlign: 'center',
    },
    doneButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Create Section
    createSection: {
        paddingHorizontal: 10,
        paddingVertical: 16,
    },
    createLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 12,
    },
    createInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    createInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: '#1E293B',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderWidth: 1.5,
        borderColor: '#00D4AA',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    createInputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    createButton: {
        backgroundColor: '#00D4AA',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        minWidth: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    createButtonTextDisabled: {
        color: '#9CA3AF',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 4,
        gap: 6,
    },
    errorText: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '500',
        flex: 1,
    },

    // Divider
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginHorizontal: 10,
        marginVertical: 8,
    },

    // Existing watchlists section
    existingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 12,
        paddingHorizontal: 10,
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
    watchlistItemNonSelectable: {
        opacity: 0.6,
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
    },
    watchlistNameSelected: {
        color: '#00D4AA',
        fontWeight: '600',
    },
    watchlistNameNonSelectable: {
        color: '#9CA3AF',
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
});