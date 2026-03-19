# Feature Specification: Performance Metrics Portal

**Feature Branch**: `001-performance-management-system`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "Performance Metrics Portal (PMP) - A web-based application to modernize the annual performance review process"

## Clarifications

### Session 2026-03-18

- Q: What is the preferred technology stack for the Performance Metrics Portal? → A: Node.js/TypeScript + PostgreSQL (cloud hosting)
- Q: Which SSO protocol should the system support for integration with the company identity provider? → A: OIDC only (OpenID Connect)
- Q: What observability approach should the system use for monitoring and troubleshooting? → A: Basic application logs only (file-based)
- Q: What is the expected organization size (employee count) for the initial deployment? → A: Medium: 500 - 2,000 employees
- Q: How should the system handle external notification service failures (SMS, MS Teams, Email)? → A: Queue notifications with retry (3 attempts), log failures, continue without blocking user

## Technical Constraints

- **TC-001**: Backend: Node.js with TypeScript
- **TC-002**: Database: PostgreSQL
- **TC-003**: Hosting: Cloud platform (AWS, Azure, or GCP)
- **TC-004**: Frontend: To be determined during planning phase
- **TC-005**: Observability: File-based application logs (no external monitoring infrastructure)
- **TC-006**: Scale: 500 - 2,000 employees; estimated 5-10 objectives per employee per cycle

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Employee Self-Evaluation (Priority: P1)

As an employee, I want to complete my performance self-evaluation through a digital interface so that I can provide input on my achievements and development needs before my manager reviews my performance.

**Why this priority**: This is the foundational workflow of the entire system. Without self-evaluations, managers cannot complete their reviews, and the entire performance cycle stalls. This directly addresses the core pain point of the manual Excel-based process.

**Independent Test**: Can be fully tested by logging in as an employee, viewing assigned objectives, rating each one on a 1-5 scale, adding comments, saving as draft, and submitting the evaluation. Delivers immediate value by replacing the manual spreadsheet process for employees.

**Acceptance Scenarios**:

1. **Given** an employee has assigned objectives for the current review cycle, **When** they access the self-evaluation form, **Then** they see all objectives with rating options (1-5 scale) and comment fields for each
2. **Given** an employee is completing their self-evaluation, **When** they save as draft, **Then** their progress is preserved and they can continue later
3. **Given** an employee has completed their self-evaluation, **When** they submit it, **Then** it is locked for editing and their manager receives a notification to begin review
4. **Given** an employee submits their self-evaluation, **When** they try to edit it again, **Then** the system prevents changes unless the manager rejects and returns it
5. **Given** an employee is on a slow network connection, **When** they are typing in comment fields, **Then** auto-save occurs every 30 seconds to prevent data loss

---

### User Story 2 - Manager Review & Rating (Priority: P1)

As a manager, I want to review my direct reports' self-evaluations and provide my own ratings and feedback so that I can complete the performance assessment for each team member.

**Why this priority**: This is the critical second half of the review workflow. Without manager reviews, employees receive no feedback and the evaluation cycle cannot be completed. This enables the core value proposition of providing structured, documented feedback.

**Independent Test**: Can be fully tested by logging in as a manager, viewing the team dashboard with all direct reports' status, accessing a completed self-evaluation, rating each objective independently (1-5 scale), providing written feedback, and submitting the review.

**Acceptance Scenarios**:

1. **Given** a manager has direct reports with completed self-evaluations, **When** they access the team dashboard, **Then** they see each employee's status (Not Started, In Progress, Completed)
2. **Given** a manager opens an employee's evaluation, **When** they view the self-evaluation, **Then** they see the employee's self-ratings and comments before providing their own ratings
3. **Given** a manager is reviewing an employee, **When** they rate each objective on 1-5 scale, **Then** the system automatically calculates the weighted KPI score (80% weight)
4. **Given** a manager is reviewing an employee, **When** they rate core values on 1-5 scale, **Then** the system automatically calculates the weighted core values score (20% weight)
5. **Given** a manager has rated all objectives and core values, **When** they view the final score, **Then** the weighted average is displayed (KPI 80% + Core Values 20%)
6. **Given** an employee has not completed their self-evaluation, **When** the manager tries to access the review form, **Then** the system prevents access and shows a "waiting for self-evaluation" message

