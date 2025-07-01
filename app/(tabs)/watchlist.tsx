import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { colors, spacing, typography } from '../../theme';

export default function WatchlistScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.content}>
                {/* Empty State */}
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
                        onPress={() => console.log('Create watchlist pressed')}
                        style={styles.button}
                    />
                </View>
            </View>
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