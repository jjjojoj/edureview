<div align="center">

# 智评 EduReview

**AI 驱动的教育分析平台** — 教师端 / 家长端 / 学生画像

[中文](README.md) | [English](README.en.md)

![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![tRPC v11](https://img.shields.io/badge/tRPC-v11-398CCB?logo=trpc)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)
![TanStack Router](https://img.shields.io/badge/TanStack_Router-SSR-FF4154)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

</div>

---

> 智评 EduReview 围绕 **「AI 作业分析 → 知识盲点识别 → 针对性出题 → 学习轨迹跟踪 → 多维度报告」** 构建教育分析闭环平台。
>
> 面向 K12 教育场景，支持教师、家长双角色，通过多模型 AI 实现作业智能批改与学情洞察。

---

## 目录

- [核心功能](#核心功能)
- [技术栈](#技术栈)
- [系统架构](#系统架构)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [环境变量配置](#环境变量配置)
- [数据库模型](#数据库模型)
- [工程优化](#工程优化)
- [使用指南](#使用指南)
- [开发指南](#开发指南)
- [许可证](#许可证)

---

## 核心功能

<table>
<tr>
<td width="50%">

**🤖 AI 作业分析**<br/>
上传作业图片 → AI 自动识别学生信息、批改内容、提取错题、分析知识薄弱点，生成结构化分析报告。

</td>
<td width="50%">

**📊 学情洞察面板**<br/>
班级维度：成绩趋势、知识点掌握热力图、作业完成率统计。<br/>
学生维度：个人画像、错题本、进步曲线、知识点雷达图。

</td>
</tr>
<tr>
<td width="50%">

**📝 针对性题目生成**<br/>
基于学生知识盲点，AI 自动生成针对性练习题，支持多种题型和难度梯度。

</td>
<td width="50%">

**👥 多角色协作**<br/>
<strong>教师端</strong>：创建班级、上传作业、查看报告、管理学生分组。<br/>
<strong>家长端</strong>：关联学生、上传作业、查看学习进度。

</td>
</tr>
<tr>
<td width="50%">

**📚 教学资料库**<br/>
教师上传和管理教学资料（PDF/图片），支持分类整理和快速检索。

</td>
<td width="50%">

**📈 报告生成**<br/>
一键生成 Excel / PDF 格式的班级报告，包含成绩分析、知识点分布、学生排名等。

</td>
</tr>
</table>

---

## 技术栈

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
| Zustand | 客户端状态管理 |
| react-hot-toast | 通知提示 |
| react-hook-form + Zod | 表单验证 |

### 后端

| 技术 | 用途 |
| --- | --- |
| tRPC v11 | 类型安全 API 框架 |
| Prisma ORM | 数据库访问层 |
| PostgreSQL 16 | 主数据库 |
| Vinxi + Nitro | 应用构建 & 服务端运行时 |
| JWT | 认证鉴权 |
| MinIO / 阿里云 OSS | 文件存储 |

### AI 集成

| 能力 | 说明 |
| --- | --- |
| 作业 OCR | 自动识别学生信息、学号、姓名 |
| 作业批改 | AI 分析作业内容，提取对错 |
| 错题提取 | 自动提取错题并关联知识点 |
| 知识盲点分析 | 多维度分析学生知识薄弱点 |
| 针对性出题 | 基于薄弱点生成练习题 |
| 多模型支持 | OpenRouter / SiliconCloud / 阿里云百炼 / Anthropic / Google |

---

## 系统架构

```mermaid
flowchart TB
    subgraph Client["客户端 (SPA + SSR)"]
        Teacher["教师端"]
        Parent["家长端"]
        Router["TanStack Router<br/>SSR + Code Splitting"]
        Guard["RequireAuth 路由守卫"]
        Error["ErrorBoundary 错误边界"]
    end

    subgraph API["API 层 (tRPC v11)"]
        RateLimit["Rate Limiter<br/>请求频率限制"]
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
        OSS[("MinIO / 阿里云 OSS<br/>文件存储")]
    end

    Teacher --> Router
    Parent --> Router
    Router --> Guard
    Guard --> API
    Error -.-> Client
    Auth --> RateLimit
    API --> AI
    API --> Data
    Upload --> OSS
    Analysis --> AI
    Analysis --> PG
```

---

## 项目结构

```
edureview/
├── src/
│   ├── routes/                    # 页面路由 (TanStack Router 文件路由)
│   │   ├── __root.tsx             # 根布局 (Toaster / Outlet)
│   │   ├── index.tsx              # 首页 (重定向)
│   │   ├── 404.tsx                # 404 页面
│   │   ├── auth/                  # 登录 / 注册
│   │   ├── dashboard/             # 教师仪表板 (lazy loaded modals)
│   │   └── classes/               # 班级管理
│   │       └── $classId/
│   │           ├── index.tsx      # 班级概览
│   │           └── students/
│   │               └── $studentId/# 学生详情
│   │
│   ├── components/                # React 组件 (52 个)
│   │   ├── class/                 # 班级相关组件
│   │   │   ├── ClassOverview.tsx
│   │   │   └── ClassStudents.tsx
│   │   ├── student/               # 学生相关组件
│   │   │   ├── StudentList.tsx
│   │   │   ├── StudentForm.tsx
│   │   │   ├── StudentDetailHeader.tsx
│   │   │   ├── StudentImportZone.tsx
│   │   │   └── StudentPerformanceChart.tsx
│   │   ├── assignment/            # 作业上传组件
│   │   │   ├── FileUploadZone.tsx
│   │   │   ├── AssignmentConfig.tsx
│   │   │   ├── AssignmentPreview.tsx
│   │   │   ├── TeacherCameraCapture.tsx
│   │   │   ├── UploadSubmitSection.tsx
│   │   │   └── compressImage.ts
│   │   ├── parent/                # 家长端组件
│   │   │   ├── ParentFileUploadZone.tsx
│   │   │   ├── ParentFileList.tsx
│   │   │   ├── ParentCameraCapture.tsx
│   │   │   └── compressImage.ts
│   │   ├── question/              # 题目生成组件
│   │   │   └── GeneratedQuestionsDisplay.tsx
│   │   ├── upload/                # 上传工具组件
│   │   │   ├── FileDropZone.tsx
│   │   │   └── AdvancedAnalytics.tsx
│   │   ├── ArchiveClassModal/     # 归档班级弹窗 (拆分)
│   │   │   ├── ChoiceStep.tsx
│   │   │   ├── PromoteFormStep.tsx
│   │   │   ├── ConfirmPromoteStep.tsx
│   │   │   ├── ConfirmArchiveStep.tsx
│   │   │   ├── ProcessingStep.tsx
│   │   │   ├── SuccessStep.tsx
│   │   │   └── types.ts
│   │   ├── RequireAuth.tsx        # 路由守卫 (认证保护)
│   │   ├── ErrorBoundary.tsx      # 错误边界 (渲染异常捕获)
│   │   ├── ConfirmDialog.tsx      # 确认对话框 (可复用)
│   │   ├── Toast.tsx              # Toast 通知封装
│   │   ├── DashboardSkeleton.tsx  # 仪表板骨架屏
│   │   └── ...                    # 其他业务组件
│   │
│   ├── server/                    # 服务端代码
│   │   ├── trpc/
│   │   │   ├── main.ts            # tRPC 入口
│   │   │   ├── handler.ts         # HTTP handler
│   │   │   ├── root.ts            # 路由聚合
│   │   │   ├── rateLimiter.ts     # 速率限制中间件
│   │   │   ├── procedures/        # tRPC 过程 (38 个)
│   │   │   └── routers/           # 路由模块
│   │   ├── ai-service.ts          # AI 服务层
│   │   ├── db.ts                  # Prisma 客户端
│   │   ├── storage.ts             # OSS 文件存储
│   │   ├── minio.ts               # MinIO 适配
│   │   ├── env.ts                 # 环境变量校验
│   │   ├── debug/
│   │   │   └── client-logs-handler.ts  # 开发环境日志转发
│   │   └── utils/
│   │       └── base-url.ts
│   │
│   ├── stores/                    # Zustand 状态管理
│   │   └── authStore.ts           # 认证状态 (persist)
│   ├── utils/                     # 前端工具函数
│   │   └── trpcError.ts           # 统一错误处理 (getErrorMessage)
│   ├── types/                     # TypeScript 类型定义
│   └── generated/                 # 自动生成的文件
│
├── prisma/
│   ├── schema.prisma              # 数据库模型 (15 个)
│   └── migrations/                # 数据库迁移
├── public/                        # 静态资源
├── app.config.ts                  # Vinxi 应用配置
├── .env.example                   # 环境变量示例
└── package.json
```

### 组件模块一览

| 模块目录 | 组件数 | 职责 |
| --- | --- | --- |
| `components/class/` | 2 | 班级概览、学生列表 |
| `components/student/` | 5 | 学生列表、表单、详情、导入、成绩图 |
| `components/assignment/` | 6 | 作业上传区域、配置、预览、拍照、提交 |
| `components/parent/` | 4 | 家长端上传、文件列表、拍照 |
| `components/question/` | 1 | AI 生成题目展示 |
| `components/upload/` | 2 | 通用文件拖放、高级分析 |
| `components/ArchiveClassModal/` | 7 | 归档班级多步骤向导 |
| 通用组件 (根目录) | ~25 | 认证守卫、错误边界、对话框、Toast、骨架屏、图表、表单等 |

---

## 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 12+
- pnpm 8+

### 1. 克隆项目

```bash
git clone -b dev https://github.com/jjjojoj/hui-xi.git
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
DATABASE_URL="postgresql://user:***@localhost:5432/teachai"
ADMIN_PASSWORD="your-admin-password"
JWT_SECRET="your-jwt-secret-key"
BASE_URL="http://localhost:3000"

# ===== AI 服务（至少配置一个） =====
OPENROUTER_API_KEY="***"
SILICONCLOUD_API_KEY="***"
ALIBABA_BAILIAN_API_KEY="***"

# ===== 文件存储 =====
# MinIO (自托管) 或 阿里云 OSS
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-secret"
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
    "Teacher" ||--o{ "Class" : "创建"
    "Teacher" ||--o{ "TeacherKnowledgeArea" : "擅长"
    "Teacher" ||--o{ "TeachingMaterial" : "上传"
    "Parent" ||--o{ "Student" : "关联"
    "Class" ||--o{ "Student" : "包含"
    "Class" ||--o{ "StudentGroup" : "分组"
    "Student" ||--o{ "Assignment" : "提交作业"
    "Student" ||--o{ "Exam" : "提交考试"
    "Student" ||--o{ "StudentKnowledgeArea" : "掌握情况"
    "Student" }o--o| "StudentGroup" : "属于"
    "Assignment" ||--o| "AssignmentAnalysis" : "AI分析"
    "Exam" ||--o| "ExamAnalysis" : "AI分析"
    "AssignmentAnalysis" ||--o{ "Mistake" : "错题"
    "ExamAnalysis" ||--o{ "ExamMistake" : "错题"
    "Mistake" }o--|| "KnowledgeArea" : "涉及"
    "ExamMistake" }o--|| "KnowledgeArea" : "涉及"
    "KnowledgeArea" ||--o{ "StudentKnowledgeArea" : "被掌握"
```

---

## 工程优化

项目经过系统性架构优化，提升代码可维护性、安全性和用户体验：

### 架构组件

| 组件 | 说明 |
| --- | --- |
| `RequireAuth` | 路由守卫，保护需认证页面，自动重定向至登录页 |
| `ErrorBoundary` | React 错误边界，捕获渲染异常，展示友好错误页面 |
| `ConfirmDialog` | 可复用确认对话框，支持危险操作样式和加载状态 |
| `Toast` | 统一通知封装，基于 react-hot-toast，提供一致的调用接口 |
| `DashboardSkeleton` | 仪表板骨架屏，优化首屏加载体验 |

### 组件拆分

按业务域组织组件目录，降低单文件复杂度：

- `class/` — 班级概览与学生列表
- `student/` — 学生管理相关组件
- `assignment/` — 作业上传流程拆分
- `parent/` — 家长端独立组件
- `upload/` — 通用上传工具
- `question/` — 题目展示组件
- `ArchiveClassModal/` — 归档向导拆分为 6 个步骤组件 + 类型定义

### 安全加固

- **认证端点速率限制** — 基于 `rateLimiter` 中间件，按手机号/IP 限制请求频率（登录 5次/分钟，注册 3次/分钟）
- **统一错误处理** — `getErrorMessage` 将 tRPC 错误码映射为中文友好提示，避免信息泄露

### 代码质量

- **表单验证** — 全面采用 `react-hook-form` + Zod 校验，覆盖登录、注册、创建班级、上传作业等表单
- **懒加载** — Dashboard 页面的弹窗组件使用 `React.lazy` 按需加载
- **Dev-only 日志转发** — 浏览器 console 仅在开发环境转发到服务端，生产环境完全禁用
- **404 页面** — 独立的 404 路由，提供清晰的导航引导

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

## 开发指南

### 可用脚本

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 生产构建
pnpm start        # 启动生产服务器
pnpm typecheck    # TypeScript 类型检查
pnpm lint         # ESLint 代码检查
pnpm format       # Prettier 代码格式化
pnpm db:push      # 推送 Schema 到数据库
pnpm db:generate  # 生成 Prisma 迁移
pnpm db:migrate   # 执行数据库迁移
pnpm db:studio    # 打开 Prisma Studio
```

### 开发规范

- **组件组织** — 按业务域划分子目录，通用组件放根目录
- **表单处理** — 统一使用 `react-hook-form` + Zod
- **错误处理** — 使用 `getErrorMessage` 统一转换错误提示
- **API 调用** — 通过 tRPC 客户端，保持端到端类型安全
- **状态管理** — 服务端状态用 TanStack Query，客户端状态用 Zustand

---

## 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

<div align="center">

**智评 EduReview** — 用 AI 智能分析改变教育方式

</div>
