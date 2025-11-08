# API Documentation - ParkO

> **RESTful API endpoints for parking management, authentication, and real-time operations**

---

## 📋 Overview

ParkO's backend is built with **Next.js 16 API Routes**, providing:
- **8 core modules** with 20+ endpoints
- **JWT authentication** for session management
- **Real-time updates** via Supabase subscriptions
- **Edge-optimized** functions for global performance

---

## 🗂️ API Modules

```
api/
├── auth/          → User authentication (login, register, session)
├── bookings/      → Parking reservations & OTP verification
├── owners/        → Space management & manager invites
├── parking/       → Space & slot listings
├── payments/      → Payment processing & history
├── slots/         → Slot availability & real-time updates
├── users/         → Profile management
├── analytics/     → Revenue & usage statistics
└── search/        → Location-based parking search
```

---

## � API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Create new user account (driver/owner/manager) |
| `/api/auth/login` | POST | Authenticate user and create JWT session |
| `/api/auth/session` | GET | Verify current session and return user data |
| `/api/auth/logout` | POST | Destroy session and clear authentication cookies |
| `/api/bookings` | GET | Fetch bookings for authenticated user with filters |
| `/api/bookings` | POST | Create new parking reservation with OTP generation |
| `/api/bookings/verify-entry` | POST | Verify entry OTP and activate booking |
| `/api/bookings/verify-exit` | POST | Verify exit OTP and calculate final bill |
| `/api/bookings/next-available` | GET | Calculate next available time for full slot types |
| `/api/owners/invite` | POST | Send manager invitation with secure token |
| `/api/owners/invite/accept` | POST | Accept manager invitation and activate account |
| `/api/owners/managers` | GET | List all managers assigned to owner's spaces |
| `/api/parking` | GET | List active parking spaces with availability |
| `/api/parking` | POST | Create new parking space with slots (owner only) |
| `/api/slots/availability` | GET | Get real-time slot availability by type |
| `/api/slots/stream` | GET | Server-Sent Events for live availability updates |
| `/api/payments` | POST | Process payment for completed booking |
| `/api/payments` | GET | Retrieve payment history for user |
| `/api/analytics` | GET | Get revenue and usage statistics (owner only) |
| `/api/search` | GET | Search parking spaces by location or features |
| `/api/users/profile` | GET | Fetch user profile details |
| `/api/users/profile` | PUT | Update user profile information |
| `/api/users/profile/verify` | POST | Upload and verify driver documents |

---

## 🔒 Authentication

### JWT Session Flow
1. User logs in → Receives JWT token
2. Token stored in HttpOnly cookie
3. Each request includes cookie automatically
4. Server verifies JWT signature
5. Extracts user_id for authorization

**Expiration:** 24 hours from issue

---

**API Version:** 1.0.0  
**Last Updated:** November 2025
