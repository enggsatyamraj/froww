// components/ui/StockCard.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { StockData } from '../../types/api';

interface StockCardProps {
    stock: StockData;
    onPress?: () => void;
    style?: ViewStyle;
}

export const StockCard = ({ stock, onPress, style }: StockCardProps) => {
    const isPositive = parseFloat(stock.change_amount) >= 0;
    const changeColor = isPositive ? colors.bullish : colors.bearish;
    const changeIcon = isPositive ? 'trending-up' : 'trending-down';

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                pressed && styles.pressed,
                style,
            ]}
            onPress={onPress}
        >
            <View style={styles.header}>
                <View style={styles.symbolContainer}>
                    <Text style={styles.symbol}>{stock.ticker}</Text>
                    <Ionicons
                        name={changeIcon}
                        size={16}
                        color={changeColor}
                        style={styles.trendIcon}
                    />
                </View>
                <Text style={[styles.price, { color: colors.text.primary }]}>
                    ${parseFloat(stock.price).toFixed(2)}
                </Text>
            </View>

            <View style={styles.changeContainer}>
                <Text style={[styles.changeAmount, { color: changeColor }]}>
                    {isPositive ? '+' : ''}${parseFloat(stock.change_amount).toFixed(2)}
                </Text>
                <Text style={[styles.changePercentage, { color: changeColor }]}>
                    ({isPositive ? '+' : ''}{parseFloat(stock.change_percentage).toFixed(2)}%)
                </Text>
            </View>

            <View style={styles.volumeContainer}>
                <Text style={styles.volumeLabel}>Volume: </Text>
                <Text style={styles.volumeValue}>
                    {parseInt(stock.volume).toLocaleString()}
                </Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        marginBottom: spacing.sm,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    pressed: {
        opacity: 0.7,
        transform: [{ scale: 0.98 }],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.xs,
    },
    symbolContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    symbol: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        color: colors.text.primary,
        marginRight: spacing.xs,
    },
    trendIcon: {
        opacity: 0.8,
    },
    price: {
        fontSize: typography.fontSize.lg,
        fontWeight: typography.fontWeight.bold,
    },
    changeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    changeAmount: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        marginRight: spacing.xs,
    },
    changePercentage: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
    },
    volumeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    volumeLabel: {
        fontSize: typography.fontSize.xs,
        color: colors.text.secondary,
    },
    volumeValue: {
        fontSize: typography.fontSize.xs,
        color: colors.text.muted,
        fontWeight: typography.fontWeight.medium,
    },
});