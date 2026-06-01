#!/usr/bin/env node

const adminBaseUrl = normalizeBaseUrl(
  process.env.ADMIN_BASE_URL || "https://admin.doucatapp.top"
);
const apiBaseUrl = normalizeBaseUrl(
  process.env.API_BASE_URL || "https://api.doucatapp.top"
);
const adminToken = process.env.ADMIN_AUTH_TOKEN || "";
const adminL2Token = process.env.ADMIN_L2_AUTH_TOKEN || "";
const timeoutMs = Number(process.env.VERIFY_TIMEOUT_MS || 15000);

const requiredUiText = ["人工调整", "确认人工调整", "确认反向调整"];
const checks = [];

await runCheck("Admin 前端可访问且包含人工调整入口", checkAdminBundle);
await runCheck("平台营收只读接口已部署", () =>
  checkAuthProtectedGet("/api/admin/finance/revenue/summary", adminToken)
);
await runCheck("人工调整接口已部署并受鉴权保护", () =>
  checkAdjustmentRoute(adminToken)
);

if (adminToken) {
  await runCheck("管理员 token 包含人工调整权限", () =>
    checkTokenPermission(adminToken, "finance:revenue:adjust")
  );
} else {
  checks.push({
    name: "管理员 token 包含人工调整权限",
    status: "skip",
    detail: "未提供 ADMIN_AUTH_TOKEN，仅完成匿名路由探测"
  });
}

if (adminL2Token) {
  await runCheck("2 级管理员无人工调整权限", () =>
    checkL2Forbidden(adminL2Token)
  );
} else {
  checks.push({
    name: "2 级管理员无人工调整权限",
    status: "skip",
    detail: "未提供 ADMIN_L2_AUTH_TOKEN，跳过 403 权限回归"
  });
}

printSummary();

if (checks.some(item => item.status === "fail")) {
  process.exitCode = 1;
}

function normalizeBaseUrl(value) {
  return String(value).replace(/\/+$/, "");
}

function buildUrl(baseUrl, path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

async function runCheck(name, fn) {
  try {
    const detail = await fn();
    checks.push({ name, status: "pass", detail });
  } catch (error) {
    checks.push({ name, status: "fail", detail: error.message });
  }
}

async function request(url, options = {}) {
  const headers = {
    Accept: "application/json, text/html;q=0.9, */*;q=0.8",
    ...(options.headers || {})
  };
  try {
    const response = await fetch(url, {
      ...options,
      headers,
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs)
    });
    const text = await response.text();
    return { response, text };
  } catch (error) {
    throw new Error(`请求失败 ${url}: ${formatNetworkError(error)}`);
  }
}

async function checkAdminBundle() {
  const { response, text } = await request(adminBaseUrl, {
    headers: { Accept: "text/html, */*;q=0.8" }
  });
  assertHttp(response.status, [200], `Admin 首页状态异常: ${response.status}`);

  const assetUrls = extractScriptUrls(text).slice(0, 40);
  if (assetUrls.length === 0) {
    throw new Error("未在 Admin 首页找到构建后的 JS 资源");
  }

  const bundleText = [];
  const failedAssets = [];
  for (const assetUrl of assetUrls) {
    try {
      const { response: assetResponse, text: assetText } = await request(
        assetUrl,
        { headers: { Accept: "application/javascript, text/javascript, */*" } }
      );
      if (assetResponse.ok) bundleText.push(assetText);
    } catch (error) {
      failedAssets.push(`${assetUrl}: ${error.message}`);
    }
  }

  const combined = `${text}\n${bundleText.join("\n")}`;
  const missing = requiredUiText.filter(item => !combined.includes(item));
  if (missing.length > 0) {
    throw new Error(`构建产物缺少文案: ${missing.join(", ")}`);
  }

  const note =
    failedAssets.length > 0
      ? `，${failedAssets.length} 个资源抓取失败但不影响命中文案`
      : "";
  return `命中 ${requiredUiText.join(" / ")}${note}`;
}

