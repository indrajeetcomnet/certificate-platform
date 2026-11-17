# Certificate & Social Media Platform

A full-stack, responsive platform combining a Twitter/X-style social feed with dynamic sponsor-badge monetization and a comprehensive certificate issuance and verification system.

---

## 🏛️ Architecture & Tech Stack

- **Backend**: **Java 17+ / Spring Boot 3.2**
  - **Spring Data JPA** with **PostgreSQL** (ready for instant migration to Supabase)
  - **Spring Web REST API** (fully decoupled, JSON API)
  - **View & Monetization Engine**: Algorithmic deduplication (30s window by IP hash) and minimum view duration check (≥2s) at ₹20 per 1,000 qualifying sponsor views.
  - **Certificate Generator**: Unique cryptographic code generator (`CERT-XXXX-XXXX-XXXX`).
- **Frontend**: **React 18 / Vite 5 / Tailwind CSS 3**
  - **Zero Hardcoded Components**: 100% data-driven, prop-based, dynamic lists and templates.
  - **Twitter/X-style Social Feed**: Text & photo posts, follow-up reply chains, comments, likes.
  - **Dynamic Badge Rotator**: Badges (e.g. `Game City #Rank 1-3`) swap with active sponsor ads every 5 seconds with smooth transitions and viewport impression tracking.
  - **Certificate Studio**: Single issue, bulk issuance with CSV upload and progress bar, and instant public verification.
  - **Earnings Dashboard**: Live view counter, interactive CSS chart, and per-sponsor monetization breakdowns.

---

## 📁 Project Structure

```
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/certificate/platform/
│       │   ├── CertificateApplication.java
│       │   ├── config/CorsConfig.java
│       │   ├── controller/               # REST Endpoints
│       │   │   ├── BadgeController.java
│       │   │   ├── CertificateController.java
│       │   │   ├── PostController.java
│       │   │   ├── SponsorController.java
│       │   │   ├── UserController.java
│       │   │   └── ViewsController.java
│       │   ├── dto/                      # 23 Request/Response DTOs
│       │   ├── exception/                # GlobalExceptionHandler
│       │   ├── model/                    # 13 JPA Entities
│       │   ├── repository/               # 13 Spring Data Repositories
│       │   ├── service/                  # Business Logic & Algorithms
│       │   └── util/                     # CodeGenerator & ViewCalculator
│       └── resources/
│           ├── application.properties    # PostgreSQL / Supabase config
│           ├── schema.sql                # Complete DDL tables & indexes
│           └── data.sql                  # Seed demo data
│
└── frontend/
    ├── package.json
    ├── vite.config.js                    # Proxies /api -> localhost:8080
    ├── tailwind.config.js                # Custom badge rank & theme colors
    └── src/
        ├── api/                          # Axios API modules
        ├── components/
        │   ├── ui/                       # 15 Reusable UI primitives
        │   ├── layout/                   # Responsive AppLayout, Sidebar, Header, MobileNav
        │   ├── feed/                     # PostCard, CreatePost, CommentSection, FeedList
        │   ├── badges/                   # BadgeDisplay, BadgeRotator (5s swap), SponsorBadge
        │   ├── certificates/             # CertificateForm, BulkCertificateForm, CertificateVerify
        │   └── earnings/                 # EarningsDashboard, EarningsCard, ViewsCounter
        ├── context/                      # AuthContext, ToastContext
        ├── hooks/                        # useViewTracking, usePagination
        ├── pages/                        # 8 Full Application Pages
        └── utils/                        # formatters, validators, constants
```

---

## 🚀 Running the Project

### Prerequisites
1. **Java 17+** and **Maven 3.8+**
2. **Node.js 18+** and **npm** / **pnpm**
3. **PostgreSQL** (or a Supabase connection string)

---

### 1. Backend Setup (Spring Boot)

1. Configure your PostgreSQL database in `backend/src/main/resources/application.properties` (or set environment variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`):
   ```properties
   spring.datasource.url=jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:certificate_db}
   spring.datasource.username=${DB_USER:postgres}
   spring.datasource.password=${DB_PASSWORD:postgres}
   ```
2. Navigate to `backend` and run:
   ```bash
   cd backend
   mvn spring-boot:run
   ```
   *The backend will run on `http://localhost:8080` with endpoints under `/api/v1`.*

---

### 2. Frontend Setup (React + Vite)

1. Navigate to `frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173` with automatic proxying to the Spring Boot backend.*

---

## 🔑 Key Features & Algorithms

### 1. Badge & Sponsor 5-Second Rotation
In `BadgeRotator.jsx`, whenever a post or comment is rendered:
- Left side displays the user's avatar, name, and post timestamp.
- Right side displays the user's allocated badges (e.g. `Game City #Rank 1`).
- An interval timer automatically alternates between displaying the user badge and active sponsor banners every 5 seconds.
- An `IntersectionObserver` via `useViewTracking.js` records the viewport duration and triggers view events to the backend.

### 2. Views & Earnings Calculation Algorithm
In `ViewCalculator.java` & `ViewService.java`:
- **Target Event**: Only impressions on sponsor rotations (`SPONSOR_BADGE`) qualify.
- **Minimum Duration**: Impressions require `durationMs >= 2000` (2 seconds minimum on-screen).
- **Deduplication**: Impression events from the same IP within a 30-second window are counted only once to prevent artificial inflation.
- **Payout Formula**:
  $$\text{Earnings (₹)} = \left(\frac{\text{Qualifying Views}}{1000}\right) \times 20$$

### 3. Certificate Management & Instant Verification
- **Institution Portal**: Issue single certificates or bulk issue via CSV upload with progress tracking.
- **Unique Identification**: Every certificate gets a collision-checked unique code: `CERT-XXXX-XXXX-XXXX`.
- **Public Verification**: Anyone can navigate to `/certificates/verify` or `/certificates/verify/:code` to verify the authenticity and inspect the certificate template.
- **Privacy Design**: User profiles do not expose certificates; profiles strictly show social posts and competitive badges.
