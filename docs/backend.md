# NovaMem 记忆引擎

一个功能完整的 AI 记忆管理系统,支持记忆的写入、召回、演进和遗忘等全生命周期管理。

## 核心特性

- **多维度记忆提取**: 支持用户画像、情景记忆、语义记忆等多类型记忆提取
- **异步消息处理**: 基于消息队列的背压控制、限流和自动重试机制
- **多路召回检索**: 向量语义检索 + 三因子评分(相关性 + 时效性 + 重要性)
- **自演进机制**: 基于效能指标的记忆遗忘、深加工、概念发现和关联强化
- **Service 层架构**: HTTP 层与业务逻辑分离,IngestService 和 RecallService 独立编排
- **显式依赖注入**: 通过 MemoryEngine dataclass 管理存储组件,无 monkey-patching
- **多存储支持**: Milvus Lite(向量)、SQLite(关系/原始数据)、FAISS(可选)
- **异步处理**: 记忆深加工、健康检查等异步任务,不影响实时性能

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 配置环境

```bash
# 复制环境变量模板
cp config/.env.example config/.env

# 编辑配置文件,填入必要的配置信息
# 如 LLM API、Embedding API 等
```

### 3. 启动 API 服务

```bash
# 启动 FastAPI 服务(默认端口 8001)
python src/server/api.py

# 或通过环境变量自定义配置和端口
NOVAMEM_CONFIG_PATH=config/demo.yaml NOVAMEM_API_PORT=8001 python src/server/api.py
```

### 4. 运行端到端测试

```bash
# 确保 API 服务已启动后运行测试
python tests/test_api_e2e.py
```

## 项目结构

```
NovaMem/
├── src/                          # 源代码
│   ├── core/                     # 核心引擎
│   │   ├── memory_engine.py     # MemoryEngine dataclass(显式存储容器)
│   │   ├── config.py            # 配置管理(YAML + 环境变量)
│   │   ├── types.py             # 数据类型定义(Memory/MemoryStatus 等)
│   │   ├── llm_manager.py       # LLM 管理器(公共工厂 init_model)
│   │   └── embedding_manager.py # Embedding 管理器
│   │
│   ├── service/                  # 业务服务层
│   │   ├── ingest_service.py    # 记忆摄入服务(累积/触发/提取/存储)
│   │   └── recall_service.py    # 记忆召回服务(向量检索/三因子评分)
│   │
│   ├── maintenance/              # 记忆维护
│   │   ├── ingest/              # 记忆摄入组件
│   │   │   ├── memory_processor.py  # 异步消息处理器(队列/背压/重试)
│   │   │   ├── preprocessor.py      # 消息预处理(去重/脱敏/截断)
│   │   │   ├── extractor_base.py    # 提取器基类
│   │   │   └── fact_extractor.py    # 事实提取器(LLM 驱动)
│   │   ├── effectiveness/       # 效能评估
│   │   │   ├── metrics.py           # 效能分数计算 + T2/T3 定时重算
│   │   │   └── lifecycle.py         # 生命周期状态机(active/stale/archived)
│   │   ├── organize/            # 记忆整理(待实现)
│   │   ├── dreaming/            # 梦境整理/离线加工(待实现)
│   │   └── experience/          # 经验学习(待实现)
│   │
│   ├── recall/                   # 记忆检索组件
│   │   ├── executor.py          # 检索执行器
│   │   ├── ranker.py            # 排序器
│   │   └── vector_recall.py     # 向量检索
│   │
│   ├── server/                   # API 服务层
│   │   └── api.py               # FastAPI 路由 + 鉴权 + 生命周期管理
│   │
│   ├── storage/                  # 存储层
│   │   ├── base.py              # 存储基类
│   │   ├── vector_db/           # 向量存储(Milvus Lite/FAISS)
│   │   ├── relational_db/       # 关系数据库(SQLite - 原始对话/召回日志)
│   │   ├── raw_store/           # 原始数据存储(文件)
│   │   ├── kv_store/            # KV 存储(SQLite - 已废弃)
│   │   ├── graph_db/            # 图数据库(预留)
│   │   ├── document_storage/    # 文档存储(预留)
│   │   └── file_storage/        # 文件存储(预留)
│   │
│   ├── scheduler/                # 调度器(待实现)
│   ├── schema/                   # Schema 定义
│   └── utils/                    # 工具模块
│       ├── logger.py            # 日志工具
│       └── async_queue.py       # 异步队列
│
├── service/                      # 业务服务层
│   ├── ingest_service.py        # MemoryIngestService(摄入编排)
│   └── recall_service.py        # MemoryRecallService(召回编排)
│
├── config/                       # 配置文件
│   ├── demo.yaml                # 演示环境配置
│   └── .env                     # 环境变量
│
├── data/                         # 数据目录
│   ├── milvus/                  # Milvus Lite 向量数据
│   ├── relational/              # SQLite 关系数据(原始对话/召回日志)
│   └── messages/pending/        # 待处理消息持久化
│
├── tests/                        # 测试
│   └── test_api_e2e.py          # 端到端测试(写入 + 召回)
│
└── docs/                         # 文档
    ├── memory-service-design.md # API 设计文档
    └── ...                      # 更多文档
```

