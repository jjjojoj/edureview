# 智学分析 - AI教育分析平台

一个基于AI的智能教育分析平台，帮助教师分析学生作业、管理班级、跟踪学习进度，并提供数据驱动的教学洞察。

## 🚀 功能特性

### 核心功能
- **智能AI作业分析** - 使用先进的AI算法分析学生作业并提供详细反馈
- **班级管理** - 创建和管理多个班级，邀请学生加入
- **学习表现分析** - 可视化学生进度和班级整体表现
- **批量上传处理** - 支持批量上传作业和考试试卷
- **个性化报告生成** - 自动生成PDF和Excel格式的学习报告

### AI功能
- 作业自动评分和反馈
- 知识盲点识别
- 针对性题目生成
- 学生信息自动识别
- 多模型AI支持（OpenAI、Anthropic、Google、OpenRouter）

### 管理功能
- 教学资料库管理
- 上传统计和分析
- 班级晋升和归档
- 邀请码管理

## 🛠️ 技术栈

### 前端
- **React 19** - 用户界面框架
- **TypeScript** - 类型安全
- **TanStack Router** - 路由管理
- **Tailwind CSS** - 样式设计
- **tRPC** - 类型安全的API调用

### 后端
- **Node.js** - 运行时环境
- **tRPC** - 类型安全的API框架
- **Prisma** - ORM数据库管理
- **PostgreSQL** - 主数据库
- **MinIO/OSS** - 文件存储

### AI集成
- **AI SDK** - 统一的AI服务接口
- **多模型支持** - OpenAI、Anthropic、Google、OpenRouter
- **OCR识别** - 学生信息自动识别

## 📦 安装和运行

### 环境要求
- Node.js 18+
- PostgreSQL 12+
- pnpm 8+

### 快速开始

1. **克隆项目**
```bash
git clone <repository-url>
cd teach
```

2. **安装依赖**
```bash
pnpm install
```

3. **环境配置**
复制环境变量文件并配置：
```bash
cp .env.example .env
```
编辑 `.env` 文件，配置数据库连接和AI服务密钥。

4. **数据库设置**
```bash
# 生成Prisma客户端
pnpm run postinstall

# 运行数据库迁移
pnpm run db:generate
pnpm run db:migrate
```

5. **启动开发服务器**
```bash
pnpm run dev
```

### 生产部署

1. **构建项目**
```bash
pnpm run build
```

2. **启动生产服务器**
```bash
pnpm run start
```

## 🔧 配置说明

### 环境变量

必需配置：
```env
DATABASE_URL="postgresql://username:password@localhost:5432/teach"
```

AI服务配置（至少配置一个）：
```env
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
GOOGLE_AI_API_KEY="your-google-ai-key"
OPENROUTER_API_KEY="your-openrouter-key"
```

文件存储配置：
```env
MINIO_ENDPOINT="minio.example.com"
MINIO_ACCESS_KEY="your-access-key"
MINIO_SECRET_KEY="your-secret-key"
MINIO_BUCKET="teach-bucket"
```

### 数据库架构

项目使用Prisma管理数据库，主要包含以下模型：
- 教师(Teacher)和家长(Parent)账户管理
- 学生(Student)信息和班级(Class)管理
- 作业(Assignment)和考试(Exam)记录
- AI分析结果(AssignmentAnalysis/ExamAnalysis)
- 知识点(KnowledgeArea)和错题(Mistake)管理
- 教学资料(TeachingMaterial)库

## 📖 使用指南

### 教师端使用

1. **注册登录** - 使用手机号注册教师账号
2. **创建班级** - 在仪表板中创建新班级，获取邀请码
3. **学生管理** - 通过邀请码邀请学生加入班级
4. **作业上传** - 上传学生作业图片进行AI分析
5. **查看报告** - 在班级页面查看学生表现和分析报告

### 家长端使用

1. **注册登录** - 使用手机号注册家长账号
2. **关联学生** - 输入学生信息关联到账号
3. **上传作业** - 上传孩子作业图片
4. **查看进度** - 查看孩子的学习进度和分析报告

### API使用

项目提供完整的tRPC API，支持类型安全的客户端调用。所有API端点都在 `src/server/trpc` 目录中定义。

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 📄 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果您遇到问题或有疑问：
1. 查看 [使用手册](./USER_MANUAL.md) 获取详细指导
2. 检查 [常见问题](./FAQ.md)
3. 提交 Issue 到GitHub仓库

## 🙏 致谢

- 感谢所有贡献者和用户
- 使用到的开源项目和库
- AI服务提供商的支持

---

**智学分析** - 用AI智能分析改变教育方式 🎓