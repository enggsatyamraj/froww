// components/RenameWatchlistBottomSheet.tsx

import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import {
    Alert,
    Keyboard,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet';
import { watchlistStorage } from '../services/watchlistStorage';

interface RenameWatchlistBottomSheetProps {
    onRename: (newName: string) => void;
}

export interface RenameWatchlistBottomSheetRef {
    show: (currentName: string, watchlistId: string) => void;
    hide: () => void;
}

export const RenameWatchlistBottomSheet = forwardRef<RenameWatchlistBottomSheetRef, RenameWatchlistBottomSheetProps>(
    ({ onRename }, ref) => {
        const actionSheetRef = React.useRef<ActionSheetRef>(null);
        const [newName, setNewName] = useState('');
        const [currentWatchlistId, setCurrentWatchlistId] = useState('');
        const [renaming, setRenaming] = useState(false);
        const [nameError, setNameError] = useState<string | null>(null);

        useImperativeHandle(ref, () => ({
            show: (currentName: string, watchlistId: string) => {
                setNewName(currentName);
                setCurrentWatchlistId(watchlistId);
                setNameError(null);
                actionSheetRef.current?.show();
            },
            hide: () => {
                actionSheetRef.current?.hide();
                setNewName('');
                setCurrentWatchlistId('');
                setNameError(null);
            },
        }));

        const validateName = async (name: string): Promise<string | null> => {
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

            // Check for duplicate names (excluding current watchlist)
            try {
                const allWatchlists = await watchlistStorage.getWatchlists();
                const existingNames = allWatchlists
                    .filter(w => w.id !== currentWatchlistId)
                    .map(w => w.name.toLowerCase());

                if (existingNames.includes(trimmedName.toLowerCase())) {
                    return 'A watchlist with this name already exists';
                }
            } catch (error) {
                console.error('Error checking for duplicate names:', error);
            }

            return null;
        };

        const handleRename = async () => {
            const trimmedName = newName.trim();
            const validationError = await validateName(trimmedName);

            if (validationError) {
                setNameError(validationError);
                return;
            }

            try {
                setRenaming(true);
                setNameError(null);
                Keyboard.dismiss();

                console.log('🏷️ Renaming watchlist to:', trimmedName);

                await watchlistStorage.updateWatchlistName(currentWatchlistId, trimmedName);

                console.log('✅ Watchlist renamed successfully');

                // Notify parent component
                onRename(trimmedName);

                // Show success and close
                Alert.alert(
                    'Success!',
                    `Watchlist renamed to "${trimmedName}"`,
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                actionSheetRef.current?.hide();
                            }
                        }
                    ]
                );

            } catch (error) {
                console.error('❌ Error renaming watchlist:', error);
                setNameError('Failed to rename watchlist. Please try again.');
            } finally {
                setRenaming(false);
            }
        };

        const handleNameChange = (text: string) => {
            setNewName(text);
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
                {/* Header */}
                <View style={styles.header}>
                    {/* <View style={styles.dragHandle} /> */}
                    <View style={styles.headerContent}>
                        {/* <View style={styles.placeholder} /> */}
                        <Text style={styles.headerTitle}>Rename Watchlist</Text>
                        <Pressable
                            style={styles.closeButton}
                            onPress={() => actionSheetRef.current?.hide()}
                        >
                            <Ionicons name="close" size={22} color="#64748B" />
                        </Pressable>
                    </View>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    <Text style={styles.instructionText}>
                        Enter a new name for your watchlist
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[
                                styles.textInput,
                                nameError && styles.textInputError
                            ]}
                            placeholder="Watchlist name"
                            value={newName}
                            onChangeText={handleNameChange}
                            maxLength={50}
                            editable={!renaming}
                            returnKeyType="done"
                            onSubmitEditing={handleRename}
                            autoCapitalize="words"
                            autoFocus={true}
                            selectTextOnFocus={true}
                        />

                        {nameError && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="warning" size={14} color="#EF4444" />
                                <Text style={styles.errorText}>{nameError}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.buttonContainer}>
                        <Pressable
                            style={styles.cancelButton}
                            onPress={() => actionSheetRef.current?.hide()}
                            disabled={renaming}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.renameButton,
                                (!newName.trim() || renaming || !!nameError) && styles.renameButtonDisabled
                            ]}
                            onPress={handleRename}
                            disabled={!newName.trim() || renaming || !!nameError}
                        >
                            <Text style={[
                                styles.renameButtonText,
                                (!newName.trim() || renaming || !!nameError) && styles.renameButtonTextDisabled
                            ]}>
                                {renaming ? 'Renaming...' : 'Rename'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </ActionSheet>
        );
    }
);

RenameWatchlistBottomSheet.displayName = "RenameWatchlistBottomSheet";

const styles = StyleSheet.create({
    actionSheetContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 40,
    },

    // Header Styles
    header: {
        paddingTop: 8,
        paddingBottom: 20,
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
        paddingHorizontal: 20,
    },
    placeholder: {
        width: 32,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Content Styles
    content: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    instructionText: {
        fontSize: 15,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    inputContainer: {
        marginBottom: 32,
    },
    textInput: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1F2937',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        textAlign: 'center',
    },
    textInputError: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        gap: 6,
    },
    errorText: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '500',
    },

    // Button Styles
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
    renameButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: '#00D4AA',
        alignItems: 'center',
        justifyContent: 'center',
    },
    renameButtonDisabled: {
        backgroundColor: '#CBD5E1',
    },
    renameButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    renameButtonTextDisabled: {
        color: '#9CA3AF',
    },
});