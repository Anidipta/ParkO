# ParkO – Smart Parking Management System

> **ParkO** is a smart, AI-driven parking marketplace that connects **drivers** and **space owners** in real time.
> It predicts slot availability based on demand, time, and location — helping drivers find, book, and pay for parking easily, while owners manage and monetize their spaces efficiently.

---

[![Next.js](https://img.shields.io/badge/Next.js-16.0.0-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Table of Contents

* [Idea](#idea)
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Project Structure](#project-structure)
* [Getting Started](#getting-started)
* [Database Schema](#database-schema)
* [Authentication & Security](#authentication--security)
* [API](#api)
* [Roadmap](#roadmap)

---

## Idea

ParkO is a smart, AI-driven parking marketplace designed to eliminate the chaos of urban parking. The platform connects parking space owners and drivers in real time, predicting slot availability based on demand, time, and location. Drivers can easily find, filter, pre-book, and pay for parking near their destination, while owners can manage and monetize their spaces efficiently.

- Predictive Intelligence: Uses AI to forecast parking availability and suggest optimal slots within 100m of the user’s destination.
- Seamless Experience: Integrates booking, payments, and OTP-based entry for secure, verified, and hassle-free parking.

---

## Features

### For Drivers

* Secure registration/login (JWT + bcrypt)
* Document verification (license, PAN, vehicle plate)
* Real-time map with nearby parking
* Smart search by price, distance, or type
* Quick booking and OTP-based entry/exit
* Usage-based billing and booking history

### For Owners

* Manage multiple parking locations
* Add/edit spaces and slot types
* Invite managers with role-based access
* Real-time occupancy monitoring
* Earnings and analytics dashboard

### For Managers

* Accept owner invites
* Verify bookings
* Monitor assigned spaces
* View analytics and performance

---

## Tech Stack

**Frontend**

* Next.js 16 (App Router, Turbopack)
* TypeScript 5, React 19
* Tailwind CSS + shadcn/ui
* Leaflet maps, React Hook Form, Zod

**Backend**

* Supabase (PostgreSQL 14+)
* JWT authentication, bcrypt hashing
* Serverless Next.js API routes
* Real-time updates via SSE
* Database triggers for billing and analytics

**DevOps**

* Deployment: Vercel
* Package Manager: npm 
* Version Control: Git + GitHub

---

## Project Structure

```bash
ParkO/
├── client/
│   ├── app/               # App router (pages & APIs)
│   ├── components/        # Reusable UI components
│   ├── lib/               # Utilities (auth, Supabase)
│   ├── hooks/             # Custom React hooks
│   ├── public/            # Static assets
│   └── superbase/         # SQL schema & docs
└── README.md
```

---

## Getting Started

### Prerequisites

* Node.js 18+
* npm / pnpm
* Supabase account
* Git

### 1. Clone and Install

```bash
git clone https://github.com/Anidipta/ParkO.git
cd ParkO/client
npm install
```

### 2. Configure Supabase

1. Create a new project on [Supabase Dashboard](https://supabase.com/dashboard)
2. Run `client/superbase/scheme.sql` in SQL Editor
3. Create a private bucket: `driver-docs`
4. Copy your project URL and API keys

### 3. Setup Environment

Create `.env.local` in `client/`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your_32_char_random_secret
NODE_ENV=development
```

### 4. Run

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

---

## Database Schema

| Table               | Description               |
| ------------------- | ------------------------- |
| `users`             | Authentication & roles    |
| `driver_profiles`   | Driver verification       |
| `parking_spaces`    | Parking locations         |
| `parking_slots`     | Individual slots          |
| `bookings`          | OTP-verified reservations |
| `payments`          | Usage-based billing       |
| `slot_availability` | Live availability         |
| `analytics_logs`    | Revenue stats             |
| `space_managers`    | Multi-manager access      |

**Triggers:**

* Auto profile completion, billing, and analytics
* OTP & QR generation
* Slot availability updates

---

## Authentication & Security

* bcrypt password hashing (10 rounds)
* JWT-based session tokens (HttpOnly cookies)
* Row-Level Security enabled in Supabase
* CSRF protection (SameSite=Lax)
* HTTPS-only production mode

---

## API

| Endpoint                     | Method   | Description          |
| ---------------------------- | -------- | -------------------- |
| `/api/auth/register`         | POST     | Register user        |
| `/api/auth/login`            | POST     | Login                |
| `/api/bookings`              | GET/POST | Fetch/create booking |
| `/api/bookings/verify-entry` | POST     | Verify entry OTP     |
| `/api/bookings/verify-exit`  | POST     | Verify exit OTP      |
| `/api/owners/invite`         | POST     | Invite manager       |
| `/api/analytics`             | GET      | Revenue analytics    |

---

## Roadmap

**Phase 1 (✅)** – Core features: booking, OTP, manager system
**Phase 2 (Q1 2026)** – Payment gateway, notifications, analytics
**Phase 3 (Q2 2026)** – IoT sensors, subscriptions

---
 
Built with ❤️ by the **ParkO Team**.
