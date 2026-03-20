# Product Requirements Document (PRD)
# Performance Metrics Portal (PMP)

**Version:** 1.0
**Status:** Draft
**Last Updated:** 2026-03-18
**Author:** [To be filled]

---

## 1. Executive Summary

### Overview

The Performance Metrics Portal (PMP) is a web-based application designed to modernize the company's annual performance review process. It replaces the current manual, Excel-based workflow with a centralized, transparent, and efficient digital platform.

### Problem

The current review process relies on Excel spreadsheets with manual data entry, leading to:
- Slow cycle completion (4-6 weeks)
- Calculation errors affecting compensation decisions
- Lack of transparency for employees
- No audit trail for compliance

### Solution

A unified platform that:
- Automates review cycle management from objectives to final ratings
- Provides role-based access for Admin/HR, Managers, and Employees
- Calculates weighted scores automatically (KPIs 80% + Core Values 20%)
- Tracks all changes with comprehensive audit logging
- Integrates notifications via Email, SMS, and MS Teams

### Key Features
- **For HR/Admin**: User management, cycle configuration, company objectives, reports, audit logs
- **For Managers**: Team dashboard, objective assignment, employee evaluation, feedback history
- **For Employees**: Self-evaluation, document uploads, feedback viewing, historical records

### Target Launch
**October 1, 2026** with pilot rollout in September 2026

### Success Metrics
| Metric | Target |
|--------|--------|
| Review cycle duration | ≤ 2 weeks (down from 4-6 weeks) |
| HR time savings | 70% reduction |
| Calculation accuracy | Zero errors |
| Employee satisfaction | ≥ 4.0 / 5.0 |
| Completion rate | ≥ 95% on time |

### Tech Stack
- Frontend: Next.js (React) with SSR
- Backend: Next.js API Routes
- Database: PostgreSQL
- Storage: Amazon S3
- Auth: Custom auth with company SSO
- Hosting: Internal OCP (OpenShift)

### Investment & ROI
- Development: 4 developers × 7 months
- Expected payback: 1-2 years based on time savings and error reduction

---

## 2. Problem Statement

### 2.1 Current State (As-Is)

Today, the company's performance review process is managed entirely through **Excel spreadsheets** with a manual, offline workflow:

- HR manually distributes evaluation templates to all managers
- Managers create individual objectives for each direct report in separate files
- Employees complete self-evaluations in their assigned spreadsheets
- Files are emailed back-and-forth between managers and employees
- HR collects and consolidates hundreds of spreadsheets manually
- Rating calculations (KPIs 80% + Core Values 20%) are computed manually using formulas

### 2.2 Pain Points

This manual approach creates significant challenges:

| Problem | Impact |
|---------|--------|
| **Slow process** | A full review cycle takes 4-6 weeks to complete |
| **Human errors** | Manual data entry causes calculation mistakes, incorrect weightings, and missing evaluations |
| **Lack of transparency** | Employees don't understand how final scores are derived; no visibility into evaluation status or progress |
| **No audit trail** | Changes to ratings go untracked, creating compliance and fairness risks |
| **Poor employee experience** | The frustrating process leads to rushed self-evaluations and low engagement |
| **Delayed compensation decisions** | Slow reviews delay bonus and salary adjustments |
| **Inconsistent standards** | Different managers apply different rating interpretations across teams |
| **Scattered historical data** | Past evaluations stored in various locations; difficult to track employee growth over time |

### 2.3 Why Now

Several factors make this the right time to invest in a Performance Metrics Portal:

- **New HR initiative** — The company is modernizing people operations as a strategic priority
- **Scale challenge** — With thousands of employees, the manual process has become unsustainable
- **Employee feedback** — Internal surveys indicate growing dissatisfaction with the current review experience

### 2.4 Impact of Inaction

Without a dedicated system:

- Employee frustration and disengagement will continue
- Risk of compensation errors affecting morale and trust
- HR team remains overwhelmed with administrative work
- Leadership lacks data-driven insights for talent and promotion decisions

---

## 3. Goals & Success Metrics

### 3.1 Primary Goals

| Goal | Description |
|------|-------------|
| **Improve employee satisfaction** | Transform the frustrating review process into a positive experience |
| **Increase process efficiency** | Reduce administrative burden on HR and managers |
| **Ensure calculation accuracy** | Eliminate errors in bonus and salary computations |
| **Enable transparency** | Give employees visibility into how their scores are calculated |
| **Build data foundation** | Create structured performance data for talent decisions |

### 3.2 Quantitative Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Review cycle duration | ≤ 2 weeks (down from 6 weeks) | Time from cycle open to final approval |
| Completion rate | ≥ 95% | % of evaluations completed on time |
| Calculation accuracy | Zero errors | Automated validation + spot checks |
| Employee satisfaction score | ≥ 4.0 / 5.0 | Post-review survey |
| Manager time saved | 50% reduction | Time tracking comparison |
| HR time saved | 70% reduction | Hours spent on consolidation tasks |
| Self-evaluation participation | 100% | % of employees who submit self-eval |
| On-time completion | 90% by deadline | % completed before deadline |
| System uptime | 99.9% | Availability during review periods |

