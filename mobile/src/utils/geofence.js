// Math helpers
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;

export const getDistance = (from, to) => {
  const R = 6371; // km
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(to.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Clearly labelled sample data. Replace only with verified authority data.
export const MARITIME_BOUNDARY_IS_SAMPLE = true;
export const MARITIME_BOUNDARY = [
  { latitude: 8.0, longitude: 77.0 },
  { latitude: 8.5, longitude: 78.0 },
  { latitude: 9.0, longitude: 79.0 },
  { latitude: 10.0, longitude: 79.8 },
  { latitude: 11.0, longitude: 80.5 },
  { latitude: 12.0, longitude: 80.8 },
  { latitude: 13.0, longitude: 81.0 },
];

export const checkGeofenceStatus = (userLocation) => {
  if (!userLocation) return 'SAFE';

  let minDistance = Infinity;
  let nearestPoint = null;

  for (let i = 0; i < MARITIME_BOUNDARY.length - 1; i++) {
    const p1 = MARITIME_BOUNDARY[i];
    const p2 = MARITIME_BOUNDARY[i + 1];

    // For a simple point-to-line segment distance, we'll just check distance to points for this prototype
    // or discretize the line. To keep it simple, we just check distance to the polyline points.
    // A more accurate way is to check the closest point on the segment.
    
    // Discretize segment into 10 points
    for (let j = 0; j <= 10; j++) {
      const lat = p1.latitude + (p2.latitude - p1.latitude) * (j / 10);
      const lng = p1.longitude + (p2.longitude - p1.longitude) * (j / 10);
      const dist = getDistance(userLocation, { latitude: lat, longitude: lng });
      if (dist < minDistance) {
        minDistance = dist;
        nearestPoint = { latitude: lat, longitude: lng };
      }
    }
  }

  // Determine which side of the boundary we are on. 
  // For the Eastern coast of India, the ocean and Sri Lanka is to the East (higher longitude).
  // So if user's longitude is significantly greater than the boundary longitude at that latitude, they are outside.
  // Actually, let's just use the nearest point on the boundary. If user's longitude > nearestPoint.longitude, they are outside.
  
  const isOutside = userLocation.longitude > nearestPoint.longitude;

  if (isOutside) {
    return { status: 'OUTSIDE_RESTRICTED', distance: minDistance };
  } else if (minDistance <= 5) { // within 5 km
    return { status: 'NEAR_BOUNDARY', distance: minDistance };
  } else {
    return { status: 'SAFE', distance: minDistance };
  }
};