## 主要功能模块

### 记忆写入流程

1. **HTTP 接入**: POST /v1/memories 接收原始对话消息([api.py](src/server/api.py))
2. **ConversationBuffer**: 累积对话轮次,达到阈值后触发提取([ingest_service.py](src/service/ingest_service.py))
3. **消息预处理**: 去重、脱敏、截断([preprocessor.py](src/maintenance/ingest/preprocessor.py))
4. **FactExtractor**: LLM 驱动的事实提取,生成结构化记忆([fact_extractor.py](src/maintenance/ingest/fact_extractor.py))
5. **多存储写入**: 
   - 原始对话 → SQLite relational_store
   - 提取的记忆 → Milvus Lite vector_store(向量 + 元数据)

### 记忆召回流程

1. **HTTP 接入**: POST /v1/recall 接收检索请求([api.py](src/server/api.py))
2. **向量检索**: 基于 Embedding 模型的语义检索,返回 Top-K 候选([vector_recall.py](src/recall/vector_recall.py))
3. **三因子评分**: 
   - **relevance**(50%): 向量相似度
   - **recency**(25%): 时间衰减(14天半衰期)
   - **importance**(25%): 静态重要性分数
4. **召回复活**: stale 状态记忆被召回时自动复活为 active
5. **召回日志**: 写入 recall_log 用于效能指标统计

### API 接口

| 端点 | 方法 | 功能 | 状态码 |
|------|------|------|--------|
| `/health` | GET | 健康检查 | 200 |
| `/v1/memories` | POST | 推送原始对话(异步) | 202 |
| `/v1/recall` | POST | 检索相关记忆 | 200 |

**请求示例**:

```bash
# 写入对话
curl -X POST http://localhost:8001/v1/memories \
  -H "Content-Type: application/json" \
  -d '{
    "scope": {
      "user_id": "user_001",
      "session_id": "session_001",
      "agent_id": "agent_001"
    },
    "messages": [
      {
        "role": "user",
        "content": "我是一名Python工程师",
        "turn_index": 1,
        "timestamp": "2026-05-21T10:00:00Z"
      }
    ]
  }'

# 召回记忆
curl -X POST http://localhost:8001/v1/recall \
  -H "Content-Type: application/json" \
  -d '{
    "scope": {
      "user_id": "user_001",
      "agent_id": "agent_001"
    },
    "query": "用户的职业是什么?",
    "options": {
      "top_k": 5
    }
  }'
```

### 架构设计

**MemoryEngine 显式容器**:
```python
# 替代 monkey-patching,通过 dataclass 显式管理存储组件
@dataclass
class MemoryEngine:
    vector_store: BaseStorage      # Milvus Lite / FAISS
    relational_store: BaseStorage  # SQLite(原始对话/召回日志)
```

**Service 层解耦**:
```python
# HTTP 层不再直接依赖业务组件
# 通过构造器注入 MemoryIngestService 和 MemoryRecallService
memory_ingest_service = MemoryIngestService(
    memory_engine=engine,
    memory_processor=processor,
    conversation_buffer=buffer,
    fact_extractor=extractor,
)
```

## 配置说明

主要配置文件位于 `config/` 目录：

- **demo.yaml**: 演示环境配置
- **.env.example**: 环境变量模板

详细配置说明请参考 [docs/API说明文档.md](docs/API说明文档.md)

## 开发指南

### 添加新的消息提取器

```python
from src.maintenance.ingest.extractor_base import BaseExtractor

class MyExtractor(BaseExtractor):
    async def extract(self, text: str, user_id: str, session_id: str = None):
        # 实现提取逻辑
        pass
```

### 添加新的检索引擎

```python
from src.recall.executor import BaseRecall

class MyRecall(BaseRecall):
    async def recall(self, query: str, top_k: int, filters: dict = None):
        # 实现召回逻辑
        pass
```

### 添加新的存储后端

```python
from src.storage.base import BaseStorage

class MyStorage(BaseStorage):
    async def initialize(self):
        # 初始化连接
        pass
    
    async def save(self, memory: Memory) -> str:
        # 保存记忆
        pass
```

## 技术栈

- **语言**: Python 3.12+
- **异步框架**: asyncio
- **Web 框架**: FastAPI + Uvicorn
- **向量数据库**: Milvus Lite(默认) / FAISS(可选)
- **关系数据库**: SQLite(原始对话/召回日志)
- **嵌入模型**: Qwen3-Embedding / 兼容 OpenAI 接口的 Embedding 模型
- **大模型**: 通义千问 / GLM / 兼容 OpenAI 接口的模型
- **测试**: pytest + httpx(端到端测试)

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。
