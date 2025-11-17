# Phase 7.1 — Driver Role Implementation

## Overview

This document outlines the complete implementation of the Driver role in the Hydra platform. The Driver role enables delivery drivers to view their assigned orders, update delivery status, and manage their delivery workflow.

## Implementation Summary

### ✅ Completed Features

1. **Database Schema**
   - Added `DRIVER` role to the `Role` enum
   - Created `Driver` model with status tracking (ONLINE/OFFLINE/BUSY)
   - Created `Delivery` model with delivery status workflow
   - Added delivery status transitions: `ASSIGNED → PICKED_UP → IN_TRANSIT → DELIVERED → EXCEPTION`
   - Linked `User` model to `Driver` via `driverId` foreign key

2. **Authentication & Authorization**
   - Extended NextAuth session/JWT types to include `driverId`
   - Updated auth callbacks to populate driver information in session
   - Added `canManageDelivery()` helper function for RBAC
   - Drivers can only access their own deliveries

3. **API Layer (Server Actions)**
   - `getMyDeliveries()` - Fetch deliveries assigned to current driver
   - `getDeliveryById()` - Get single delivery with order details
   - `markAsPickedUp()` - Update status to PICKED_UP
   - `markAsInTransit()` - Update status to IN_TRANSIT
   - `markAsDelivered()` - Update status to DELIVERED (with optional notes)
   - `markAsException()` - Report delivery exception (with required reason)
   - `getDeliveryStats()` - Get driver statistics dashboard

4. **Frontend UI**
   - Driver dashboard home page (`/dashboard`)
   - Deliveries list page (`/dashboard/deliveries`)
   - Delivery detail page (`/dashboard/deliveries/[deliveryId]`)
   - UI Components:
     - `DeliveryList` - List of deliveries with filtering
     - `DeliveryStats` - Statistics cards
     - `DeliveryDetail` - Full delivery view with status update buttons
   - Navigation updated for DRIVER role

5. **Demo Data**
   - 2 driver users (Marco Rossi, Giulia Bianchi)
   - 3 demo deliveries in various states (ASSIGNED, PICKED_UP, IN_TRANSIT)
   - Test credentials provided in seed output

---

## Architecture

### Database Models

#### Driver
```prisma
model Driver {
  id     String       @id @default(cuid())
  name   String
  phone  String?
  status DriverStatus @default(OFFLINE)  // ONLINE, OFFLINE, BUSY

  user       User?      @relation
  deliveries Delivery[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
}
```

#### Delivery
```prisma
model Delivery {
  id               String         @id @default(cuid())
  orderId          String         @unique
  driverId         String
  status           DeliveryStatus @default(ASSIGNED)
  notes            String?
  exceptionReason  String?

  // Status transition timestamps
  assignedAt   DateTime  @default(now())
  pickedUpAt   DateTime?
  inTransitAt  DateTime?
  deliveredAt  DateTime?
  exceptionAt  DateTime?

  order  Order  @relation(fields: [orderId], references: [id], onDelete: Cascade)
  driver Driver @relation(fields: [driverId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Enums
```prisma
enum DeliveryStatus {
  ASSIGNED      // Order assigned to driver
  PICKED_UP     // Driver picked up from vendor/warehouse
  IN_TRANSIT    // On the way to customer
  DELIVERED     // Successfully delivered
  EXCEPTION     // Issue occurred
}

enum DriverStatus {
  ONLINE   // Available for deliveries
  OFFLINE  // Not available
  BUSY     // Currently on a delivery
}
```

---

## File Structure

### Backend
```
prisma/
├── schema.prisma                           # Updated with Driver, Delivery models
├── migrations/
│   └── 20251117165409_add_driver_role_and_delivery/
│       └── migration.sql                   # Migration for driver feature
└── seed.ts                                 # Updated with driver demo data

src/
├── lib/
│   ├── auth.ts                             # Added canManageDelivery() + DRIVER to type
│   └── nav.ts                              # Added DRIVER navigation items
├── data/
│   └── deliveries.ts                       # Server actions for driver workflows
└── types/
    └── next-auth.d.ts                      # Extended with driverId
```

### Frontend
```
src/
├── app/
│   └── dashboard/
│       ├── page.tsx                        # Added DriverDashboard component
│       └── deliveries/
│           ├── page.tsx                    # Deliveries list page
│           └── [deliveryId]/
│               └── page.tsx                # Delivery detail page
└── components/
    └── deliveries/
        ├── delivery-list.tsx               # List component with pagination
        ├── delivery-stats.tsx              # Statistics cards
        └── delivery-detail.tsx             # Detail view with status updates