### 3.3 Business Outcomes (Leading Indicators)

| Outcome | Description |
|---------|-------------|
| Data-driven promotions | Promotion decisions backed by historical performance data rather than gut feel |
| Retention correlation | Higher satisfaction scores correlate with lower voluntary turnover |
| Compensation accuracy | Bonuses and salary adjustments aligned with actual performance ratings |

### 3.4 Adoption Metrics

| Metric | Target |
|--------|--------|
| First-cycle adoption | 100% of employees and managers actively use the system |
| Feature utilization | Track which features are most/least used (for future optimization) |
| Support ticket volume | Reduction in HR inquiries about the review process |

### 3.5 Success Criteria by Stakeholder

| Stakeholder | What Success Looks like |
|-------------|------------------------|
| **Employees** | Clear process, Transparent scoring. Timely feedback. |
| **Managers** | Easy to assign objectives. Streamlined review workflow. Less manual work. |
| **HR** | Accurate calculations. Audit trail. Reporting. Less administrative burden. |
| **Leadership** | Data for talent decisions. Completed reviews on time. |

---

## 4. User Roles & Permissions

### 4.1 Role Definitions

| Role | Focus | Data Access |
|------|-------|-------------|
| **Super Admin** | Technical: system configuration, integrations, security, audit logs | No employee data |
| **HR Admin** | HR operations: user management, cycle configuration, full employee data access | All employees |
| **HR Staff** | HR support: reports, dashboards, employee inquiries (read-only) | All employees (read-only) + Employee self |
| **Senior Manager** | People management with skip-level visibility | Direct reports + skip-level (reports of reports) |
| **Line Manager** | People management | Direct reports + self |
| **Employee** | Self-evaluation and feedback | Self only |

### 4.2 Permission Matrix

| Capability | Super Admin | HR Admin | HR Staff | Senior Manager | Line Manager | Employee |
|------------|:-----------:|--------:|--------||:--------------:|:-----------:|---------|
| System configuration | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Manage integrations (Email, SMS, MS Teams, S3) | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| Audit log access | ✓ | ✓ | ✓ (read-only) | ✗ | ✗ | ✗ |
| User management (create, edit, deactivate) | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Review cycle configuration | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| View all employee data | ✗ | ✓ | ✓ (read-only) | ✗ | ✗ | ✗ |
| View department reports | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ |
| View team reports | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Manage direct reports' objectives and evaluations | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ |
| Skip-level visibility (view reports of reports) | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ |
| Self-evaluate | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Be reviewed by manager | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View own data and history | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Upload supporting documents | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 4.3 Role Overlap Model

Users can have multiple roles simultaneously. Capabilities are additive:

**HR Staff Example:**
- Has HR read access to all employee data (for reporting)
- ALSO has Employee capabilities (self-evaluate, be reviewed, view own data)
- When viewing own data, HR permissions are hidden
- Manager cannot see their own evaluation until they complete self-evaluation

**Manager as Employee:**
- All managers (except Super Admin) have their own manager
- Must complete self-evaluation before reviewing direct reports
- Go through the same review process as any employee

**Senior Manager:**
- Has Line Manager capabilities PLUS skip-level visibility
- Can only review direct reports (cannot review skip-level employees)

### 4.4 Special Cases

| Scenario | Handling |
|----------|----------|
| Manager with no direct reports | Functions as Employee until team is assigned; Manager role capabilities dormant |
| Role change mid-cycle (e.g., promotion to manager) | HR Admin handles case-by-case: reassign objectives, transfer evaluation data. adjust permissions |
| Employee transfers to new manager | New manager inherits ongoing evaluation; previous manager's feedback preserved in history |
| HR Staff accessing own evaluation | Employee view takes precedence; HR permissions hidden for own record |

### 4.5 Data Isolation by Role

| Data Type | Employee | Line Manager | Senior Manager | HR Staff | HR Admin | Super Admin |
|-----------|:--------:|-------------|----------------|----------|---------|-------------|
| Own objectives & evaluations | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Direct reports' data | ✗ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Skip-level employees' data | ✗ | ✗ | ✓ (view only) | ✓ | ✓ | ✗ |
| All employees' data | ✗ | ✗ | ✗ | ✓ (read) | ✓ | ✗ |
| System configuration | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| Audit logs | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |

---

## 5. Functional Requirements

### 5.1 Admin/HR Capabilities

#### 5.1.1 User Management
- Create, edit, and deactivate user accounts
- Assign roles: Super Admin, HR Admin, HR Staff, Senior Manager, Line Manager, Employee
- Bulk import users via CSV upload
  - **Required CSV fields:** `email`, `first_name`, `last_name`, `role`, `manager_email`, `department`
  - **Optional fields:** `employee_id`, `job_title`, `join_date`
  - **Validation:** Duplicate email check, valid role check, manager existence verification
  - **Error handling:** Row-by-row error report with download link for failed rows
