# 🚗 Parko - Smart Parking Management System

A modern, full-stack parking management solution built with Next.js, React, TypeScript, and Supabase. Parko connects drivers looking for parking with owners/managers of parking spaces, featuring real-time availability tracking, secure authentication, document verification, and payment processing.

![Parko Logo](client/public/logo.png)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication & Security](#authentication--security)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### For Drivers
- **Secure Registration & Login** – Bcrypt password hashing, JWT session tokens
- **Document Verification** – Upload driver's license, vehicle plate, and PAN card
- **Real-Time Map View** – See nearby parking spaces with live availability
- **Smart Search** – Find parking by location, price, or distance (within 200m)
- **Easy Booking** – Reserve slots for 2 hours (default) with estimated pricing
- **OTP-Based Entry/Exit** – Secure 6-digit OTPs for verification
- **QR Code Support** – Scannable QR codes for quick entry/exit
- **Usage-Based Billing** – Pay only for actual time used
- **Booking History** – Track past and active reservations

### For Owners
- **Business Account** – Manage multiple parking locations
- **Space Management** – Add/edit parking spaces with GPS coordinates
- **Slot Configuration** – Define slot types (compact, standard, large, handicap, electric) and rates
- **Multi-Manager Support** – Invite and manage staff with role-based access
- **Revenue Analytics** – Daily/weekly/monthly earnings dashboard
- **Real-Time Monitoring** – See current occupancy and availability
- **Invite System** – Send invite tokens to managers via email

### Technical Highlights
- **Real-Time Updates** – SSE (Server-Sent Events) for live slot availability
- **Geolocation Integration** – HTML5 Geolocation API + Leaflet maps
- **Responsive Design** – Mobile-first UI with Tailwind CSS
- **Type-Safe** – Full TypeScript coverage
- **Secure Sessions** – HttpOnly cookies, CSRF protection
- **Database Triggers** – Auto-calculate profile completion, billing, analytics
- **5NF Schema** – Normalized database design for data integrity

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI Library:** [React 19](https://react.dev/)
- **Language:** [TypeScript 5](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Components:** [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Maps:** [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/)
- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend
- **Runtime:** Node.js 18+
- **API Routes:** Next.js API routes (serverless functions)
- **Database:** [Supabase](https://supabase.com/) (PostgreSQL 14+)
- **Storage:** Supabase Storage (driver documents)
- **Authentication:** Custom JWT + HttpOnly cookies
- **Password Hashing:** [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Session Management:** [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)

### DevOps & Tooling
- **Package Manager:** npm / pnpm
- **Linting:** ESLint
- **Type Checking:** TypeScript
- **Version Control:** Git
- **Deployment:** Vercel (recommended)

---

## 📁 Project Structure

```
ParkO/
├── README.md                       # This file
└── client/                         # Next.js application
    ├── app/                        # App router pages & API routes
    │   ├── api/                    # Backend API endpoints
    │   │   ├── auth/               # Authentication routes
    │   │   │   ├── register/       # POST /api/auth/register
    │   │   │   ├── login/          # POST /api/auth/login
    │   │   │   ├── logout/         # POST /api/auth/logout
    │   │   │   └── session/        # GET /api/auth/session
    │   │   ├── users/              # User management
    │   │   ├── parking/            # Parking spaces CRUD
    │   │   ├── slots/              # Slot management
    │   │   ├── bookings/           # Booking operations
    │   │   ├── payments/           # Payment processing
    │   │   ├── analytics/          # Analytics data
    │   │   └── search/             # Search endpoint
    │   ├── driver/                 # Driver pages
    │   │   ├── signup/
    │   │   ├── login/
    │   │   ├── verification/
    │   │   ├── dashboard/
    │   │   ├── map/
    │   │   ├── booking/
    │   │   ├── payment/
    │   │   ├── profile/
    │   │   └── wallet/
    │   ├── owner/                  # Owner pages
    │   │   ├── signup/
    │   │   ├── login/
    │   │   ├── dashboard/
    │   │   ├── map/
    │   │   ├── add-space/
    │   │   ├── space/[id]/
    │   │   ├── profile/
    │   │   └── referral/
    │   ├── layout.tsx              # Root layout (header/footer)
    │   ├── page.tsx                # Homepage
    │   └── globals.css             # Global styles
    ├── components/                 # Reusable components
    │   ├── header-auth.tsx         # Auth widget for header
    │   ├── map-client.tsx          # Leaflet map component
    │   ├── theme-provider.tsx
    │   └── ui/                     # shadcn/ui components
    ├── lib/                        # Utility libraries
    │   ├── auth.ts                 # Auth helpers (bcrypt, JWT, validation)
    │   ├── session.ts              # Session management (cookies)
    │   ├── supabaseServer.ts       # Supabase server client
    │   ├── supabaseClient.ts       # Supabase browser client
    │   └── utils.ts                # General utilities
    ├── hooks/                      # Custom React hooks
    ├── public/                     # Static assets
    │   ├── logo.png
    │   ├── car.gif
    │   └── placeholder-*.jpg
    ├── superbase/                  # Database
    │   ├── scheme.sql              # Complete schema with triggers
    │   └── README.md               # Database documentation
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    └── next.config.mjs
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18.17+ ([Download](https://nodejs.org/))
- **npm** or **pnpm** package manager
- **Supabase Account** ([Sign up free](https://supabase.com/))
- **Git** for version control

### 1. Clone the Repository
```bash
git clone https://github.com/Anidipta/ParkO.git
cd ParkO/client
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Set Up Supabase

#### A. Create a New Supabase Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose a name, database password, and region
4. Wait for project to provision (~2 minutes)

#### B. Run Database Schema
1. In Supabase Dashboard → **SQL Editor**
2. Click **New query**
3. Copy contents of `superbase/scheme.sql`
4. Click **Run** to execute
5. Verify tables created: `users`, `driver_profiles`, `parking_spaces`, `parking_slots`, `bookings`, `payments`, `slot_availability`, `analytics_logs`, `space_managers`

#### C. Create Storage Bucket
1. Go to **Storage** in Supabase Dashboard
2. Create new bucket: `driver-docs`
3. Set to **Private**
4. Add policies for authenticated user access (see `superbase/README.md`)

#### D. Get API Keys
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon/public key** (client-side)
   - **service_role key** (server-side, keep secret!)

### 4. Configure Environment Variables
Create a `.env.local` file in the `client/` directory:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Make anon key available to client
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# JWT Secret for Session Tokens (generate a strong random string)
JWT_SECRET=your_very_secure_random_string_here_at_least_32_chars

# Node Environment
NODE_ENV=development
```

**Generate a secure JWT secret:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create Test Accounts
Navigate to:
- **Driver Signup:** `http://localhost:3000/driver/signup`
- **Owner Signup:** `http://localhost:3000/owner/signup`

Create test accounts and explore the features!

---

## 🔐 Environment Variables

| Variable | Required | Description | Where to Find |
|----------|----------|-------------|---------------|
| `SUPABASE_URL` | ✅ | Your Supabase project URL | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | ✅ | Public anon key (client-safe) | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server-only, secret!) | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Same as SUPABASE_URL (exposed to client) | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Same as SUPABASE_ANON_KEY (exposed to client) | Supabase Dashboard → Settings → API |
| `JWT_SECRET` | ✅ | Secret key for signing JWT tokens | Generate with `openssl rand -base64 32` |
| `NODE_ENV` | ⚙️ | Environment: `development` or `production` | Auto-set in production |

---

## 📡 API Documentation

### Authentication Routes

#### `POST /api/auth/register`
Register a new user (driver or owner).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "phone": "+1555000111",  // optional
  "userType": "driver"      // or "owner"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Account created successfully",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "user_type": "driver",
    "created_at": "2025-11-07T..."
  }
}
```

**Validation:**
- Email: Valid format
- Password: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
- Phone: 10-15 digits (optional)

---

#### `POST /api/auth/login`
Authenticate user and create session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "user_id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "user_type": "driver"
  }
}
```

**Sets Cookie:**
- Name: `session_token`
- HttpOnly: `true`
- Secure: `true` (production only)
- SameSite: `lax`
- Max-Age: 7 days

---

#### `GET /api/auth/session`
Get current authenticated user session.

**Headers:**
- Cookie: `session_token=...`

**Response (200):**
```json
{
  "success": true,
  "user": {
    "userId": "uuid",
    "email": "user@example.com",
    "userType": "driver",
    "fullName": "John Doe"
  }
}
```

**Response (401):**
```json
{
  "error": "Not authenticated"
}
```

---

#### `POST /api/auth/logout`
Clear session and logout user.

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Clears Cookie:** `session_token`

---

### User Routes

#### `POST /api/users/profile`
Upload driver verification documents.

**Request Body:**
```json
{
  "user_id": "uuid",
  "documents": [
    {
      "type": "license",
      "extracted": "DL1234567890",
      "b64": "data:image/jpeg;base64,..."
    },
    {
      "type": "plate",
      "extracted": "MH02AB1234",
      "b64": "data:image/jpeg;base64,..."
    },
    {
      "type": "pan",
      "extracted": "ABCDE1234F",
      "b64": "data:image/jpeg;base64,..."
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Documents uploaded successfully"
}
```

---

### Parking Routes

#### `GET /api/parking`
Get all parking spaces (with optional filtering).

**Query Parameters:**
- `owner_id` (optional): Filter by owner
- `is_active` (optional): Filter by active status

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "space_id": "uuid",
      "space_name": "Downtown Parking",
      "address": "123 Main St",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "total_slots": 50,
      "owner_id": "uuid"
    }
  ]
}
```

---

#### `POST /api/parking`
Create a new parking space (owners only).

**Request Body:**
```json
{
  "owner_id": "uuid",
  "space_name": "Downtown Parking",
  "address": "123 Main St, New York, NY 10001",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "total_slots": 50
}
```

---

### Booking Routes

#### `POST /api/bookings`
Create a new booking.

**Request Body:**
```json
{
  "driver_id": "uuid",
  "slot_id": "uuid",
  "space_id": "uuid",
  "start_time": "2025-11-07T14:00:00Z",
  "end_time": "2025-11-07T16:00:00Z",
  "estimated_amount": 10.00
}
```

**Response (201):**
```json
{
  "success": true,
  "booking": {
    "booking_id": "uuid",
    "otp_entry": "742819",
    "otp_exit": "358421",
    "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/...",
    "estimated_amount": 10.00
  }
}
```

---

#### `POST /api/bookings/verify`
Verify entry or exit OTP.

**Request Body:**
```json
{
  "booking_id": "uuid",
  "otp": "742819",
  "type": "entry"  // or "exit"
}
```

---

### Analytics Routes

#### `GET /api/analytics`
Get analytics data for a parking space.

**Query Parameters:**
- `space_id` (required)
- `from` (optional): Start date (YYYY-MM-DD)
- `to` (optional): End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-11-07",
      "total_bookings": 25,
      "total_revenue": 125.50,
      "occupied_hours": 50.0
    }
  ]
}
```