---

### User Story 3 - HR Admin Cycle Configuration (Priority: P1)

As an HR administrator, I want to configure and manage review cycles so that the organization can conduct structured performance reviews with clear timelines and deadlines.

**Why this priority**: Without proper cycle configuration, the system cannot operate. HR needs to define when cycles start, end, and what deadlines apply to each phase. This is a prerequisite for all evaluation activities.

**Independent Test**: Can be fully tested by logging in as HR Admin, creating a new review cycle (Mid-Year or Year-End), setting start/end dates, configuring phase deadlines, and activating the cycle. Other users can then see and participate in the active cycle.

**Acceptance Scenarios**:

1. **Given** an HR Admin accesses the cycle management interface, **When** they create a new review cycle, **Then** they can specify cycle name, type (Mid-Year/Year-End), start date, end date, and phase deadlines
2. **Given** a review cycle is created, **When** HR Admin sets deadlines, **Then** they can configure separate deadlines for self-evaluation phase and manager review phase
3. **Given** a review cycle is configured, **When** HR Admin opens the cycle, **Then** all employees and managers receive notifications and can begin their respective workflows
4. **Given** a review cycle has deadlines, **When** the deadline passes, **Then** submissions are locked unless a grace period is configured
5. **Given** HR Admin needs to extend a deadline, **When** they grant an extension for a specific user or team, **Then** those users can continue submissions beyond the original deadline

---

### User Story 4 - User & Organization Management (Priority: P1)

As an HR administrator, I want to manage user accounts and organizational hierarchy so that the system reflects the correct reporting relationships and access permissions.

**Why this priority**: The entire permission model and workflow depends on accurate organizational structure. Managers can only see their direct reports, and the review workflow follows the reporting hierarchy. This must be in place before any evaluations can occur.

**Independent Test**: Can be fully tested by logging in as HR Admin, creating new user accounts individually and via CSV bulk import, assigning roles, setting up reporting relationships (manager-direct report links), and viewing the org chart visualization.

**Acceptance Scenarios**:

1. **Given** an HR Admin accesses user management, **When** they create a new user, **Then** they can assign email, name, role (HR Admin, HR Staff, Senior Manager, Line Manager, Employee), and manager
2. **Given** an HR Admin needs to add multiple users, **When** they upload a CSV file with user data, **Then** the system validates and imports all valid records, reporting any errors
3. **Given** a user's role changes, **When** HR Admin updates the role, **Then** the user's permissions immediately reflect the new role
4. **Given** an employee transfers to a new manager, **When** HR Admin updates the reporting relationship, **Then** the new manager inherits ongoing evaluations and the previous manager's feedback is preserved
5. **Given** an HR Admin views the organization, **When** they access the org chart, **Then** they see a visual hierarchy showing all reporting relationships

---

### User Story 5 - Objective Assignment (Priority: P1)

As a manager, I want to create and assign objectives to my direct reports so that employees have clear performance targets for the review period.

**Why this priority**: Objectives are the foundation of performance evaluation. Without defined objectives, employees cannot self-evaluate, and managers cannot rate performance. This is a prerequisite for the evaluation workflow.

**Independent Test**: Can be fully tested by logging in as a manager, creating objectives for each direct report with title, description, key results, category, timeline, and rating criteria, and verifying employees can see their assigned objectives.

**Acceptance Scenarios**:

1. **Given** a manager accesses objective assignment, **When** they create a new objective, **Then** they can specify title, description, key results, category (Delivery, Innovation, Quality, Culture), timeline (Q1-Q4 or custom), and rating criteria
2. **Given** a manager wants to assign similar objectives to multiple team members, **When** they use bulk assignment, **Then** the same objective is copied to all selected employees
3. **Given** a manager has objectives from a previous cycle, **When** they copy objectives, **Then** the system duplicates them for the current cycle with the ability to edit
4. **Given** a manager assigns an objective, **When** the employee logs in, **Then** they see the new objective in their dashboard
5. **Given** an objective is assigned with rating criteria, **When** the employee or manager views it, **Then** they see clear descriptions of what constitutes Meet (3), Above (4), and Exceed (5) ratings