```

---

## API Reference (Server Actions)

### `getMyDeliveries(params?)`
Fetch deliveries assigned to the current driver.

**Parameters:**
- `page?: number` - Page number (default: 1)
- `pageSize?: number` - Items per page (default: 20)
- `status?: DeliveryStatus` - Filter by status

**Returns:**
```typescript
{
  data: Delivery[],
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
}
```

**Authorization:** DRIVER role required, returns only driver's own deliveries

---

### `getDeliveryById(deliveryId: string)`
Get detailed information about a specific delivery.

**Returns:** Full delivery object with order, client, items, and vendor details

**Authorization:** DRIVER role required, must own the delivery

---

### `markAsPickedUp(deliveryId: string)`
Update delivery status to PICKED_UP.

**Pre-condition:** Status must be ASSIGNED

**Side effects:**
- Sets `pickedUpAt` timestamp
- Updates status to PICKED_UP

**Authorization:** DRIVER role required, must own the delivery

---

### `markAsInTransit(deliveryId: string)`
Update delivery status to IN_TRANSIT.

**Pre-condition:** Status must be PICKED_UP

**Side effects:**
- Sets `inTransitAt` timestamp
- Updates status to IN_TRANSIT

**Authorization:** DRIVER role required, must own the delivery

---

### `markAsDelivered(deliveryId: string, notes?: string)`
Update delivery status to DELIVERED and mark order as complete.

**Parameters:**
- `deliveryId: string` - Delivery ID
- `notes?: string` - Optional delivery notes

**Pre-condition:** Status must be IN_TRANSIT

**Side effects:**
- Sets `deliveredAt` timestamp
- Updates Delivery status to DELIVERED
- Updates Order status to DELIVERED
- Saves optional notes

**Authorization:** DRIVER role required, must own the delivery

---

### `markAsException(deliveryId: string, exceptionReason: string)`
Report a delivery exception (e.g., customer unavailable, wrong address).

**Parameters:**
- `deliveryId: string` - Delivery ID
- `exceptionReason: string` - **Required** description of the issue

**Pre-condition:** Status must NOT be DELIVERED

**Side effects:**
- Sets `exceptionAt` timestamp
- Updates status to EXCEPTION
- Saves exception reason

**Authorization:** DRIVER role required, must own the delivery

---

### `getDeliveryStats()`
Get statistics for the current driver.

**Returns:**
```typescript
{
  assigned: number,        // Deliveries awaiting pickup
  pickedUp: number,        // Picked up but not in transit
  inTransit: number,       // Currently delivering
  delivered: number,       // Total delivered (all time)
  exception: number,       // Total exceptions
  totalToday: number,      // Deliveries assigned today
  activeDeliveries: number // assigned + pickedUp + inTransit
}
```

**Authorization:** DRIVER role required

---

## User Flows

### Driver Login & Dashboard
1. Driver logs in with email (magic link authentication)
2. Redirected to `/dashboard` (driver-specific dashboard)
3. Dashboard shows:
   - Statistics cards (active deliveries, delivered today, etc.)
   - Next deliveries in priority order
   - Quick action buttons

### Delivery Workflow
1. **View Deliveries**
   - Navigate to `/dashboard/deliveries`
   - See list of assigned deliveries with status badges
   - Filter by status (optional)

2. **Start Delivery**
   - Click on delivery to view details
   - Review order items, client info, delivery address
   - Click "Mark as Picked Up" when ready

3. **Mark In Transit**
   - After picking up order, click "Mark as In Transit"
   - Status updates automatically

4. **Complete Delivery**
   - Upon arrival, optionally add delivery notes
   - Click "Mark as Delivered"
   - Both Delivery and Order status update to DELIVERED

5. **Report Exception**
   - If issue occurs, click "Report Exception"
   - Enter required reason (e.g., "Customer not available", "Wrong address")
   - Delivery marked as EXCEPTION for admin follow-up

---

## Testing

### Test Accounts (from seed)
```
Email: driver.marco@hydra.local
Role: DRIVER
Password: Use magic link (check terminal output)
Deliveries: 2 (1 assigned, 1 picked up)

