# Data Model: Performance Metrics Portal

**Date**: 2026-03-18
**Status**: Phase 1 Design

## Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────────┐     ┌──────────────┐
│    User     │────<│  ReviewCycle    │     │  CoreValue   │
│             │     │                 │     │              │
│ id          │     │ id              │     │ id           │
│ email       │     │ name            │     │ name         │
│ name        │     │ type            │     │ description  │
│ role        │     │ start_date      │     │ rating_1..5  │
│ manager_id  │     │ end_date        │     │ is_active    │
│ language    │     │ status          │     └──────────────┘
└─────────────┘     │ weights_config  │            │
      │             └─────────────────┘            │
      │                    │                       │
      │              ┌─────┴─────┐                 │
      │              │           │                 │
      ▼              ▼           ▼                 ▼
┌──────────────┐  ┌───────────────────────────────────────┐
│  Objective   │  │            Evaluation                 │
│              │  │                                       │
│ id           │  │ id                                    │
│ title        │  │ employee_id                           │
│ description  │  │ manager_id                            │
│ key_results  │  │ cycle_id                              │
│ category     │  │ objective_id (nullable)               │
│ timeline     │  │ core_value_id (nullable)              │
│ rating_1..5  │  │ self_rating                           │
│ assigned_to  │  │ self_comments                         │
│ cycle_id     │  │ manager_rating                        │
│ created_by   │  │ manager_feedback                      │
└──────────────┘  │ status                                │
                  │ version                               │
                  │ submitted_at                          │
                  │ reviewed_at                           │
                  └───────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Document    │     │ AuditLog     │     │ Notification │
│              │     │              │     │              │
│ id           │     │ id           │     │ id           │
│ objective_id │     │ user_id      │     │ user_id      │
│ employee_id  │     │ action       │     │ type         │
│ file_name    │     │ entity_type  │     │ channel      │
│ file_key     │     │ entity_id    │     │ subject      │
│ file_size    │     │ old_values   │     │ message      │
│ mime_type    │     │ new_values   │     │ status       │
│ uploaded_at  │     │ ip_address   │     │ sent_at      │
└──────────────┘     │ created_at   │     │ retry_count  │
                     └──────────────┘     └──────────────┘
