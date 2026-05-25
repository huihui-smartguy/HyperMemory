// Mock NovaMem 进程 · 占 8001 端口模拟后端 3 个接口 + 几个 admin 端点
// 用法：  node scripts/mock-novamem.mjs
//        然后另开终端跑 npm run dev:bff
import http from 'node:http';

const PORT = Number(process.env.PORT) || 8001;

// 与 lib/api/_novamem-client.ts 的 fixture 保持一致的形态
const RECALL_FIXTURE = [
  {
    memory: {
      id: 'nm_8f02a1',
      scope: { user_id: 'wealth-01', session_id: 'sess_2026-05-22-0091', agent_id: 'agent-101' },
      kind: 'active',
      content: '用户在过去 14 天内连续 3 次拒绝高风险股票基金推荐，倾向避险。',
      tags: ['偏好漂移', '避险', '高净值'],
      ttl_seconds: 720 * 3600,
      created_at: '2026-05-21T17:42:00Z',
    },
    scoring: { relevance: 0.92, recency: 0.81, importance: 0.7, signals: ['拒绝高风险资产', '隐私条款敏感'] },
  },
  {
    memory: {
      id: 'nm_9c41bd',
      scope: { user_id: 'wealth-01', session_id: 'sess_2026-05-22-0117', agent_id: 'agent-101' },
      kind: 'active',
      content: '用户年龄 35，净资产 ¥620 万，注册渠道为线下贵宾室。',
      tags: ['静态画像'],
      ttl_seconds: 8760 * 3600,
      created_at: '2026-04-01T09:12:00Z',
    },
    scoring: { relevance: 0.85, recency: 0.5, importance: 0.95, signals: ['KYC 已完成'] },
  },
  {
    memory: {
      id: 'nm_22ff90',
      scope: { user_id: 'wealth-01', session_id: 'sess_2026-05-22-0308', agent_id: 'agent-101' },
      kind: 'stale',
      content: '周末时段对账户体检 SOP 的接受率为 78%，远高于推销类。',
      tags: ['时段', '情景规则', '周末'],
      ttl_seconds: 2160 * 3600,
      created_at: '2026-05-20T22:31:00Z',
    },
    scoring: { relevance: 0.78, recency: 0.65, importance: 0.6, signals: ['时间窗口', '行为模式'] },
  },
];

const RECALL_LOGS = [
  {
    id: 'tr_6b21f9_e7a44c1d',
    query: '我最近想买点稳健的理财',
    scope: { user_id: 'wealth-01', agent_id: 'agent-101' },
    duration_ms: 107,
    top_k: 8,
    created_at: '2026-05-22T18:01:23Z',
    results_count: 8,
  },
  {
    id: 'tr_6b21f8_9af33c01',
    query: '搜索一下最近的基金报告',
    scope: { user_id: 'wealth-01', agent_id: 'agent-101' },
    duration_ms: 64,
    top_k: 5,
    created_at: '2026-05-22T18:00:55Z',
    results_count: 5,
  },
  {
    id: 'tr_6b21f6_4e90ff12',
    query: '推荐高收益的基金',
    scope: { user_id: 'wealth-01', agent_id: 'agent-101' },
    duration_ms: 138,
    top_k: 8,
    created_at: '2026-05-22T18:00:01Z',
    results_count: 6,
  },
];

const START_TS = Date.now();

function send(res, status, body, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const traceId = req.headers['x-trace-id'] || `srv-${Date.now().toString(16)}`;

  // /health
  if (req.method === 'GET' && url.pathname === '/health') {
    return send(res, 200, {
      status: 'ok',
      version: 'mock-novamem-0.1',
      milvus_lite_ok: true,
      sqlite_ok: true,
      uptime_s: Math.round((Date.now() - START_TS) / 1000),
      memory_count: RECALL_FIXTURE.length,
      cpu_pct: 28,
      mem_pct: 52,
    });
  }

  // POST /v1/memories  · 202
  if (req.method === 'POST' && url.pathname === '/v1/memories') {
    await readBody(req).catch(() => ({}));
    return send(res, 202, {});
  }

  // POST /v1/recall
  if (req.method === 'POST' && url.pathname === '/v1/recall') {
    const body = await readBody(req).catch(() => ({}));
    const query = body.query ?? '';
    return send(res, 200, {
      results: RECALL_FIXTURE.map((r) => ({
        ...r,
        scoring: { ...r.scoring, query },
      })),
    });
  }

  // GET /v1/admin/recall-logs · 模拟 P0 待补端点
  if (req.method === 'GET' && url.pathname === '/v1/admin/recall-logs') {
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200);
    return send(res, 200, { items: RECALL_LOGS.slice(0, limit) });
  }

  // GET /v1/admin/recall-logs/:id
  if (req.method === 'GET' && url.pathname.startsWith('/v1/admin/recall-logs/')) {
    const id = decodeURIComponent(url.pathname.split('/').pop());
    const log = RECALL_LOGS.find((l) => l.id === id);
    if (!log) return send(res, 404, { error: 'not_found' });
    return send(res, 200, log);
  }

  return send(res, 404, { error: 'route_not_found', path: url.pathname, method: req.method });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[mock-novamem] listening on http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[mock-novamem] endpoints:`);
  console.log(`  GET  /health`);
  console.log(`  POST /v1/memories`);
  console.log(`  POST /v1/recall`);
  console.log(`  GET  /v1/admin/recall-logs`);
  console.log(`  GET  /v1/admin/recall-logs/:id`);
});

process.on('SIGINT', () => {
  console.log('\n[mock-novamem] shutting down');
  server.close(() => process.exit(0));
});
