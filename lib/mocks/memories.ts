import type { MemoryRecord } from '../types';

// Mock 多用户记忆数据。userId 模拟真实 Milvus 中按 user_id 维度分桶。
export const MOCK_MEMORIES: MemoryRecord[] = [
  {
    id: 'mem_8f02a1',
    userId: 'u_42891',
    sessionId: 'sess_2026-05-22-0091',
    agentId: 'agent-101',
    tenant: '理财部 · Wealth-01',
    category: '画像规则',
    summary: '用户在过去 14 天内连续 3 次拒绝高风险股票基金推荐，倾向避险。',
    rawContent:
      '用户在过去 14 天内连续 3 次拒绝高风险股票基金推荐，倾向避险。\n\n' +
      '对话采样：\n' +
      '- 2026-05-08：「股票型基金现在风险有点高，我看看别的吧。」\n' +
      '- 2026-05-15：「不要股票，我想要稳健点的。」\n' +
      '- 2026-05-19：「最近行情我先不投股票了。」\n\n' +
      '决策建议：在该用户未来 30 天的推荐策略中，降低股票类资产权重至 0.2x，提升货币/短债权重至 1.6x。',
    tags: ['偏好漂移', '避险', '高净值'],
    triggers: ['拒绝高风险资产', '隐私条款敏感'],
    ttlHours: 720,
    createdAt: '2026-05-21 17:42',
    confidence: 0.92,
  },
  {
    id: 'mem_9c41bd',
    userId: 'u_42891',
    sessionId: 'sess_2026-05-22-0117',
    agentId: 'agent-101',
    tenant: '理财部 · Wealth-01',
    category: '语义记忆',
    summary: '用户年龄 35，净资产 ¥620 万，注册渠道为线下贵宾室。',
    rawContent:
      '用户年龄 35，净资产 ¥620 万，注册渠道为线下贵宾室。\n\n' +
      'KYC 字段：\n' +
      '- 风险等级：R2 稳健型\n' +
      '- 资产证明：完成（房产 1 处 + 基金持仓 ¥240w）\n' +
      '- 行业职业：金融科技 PM',
    tags: ['静态画像'],
    triggers: ['KYC 已完成'],
    ttlHours: 8760,
    createdAt: '2026-04-01 09:12',
    confidence: 0.99,
  },
  {
    id: 'mem_75ab12',
    userId: 'u_19077',
    sessionId: 'sess_2026-05-22-0212',
    agentId: 'agent-202',
    tenant: '信贷部 · Credit-02',
    category: '语义记忆',
    summary: '客户使用「稳健」「保本」等词频率上升 47%。',
    rawContent:
      '客户使用「稳健」「保本」等词频率上升 47%。\n\n' +
      'NLU 信号分析：\n' +
      '- 7 日滑窗内「稳健」出现 12 次（基线 3 次）\n' +
      '- 「保本」出现 7 次（基线 1 次）\n' +
      '- 同窗口「收益」「翻倍」等词频下降 28%',
    tags: ['NLU 信号', '语义漂移'],
    triggers: ['关键词聚类'],
    ttlHours: 168,
    createdAt: '2026-05-22 01:05',
    confidence: 0.81,
  },
  {
    id: 'mem_22ff90',
    userId: 'u_42891',
    sessionId: 'sess_2026-05-22-0308',
    agentId: 'agent-101',
    tenant: '理财部 · Wealth-01',
    category: '情景记忆',
    summary: '周末时段对账户体检 SOP 的接受率为 78%，远高于推销类。',
    rawContent:
      '周末时段对账户体检 SOP 的接受率为 78%，远高于推销类。\n\n' +
      '聚合数据（近 90 天，周末 14:00–22:00）：\n' +
      '- 账户体检 SOP 接受率：78%\n' +
      '- 产品推销类接受率：12%\n' +
      '- 风险提醒类接受率：64%',
    tags: ['时段', '情景规则', '周末'],
    triggers: ['时间窗口', '行为模式'],
    ttlHours: 2160,
    createdAt: '2026-05-20 22:31',
    confidence: 0.88,
  },
  {
    id: 'mem_61aa07',
    userId: 'u_88321',
    sessionId: 'sess_2026-05-22-0411',
    agentId: 'agent-303',
    tenant: '研究院 · Lab-A',
    category: '语义记忆',
    summary: '用户在 2026-05-19 触发风险等级评估结果为 R2 稳健型。',
    rawContent:
      '用户在 2026-05-19 触发风险等级评估结果为 R2 稳健型。\n\n' +
      '评估问卷得分：\n' +
      '- 投资经验：18/30\n' +
      '- 风险承受：12/25\n' +
      '- 流动性需求：高\n' +
      '综合等级：R2',
    tags: ['风险评估', 'R2'],
    triggers: ['官方 KYC'],
    ttlHours: 8760,
    createdAt: '2026-05-19 14:00',
    confidence: 0.97,
  },
  {
    id: 'mem_4ee231',
    userId: 'u_42891',
    sessionId: 'sess_2026-05-22-0455',
    agentId: 'agent-101',
    tenant: '理财部 · Wealth-01',
    category: '画像规则',
    summary: '检测到隐私条款敏感倾向，需禁用主动推送类 Skill。',
    rawContent:
      '检测到隐私条款敏感倾向，需禁用主动推送类 Skill。\n\n' +
      '触发样本：\n' +
      '- 「为什么你们知道我的资产情况？」\n' +
      '- 「这个隐私协议我能看一下吗？」\n' +
      '- 「不要主动推送给我消息。」\n\n' +
      '建议策略：本用户域内禁用 push.* / outbound.* 类 Skill；改用 pull-only 模式。',
    tags: ['合规', '隐私', '主动权限'],
    triggers: ['对隐私条款敏感'],
    ttlHours: 720,
    createdAt: '2026-05-22 02:14',
    confidence: 0.9,
  },
  {
    id: 'mem_18cc44',
    userId: 'u_19077',
    sessionId: 'sess_2026-05-22-0489',
    agentId: 'agent-202',
    tenant: '信贷部 · Credit-02',
    category: '语义记忆',
    summary: '客户对「利率」相关问题表现出强语义关注，置信 0.78。',
    rawContent:
      '客户对「利率」相关问题表现出强语义关注，置信 0.78。\n\n' +
      '近 7 天围绕「利率」的问答：\n' +
      '- 当前 LPR 怎么走的？\n' +
      '- 商业贷款利率上浮是多少？\n' +
      '- 提前还款会损失多少利息？',
    tags: ['关注度', '利率'],
    triggers: ['语义聚类'],
    ttlHours: 336,
    createdAt: '2026-05-22 02:31',
    confidence: 0.78,
  },
  {
    id: 'mem_a0b310',
    userId: 'u_42891',
    sessionId: 'sess_2026-05-22-0501',
    agentId: 'agent-101',
    tenant: '理财部 · Wealth-01',
    category: '情景记忆',
    summary: '在每日 21:00–23:00 用户行为模式聚集为「夜间复盘型」。',
    rawContent:
      '在每日 21:00–23:00 用户行为模式聚集为「夜间复盘型」。\n\n' +
      '行为序列统计：\n' +
      '- 查询持仓：高频\n' +
      '- 阅读市场资讯：中频\n' +
      '- 主动咨询：低频\n' +
      '推断：该用户在该时段倾向于回顾而非决策，建议优先展示报表/复盘内容。',
    tags: ['时段', '夜间', '复盘'],
    triggers: ['时间窗口'],
    ttlHours: 1080,
    createdAt: '2026-05-21 23:11',
    confidence: 0.83,
  },
];
