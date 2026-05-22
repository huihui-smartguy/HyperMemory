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

// ---- 多份 Schema 进化提案，按节点 id 索引 ----

export interface DraftBundle {
  draft: SchemaDraft;
  chunks: string[];
}

const SKILL_RECOMMEND_OLD = `### 规则约束 · 理财推荐 v3.2.1

1. 推荐策略默认按用户「风险等级」匹配标的池。
2. 当用户净资产 > ¥300 万：优先推荐股票型 / 混合型基金。
3. 周末时段：保持工作日推荐策略不变。
4. 拒绝行为：单次拒绝不调整推荐权重。
`;

const SKILL_RECOMMEND_NEW = `### 规则约束 · 理财推荐 v3.3.0-rc

1. 推荐策略默认按用户「风险等级」匹配标的池。
2. 当用户净资产 > ¥300 万：优先推荐股票型 / 混合型基金。
3. **[周末场景重组]** 周末 09:00–22:00 针对高净值用户，**冻结激进推荐 Skill**，切换至「账户体检 SOP」。
4. **[偏好漂移阻断]** 连续 3 次拒绝同类标的：在推理期对该类目权重 ×0.2。
5. **[合规增强]** 隐私条款敏感用户：禁用主动推送，仅响应被动询问。
`;

const SKILL_TPO_OLD = `### TPO 干预策略 v0.8

- 召回阶段：仅对历史 3 天内的反馈做权重微调。
- 触发阈值：偏好漂移置信度 ≥ 0.85。
- 干预粒度：以「资产大类」为最小单位。
`;

const SKILL_TPO_NEW = `### TPO 干预策略 v0.9-draft

- 召回阶段：**滑窗扩展至 14 天**，并叠加昼/夜场景因子。
- 触发阈值：偏好漂移置信度 ≥ **0.78**（敏捷化）。
- 干预粒度：从「资产大类」下钻至 **「标的子类 + 时段」** 二维组合。
- **[新增]** 干预结果须回写至「动态偏好基座」，形成闭环。
`;

const GENERAL_PREF_OLD = `### 动态偏好基座 · v6.0

- 偏好维度：风险偏好、流动性偏好、收益预期 (3 维)。
- 衰减函数：指数衰减，半衰期 30 天。
- 更新触发：仅在 Agent 显式确认后写入。
`;

const GENERAL_PREF_NEW = `### 动态偏好基座 · v6.1-rc

- 偏好维度：**扩展至 5 维** — 风险偏好、流动性偏好、收益预期、**信息密度偏好**、**交互节奏偏好**。
- 衰减函数：**双轨衰减** — 静态偏好半衰期 90 天；情景偏好半衰期 7 天。
- 更新触发：**新增 Agent 隐式行为信号**（停留时长、滑过率、二次询问率）作为更新源。
- **[规则]** 当情景偏好与静态偏好冲突时，由 TPO 引擎根据上下文取舍并打标。
`;

export const MOCK_DRAFTS: Record<string, DraftBundle> = {
  'skill-recommend': {
    draft: {
      id: 'draft_2026-05-22_01',
      title: '理财推荐 · 周末场景与偏好漂移阻断',
      surprise: 0.91,
      triggeredBy: '近 7 天高净值用户周末拒绝率突增 47%',
      oldMarkdown: SKILL_RECOMMEND_OLD,
      newMarkdown: SKILL_RECOMMEND_NEW,
      status: 'AWAITING_APPROVAL',
    },
    chunks: [
      '检测到用户连续拒绝固定策略的推荐结果...',
      '推测风险偏好在周末时段发生「避险型」漂移。',
      '反事实推演：如未在周末冻结激进推荐，预期 7 日内 NPS 下降 12 个百分点。',
      '形成干预规则：周末高净值用户 → 资产盘点 Skill；激进推荐权重 ×0.2。',
      '请审阅 Schema Diff，确认后落盘生效。',
    ],
  },
  'skill-tpo': {
    draft: {
      id: 'draft_2026-05-22_02',
      title: 'TPO 干预策略 · 滑窗扩展与下钻粒度',
      surprise: 0.83,
      triggeredBy: '滑动窗口提取器观测到「短期信号」错配率达 19%',
      oldMarkdown: SKILL_TPO_OLD,
      newMarkdown: SKILL_TPO_NEW,
      status: 'AWAITING_APPROVAL',
    },
    chunks: [
      '近 7 天 TPO 干预命中率从 0.78 下降到 0.61...',
      '滑动窗口提取器发现「短期 3 天」覆盖不到周度行为周期。',
      '反事实推演：若滑窗扩展至 14 天，预计命中率回升至 0.85。',
      '形成提案：滑窗延长 + 阈值敏捷化 + 二维下钻干预粒度。',
      '请审阅 Schema Diff，确认后落盘生效。',
    ],
  },
  'general-pref': {
    draft: {
      id: 'draft_2026-05-22_03',
      title: '动态偏好基座 · 偏好维度扩展与双轨衰减',
      surprise: 0.87,
      triggeredBy: '通用画像与情景行为出现长期偏离，置信度 0.87',
      oldMarkdown: GENERAL_PREF_OLD,
      newMarkdown: GENERAL_PREF_NEW,
      status: 'AWAITING_APPROVAL',
    },
    chunks: [
      '通用画像 3 维偏好已无法覆盖情景行为差异...',
      '画像编译器检测到「信息密度偏好」「交互节奏偏好」两个稳定隐变量。',
      '反事实推演：单轨衰减会让情景偏好被静态偏好淹没，权重需要分轨。',
      '形成提案：5 维 + 双轨衰减 + 隐式行为信号作为更新源。',
      '请审阅 Schema Diff，确认后落盘生效。',
    ],
  },
};

export const DEFAULT_DRAFT_ID = 'skill-recommend';
