import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api/axios';
import { ENDPOINTS } from '../../constants/api';
import { COLORS } from '../../constants/colors';
import { useNetwork } from '../../store/NetworkContext';
import { getAllCatches, getCachedFishingZones, getPendingSOS } from '../../db/helpers';

const point = (location) => {
  if (location?.lat != null && location?.lng != null) return { latitude: Number(location.lat), longitude: Number(location.lng) };
  if (Array.isArray(location?.coordinates) && location.coordinates.length >= 2) return { latitude: Number(location.coordinates[1]), longitude: Number(location.coordinates[0]) };
  return null;
};

export default function MapViewScreen() {
  const { isConnected } = useNetwork();
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const records = [
        ...getPendingSOS().map((item) => ({ item, type: 'Emergency alert', location: { lat: item.lat, lng: item.lng } })),
        ...getAllCatches(100).map((item) => ({ item, type: 'Fish observation', location: { lat: item.catch_lat, lng: item.catch_lng } })),
        ...getCachedFishingZones().map((item) => ({ item, type: 'Potential fishing zone', location: { lat: item.lat, lng: item.lng } })),
      ];
      setMarkers(records.map((record, index) => ({ ...record, coordinate: point(record.location), key: `${record.type}-${record.item._id || index}` })).filter((record) => record.coordinate));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load map data.');
    } finally { setLoading(false); }
  }, [isConnected]);

  useEffect(() => { load(); }, [load]);
  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (error) return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>;
  return (
    <SafeAreaView style={styles.container}>
      <MapView style={styles.map} initialRegion={{ latitude: 13.0827, longitude: 80.2707, latitudeDelta: 4, longitudeDelta: 4 }}>
        {markers.map((marker) => <Marker key={marker.key} coordinate={marker.coordinate} title={marker.type} description={marker.item.message || marker.item.species || marker.item.name || 'Location record'} />)}
      </MapView>
      <View style={styles.legend}><Text style={styles.legendText}>{markers.length} location records</Text><Text style={styles.disclaimer}>Only coordinates provided by the backend are shown.</Text></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background, padding: 24 },
  error: { color: COLORS.textMuted, textAlign: 'center' },
  legend: { position: 'absolute', bottom: 12, left: 12, right: 12, backgroundColor: COLORS.surface, borderRadius: 10, padding: 12 },
  legendText: { color: COLORS.textPrimary, fontWeight: '700' },
  disclaimer: { color: COLORS.textMuted, fontSize: 11, marginTop: 3 },
});
