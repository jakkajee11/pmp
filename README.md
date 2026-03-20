# Performance Metrics Portal (PMP)

A comprehensive performance management system for employee evaluations, objective tracking, and organizational management.

## Overview

The Performance Metrics Portal is a Next.js 14 application designed to streamline the employee performance review process. It supports self-evaluations, manager reviews, objective assignments, and comprehensive reporting.

## Features

### Core Functionality

- **User & Organization Management** - Manage users, departments, and organizational hierarchy
- **Review Cycle Configuration** - HR admins can create and manage evaluation cycles with deadlines
- **Objective Assignment** - Managers can assign objectives with rating criteria to employees
- **Self-Evaluation** - Employees complete self-evaluations with auto-save functionality
- **Manager Review** - Managers review and rate employee self-evaluations
- **Core Values Assessment** - Assess employees on company core values
- **Notifications & Reminders** - Email, SMS, and Microsoft Teams notifications
- **Reports & Dashboards** - Completion rates, rating distributions, and exports
- **Audit Logging** - Complete audit trail for compliance
- **Document Upload** - S3-backed document attachments for objectives
- **Localization** - Thai and English language support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.x (strict mode)
- **Database**: PostgreSQL 15.x with Prisma ORM
- **UI**: React 18.x with shadcn/ui components
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js with OIDC
- **File Storage**: Amazon S3
- **Testing**: Jest (unit), Playwright (E2E)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authenticated routes
│   │   ├── users/         # User management
│   │   ├── cycles/        # Review cycle management
│   │   ├── objectives/    # Objective assignment
│   │   ├── evaluations/   # Self & manager evaluations
│   │   ├── reports/       # Reports & dashboards
│   │   ├── audit-logs/    # Audit log viewer
│   │   ├── settings/      # User settings
│   │   └── org-chart/     # Organization chart
│   └── api/               # API routes
├── features/              # Feature-based modules
│   ├── auth/              # Authentication
│   ├── users/             # User management
│   ├── cycles/            # Review cycles
│   ├── objectives/        # Objectives
│   ├── evaluations/       # Evaluations
│   ├── core-values/       # Core values
│   ├── notifications/     # Notifications
│   ├── reports/           # Reporting
│   ├── audit-logs/        # Audit logging
│   ├── documents/         # Document upload
│   ├── settings/          # Settings
│   ├── org-chart/         # Org chart
│   └── dashboard/         # Dashboards
├── shared/                # Shared utilities
│   ├── api/               # API utilities
│   ├── components/        # Shared components
│   ├── hooks/             # Shared hooks
│   ├── lib/               # Core libraries
│   ├── types/             # Shared types
│   └── utils/             # Utility functions
└── middleware.ts          # Auth & i18n middleware

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests
└── e2e/                   # End-to-end tests
```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- PostgreSQL 15.x
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd pmp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

   Configure the following variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Secret for NextAuth.js
   - `NEXTAUTH_URL` - Application URL
   - `OIDC_*` - OIDC provider configuration
   - `AWS_*` - AWS S3 configuration (optional)

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:13300](http://localhost:13300) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server on port 13300 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript type checking |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run E2E tests with Playwright |

## User Roles

| Role | Permissions |
|------|-------------|
| **HR Admin** | Full system access, user management, cycle configuration |
| **Manager** | View team, assign objectives, review evaluations |
| **Employee** | View objectives, complete self-evaluations |

## API Endpoints

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Cycles
- `GET /api/cycles` - List review cycles
- `POST /api/cycles` - Create cycle
- `POST /api/cycles/:id/activate` - Activate cycle

### Objectives
- `GET /api/objectives` - List objectives
- `POST /api/objectives` - Create objective
- `POST /api/objectives/bulk` - Bulk assign objectives

### Evaluations
- `GET /api/evaluations` - List evaluations
- `PUT /api/evaluations/:id/self` - Update self-evaluation
- `POST /api/evaluations/:id/self/submit` - Submit self-evaluation
- `PUT /api/evaluations/:id/manager` - Manager review
- `POST /api/evaluations/:id/manager/submit` - Submit manager review

## Configuration

### Localization

Supported locales:
- English (`en`) - Default
- Thai (`th`)

Translation files are located in `messages/en.json` and `messages/th.json`.

### Security

The application implements:
- Content Security Policy (CSP) with nonce support
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Rate limiting on API routes
- RBAC (Role-Based Access Control)

## Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Environment Variables

Ensure all required environment variables are set in production:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Yes | NextAuth.js secret |
| `NEXTAUTH_URL` | Yes | Application URL |
| `OIDC_ISSUER` | Yes | OIDC provider issuer URL |
| `OIDC_CLIENT_ID` | Yes | OIDC client ID |
| `OIDC_CLIENT_SECRET` | Yes | OIDC client secret |
| `AWS_ACCESS_KEY_ID` | No | AWS access key for S3 |
| `AWS_SECRET_ACCESS_KEY` | No | AWS secret key for S3 |
| `AWS_REGION` | No | AWS region |
| `S3_BUCKET_NAME` | No | S3 bucket for documents |

## Contributing

1. Create a feature branch from `main`
2. Make your changes following the code style guidelines
3. Write tests for new functionality
4. Submit a pull request for review

## License

Private - All rights reserved.