---

### User Story 6 - Core Values Assessment (Priority: P2)

As a manager, I want to assess my direct reports on company core values so that cultural fit and behavioral competencies contribute to the overall performance rating.

**Why this priority**: Core values represent 20% of the final score and are important for holistic performance evaluation, but the system can function with KPI-only evaluations initially. This adds important cultural assessment capabilities.

**Independent Test**: Can be fully tested by HR Admin defining company core values with rating criteria, then managers rating employees on each value during the review process, and the system including this in the weighted final score.

**Acceptance Scenarios**:

1. **Given** HR Admin has defined company core values (e.g., Integrity, Collaboration, Innovation), **When** a manager reviews an employee, **Then** they see all core values with rating options (1-5 scale)
2. **Given** a manager is rating core values, **When** they select a rating, **Then** they can provide justification/comments for each value
3. **Given** a manager has rated all core values, **When** they view the evaluation summary, **Then** the core values score (average of all values) is calculated and weighted at 20%
4. **Given** HR Admin updates core values mid-cycle, **When** the changes are saved, **Then** all ongoing evaluations reflect the updated values list

---

### User Story 7 - Notifications & Reminders (Priority: P2)

As a user (employee, manager, or HR), I want to receive timely notifications about deadlines, submissions, and feedback availability so that I stay informed about my responsibilities in the review process.

**Why this priority**: Notifications ensure timely completion and reduce the need for manual follow-ups. While the system can function without them, they significantly improve user experience and on-time completion rates.

**Independent Test**: Can be fully tested by configuring notification settings, triggering various events (cycle start, deadline approaching, submission, feedback available), and verifying notifications are sent via configured channels (Email, SMS, MS Teams).

**Acceptance Scenarios**:

1. **Given** a review cycle starts, **When** HR Admin activates it, **Then** all employees and managers receive a cycle start announcement
2. **Given** a deadline is approaching, **When** the reminder period is reached (e.g., 7 days, 3 days, 1 day before), **Then** users with pending tasks receive reminders
3. **Given** an employee submits their self-evaluation, **When** submission is complete, **Then** the employee receives confirmation and their manager receives a notification
4. **Given** a manager completes a review, **When** feedback is finalized, **Then** the employee receives a notification that feedback is available
5. **Given** HR Admin configures notification channels, **When** setting up notifications, **Then** they can enable/disable Email, SMS, and MS Teams per notification type

---

### User Story 8 - Reports & Dashboards (Priority: P2)

As an HR administrator or manager, I want to view reports and dashboards showing evaluation progress, completion rates, and rating distributions so that I can monitor the review process and identify issues.

**Why this priority**: Reports provide visibility into the review process but are not essential for individual evaluation workflows. They enable process management and oversight.

**Independent Test**: Can be fully tested by HR Admin or managers accessing dashboards, viewing completion rates by team/department, seeing rating distribution charts, and exporting reports to CSV/PDF.

**Acceptance Scenarios**:

