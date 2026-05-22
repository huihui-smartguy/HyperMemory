import type { SchemaDraft, SchemaNode } from '../types';

export const MOCK_SCHEMA_TREE: SchemaNode[] = [
  {
    id: 'skill-root',
    type: 'skill',
    name: 'Skill 记忆 Schema',
    version: 'v3.2.1',
    status: 'stable',
    children: [
      {
        id: 'skill-recommend',
        type: 'skill',
        name: '理财推荐 · Recommend',
        version: 'v3.2.1',
        status: 'evolving',
        children: [
          { id: 'skill-tpo', type: 'skill', name: 'TPO 干预策略', version: 'v0.9', status: 'draft' },
          { id: 'skill-risk', type: 'skill', name: '风险等级匹配', version: 'v2.0', status: 'stable' },
        ],
      },
      {
        id: 'skill-sop',
        type: 'skill',
        name: '账户体检 · SOP',
        version: 'v1.4',
        status: 'stable',
      },
    ],
  },
  {
    id: 'general-root',
    type: 'general',
    name: '通用记忆 Schema',
    version: 'v6.0.0',
    status: 'stable',
    children: [
      {
        id: 'general-profile',
        type: 'general',
        name: '用户静态画像',
        version: 'v6.0',
        status: 'stable',
      },
      {
        id: 'general-pref',
        type: 'general',
        name: '动态偏好基座',
        version: 'v6.1-rc',
        status: 'evolving',
      },
      {
        id: 'general-compliance',
        type: 'general',
        name: '合规与隐私约束',
        version: 'v6.0',
        status: 'stable',
      },
    ],
  },
];

const OLD_MD = `### 规则约束 · 理财推荐 v3.2.1

1. 推荐策略默认按用户「风险等级」匹配标的池。
2. 当用户净资产 > ¥300 万：优先推荐股票型 / 混合型基金。
3. 周末时段：保持工作日推荐策略不变。
4. 拒绝行为：单次拒绝不调整推荐权重。
`;

const NEW_MD = `### 规则约束 · 理财推荐 v3.3.0-rc

1. 推荐策略默认按用户「风险等级」匹配标的池。
2. 当用户净资产 > ¥300 万：优先推荐股票型 / 混合型基金。
3. **[周末场景重组]** 周末 09:00–22:00 针对高净值用户，**冻结激进推荐 Skill**，切换至「账户体检 SOP」。
4. **[偏好漂移阻断]** 连续 3 次拒绝同类标的：TPO 引擎在推理期对该类目权重 ×0.2。
5. **[合规增强]** 隐私条款敏感用户：禁用主动推送，仅响应被动询问。
`;

export const MOCK_SCHEMA_DRAFT: SchemaDraft = {
  id: 'draft_2026-05-22_01',
  title: '理财推荐 · 周末场景与偏好漂移阻断',
  surprise: 0.91,
  triggeredBy: '近 7 天高净值用户周末拒绝率突增 47%',
  oldMarkdown: OLD_MD,
  newMarkdown: NEW_MD,
  status: 'AWAITING_APPROVAL',
};

export const MOCK_REASONING_CHUNKS = [
  '检测到用户连续拒绝固定策略的推荐结果...',
  '推测风险偏好在周末时段发生「避险型」漂移。',
  '反事实推演：如未在周末冻结激进推荐，预期 7 日内 NPS 下降 12 个百分点。',
  '形成 TPO 干预规则：周末高净值用户 → 资产盘点 Skill；激进推荐权重 ×0.2。',
  '请审阅 Schema Diff，确认后落盘生效。',
];
