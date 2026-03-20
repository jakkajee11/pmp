# API Contracts: Performance Metrics Portal

**Version**: 1.0.0
**Date**: 2026-03-18

## Overview

RESTful API following resource-oriented design. All endpoints return JSON with consistent response format.

### Base URL

```
Production: https://pmp.company.com/api
Development: http://localhost:3000/api
```

### Authentication

All endpoints require OIDC Bearer token unless marked as public.

```
Authorization: Bearer <jwt_token>
```

### Response Format

```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: object
  }
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (version mismatch, duplicate) |
| 422 | Unprocessable Entity (business rule violation) |
| 500 | Internal Server Error |

---

## Authentication Endpoints

### POST /api/auth/callback

OIDC callback endpoint (handled by NextAuth.js).

**Response**: Session cookie set, redirect to dashboard.

### GET /api/auth/session

Get current session.

**Response**:
```typescript
{
  success: true,
  data: {
    user: {
      id: string,
      email: string,
      name: string,
      role: string,
      language: string
    },
    expires: string
  }
}
```

### POST /api/auth/signout

Sign out current user.

**Response**: Session cleared, redirect to login.

---

## User Endpoints

### GET /api/users

List users (HR Admin only).

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 20, max: 100) |
| role | string | Filter by role |
| department_id | string | Filter by department |
| search | string | Search by name or email |
| is_active | boolean | Filter by active status |

**Response**:
```typescript
{
  success: true,
  data: {
    users: [{
      id: string,
      email: string,
      name: string,
      role: string,
      department: { id: string, name: string },
      manager: { id: string, name: string } | null,
      is_active: boolean,
      created_at: string
    }],
    pagination: {
      page: number,
      limit: number,
      total: number,
      total_pages: number
    }
  }
}
```

### GET /api/users/:id

Get user by ID.

**Permissions**: HR Admin, own profile, or manager of user.

**Response**:
```typescript
{
  success: true,
  data: {
    id: string,
    email: string,
    name: string,
    name_th: string | null,
    role: string,
    manager_id: string | null,
    manager: { id: string, name: string } | null,
    department_id: string | null,
    department: { id: string, name: string } | null,
    language: string,
    is_active: boolean,
    direct_reports_count: number,
    created_at: string,
    updated_at: string
  }
}
```

### POST /api/users

Create user (HR Admin only).

**Request**:
```typescript
{
  email: string,        // required, valid email
  name: string,         // required, max 255 chars
  name_th: string,      // optional
  role: string,         // required, valid role enum
  manager_id: string,   // optional, valid user id
  department_id: string // optional, valid department id
}
```

**Response**: 201 Created with user object.

### PUT /api/users/:id

Update user (HR Admin only).

**Request**: Same as POST, all fields optional.

**Response**: Updated user object.

### POST /api/users/import

Bulk import users via CSV (HR Admin only).

**Request**: multipart/form-data with CSV file.

**Response**:
```typescript
{
  success: true,
  data: {
    imported: number,
    skipped: number,
    errors: [{
      row: number,
      email: string,
      error: string
    }]
  }
}
```

### PUT /api/users/:id/language

Update user language preference (own profile only).

**Request**:
```typescript
{
  language: "en" | "th"
}
```

---

## Department Endpoints

### GET /api/departments

List departments.

**Response**:
```typescript
{
  success: true,
  data: {
    departments: [{
      id: string,
      name: string,
      name_th: string | null,
      parent_id: string | null,
      employee_count: number,
      created_at: string
    }]
  }
}
```

### GET /api/departments/tree

Get department hierarchy tree.

**Response**:
```typescript
{
  success: true,
  data: {
    id: string,
    name: string,
    children: [{ /* recursive */ }]
  }
}
```

### POST /api/departments

Create department (HR Admin only).

**Request**:
```typescript
{
  name: string,
  name_th: string,
  parent_id: string
}
```

---

## Review Cycle Endpoints

### GET /api/cycles

List review cycles.

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by status (draft, active, closed) |
| type | string | Filter by type (mid_year, year_end) |

**Response**:
```typescript
{
  success: true,
  data: {
    cycles: [{
      id: string,
      name: string,
      type: string,
      start_date: string,
      end_date: string,
      status: string,
      self_eval_deadline: string,
      manager_review_deadline: string,
      completion_stats: {
        total_employees: number,
        self_eval_completed: number,
        manager_review_completed: number
      },
      created_at: string
    }]
  }
}
```

### GET /api/cycles/active

Get currently active cycle.

**Response**: Single cycle object or 404.

### POST /api/cycles

Create review cycle (HR Admin only).

**Request**:
```typescript
{
  name: string,
  type: "mid_year" | "year_end",
  start_date: string,      // ISO date
  end_date: string,        // ISO date
  self_eval_deadline: string,
  manager_review_deadline: string,
  grace_period_days: number,
  weights_config: {
    kpi: number,           // default 0.8
    core_values: number    // default 0.2
  }
}
```

### PUT /api/cycles/:id

Update cycle (HR Admin only, draft status only).

**Request**: Same as POST, all fields optional.

### POST /api/cycles/:id/activate

Activate cycle (HR Admin only).

**Preconditions**:
- Cycle must be in draft status
- No other active cycle exists
- Start date reached or passed

**Response**: Updated cycle with status "active".

### POST /api/cycles/:id/close

Close cycle (HR Admin only).

**Response**: Updated cycle with status "closed".

### POST /api/cycles/:id/extensions

Grant deadline extension (HR Admin only).

**Request**:
```typescript
{
  user_ids: string[],     // users to extend
  extension_type: "self_eval" | "manager_review",
  new_deadline: string    // ISO date
}
```

---

## Objective Endpoints

### GET /api/objectives

List objectives.

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| cycle_id | string | Filter by cycle |
| assigned_to | string | Filter by employee (manager only) |
| category | string | Filter by category |
| created_by | string | Filter by creator |

**Response**:
```typescript
{
  success: true,
  data: {
    objectives: [{
      id: string,
      title: string,
      description: string,
      key_results: string | null,
      category: string,
      timeline: string,
      assigned_to: { id: string, name: string },
      cycle: { id: string, name: string },
      evaluation_status: string,
      created_at: string
    }]
  }
}
```

### GET /api/objectives/:id

Get objective details.

**Response**:
```typescript
{
  success: true,
  data: {
    id: string,
    title: string,
    description: string,
    key_results: string | null,
    category: string,
    timeline: string,
    rating_1_desc: string,
    rating_2_desc: string,
    rating_3_desc: string,
    rating_4_desc: string,
    rating_5_desc: string,
    assigned_to: { id: string, name: string, email: string },
    cycle: { id: string, name: string, type: string },
    created_by: { id: string, name: string },
    documents: [{
      id: string,
      file_name: string,
      file_size: number,
      uploaded_at: string
    }],
    evaluation: {
      self_rating: number | null,
      self_comments: string | null,
      manager_rating: number | null,
      manager_feedback: string | null,
      status: string
    },
    created_at: string,
    updated_at: string
  }
}
```

### POST /api/objectives

Create objective (Manager only, for direct reports).

**Request**:
```typescript
{
  title: string,
  description: string,
  key_results: string,
  category: "delivery" | "innovation" | "quality" | "culture",
  timeline: string,
  rating_1_desc: string,
  rating_2_desc: string,
  rating_3_desc: string,
  rating_4_desc: string,
  rating_5_desc: string,
  assigned_to: string,    // must be direct report
  cycle_id: string
}
```

### POST /api/objectives/bulk

Bulk assign objectives (Manager only).

**Request**:
```typescript
{
  objective_template: {
    title: string,
    description: string,
    // ... same as POST /api/objectives
  },
  assigned_to: string[]   // array of user ids (direct reports)
}
```

### POST /api/objectives/:id/copy

Copy objective from template or previous cycle.

**Request**:
```typescript
{
  source_objective_id: string,
  assigned_to: string,    // new assignee
  cycle_id: string        // target cycle
}
```

### PUT /api/objectives/:id

Update objective (Manager only, before evaluation starts).

**Request**: Same fields as POST, all optional.

### DELETE /api/objectives/:id

Delete objective (Manager only, before evaluation starts).

---

## Evaluation Endpoints

### GET /api/evaluations

List evaluations.

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| cycle_id | string | Filter by cycle |
| employee_id | string | Filter by employee |
| status | string | Filter by status |
| type | string | Filter by type (kpi, core_value) |

**Response**:
```typescript
{
  success: true,
  data: {
    evaluations: [{
      id: string,
      employee: { id: string, name: string },
      cycle: { id: string, name: string },
      evaluation_type: string,
      objective: { id: string, title: string } | null,
      core_value: { id: string, name: string } | null,
      self_rating: number | null,
      manager_rating: number | null,
      status: string,
      updated_at: string
    }]
  }
}
```

### GET /api/evaluations/dashboard

Get evaluation dashboard data.

**For Employee**:
```typescript
{
  success: true,
  data: {
    cycle: { id: string, name: string, status: string },
    self_eval_deadline: string,
    objectives: [{
      id: string,
      title: string,
      category: string,
      evaluation_status: string,
      self_rating: number | null
    }],
    core_values: [{
      id: string,
      name: string,
      evaluation_status: string,
      self_rating: number | null
    }],
    overall_status: string,
    can_submit: boolean
  }
}
```

**For Manager**:
```typescript
{
  success: true,
  data: {
    cycle: { id: string, name: string, status: string },
    team: [{
      id: string,
      name: string,
      self_eval_status: string,
      manager_review_status: string,
      overall_status: string
    }],
    pending_reviews: number,
    completed_reviews: number
  }
}
```

### GET /api/evaluations/:id

Get evaluation details.

**Response**:
```typescript
{
  success: true,
  data: {
    id: string,
    employee: { id: string, name: string, email: string },
    manager: { id: string, name: string },
    cycle: { id: string, name: string },
    evaluation_type: string,
    objective: {
      id: string,
      title: string,
      description: string,
      rating_criteria: {
        1: string,
        2: string,
        3: string,
        4: string,
        5: string
      }
    } | null,
    core_value: {
      id: string,
      name: string,
      description: string,
      rating_criteria: { /* same */ }
    } | null,
    self_rating: number | null,
    self_comments: string | null,
    self_submitted_at: string | null,
    manager_rating: number | null,
    manager_feedback: string | null,
    manager_reviewed_at: string | null,
    status: string,
    version: number,
    created_at: string,
    updated_at: string
  }
}
```

### PUT /api/evaluations/:id/self

Update self-evaluation (Employee only, own evaluations).

**Request**:
```typescript
{
  self_rating: number,      // 1-5
  self_comments: string,
  version: number           // required for optimistic locking
}
```

**Response**: Updated evaluation with incremented version.

### POST /api/evaluations/:id/self/submit

Submit self-evaluation (Employee only).

**Preconditions**:
- All objectives and core values have self ratings
- Cycle is active and before deadline (or in grace period)

**Response**: Evaluation with status "self_submitted".

### PUT /api/evaluations/:id/manager

Update manager review (Manager only, direct reports only).

**Request**:
```typescript
{
  manager_rating: number,   // 1-5
  manager_feedback: string,
  version: number
}
```

### POST /api/evaluations/:id/manager/submit

Submit manager review.

**Preconditions**:
- Self-evaluation submitted
- All ratings provided

### POST /api/evaluations/:id/return

Return evaluation to employee (Manager only).

**Request**:
```typescript
{
  reason: string    // required
}
```

### GET /api/evaluations/summary/:employee_id/:cycle_id

Get evaluation summary with calculated scores.

**Response**:
```typescript
{
  success: true,
  data: {
    employee: { id: string, name: string },
    cycle: { id: string, name: string },
    kpi_evaluations: [{
      objective: { id: string, title: string },
      self_rating: number,
      manager_rating: number
    }],
    core_value_evaluations: [{
      core_value: { id: string, name: string },
      self_rating: number,
      manager_rating: number
    }],
    scores: {
      kpi_score: number,          // average of manager ratings
      core_values_score: number,  // average of manager ratings
      final_score: number         // weighted average
    },
    overall_comments: string | null,
    status: string,
    finalized_at: string | null
  }
}
```

---

## Core Value Endpoints

### GET /api/core-values

List active core values.

**Response**:
```typescript
{
  success: true,
  data: {
    core_values: [{
      id: string,
      name: string,
      name_th: string | null,
      description: string,
      display_order: number
    }]
  }
}
```

### POST /api/core-values

Create core value (HR Admin only).

**Request**:
```typescript
{
  name: string,
  name_th: string,
  description: string,
  rating_1_desc: string,
  rating_2_desc: string,
  rating_3_desc: string,
  rating_4_desc: string,
  rating_5_desc: string,
  display_order: number
}
```

### PUT /api/core-values/:id

Update core value (HR Admin only).

### DELETE /api/core-values/:id

Deactivate core value (HR Admin only, soft delete).

---

## Document Endpoints

### POST /api/documents/upload-url

Get presigned URL for file upload.

**Request**:
```typescript
{
  objective_id: string,
  file_name: string,
  file_type: string,    // MIME type
  file_size: number     // bytes, max 10MB
}
```

**Response**:
```typescript
{
  success: true,
  data: {
    upload_url: string,
    file_key: string,
    expires_at: string
  }
}
```

### POST /api/documents/confirm

Confirm upload completion.

**Request**:
```typescript
{
  objective_id: string,
  file_key: string,
  file_name: string,
  file_size: number,
  mime_type: string
}
```

**Response**: Created document object.

### GET /api/documents/:id/download

Get download URL for document.

**Response**:
```typescript
{
  success: true,
  data: {
    download_url: string,
    expires_at: string
  }
}
```

### DELETE /api/documents/:id

Delete document.

---

## Notification Endpoints

### GET /api/notifications

List user's notifications.

**Response**:
```typescript
{
  success: true,
  data: {
    notifications: [{
      id: string,
      type: string,
      subject: string,
      message: string,
      read: boolean,
      created_at: string
    }]
  }
}
```

### PUT /api/notifications/:id/read

Mark notification as read.

### PUT /api/notifications/read-all

Mark all notifications as read.

### GET /api/notifications/settings

Get notification channel preferences.

### PUT /api/notifications/settings

Update notification channel preferences.

**Request**:
```typescript
{
  channels: {
    cycle_start: ("email" | "sms" | "teams")[],
    deadline_reminder: ("email" | "sms" | "teams")[],
    submission_confirm: ("email" | "sms" | "teams")[],
    feedback_available: ("email" | "sms" | "teams")[]
  }
}
```

---

## Report Endpoints

### GET /api/reports/completion

Get completion rate report (HR Admin, Senior Manager).

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| cycle_id | string | Required |
| department_id | string | Optional |

**Response**:
```typescript
{
  success: true,
  data: {
    cycle: { id: string, name: string },
    overall: {
      total_employees: number,
      self_eval_completed: number,
      self_eval_percentage: number,
      manager_review_completed: number,
      manager_review_percentage: number
    },
    by_department: [{
      department: { id: string, name: string },
      total: number,
      self_eval_completed: number,
      manager_review_completed: number
    }],
    by_status: {
      not_started: number,
      self_in_progress: number,
      self_submitted: number,
      manager_in_progress: number,
      completed: number
    }
  }
}
```

### GET /api/reports/rating-distribution

Get rating distribution (HR Admin only).

**Response**:
```typescript
{
  success: true,
  data: {
    cycle: { id: string, name: string },
    kpi_distribution: {
      1: number,
      2: number,
      3: number,
      4: number,
      5: number
    },
    core_values_distribution: {
      1: number,
      2: number,
      3: number,
      4: number,
      5: number
    },
    final_score_distribution: {
      ranges: [{
        min: number,
        max: number,
        count: number
      }]
    }
  }
}
```

### GET /api/reports/export/csv

Export report as CSV.

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| cycle_id | string | Required |
| report_type | string | completion, ratings, detailed |

**Response**: CSV file download.

### GET /api/reports/export/pdf

Export report as PDF.

**Response**: PDF file download.

---

## Audit Log Endpoints

### GET /api/audit-logs

List audit logs (HR Admin only).

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| user_id | string | Filter by user |
| action | string | Filter by action type |
| entity_type | string | Filter by entity |
| start_date | string | Filter from date |
| end_date | string | Filter to date |
| page | int | Page number |
| limit | int | Items per page |

**Response**:
```typescript
{
  success: true,
  data: {
    logs: [{
      id: string,
      user: { id: string, name: string, email: string },
      action: string,
      entity_type: string,
      entity_id: string,
      old_values: object | null,
      new_values: object | null,
      ip_address: string,
      created_at: string
    }],
    pagination: { /* standard */ }
  }
}
```

### GET /api/audit-logs/export

Export audit logs (HR Admin only).

**Response**: CSV file download.

---

## Org Chart Endpoint

### GET /api/org-chart

Get organization chart data.

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| root_user_id | string | Root of subtree (optional) |
| depth | int | Levels to return (default: 3) |

**Response**:
```typescript
{
  success: true,
  data: {
    id: string,
    name: string,
    role: string,
    department: string,
    direct_reports: [{ /* recursive */ }]
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| AUTH001 | Invalid or expired token |
| AUTH002 | Insufficient permissions |
| AUTH003 | Account deactivated |
| VAL001 | Required field missing |
| VAL002 | Invalid field value |
| VAL003 | Value out of range |
| BIZ001 | Cycle not active |
| BIZ002 | Deadline passed |
| BIZ003 | Self-evaluation not submitted |
| BIZ004 | Version conflict (optimistic lock) |
| BIZ005 | Duplicate entry |
| BIZ006 | Invalid state transition |
| SYS001 | Internal server error |
| SYS002 | Service unavailable |
| SYS003 | Rate limit exceeded |

---

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| Auth | 10 req/min |
| Read (GET) | 100 req/min |
| Write (POST/PUT/DELETE) | 30 req/min |
| Export | 5 req/min |

Rate limit headers included in response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642612800
```
