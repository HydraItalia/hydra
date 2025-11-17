# Phase 7.2 - Optimized Route Planning Implementation Notes

## Overview

Phase 7.2 implements optimized route planning for drivers using Google Directions API. Drivers can view all their active deliveries for the day in an optimized stop order, with estimated times and distances.

## What Was Implemented

### 1. Database Schema Updates

**File:** `prisma/schema.prisma`

Added the following fields:

#### Order Model
- `deliveryLat` (Float?) - Delivery destination latitude
- `deliveryLng` (Float?) - Delivery destination longitude
- `deliveryAddress` (String?) - Full delivery address text

#### Delivery Model
- `routeSequence` (Int?) - Optimized position in driver's route (1, 2, 3, ...)
- New index: `[driverId, routeSequence]` for efficient route ordering

**Migration Required:**
```bash
npm run db:migrate
# Or for development:
npx prisma db push
```

### 2. Type Definitions

**File:** `src/types/route.ts`

Core types:
- `RouteStop` - Single delivery stop with coordinates, client info, ETA, and distance
- `DriverRoute` - Complete optimized route with stops, totals, and polyline
- `DirectionsRequest/Response` - Google Directions API types

### 3. Google Directions API Integration

**File:** `src/lib/google-directions.ts`

Functions:
- `getOptimizedRoute(request)` - Fetches optimized route from Google API
- `buildDirectionsRequest(origin, destinations, optimize)` - Builds API request

Features:
- Uses `optimize:true` waypoints parameter for optimal stop ordering
- 5-minute response caching to reduce API costs
- Comprehensive error handling

### 4. Route Calculation Logic

**File:** `src/lib/route-calculator.ts`

Functions:
- `getOptimizedDriverRoute(driverId, date?)` - Main route calculation
  - Fetches active deliveries (ASSIGNED, PICKED_UP, IN_TRANSIT)
  - Filters deliveries with valid coordinates
  - Calls Google Directions API
  - Maps waypoint order back to deliveries
  - Returns RouteStop array with leg info

- `saveRouteSequence(driverId, route)` - Persists route sequence to DB

Default origin: `39.2238, 9.1217` (Cagliari, Sardinia) - configurable

### 5. Server Actions

**File:** `src/actions/route.ts`

Three server actions with full auth checking:

- `getMyRoute()` - Current driver's optimized route
- `recalculateDriverRoute()` - Recalculates and saves route sequence
- `getDriverRoute(driverId)` - Admin/Agent can view any driver's route

All actions:
- Verify authentication and role (DRIVER only, or ADMIN/AGENT for getDriverRoute)
- Return typed `{ success, route }` or `{ success: false, error }` responses

### 6. UI Components

**Directory:** `src/components/route/`

Components:
- `route-summary.tsx` - Three-card summary (stops, distance, duration)
- `route-stop-list.tsx` - Ordered list of stops with:
  - Numbered badges (1, 2, 3, ...)
  - Client name and address
  - Status badges
  - ETA and leg distance
  - "View Details" link to delivery page
  - "Open in Maps" link (Google Maps deep link)

- `route-map-placeholder.tsx` - Placeholder for future map rendering
  - Shows debug JSON for development
  - Structured for easy map library integration

- `recalculate-route-button.tsx` - Client component for recalculation
  - Loading state with spinner
  - Toast notifications via sonner
  - Triggers router.refresh() on success

### 7. Route Page

**File:** `src/app/dashboard/route/page.tsx`

Server component that:
- Verifies DRIVER role
- Fetches optimized route
- Renders two-column layout:
  - Left: Route summary + stop list
  - Right: Sticky map placeholder
- Shows empty state for no deliveries
- Error handling with user-friendly messages

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
GOOGLE_MAPS_API_KEY="your_api_key_here"
```

### Getting a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable **Directions API**
4. Create credentials → API Key
5. (Optional) Restrict API key:
   - Application restrictions: HTTP referrers (for production)
   - API restrictions: Directions API only
6. Copy API key to `.env.local`

**Cost Note:** Google Directions API offers $200 free credit/month. Standard pricing is ~$5 per 1000 requests.

### Default Origin Configuration

The default driver origin is currently hardcoded in `src/lib/route-calculator.ts`:

```typescript
const DEFAULT_ORIGIN_LAT = 39.2238; // Cagliari, Sardinia
const DEFAULT_ORIGIN_LNG = 9.1217;
```

**Future Enhancement:** Make this configurable per-driver via the Driver model or user settings.

## Usage

### For Drivers

1. Navigate to `/dashboard/route`
2. View optimized stop order for today's active deliveries
3. Click "Recalculate Route" to refresh optimization
4. Click "Open in Maps" on any stop to navigate
5. Click "View Details" to see full delivery information

### For Admins/Agents

Use `getDriverRoute(driverId)` server action to view routes for any driver (e.g., for monitoring or dispatching).

## Edge Cases Handled

1. **No active deliveries** - Shows friendly empty state
2. **Missing coordinates** - Deliveries without lat/lng are excluded from optimization but still listed
3. **API failure** - Falls back to unoptimized list, shows error without crashing
4. **No API key** - Clear error message prompting configuration
5. **Single delivery** - Google API optimized for single destination (no waypoints)

## Future Enhancements

### Phase 7.3 - Live Tracking (Suggested)

To extend this for live GPS tracking:

1. **Add GPS fields to Driver model:**
   ```prisma
   model Driver {
     // ...
     lastKnownLat Float?
     lastKnownLng Float?
     lastLocationUpdate DateTime?
   }
   ```

2. **Create location update API:**
   ```typescript
   // src/app/api/driver/location/route.ts
   export async function POST(request: Request) {
     // Verify driver auth
     // Update lastKnownLat, lastKnownLng, lastLocationUpdate
   }
   ```

3. **Update route calculator to use driver's actual location:**
   ```typescript
   const driver = await prisma.driver.findUnique({ where: { id: driverId } });
   const origin = driver.lastKnownLat && driver.lastKnownLng
     ? { lat: driver.lastKnownLat, lng: driver.lastKnownLng }
     : { lat: DEFAULT_ORIGIN_LAT, lng: DEFAULT_ORIGIN_LNG };
   ```

4. **Add client-side location tracking:**
   - Use `navigator.geolocation.watchPosition()` in a client component
   - POST updates to `/api/driver/location` every 30-60 seconds
   - Show driver's current location on map

### Map Rendering

To replace the map placeholder:

**Option A: Google Maps (Recommended if already using Directions API)**

1. Install: `npm install @react-google-maps/api`
2. Enable Maps JavaScript API in Google Cloud Console
3. Create `src/components/route/route-map.tsx`:

```tsx
import { GoogleMap, Marker, Polyline, useLoadScript } from '@react-google-maps/api';
import { RouteStop } from '@/types/route';
import { decode } from '@mapbox/polyline'; // npm install @mapbox/polyline

