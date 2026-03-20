/**
 * E2E Tests for Manager Review Workflow
 *
 * Tests the complete manager review process from viewing team evaluations
 * to submitting the final review.
 */

import { test, expect } from "@playwright/test";

test.describe("Manager Review Workflow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth session
    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user: {
            id: "manager-123",
            email: "manager@example.com",
            role: "LINE_MANAGER",
            name: "Test Manager",
          },
        }),
      });
    });
  });

  test("manager can view team dashboard", async ({ page }) => {
    // Mock dashboard API
    await page.route("**/api/evaluations?dashboard*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            cycle: {
              id: "cycle-1",
              name: "Mid-Year 2026",
              status: "ACTIVE",
            },
            team: [
              {
                id: "emp-1",
                name: "John Doe",
                selfEvalStatus: "SELF_SUBMITTED",
                managerReviewStatus: "SELF_SUBMITTED",
                overallStatus: "SELF_SUBMITTED",
              },
              {
                id: "emp-2",
                name: "Jane Smith",
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

    await page.goto("/evaluations");

    // Check dashboard displays
    await expect(page.getByText("Team Evaluations")).toBeVisible();
    await expect(page.getByText("Mid-Year 2026")).toBeVisible();
    await expect(page.getByText("Pending Reviews")).toBeVisible();
    await expect(page.getByText("1")).toBeVisible(); // Pending count
  });

  test("manager can review self-evaluation", async ({ page }) => {
    const evaluationId = "eval-123";

    // Mock evaluation details
    await page.route(`**/api/evaluations/${evaluationId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: evaluationId,
            employeeId: "emp-1",
            managerId: "manager-123",
            status: "SELF_SUBMITTED",
            selfRating: 4,
            selfComments: "I have achieved most of my objectives this period.",
            objective: {
              id: "obj-1",
              title: "Improve Code Quality",
              description: "Reduce bug count by 30%",
              ratingCriteria: {
                1: "Below",
                2: "Needs improvement",
                3: "Meets",
                4: "Above",
                5: "Exceeds",
              },
            },
            cycle: {
              id: "cycle-1",
              name: "Mid-Year 2026",
              weightsConfig: { kpi: 0.8, coreValues: 0.2 },
            },
          },
        }),
      });
    });

    await page.goto(`/evaluations?evaluationId=${evaluationId}`);

    // Check evaluation displays
    await expect(page.getByText("Improve Code Quality")).toBeVisible();
    await expect(page.getByText("I have achieved")).toBeVisible();
  });

  test("manager can submit review", async ({ page }) => {
    const evaluationId = "eval-456";

    // Mock evaluation in MANAGER_IN_PROGRESS state
    await page.route(`**/api/evaluations/${evaluationId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: evaluationId,
            employeeId: "emp-1",
            managerId: "manager-123",
            status: "MANAGER_IN_PROGRESS",
            selfRating: 4,
            managerRating: 4,
            managerFeedback: "Great work on the objectives",
            objective: {
              id: "obj-1",
              title: "Test Objective",
            },
            version: 2,
          },
        }),
      });
    });

    // Mock submit endpoint
    await page.route(
      `**/api/evaluations/${evaluationId}/manager/submit`,
      async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              success: true,
              data: {
                id: evaluationId,
                status: "COMPLETED",
              },
            }),
          });
        }
      }
    );

    await page.goto(`/evaluations?evaluationId=${evaluationId}`);
  });

  test("manager can return evaluation to employee", async ({ page }) => {
    const evaluationId = "eval-789";

    // Mock evaluation details
    await page.route(`**/api/evaluations/${evaluationId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: evaluationId,
            status: "SELF_SUBMITTED",
            selfRating: 3,
            selfComments: "Brief comment",
            version: 2,
          },
        }),
      });
    });

    // Mock return endpoint
    await page.route(
      `**/api/evaluations/${evaluationId}/return`,
      async (route) => {
        if (route.request().method() === "POST") {
          const body = route.request().postDataJSON();
          if (body.reason) {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                success: true,
                data: {
                  id: evaluationId,
                  status: "RETURNED",
                },
              }),
            });
          }
        }
      }
    );

    await page.goto(`/evaluations?evaluationId=${evaluationId}`);
  });
});
