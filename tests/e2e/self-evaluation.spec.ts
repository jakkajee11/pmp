/**
 * E2E Test: Self-Evaluation Workflow
 *
 * Tests the complete self-evaluation flow from viewing objectives to submitting.
 */

import { test, expect, Page } from "@playwright/test";

test.describe("Self-Evaluation Workflow", () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Mock authentication
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "test-employee-id",
            email: "employee@example.com",
            name: "Test Employee",
            role: "EMPLOYEE",
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
    });

    // Mock dashboard data
    await page.route("**/api/evaluations/dashboard**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            cycle: {
              id: "test-cycle-id",
              name: "Mid-Year Review 2024",
              status: "ACTIVE",
            },
            selfEvalDeadline: "2024-06-30T23:59:59Z",
            objectives: [
              {
                id: "obj-1",
                title: "Deliver Q1 Project",
                category: "DELIVERY",
                evaluationStatus: "NOT_STARTED",
                selfRating: null,
              },
              {
                id: "obj-2",
                title: "Improve Code Quality",
                category: "QUALITY",
                evaluationStatus: "SELF_IN_PROGRESS",
                selfRating: 3,
              },
            ],
            coreValues: [
              {
                id: "cv-1",
                name: "Customer Focus",
                evaluationStatus: "NOT_STARTED",
                selfRating: null,
              },
            ],
            overallStatus: "SELF_IN_PROGRESS",
            canSubmit: false,
          },
        }),
      });
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test("should display evaluation dashboard with objectives", async () => {
    await page.goto("/evaluations");

    // Wait for page to load
    await expect(page.locator("h1")).toContainText("Self Evaluation");

    // Check that objectives are displayed
    await expect(page.getByText("Deliver Q1 Project")).toBeVisible();
    await expect(page.getByText("Improve Code Quality")).toBeVisible();

    // Check status badges
    await expect(page.getByText("Not Started")).toBeVisible();
    await expect(page.getByText("In Progress")).toBeVisible();
  });

  test("should navigate to evaluation form when clicking objective", async () => {
    // Mock evaluation detail
    await page.route("**/api/evaluations/obj-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "eval-1",
            employee: { id: "test-employee-id", name: "Test Employee", email: "employee@example.com" },
            manager: { id: "manager-id", name: "Test Manager" },
            cycle: { id: "test-cycle-id", name: "Mid-Year Review 2024" },
            evaluationType: "KPI",
            objective: {
              id: "obj-1",
              title: "Deliver Q1 Project",
              description: "Complete the Q1 project deliverables on time",
              ratingCriteria: {
                1: "Did not complete any deliverables",
                2: "Completed some deliverables late",
                3: "Completed all deliverables on time",
                4: "Completed ahead of schedule with high quality",
                5: "Exceeded expectations with additional value",
              },
            },
            selfRating: null,
            selfComments: null,
            status: "NOT_STARTED",
            version: 1,
          },
        }),
      });
    });

    await page.goto("/evaluations");

    // Click on objective to start evaluation
    await page.getByText("Deliver Q1 Project").click();

    // Should navigate to evaluation form
    await expect(page).toHaveURL(/\/evaluations\/eval-1/);
    await expect(page.getByText("Deliver Q1 Project")).toBeVisible();
  });

  test("should save draft with auto-save", async () => {
    // Mock evaluation update
    await page.route("**/api/evaluations/eval-1/self", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "eval-1",
              selfRating: 4,
              selfComments: "Good progress on deliverables",
              status: "SELF_IN_PROGRESS",
              version: 2,
            },
          }),
        });
      }
    });

    await page.goto("/evaluations/eval-1");

    // Select rating
    await page.getByRole("button", { name: /4.*Above/ }).click();

    // Enter comments
    await page.getByPlaceholder(/comments/i).fill("Good progress on deliverables");

    // Wait for auto-save indicator
    // Note: In real test, we'd wait for the debounce period
    await expect(page.getByText(/saved|saving/i)).toBeVisible({ timeout: 35000 });
  });

  test("should validate before submission", async () => {
    await page.goto("/evaluations/eval-1");

    // Try to submit without rating
    await page.getByRole("button", { name: /submit/i }).click();

    // Should show validation error
    await expect(page.getByText(/rating is required/i)).toBeVisible();
  });

  test("should submit evaluation successfully", async () => {
    // Mock submit
    await page.route("**/api/evaluations/eval-1/self/submit", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "eval-1",
            status: "SELF_SUBMITTED",
            selfSubmittedAt: new Date().toISOString(),
            version: 3,
          },
        }),
      });
    });

    // Mock update for setting rating
    await page.route("**/api/evaluations/eval-1/self", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: {
              id: "eval-1",
              selfRating: 4,
              selfComments: "Test comments",
              status: "SELF_IN_PROGRESS",
              version: 2,
            },
          }),
        });
      }
    });

    await page.goto("/evaluations/eval-1");

    // Select rating
    await page.getByRole("button", { name: /4.*Above/ }).click();

    // Enter comments
    await page.getByPlaceholder(/comments/i).fill("Test comments");

    // Submit
    await page.getByRole("button", { name: /submit evaluation/i }).click();

    // Confirm in dialog
    await page.getByRole("button", { name: /confirm/i }).click();

    // Should show success message
    await expect(page.getByText(/submitted successfully/i)).toBeVisible();
  });

  test("should display rating criteria for each level", async () => {
    await page.goto("/evaluations/eval-1");

    // Check that rating criteria are displayed
    await expect(page.getByText(/did not complete any deliverables/i)).toBeVisible();
    await expect(page.getByText(/completed some deliverables late/i)).toBeVisible();
    await expect(page.getByText(/completed all deliverables on time/i)).toBeVisible();
    await expect(page.getByText(/completed ahead of schedule/i)).toBeVisible();
    await expect(page.getByText(/exceeded expectations/i)).toBeVisible();
  });

  test("should show auto-save status indicator", async () => {
    await page.goto("/evaluations/eval-1");

    // Auto-save indicator should be present
    const autoSaveIndicator = page.getByTestId("auto-save-indicator");
    await expect(autoSaveIndicator).toBeVisible();

    // Initial state should be idle or no message
    const statusText = await autoSaveIndicator.textContent();
    expect(statusText).toBeFalsy(); // Empty or no text when idle
  });

  test("should handle network errors gracefully", async () => {
    // Mock network error
    await page.route("**/api/evaluations/eval-1/self", async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            success: false,
            error: {
              code: "INTERNAL_ERROR",
              message: "Network error occurred",
            },
          }),
        });
      }
    });

    await page.goto("/evaluations/eval-1");

    // Try to save
    await page.getByRole("button", { name: /4.*Above/ }).click();

    // Should show error message
    await expect(page.getByText(/error|failed to save/i)).toBeVisible({ timeout: 35000 });
  });

  test("should show deadline warning when approaching", async () => {
    // Mock dashboard with imminent deadline
    await page.route("**/api/evaluations/dashboard**", async (route) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            cycle: {
              id: "test-cycle-id",
              name: "Mid-Year Review 2024",
              status: "ACTIVE",
            },
            selfEvalDeadline: tomorrow.toISOString(),
            objectives: [
              {
                id: "obj-1",
                title: "Deliver Q1 Project",
                category: "DELIVERY",
                evaluationStatus: "NOT_STARTED",
                selfRating: null,
              },
            ],
            coreValues: [],
            overallStatus: "NOT_STARTED",
            canSubmit: false,
          },
        }),
      });
    });

    await page.goto("/evaluations");

    // Should show deadline warning
    await expect(page.getByText(/deadline.*tomorrow|1 day remaining/i)).toBeVisible();
  });

  test("should be accessible", async () => {
    await page.goto("/evaluations");

    // Check for proper heading structure
    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();

    // Check for proper form labels
    const ratingButtons = page.getByRole("button", { name: /rating/i });
    const count = await ratingButtons.count();
    expect(count).toBeGreaterThan(0);

    // Check for focus indicators
    const firstButton = page.getByRole("button").first();
    await firstButton.focus();
    await expect(firstButton).toBeFocused();
  });
});