- View user list with filtering and search

#### 5.1.2 Organization Structure Management
- Define reporting lines (Manager → Direct Reports)
- Visualize organization hierarchy as an org chart
- Reassign managers and update reporting structures
- Support multi-level hierarchies

#### 5.1.3 Company Objectives Configuration
- Define company-wide objectives for each review cycle
- Set weighting: Individual KPIs (80%) + Core Values (20%)
- Configure minimum and maximum number of objectives per employee
- Enable/disable objectives per cycle

#### 5.1.4 Core Values Configuration
- Define company core values (e.g., Integrity, Collaboration, Innovation, Customer Focus)
- Set rating criteria/guidelines for each core value
- Core values apply to all employees uniformly

#### 5.1.5 Review Cycle Management
- Create review cycles (Mid-Year, Year-End)
- Set cycle start date, end date, and deadlines for each phase
- Open/close cycles manually or by schedule
- Configure cycle parameters (weights, objectives templates)

#### 5.1.6 Approval Hierarchy Setup
- Define approval workflow steps (e.g., Employee Self-Eval → Manager Review → HR Review → Final)
- Configure escalation rules for overdue approvals:
  - **Escalation triggers:**
    - 3 days overdue: Reminder to manager
    - 5 days overdue: Reminder + escalation notification to HR Admin
    - 7 days overdue: Daily reminders until resolved
  - **Escalation actions:**
    - HR Admin can reassign reviewer
    - HR Admin can complete review on behalf of manager (with notification)
    - Cycle can be marked "at risk" in completion reports
- Enable/disable optional approval levels

#### 5.1.7 Notification Settings (Global)
- Configure notification triggers:
  - Cycle start announcement
  - Deadline reminders (X days before)
  - Submission confirmations
  - Feedback available notification
  - Approval/rejection notifications
- Enable/disable channels per trigger: Email, SMS, MS Teams
- Set reminder frequency

#### 5.1.8 Dashboard & Reports
- View evaluation completion rates by team/department
- Rating distribution charts (1-5 breakdown)
- Export reports to CSV and PDF
- Filter by cycle, department, manager

#### 5.1.9 Audit Log Viewer
- View all system changes with timestamp, user, action, and details
- Filter by user, action type, date range
- Export audit logs for compliance

---

### 5.2 Manager Capabilities

#### 5.2.1 Team Overview Dashboard
- View all direct reports in a list
- Track evaluation status per employee:
  - Not Started
  - Self-Evaluation In Progress
  - Self-Evaluation Completed
  - Manager Review In Progress
  - Manager Review Completed
  - Finalized
- Quick access to each employee's evaluation

#### 5.2.2 Objective Assignment
- Create objectives for each direct report
- Define per objective:
  - Objective ID (auto-generated)
  - Title and description
  - Key Results (KRs)
  - Category (Delivery, Innovation, Quality, Culture)
  - Timeline (Q1-Q4 or custom)
  - Rating criteria for: Meet (3), Above (4), Exceed (5)
- Copy objectives from templates or previous cycles
- Bulk assign same objective to multiple team members

#### 5.2.3 Employee Evaluation
- Review employee's self-evaluation before rating
- Rate each objective on 1-5 scale
- Provide written feedback per objective
- Overall comments section
- Cannot submit until employee completes self-evaluation

#### 5.2.4 Core Values Assessment
- Rate employee on each company core value (1-5)
- Provide justification/comments per value
- Core values rating contributes to 20% of final score

#### 5.2.5 Feedback History
- View past evaluation cycles for each direct report
- Compare ratings across years
- Reference for setting future objectives

#### 5.2.6 Bulk Actions
- Assign same objective to multiple team members
- Send reminder notifications to employees with pending self-evaluations
- Export team evaluation data

---

### 5.3 Employee Capabilities

#### 5.3.1 Personal Dashboard
- View assigned objectives for current cycle
- See deadlines and evaluation status
- Quick access to self-evaluation form
- View manager feedback (when available)

#### 5.3.2 Self-Evaluation
- Rate each assigned objective on 1-5 scale
- Add comments/justification for each rating
- Attach supporting evidence (e.g., links, references)
- Save as draft and submit when ready
- Cannot edit after submission (unless manager rejects)

#### 5.3.3 Document Upload
- Upload supporting files per objective (certificates, screenshots, reports)
- Supported formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG
- Maximum file size: 10MB per file
- Files stored in S3 with secure access

#### 5.3.4 View Feedback
- See manager's ratings after review is completed
- Read manager's comments per objective
- View overall feedback and core values assessment
- Acknowledge receipt of feedback

#### 5.3.5 Historical Records
- View all past evaluation cycles
- See ratings and feedback from previous years
- Download historical evaluation reports

#### 5.3.6 Notifications
- Receive deadline reminders via configured channels
- Get notified when manager feedback is available
- Receive confirmation when self-evaluation is submitted

---

### 5.4 System/Workflow

#### 5.4.1 Self-Evaluation Workflow
- Employee must complete self-evaluation before manager can access review form
- Status transitions: Not Started → In Progress → Completed
- Draft auto-save every 30 seconds

