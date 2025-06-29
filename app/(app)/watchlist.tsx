import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Main WatchlistScreen component
export default function WatchlistScreen() {
  // State for watchlist groups and selected group
  const [groups, setGroups] = useState<{ [group: string]: string[] }>({});
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const router = useRouter();

  // Load watchlist groups from AsyncStorage on mount
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await AsyncStorage.getItem('WATCHLIST_GROUPS');
        if (data) setGroups(JSON.parse(data));
      } catch {
        // error handling (optional)
      }
    };
    loadGroups();
  }, []);

  // Delete a group from watchlist
  const deleteGroup = async (group: string) => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete the group "${group}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            const updated = { ...groups };
            delete updated[group];
            await AsyncStorage.setItem('WATCHLIST_GROUPS', JSON.stringify(updated));
            setGroups(updated);
            if (selectedGroup === group) setSelectedGroup(null);
          }
        }
      ]
    );
  };

  // Render a single group row
  const renderGroup = ({ item }: { item: string }) => (
    <View style={styles.groupRow}>
      <TouchableOpacity style={styles.groupBtn} onPress={() => setSelectedGroup(item)}>
        <Text style={styles.groupName}>{item}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteGroup(item)} style={styles.deleteBtn}>
        <Ionicons name="trash" size={22} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  // Render a single stock in a group
  const renderStock = ({ item }: { item: string }) => (
    <TouchableOpacity style={styles.stockBtn} onPress={() => router.push({ pathname: '/details/[symbol]', params: { symbol: item } })}>
      <Text style={styles.stockName}>{item}</Text>
    </TouchableOpacity>
  );

  // Show empty state if no groups exist
  if (!Object.keys(groups).length) {
    return (
      <View style={styles.center}>
        <Text style={styles.heading}>Watchlist</Text>
        <Text style={styles.subText}>Your watchlists will appear here.</Text>
      </View>
    );
  }

  // Show stocks in selected group
  if (selectedGroup) {
    return (
      <View style={[styles.center, { paddingTop: 16, paddingBottom: 16 }]}>
        <TouchableOpacity onPress={() => setSelectedGroup(null)}>
          <Text style={styles.backBtn}>{'< Back to Groups'}</Text>
        </TouchableOpacity>
        <Text style={styles.heading}>
          {groups[selectedGroup] && groups[selectedGroup].length === 0
            ? `No stocks in ${selectedGroup}`
            : selectedGroup}
        </Text>
        <FlatList
          data={groups[selectedGroup] || []}
          keyExtractor={(item) => item}
          renderItem={renderStock}
        />
      </View>
    );
  }

  // Show all groups
  return (
    <View style={{ flex: 1, backgroundColor: '#F7F7F7' }}>
      <View style={styles.center}>
        <Text style={styles.heading}>Watchlist Groups</Text>
        <FlatList
          data={Object.keys(groups)}
          keyExtractor={(item) => item}
          renderItem={renderGroup}
        />
      </View>
    </View>
  );
}

// Styles for the WatchlistScreen and its components
const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    flex: 1,
  },
  heading: {
    fontSize: 26,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 16,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: '#555555',
    textAlign: 'center',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 250,
    marginBottom: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    justifyContent: 'space-between',
  },
  groupBtn: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333333',
  },
  deleteBtn: {
    padding: 8,
  },
  stockBtn: {
    padding: 14,
    backgroundColor: '#E1F5FE',
    borderRadius: 10,
    marginBottom: 12,
    width: 220,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  stockName: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  backBtn: {
    color: '#007AFF',
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