```

## Entity Definitions

### User

Represents all system users with role-based access.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Primary identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL, indexed | Login email, OIDC subject |
| name | VARCHAR(255) | NOT NULL | Display name |
| name_th | VARCHAR(255) | NULLABLE | Thai name (localization) |
| role | ENUM | NOT NULL | `super_admin`, `hr_admin`, `hr_staff`, `senior_manager`, `line_manager`, `employee` |
| manager_id | UUID | FK → User, NULLABLE | Direct manager reference |
| department_id | UUID | FK → Department, NULLABLE | Department assignment |
| language | ENUM | NOT NULL, DEFAULT 'en' | Preferred language: `en`, `th` |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Account status |
| created_at | TIMESTAMP | NOT NULL, DEFAULT now() | Account creation time |
| updated_at | TIMESTAMP | NOT NULL | Last modification time |

**Indexes**: `email` (unique), `manager_id`, `department_id`

**Business Rules**:
- Super Admin and HR Admin have no manager (manager_id = NULL)
- Role changes trigger audit log entry
- Deactivation preserves evaluation history

---

### Department

Organizational unit for grouping employees.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Department name |
| name_th | VARCHAR(255) | NULLABLE | Thai name |
| parent_id | UUID | FK → Department, NULLABLE | Parent department (for hierarchy) |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last modification time |

**Indexes**: `parent_id`

---

### ReviewCycle

Represents a performance review period.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Display name (e.g., "Mid-Year 2026") |
| type | ENUM | NOT NULL | `mid_year`, `year_end` |
| start_date | DATE | NOT NULL | Cycle start date |
| end_date | DATE | NOT NULL | Cycle end date |
| self_eval_deadline | DATE | NOT NULL | Deadline for self-evaluations |
| manager_review_deadline | DATE | NOT NULL | Deadline for manager reviews |
| grace_period_days | INTEGER | DEFAULT 0 | Days after deadline for late submissions |
| status | ENUM | NOT NULL, DEFAULT 'draft' | `draft`, `active`, `closed` |
| weights_config | JSONB | NOT NULL | `{"kpi": 0.8, "core_values": 0.2}` |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last modification time |

**Indexes**: `status`, `start_date`, `end_date`

**Business Rules**:
- Only one active cycle allowed at a time
- Weights must sum to 1.0
- Deadlines must be within cycle date range
- Cannot delete cycle with existing evaluations

---

### Objective

Performance target assigned to an employee.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| title | VARCHAR(500) | NOT NULL | Objective title |
| description | TEXT | NOT NULL | Detailed description |
| key_results | TEXT | NULLABLE | Key results / success criteria |
| category | ENUM | NOT NULL | `delivery`, `innovation`, `quality`, `culture` |
| timeline | VARCHAR(100) | NOT NULL | Q1, Q2, Q3, Q4, or custom range |
| rating_1_desc | TEXT | NOT NULL | Description for rating 1 |
| rating_2_desc | TEXT | NOT NULL | Description for rating 2 |
| rating_3_desc | TEXT | NOT NULL | Description for rating 3 (Meet) |
| rating_4_desc | TEXT | NOT NULL | Description for rating 4 (Above) |
| rating_5_desc | TEXT | NOT NULL | Description for rating 5 (Exceed) |
| assigned_to | UUID | FK → User, NOT NULL | Employee receiving objective |
| cycle_id | UUID | FK → ReviewCycle, NOT NULL | Review cycle |
| created_by | UUID | FK → User, NOT NULL | Manager who created |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last modification time |

**Indexes**: `assigned_to`, `cycle_id`, `created_by`

**Business Rules**:
- Cannot modify after employee starts self-evaluation
- Copied objectives retain reference to source

---

### CoreValue

Company cultural values for assessment.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| name | VARCHAR(255) | NOT NULL | Value name |
| name_th | VARCHAR(255) | NULLABLE | Thai name |
| description | TEXT | NOT NULL | Description |
| rating_1_desc | TEXT | NOT NULL | Description for rating 1 |
| rating_2_desc | TEXT | NOT NULL | Description for rating 2 |
| rating_3_desc | TEXT | NOT NULL | Description for rating 3 |
| rating_4_desc | TEXT | NOT NULL | Description for rating 4 |
| rating_5_desc | TEXT | NOT NULL | Description for rating 5 |
| display_order | INTEGER | NOT NULL | Order in evaluation form |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Active status |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last modification time |

**Business Rules**:
- Deactivation affects new evaluations only
- Display order determines form presentation

---

### Evaluation

Core entity for performance assessments.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| employee_id | UUID | FK → User, NOT NULL | Employee being evaluated |
| manager_id | UUID | FK → User, NOT NULL | Manager performing review |
| cycle_id | UUID | FK → ReviewCycle, NOT NULL | Review cycle |
| objective_id | UUID | FK → Objective, NULLABLE | Link to objective (KPI eval) |
| core_value_id | UUID | FK → CoreValue, NULLABLE | Link to core value (values eval) |
| evaluation_type | ENUM | NOT NULL | `kpi`, `core_value` |
| self_rating | INTEGER | CHECK (1-5), NULLABLE | Employee's self rating |
| self_comments | TEXT | NULLABLE | Employee's self comments |
| self_submitted_at | TIMESTAMP | NULLABLE | When self-eval submitted |
| manager_rating | INTEGER | CHECK (1-5), NULLABLE | Manager's rating |
| manager_feedback | TEXT | NULLABLE | Manager's feedback |
| manager_reviewed_at | TIMESTAMP | NULLABLE | When manager completed |
| status | ENUM | NOT NULL, DEFAULT 'not_started' | `not_started`, `self_in_progress`, `self_submitted`, `manager_in_progress`, `completed`, `returned` |
| version | INTEGER | NOT NULL, DEFAULT 1 | Optimistic lock version |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last modification time |

**Indexes**: `employee_id`, `manager_id`, `cycle_id`, `(employee_id, cycle_id, objective_id)`, `(employee_id, cycle_id, core_value_id)`

**Business Rules**:
- Each employee has one KPI evaluation per objective per cycle
- Each employee has one CoreValue evaluation per value per cycle
- Self-evaluation required before manager review
- Status transitions follow defined workflow
- Version incremented on every update

---

### EvaluationSummary

Aggregated scores per employee per cycle.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| employee_id | UUID | FK → User, NOT NULL | Employee |
| cycle_id | UUID | FK → ReviewCycle, NOT NULL | Review cycle |
| overall_comments | TEXT | NULLABLE | Manager's overall comments |
| kpi_score | DECIMAL(5,2) | NULLABLE | Average of KPI ratings |
| core_values_score | DECIMAL(5,2) | NULLABLE | Average of value ratings |
| final_score | DECIMAL(5,2) | NULLABLE | Weighted final score |
| bonus_recommendation | VARCHAR(100) | NULLABLE | HR-only field |
| salary_adjustment | VARCHAR(100) | NULLABLE | HR-only field |
| status | ENUM | NOT NULL | `in_progress`, `completed`, `approved` |
| finalized_at | TIMESTAMP | NULLABLE | When completed |
| created_at | TIMESTAMP | NOT NULL | Creation time |
| updated_at | TIMESTAMP | NOT NULL | Last modification time |

**Indexes**: `(employee_id, cycle_id)` UNIQUE

---

### Document

Supporting files uploaded by employees.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| objective_id | UUID | FK → Objective, NOT NULL | Linked objective |
| employee_id | UUID | FK → User, NOT NULL | Uploader |
| file_name | VARCHAR(255) | NOT NULL | Original filename |
| file_key | VARCHAR(500) | NOT NULL | S3 object key |
| file_size | INTEGER | NOT NULL | Size in bytes |
| mime_type | VARCHAR(100) | NOT NULL | MIME type |
| uploaded_at | TIMESTAMP | NOT NULL | Upload timestamp |

**Indexes**: `objective_id`, `employee_id`

**Business Rules**:
- Max file size: 10MB
- Allowed types: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG
- Deleted with objective (cascade)

---

### AuditLog

Comprehensive change tracking.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| user_id | UUID | FK → User, NOT NULL | User who performed action |
| action | ENUM | NOT NULL | `create`, `update`, `delete`, `view` |
| entity_type | VARCHAR(100) | NOT NULL | Entity name (e.g., "Evaluation") |
| entity_id | UUID | NOT NULL | Entity identifier |
| old_values | JSONB | NULLABLE | Previous state |
| new_values | JSONB | NULLABLE | New state |
| ip_address | VARCHAR(45) | NOT NULL | Client IP (IPv4/IPv6) |
| user_agent | VARCHAR(500) | NULLABLE | Browser user agent |
| created_at | TIMESTAMP | NOT NULL | Log timestamp |

**Indexes**: `user_id`, `entity_type`, `entity_id`, `created_at`

**Business Rules**:
- Immutable (no updates or deletes)
- Retained for 5 years minimum
- No PII in old_values/new_values (use IDs only)

---

### Notification

Outgoing messages to users.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Primary identifier |
| user_id | UUID | FK → User, NOT NULL | Recipient |
| type | ENUM | NOT NULL | `cycle_start`, `deadline_reminder`, `submission_confirm`, `feedback_available`, `escalation` |
| channel | ENUM | NOT NULL | `email`, `sms`, `teams` |
| subject | VARCHAR(500) | NOT NULL | Message subject |
| message | TEXT | NOT NULL | Message body |
| status | ENUM | NOT NULL, DEFAULT 'pending' | `pending`, `sent`, `failed` |
| sent_at | TIMESTAMP | NULLABLE | Send timestamp |
| retry_count | INTEGER | DEFAULT 0 | Retry attempts |
| error_message | TEXT | NULLABLE | Failure reason |
| created_at | TIMESTAMP | NOT NULL | Creation time |

**Indexes**: `user_id`, `status`, `created_at`

**Business Rules**:
- Max 3 retry attempts
- Exponential backoff: 1min, 5min, 15min
- Failed notifications logged, don't block workflow

---

## State Transitions

### Evaluation Status Flow

```
not_started → self_in_progress → self_submitted → manager_in_progress → completed
                    ↑                   │                  │
                    └───────────────────┴──────────────────┘
                              (returned by manager)
