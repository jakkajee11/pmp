/**
 * PDF Generator Service
 *
 * Generates PDF exports for reports.
 * Uses a simple HTML-to-PDF approach for serverless compatibility.
 */

import { prisma } from "../../../shared/lib/db";
import { ReportType, CompletionReport, RatingDistributionReport } from "../types";

interface PdfParams {
  cycleId: string;
  reportType: ReportType;
  departmentId?: string;
}

interface HistoricalEvaluationPdfParams {
  employeeId: string;
  cycleId: string;
}

/**
 * Generate PDF report
 * Returns a Buffer containing the PDF content
 */
export async function generatePdf(params: PdfParams): Promise<Buffer> {
  switch (params.reportType) {
    case "completion":
      return generateCompletionPdf(params);
    case "ratings":
      return generateRatingsPdf(params);
    case "detailed":
      return generateDetailedPdf(params);
    default:
      throw new Error(`Unknown report type: ${params.reportType}`);
  }
}

/**
 * Generate completion report PDF
 */
async function generateCompletionPdf(params: PdfParams): Promise<Buffer> {
  const report = await getCompletionReportData(params);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Completion Report - ${report.cycle.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 40px;
      color: #1e3a5f;
    }
    h1 {
      color: #1e3a5f;
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 10px;
    }
    h2 {
      color: #475569;
      margin-top: 30px;
    }
    .summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .stat-item {
      text-align: center;
      padding: 15px;
      background: #f1f5f9;
      border-radius: 8px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #1e3a5f;
    }
    .stat-label {
      font-size: 14px;
      color: #64748b;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 12px;
      text-align: left;
    }
    th {
      background: #1e3a5f;
      color: white;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .progress-bar {
      background: #e2e8f0;
      border-radius: 4px;
      height: 20px;
      overflow: hidden;
    }
    .progress-fill {
      background: #10b981;
      height: 100%;
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <h1>Performance Evaluation Completion Report</h1>

  <div class="summary-box">
    <h2>Cycle: ${report.cycle.name}</h2>
    <p>Generated: ${report.generatedAt.toLocaleString()}</p>
  </div>

  <h2>Overall Progress</h2>
  <div class="stat-grid">
    <div class="stat-item">
      <div class="stat-value">${report.overall.totalEmployees}</div>
      <div class="stat-label">Total Employees</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${report.overall.selfEvalPercentage}%</div>
      <div class="stat-label">Self-Evaluation Complete</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${report.overall.managerReviewPercentage}%</div>
      <div class="stat-label">Manager Review Complete</div>
    </div>
  </div>

  <h2>Status Breakdown</h2>
  <table>
    <tr>
      <th>Status</th>
      <th>Count</th>
      <th>Percentage</th>
    </tr>
    <tr>
      <td>Not Started</td>
      <td>${report.byStatus.notStarted}</td>
      <td>${calculatePercentage(report.byStatus.notStarted, report.overall.totalEmployees)}%</td>
    </tr>
    <tr>
      <td>Self Evaluation In Progress</td>
      <td>${report.byStatus.selfInProgress}</td>
      <td>${calculatePercentage(report.byStatus.selfInProgress, report.overall.totalEmployees)}%</td>
    </tr>
    <tr>
      <td>Self Evaluation Submitted</td>
      <td>${report.byStatus.selfSubmitted}</td>
      <td>${calculatePercentage(report.byStatus.selfSubmitted, report.overall.totalEmployees)}%</td>
    </tr>
    <tr>
      <td>Manager Review In Progress</td>
      <td>${report.byStatus.managerInProgress}</td>
      <td>${calculatePercentage(report.byStatus.managerInProgress, report.overall.totalEmployees)}%</td>
    </tr>
    <tr>
      <td>Completed</td>
      <td>${report.byStatus.completed}</td>
      <td>${calculatePercentage(report.byStatus.completed, report.overall.totalEmployees)}%</td>
    </tr>
  </table>

  <h2>Progress by Department</h2>
  <table>
    <tr>
      <th>Department</th>
      <th>Total Employees</th>
      <th>Self-Eval Complete</th>
      <th>Manager Review Complete</th>
    </tr>
    ${report.byDepartment.map((dept) => `
      <tr>
        <td>${dept.department.name}</td>
        <td>${dept.total}</td>
        <td>${dept.selfEvalCompleted} (${calculatePercentage(dept.selfEvalCompleted, dept.total)}%)</td>
        <td>${dept.managerReviewCompleted} (${calculatePercentage(dept.managerReviewCompleted, dept.total)}%)</td>
      </tr>
    `).join("")}
  </table>

  <div class="footer">
    <p>Performance Metrics Portal - Confidential</p>
    <p>Report generated on ${report.generatedAt.toLocaleString()}</p>
  </div>
</body>
</html>
  `;

  return generatePdfFromHtml(html);
}

/**
 * Generate ratings distribution PDF
 */
async function generateRatingsPdf(params: PdfParams): Promise<Buffer> {
  const report = await getRatingDistributionData(params);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rating Distribution Report - ${report.cycle.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 40px;
      color: #1e3a5f;
    }
    h1 {
      color: #1e3a5f;
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 10px;
    }
    h2 {
      color: #475569;
      margin-top: 30px;
    }
    .summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 12px;
      text-align: center;
    }
    th {
      background: #1e3a5f;
      color: white;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .bar-chart {
      display: flex;
      align-items: flex-end;
      height: 200px;
      gap: 10px;
      margin: 20px 0;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
    }
    .bar {
      flex: 1;
      background: #1e3a5f;
      border-radius: 4px 4px 0 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      color: white;
      font-weight: bold;
      min-height: 20px;
    }
    .bar-label {
      margin-bottom: -25px;
      font-size: 12px;
      color: #475569;
    }
    .rating-1 { background: #ef4444; }
    .rating-2 { background: #f97316; }
    .rating-3 { background: #f59e0b; }
    .rating-4 { background: #10b981; }
    .rating-5 { background: #3b82f6; }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <h1>Rating Distribution Report</h1>

  <div class="summary-box">
    <h2>Cycle: ${report.cycle.name}</h2>
    <p>Generated: ${report.generatedAt.toLocaleString()}</p>
  </div>

  <h2>KPI Rating Distribution</h2>
  <div class="bar-chart">
    ${[1, 2, 3, 4, 5].map((rating) => {
      const count = report.kpiDistribution[rating as keyof typeof report.kpiDistribution];
      const maxCount = Math.max(...Object.values(report.kpiDistribution), 1);
      const height = (count / maxCount) * 150;
      return `
        <div class="bar rating-${rating}" style="height: ${Math.max(height, 20)}px">
          ${count}
        </div>
        <div class="bar-label">Rating ${rating}</div>
      `;
    }).join("")}
  </div>

  <table>
    <tr>
      <th>Rating</th>
      <th>Description</th>
      <th>Count</th>
      <th>Percentage</th>
    </tr>
    ${[1, 2, 3, 4, 5].map((rating) => {
      const count = report.kpiDistribution[rating as keyof typeof report.kpiDistribution];
      const total = Object.values(report.kpiDistribution).reduce((a, b) => a + b, 0);
      return `
        <tr>
          <td>${rating}</td>
          <td>${getRatingLabel(rating)}</td>
          <td>${count}</td>
          <td>${calculatePercentage(count, total)}%</td>
        </tr>
      `;
    }).join("")}
  </table>

  <h2>Core Values Rating Distribution</h2>
  <div class="bar-chart">
    ${[1, 2, 3, 4, 5].map((rating) => {
      const count = report.coreValuesDistribution[rating as keyof typeof report.coreValuesDistribution];
      const maxCount = Math.max(...Object.values(report.coreValuesDistribution), 1);
      const height = (count / maxCount) * 150;
      return `
        <div class="bar rating-${rating}" style="height: ${Math.max(height, 20)}px">
          ${count}
        </div>
        <div class="bar-label">Rating ${rating}</div>
      `;
    }).join("")}
  </div>

  <table>
    <tr>
      <th>Rating</th>
      <th>Description</th>
      <th>Count</th>
      <th>Percentage</th>
    </tr>
    ${[1, 2, 3, 4, 5].map((rating) => {
      const count = report.coreValuesDistribution[rating as keyof typeof report.coreValuesDistribution];
      const total = Object.values(report.coreValuesDistribution).reduce((a, b) => a + b, 0);
      return `
        <tr>
          <td>${rating}</td>
          <td>${getRatingLabel(rating)}</td>
          <td>${count}</td>
          <td>${calculatePercentage(count, total)}%</td>
        </tr>
      `;
    }).join("")}
  </table>

  <h2>Final Score Distribution</h2>
  <table>
    <tr>
      <th>Score Range</th>
      <th>Count</th>
      <th>Percentage</th>
    </tr>
    ${report.finalScoreDistribution.ranges.map((range) => {
      const total = report.finalScoreDistribution.ranges.reduce((sum, r) => sum + r.count, 0);
      return `
        <tr>
          <td>${range.label}</td>
          <td>${range.count}</td>
          <td>${calculatePercentage(range.count, total)}%</td>
        </tr>
      `;
    }).join("")}
  </table>

  <div class="footer">
    <p>Performance Metrics Portal - Confidential</p>
    <p>Report generated on ${report.generatedAt.toLocaleString()}</p>
  </div>
</body>
</html>
  `;

  return generatePdfFromHtml(html);
}

/**
 * Generate detailed report PDF
 */
async function generateDetailedPdf(params: PdfParams): Promise<Buffer> {
  const { cycleId, departmentId } = params;

  // Get cycle info
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    select: { name: true, weightsConfig: true },
  });

  const weights = cycle?.weightsConfig as { kpi: number; coreValues: number } || { kpi: 0.8, coreValues: 0.2 };

  // Build user filter
  const userWhere: Record<string, unknown> = { isActive: true };
  if (departmentId) {
    userWhere.departmentId = departmentId;
  }

  // Get employees
  const employees = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      name: true,
      email: true,
      department: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  const employeeIds = employees.map((e) => e.id);

  // Get all evaluations
  const evaluations = await prisma.evaluation.findMany({
    where: {
      employeeId: { in: employeeIds },
      cycleId,
    },
    select: {
      employeeId: true,
      evaluationType: true,
      status: true,
      selfRating: true,
      managerRating: true,
      objective: { select: { title: true, category: true } },
      coreValue: { select: { name: true } },
    },
  });

  // Group by employee
  const evalByEmployee = new Map<string, typeof evaluations>();
  for (const eval_ of evaluations) {
    const existing = evalByEmployee.get(eval_.employeeId) || [];
    existing.push(eval_);
    evalByEmployee.set(eval_.employeeId, existing);
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Detailed Report - ${cycle?.name || "Unknown"}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 40px;
      color: #1e3a5f;
    }
    h1 {
      color: #1e3a5f;
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 10px;
    }
    h2 {
      color: #475569;
      margin-top: 30px;
      page-break-before: always;
    }
    .employee-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      background: #f8fafc;
    }
    .employee-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .employee-name {
      font-size: 18px;
      font-weight: bold;
      color: #1e3a5f;
    }
    .score-box {
      background: #1e3a5f;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      text-align: center;
    }
    .score-value {
      font-size: 24px;
      font-weight: bold;
    }
    .score-label {
      font-size: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px;
      text-align: left;
      font-size: 12px;
    }
    th {
      background: #475569;
      color: white;
    }
    .summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <h1>Detailed Performance Evaluation Report</h1>

  <div class="summary-box">
    <h2 style="page-break-before: auto; margin-top: 0;">Cycle: ${cycle?.name || "Unknown"}</h2>
    <p>Total Employees: ${employees.length}</p>
    <p>Generated: ${new Date().toLocaleString()}</p>
  </div>

  ${employees.map((employee) => {
    const empEvals = evalByEmployee.get(employee.id) || [];
    const kpiEvals = empEvals.filter((e) => e.evaluationType === "KPI");
    const cvEvals = empEvals.filter((e) => e.evaluationType === "CORE_VALUE");

    // Calculate scores
    const kpiRatings = kpiEvals.filter((e) => e.managerRating !== null).map((e) => e.managerRating as number);
    const cvRatings = cvEvals.filter((e) => e.managerRating !== null).map((e) => e.managerRating as number);

    const kpiScore = kpiRatings.length > 0
      ? kpiRatings.reduce((a, b) => a + b, 0) / kpiRatings.length
      : null;
    const cvScore = cvRatings.length > 0
      ? cvRatings.reduce((a, b) => a + b, 0) / cvRatings.length
      : null;
    const finalScore = kpiScore !== null && cvScore !== null
      ? kpiScore * weights.kpi + cvScore * weights.coreValues
      : null;

    return `
      <div class="employee-card">
        <div class="employee-header">
          <div>
            <div class="employee-name">${employee.name}</div>
            <div style="color: #64748b; font-size: 14px;">${employee.email}</div>
            <div style="color: #64748b; font-size: 14px;">${employee.department?.name || "Unassigned"}</div>
          </div>
          ${finalScore !== null ? `
            <div class="score-box">
              <div class="score-value">${finalScore.toFixed(2)}</div>
              <div class="score-label">Final Score</div>
            </div>
          ` : ""}
        </div>

        <h4 style="margin: 15px 0 10px 0; color: #1e3a5f;">KPI Evaluations</h4>
        <table>
          <tr>
            <th>Objective</th>
            <th>Category</th>
            <th>Self Rating</th>
            <th>Manager Rating</th>
            <th>Status</th>
          </tr>
          ${kpiEvals.map((e) => `
            <tr>
              <td>${e.objective?.title || "N/A"}</td>
              <td>${e.objective?.category || "N/A"}</td>
              <td>${e.selfRating ?? "-"}</td>
              <td>${e.managerRating ?? "-"}</td>
              <td>${e.status}</td>
            </tr>
          `).join("") || '<tr><td colspan="5" style="text-align: center;">No KPI evaluations</td></tr>'}
        </table>

        <h4 style="margin: 15px 0 10px 0; color: #1e3a5f;">Core Values Evaluations</h4>
        <table>
          <tr>
            <th>Core Value</th>
            <th>Self Rating</th>
            <th>Manager Rating</th>
            <th>Status</th>
          </tr>
          ${cvEvals.map((e) => `
            <tr>
              <td>${e.coreValue?.name || "N/A"}</td>
              <td>${e.selfRating ?? "-"}</td>
              <td>${e.managerRating ?? "-"}</td>
              <td>${e.status}</td>
            </tr>
          `).join("") || '<tr><td colspan="4" style="text-align: center;">No Core Value evaluations</td></tr>'}
        </table>

        ${kpiScore !== null || cvScore !== null ? `
          <div style="margin-top: 15px; padding: 10px; background: #e0f2fe; border-radius: 4px;">
            <strong>Calculated Scores:</strong>
            KPI: ${kpiScore?.toFixed(2) || "N/A"} |
            Core Values: ${cvScore?.toFixed(2) || "N/A"} |
            Final: ${finalScore?.toFixed(2) || "N/A"}
          </div>
        ` : ""}
      </div>
    `;
  }).join("")}

  <div class="footer">
    <p>Performance Metrics Portal - Confidential</p>
    <p>Report generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `;

  return generatePdfFromHtml(html);
}

/**
 * Generate historical evaluation PDF
 */
export async function generateHistoricalEvaluationPdf(
  params: HistoricalEvaluationPdfParams
): Promise<Buffer> {
  const data = await getHistoricalEvaluationData(params);

  if (!data) {
    throw new Error("Historical evaluation data not found");
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Historical Evaluation - ${data.cycle.name}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 40px;
      color: #1e3a5f;
    }
    h1 {
      color: #1e3a5f;
      border-bottom: 2px solid #1e3a5f;
      padding-bottom: 10px;
    }
    h2 {
      color: #475569;
      margin-top: 30px;
    }
    h3 {
      color: #1e3a5f;
      margin-top: 20px;
    }
    .summary-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    .stat-item {
      text-align: center;
      padding: 15px;
      background: #f1f5f9;
      border-radius: 8px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
    }
    .stat-value.excellent { color: #16a34a; }
    .stat-value.good { color: #ca8a04; }
    .stat-value.fair { color: #ea580c; }
    .stat-value.poor { color: #dc2626; }
    .stat-label {
      font-size: 14px;
      color: #64748b;
      margin-top: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 15px 0;
    }
    .info-item {
      padding: 10px;
    }
    .info-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
    .info-value {
      font-size: 14px;
      color: #1e3a5f;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px;
      text-align: left;
    }
    th {
      background: #1e3a5f;
      color: white;
    }
    tr:nth-child(even) {
      background: #f8fafc;
    }
    .rating-cell {
      text-align: center;
      font-weight: bold;
    }
    .comments-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 12px;
      margin: 10px 0;
    }
    .comments-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
      margin-bottom: 5px;
    }
    .footer {
      margin-top: 40px;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }
    .divider {
      border-top: 1px solid #e2e8f0;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <h1>Historical Performance Evaluation</h1>

  <div class="summary-box">
    <h2 style="margin-top: 0;">${data.cycle.name}</h2>
    <p style="color: #64748b;">${formatPdfDate(data.cycle.startDate)} - ${formatPdfDate(data.cycle.endDate)}</p>
  </div>

  <h3>Employee Information</h3>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Employee</div>
      <div class="info-value">${data.employee.name}</div>
      <div style="font-size: 12px; color: #64748b;">${data.employee.email}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Department</div>
      <div class="info-value">${data.employee.department ?? "N/A"}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Manager</div>
      <div class="info-value">${data.manager?.name ?? "N/A"}</div>
    </div>
  </div>

  <h3>Performance Scores</h3>
  <div class="stat-grid">
    <div class="stat-item">
      <div class="stat-value ${getScoreColorClass(data.scores.kpiScore)}">${data.scores.kpiScore?.toFixed(2) ?? "N/A"}</div>
      <div class="stat-label">KPI Score (${Math.round(data.scores.weights.kpi * 100)}%)</div>
    </div>
    <div class="stat-item">
      <div class="stat-value ${getScoreColorClass(data.scores.coreValuesScore)}">${data.scores.coreValuesScore?.toFixed(2) ?? "N/A"}</div>
      <div class="stat-label">Core Values (${Math.round(data.scores.weights.coreValues * 100)}%)</div>
    </div>
    <div class="stat-item">
      <div class="stat-value ${getScoreColorClass(data.scores.finalScore)}">${data.scores.finalScore?.toFixed(2) ?? "N/A"}</div>
      <div class="stat-label">Final Score</div>
    </div>
  </div>

  ${data.kpiEvaluations.length > 0 ? `
  <h3>Objectives (${data.kpiEvaluations.length})</h3>
  <table>
    <tr>
      <th>Objective</th>
      <th>Category</th>
      <th>Self Rating</th>
      <th>Manager Rating</th>
    </tr>
    ${data.kpiEvaluations.map((e) => `
      <tr>
        <td>${e.objective?.title ?? "N/A"}</td>
        <td>${e.objective?.category ?? "N/A"}</td>
        <td class="rating-cell">${e.selfRating ?? "-"}</td>
        <td class="rating-cell">${e.managerRating ?? "-"}</td>
      </tr>
      ${(e.selfComments || e.managerFeedback) ? `
      <tr>
        <td colspan="4" style="padding: 0;">
          ${e.selfComments ? `
            <div class="comments-box">
              <div class="comments-label">Self Comments</div>
              <div>${e.selfComments}</div>
            </div>
          ` : ""}
          ${e.managerFeedback ? `
            <div class="comments-box">
              <div class="comments-label">Manager Feedback</div>
              <div>${e.managerFeedback}</div>
            </div>
          ` : ""}
        </td>
      </tr>
      ` : ""}
    `).join("")}
  </table>
  ` : ""}

  ${data.coreValueEvaluations.length > 0 ? `
  <h3>Core Values (${data.coreValueEvaluations.length})</h3>
  <table>
    <tr>
      <th>Core Value</th>
      <th>Description</th>
      <th>Self Rating</th>
      <th>Manager Rating</th>
    </tr>
    ${data.coreValueEvaluations.map((e) => `
      <tr>
        <td>${e.coreValue?.name ?? "N/A"}</td>
        <td>${e.coreValue?.description ?? "N/A"}</td>
        <td class="rating-cell">${e.selfRating ?? "-"}</td>
        <td class="rating-cell">${e.managerRating ?? "-"}</td>
      </tr>
    `).join("")}
  </table>
  ` : ""}

  ${data.summary ? `
  <h3>Final Summary</h3>
  <div class="summary-box">
    ${data.summary.overallComments ? `
      <div style="margin-bottom: 15px;">
        <div class="comments-label">Overall Comments</div>
        <div>${data.summary.overallComments}</div>
      </div>
    ` : ""}
    ${data.summary.bonusRecommendation ? `
      <div style="margin-bottom: 15px;">
        <div class="comments-label">Bonus Recommendation</div>
        <div>${data.summary.bonusRecommendation}</div>
      </div>
    ` : ""}
    ${data.summary.salaryAdjustment ? `
      <div>
        <div class="comments-label">Salary Adjustment</div>
        <div>${data.summary.salaryAdjustment}</div>
      </div>
    ` : ""}
    ${data.summary.finalizedAt ? `
      <div class="divider"></div>
      <div style="font-size: 12px; color: #64748b;">
        Finalized: ${formatPdfDate(data.summary.finalizedAt)}
      </div>
    ` : ""}
  </div>
  ` : ""}

  <div class="footer">
    <p>Performance Metrics Portal - Confidential</p>
    <p>Report generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>
  `;

  return generatePdfFromHtml(html);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate PDF from HTML content
 * Uses a simple approach - returns HTML that can be converted by the client
 * In production, this would use a proper PDF library like Puppeteer or @react-pdf
 */
