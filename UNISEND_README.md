# UniSend Real-Time Delivery System

This document provides instructions for deploying and using the real-time delivery system for UniSend, which allows customers to request deliveries and drivers to accept and fulfill them in real-time.

## Features

- **Customer Side**:
  - Request deliveries with pickup and dropoff locations
  - Select package size and delivery type
  - Track delivery status in real-time
  - Receive notifications when drivers accept or update deliveries

- **Driver Side**:
  - View available delivery requests in real-time
  - Accept or decline delivery requests
  - Update delivery status (accepted, in progress, completed)
  - Receive real-time notifications when new delivery requests are available

## Deployment Instructions

### 1. Database Setup

Deploy the required database changes by running:

```bash
# Set your Supabase service key
export SUPABASE_SERVICE_KEY=your_service_key_here

# Run deployment script
node deploy_unisend_database.js
```

The script will:
- Create the necessary tables and columns
- Add required indexes for performance
- Set up Row Level Security (RLS) policies
- Register functions for nearby order lookup
- Reload the schema cache

### 2. Application Deployment

Make sure all the front-end code is deployed by running your standard deployment process. The necessary files include:

- `src/services/driver/UniSendOrderRepository.ts`
- `src/services/driver/UniSendSubscriptionService.ts`
- `src/pages/driver/UniSend.tsx`
- `src/services/notification.ts`
- `src/components/driver/BottomNavigation.tsx` (updated)
- `src/pages/UniSend.tsx` (updated)

## Usage

### Customer Flow:

1. Navigate to the UniSend service from the home screen
2. Enter pickup and delivery addresses
3. Select package size and delivery type
4. Review pricing and confirm delivery request
5. Wait for a driver to accept the request
6. Track delivery progress in real-time

### Driver Flow:

1. Receive notification of a new delivery request
2. Navigate to the UniSend page to view delivery details
3. Accept or decline the delivery request
4. Update delivery status as you progress (started, completed)
5. Complete the delivery to finish the process

## Technical Details

### Real-Time Components

- **Supabase Realtime**: Used for real-time updates between customer and driver apps
- **Subscription Services**: Handle real-time data flow and notifications
- **Repository Services**: Manage data operations and persistence

### Database Schema

The system uses the following tables:
- `orders` - Extended to support delivery orders with UniSend-specific fields
- `driver_declined_orders` - Tracks which orders drivers have declined
- `notifications` - Stores user notifications

## Testing

To test the system:

1. Log in as a customer and create a delivery request
2. Log in as a driver in another browser/device
3. Verify the driver receives a notification and can see the request
4. Accept the request as the driver
5. Verify the customer receives a notification that the order was accepted
6. Update order status as the driver and verify the customer sees these updates

## Troubleshooting

If you encounter issues:

- Check the browser console for errors
- Verify Supabase connection and schema cache status
- Ensure the database migration ran successfully
- Verify you're using the correct Supabase project URL and API keys

For database-specific issues, run the migration script again to ensure all necessary tables and columns are created. 