```

| Transition | Trigger | Guard Condition |
|------------|---------|-----------------|
| not_started → self_in_progress | Employee opens form | Cycle is active |
| self_in_progress → self_submitted | Employee submits | All required fields filled |
| self_submitted → manager_in_progress | Manager opens review | Manager assigned to employee |
| manager_in_progress → completed | Manager submits | All ratings provided |
| self_submitted → self_in_progress | Manager returns | Manager action with reason |
| manager_in_progress → self_in_progress | Manager returns | Manager action with reason |

### ReviewCycle Status Flow

```
draft → active → closed
```

| Transition | Trigger | Guard Condition |
|------------|---------|-----------------|
| draft → active | HR Admin activates | Start date reached, deadlines set |
| active → closed | HR Admin closes or auto-close | End date passed |

---

## Validation Rules

### User
- Email must match company domain (OIDC enforced)
- Role must be valid enum value
- Cannot set self as manager

### Objective
- Timeline must be valid format (Q1-Q4 or date range)
- Rating descriptions required for all 5 levels

### Evaluation
- Self rating: 1-5 integer only
- Manager rating: 1-5 integer only
- Cannot change self evaluation after submission
- Cannot change manager review after completion

### ReviewCycle
- Start date < End date
- Deadlines within date range
- Weights sum to 1.0
- Only one active cycle allowed

---

## Prisma Schema (Draft)

```prisma
enum Role {
  SUPER_ADMIN
  HR_ADMIN
  HR_STAFF
  SENIOR_MANAGER
  LINE_MANAGER
  EMPLOYEE
}

