# Freelancer Services Management

This feature allows freelancers to manage their service offerings on the UniNeeds platform. Freelancers can create, edit, delete, and view their services.

## Features

- Create new services with title, category, description, price, delivery time, location, WhatsApp contact
- Upload portfolio files for each service
- View, edit, and delete existing services
- Responsive UI for desktop and mobile devices

## Setup Instructions

### 1. Database Setup

Run the `services_table.sql` script in the Supabase SQL Editor to create the necessary database table and security policies:

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of the `services_table.sql` file
4. Run the SQL queries

This will:
- Create the `services` table
- Set up Row Level Security (RLS) policies
- Create a storage bucket for service portfolio files
- Set up appropriate storage access policies

### 2. Frontend Routes

The feature is accessible at `/freelancer/services`. The route is already configured in the application.

## Usage

### For Freelancers

1. **Navigate to Services**: Go to `/freelancer/services` or click on "Manage Services" in the account dropdown menu
2. **Add New Service**: Click the "Offer New Service" button to create a new service
3. **Fill Service Form**:
   - Title: Name of your service
   - Category: Select from predefined categories
   - Description: Detailed explanation of your service
   - Price: Amount in IDR
   - Delivery Time: Expected completion time
   - Location: Optional location information
   - WhatsApp Contact: Your WhatsApp number for client contact
   - Portfolio: Optional file upload to showcase your work
4. **Edit Service**: Click the edit icon on an existing service to modify it
5. **Delete Service**: Click the delete icon to remove a service

### For Customers (Future Development)

In future updates, customers will be able to:
- Browse freelancer services
- Filter services by category, price, etc.
- Contact freelancers directly about their services
- Leave reviews and ratings for services

## Implementation Notes

- The service portfolio files are stored in a separate Supabase storage bucket
- The file paths are structured as `public/{user_id}/{timestamp}_{filename}` for organization
- Row Level Security ensures users can only manage their own services

## Troubleshooting

- If you encounter issues with file uploads, check your Supabase storage bucket permissions
- For database-related issues, verify the RLS policies in the Supabase dashboard
- For API errors, check the browser console for specific error messages 