export function RouteMap({ stops, polyline }: { stops: RouteStop[]; polyline?: string }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  if (!isLoaded) return <div>Loading map...</div>;

  const decodedPath = polyline ? decode(polyline).map(([lat, lng]) => ({ lat, lng })) : [];

  return (
    <GoogleMap
      zoom={10}
      center={stops[0] ? { lat: stops[0].lat, lng: stops[0].lng } : { lat: 39.2238, lng: 9.1217 }}
      mapContainerStyle={{ width: '100%', height: '500px' }}
    >
      {/* Markers for each stop */}
      {stops.map((stop, index) => (
        <Marker
          key={stop.deliveryId}
          position={{ lat: stop.lat, lng: stop.lng }}
          label={`${index + 1}`}
        />
      ))}

      {/* Polyline for route */}
      {decodedPath.length > 0 && (
        <Polyline
          path={decodedPath}
          options={{ strokeColor: '#4F46E5', strokeWeight: 4 }}
        />
      )}
    </GoogleMap>
  );
}
```

4. Update `.env.example` and `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_api_key_here"
```

5. Replace `RouteMapPlaceholder` with `RouteMap` in `page.tsx`

**Option B: Mapbox or Leaflet** - Free alternatives with similar APIs

### Additional Features

- **Route optimization by time windows** - Some customers may require delivery before/after certain hours
- **Driver capacity constraints** - Limit stops based on vehicle capacity
- **Real-time traffic** - Use Google's traffic data for more accurate ETAs
- **Multi-day route planning** - Optimize routes across multiple days
- **Delivery proof capture** - Photo upload and signature on delivery
- **Push notifications** - Alert drivers when route changes

## Testing

### Manual Testing Steps

1. **Create test data:**
   - Create a driver user
   - Create orders with `deliveryLat`, `deliveryLng`, `deliveryAddress`
   - Create deliveries assigned to the driver with status ASSIGNED/PICKED_UP/IN_TRANSIT

2. **Test scenarios:**
   - Empty route (no deliveries)
   - Single delivery
   - Multiple deliveries (2-5)
   - Missing coordinates (some deliveries without lat/lng)
   - API error (invalid API key)
   - Recalculate button

### Automated Testing

Consider adding tests for:
- `buildDirectionsRequest()` - Unit test request building
- `getOptimizedDriverRoute()` - Integration test with mocked Google API
- Route page rendering - Component test with mock data
- Server actions - Test auth and permissions

## Known Limitations

1. **No real-time traffic** - Route is calculated once, doesn't update for traffic changes
2. **Fixed origin** - All routes start from the same default location
3. **No time windows** - Doesn't consider customer availability or delivery time preferences
4. **No capacity constraints** - Doesn't limit route based on vehicle capacity
5. **Map is placeholder** - Requires additional setup for visual map rendering

## Migration Path

To apply database changes:

```bash
# Development
npm run db:push

# Production
npm run db:migrate
```

Migration will add nullable fields, so existing data is not affected. You'll need to populate `deliveryLat`, `deliveryLng`, and `deliveryAddress` for orders going forward.

## Files Created/Modified

### Created
- `src/types/route.ts`
- `src/lib/google-directions.ts`
- `src/lib/route-calculator.ts`
- `src/actions/route.ts`
- `src/components/route/route-summary.tsx`
- `src/components/route/route-stop-list.tsx`
- `src/components/route/route-map-placeholder.tsx`
- `src/components/route/recalculate-route-button.tsx`
- `src/app/dashboard/route/page.tsx`
- `docs/PHASE_7.2_IMPLEMENTATION_NOTES.md`

### Modified
- `prisma/schema.prisma` - Added route planning fields
- `.env.example` - Added GOOGLE_MAPS_API_KEY

## Support

For questions or issues:
1. Check Google Cloud Console for API quota/errors
2. Review browser console for client-side errors
3. Check server logs for route calculation failures
4. Verify environment variables are set correctly

---

**Implementation Status:** ✅ Complete
**Next Phase:** 7.3 - Live GPS Tracking (Optional)