enum CycleType {
  MID_YEAR
  YEAR_END
}

enum CycleStatus {
  DRAFT
  ACTIVE
  CLOSED
}

enum ObjectiveCategory {
  DELIVERY
  INNOVATION
  QUALITY
  CULTURE
}

enum EvaluationType {
  KPI
  CORE_VALUE
}

enum EvaluationStatus {
  NOT_STARTED
  SELF_IN_PROGRESS
  SELF_SUBMITTED
  MANAGER_IN_PROGRESS
  COMPLETED
  RETURNED
}

enum NotificationType {
  CYCLE_START
  DEADLINE_REMINDER
  SUBMISSION_CONFIRM
  FEEDBACK_AVAILABLE
  ESCALATION
}

enum NotificationChannel {
  EMAIL
  SMS
  TEAMS
}

enum NotificationStatus {
  PENDING
  SENT
  FAILED
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  name          String
  nameTh        String?
  role          Role
  managerId     String?
  manager       User?     @relation("ManagerReports", fields: [managerId], references: [id])
  directReports User[]    @relation("ManagerReports")
  departmentId  String?
  department    Department? @relation(fields: [departmentId], references: [id])
  language      String    @default("en")
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([managerId])
  @@index([departmentId])
}

model Department {
  id        String       @id @default(uuid())
  name      String
  nameTh    String?
  parentId  String?
  parent    Department?  @relation("DeptHierarchy", fields: [parentId], references: [id])
  children  Department[] @relation("DeptHierarchy")
  users     User[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@index([parentId])
}

model ReviewCycle {
  id                    String   @id @default(uuid())
  name                  String
  type                  CycleType
  startDate             DateTime @db.Date
  endDate               DateTime @db.Date
  selfEvalDeadline      DateTime @db.Date
  managerReviewDeadline DateTime @db.Date
  gracePeriodDays       Int      @default(0)
  status                CycleStatus @default(DRAFT)
  weightsConfig         Json
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  objectives   Objective[]
  evaluations  Evaluation[]

  @@index([status])
  @@index([startDate, endDate])
}

model Objective {
  id             String           @id @default(uuid())
  title          String
  description    String           @db.Text
  keyResults     String?          @db.Text
  category       ObjectiveCategory
  timeline       String
  rating1Desc    String           @db.Text
  rating2Desc    String           @db.Text
  rating3Desc    String           @db.Text
  rating4Desc    String           @db.Text
  rating5Desc    String           @db.Text
  assignedTo     String
  employee       User             @relation(fields: [assignedTo], references: [id])
  cycleId        String
  cycle          ReviewCycle      @relation(fields: [cycleId], references: [id])
  createdBy      String
  creator        User             @relation("ObjectiveCreator", fields: [createdBy], references: [id])
  documents      Document[]
  evaluations    Evaluation[]
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([assignedTo])
  @@index([cycleId])
  @@index([createdBy])
}

model CoreValue {
  id            String   @id @default(uuid())
  name          String
  nameTh        String?
  description   String   @db.Text
  rating1Desc   String   @db.Text
  rating2Desc   String   @db.Text
  rating3Desc   String   @db.Text
  rating4Desc   String   @db.Text
  rating5Desc   String   @db.Text
  displayOrder  Int
  isActive      Boolean  @default(true)
  evaluations   Evaluation[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Evaluation {
  id                String           @id @default(uuid())
  employeeId        String
  employee          User             @relation("EmployeeEvaluations", fields: [employeeId], references: [id])
  managerId         String
  manager           User             @relation("ManagerEvaluations", fields: [managerId], references: [id])
  cycleId           String
  cycle             ReviewCycle      @relation(fields: [cycleId], references: [id])
  objectiveId       String?
  objective         Objective?       @relation(fields: [objectiveId], references: [id])
  coreValueId       String?
  coreValue         CoreValue?       @relation(fields: [coreValueId], references: [id])
  evaluationType    EvaluationType
  selfRating        Int?
  selfComments      String?          @db.Text
  selfSubmittedAt   DateTime?
  managerRating     Int?
  managerFeedback   String?          @db.Text
  managerReviewedAt DateTime?
  status            EvaluationStatus @default(NOT_STARTED)
  version           Int              @default(1)
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt

  @@index([employeeId])
  @@index([managerId])
  @@index([cycleId])
  @@unique([employeeId, cycleId, objectiveId])
  @@unique([employeeId, cycleId, coreValueId])
}

model EvaluationSummary {
  id                   String   @id @default(uuid())
  employeeId           String
  cycleId              String
  overallComments      String?  @db.Text
  kpiScore             Decimal? @db.Decimal(5, 2)
  coreValuesScore      Decimal? @db.Decimal(5, 2)
  finalScore           Decimal? @db.Decimal(5, 2)
  bonusRecommendation  String?
  salaryAdjustment     String?
  status               String   @default("in_progress")
  finalizedAt          DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@unique([employeeId, cycleId])
}

model Document {
  id           String   @id @default(uuid())
  objectiveId  String
  objective    Objective @relation(fields: [objectiveId], references: [id], onDelete: Cascade)
  employeeId   String
  fileName     String
  fileKey      String
  fileSize     Int
  mimeType     String
  uploadedAt   DateTime @default(now())

  @@index([objectiveId])
  @@index([employeeId])
}

model AuditLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String
  entityType  String
  entityId    String
  oldValues   Json?
  newValues   Json?
  ipAddress   String
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
}

model Notification {
  id           String             @id @default(uuid())
  userId       String
  user         User               @relation(fields: [userId], references: [id])
  type         NotificationType
  channel      NotificationChannel
  subject      String
  message      String             @db.Text
  status       NotificationStatus @default(PENDING)
  sentAt       DateTime?
  retryCount   Int                @default(0)
  errorMessage String?            @db.Text
  createdAt    DateTime           @default(now())

  @@index([userId])
  @@index([status])
  @@index([createdAt])
}
```

---

## Performance Considerations

1. **Indexes**: All foreign keys and frequently queried fields indexed
2. **Partitioning**: AuditLog partitioned by year (for 5-year retention management)
3. **Soft Deletes**: Users soft-deleted (is_active flag), never hard delete
4. **Connection Pooling**: Prisma connection pool configured for 500 concurrent users
5. **JSONB**: Used for flexible config storage (weights_config, old_values, new_values)
