import { Link, useNavigation } from 'expo-router';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import { getCachedTopGainersLosers, searchTicker } from '../api/alphaVantage';

// Stock interface for type safety
interface Stock {
  name: string;
  price: string;
  symbol: string;
  image: string;
  change: string;
}

// Component to render stock logo or fallback image
function StockLogo({ uri }: { uri: string }) {
  const fallback = require('../../assets/images/stock-placeholder.png');
  if (!uri || typeof uri !== 'string' || uri === 'placeholder') {
    return <Image source={fallback} style={styles.logo} />;
  }
  return (
    <Image
      source={{ uri }}
      style={styles.logo}
      onError={() => {}}
    />
  );
}

// Main ExploreScreen component
export default function ExploreScreen() {
  // State variables for search, gainers, losers, loading, and errors
  const [search, setSearch] = useState('');
  const navigation = useNavigation();
  const [gainers, setGainers] = useState<Stock[]>([]);
  const [losers, setLosers] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Debounced search for ticker symbols
  const debouncedSearch = useDebouncedCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setSearchError('');
      return;
    }
    setSearchLoading(true);
    setSearchError('');
    try {
      const results = await searchTicker(query);
      if (results && Array.isArray(results.bestMatches)) {
        setSearchResults(results.bestMatches);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchError('Search failed.');
      setSearchResults([]);
    }
    setSearchLoading(false);
  }, 400);

  // Set up the search bar in the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TextInput
          placeholder="Search stocks..."
          placeholderTextColor="#8E8E93"
          value={search}
          onChangeText={text => {
            setSearch(text);
            debouncedSearch(text);
          }}
          style={[styles.searchInput, { marginTop: -15 }]}
        />
      ),
    });
  }, [navigation, search, debouncedSearch]);

  // Fetch top gainers and losers on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const data = await getCachedTopGainersLosers();
        // Helper to map API data to Stock interface
        function mapStock(s: any): Stock {
          return {
            name: s.name || s.symbol || s.ticker || '',
            price: s.price || s.close || '',
            symbol: s.ticker || s.symbol || s.name || '',
            image: 'placeholder',
            change: s.change || '',
          };
        }
        const gainersRaw = (data.top_gainers || []).slice(0, 4).map(mapStock);
        const losersRaw = (data.top_losers || []).slice(0, 4).map(mapStock);
        const gainersWithImages = await updateStockImages(gainersRaw);
        const losersWithImages = await updateStockImages(losersRaw);
        setGainers(gainersWithImages);
        setLosers(losersWithImages);
      } catch {
        setError('Failed to load data. Please try again.');
        setGainers([]);
        setLosers([]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Helper to update stock images using Financial Modeling Prep
  async function updateStockImages(stocks: Stock[]) {
    return await Promise.all(
      stocks.map(async (stock) => {
        const url = stock.symbol ? `https://financialmodelingprep.com/image-stock/${stock.symbol.toUpperCase()}.png` : '';
        if (!url) return stock;
        try {
          const ok = await Image.prefetch(url);
          if (ok) return { ...stock, image: url };
        } catch {}
        return stock;
      })
    );
  }

  // Main render
  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {loading ? (
          // Loading indicator
          <View style={[styles.loadingContainer, { flex: 1, minHeight: 700 }]}> 
            <ActivityIndicator size="large" color="#007AFF" style={{ marginBottom: 16 }} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* Search Results Dropdown */}
            {search.length > 1 && (
              <View style={{ backgroundColor: '#fff', borderRadius: 10, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 }}>
                {searchLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" style={{ margin: 12 }} />
                ) : searchError ? (
                  <Text style={{ color: '#FF3B30', padding: 12 }}>{searchError}</Text>
                ) : !Array.isArray(searchResults) || searchResults.length === 0 ? (
                  <Text style={{ color: '#8E8E93', padding: 12 }}>No results</Text>
                ) : (
                  searchResults.slice(0, 6).map((item) => (
                    <Link key={item['1. symbol'] || item.symbol} href={{ pathname: '/details/[symbol]', params: { symbol: (item['1. symbol'] || item.symbol) } }} asChild>
                      <TouchableOpacity
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' }}
                        onPress={() => {
                          setSearch('');
                          setSearchResults([]);
                        }}
                      >
                        <Text style={{ fontWeight: '700', color: '#1C1C1E' }}>{item['1. symbol'] || item.symbol}</Text>
                        <Text style={{ color: '#8E8E93', fontSize: 13 }}>{item['2. name'] || item.name}</Text>
                      </TouchableOpacity>
                    </Link>
                  ))
                )}
              </View>
            )}
            {/* Error message if data fails to load */}
            {error ? (
              <Text style={{ color: '#FF3B30', textAlign: 'center', marginVertical: 16 }}>{error}</Text>
            ) : null}
            {/* Top Gainers Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Gainers</Text>
              <Link href={"../view-all/gainers"} asChild>
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </Link>
            </View>
            <View style={styles.gridContainer}>
              {gainers.length === 0 && !loading ? (
                <Text style={{ color: '#8E8E93', textAlign: 'center', width: '100%' }}>No data available.</Text>
              ) : gainers.map((stock) => {
                return (
                  <View key={stock.symbol} style={styles.cardWrapper}>
                    <Link href={{ pathname: '/details/[symbol]', params: { symbol: stock.symbol } }} asChild>
                      <TouchableOpacity style={[styles.card, styles.gainersCard]}>
                        <View style={styles.logoContainer}>
                          <StockLogo uri={stock.image} />
                        </View>
                        <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                        <Text style={styles.stockPrice}>{stock.price}</Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
                );
              })}
            </View>
            {/* Top Losers Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Losers</Text>
              <Link href={"../view-all/losers"} asChild>
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              </Link>
            </View>
            <View style={styles.gridContainer}>
              {losers.length === 0 && !loading ? (
                <Text style={{ color: '#8E8E93', textAlign: 'center', width: '100%' }}>No data available.</Text>
              ) : losers.map((stock) => {
                return (
                  <View key={stock.symbol} style={styles.cardWrapper}>
                    <Link href={{ pathname: '/details/[symbol]', params: { symbol: stock.symbol } }} asChild>
                      <TouchableOpacity style={[styles.card, styles.losersCard]}>
                        <View style={styles.logoContainer}>
                          <StockLogo uri={stock.image} />
                        </View>
                        <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                        <Text style={styles.stockPrice}>{stock.price}</Text>
                      </TouchableOpacity>
                    </Link>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

// Styles for the ExploreScreen and its components
const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 700,
    width: '100%',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '600',
  },
  searchInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 11,
    paddingHorizontal: 19,
    paddingVertical: 8,
    height: 36,
    width: 160,
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '400',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop:28,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewAllText: {
    color:'#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  gainersCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  losersCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  stockPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#48484A',
    marginBottom: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    paddingHorizontal: 1,
    paddingVertical: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  changeIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  gainText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#34C759',
  },
  lossText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF3B30',
  },
});