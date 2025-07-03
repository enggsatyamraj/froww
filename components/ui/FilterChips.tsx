// components/ui/FilterChips.tsx

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export type FilterType = 'all' | 'gainers' | 'losers' | 'active' | 'tech' | 'finance';

interface FilterChipsProps {
    selectedFilter: FilterType;
    onFilterChange: (filter: FilterType) => void;
}

const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'gainers', label: 'Gainers' },
    { key: 'losers', label: 'Losers' },
    { key: 'active', label: 'Most Active' },
    { key: 'tech', label: 'Tech' },
    { key: 'finance', label: 'Finance' },
];

export const FilterChips = ({ selectedFilter, onFilterChange }: FilterChipsProps) => {
    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
            >
                {filters.map((filter) => {
                    const isSelected = selectedFilter === filter.key;
                    return (
                        <Pressable
                            key={filter.key}
                            style={[
                                styles.chip,
                                isSelected && styles.chipSelected,
                            ]}
                            onPress={() => onFilterChange(filter.key)}
                        >
                            <Text
                                style={[
                                    styles.chipText,
                                    isSelected && styles.chipTextSelected,
                                ]}
                            >
                                {filter.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: spacing.md,
    },
    scrollContainer: {
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radius.xl,
        backgroundColor: colors.gray[100],
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 60,
        alignItems: 'center',
    },
    chipSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    chipText: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.medium,
        color: colors.text.secondary,
    },
    chipTextSelected: {
        color: '#ffffff',
        fontWeight: typography.fontWeight.semibold,
    },
});