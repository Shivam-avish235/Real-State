/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:5000/api/v1";
const TEST_USER_EMAIL = process.env.SMOKE_USER_EMAIL || "phase3.admin@example.com";
const TEST_USER_PASSWORD = process.env.SMOKE_USER_PASSWORD || "Str0ngPass1";

const results = [];

const addResult = (endpoint, status, ok, note) => {
  results.push({ endpoint, status, ok, note });
};

const extractNote = (response) => {
  if (!response.ok) {
    if (response.json && typeof response.json.message === "string") {
      return response.json.message;
    }

    if (typeof response.text === "string" && response.text.length > 0) {
      return response.text.slice(0, 180);
    }

    return "Request failed";
  }

  const data = response.json ? response.json.data : undefined;

  if (typeof data === "string") {
    return data.slice(0, 80);
  }

  if (Array.isArray(data)) {
    return `count=${data.length}`;
  }

  if (data && typeof data === "object") {
    if (typeof data.id === "string") {
      return `id=${data.id}`;
    }

    if (Array.isArray(data.items)) {
      return `items=${data.items.length}`;
    }

    if (typeof data.total === "number") {
      return `total=${data.total}`;
    }

    if (data.user && typeof data.user.id === "string") {
      return `userId=${data.user.id}`;
    }
  }

  return response.json && typeof response.json.message === "string" ? response.json.message : "ok";
};

const request = async ({ endpoint, method, path, token, body, expectCsv = false }) => {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!expectCsv) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  let json = null;

  if (!expectCsv && text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  const result = {
    endpoint,
    status: response.status,
    ok: response.ok,
    text,
    json
  };

  const note = expectCsv && response.ok ? `bytes=${Buffer.byteLength(text, "utf8")}` : extractNote(result);
  addResult(endpoint, result.status, result.ok, note);

  return result;
};

const waitForHealthyServer = async (attempts = 15) => {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/health`, { method: "GET" });
      if (response.ok) {
        return true;
      }
    } catch {
      // Server is not ready yet.
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
  }

  return false;
};

const bootstrapAdmin = async () => {
  const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, 12);

  const existing = await prisma.user.findUnique({
    where: { email: TEST_USER_EMAIL }
  });

  if (!existing) {
    const created = await prisma.user.create({
      data: {
        firstName: "Phase",
        lastName: "Admin",
        email: TEST_USER_EMAIL,
        phone: "9999999999",
        role: "ADMIN",
        status: "ACTIVE",
        passwordHash
      }
    });

    return created.id;
  }

  const updated = await prisma.user.update({
    where: { id: existing.id },
    data: {
      passwordHash,
      status: "ACTIVE"
    }
  });

  return updated.id;
};

const main = async () => {
  let hadFailure = false;

  try {
    const bootstrapUserId = await bootstrapAdmin();
    console.log(`Bootstrap user ready: ${TEST_USER_EMAIL} (${bootstrapUserId})`);

    const isHealthy = await waitForHealthyServer();
    if (!isHealthy) {
      hadFailure = true;
      addResult("GET /health", 0, false, "Backend is unreachable on http://localhost:5000");
      throw new Error("Backend health check failed. Ensure backend is running on port 5000.");
    }

    const health = await request({
      endpoint: "GET /health",
      method: "GET",
      path: "/health"
    });

    if (!health.ok) {
      hadFailure = true;
      throw new Error("Backend health check failed. Ensure backend is running on port 5000.");
    }

    const login = await request({
      endpoint: "POST /auth/login",
      method: "POST",
      path: "/auth/login",
      body: {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      }
    });

    const token = login.json && login.json.data ? login.json.data.accessToken : undefined;

    if (!token) {
      hadFailure = true;
      throw new Error("Unable to obtain access token from login response.");
    }

    await request({
      endpoint: "GET /auth/me",
      method: "GET",
      path: "/auth/me",
      token
    });

    const createClient = await request({
      endpoint: "POST /clients",
      method: "POST",
      path: "/clients",
      token,
      body: {
        type: "BUYER",
        firstName: "Phase",
        lastName: "Three",
        phone: "9999999999"
      }
    });

    const clientId = createClient.json && createClient.json.data ? createClient.json.data.id : undefined;

    await request({
      endpoint: "GET /clients",
      method: "GET",
      path: "/clients",
      token
    });

    if (!clientId) {
      hadFailure = true;
      throw new Error("Client creation failed; cannot continue deal flow.");
    }

    const createDeal = await request({
      endpoint: "POST /deals",
      method: "POST",
      path: "/deals",
      token,
      body: {
        title: "Phase 3 Test Deal",
        dealValue: 1000000,
        clientId
      }
    });

    const dealId = createDeal.json && createDeal.json.data ? createDeal.json.data.id : undefined;

    if (!dealId) {
      hadFailure = true;
      throw new Error("Deal creation failed; cannot continue stage/pipeline flow.");
    }

    await request({
      endpoint: "POST /deals/:id/stage",
      method: "POST",
      path: `/deals/${dealId}/stage`,
      token,
      body: {
        toStage: "NEGOTIATION"
      }
    });

    await request({
      endpoint: "GET /deals/pipeline",
      method: "GET",
      path: "/deals/pipeline",
      token
    });

    await request({
      endpoint: "POST /communications/timeline",
      method: "POST",
      path: "/communications/timeline",
      token,
      body: {
        type: "NOTE",
        subject: "Smoke note",
        description: "phase3 smoke"
      }
    });

    await request({
      endpoint: "GET /communications/timeline",
      method: "GET",
      path: "/communications/timeline",
      token
    });

    const reminder = await request({
      endpoint: "POST /communications/reminders",
      method: "POST",
      path: "/communications/reminders",
      token,
      body: {
        title: "Smoke reminder",
        dueAt: "2030-01-01T10:00:00.000Z"
      }
    });

    const reminderId = reminder.json && reminder.json.data ? reminder.json.data.id : undefined;

    if (reminderId) {
      await request({
        endpoint: "POST /communications/reminders/:id/complete",
        method: "POST",
        path: `/communications/reminders/${reminderId}/complete`,
        token
      });
    } else {
      hadFailure = true;
      addResult("POST /communications/reminders/:id/complete", 0, false, "Skipped because reminder id was not returned");
    }

    await request({
      endpoint: "GET /reports/dashboard-summary",
      method: "GET",
      path: "/reports/dashboard-summary",
      token
    });

    await request({
      endpoint: "GET /reports/sales",
      method: "GET",
      path: "/reports/sales",
      token
    });

    await request({
      endpoint: "GET /reports/lead-conversion",
      method: "GET",
      path: "/reports/lead-conversion",
      token
    });

    await request({
      endpoint: "GET /reports/agent-performance",
      method: "GET",
      path: "/reports/agent-performance",
      token
    });

    await request({
      endpoint: "GET /reports/revenue-trend",
      method: "GET",
      path: "/reports/revenue-trend",
      token
    });

    await request({
      endpoint: "GET /reports/export/csv?type=SALES",
      method: "GET",
      path: "/reports/export/csv?type=SALES",
      token,
      expectCsv: true
    });
  } catch (error) {
    hadFailure = true;
    const message = error instanceof Error ? error.message : "Unexpected smoke test error";
    addResult("SMOKE_RUNTIME", 0, false, message);
  } finally {
    await prisma.$disconnect();
  }

  console.table(results);

  const failed = results.filter((item) => !item.ok);
  if (failed.length > 0 || hadFailure) {
    console.log(`Smoke test finished with ${failed.length} failing request(s).`);
    process.exit(1);
  }

  console.log("Smoke test finished successfully with all requests passing.");
};

void main();
