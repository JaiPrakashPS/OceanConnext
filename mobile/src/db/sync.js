import api from '../api/axios';
import { ENDPOINTS } from '../constants/api';
import {
  getPendingCatches, markCatchSynced,
  markCatchFailed,
  getPendingSOS, markSOSSynced,
  markSOSFailed,
  getPendingComplaints, markComplaintSynced,
  markComplaintFailed,
  getPendingFishingZones, markFishingZoneSynced,
  markFishingZoneFailed,
} from './helpers';

/**
 * Sync all pending offline records to the backend.
 * Called when network reconnects or app comes to foreground.
 */
export const syncAllPending = async () => {
  const results = { catches: 0, sos: 0, complaints: 0, fishingZones: 0, errors: [] };

  try {
    // ── Sync catches ──
    const pendingCatches = getPendingCatches();
    if (pendingCatches.length > 0) {
      const mapped = pendingCatches.map((c) => ({
        localId: c.local_id.toString(),
        species: c.species,
        speciesTamil: c.species_tamil,
        quantity: c.quantity,
        weight: c.weight,
        weightUnit: c.weight_unit,
        earnings: c.earnings,
        location: c.catch_location_name || c.catch_lat != null || c.catch_lng != null
          ? { lat: c.catch_lat ?? null, lng: c.catch_lng ?? null, name: c.catch_location_name || null }
          : null,
        boatId: c.boat_id,
        notes: c.notes,
        catchDate: c.catch_date,
      }));

      const res = await api.post(ENDPOINTS.CATCHES_SYNC, { records: mapped });
      for (const r of res.data.data || []) {
        if (r.success) {
          markCatchSynced(parseInt(r.localId), r.serverId);
          results.catches++;
        } else {
          markCatchFailed(parseInt(r.localId), r.error);
        }
      }
    }

    // ── Sync SOS ──
    const pendingSOS = getPendingSOS();
    if (pendingSOS.length > 0) {
      const mapped = pendingSOS.map((s) => ({
        localId: s.local_id.toString(),
        messageId: s.message_id || `offline-sos-${s.local_id}`,
        location: { lat: s.lat, lng: s.lng, accuracy: s.accuracy },
        message: s.message,
        emergencyType: s.emergency_type,
        boatId: s.boat_id,
      }));

      const res = await api.post(ENDPOINTS.SOS_SYNC, { records: mapped });
      for (const r of res.data.data || []) {
        if (r.success) {
          markSOSSynced(parseInt(r.localId), r.serverId);
          results.sos++;
        } else {
          markSOSFailed(parseInt(r.localId), r.error);
        }
      }
    }

    // ── Sync complaints ──
    const pendingComplaints = getPendingComplaints();
    if (pendingComplaints.length > 0) {
      const mapped = pendingComplaints.map((c) => ({
        localId: c.local_id.toString(),
        category: c.category,
        title: c.title,
        description: c.description,
        location: c.lat ? { lat: c.lat, lng: c.lng } : null,
      }));

      const res = await api.post(ENDPOINTS.COMPLAINTS + '/sync', { records: mapped });
      for (const r of res.data.data || []) {
        if (r.success) {
          markComplaintSynced(parseInt(r.localId), r.serverId);
          results.complaints++;
        } else {
          markComplaintFailed(parseInt(r.localId), r.error);
        }
      }
    }

    // ── Sync fishing zones crowd recommendations ──
    const pendingZones = getPendingFishingZones();
    if (pendingZones.length > 0) {
      const mapped = pendingZones.map((z) => ({
        localId: z.local_id.toString(),
        species: z.species,
        abundance: z.abundance,
        location: { lat: z.lat, lng: z.lng },
        notes: z.notes,
      }));

      const res = await api.post('/fishing-zones/sync', { records: mapped });
      for (const r of res.data.data || []) {
        if (r.success) {
          markFishingZoneSynced(parseInt(r.localId), r.serverId);
          results.fishingZones++;
        } else {
          markFishingZoneFailed(parseInt(r.localId), r.error);
        }
      }
    }

  } catch (err) {
    results.errors.push(err.message);
    console.warn('⚠️ Sync error:', err.message);
  }

  const totalSynced = results.catches + results.sos + results.complaints + results.fishingZones;
  if (totalSynced > 0) {
    console.log(`✅ Synced: ${results.catches} catches, ${results.sos} SOS, ${results.complaints} complaints, ${results.fishingZones} fishing recommendations`);
  }

  return results;
};