#### 5.4.2 Approval Workflow
- Sequential approvals based on configured hierarchy
- Each approver can: Approve, Reject with comments, Request changes
- Rejection returns to previous step with comments
- Final approval locks the evaluation

#### 5.4.3 Auto-Calculations
- Weighted score = (KPI Score × 0.8) + (Core Values Score × 0.2)
- KPI Score = Average of all objective ratings
- Core Values Score = Average of all core value ratings
- Final Rating = Weighted score (rounded to 2 decimal places)

#### 5.4.4 Bonus & Salary Calculation
- Apply pre-defined formula to final rating (formula configurable by HR Admin)
- Display recommended bonus percentage and salary adjustment
- Visible to HR Admin only (until officially communicated)
- **Note:** Self-evaluations are for reference only and do not affect the final score; only manager ratings contribute to the final weighted score

#### 5.4.5 Deadline Enforcement
- Lock submissions after deadline
- Configurable grace period (e.g., 3 days)
- HR Admin can extend deadline for specific users/teams
- **Consequences of missed deadlines:**
  - After grace period: Evaluation locked; escalation notification sent to employee's manager
  - Manager can request extension from HR Admin with justification
  - Repeated missed deadlines flagged in completion reports for leadership review

#### 5.4.6 Notification Engine
- Template-based email notifications
- SMS integration for critical reminders
- MS Teams webhook notifications
- Scheduled reminders (e.g., 7 days, 3 days, 1 day before deadline)

#### 5.4.7 Localization (i18n)
- Bilingual support: Thai (default) and English
- User can toggle language preference
- Date format: TH (DD/MM/YYYY), EN (MM/DD/YYYY)
- Number format localized
- All UI text, emails, and notifications translated

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Requirement | Target |
|-------------|--------|
| Page load time | < 2 seconds for all pages |
| API response time (standard) | < 500ms for 95% of requests |
| API response time (complex) | < 2 seconds for reports, bulk operations |
| Concurrent users | Support 500 simultaneous active users |
| File upload | Support up to 10MB per file with progress indicator |

### 6.2 Scalability & Availability

| Requirement | Target |
|-------------|--------|
| System uptime | 99.9% availability during review periods |
| Traffic handling | Auto-scaling to handle spikes during deadline days |
| Graceful degradation | Non-critical features (e.g., advanced reports) can degrade without affecting core review workflow |
| Database connections | Connection pooling with max 100 connections |

### 6.3 Security

#### Authentication & Authorization
| Requirement | Details |
|-------------|--------|
| Password hashing | bcrypt with salt rounds ≥ 12 |
| Session management | Secure HTTP-only cookies; JWT tokens with 1-hour expiry; refresh tokens with 7-day expiry |
| Password policy | Minimum 8 characters; 1 uppercase, 1 lowercase, 1 number |
| MFA (future consideration) | Design to support optional TOTP/SMS-based MFA |

#### Data Protection
| Requirement | Details |
|-------------|--------|
| Encryption in transit | TLS 1.3+ for all connections |
| Encryption at rest | Sensitive PII encrypted using AES-256 |
| SQL injection prevention | Parameterized queries via ORM (Prisma/Drizzle) |
| XSS prevention | Input sanitization, output encoding, Content Security Policy headers |
| CSRF prevention | Same-origin cookies + CSRF tokens for state-changing operations |
| File upload security | - File type validation (whitelist only)<br>- Max size enforcement (10MB)<br>- Virus scanning for integration recommended<br>- Randomized filenames in S3 |

#### Access Control
| Requirement | Details |
|-------------|--------|
| RBAC enforcement | Role-based permissions checked at API middleware and UI component level |
| Principle of least privilege | Users only access data required for their role |
| Audit logging | All data access and modifications logged |

### 6.4 Compliance — PDPA (Thailand Personal Data Protection Act)

| Requirement | Details |
|-------------|--------|
| Legal basis | Compliance with PDPA B.E. 2562 (2019) |
| Consent management | Record and manage consent for data processing activities |
| Data minimization | Collect only necessary data; avoid excessive PII collection |
| Right to access | Employees can request export of their personal data |
| Right to correction | Employees can request correction of inaccurate data |
| Right to deletion | Upon termination, employees can request deletion (subject to 5-year retention for audit purposes) |
| Data breach notification | Notify affected parties and PDPC within 72 hours of breach detection |
| Data Protection Officer | Designate DPO contact point for data subject requests (configurable) |
| Cross-border transfer | If data processed outside Thailand, ensure appropriate safeguards |

### 6.5 Data Retention & Backup

| Requirement | Details |
|-------------|--------|
| Retention period | 5 years for evaluation records and audit logs |
| Archival strategy | Move to cold storage after 5 years; retain metadata for compliance |
| Backup frequency | Daily automated backups |
| Backup retention | 30 days for hot backups; 1 year for archived backups |
| Recovery | Point-in-time recovery within 4 hours for data loss |