test.describe("Self-Evaluation - Manager View", () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Mock manager authentication
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "manager-id",
            email: "manager@example.com",
            name: "Test Manager",
            role: "LINE_MANAGER",
          },
          expires: new Date(Date.now() + 86400000).toISOString(),
        }),
      });
    });

    // Mock manager dashboard
    await page.route("**/api/evaluations/dashboard**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            cycle: {
              id: "test-cycle-id",
              name: "Mid-Year Review 2024",
              status: "ACTIVE",
            },
            team: [
              {
                id: "emp-1",
                name: "Alice Johnson",
                selfEvalStatus: "SELF_SUBMITTED",
                managerReviewStatus: "PENDING",
                overallStatus: "SELF_SUBMITTED",
              },
              {
                id: "emp-2",
                name: "Bob Smith",
                selfEvalStatus: "IN_PROGRESS",
                managerReviewStatus: "NOT_STARTED",
                overallStatus: "IN_PROGRESS",
              },
              {
                id: "emp-3",
                name: "Carol Williams",
                selfEvalStatus: "COMPLETED",
                managerReviewStatus: "COMPLETED",
                overallStatus: "COMPLETED",
              },
            ],
            pendingReviews: 1,
            completedReviews: 1,
          },
        }),
      });
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test("should display team overview for manager", async () => {
    await page.goto("/evaluations");

    // Check team members are displayed
    await expect(page.getByText("Alice Johnson")).toBeVisible();
    await expect(page.getByText("Bob Smith")).toBeVisible();
    await expect(page.getByText("Carol Williams")).toBeVisible();

    // Check status counts
    await expect(page.getByText(/1.*pending/i)).toBeVisible();
    await expect(page.getByText(/1.*completed/i)).toBeVisible();
  });

  test("should allow manager to start review for submitted evaluation", async () => {
    // Mock click to view team member's evaluation
    await page.route("**/api/evaluations/emp-1-eval", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "emp-1-eval",
            employee: { id: "emp-1", name: "Alice Johnson", email: "alice@example.com" },
            manager: { id: "manager-id", name: "Test Manager" },
            cycle: { id: "test-cycle-id", name: "Mid-Year Review 2024" },
            evaluationType: "KPI",
            objective: {
              id: "obj-1",
              title: "Q1 Deliverables",
              description: "Complete Q1 deliverables",
              ratingCriteria: {
                1: "Below",
                2: "Needs Improvement",
                3: "Meets",
                4: "Above",
                5: "Exceeds",
              },
            },
            selfRating: 4,
            selfComments: "Successfully completed all Q1 deliverables ahead of schedule",
            status: "SELF_SUBMITTED",
            version: 2,
          },
        }),
      });
    });

    await page.goto("/evaluations");

    // Click on team member with submitted evaluation
    await page.getByText("Alice Johnson").click();

    // Should see employee's self-rating
    await expect(page.getByText(/4.*Above/i)).toBeVisible();
    await expect(page.getByText("Successfully completed all Q1 deliverables")).toBeVisible();

    // Should see manager review section
    await expect(page.getByText(/your review|manager review/i)).toBeVisible();
  });
});
