import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { ENDPOINTS } from '../../constants/api';
import { COLORS, RADIUS, SPACING } from '../../constants/colors';
import { getLocalFishingZones } from '../../db/helpers';
import { useNetwork } from '../../store/NetworkContext';

const locationText = (location) => location?.lat != null && location?.lng != null
  ? `${Number(location.lat).toFixed(5)}, ${Number(location.lng).toFixed(5)}`
  : 'Location unavailable';

export default function FishingZonesScreen({ navigation }) {
  const { isConnected } = useNetwork();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (!refresh) setLoading(true);
    setError('');
    try {
      setZones(getLocalFishingZones());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isConnected]);

  useEffect(() => { load(); }, [load]);

  const openLocation = (location) => {
    if (location?.lat == null || location?.lng == null) return;
    Linking.openURL(`https://maps.google.com/?q=${location.lat},${location.lng}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} /></TouchableOpacity>
        <Text style={styles.title}>Potential Fishing Zones</Text>
        <View style={{ width: 24 }} />
      </View>
      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} /> : error ? (
        <View style={styles.empty}><Ionicons name="cloud-offline-outline" size={42} color={COLORS.textMuted} /><Text style={styles.emptyText}>{error}</Text><TouchableOpacity onPress={() => load()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View>
      ) : (
        <FlatList
          data={zones}
          keyExtractor={(item) => item._id || item.server_id || String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} />}
          ListEmptyComponent={<View style={styles.empty}><Ionicons name="locate-outline" size={42} color={COLORS.textMuted} /><Text style={styles.emptyText}>No potential fishing zones are available.</Text></View>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => openLocation(item.location)}>
              <View style={styles.cardHeader}><Text style={styles.zoneName}>{item.name || item.identifier || `Zone ${item._id?.slice(-6)}`}</Text><Ionicons name="map-outline" size={20} color={COLORS.primary} /></View>
              <Text style={styles.meta}>Species: {item.species || 'Not recorded'}</Text>
              <Text style={styles.meta}>Location: {locationText(item.location)}</Text>
              <Text style={styles.note}>Data-derived potential zone; not a guaranteed fishing location.</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  loader: { marginTop: 80 },
  list: { padding: SPACING.md, gap: 10 },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  zoneName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  meta: { color: COLORS.textSecondary, fontSize: 13, marginTop: 4 },
  note: { color: COLORS.textMuted, fontSize: 11, marginTop: 10 },
  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center' },
  retry: { color: COLORS.primary, fontWeight: '700' },
});