### 6.6 Browser Support

| Browser | Support Level |
|---------|--------------|
| Chrome (latest 2 versions) | Full support |
| Firefox (latest 2 versions) | Full support |
| Safari (latest 2 versions) | Full support |
| Edge (latest 2 versions) | Full support |
| Mobile Safari (iOS) | Responsive design, full functionality |
| Chrome Mobile (Android) | Responsive design, full functionality |
| IE/Legacy browsers | Not supported |

### 6.7 Accessibility (WCAG 2.1 Level AA)

| Requirement | Details |
|-------------|--------|
| Keyboard navigation | All interactive elements accessible via Tab, Enter, Arrow keys |
| Screen reader support | Proper ARIA labels, roles, and landmarks; semantic HTML structure |
| Color contrast | Minimum 4.5:1 ratio for all text elements |
| Focus indicators | Visible focus states (outline/border) for all interactive elements |
| Form accessibility | All form fields have associated labels; error messages linked via aria-describedby |
| Error handling | Clear, descriptive error messages with resolution suggestions |
| Responsive design | Usable at 320px-1920px viewport widths; no horizontal scrolling |

### 6.8 Rate Limiting

| Scope | Limit |
|-------|-------|
| Standard API (per user) | 100 requests/minute |
| Bulk operations (HR Admin) | 1,000 requests/minute |
| File uploads | 10 uploads/hour per user |
| Failed login attempts | Account lockout after 5 consecutive failures; 15-minute lockout duration |
| CAPTCHA trigger | After 3 consecutive lockouts |

### 6.9 Localization (i18n)

| Requirement | Details |
|-------------|--------|
| Supported languages | Thai (default), English |
| Language toggle | User preference saved; persisted across sessions |
| Date format | TH: DD/MM/YYYY, EN: MM/DD/YYYY |
| Number format | Localized thousand separators, decimal points |
| Text externalization | All UI text in JSON files for translation |
| Email templates | Localized notification templates per language |
| RTL readiness | Architecture supports RTL languages (future expansion) |

### 6.10 Monitoring & Logging

| Requirement | Details |
|-------------|--------|
| Application logs | Structured JSON logging (error, warn, info, debug levels) |
| Error tracking | Automatic error capture with stack traces; integration with monitoring service |
| Performance metrics | Track API response times, database query times, error rates |
| Alerting | Email/Slack alerts on: system errors, performance degradation, security events |
| Health checks | /health endpoint for load balancer; /ready for dependency checks |

---

## 7. Technical Approach

### 7.1 Architecture Overview

| Layer | Technology | Description |
|-------|------------|-------------|
| **Frontend** | Next.js (React) | Server-side rendering (SSR) with App Router |
| **Backend API** | Next.js API Routes | RESTful endpoints for data access and business logic |
| **Database** | PostgreSQL | Managed relational database with connection pooling |
| **File Storage** | Amazon S3 | Bucket: `pms-documents`, secure signed URLs |
| **Authentication** | Custom Auth + SSO | SAML 2.0 / OIDC integration with company IdP |
| **Hosting** | Internal OCP | OpenShift Container Platform (internal infrastructure) |

### 7.2 Database Schema (Key Tables)

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User accounts | id, email, password_hash, role, manager_id, department, created_at, updated_at, deactivated_at |
| `objectives` | Employee objectives | id, cycle_id, employee_id, title, description, krs, category, timeline, created_by |
| `evaluations` | Evaluation records | id, cycle_id, employee_id, objective_id, self_rating, manager_rating, self_comments, manager_feedback, status |
| `cycles` | Review cycles | id, name, type (mid-year/year-end), start_date, end_date, weights, status |
| `core_values` | Company values | id, name, description, rating_criteria |
| `audit_logs` | Change tracking | id, user_id, action, entity_type, entity_id, old_values, new_values, timestamp, ip_address |
| `documents` | Uploaded files | id, objective_id, employee_id, file_name, file_url, file_size, uploaded_at |
| `notifications` | Notification queue | id, user_id, type, channel, subject, message, sent_at |

### 7.3 File Storage (S3)

| Configuration | Value |
|---------------|-------|
| Bucket name | `pms-documents` |
| Access method | Pre-signed URLs (1-hour expiry) |
| File path pattern | `{cycle_id}/{employee_id}/{objective_id}/{filename}` |
| Max file size | 10MB per file |
| Allowed formats | PDF, DOC, DOCX, XLS, XLSX, PNG, JPG |
| Virus scanning | Recommended (future consideration) |

### 7.4 Integrations

#### Email (Built-in)
- SMTP via Nodemailer
- HTML + plain text templates stored in database
- Queue system for bulk emails and scheduled reminders
- DKIM/SPF configuration for deliverability

#### SMS (Local Provider)
- Webhook-based integration (no SDK required)
- Phone number validation (E.164 format)
- Batch sending for cost optimization
- Pay-per-message pricing model

#### MS Teams (Webhooks)
- Incoming webhooks per channel
- Adaptive Cards for rich notifications
- Webhook URLs stored in database (HR Admin-configurable)
- Notification flow: Employee action → POST to webhook → Channel receives card

