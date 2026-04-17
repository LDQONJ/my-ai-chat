# my-ai-chat - AI聊天应用

一个基于Vue 3 + Vite构建的现代化AI聊天界面应用，提供简洁优雅的用户体验。

## ✨ 功能特性

- 💬 实时AI对话界面
- 🎨 现代化UI设计，支持深色主题
- 📱 响应式布局，适配移动端
- 🔄 基于Pinia的状态管理
- 🎯 使用Element Plus组件库
- 📝 Markdown消息渲染支持
- ⚡ Vite快速构建工具

## 🛠️ 技术栈

- **前端框架**: Vue 3 + Composition API
- **构建工具**: Vite
- **状态管理**: Pinia
- **UI组件库**: Element Plus
- **路由管理**: Vue Router
- **Markdown渲染**: markdown-it
- **代码高亮**: highlight.js
- **安全处理**: DOMPurify

## 🚀 快速开始

### 环境要求

- Node.js >= 20.0.0
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

应用将在 http://localhost:5173 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```


## 🔌 API接口说明

### 请求格式

前端向AI服务发送GET请求，参数为聊天字符串：

```http
GET /api/chat?message=你的聊天内容
```

### 响应格式

后端返回Flux<String>流式响应，数据格式为：

```json
data:{"content":"AI回复内容"}
```

### 示例

**请求：**
```http
GET /api/chat?message=你好，请介绍一下自己
```

**响应：**
```json
data:{"content":"你好！我是AI助手，很高兴为您服务。"}
data:{"content":"我可以帮助您解答各种问题，提供信息和建议。"}
```

## 📁 项目结构
```
src/
    ├── components/                 # 组件目录
    │   ├── ChatWindow.vue          # 聊天窗口组件
    │   ├── InputBox.vue            # 输入框组件
    │   ├── MessageItem.vue         # 消息项组件
    │   └── Sidebar.vue             # 侧边栏组件 
    ├── store/                      # 状态管理
    │   └── chat.js                 # 聊天状态管理 
    ├── api/                        # API接口 
    │   └── stream.js               # 聊天接口
    ├── utils/                      # 工具函数 
    │   └── markdownStreamParser.js # markdown解析工具
    ├── assets/                     # 静态资源 
    ├── App.vue                     # 根组件 
    ├── main.js                     # 入口文件 
    └── style.css                   # 全局样式
```

## 🎯 核心组件

### ChatWindow
聊天消息展示窗口，负责渲染对话历史。

### InputBox
用户输入组件，支持发送消息。

### MessageItem
单条消息渲染组件，区分用户和AI消息。

### Sidebar
侧边栏组件，提供对话列表管理。

## 🔧 配置说明

### 环境变量
在 `.env.local` 文件中配置API密钥等敏感信息：

```env
VITE_API_KEY=your_api_key_here
VITE_API_BASE_URL=https://api.example.com
```

## 📦 依赖说明

### 主要依赖

- `vue` - Vue 3框架
- `pinia` - 状态管理
- `element-plus` - UI组件库
- `vue-router` - 路由管理
- `markdown-it` - Markdown解析
- `highlight.js` - 代码高亮
- `dompurify` - HTML净化

### 开发依赖

- `vite` - 构建工具
- `@vitejs/plugin-vue` - Vue插件

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License

## 🙏 致谢

感谢以下开源项目的支持：

- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Element Plus](https://element-plus.org/)
- [Pinia](https://pinia.vuejs.org/)