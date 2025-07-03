// services/watchlistStorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WatchlistItem {
    id: string;
    name: string;
    stocks: string[]; // Array of stock symbols
    createdAt: string;
    updatedAt: string;
}

export interface StockInWatchlist {
    symbol: string;
    addedAt: string;
    watchlistId: string;
    watchlistName: string;
}

const WATCHLISTS_KEY = 'froww_watchlists';
const STOCK_WATCHLISTS_KEY = 'froww_stock_watchlists'; // For quick lookup

class WatchlistStorageService {
    // Get all watchlists
    async getWatchlists(): Promise<WatchlistItem[]> {
        try {
            const data = await AsyncStorage.getItem(WATCHLISTS_KEY);
            if (!data) {
                // Return empty array instead of creating default watchlists
                return [];
            }
            return JSON.parse(data);
        } catch (error) {
            console.error('Error getting watchlists:', error);
            return [];
        }
    }

    // Save watchlists to storage
    private async saveWatchlists(watchlists: WatchlistItem[]): Promise<void> {
        try {
            await AsyncStorage.setItem(WATCHLISTS_KEY, JSON.stringify(watchlists));
        } catch (error) {
            console.error('Error saving watchlists:', error);
            throw error;
        }
    }

    // Create a new watchlist
    async createWatchlist(name: string): Promise<WatchlistItem> {
        try {
            const watchlists = await this.getWatchlists();

            const newWatchlist: WatchlistItem = {
                id: Date.now().toString(),
                name: name.trim(),
                stocks: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            watchlists.push(newWatchlist);
            await this.saveWatchlists(watchlists);

            console.log('✅ Created watchlist:', newWatchlist.name);
            return newWatchlist;
        } catch (error) {
            console.error('Error creating watchlist:', error);
            throw error;
        }
    }

    // Add stock to watchlists
    async addStockToWatchlists(stockSymbol: string, watchlistIds: string[]): Promise<void> {
        try {
            const watchlists = await this.getWatchlists();
            let updated = false;

            // Add stock to each selected watchlist
            watchlists.forEach(watchlist => {
                if (watchlistIds.includes(watchlist.id)) {
                    if (!watchlist.stocks.includes(stockSymbol)) {
                        watchlist.stocks.push(stockSymbol);
                        watchlist.updatedAt = new Date().toISOString();
                        updated = true;
                    }
                }
            });

            if (updated) {
                await this.saveWatchlists(watchlists);
                await this.updateStockWatchlistsIndex();
                console.log(`✅ Added ${stockSymbol} to ${watchlistIds.length} watchlists`);
            }
        } catch (error) {
            console.error('Error adding stock to watchlists:', error);
            throw error;
        }
    }

    // Remove stock from watchlist
    async removeStockFromWatchlist(stockSymbol: string, watchlistId: string): Promise<void> {
        try {
            const watchlists = await this.getWatchlists();

            const watchlist = watchlists.find(w => w.id === watchlistId);
            if (watchlist) {
                watchlist.stocks = watchlist.stocks.filter(s => s !== stockSymbol);
                watchlist.updatedAt = new Date().toISOString();

                await this.saveWatchlists(watchlists);
                await this.updateStockWatchlistsIndex();

                console.log(`✅ Removed ${stockSymbol} from ${watchlist.name}`);
            }
        } catch (error) {
            console.error('Error removing stock from watchlist:', error);
            throw error;
        }
    }

    // Remove stock from ALL watchlists
    async removeStockFromAllWatchlists(stockSymbol: string): Promise<void> {
        try {
            const watchlists = await this.getWatchlists();
            let updated = false;

            watchlists.forEach(watchlist => {
                if (watchlist.stocks.includes(stockSymbol)) {
                    watchlist.stocks = watchlist.stocks.filter(s => s !== stockSymbol);
                    watchlist.updatedAt = new Date().toISOString();
                    updated = true;
                }
            });

            if (updated) {
                await this.saveWatchlists(watchlists);
                await this.updateStockWatchlistsIndex();
                console.log(`✅ Removed ${stockSymbol} from all watchlists`);
            }
        } catch (error) {
            console.error('Error removing stock from all watchlists:', error);
            throw error;
        }
    }

    // Get watchlists containing a specific stock
    async getWatchlistsForStock(stockSymbol: string): Promise<StockInWatchlist[]> {
        try {
            const watchlists = await this.getWatchlists();
            const result: StockInWatchlist[] = [];

            watchlists.forEach(watchlist => {
                if (watchlist.stocks.includes(stockSymbol)) {
                    result.push({
                        symbol: stockSymbol,
                        addedAt: watchlist.updatedAt, // Approximate
                        watchlistId: watchlist.id,
                        watchlistName: watchlist.name,
                    });
                }
            });

            return result;
        } catch (error) {
            console.error('Error getting watchlists for stock:', error);
            return [];
        }
    }

    // Check if stock is in any watchlist
    async isStockInWatchlists(stockSymbol: string): Promise<boolean> {
        try {
            const stockWatchlists = await this.getWatchlistsForStock(stockSymbol);
            return stockWatchlists.length > 0;
        } catch (error) {
            console.error('Error checking if stock is in watchlists:', error);
            return false;
        }
    }

    // Delete a watchlist
    async deleteWatchlist(watchlistId: string): Promise<void> {
        try {
            const watchlists = await this.getWatchlists();
            const filteredWatchlists = watchlists.filter(w => w.id !== watchlistId);

            await this.saveWatchlists(filteredWatchlists);
            await this.updateStockWatchlistsIndex();

            console.log('✅ Deleted watchlist');
        } catch (error) {
            console.error('Error deleting watchlist:', error);
            throw error;
        }
    }

    // Update watchlist name
    async updateWatchlistName(watchlistId: string, newName: string): Promise<void> {
        try {
            const watchlists = await this.getWatchlists();
            const watchlist = watchlists.find(w => w.id === watchlistId);

            if (watchlist) {
                watchlist.name = newName.trim();
                watchlist.updatedAt = new Date().toISOString();

                await this.saveWatchlists(watchlists);
                console.log('✅ Updated watchlist name');
            }
        } catch (error) {
            console.error('Error updating watchlist name:', error);
            throw error;
        }
    }

    // Get stocks in a specific watchlist
    async getStocksInWatchlist(watchlistId: string): Promise<string[]> {
        try {
            const watchlists = await this.getWatchlists();
            const watchlist = watchlists.find(w => w.id === watchlistId);
            return watchlist ? watchlist.stocks : [];
        } catch (error) {
            console.error('Error getting stocks in watchlist:', error);
            return [];
        }
    }

    // Update the stock-watchlists index for quick lookups
    private async updateStockWatchlistsIndex(): Promise<void> {
        try {
            const watchlists = await this.getWatchlists();
            const stockWatchlistsMap: { [stockSymbol: string]: StockInWatchlist[] } = {};

            watchlists.forEach(watchlist => {
                watchlist.stocks.forEach(stock => {
                    if (!stockWatchlistsMap[stock]) {
                        stockWatchlistsMap[stock] = [];
                    }
                    stockWatchlistsMap[stock].push({
                        symbol: stock,
                        addedAt: watchlist.updatedAt,
                        watchlistId: watchlist.id,
                        watchlistName: watchlist.name,
                    });
                });
            });

            await AsyncStorage.setItem(STOCK_WATCHLISTS_KEY, JSON.stringify(stockWatchlistsMap));
        } catch (error) {
            console.error('Error updating stock watchlists index:', error);
        }
    }

    // Clear all watchlist data (for testing/reset)
    async clearAllData(): Promise<void> {
        try {
            await AsyncStorage.removeItem(WATCHLISTS_KEY);
            await AsyncStorage.removeItem(STOCK_WATCHLISTS_KEY);
            console.log('✅ Cleared all watchlist data');
        } catch (error) {
            console.error('Error clearing watchlist data:', error);
            throw error;
        }
    }

    // Get watchlist statistics
    async getWatchlistStats(): Promise<{ totalWatchlists: number; totalStocks: number; averageStocksPerWatchlist: number }> {
        try {
            const watchlists = await this.getWatchlists();
            const totalWatchlists = watchlists.length;
            const totalStocks = watchlists.reduce((sum, w) => sum + w.stocks.length, 0);
            const averageStocksPerWatchlist = totalWatchlists > 0 ? Math.round(totalStocks / totalWatchlists) : 0;

            return {
                totalWatchlists,
                totalStocks,
                averageStocksPerWatchlist,
            };
        } catch (error) {
            console.error('Error getting watchlist stats:', error);
            return { totalWatchlists: 0, totalStocks: 0, averageStocksPerWatchlist: 0 };
        }
    }
}

export const watchlistStorage = new WatchlistStorageService();