---

### Search Routes

#### `GET /api/search`
Search parking spaces by location.

**Query Parameters:**
- `lat`: Latitude
- `lng`: Longitude
- `radius`: Radius in meters (default: 200)

**Response (200):**
```json
{
  "success": true,
  "spaces": [
    {
      "space_id": "uuid",
      "space_name": "Downtown Parking",
      "distance": 150.5,
      "available_slots": 12
    }
  ]
}
```

---

## 💾 Database Schema

The Parko database uses **PostgreSQL** with a normalized **5NF** schema. See the complete documentation in [`superbase/README.md`](client/superbase/README.md).

### Key Tables
- **users** – Authentication and user roles
- **driver_profiles** – Verification status and documents
- **parking_spaces** – Physical parking locations
- **parking_slots** – Individual slots within spaces
- **bookings** – Reservations with OTP verification
- **payments** – Transaction records
- **slot_availability** – Real-time availability tracking
- **analytics_logs** – Daily aggregated analytics
- **space_managers** – Multi-manager access control

### Automated Triggers
- ✅ Profile completion percentage calculation
- ✅ OTP and QR code generation on booking
- ✅ Slot availability updates
- ✅ Final billing calculation on exit
- ✅ Analytics aggregation on payment

---

## 🔒 Authentication & Security

