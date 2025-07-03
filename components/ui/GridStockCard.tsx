// components/ui/GridStockCard.tsx

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { StockData } from '../../types/api';

interface GridStockCardProps {
    stock: StockData;
    onPress?: () => void;
    style?: ViewStyle;
}

export const GridStockCard = ({ stock, onPress, style }: GridStockCardProps) => {
    const isPositive = parseFloat(stock.change_amount) >= 0;
    const changeColor = isPositive ? '#00C896' : '#FF6B6B';
    const changeBgColor = isPositive ? '#F0FDF4' : '#FEF2F2';
    const changePercentage = parseFloat(stock.change_percentage).toFixed(2);
    const changeAmount = parseFloat(stock.change_amount).toFixed(2);
    const price = parseFloat(stock.price);
    const volume = parseInt(stock.volume);

    // Format volume for display (e.g., 1.2M, 45.6K)
    const formatVolume = (vol: number) => {
        if (vol >= 1000000000) {
            return `${(vol / 1000000000).toFixed(1)}B`;
        } else if (vol >= 1000000) {
            return `${(vol / 1000000).toFixed(1)}M`;
        } else if (vol >= 1000) {
            return `${(vol / 1000).toFixed(1)}K`;
        }
        return vol.toString();
    };

    // Format price based on value
    const formatPrice = (price: number) => {
        if (price < 1) {
            return price.toFixed(4);
        } else if (price < 10) {
            return price.toFixed(3);
        } else {
            return price.toFixed(2);
        }
    };

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                pressed && styles.pressed,
                style,
            ]}
            onPress={onPress}
        >
            {/* Header with Symbol and Trend Indicator */}
            <View style={styles.header}>
                <View style={styles.symbolContainer}>
                    <Text style={styles.symbol} numberOfLines={1}>
                        {stock.ticker}
                    </Text>
                </View>
                <View style={[styles.trendIndicator, { backgroundColor: changeBgColor }]}>
                    <Ionicons
                        name={isPositive ? 'trending-up' : 'trending-down'}
                        size={12}
                        color={changeColor}
                    />
                </View>
            </View>

            {/* Price Section */}
            <View style={styles.priceSection}>
                <Text style={styles.price} numberOfLines={1}>
                    ${formatPrice(price)}
                </Text>

                {/* Change Container */}
                <View style={styles.changeContainer}>
                    <View style={[styles.changeBadge, { backgroundColor: changeBgColor }]}>
                        <Text style={[styles.changeAmount, { color: changeColor }]} numberOfLines={1}>
                            {isPositive ? '+' : ''}${Math.abs(parseFloat(changeAmount)).toFixed(2)}
                        </Text>
                    </View>
                    <Text style={[styles.changePercentage, { color: changeColor }]} numberOfLines={1}>
                        ({isPositive ? '+' : ''}{changePercentage}%)
                    </Text>
                </View>
            </View>

            {/* Footer with Volume and Additional Info */}
            <View style={styles.footer}>
                <View style={styles.volumeContainer}>
                    <View style={styles.volumeIcon}>
                        <Ionicons name="pulse" size={10} color="#94A3B8" />
                    </View>
                    <Text style={styles.volumeLabel}>Vol</Text>
                    <Text style={styles.volumeText} numberOfLines={1}>
                        {formatVolume(volume)}
                    </Text>
                </View>

                {/* Performance indicator dots */}
                <View style={styles.performanceIndicator}>
                    <View style={[styles.performanceDot, { backgroundColor: changeColor, opacity: 1 }]} />
                    <View style={[styles.performanceDot, { backgroundColor: changeColor, opacity: 0.6 }]} />
                    <View style={[styles.performanceDot, { backgroundColor: changeColor, opacity: 0.3 }]} />
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        minHeight: 160,
        flex: 1,

        // Enhanced modern shadow
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,

        // Subtle border
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    pressed: {
        opacity: 0.95,
        transform: [{ scale: 0.98 }],
        shadowOpacity: 0.12,
        elevation: 8,
        borderColor: '#E2E8F0',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    symbolContainer: {
        flex: 1,
        paddingRight: 8,
    },
    symbol: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: 0.2,
    },
    trendIndicator: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    priceSection: {
        flex: 1,
        justifyContent: 'flex-start',
        marginBottom: 16,
    },
    price: {
        fontSize: 22,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    changeContainer: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
    },
    changeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    changeAmount: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.1,
    },
    changePercentage: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    volumeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    volumeIcon: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    volumeLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '500',
        marginRight: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    volumeText: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: '600',
    },
    performanceIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    performanceDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
});