### 7.5 Authentication & Authorization

| Component | Details |
|-----------|---------|
| SSO Integration | SAML 2.0 or OIDC with company identity provider |
| Session Management | JWT tokens (1-hour expiry) + refresh tokens (7-day expiry) |
| Token Storage | Secure HTTP-only cookies |
| User Provisioning | Auto-provision on first SSO login; scheduled sync for updates |
| RBAC | Role-based permissions enforced at API middleware and UI level |

### 7.6 CI/CD Pipeline (GitLab CI + Jenkins)

```
Pipeline Stages:
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  Lint   │ → │  Test   │ → │  Build  │ → │ Deploy  │
└─────────┘   └─────────┘   └─────────┘   └─────────┘
```

| Stage | Actions |
|-------|---------|
| **Lint** | ESLint, Prettier, TypeScript type check |
| **Test** | Unit tests (Jest), Integration tests, E2E tests (Playwright) |
| **Build** | Next.js production build, Docker image creation |
| **Deploy** | Deploy to staging → Manual approval → Deploy to production |

**Triggers:**
- Push to `main` branch → Full pipeline
- Pull request → Lint + Test only
- Manual trigger → Production deployment

### 7.7 Monitoring & Logging

| Component | Tool | Purpose |
|-----------|------|---------|
| Application monitoring | Internal monitoring tool | Response times, error rates, throughput |
| Logging | Structured JSON (Pino) | Centralized log aggregation |
| Health checks | `/health`, `/ready` endpoints | Load balancer checks |
| Alerting | Email/Slack | System errors, performance degradation |

**Log Retention:**
- Application logs: 30 days
- Performance metrics: 90 days
- Audit logs: 5 years (compliance)

### 7.8 Error Handling

| Component | Approach |
|-----------|----------|
| Global error boundary | React Error Boundary for UI crashes |
| API errors | Structured error responses with error codes |
| User messages | Localized (TH/EN) user-friendly messages |
| Error tracking | Custom error pages with context logging |
| Transaction rollback | Database transactions with automatic rollback on failure |

---

## 8. Timeline & Milestones

### 8.1 Target Launch Date

**October 1, 2026** — Full company-wide launch

### 8.2 Development Phases

| Phase | Duration | Dates | Focus |
|-------|----------|-------|-------|
| **Phase 1: Design & Planning** | 4 weeks | Apr – May 2026 | UI/UX design, database schema, API contracts |
| **Phase 2: Core Development** | 12 weeks | May – Aug 2026 | User management, auth, review cycles, objectives, self-evaluation |
| **Phase 3: Advanced Features** | 8 weeks | Jun – Aug 2026 | Manager review workflow, notifications, reports |
| **Phase 4: Testing & QA** | 4 weeks | Aug – Sep 2026 | Integration testing, E2E testing, bug fixes |
| **Phase 5: UAT** | 4 weeks | Sep 2026 | User acceptance testing with pilot group |
| **Phase 6: Training & Pilot** | 2 weeks | Late Sep 2026 | HR/Admin training, pilot launch |
| **Phase 7: Full Launch** | — | Oct 1, 2026 | Company-wide go-live |

### 8.3 Key Milestones

| Milestone | Target Date | Deliverable |
|-----------|-------------|-------------|
| **M1: Design Complete** | End of May 2026 | UI/UX approved, database schema locked, API contracts finalized |
| **M2: Alpha Release** | Mid Jul 2026 | Core features functional in dev environment |
| **M3: Beta Release** | End of Aug 2026 | All MVP features complete, ready for UAT |
| **M4: UAT Complete** | Mid Sep 2026 | Pilot group signs off on system |
| **M5: Pilot Launch** | Late Sep 2026 | Live for pilot departments (100-200 users) |
| **M6: Full Launch** | Oct 1, 2026 | Company-wide go-live |

### 8.4 MVP Scope (Phase 1)

| Feature | Priority |
|---------|----------|
| User management & authentication | P0 |
| SSO integration | P0 |
| Review cycle configuration | P0 |
| Objective assignment (Manager → Employee) | P0 |
| Self-evaluation workflow | P0 |
| Manager review & rating | P0 |
| Basic notifications (email) | P0 |
| Audit logging | P0 |
| Thai/English localization | P0 |

### 8.5 Phase 2 Features (Post-MVP)

| Feature | Priority | Target |
|---------|----------|--------|
| Advanced reports & dashboards | P1 | Q1 2027 |
| SMS notifications | P1 | Q1 2027 |
| MS Teams notifications | P1 | Q1 2027 |
| Bulk operations | P1 | Q1 2027 |
| Historical analytics | P2 | Q2 2027 |
| Export to PDF/CSV | P2 | Q2 2027 |

### 8.6 Pilot Approach

