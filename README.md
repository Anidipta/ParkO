![Parko Logo](client/public/logo.png)

# Parko - Smart Parking Management System



> ParkO is a smart, AI-driven parking marketplace designed to eliminate the chaos of urban parking. The platform connects parking space owners and drivers in real time, predicting slot availability based on demand, time, and location. Drivers can easily find, filter, pre-book, and pay for parking near their destination, while owners can manage and monetize their spaces efficiently.


[![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black)](https://nextjs.org/)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)---

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

##  Table of Contents

## 🚀 Live Demo

- [Features](#features)

**[View Demo →](https://your-demo-link.vercel.app)**- [Tech Stack](#tech-stack)

- [Project Structure](#project-structure)

---- [Getting Started](#getting-started)

- [Environment Variables](#environment-variables)

## 💡 The Idea- [API Documentation](#api-documentation)

- [Database Schema](#database-schema)

ParkO revolutionizes urban parking by connecting **drivers** seeking parking with **space owners** monetizing their property. Our platform enables:- [Authentication & Security](#authentication--security)

- **Drivers**: Find, book, and navigate to parking spots with real-time availability- [Deployment](#deployment)

- **Owners**: List spaces, manage bookings, and earn passive income- [Contributing](#contributing)

- **Managers**: Help owners monitor multiple locations efficiently- [License](#license)



------



## 🎯 Market Opportunity## ✨ Features



### Problem Statement### For Drivers

- **$100B+ global parking market** experiencing chronic inefficiency- **Secure Registration & Login** – Bcrypt password hashing, JWT session tokens

- Drivers waste **17 hours/year** searching for parking- **Document Verification** – Upload driver's license, vehicle plate, and PAN card

- Urban parking occupancy averages only **65%**- **Real-Time Map View** – See nearby parking spaces with live availability

- Property owners underutilize parking assets- **Smart Search** – Find parking by location, price, or distance (within 200m)

- **Easy Booking** – Reserve slots for 2 hours (default) with estimated pricing

### Our Solution- **OTP-Based Entry/Exit** – Secure 6-digit OTPs for verification

A **dual-sided marketplace** that:- **QR Code Support** – Scannable QR codes for quick entry/exit

1. Reduces driver search time to **<2 minutes**- **Usage-Based Billing** – Pay only for actual time used

2. Increases owner parking revenue by **40%**- **Booking History** – Track past and active reservations

3. Provides real-time availability & smart queuing

4. Automates entry/exit with OTP verification### For Owners

- **Business Account** – Manage multiple parking locations

---- **Space Management** – Add/edit parking spaces with GPS coordinates

- **Slot Configuration** – Define slot types (compact, standard, large, handicap, electric) and rates

## ✨ What Makes ParkO Different- **Multi-Manager Support** – Invite and manage staff with role-based access

- **Revenue Analytics** – Daily/weekly/monthly earnings dashboard

### 🔐 **OTP + QR Verification System**- **Real-Time Monitoring** – See current occupancy and availability

- Dual OTP (Entry + Exit) for security- **Invite System** – Send invite tokens to managers via email

- QR code generation for contactless verification

- Prevents parking fraud and unauthorized usage### Technical Highlights

- **Real-Time Updates** – SSE (Server-Sent Events) for live slot availability

### ⏱️ **Smart Queue & Time Prediction**- **Geolocation Integration** – HTML5 Geolocation API + Leaflet maps

- Yellow-marked full slots show **next available time**- **Responsive Design** – Mobile-first UI with Tailwind CSS

- Calculates exit times + 15-min buffer- **Type-Safe** – Full TypeScript coverage

- Real-time countdown timers with overtime tracking- **Secure Sessions** – HttpOnly cookies, CSRF protection

- **Database Triggers** – Auto-calculate profile completion, billing, analytics

### 💰 **Dynamic Usage-Based Billing**- **5NF Schema** – Normalized database design for data integrity

- Pay only for **actual time used**

- Different rates for slot types (covered, premium, EV charging)---

- Automatic overtime calculation

## 🛠️ Tech Stack

### 📱 **Real-Time Navigation**

- GPS-based turn-by-turn directions### Frontend

- Current location to parking coordinates- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)

- Integrated Google Maps routing- **UI Library:** [React 19](https://react.dev/)

- **Language:** [TypeScript 5](https://www.typescriptlang.org/)

### 👥 **Multi-Role Management**- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)

- **Driver**: Browse, book, verify, pay- **Components:** [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)

- **Owner**: Add spaces, manage bookings, analytics- **Maps:** [Leaflet](https://leafletjs.com/) + [React Leaflet](https://react-leaflet.js.org/)

- **Manager**: Invite system for space supervision- **Forms:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)

- **Icons:** [Lucide React](https://lucide.dev/)

---

### Backend

## 🏆 Unique Selling Propositions (USP)- **Runtime:** Node.js 18+

- **API Routes:** Next.js API routes (serverless functions)

| Feature | ParkO | Traditional Apps |- **Database:** [Supabase](https://supabase.com/) (PostgreSQL 14+)

|---------|-------|------------------|- **Storage:** Supabase Storage (driver documents)

| **OTP Verification** | ✅ Entry + Exit | ❌ None |- **Authentication:** Custom JWT + HttpOnly cookies

| **Smart Queue** | ✅ Predicted availability | ❌ Generic waitlist |- **Password Hashing:** [bcryptjs](https://www.npmjs.com/package/bcryptjs)

| **Usage Billing** | ✅ Per-minute accuracy | ❌ Fixed hour blocks |- **Session Management:** [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)

| **Manager System** | ✅ Invite-based delegation | ❌ Single owner only |

| **Real-time Timer** | ✅ Shake animation alerts | ❌ Basic countdown |### DevOps & Tooling

| **8 Slot Types** | ✅ Premium to disabled | ❌ Generic slots |- **Package Manager:** npm / pnpm

- **Linting:** ESLint

---- **Type Checking:** TypeScript

- **Version Control:** Git

## 🛠️ Technology Stack- **Deployment:** Vercel (recommended)



### **Frontend**---

- **Framework**: Next.js 16.0.0 (App Router, Turbopack)

- **Language**: TypeScript 5.0## 📁 Project Structure

- **Styling**: Tailwind CSS 3.4 + shadcn/ui

- **State**: React Hooks (useState, useEffect)```

- **Maps**: Google Maps API IntegrationParkO/

├── README.md                       # This file

### **Backend**└── client/                         # Next.js application

- **Runtime**: Next.js API Routes (Edge Functions)    ├── app/                        # App router pages & API routes

- **Database**: Supabase (PostgreSQL 15)    │   ├── api/                    # Backend API endpoints

- **Auth**: JWT + bcryptjs    │   │   ├── auth/               # Authentication routes

- **OTP Generation**: Cryptographic random (6-digit)    │   │   │   ├── register/       # POST /api/auth/register

- **QR Codes**: QR Server API    │   │   │   ├── login/          # POST /api/auth/login

    │   │   │   ├── logout/         # POST /api/auth/logout

### **Database Architecture**    │   │   │   └── session/        # GET /api/auth/session

- **5NF Normalized Schema** (9 core tables)    │   │   ├── users/              # User management

- **8 PostgreSQL Triggers** for automation    │   │   ├── parking/            # Parking spaces CRUD

- **Row-Level Security (RLS)** enabled    │   │   ├── slots/              # Slot management

- **Real-time subscriptions** for availability    │   │   ├── bookings/           # Booking operations

    │   │   ├── payments/           # Payment processing

### **DevOps**    │   │   ├── analytics/          # Analytics data

- **Build**: Turbopack (Webpack successor)    │   │   └── search/             # Search endpoint

- **Deployment**: Vercel (Edge Network)    │   ├── driver/                 # Driver pages

- **Version Control**: Git + GitHub    │   │   ├── signup/

- **Package Manager**: npm/pnpm    │   │   ├── login/

    │   │   ├── verification/

---    │   │   ├── dashboard/

    │   │   ├── map/

## 📦 Core Features    │   │   ├── booking/

    │   │   ├── payment/

### For Drivers 🚗    │   │   ├── profile/

✅ Browse parking by location/map      │   │   └── wallet/

✅ Filter by slot type (8 types)      │   ├── owner/                  # Owner pages

✅ Real-time availability + smart queue      │   │   ├── signup/

✅ QR code + OTP booking confirmation      │   │   ├── login/

✅ GPS navigation to parking      │   │   ├── dashboard/

✅ Countdown timer with shake alerts      │   │   ├── map/

✅ Digital wallet & payment history      │   │   ├── add-space/

✅ Document verification (License, PAN, Plate)    │   │   ├── space/[id]/

    │   │   ├── profile/

### For Owners 🏢    │   │   └── referral/

✅ Add unlimited parking spaces      │   ├── layout.tsx              # Root layout (header/footer)

✅ Set pricing per slot type      │   ├── page.tsx                # Homepage

✅ Verify entry/exit OTPs      │   └── globals.css             # Global styles

✅ Real-time booking dashboard      ├── components/                 # Reusable components

✅ Revenue analytics by day/month      │   ├── header-auth.tsx         # Auth widget for header

✅ Manager invitation system      │   ├── map-client.tsx          # Leaflet map component

✅ Automated billing calculations    │   ├── theme-provider.tsx

    │   └── ui/                     # shadcn/ui components

### For Managers 👨‍💼    ├── lib/                        # Utility libraries

✅ Accept invitation via email link      │   ├── auth.ts                 # Auth helpers (bcrypt, JWT, validation)

✅ Manage multiple owner spaces      │   ├── session.ts              # Session management (cookies)

✅ Verify bookings on behalf of owners      │   ├── supabaseServer.ts       # Supabase server client

✅ Access analytics & reports    │   ├── supabaseClient.ts       # Supabase browser client

    │   └── utils.ts                # General utilities

---    ├── hooks/                      # Custom React hooks

    ├── public/                     # Static assets

## 🗂️ Project Structure    │   ├── logo.png

    │   ├── car.gif

```    │   └── placeholder-*.jpg

ParkO/    ├── superbase/                  # Database

├── client/                    # Next.js application    │   ├── scheme.sql              # Complete schema with triggers

│   ├── app/                   # App Router pages    │   └── README.md               # Database documentation

│   │   ├── api/              # API routes (8 modules)    ├── package.json

│   │   ├── driver/           # Driver dashboard & flows    ├── tsconfig.json

│   │   ├── owner/            # Owner management    ├── tailwind.config.ts

│   │   └── manager/          # Manager workflows    └── next.config.mjs

│   ├── components/           # React components (40+ UI)```

│   ├── lib/                  # Utilities & helpers

│   ├── superbase/            # Database schema & migrations---

│   └── public/               # Static assets

└── README.md                 # This file## 🚀 Getting Started

```

### Prerequisites

---- **Node.js** 18.17+ ([Download](https://nodejs.org/))

- **npm** or **pnpm** package manager

## 🚀 Quick Start- **Supabase Account** ([Sign up free](https://supabase.com/))

- **Git** for version control

### Prerequisites

- Node.js 18+ ### 1. Clone the Repository

- npm/pnpm```bash

- Supabase accountgit clone https://github.com/Anidipta/ParkO.git

- Gitcd ParkO/client

```

### Installation

### 2. Install Dependencies

```bash```bash

# Clone repositorynpm install

git clone https://github.com/Anidipta/ParkO.git# or

cd ParkO/clientpnpm install

```

# Install dependencies

npm install### 3. Set Up Supabase



# Configure environment#### A. Create a New Supabase Project

cp .env.example .env1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)

# Edit .env with your Supabase credentials2. Click **New Project**

3. Choose a name, database password, and region

# Run database migrations4. Wait for project to provision (~2 minutes)

# Execute client/superbase/scheme.sql in Supabase SQL Editor

#### B. Run Database Schema

# Start development server1. In Supabase Dashboard → **SQL Editor**

npm run dev2. Click **New query**

```3. Copy contents of `superbase/scheme.sql`

4. Click **Run** to execute

**Open**: [http://localhost:3000](http://localhost:3000)5. Verify tables created: `users`, `driver_profiles`, `parking_spaces`, `parking_slots`, `bookings`, `payments`, `slot_availability`, `analytics_logs`, `space_managers`



### Build for Production#### C. Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard

```bash2. Create new bucket: `driver-docs`

npm run build3. Set to **Private**

npm start4. Add policies for authenticated user access (see `superbase/README.md`)

```

#### D. Get API Keys

---1. Go to **Settings** → **API**

2. Copy:

## 📊 Database Schema Highlights   - **Project URL**

   - **anon/public key** (client-side)

### Core Tables   - **service_role key** (server-side, keep secret!)

- **users**: Multi-role auth (driver/owner/manager)

- **parking_spaces**: Physical locations with GPS### 4. Configure Environment Variables

- **parking_slots**: Individual slots (8 types)Create a `.env.local` file in the `client/` directory:

- **bookings**: OTP tracking + time verification

- **payments**: Usage-based billing```bash

- **space_managers**: Invite system with tokens# Supabase Configuration

- **analytics_logs**: Revenue & occupancy metricsSUPABASE_URL=https://your-project.supabase.co

SUPABASE_ANON_KEY=your_anon_key_here

### Automated TriggersSUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

1. Profile completion % calculator

2. OTP + QR code generator on booking# Make anon key available to client

3. Slot availability updaterNEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

4. Entry time recorderNEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

5. Exit billing calculator

6. Analytics aggregator# JWT Secret for Session Tokens (generate a strong random string)

JWT_SECRET=your_very_secure_random_string_here_at_least_32_chars

**Full Schema**: See [`client/superbase/README.md`](client/superbase/README.md)

# Node Environment

---NODE_ENV=development

```

## 🔌 API Documentation

**Generate a secure JWT secret:**

### Core Endpoints```bash

# Linux/Mac

**Authentication:**openssl rand -base64 32

- `POST /api/auth/register` - Create account

- `POST /api/auth/login` - User login# Windows PowerShell

- `GET /api/auth/session` - Verify session[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

- `POST /api/auth/logout` - End session```



**Bookings:**### 5. Run Development Server

- `GET /api/bookings` - List bookings```bash

- `POST /api/bookings` - Create bookingnpm run dev

- `POST /api/bookings/verify-entry` - Verify entry OTP```

- `POST /api/bookings/verify-exit` - Verify exit OTP

- `GET /api/bookings/next-available` - Smart queue calculationOpen [http://localhost:3000](http://localhost:3000) in your browser.



**Parking Management:**### 6. Create Test Accounts

- `GET /api/parking` - List spacesNavigate to:

- `POST /api/parking` - Create space- **Driver Signup:** `http://localhost:3000/driver/signup`

- `GET /api/slots/availability` - Real-time availability- **Owner Signup:** `http://localhost:3000/owner/signup`



**Owner Operations:**Create test accounts and explore the features!

- `POST /api/owners/invite` - Invite manager

- `POST /api/owners/invite/accept` - Accept invitation---

- `GET /api/analytics` - Revenue analytics

## 🔐 Environment Variables

**Full API Docs**: See [`client/app/api/README.md`](client/app/api/README.md)

| Variable | Required | Description | Where to Find |

---|----------|----------|-------------|---------------|

| `SUPABASE_URL` | ✅ | Your Supabase project URL | Supabase Dashboard → Settings → API |

## 🔒 Security Features| `SUPABASE_ANON_KEY` | ✅ | Public anon key (client-safe) | Supabase Dashboard → Settings → API |

| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (server-only, secret!) | Supabase Dashboard → Settings → API |

- **JWT Session Management** (32-char secret)| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Same as SUPABASE_URL (exposed to client) | Supabase Dashboard → Settings → API |

- **bcrypt Password Hashing** (10 rounds)| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Same as SUPABASE_ANON_KEY (exposed to client) | Supabase Dashboard → Settings → API |

- **Row-Level Security (RLS)** on all tables| `JWT_SECRET` | ✅ | Secret key for signing JWT tokens | Generate with `openssl rand -base64 32` |

- **OTP Expiration** (time-based validity)| `NODE_ENV` | ⚙️ | Environment: `development` or `production` | Auto-set in production |

- **HTTPS-only API** endpoints

- **CORS Protection** enabled---



---## 📡 API Documentation



## 🎨 UI/UX Highlights### Authentication Routes



- **Responsive Design**: Mobile-first approach#### `POST /api/auth/register`

- **Dark Mode**: Full theme supportRegister a new user (driver or owner).

- **Loading States**: Skeleton screens

- **Error Handling**: User-friendly messages**Request Body:**

- **Animations**: Smooth transitions + shake alerts```json

- **Accessibility**: ARIA labels, keyboard nav{

  "email": "user@example.com",

---  "password": "SecurePass123",

  "fullName": "John Doe",

## 📈 Roadmap  "phone": "+1555000111",  // optional

  "userType": "driver"      // or "owner"

### Phase 1 (Current) ✅}

- [x] Core booking flow```

- [x] OTP verification

- [x] Smart queue**Response (201):**

- [x] Manager system```json

{

### Phase 2 (Q1 2026) 🚧  "success": true,

- [ ] Payment gateway integration (Stripe/Razorpay)  "message": "Account created successfully",

- [ ] Push notifications  "user": {

- [ ] Advanced analytics dashboard    "user_id": "uuid",

- [ ] Mobile app (React Native)    "email": "user@example.com",

    "full_name": "John Doe",

### Phase 3 (Q2 2026) 📋    "user_type": "driver",

- [ ] AI-based pricing optimization    "created_at": "2025-11-07T..."

- [ ] IoT sensor integration  }

- [ ] Subscription plans for drivers}

- [ ] Parking violation reporting```



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


## 📄 License

This project is licensed under the **MIT License**.

**Built with ❤️ by the Parko Team**
