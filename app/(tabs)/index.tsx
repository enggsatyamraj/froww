import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { colors, spacing, typography } from '../../theme';

export default function ExploreScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.greeting}>Good Morning!</Text>
                    <Text style={styles.subtitle}>Let&lsquo;s explore the market today</Text>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statLabel}>NIFTY 50</Text>
                        <Text style={styles.statValue}>21,456.78</Text>
                        <Text style={[styles.statChange, { color: colors.bullish }]}>
                            +245.67 (+1.16%)
                        </Text>
                    </Card>

                    <Card style={styles.statCard}>
                        <Text style={styles.statLabel}>SENSEX</Text>
                        <Text style={styles.statValue}>70,847.67</Text>
                        <Text style={[styles.statChange, { color: colors.bearish }]}>
                            -125.43 (-0.18%)
                        </Text>
                    </Card>
                </View>

                {/* Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top Gainers</Text>
                    <Card style={styles.card}>
                        <Text style={styles.cardText}>Stock data will be loaded here</Text>
                    </Card>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top Losers</Text>
                    <Card style={styles.card}>
                        <Text style={styles.cardText}>Stock data will be loaded here</Text>
                    </Card>
                </View>

                {/* Action Button */}
                <Button
                    title="Load Market Data"
                    onPress={() => console.log('Load data pressed')}
                    style={styles.button}
                />

                {/* Bottom Spacing for Floating Tab */}
                <View style={styles.bottomSpacing} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: spacing.lg,
    },
    header: {
        marginBottom: spacing.xl,
    },
    greeting: {
        fontSize: typography.fontSize.xxl,
        fontWeight: typography.fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    statCard: {
        flex: 1,
        padding: spacing.md,
    },
    statLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    statValue: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    statChange: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    card: {
        padding: spacing.lg,
    },
    cardText: {
        fontSize: typography.fontSize.base,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    button: {
        marginTop: spacing.lg,
    },
    bottomSpacing: {
        height: 100, // Space for floating tab bar
    },
});