| Aspect | Details |
|--------|---------|
| **Pilot group** | 1-2 departments (~100-200 users) |
| **Pilot duration** | 2 weeks before full launch |
| **Feedback collection** | Post-pilot survey + user interviews |
| **Success criteria** | 90%+ completion rate, < 5 critical bugs, 3.5+ satisfaction score |
| **Rollback plan** | Revert to Excel if critical issues found |

### 8.7 Resource Allocation

| Role | Count | Allocation |
|------|-------|------------|
| Frontend Developers | 2 | Full-time |
| Backend Developers | 2 | Full-time |
| UI/UX Designer | 1 | Part-time (Phase 1) |
| QA Engineer | 1 | Part-time → Full-time (Phase 4) |
| Product Owner | 1 | Part-time throughout |
| DevOps | 1 | Part-time (CI/CD, infrastructure) |

### 8.8 External Dependencies

| Dependency | Owner | Required By | Status |
|------------|-------|-------------|--------|
| S3 bucket setup | Infrastructure team | Phase 2 | Pending |
| SSO integration | IT/Security team | Phase 2 | Pending |
| SMS provider contract | Procurement | Phase 3 | Pending |
| MS Teams webhook approval | IT | Phase 3 | Pending |

### 8.9 Risk Buffer

- **2-week buffer** built into timeline for unexpected delays
- Buffer allocated between UAT and Pilot Launch
- Can be consumed for: bug fixes, scope changes, dependency delays

---

## 9. Risks & Open Questions

### 9.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| New tech stack learning curve | Medium | Medium | Team training on Next.js 14 App Router; allocate senior dev for code review |
| Infrastructure readiness | Low | High | Early engagement with internal infrastructure team; environment setup in Phase 1 |
| Performance bott | Medium | High | Load testing during UAT; auto-scaling configuration; database optimization |

### 9.2 Adoption Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Change management | High | High | User training sessions; clear documentation; HR champions within each department |
| User training | Medium | Medium | Video tutorials; in-app guidance; help desk support during rollout |
| Manager buy-in | Medium | Medium | Early manager demos; highlight time savings; involve managers in design process |

### 9.3 Timeline Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Resource constraints | Medium | High | 2-week buffer in schedule; cross-training among developers; clear sprint priorities |
| Scope creep | High | High | Strict change control process; weekly stakeholder sync; freeze non-MVP features |
| SSO integration delays | Medium | Medium | Start SSO discussions in Phase 1; fallback to local auth for UAT |

### 9.4 Data Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data migration | Low | Medium | Data validation scripts; dry run migrations; rollback capability |
| Data integrity | Low | High | Database constraints; automated validation; audit logs for all changes |

### 9.5 Integration Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Email deliverability | Low | Medium | DKIM/SPF configuration; email warmup with IT; monitor bounce rates |
| SMS reliability | Medium | Medium | Fallback to email if SMS fails; retry logic; multiple provider options |
| MS Teams webhook failures | Low | Low | Graceful degradation; retry queue; log failures for debugging |

### 9.6 Business Risks
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stakeholder alignment | Medium | High | Weekly sync meetings; documented decisions; clear escalation path for disagreements |
| Budget constraints | Low | Medium | Early cost estimation; phased rollout to spread costs; contingency buffer |
| Scope changes | Medium | Medium | Change request process; impact analysis for all changes; strict MVP definition |

### 9.7 Open Questions (TBD)
| # | Question | Owner | Status |
|---|----------|--------|--------|
| 1 | Bonus/salary formula | HR / Finance | Pending definition |
| 2 | Core values list | HR / Leadership | Pending finalization |
| 3 | Rating scale definitions | HR | Detailed criteria for 1-5 per objective type needed |
| 4 | Notification frequency | HR / IT | Optimal reminder cadence TBD |
| 5 | Historical data import | HR | Whether to migrate past evaluations from Excel |
| 6 | Mobile app requirement | Product | Future consideration (not MVP) |

### 9.8 Risk Mitigation Summary
| Strategy | Description |
|----------|-------------|
| Weekly stakeholder sync | Align HR, Managers, Leadership early and often |
| Phased rollout | Pilot with friendly departments first; gather feedback before full launch |
| Data validation scripts | Automated checks during migration; rollback capability |
| Graceful degradation | System functional even if non-critical features (notifications) fail |
| Buffer time | 2-week buffer in schedule for unforeseen issues |

---

## 10. Impact Analysis

### 10.1 Time Savings

| Stakeholder | Current State | With PMP | Savings |
|-------------|---------------|----------|---------|
| **HR Team** | 200 hours/cycle on administration (consolidation, calculations, chasing managers) | 60 hours/cycle (configuration, support) | **70% reduction** (140 hours saved) |
| **Managers** | 3 hours/employee (spreadsheet distribution, review, feedback, submission) | 1.5 hours/employee (streamlined workflow) | **50% reduction** |
| **Employees** | Multiple email threads, unclear deadlines, manual file uploads | Single interface, clear status, integrated uploads | **30% reduction** |

### 10.2 Error Reduction