Email: driver.giulia@hydra.local
Role: DRIVER
Password: Use magic link (check terminal output)
Deliveries: 1 (in transit)
```

### Manual Testing Checklist

#### Authentication
- [ ] Driver can log in via magic link
- [ ] Session includes `driverId`
- [ ] Cannot access admin/client/vendor routes
- [ ] Cannot access other drivers' deliveries

#### Dashboard
- [ ] Statistics display correctly
- [ ] Next deliveries shown in order
- [ ] Quick action buttons link correctly

#### Deliveries List
- [ ] Shows only driver's own deliveries
- [ ] Status badges display correctly
- [ ] Pagination works (if >20 deliveries)
- [ ] Filter by status works

#### Delivery Detail
- [ ] Order details display correctly
- [ ] Client information shown
- [ ] Order items list complete
- [ ] Timeline shows status transitions
- [ ] Status update buttons appear based on current status

#### Status Updates
- [ ] Can mark ASSIGNED → PICKED_UP
- [ ] Can mark PICKED_UP → IN_TRANSIT
- [ ] Can mark IN_TRANSIT → DELIVERED
- [ ] Can mark any (except DELIVERED) → EXCEPTION
- [ ] Timestamps update correctly
- [ ] Order status updates when delivered
- [ ] Exception requires reason
- [ ] Cannot skip workflow steps

---

## Future Enhancements (Out of Scope for Phase 7.1)

### Phase 7.2 - Admin Assignment UI
- Admin/Agent interface to assign deliveries to drivers
- Auto-assignment based on region, driver availability
- Batch assignment for multiple orders

### Phase 7.3 - Advanced Driver Features
- GPS tracking and live location
- Route optimization
- Photo/signature capture on delivery
- Push notifications for new assignments
- Driver performance metrics

### Phase 7.4 - Customer Features
- Real-time delivery tracking for clients
- Estimated arrival time
- Driver contact (call/message)
- Delivery feedback/ratings

---

## Database Migration

The database migration has been applied. To re-run from scratch:

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually apply migration
npx prisma migrate deploy

# Regenerate Prisma client
npx prisma generate

# Seed with driver demo data
npx prisma db seed
```

---

## Security Considerations

### Authorization
- All driver server actions validate `role === 'DRIVER'`
- Drivers can only access deliveries where `driverId === user.driverId`
- Admin/Agent can access all deliveries via `canManageDelivery()` helper

### Input Validation
- Exception reason is required and validated
- Delivery notes are optional but sanitized
- Status transitions enforce workflow rules

### Data Access
- Drivers never see other drivers' deliveries
- Drivers see full order details but cannot modify order data
- Delivery updates revalidate cached pages

---

## Known Limitations

1. **No Manual Assignment UI**: Deliveries must be assigned via seed/script or future admin UI
2. **No GPS/Routing**: Drivers must manually navigate to customer
3. **No Notifications**: Drivers must refresh to see new assignments
4. **No Photo/Signature**: Delivery confirmation is status-based only
5. **TypeScript Errors in IDE**: Some Prisma client errors may persist in IDE until TypeScript server restart (run-time is correct)

---

## Troubleshooting

### TypeScript Errors for `prisma.delivery`
If you see errors like "Property 'delivery' does not exist on type 'PrismaClient'":

1. Regenerate Prisma client:
   ```bash
   npx prisma generate
   ```

2. Restart TypeScript server in VS Code:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "TypeScript: Restart TS Server"
   - Select the command

3. If errors persist, restart your IDE

### Seed Fails
If `npx prisma db seed` fails:

1. Check `.env` file has correct `DATABASE_URL`
2. Ensure migration is applied: `npx prisma migrate deploy`
3. Check for constraint errors in output
4. Reset database if needed: `npx prisma migrate reset` (WARNING: deletes data)

### Driver Can't Login
1. Check user exists in database: `npx prisma studio`
2. Ensure `role` is set to `DRIVER`
3. Ensure `driverId` is linked to a Driver record
4. Check magic link in terminal output
5. Verify NextAuth callbacks include `driverId`

### Deliveries Not Showing
1. Verify user has `driverId` in session (check browser DevTools → Application → Cookies)
2. Ensure deliveries exist for that driver: `npx prisma studio`
3. Check browser console for errors
4. Verify server action is called (check Network tab)

---

## Contributors

Implementation completed for **Phase 7.1 - Driver Role Implementation**.

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Main Project README](./README.md)

---

**Last Updated:** November 17, 2024
**Implementation Status:** ✅ Complete
