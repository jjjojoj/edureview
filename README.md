<div align="center">

# 慧析 HuiXi

AI 驱动的教育分析平台 —— 教师端 / 家长端 / 学生画像

[中文](README.md) | [English](README.en.md)

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![tRPC v11](https://img.shields.io/badge/tRPC-v11-398CCB?logo=trpc)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![TanStack Router](https://img.shields.io/badge/TanStack_Router-SSR-FF4154)

</div>

---

智学分析不是一个简单的作业批改工具，也不是一个只展示成绩的管理系统，而是一套围绕 **「AI 作业分析 → 知识盲点识别 → 针对性出题 → 学习轨迹跟踪 → 多维度报告」** 构建的教育分析闭环平台。

> 面向 K12 教育场景，支持教师、家长双角色，通过多模型 AI 实现作业智能批改与学情洞察。

---

## 目录

- [核心模块](#核心模块)
- [系统架构](#系统架构)
- [项目概览](#项目概览)
- [快速开始](#快速开始)
- [环境变量配置](#环境变量配置)
- [数据库模型](#数据库模型)
- [使用指南](#使用指南)
- [技术栈详情](#技术栈详情)
- [开发](#开发)
- [许可证](#许可证)

---

## 核心模块

<table>
<tr>
<td width="50%">

<strong>🤖 AI 作业分析</strong><br/>
上传作业图片 → AI 自动识别学生信息、批改内容、提取错题、分析知识薄弱点，生成结构化分析报告。

</td>
<td width="50%">

<strong>📊 学情洞察面板</strong><br/>
班级维度：成绩趋势、知识点掌握热力图、作业完成率统计。<br/>
学生维度：个人画像、错题本、进步曲线、知识点雷达图。

</td>
</tr>
<tr>
<td width="50%">

<strong>📝 针对性题目生成</strong><br/>
基于学生知识盲点，AI 自动生成针对性练习题，支持多种题型和难度梯度。

</td>
<td width="50%">

<strong>👥 多角色协作</strong><br/>
<strong>教师端</strong>：创建班级、上传作业、查看报告、管理学生分组。<br/>
<strong>家长端</strong>：关联学生、上传作业、查看学习进度。

</td>
</tr>
<tr>
<td width="50%">

<strong>📚 教学资料库</strong><br/>
教师上传和管理教学资料（PDF/图片），支持分类整理和快速检索。

</td>
<td width="50%">

<strong>📈 报告生成</strong><br/>
一键生成 Excel / PDF 格式的班级报告，包含成绩分析、知识点分布、学生排名等。

</td>
</tr>
</table>

---

## 系统架构

```mermaid
flowchart TB
    subgraph Client["客户端 (SPA)"]
        Teacher["教师端"]
        Parent["家长端"]
        Router["TanStack Router<br/>SSR + Code Splitting"]
    end

    subgraph API["API 层 (tRPC v11)"]
        Auth["认证 / 鉴权"]
        ClassMgmt["班级管理"]
        Upload["作业上传"]
        Analysis["AI 分析"]
        Report["报告生成"]
        Material["教学资料"]
    end

    subgraph AI["AI 服务层"]
        OCR["OCR 识别"]
        Grading["作业批改"]
        QuestionGen["题目生成"]
        MultiModel["多模型适配<br/>OpenRouter / SiliconCloud / 百炼"]
    end

    subgraph Data["数据层"]
        PG[("PostgreSQL")]
        OSS[("阿里云 OSS<br/>文件存储")]
    end

    Teacher --> Router
    Parent --> Router
    Router --> API
    API --> AI
    API --> Data
    Upload --> OSS
    Analysis --> AI
    Analysis --> PG
```

---

## 项目概览

| 项目 | 说明 |
| --- | --- |
| 主要用途 | AI 教育分析、学情洞察、针对性出题 |
| 前端框架 | React 19 + TanStack Router (SSR) |
| API 方案 | tRPC v11 (全栈类型安全) |
| 数据库 | PostgreSQL 16 + Prisma ORM |
| 文件存储 | 阿里云 OSS |
| AI 模型 | OpenRouter / SiliconCloud / 阿里云百炼 (多模型切换) |
| 部署方式 | Vinxi + Nitro (Node Server) |

---

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 12+
- pnpm 8+

### 1. 克隆项目

```bash
git clone https://github.com/jjjojoj/hui-xi.git
cd hui-xi
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入数据库连接和 API 密钥（详见 [环境变量配置](#环境变量配置)）。

### 4. 初始化数据库

```bash
# 推送 Schema 到数据库（开发环境）
pnpm db:push

# 或使用迁移（生产环境）
pnpm db:generate
pnpm db:migrate
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:3000`。

### 生产部署

```bash
pnpm build
pnpm start
```

---

## 环境变量配置

```env
# ===== 基础配置 =====
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/teachai"
ADMIN_PASSWORD="your-admin-password"
JWT_SECRET="your-jwt-secret-key"
BASE_URL="http://localhost:3000"

# ===== AI 服务（至少配置一个） =====
OPENROUTER_API_KEY="sk-or-..."
SILICONCLOUD_API_KEY="sk-..."
ALIBABA_BAILIAN_API_KEY="sk-..."

# ===== 阿里云 OSS（文件存储） =====
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"
OSS_BUCKET="teachai-bucket"
OSS_REGION="oss-cn-hangzhou"
```

> 完整示例见 [`.env.example`](.env.example)。

---

## 数据库模型

项目使用 Prisma ORM，共 15 个数据模型：

```mermaid
erDiagram
    Teacher ||--o{ Class : "创建"
    Teacher ||--o{ TeacherKnowledgeArea : "擅长"
    Teacher ||--o{ TeachingMaterial : "上传"
    Parent ||--o{ Student : "关联"
    Class ||--o{ Student : "包含"
    Class ||--o{ StudentGroup : "分组"
    Student ||--o{ Assignment : "提交作业"
    Student ||--o{ Exam : "提交考试"
    Student ||--o{ StudentKnowledgeArea : "掌握情况"
    Student }o--o| StudentGroup : "属于"
    Assignment ||--o| AssignmentAnalysis : "AI分析"
    Exam ||--o| ExamAnalysis : "AI分析"
    AssignmentAnalysis ||--o{ Mistake : "错题"
    ExamAnalysis ||--o{ ExamMistake : "错题"
    Mistake }o--|| KnowledgeArea : "涉及"
    ExamMistake }o--|| KnowledgeArea : "涉及"
    KnowledgeArea ||--o{ StudentKnowledgeArea : "被掌握"
```

---

## 使用指南

### 教师端

1. **注册登录** — 手机号注册教师账号
2. **创建班级** — 输入班级名称，系统生成邀请码
3. **邀请学生** — 分享邀请码，学生/家长通过邀请码加入
4. **上传作业** — 批量上传学生作业图片，AI 自动分析
5. **查看报告** — 班级维度和学生维度的多维度学情报告
6. **生成题目** — 基于知识薄弱点自动生成针对性练习
7. **管理资料** — 上传和管理教学资料库

### 家长端

1. **注册登录** — 手机号注册家长账号
2. **关联学生** — 输入学生姓名和学号关联到账号
3. **上传作业** — 上传孩子作业图片进行 AI 分析
4. **查看进度** — 查看孩子的学习进度、知识掌握情况和错题本

---

## 技术栈详情

### 前端

| 技术 | 用途 |
| --- | --- |
| React 19 | UI 框架 |
| TypeScript 5 | 类型安全 |
| TanStack Router | SSR 路由 + 自动代码分割 |
| TanStack Query | 服务端状态管理 |
| tRPC Client | 端到端类型安全 API 调用 |
| Tailwind CSS | 样式系统 |
| Headless UI | 无障碍 UI 组件 |
| Recharts | 数据可视化图表 |

### 后端

| 技术 | 用途 |
| --- | --- |
| tRPC v11 | 类型安全 API 框架 |
| Prisma | 数据库 ORM |
| PostgreSQL | 主数据库 |
| Vinxi + Nitro | 应用构建 & 服务端运行时 |
| 阿里云 OSS | 文件存储 |
| JWT | 认证鉴权 |

### AI 集成

| 能力 | 说明 |
| --- | --- |
| 作业 OCR | 自动识别学生信息、学号、姓名 |
| 作业批改 | AI 分析作业内容，提取对错 |
| 错题提取 | 自动提取错题并关联知识点 |
| 知识盲点分析 | 多维度分析学生知识薄弱点 |
| 针对性出题 | 基于薄弱点生成练习题 |
| 多模型支持 | OpenRouter / SiliconCloud / 阿里云百炼 |

---

## 开发

### 项目结构

```
hui-xi/
├── src/
│   ├── routes/              # 页面路由 (TanStack Router)
│   │   ├── auth/            # 登录注册
│   │   ├── dashboard/       # 教师仪表板
│   │   ├── classes/         # 班级管理
│   │   └── parent-dashboard/# 家长端
│   ├── components/          # React 组件 (19个)
│   ├── server/
│   │   ├── trpc/
│   │   │   ├── procedures/  # tRPC 过程 (38个)
│   │   │   └── root.ts      # 路由聚合
│   │   ├── ai-service.ts    # AI 服务层
│   │   ├── storage.ts       # OSS 文件存储
│   │   └── env.ts           # 环境变量校验
│   ├── stores/              # 状态管理
│   └── types/               # 类型定义
├── prisma/
│   ├── schema.prisma        # 数据库模型 (15个)
│   └── migrations/          # 数据库迁移
├── public/                  # 静态资源
├── app.config.ts            # Vinxi 应用配置
└── package.json
```

### 可用脚本

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 生产构建
pnpm start        # 启动生产服务器
pnpm db:push      # 推送 Schema 到数据库
pnpm db:generate  # 生成 Prisma 迁移
pnpm db:migrate   # 执行数据库迁移
pnpm db:studio    # 打开 Prisma Studio
```

---

## 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

**慧析 HuiXi** — 用 AI 智能分析改变教育方式