### Password Security
- **Hashing:** bcrypt with 10 salt rounds
- **Strength Requirements:**
  - Minimum 8 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number

### Session Management
- **Technology:** JWT (JSON Web Tokens)
- **Storage:** HttpOnly cookies (not accessible via JavaScript)
- **Expiration:** 7 days
- **CSRF Protection:** SameSite=Lax attribute
- **Secure Flag:** Enabled in production (HTTPS only)

### API Security
- **Server-Only Routes:** `/api/auth/*` routes run server-side
- **Service Role Key:** Never exposed to client
- **Input Validation:** All inputs validated before database queries
- **Error Handling:** Generic error messages to prevent information leakage

### Best Practices
```typescript
// ✅ Good: Use session from server
import { getSessionFromRequest } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // ... authenticated logic
}

// ❌ Bad: Don't expose service_role key
// process.env.SUPABASE_SERVICE_ROLE_KEY in client components
```

---

## 🌍 Deployment

### Recommended: Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com/)
   - Click **Import Project**
   - Select your GitHub repository
   - Set **Root Directory** to `client`
   - Add environment variables (see [Environment Variables](#environment-variables))
   - Click **Deploy**

3. **Configure Environment Variables in Vercel**
   - Settings → Environment Variables
   - Add all variables from `.env.local`
   - Ensure `NODE_ENV=production`
   - Set `JWT_SECRET` to a new secure value

4. **Update Supabase URL Allowlist**
   - Supabase Dashboard → Authentication → URL Configuration
   - Add your Vercel domain to **Redirect URLs**

### Alternative: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t parko .
docker run -p 3000:3000 --env-file .env.local parko
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
5. **Open a Pull Request**

### Code Standards
- Use TypeScript for all new code
- Follow existing code style (ESLint rules)
- Write descriptive commit messages
- Add comments for complex logic
- Test on both desktop and mobile

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025 Parko

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support

- **Documentation:** [`/client/superbase/README.md`](client/superbase/README.md)
- **Issues:** [GitHub Issues](https://github.com/Anidipta/ParkO/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Anidipta/ParkO/discussions)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) – React framework
- [Supabase](https://supabase.com/) – Backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) – Styling framework
- [shadcn/ui](https://ui.shadcn.com/) – Component library
- [Leaflet](https://leafletjs.com/) – Map rendering
- [Vercel](https://vercel.com/) – Deployment platform

---

**Built with ❤️ by the Parko Team**

Last Updated: November 7, 2025