1. **Given** an HR Admin accesses the dashboard, **When** they view completion rates, **Then** they see percentage completion by department, team, and individual
2. **Given** evaluations are in progress, **When** a manager views their team dashboard, **Then** they see each direct report's status (Not Started, In Progress, Completed)
3. **Given** evaluations are complete, **When** HR Admin views rating distribution, **Then** they see a chart showing the breakdown of ratings (1-5) across the organization
4. **Given** HR Admin needs to share data, **When** they export a report, **Then** they can download it as CSV or PDF format
5. **Given** a Senior Manager views reports, **When** they access the dashboard, **Then** they see skip-level visibility (their direct reports' teams) in addition to their own team

---

### User Story 9 - Audit Logging (Priority: P2)

As an HR administrator or compliance officer, I want to view a complete audit trail of all changes made in the system so that we have accountability and can investigate any disputes.

**Why this priority**: Audit logs are critical for compliance and dispute resolution but don't directly impact the evaluation workflow. They provide important governance capabilities.

**Independent Test**: Can be fully tested by performing various actions (creating, editing, deleting records), then HR Admin viewing the audit log with filters for user, action type, and date range, and exporting logs for compliance.

**Acceptance Scenarios**:

1. **Given** a user performs any action in the system, **When** the action is completed, **Then** an audit log entry is created with timestamp, user ID, action type, and details
2. **Given** an HR Admin accesses the audit log viewer, **When** they apply filters (user, action type, date range), **Then** only matching entries are displayed
3. **Given** a rating is changed, **When** the audit log is viewed, **Then** both the old and new values are recorded
4. **Given** HR Admin needs compliance documentation, **When** they export audit logs, **Then** they can download a complete, timestamped record of all changes
5. **Given** the system has been operating for multiple years, **When** HR Admin searches historical logs, **Then** records are retained for 5 years as per compliance requirements

---

### User Story 10 - Historical Records (Priority: P3)

As an employee or manager, I want to view my historical performance evaluations so that I can track my growth over time and reference past feedback.

**Why this priority**: Historical data is valuable for career development and continuity but is not essential for the current cycle's evaluation process. This enhances long-term value.

**Independent Test**: Can be fully tested by completing multiple review cycles, then users accessing their historical records, viewing past ratings and feedback, and downloading evaluation reports.

**Acceptance Scenarios**:

1. **Given** an employee has completed multiple review cycles, **When** they access historical records, **Then** they see a list of all past evaluations with cycle name and date
2. **Given** an employee views a past evaluation, **When** they select it, **Then** they see all objectives, ratings, and manager feedback from that cycle
3. **Given** a manager views a direct report's history, **When** they access feedback history, **Then** they can compare ratings across years to track growth
4. **Given** an employee needs documentation, **When** they download a historical evaluation report, **Then** they receive a PDF with complete evaluation details

---

### User Story 11 - Document Upload (Priority: P3)

As an employee, I want to upload supporting documents (certificates, screenshots, reports) for my objectives so that I can provide evidence of my achievements.

**Why this priority**: Document upload enhances self-evaluation quality but is not required for the core evaluation workflow. Employees can provide text-based evidence without file uploads.

**Independent Test**: Can be fully tested by an employee accessing the self-evaluation form, uploading files (PDF, DOC, XLS, PNG, JPG) for specific objectives, and verifying managers can view the uploaded documents during review.

**Acceptance Scenarios**:

1. **Given** an employee is completing their self-evaluation, **When** they upload a supporting file, **Then** the system accepts PDF, DOC, DOCX, XLS, XLSX, PNG, JPG formats up to 10MB
2. **Given** a file is uploaded, **When** the upload completes, **Then** the file is securely stored and linked to the specific objective
3. **Given** a manager is reviewing an evaluation, **When** they view an objective with uploaded documents, **Then** they can download and view the supporting files
4. **Given** an employee uploads a file with invalid format or size, **When** the upload is attempted, **Then** the system rejects it with a clear error message

---

### User Story 12 - Localization (Priority: P3)

As a user, I want to use the system in my preferred language (Thai or English) so that I can comfortably complete my evaluation in the language I understand best.

**Why this priority**: Localization improves user experience for non-English speakers but the system can function in a single language initially. This expands accessibility.

**Independent Test**: Can be fully tested by users toggling language preference, verifying all UI text, notifications, and emails are displayed in the selected language, and date/number formats are localized.

**Acceptance Scenarios**:

1. **Given** a user accesses their settings, **When** they select a language preference (Thai or English), **Then** all UI text updates to the selected language
2. **Given** a user has set their language preference, **When** they receive notifications, **Then** emails and messages are in their preferred language
3. **Given** a user views dates and numbers, **When** the language is Thai, **Then** dates appear as DD/MM/YYYY format and numbers use Thai formatting
4. **Given** a user views dates and numbers, **When** the language is English, **Then** dates appear as MM/DD/YYYY format and numbers use English formatting

---

### Edge Cases

- What happens when a manager has no direct reports? System treats them as Employee until team is assigned; Manager role capabilities remain dormant.
- What happens when a user's role changes mid-cycle (e.g., promotion to manager)? HR Admin handles case-by-case: reassign objectives, transfer evaluation data, adjust permissions.
- What happens when an employee transfers to a new manager mid-cycle? New manager inherits ongoing evaluation; previous manager's feedback preserved in history.
- What happens when an HR Staff member accesses their own evaluation? Employee view takes precedence; HR permissions hidden for own record.
- What happens when a deadline is missed after the grace period? Evaluation is locked; escalation notification sent to employee's manager; manager can request extension from HR Admin.
- What happens when self-evaluation is submitted but manager doesn't complete review by deadline? Escalation triggers: 3 days overdue = reminder to manager; 5 days overdue = escalation to HR Admin; 7 days overdue = daily reminders.
- What happens when the same objective is bulk-assigned to multiple employees but one employee's needs differ? Manager can edit individual objectives after bulk assignment.
- What happens when file upload fails due to network issues? System shows error message; user can retry upload; auto-saved text content is preserved.
- What happens when a user's account is deactivated mid-cycle? HR Admin can reassign their objectives/evaluations to another user or mark as incomplete.
- What happens when two managers try to review the same employee simultaneously? System uses optimistic locking; second submission fails with message to refresh and review changes.

## Requirements *(mandatory)*

### Functional Requirements

**User Management & Authentication**
- **FR-001**: System MUST allow HR Admin to create, edit, and deactivate user accounts
- **FR-002**: System MUST support role assignment: Super Admin, HR Admin, HR Staff, Senior Manager, Line Manager, Employee
- **FR-003**: System MUST allow bulk user import via CSV upload with validation for duplicates and invalid roles
- **FR-004**: System MUST enforce role-based access control where users only see data appropriate to their role
- **FR-005**: System MUST support SSO integration with company identity provider via OIDC (OpenID Connect)
- **FR-006**: System MUST support concurrent roles where a user has capabilities from multiple roles (e.g., HR Staff + Employee)

**Organization Structure**
- **FR-007**: System MUST allow HR Admin to define and modify reporting relationships (Manager → Direct Reports)
- **FR-008**: System MUST visualize the organization hierarchy as an interactive org chart
- **FR-009**: System MUST support multi-level hierarchies with skip-level visibility for Senior Managers
- **FR-010**: System MUST preserve evaluation history when reporting relationships change

**Review Cycle Management**
- **FR-011**: System MUST allow HR Admin to create review cycles (Mid-Year, Year-End) with configurable start/end dates
- **FR-012**: System MUST allow HR Admin to set deadlines for each phase (self-evaluation, manager review)
- **FR-013**: System MUST allow HR Admin to open/close cycles manually or by schedule
- **FR-014**: System MUST support configurable grace periods after deadlines
- **FR-015**: System MUST allow HR Admin to extend deadlines for specific users or teams

**Objectives Management**
- **FR-016**: System MUST allow managers to create objectives for each direct report with title, description, key results, category, and timeline
- **FR-017**: System MUST support objective categories: Delivery, Innovation, Quality, Culture
- **FR-018**: System MUST allow managers to define rating criteria for each objective (what constitutes ratings 1-5)
- **FR-019**: System MUST support bulk assignment of the same objective to multiple employees
- **FR-020**: System MUST allow copying objectives from templates or previous cycles

**Self-Evaluation**
- **FR-021**: System MUST allow employees to rate each assigned objective on a 1-5 scale
- **FR-022**: System MUST allow employees to add comments/justification for each rating
- **FR-023**: System MUST support draft auto-save every 30 seconds
- **FR-024**: System MUST allow employees to save as draft and submit when ready
- **FR-025**: System MUST prevent editing after submission unless manager rejects and returns it
- **FR-026**: System MUST require employee self-evaluation to be completed before manager can access review form

**Manager Review**
- **FR-027**: System MUST allow managers to view employee's self-evaluation before providing their own ratings
- **FR-028**: System MUST allow managers to rate each objective on a 1-5 scale independently from employee's self-rating
- **FR-029**: System MUST allow managers to provide written feedback per objective
- **FR-030**: System MUST allow managers to rate employees on all company core values (1-5 scale)
- **FR-031**: System MUST allow managers to provide justification/comments for each core value rating
- **FR-032**: System MUST allow managers to add overall comments for the evaluation

**Scoring & Calculation**
- **FR-033**: System MUST calculate weighted score = (KPI Score × 0.8) + (Core Values Score × 0.2)
- **FR-034**: System MUST calculate KPI Score as average of all objective ratings (manager ratings only)
- **FR-035**: System MUST calculate Core Values Score as average of all core value ratings
- **FR-036**: System MUST display final rating rounded to 2 decimal places
- **FR-037**: System MUST NOT include self-evaluation ratings in final score calculation (for reference only)

**Notifications**
- **FR-038**: System MUST send notifications for cycle start announcements, deadline reminders, submission confirmations, and feedback availability
- **FR-039**: System MUST support Email notifications via SMTP
- **FR-040**: System MUST support SMS notifications via webhook integration with local provider
- **FR-041**: System MUST support MS Teams notifications via incoming webhooks
- **FR-042**: System MUST allow HR Admin to configure which channels (Email, SMS, MS Teams) to use per notification type
- **FR-043**: System MUST support scheduled reminders (e.g., 7 days, 3 days, 1 day before deadline)
- **FR-044**: System MUST queue failed notifications with retry logic (3 attempts with exponential backoff), log failures, and continue without blocking user workflows

**Documents**
- **FR-045**: System MUST allow employees to upload supporting files per objective
- **FR-046**: System MUST accept file formats: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG
- **FR-047**: System MUST enforce maximum file size of 10MB per file
- **FR-048**: System MUST store files securely with access controlled by user permissions
- **FR-049**: System MUST allow managers to view employee-uploaded documents during review

**Reports & Dashboards**
- **FR-050**: System MUST display evaluation completion rates by team and department for HR Admin
- **FR-051**: System MUST display team evaluation status for managers (all direct reports)
- **FR-052**: System MUST display rating distribution charts (1-5 breakdown) for completed evaluations
- **FR-053**: System MUST allow filtering reports by cycle, department, and manager
- **FR-054**: System MUST allow export of reports to CSV and PDF formats
- **FR-055**: System MUST provide Senior Managers with skip-level visibility in reports

**Audit Logging**
- **FR-056**: System MUST log all data access and modifications with timestamp, user, action, and details
- **FR-057**: System MUST record both old and new values when data is modified
- **FR-058**: System MUST allow filtering audit logs by user, action type, and date range
- **FR-059**: System MUST allow export of audit logs for compliance purposes
- **FR-060**: System MUST retain audit logs for 5 years

**Localization**
- **FR-061**: System MUST support Thai and English languages
- **FR-062**: System MUST allow users to toggle language preference
- **FR-063**: System MUST display dates in DD/MM/YYYY format for Thai and MM/DD/YYYY for English
- **FR-064**: System MUST translate all UI text, emails, and notifications to the user's preferred language

**Approval Workflow**
- **FR-065**: System MUST support sequential approvals based on configured hierarchy
- **FR-066**: System MUST allow approvers to Approve, Reject with comments, or Request changes
- **FR-067**: System MUST return evaluation to previous step when rejected
- **FR-068**: System MUST lock evaluation after final approval

**Escalation**
- **FR-069**: System MUST trigger reminder to manager when evaluation is 3 days overdue
- **FR-070**: System MUST escalate to HR Admin when evaluation is 5 days overdue
- **FR-071**: System MUST send daily reminders when evaluation is 7+ days overdue
- **FR-072**: System MUST allow HR Admin to reassign reviewer or complete review on behalf of manager

**Historical Records**
- **FR-073**: System MUST allow employees to view all past evaluation cycles
- **FR-074**: System MUST allow managers to view feedback history for direct reports
- **FR-075**: System MUST allow comparison of ratings across years
- **FR-076**: System MUST allow download of historical evaluation reports

**Bonus & Salary Calculation**
- **FR-077**: System MUST apply pre-defined formula to final rating for bonus/salary recommendations
- **FR-078**: System MUST display recommended bonus percentage and salary adjustment to HR Admin only
- **FR-079**: System MUST keep compensation calculations hidden until officially communicated

### Key Entities

- **User**: Represents all system users (employees, managers, HR staff). Key attributes: email, name, role, manager reference, department, activation status. Relationships: has one manager (except top-level), has many direct reports (if manager role).

- **Review Cycle**: Represents a performance review period. Key attributes: name, type (Mid-Year/Year-End), start date, end date, phase deadlines, status (Draft/Active/Closed), weights configuration.

- **Objective**: Represents a performance target assigned to an employee. Key attributes: title, description, key results, category, timeline, rating criteria (1-5 definitions), created by, assigned to. Relationships: belongs to one employee, belongs to one review cycle.

- **Evaluation**: Represents the assessment of an objective or core value. Key attributes: self-rating, self-comments, manager-rating, manager-feedback, status (Not Started/In Progress/Completed). Relationships: belongs to one employee, belongs to one review cycle, references one objective or core value.

- **Core Value**: Represents a company cultural value. Key attributes: name, description, rating criteria. Relationships: applies to all employees uniformly in a cycle.

- **Document**: Represents an uploaded supporting file. Key attributes: file name, file URL, file size, upload date. Relationships: belongs to one objective, belongs to one employee.

- **Audit Log**: Represents a record of system changes. Key attributes: timestamp, user reference, action type, entity type, entity ID, old values, new values, IP address.

- **Notification**: Represents a message sent to a user. Key attributes: recipient, type, channel (Email/SMS/Teams), subject, message, sent timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Process Efficiency**
- **SC-001**: Review cycle duration reduced to ≤ 2 weeks (down from 4-6 weeks with manual process)
- **SC-002**: HR administrative time reduced by 70% (from 200 hours/cycle to 60 hours/cycle)
- **SC-003**: Manager time per employee reduced by 50% (from 3 hours to 1.5 hours per employee)
- **SC-004**: Self-evaluation draft auto-save occurs every 30 seconds to prevent data loss
- **SC-005**: Page load time under 2 seconds for all pages
- **SC-006**: System supports 500 concurrent users without performance degradation

**Accuracy & Quality**
- **SC-007**: Zero calculation errors in weighted scores (100% accuracy vs. ~5% error rate with manual calculations)
- **SC-008**: 100% of evaluations include all required data (no incomplete submissions)
- **SC-009**: All rating changes tracked in audit log with old and new values

**Completion & Adoption**
- **SC-010**: ≥ 95% of evaluations completed on time (up from ~85% with manual process)
- **SC-011**: 100% of employees and managers actively use the system in first cycle
- **SC-012**: 100% self-evaluation participation rate
- **SC-013**: 90% of evaluations completed by deadline (before grace period)

**User Experience**
- **SC-014**: Employee satisfaction score ≥ 4.0 out of 5.0 (up from 3.2/5.0 with manual process)
- **SC-015**: Users can complete self-evaluation in under 30 minutes for typical objective count
- **SC-016**: Users can view evaluation status and history within 2 clicks from dashboard

**System Reliability**
- **SC-017**: System uptime of 99.9% during review periods
- **SC-018**: File uploads complete successfully with progress indicator for files up to 10MB
- **SC-019**: Notifications delivered within 5 minutes of trigger event

**Compliance & Governance**
- **SC-020**: Audit logs retained for 5 years as per compliance requirements
- **SC-021**: 100% of data modifications logged with user, timestamp, and change details
- **SC-022**: All personal data handled in compliance with PDPA (Thailand Personal Data Protection Act)

**Business Impact**
- **SC-023**: Bonus and salary adjustments calculated without errors, enabling timely compensation decisions
- **SC-024**: Promotion decisions supported by historical performance data (from cycle 2 onwards)
- **SC-025**: HR inquiry tickets related to review process reduced by 50%