function extractScriptUrls(html) {
  const urls = new Set();
  const pattern =
    /<(?:script|link)\b[^>]+(?:src|href)=["']([^"']+\.(?:js|mjs)(?:\?[^"']*)?)["']/gi;
  let match;
  while ((match = pattern.exec(html))) {
    const rawUrl = match[1];
    const assetUrl = new URL(rawUrl, `${adminBaseUrl}/`).toString();
    urls.add(assetUrl);
  }
  return [...urls];
}

async function checkAuthProtectedGet(path, token) {
  const { response, text } = await request(buildUrl(apiBaseUrl, path), {
    headers: authHeaders(token)
  });

  if (token) {
    assertHttp(response.status, [200], `带 token 访问失败: ${response.status}`);
    return "带 token 返回 200";
  }

  assertNotFound(response.status, text);
  assertServerOk(response.status);
  return `匿名请求被鉴权拦截: ${response.status}`;
}

async function checkAdjustmentRoute(token) {
  const { response, text } = await request(
    buildUrl(apiBaseUrl, "/api/admin/finance/revenue/adjustments"),
    {
      method: "POST",
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json"
      },
      body: "{}"
    }
  );

  assertNotFound(response.status, text);
  assertServerOk(response.status);

  if (token) {
    assertHttp(
      response.status,
      [400, 422],
      `带超管/1级 token 应进入参数校验，实际状态: ${response.status}`
    );
    return `带 token 进入参数校验: ${response.status}`;
  }

  assertHttp(
    response.status,
    [401, 403],
    `匿名请求应被鉴权拦截，实际状态: ${response.status}`
  );
  return `匿名请求被鉴权拦截: ${response.status}`;
}

async function checkTokenPermission(token, permission) {
  const { response, text } = await request(
    buildUrl(apiBaseUrl, "/api/admin/auth/me"),
    { headers: authHeaders(token) }
  );
  assertHttp(response.status, [200], `读取当前管理员失败: ${response.status}`);

  if (!text.includes(permission)) {
    throw new Error(`当前 token 未返回 ${permission} 权限`);
  }

  return `当前管理员具备 ${permission}`;
}

async function checkL2Forbidden(token) {
  const { response, text } = await request(
    buildUrl(apiBaseUrl, "/api/admin/finance/revenue/adjustments"),
    {
      method: "POST",
      headers: {
        ...authHeaders(token),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        gross_amount: 1,
        platform_fee_amount: 1,
        channel_cost_amount: 0,
        reason: "线上权限回归测试",
        confirm_text: "确认人工调整"
      })
    }
  );

  assertNotFound(response.status, text);
  assertServerOk(response.status);
  assertHttp(
    response.status,
    [403],
    `2 级管理员应返回 403，实际状态: ${response.status}`
  );

  return "2 级管理员调整接口返回 403";
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function assertHttp(actual, expected, message) {
  if (!expected.includes(actual)) {
    throw new Error(message);
  }
}

function assertNotFound(status, text) {
  if (status === 404 || status === 405) {
    throw new Error(`接口未部署或方法未挂载: ${status} ${compact(text)}`);
  }
}

function assertServerOk(status) {
  if (status >= 500) {
    throw new Error(`服务端异常: ${status}`);
  }
}

function compact(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .slice(0, 180);
}

function formatNetworkError(error) {
  const parts = [error.message];
  if (error.cause?.code) parts.push(error.cause.code);
  if (error.cause?.message) parts.push(error.cause.message);
  return [...new Set(parts.filter(Boolean))].join(" / ");
}

function printSummary() {
  console.log(`线上财务模块验收`);
  console.log(`Admin: ${adminBaseUrl}`);
  console.log(`API: ${apiBaseUrl}`);
  console.log("");

  for (const item of checks) {
    const mark =
      item.status === "pass"
        ? "PASS"
        : item.status === "skip"
          ? "SKIP"
          : "FAIL";
    console.log(`[${mark}] ${item.name}`);
    console.log(`      ${item.detail}`);
  }

  const passed = checks.filter(item => item.status === "pass").length;
  const failed = checks.filter(item => item.status === "fail").length;
  const skipped = checks.filter(item => item.status === "skip").length;
  console.log("");
  console.log(`结果: ${passed} passed, ${failed} failed, ${skipped} skipped`);
}