function generatePdfFromHtml(html: string): Buffer {
  // For now, return the HTML as a buffer with PDF headers
  // In production, this would integrate with a proper PDF generation service
  const pdfHeader = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>
endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer
<< /Size 4 /Root 1 0 R >>
startxref
190
%%EOF

<!-- HTML Content for rendering -->
${html}
`;

  return Buffer.from(pdfHeader, "utf-8");
}

/**
 * Get completion report data
 */
async function getCompletionReportData(params: PdfParams): Promise<CompletionReport> {
  const { cycleId, departmentId } = params;

  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, name: true },
  });

  const userWhere: Record<string, unknown> = { isActive: true };
  if (departmentId) {
    userWhere.departmentId = departmentId;
  }

  const employees = await prisma.user.findMany({
    where: userWhere,
    select: {
      id: true,
      departmentId: true,
      department: { select: { id: true, name: true } },
    },
  });

  const employeeIds = employees.map((e) => e.id);

  const evaluations = await prisma.evaluation.findMany({
    where: {
      employeeId: { in: employeeIds },
      cycleId,
    },
    select: {
      employeeId: true,
      status: true,
    },
  });

  const evalByEmployee = new Map<string, typeof evaluations>();
  for (const eval_ of evaluations) {
    const existing = evalByEmployee.get(eval_.employeeId) || [];
    existing.push(eval_);
    evalByEmployee.set(eval_.employeeId, existing);
  }

  const statusCounts = {
    notStarted: 0,
    selfInProgress: 0,
    selfSubmitted: 0,
    managerInProgress: 0,
    completed: 0,
  };

  let selfEvalCompleted = 0;
  let managerReviewCompleted = 0;

  for (const employeeId of employeeIds) {
    const empEvals = evalByEmployee.get(employeeId) || [];
    if (empEvals.length === 0) {
      statusCounts.notStarted++;
      continue;
    }

    const statuses = empEvals.map((e) => e.status);
    const overallStatus = getOverallEmployeeStatus(statuses);

    switch (overallStatus) {
      case "NOT_STARTED":
        statusCounts.notStarted++;
        break;
      case "SELF_IN_PROGRESS":
      case "RETURNED":
        statusCounts.selfInProgress++;
        break;
      case "SELF_SUBMITTED":
        statusCounts.selfSubmitted++;
        selfEvalCompleted++;
        break;
      case "MANAGER_IN_PROGRESS":
        statusCounts.managerInProgress++;
        selfEvalCompleted++;
        break;
      case "COMPLETED":
        statusCounts.completed++;
        selfEvalCompleted++;
        managerReviewCompleted++;
        break;
    }
  }

  // Calculate by department
  const departmentMap = new Map<string, { total: number; selfCompleted: number; managerCompleted: number }>();

  for (const employee of employees) {
    const deptId = employee.departmentId || "unassigned";

    if (!departmentMap.has(deptId)) {
      departmentMap.set(deptId, { total: 0, selfCompleted: 0, managerCompleted: 0 });
    }

    const deptStats = departmentMap.get(deptId)!;
    deptStats.total++;

    const empEvals = evalByEmployee.get(employee.id) || [];
    if (empEvals.length > 0) {
      const statuses = empEvals.map((e) => e.status);
      const overallStatus = getOverallEmployeeStatus(statuses);

      if (["SELF_SUBMITTED", "MANAGER_IN_PROGRESS", "COMPLETED"].includes(overallStatus)) {
        deptStats.selfCompleted++;
      }
      if (overallStatus === "COMPLETED") {
        deptStats.managerCompleted++;
      }
    }
  }

  const byDepartment = Array.from(departmentMap.entries()).map(([deptId, stats]) => ({
    department: {
      id: deptId,
      name: employees.find((e) => e.departmentId === deptId)?.department?.name || "Unassigned",
    },
    total: stats.total,
    selfEvalCompleted: stats.selfCompleted,
    managerReviewCompleted: stats.managerCompleted,
  }));

  return {
    cycle: { id: cycle?.id || "", name: cycle?.name || "Unknown" },
    overall: {
      totalEmployees: employeeIds.length,
      selfEvalCompleted,
      selfEvalPercentage: employeeIds.length > 0
        ? Math.round((selfEvalCompleted / employeeIds.length) * 100 * 10) / 10
        : 0,
      managerReviewCompleted,
      managerReviewPercentage: employeeIds.length > 0
        ? Math.round((managerReviewCompleted / employeeIds.length) * 100 * 10) / 10
        : 0,
    },
    byDepartment,
    byStatus: statusCounts,
    generatedAt: new Date(),
  };
}

/**
 * Get rating distribution data
 */
async function getRatingDistributionData(params: PdfParams): Promise<RatingDistributionReport> {
  const { cycleId } = params;

  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    select: { id: true, name: true, weightsConfig: true },
  });

  const evaluations = await prisma.evaluation.findMany({
    where: {
      cycleId,
      status: "COMPLETED",
      managerRating: { not: null },
    },
    select: {
      employeeId: true,
      evaluationType: true,
      managerRating: true,
    },
  });

  const kpiDistribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const coreValuesDistribution: RatingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const eval_ of evaluations) {
    const rating = eval_.managerRating as number;
    if (eval_.evaluationType === "KPI") {
      kpiDistribution[rating as keyof RatingDistribution]++;
    } else {
      coreValuesDistribution[rating as keyof RatingDistribution]++;
    }
  }

  // Calculate final score distribution
  const employeeScores = new Map<string, { kpiRatings: number[]; coreValueRatings: number[] }>();

  for (const eval_ of evaluations) {
    if (!employeeScores.has(eval_.employeeId)) {
      employeeScores.set(eval_.employeeId, { kpiRatings: [], coreValueRatings: [] });
    }

    const scores = employeeScores.get(eval_.employeeId)!;
    if (eval_.evaluationType === "KPI") {
      scores.kpiRatings.push(eval_.managerRating as number);
    } else {
      scores.coreValueRatings.push(eval_.managerRating as number);
    }
  }

  const weights = cycle?.weightsConfig as { kpi: number; coreValues: number } || { kpi: 0.8, coreValues: 0.2 };
  const finalScores: number[] = [];

  for (const [, scores] of employeeScores) {
    if (scores.kpiRatings.length > 0 && scores.coreValueRatings.length > 0) {
      const kpiAvg = scores.kpiRatings.reduce((a, b) => a + b, 0) / scores.kpiRatings.length;
      const cvAvg = scores.coreValueRatings.reduce((a, b) => a + b, 0) / scores.coreValueRatings.length;
      const finalScore = kpiAvg * weights.kpi + cvAvg * weights.coreValues;
      finalScores.push(finalScore);
    }
  }

  const ranges = [
    { min: 0, max: 1.5, count: 0, label: "0 - 1.5" },
    { min: 1.5, max: 2.5, count: 0, label: "1.5 - 2.5" },
    { min: 2.5, max: 3.5, count: 0, label: "2.5 - 3.5" },
    { min: 3.5, max: 4.5, count: 0, label: "3.5 - 4.5" },
    { min: 4.5, max: 5, count: 0, label: "4.5 - 5" },
  ];

  for (const score of finalScores) {
    for (const range of ranges) {
      if (score >= range.min && score < range.max + 0.01) {
        range.count++;
        break;
      }
    }
  }

  return {
    cycle: { id: cycle?.id || "", name: cycle?.name || "Unknown" },
    kpiDistribution,
    coreValuesDistribution,
    finalScoreDistribution: { ranges },
    generatedAt: new Date(),
  };
}

function getOverallEmployeeStatus(statuses: string[]): string {
  if (statuses.length === 0) return "NOT_STARTED";
  if (statuses.every((s) => s === "NOT_STARTED")) return "NOT_STARTED";
  if (statuses.some((s) => s === "RETURNED")) return "RETURNED";
  if (statuses.some((s) => s === "SELF_IN_PROGRESS")) return "SELF_IN_PROGRESS";
  if (statuses.every((s) => s === "COMPLETED")) return "COMPLETED";
  if (statuses.some((s) => s === "MANAGER_IN_PROGRESS")) return "MANAGER_IN_PROGRESS";
  return "SELF_SUBMITTED";
}

function calculatePercentage(value: number, total: number): string {
  if (total === 0) return "0";
  return ((value / total) * 100).toFixed(1);
}

function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: "Below Expectations",
    2: "Needs Improvement",
    3: "Meets Expectations",
    4: "Above Expectations",
    5: "Exceeds Expectations",
  };
  return labels[rating] || "Unknown";
}

/**
 * Format date for PDF
 */
function formatPdfDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get score color class for PDF
 */
function getScoreColorClass(score: number | null): string {
  if (score === null) return "";
  if (score >= 4) return "excellent";
  if (score >= 3) return "good";
  if (score >= 2) return "fair";
  return "poor";
}

/**
 * Get historical evaluation data for PDF export
 */
async function getHistoricalEvaluationData(params: HistoricalEvaluationPdfParams) {
  const { employeeId, cycleId } = params;

  // Get cycle info
  const cycle = await prisma.reviewCycle.findUnique({
    where: { id: cycleId },
    select: {
      id: true,
      name: true,
      type: true,
      startDate: true,
      endDate: true,
      status: true,
      weightsConfig: true,
    },
  });

  if (!cycle) return null;

  // Get employee info
  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      email: true,
      department: { select: { name: true } },
      managerId: true,
    },
  });

  if (!employee) return null;

  // Get manager info
  let manager = null;
  if (employee.managerId) {
    manager = await prisma.user.findUnique({
      where: { id: employee.managerId },
      select: { id: true, name: true },
    });
  }

  // Get all evaluations for this employee in this cycle
  const evaluations = await prisma.evaluation.findMany({
    where: {
      employeeId,
      cycleId,
      status: "COMPLETED",
    },
    select: {
      id: true,
      evaluationType: true,
      selfRating: true,
      selfComments: true,
      managerRating: true,
      managerFeedback: true,
      selfSubmittedAt: true,
      managerReviewedAt: true,
      objective: {
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          ratingCriteria: true,
        },
      },
      coreValue: {
        select: {
          id: true,
          name: true,
          description: true,
          ratingCriteria: true,
        },
      },
    },
  });

  // Separate KPI and Core Value evaluations
  const kpiEvaluations = evaluations.filter((e) => e.evaluationType === "KPI");
  const coreValueEvaluations = evaluations.filter((e) => e.evaluationType === "CORE_VALUE");

  // Calculate scores
  const weights = cycle.weightsConfig as { kpi: number; coreValues: number } || { kpi: 0.8, coreValues: 0.2 };

  const kpiRatings = kpiEvaluations
    .filter((e) => e.managerRating !== null)
    .map((e) => e.managerRating as number);
  const coreValueRatings = coreValueEvaluations
    .filter((e) => e.managerRating !== null)
    .map((e) => e.managerRating as number);

  const kpiScore = kpiRatings.length > 0
    ? kpiRatings.reduce((a, b) => a + b, 0) / kpiRatings.length
    : null;
  const coreValuesScore = coreValueRatings.length > 0
    ? coreValueRatings.reduce((a, b) => a + b, 0) / coreValueRatings.length
    : null;
  const finalScore = kpiScore !== null && coreValuesScore !== null
    ? kpiScore * weights.kpi + coreValuesScore * weights.coreValues
    : null;

  // Get summary if exists
  const summary = await prisma.evaluationSummary.findFirst({
    where: {
      employeeId,
      cycleId,
    },
    select: {
      overallComments: true,
      bonusRecommendation: true,
      salaryAdjustment: true,
      finalizedAt: true,
    },
  });

  return {
    cycle: {
      id: cycle.id,
      name: cycle.name,
      type: cycle.type,
      startDate: cycle.startDate,
      endDate: cycle.endDate,
      status: cycle.status,
    },
    employee: {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department?.name ?? null,
    },
    manager,
    kpiEvaluations: kpiEvaluations.map((e) => ({
      id: e.id,
      objective: e.objective ? {
        id: e.objective.id,
        title: e.objective.title,
        description: e.objective.description,
        category: e.objective.category,
        ratingCriteria: e.objective.ratingCriteria as Record<number, string>,
      } : undefined,
      selfRating: e.selfRating,
      selfComments: e.selfComments,
      managerRating: e.managerRating,
      managerFeedback: e.managerFeedback,
    })),
    coreValueEvaluations: coreValueEvaluations.map((e) => ({
      id: e.id,
      coreValue: e.coreValue ? {
        id: e.coreValue.id,
        name: e.coreValue.name,
        description: e.coreValue.description,
        ratingCriteria: e.coreValue.ratingCriteria as Record<number, string>,
      } : undefined,
      selfRating: e.selfRating,
      managerRating: e.managerRating,
    })),
    scores: {
      kpiScore,
      coreValuesScore,
      finalScore,
      weights,
    },
    summary: summary ? {
      overallComments: summary.overallComments,
      bonusRecommendation: summary.bonusRecommendation,
      salaryAdjustment: summary.salaryAdjustment,
      finalizedAt: summary.finalizedAt,
    } : null,
  };
}