| Error Type | Current Impact | With PMP |
|------------|----------------|----------|
| Calculation errors | ~5% of evaluations have formula errors | Zero errors (automated calculations) |
| Incomplete evaluations | ~10% of evaluations incomplete per cycle | Automated tracking, deadline enforcement |
| Data discrepancies | ~3% data entry errors during consolidation | Single source of truth, no manual entry |
| Missing evaluations | ~5% of employees skipped entirely | System tracks all employees, alerts for gaps |

### 10.3 Cost Savings (Quantifiable)

| Cost Category | Current Cost | With PMP | Savings |
|---------------|--------------|----------|---------|
| HR labor (140 hrs saved) | 140 hrs × avg hourly rate | Automated processes | Significant |
| Manager time (thousands of employees × 1.5 hrs) | Manual review overhead | Streamlined interface | High |
| Rework from errors | HR corrections, disputes, recalculations | System-validated data | Moderate |
| Paper/printing | Physical forms, reports | Digital records | Low |
| File storage | Shared drives, email attachments | S3 (organized, backed up) | Low |

### 10.4 Compliance & Risk Mitigation

| Area | Current Risk | With PMP |
|------|--------------|----------|
| Audit trail | No tracking of changes; compliance risk | Full audit logs (5-year retention) |
| Dispute resolution | No clear records for bonus/salary disagreements | Complete history of ratings, feedback, approvals |
| Data security | Shared Excel files, email attachments | Role-based access control, encrypted storage |
| Backup & recovery | Manual, inconsistent | Automated daily backups, point-in-time recovery |
| PDPA compliance | Unclear consent, data handling | Documented consent, data minimization, breach notification |

### 10.5 Employee Satisfaction Impact

| Metric | Current State | Expected Improvement |
|--------|---------------|---------------------|
| Process satisfaction | Low (internal surveys show frustration) | High (transparent, streamlined process) |
| Perceived fairness | Mixed (unclear scoring criteria) | High (visible calculations, consistent standards) |
| Completion rate | ~85% on time | Target: 95%+ on time |
| Complaints to HR | Common (unclear feedback, delayed results) | Reduced (clear status, timely notifications) |

### 10.6 Business Enablement

| Capability | Before PMP | With PMP |
|------------|------------|----------|
| Promotion decisions | Gut feel, limited data | Historical performance data, trends |
| Training needs | Anecdotal, reactive | Aggregate data identifies skill gaps proactively |
| Retention analysis | Exit interviews only | Correlation between satisfaction and turnover |
| Succession planning | Ad-hoc identification | Data-driven high performer identification |
| Compensation planning | Manual spreadsheets, delayed | Automated calculations, faster decisions |

### 10.7 ROI Estimate

| Factor | Estimate |
|--------|----------|
| **Development cost** | 4 developers × 7 months (labor) + infrastructure setup |
| **Annual infrastructure** | OCP hosting + S3 + integrations (email, SMS) |
| **Time savings value** | 140 HR hours + manager hours per cycle × 2 cycles/year |
| **Error reduction value** | Reduced rework, disputes, corrections |
| **Payback period** | **1-2 years** based on time savings and error reduction |

### 10.8 Intangible Benefits

| Benefit | Description |
|---------|-------------|
| **Data-driven culture** | Decisions based on metrics, not gut feel; visible KPIs across organization |
| **Fairness perception** | Transparent scoring process builds trust in performance management |
| **Manager effectiveness** | Better conversations with data-backed feedback; clearer expectations |
| **Employee growth** | Clear objectives → clearer career development path |
| **Company modernization** | Signals investment in people operations; competitive advantage in talent management |

### 10.9 Success Metrics Summary

| Metric | Before | After | Impact |
|--------|--------|-------|--------|
| Review cycle duration | 4-6 weeks | ≤ 2 weeks | Faster compensation decisions |
| HR administrative time | 200 hours/cycle | 60 hours/cycle | 70% efficiency gain |
| Calculation errors | ~5% | 0% | Zero compensation errors |
| Employee satisfaction (review process) | 3.2/5.0 | Target: 4.0+/5.0 | Improved engagement |
| On-time completion rate | ~85% | Target: 95%+ | Better cycle discipline |

---

## Appendix

### A. Example Objectives (FY2026)
See `FY2026_Team_Objectives.docx`

### B. Bonus & Salary Formula

**Note:** The exact formula will be defined by HR/Finance. Below is an example structure:

```
Example Formula (TBD - to be confirmed by HR/Finance):

Bonus Multiplier:
| Final Rating | Bonus Multiplier |
|--------------|------------------|
| 1.0 - 2.0    | 0%               |
| 2.1 - 3.0    | 50% of target   |
| 3.1 - 4.0    | 100% of target  |
| 4.1 - 5.0    | 150% of target  |

Salary Increase:
| Final Rating | Salary Increase |
|--------------|-----------------|
| 1.0 - 2.0    | 0%              |
| 2.1 - 3.0    | 3%              |
| 3.1 - 4.0    | 5%              |
| 4.1 - 5.0    | 8%              |

**Actual formula to be confirmed before Year-End 2026 cycle.**

---

*Document generated via doc-coauthoring workflow*
