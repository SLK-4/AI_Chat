# AI API 调用工具 - 需求拆解文档

## 产品概述

- **产品类型**: AI 对话工具 / 大模型 API 聚合客户端
- **场景类型**: <scene_type>prototype-app</scene_type>
- **目标用户**: 开发者、AI 从业者、需要同时使用多家大模型的用户
- **核心价值**: 在一个界面内统一调用多家大语言模型 API，所有数据本地存储，无需后端服务
- **界面语言**: 中文
- **主题偏好**: 深色（默认），支持深色/浅色切换
- **导航模式**: 路径导航
- **导航布局**: Sidebar（左侧对话列表）+ Topbar（顶部服务商与设置）

---

## 页面结构总览

> **说明**: 单页应用，核心交互在同一页面完成。左侧对话列表为导航，主区域为聊天内容，右侧为参数面板（可折叠）。

**页面文件**: `ChatPage.tsx`（单页应用，所有功能在同一页面内通过弹窗/抽屉/折叠面板实现）

| 区域 | 说明 |
|-----|------|
| 左侧边栏（对话列表） | 对话历史列表、新建对话按钮、对话搜索、对话项悬停操作 |
| 顶部导航栏 | 服务商+模型选择器、参数面板开关、设置按钮、主题切换 |
| 主聊天区域 | 消息流展示、输入框、发送/停止按钮 |
| 右侧参数面板（可折叠） | System Prompt、Temperature 等参数调节 |
| 设置弹窗（模态） | API Key 管理、自定义服务商、导入导出、数据清除 |

---

## 页面布局建议

- **布局模式**: 三栏布局（左对话列表 + 中聊天区 + 右参数面板）—— 桌面端三栏并列，移动端折叠为单栏+抽屉式侧边栏
- **视觉重心**: 聊天主区域 —— 用户核心目标是与 AI 对话，消息流占据最大视觉空间
- **结果承载区**: 聊天消息流（纵向滚动）；初始态为欢迎页（显示首次使用引导 + 快捷操作）
- **源材料承载区**: 无（对话型应用，输入即输出上下文）

---

## 数据来源声明

| 数据/操作 | 来源类型 | 实现要求 | mock 兜底 |
|---|---|---|---|
| 服务商 API Key 管理 | local-persist | localStorage key=`__ai_chat_api_keys`，按服务商 ID 存储密钥，支持显示/隐藏切换 | 无（首次为空，引导用户填写） |
| 自定义服务商配置 | local-persist | localStorage key=`__ai_chat_custom_providers`，存储自定义服务商名称、Base URL、模型列表 | 无（默认为空） |
| 对话历史（所有对话） | local-persist | localStorage key=`__ai_chat_conversations`，存储对话列表及每条对话的消息、参数、服务商信息 | 初始 0 条，首次使用显示引导提示 |
| 当前对话参数设置 | local-persist | 每个对话独立保存 system prompt、temperature 等参数，内嵌在 conversation 对象中 | 默认值（temperature=0.7 等） |
| 应用设置（主题/默认服务商） | local-persist | localStorage key=`__ai_chat_settings`，存储主题偏好、默认服务商 ID、默认模型 | 默认深色主题 + 默认 OpenAI |
| AI 消息生成 | real-api | 浏览器直接 fetch 对应服务商 API 端点，通过 ReadableStream 处理 SSE 流式响应 | 失败时显示错误信息（状态码+描述），不崩溃 |
| 对话导出为 Markdown | import-export | Blob + URL.createObjectURL + a.click 触发 .md 文件下载 | 无 |
| 所有数据导出为 JSON | import-export | 序列化 localStorage 相关键，导出 .json 文件 | 无 |
| 对话 JSON 导入 | real-file | `<input type="file">` + FileReader 读取 JSON，合并入 localStorage | 导入失败提示错误信息 |
| 代码块语法高亮 | demo-mock | 使用 highlight.js 前端库渲染代码块 | ✅ 库本身即实现 |
| Markdown 渲染 | demo-mock | 使用 marked 或类似库将 Markdown 文本转为 HTML | ✅ 库本身即实现 |

> 类型选择 + 兜底约束见上方"数据来源声明方法论"段。本应用核心数据为本地持久化 + 真实外部 API 调用，无后端、无插件。

---

## 功能列表

### 左侧边栏（对话列表）

- **页面目标**: 管理和切换多个对话会话
- **功能点**:
  - **新建对话**: 点击"新建对话"按钮创建新会话，自动跳转到新对话，初始标题为"新对话"
  - **对话列表展示**: 按时间倒序排列，显示对话标题（取首条用户消息前 20 字）、所属服务商图标
  - **切换对话**: 点击对话项切换当前对话，加载对应消息流和参数设置
  - **删除对话**: 悬停/右键显示删除按钮，点击后带确认弹窗，删除后切换到下一个对话或新建状态
  - **重命名对话**: 悬停显示重命名按钮，弹出输入框修改标题
  - **对话搜索**: 顶部搜索框，按标题模糊筛选对话列表

### 顶部导航栏

- **页面目标**: 快速切换服务商和模型，访问全局设置
- **功能点**:
  - **服务商选择器**: 下拉选择当前对话使用的 AI 服务商（OpenAI/Claude/Gemini 等 8+ 家+自定义）
  - **模型选择器**: 下拉选择模型，支持手动输入自定义模型名，选项随服务商切换更新
  - **参数面板切换**: 点击按钮展开/收起右侧参数面板
  - **设置按钮**: 点击打开设置弹窗
  - **主题切换**: 深色/浅色模式切换按钮，状态持久化
  - **当前对话导出 Markdown**: 导出当前对话为 .md 文件

### 主聊天区域

- **页面目标**: 展示对话消息并与 AI 进行交互
- **功能点**:
  - **消息流渲染**: 气泡式展示，用户消息右对齐、AI 消息左对齐，显示角色标签（user/assistant）
  - **Markdown 渲染**: AI 消息支持 Markdown（标题、列表、表格、引用等），代码块语法高亮 + 一键复制按钮
  - **流式输出**: 通过 SSE 逐字显示 AI 回复，打字机动画效果
  - **停止生成**: 流式输出过程中显示"停止"按钮，点击中断请求
  - **重新生成**: 每条 AI 消息旁有"重新生成"按钮，基于上下文重新获取回复
  - **编辑并重发**: 每条用户消息旁有"编辑"按钮，修改后从该消息处重新继续对话（其后消息被截断）
  - **消息元信息**: AI 消息底部显示 token 用量（prompt/completion/total）、请求耗时、复制全文按钮
  - **错误展示**: API 调用失败时在消息位置显示红色错误条，包含状态码和错误描述
  - **加载状态**: 发送后 AI 侧显示打字动画（三点跳动）
  - **首次使用引导**: 无对话且无 API Key 时，主区域显示引导卡片，提示去设置 API Key

### 底部输入框

- **页面目标**: 输入和发送用户消息
- **功能点**:
  - **多行文本输入**: textarea，支持自动换行，拖拽调整高度
  - **发送消息**: 点击发送按钮或按 Ctrl+Enter 发送，Enter 换行
  - **快捷键支持**: Ctrl+Enter 发送、Ctrl+N 新建对话、Ctrl+S 停止生成
  - **发送状态**: 发送中禁用输入框和发送按钮，显示加载状态
  - **空值校验**: 空内容不发送

### 右侧参数面板（可折叠）

- **页面目标**: 调节当前对话的 AI 生成参数
- **功能点**:
  - **System Prompt**: 多行文本框，设置系统提示词，每个对话独立保存
  - **Temperature 温度**: 0-2 滑块 + 数值显示，默认 0.7
  - **Max Tokens**: 数字输入框，最大生成长度
  - **Top P**: 0-1 滑块 + 数值显示
  - **Top K**: 数字输入（仅部分模型支持，标注说明）
  - **Frequency Penalty**: -2 到 2 滑块 + 数值显示
  - **Presence Penalty**: -2 到 2 滑块 + 数值显示
  - **重置参数**: 一键恢复为默认值
  - **参数持久化**: 参数随对话保存，切换对话时自动加载对应参数

### 设置弹窗

- **页面目标**: 集中管理 API Key、服务商、数据导入导出等全局配置
- **功能点**:
  - **API Key 管理**: 各服务商独立的 Key 输入框，支持显示/隐藏切换（眼睛图标），输入即保存
  - **自定义服务商添加**: 填写服务商名称、Base URL、默认模型，添加后出现在服务商列表
  - **自定义服务商删除**: 自定义服务商可删除，内置服务商不可删除
  - **默认设置**: 设置默认服务商和默认模型，新建对话时自动应用
  - **导出所有数据**: 导出所有对话 + 设置为 JSON 文件
  - **导入数据**: 选择 JSON 文件导入，提示是否覆盖或合并
  - **清除所有数据**: 二次确认弹窗，确认后清空所有 localStorage 相关数据
  - **关于信息**: 版本号、项目简介

---

## 数据共享配置

| 存储键名 | 数据说明 | 使用区域 |
|---------|---------|---------|
| `__ai_chat_conversations` | 所有对话数据，类型 `IConversation[]` | 左侧边栏、主聊天区、参数面板 |
| `__ai_chat_current_conversation_id` | 当前激活对话 ID，类型 `string` | 左侧边栏、主聊天区、参数面板、顶栏 |
| `__ai_chat_api_keys` | 各服务商 API Key，类型 `Record<string, string>` | 设置弹窗、API 调用 |
| `__ai_chat_settings` | 全局设置，类型 `IAppSettings` | 顶栏、设置弹窗 |
| `__ai_chat_custom_providers` | 自定义服务商列表，类型 `ICustomProvider[]` | 顶栏服务商选择器、设置弹窗 |

```ts
interface IMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  duration?: number; // 毫秒
  error?: {
    code: string | number;
    message: string;
  };
}

interface IConversationParams {
  systemPrompt: string;
  temperature: number;
  maxTokens?: number;
  topP: number;
  topK?: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface IConversation {
  id: string;
  title: string;
  providerId: string;
  model: string;
  messages: IMessage[];
  params: IConversationParams;
  createdAt: number;
  updatedAt: number;
}

interface IAppSettings {
  theme: 'dark' | 'light';
  defaultProviderId: string;
  defaultModel: string;
  sidebarCollapsed: boolean;
  paramsPanelCollapsed: boolean;
}

interface ICustomProvider {
  id: string;
  name: string;
  baseUrl: string;
  models: string[];
  apiKey?: string;
}
```

---

## 技术实现要点

### API 适配层架构

- **统一抽象**: 定义 `IProviderAdapter` 接口，包含 `chat()` 方法，返回 `ReadableStream` 用于流式输出
- **OpenAI 兼容适配器**: OpenAI、DeepSeek、Moonshot、GLM、Doubao、Qwen、自定义服务商共用此适配器
- **Anthropic 适配器**: 专用格式，处理 `messages` + `system` 分离、SSE 响应解析
- **Google Gemini 适配器**: 专用 REST 格式，处理 `generateContent` 流式响应
- **SSE 解析**: 统一封装 `parseSSE(stream)` 工具函数，处理不同服务商的 SSE 数据格式差异

### 存储结构

```
localStorage:
  __ai_chat_conversations  → IConversation[]
  __ai_chat_current_id     → string
  __ai_chat_api_keys       → { [providerId]: string }
  __ai_chat_settings       → IAppSettings
  __ai_chat_custom_providers → ICustomProvider[]
```

### 第三方库选型

- **Markdown 渲染**: marked
- **代码高亮**: highlight.js
- **图标**: lucide-react
- **UI 基础**: shadcn/ui + Tailwind CSS
- **状态管理**: React Context + useReducer（单页应用，无需引入 Redux）

### 主题规范

- **主色调**: 蓝绿色系（teal/cyan），主色 `#0d9488`（teal-600）
- **背景色**: 深色模式 `#0f172a`（slate-900），浅色模式 `#f8fafc`（slate-50）
- **强调色**: 蓝绿色 `#14b8a6`（teal-500），用于按钮、链接、高亮
- **中性色**: slate 系列灰
- **禁用**: 紫色、靛蓝色系

### 响应式策略

- **桌面端（≥1024px）**: 三栏布局（对话列表 260px + 聊天区自适应 + 参数面板 280px）
- **平板（768-1023px）**: 对话列表可折叠为图标栏，聊天区 + 参数面板
- **移动端（<768px）**: 单栏布局，对话列表和参数面板均为抽屉式，从左右滑出

-------

<scene_type>prototype-app</scene_type>

# UI 设计指南

## 1. 设计推导依据

- **参考意图**: Mood Reference —— 参考 ChatGPT / Claude 界面的毛玻璃、圆角、柔和阴影气质，不照搬品牌色与具体布局
- **核心情绪 / 应用类型**: 开发者向 AI 多模型控制台，追求精准、克制、沉浸、低干扰的对话体验
- **独特记忆点**: 以深水青绿为主色的深色沉浸界面，消息气泡与代码块形成"对话即终端"的精密质感

## 2. Art Direction

- **方向名**: Deep Teal Console
- **Design Style**: Modern Dark + Glassmorphism 辅助 —— 深色基底降低长时间对话视觉疲劳，毛玻璃用于侧栏、设置弹层和顶部导航，营造层次与通透感
- **DNA 参数**: 圆角 `rounded-xl`（卡片/气泡）/ `rounded-2xl`（弹层/大容器）；阴影 subtle `shadow-sm` 深色下以边界 + 微光代替重阴影；间距 standard `gap-4 p-5`；字体方向 无衬线几何感 + 等宽代码；装饰手法 毛玻璃 backdrop-blur、微光边界、代码块暗色终端感
- **应用类型**: Tool —— 三栏式工具布局：左侧对话列表、中间聊天区、右侧参数面板（可折叠）

## 3. Color System

**色彩关系**: 深水青绿主色 + 深近黑灰背景 + 冷灰中性层 + 同色系浅青 accent 反馈底
**配色设计理由**: 深色为底降低长对话阅读负担；teal 主色承担发送按钮、激活态、链接等关键交互，冷静精密符合开发者工具语义；accent 用低饱和青灰承接 hover/selected，避免视觉噪音；代码块沿用终端深色调性
**主色推导**: 从"API 调用 / 开发者控制台 / 多模型调度"的精密、冷静语义出发，选 teal（青绿色）作为 primary，比纯蓝更独特、比纯绿更专业，避开紫色/靛蓝约束
**使用比例**: 65% 深中性 / 28% 冷灰辅助层 / 7% teal primary；primary 仅用于主按钮、当前对话激活、链接、关键状态指示，不用于 tab 背景、icon 常态色或边框

| 角色 | CSS 变量 | Tailwind Class | HSL 值 | 设计说明 |
|---|---|---|---|---|
| bg | `--background` | `bg-background` | hsl(210 12% 8%) | 页面最深背景，接近夜幕 |
| card | `--card` | `bg-card` | hsl(210 10% 12%) | 卡片、弹层、侧栏承载面，略亮于 bg |
| text | `--foreground` | `text-foreground` | hsl(200 10% 92%) | 主文本，高对比舒适 |
| textMuted | `--muted-foreground` | `text-muted-foreground` | hsl(200 5% 62%) | 辅助说明、元信息、时间戳 |
| primary | `--primary` | `bg-primary` / `text-primary` | hsl(178 70% 45%) | 深水青绿，主交互与品牌锚点 |
| primaryForeground | `--primary-foreground` | `text-primary-foreground` | hsl(180 20% 6%) | primary 上深文字，高对比 |
| accent | `--accent` | `bg-accent` | hsl(180 15% 18%) | hover/focus 浅底、选中态、菜单高亮 |
| accentForeground | `--accent-foreground` | `text-accent-foreground` | hsl(180 20% 88%) | accent 上文字与图标 |
| border | `--border` | `border-border` | hsl(210 8% 20%) | 输入框、卡片、菜单边界，低对比但可辨 |

**语义色提示**:
- 成功（流式输出完成 / 复制成功）：`hsl(150 55% 42%)`，三态 bg `hsl(150 30% 14%)` / border `hsl(150 35% 22%)` / text `hsl(150 60% 70%)`
- 警告（参数超限 / key 未填）：`hsl(38 80% 55%)`，三态 bg `hsl(38 30% 14%)` / border `hsl(38 35% 24%)` / text `hsl(38 75% 72%)`
- 错误（API 调用失败 / 网络错误）：`hsl(2 70% 58%)`，三态 bg `hsl(2 25% 14%)` / border `hsl(2 30% 24%)` / text `hsl(2 70% 75%)`
- 所有语义色饱和度控制在 55-80%，与 primary（70%）对齐，避免状态色突兀

## 4. 字体与节奏

- **font-display**: Inter + Noto Sans SC —— 清晰现代，标题与界面元素保持几何中性
- **font-body**: Inter + Noto Sans SC —— 长对话阅读舒适，中英文混排协调
- **代码 / token 数字**: IBM Plex Mono —— 代码块、token 统计、API 端点使用等宽字体，强化控制台感
- **字号**: H1 text-3xl（设置/空态大标题）；H2 text-lg ~ text-xl（区块标题）；body text-base（消息正文）；muted text-xs ~ text-sm（元信息、token 统计）
- **圆角**: 大圆角 —— 气泡与卡片 `rounded-xl`，弹层 `rounded-2xl`，按钮 `rounded-lg`，输入框 `rounded-lg`；符合 ChatGPT/Claude 式柔和感

## 5. 全局布局契约

- **Reference Layout Use**: 按需求结构推导，借鉴 ChatGPT/Claude 的三栏/双栏聊天布局节奏，视觉系统自定
- **Page / Section Order**: 单页应用 = 顶部导航栏 + 左侧对话列表侧栏 + 中部聊天主区 + 右侧参数面板（可折叠）+ 设置弹层
- **Standard Content Zone**: 聊天区 `max-w-3xl mx-auto`（确保阅读行长舒适）；侧栏固定宽度 280px；参数面板固定宽度 320px
- **Shell / Frame Alignment**: 同宽 —— 顶部导航横跨全屏，三栏主体在导航下方水平排列，内部内容区各自独立 padding
- **Padding & Rhythm**: 聊天区 `px-4 md:px-6 py-6`；侧栏 `p-3`；消息气泡之间 `gap-6`；保持 4/8px 倍数节奏
- **Full-bleed Zones**: 顶部导航栏、侧栏、输入栏全高/全宽贴边；消息流区居中受 max-w 约束
- **Local Narrowing**: 设置弹窗表单内容收窄至 `max-w-xl`，API Key 列表、导入导出操作集中在中部
- **Overflow Strategy**: 对话列表、参数面板、消息流各自独立滚动（`overflow-y-auto`）；长代码块横向滚动（`overflow-x-auto`）
- **Flexibility Boundary**: 移动端侧栏与参数面板改为抽屉式，聊天区撑满全屏；圆角、主色、阴影语言不随端变化

## 6. 视觉与动效

- **装饰**: 毛玻璃面板 + 微光边界 + 极细分割线
- **阴影/边界**: 轻 —— 深色下以 `border` +  subtle `shadow-sm` 塑造层次，弹层使用 `shadow-xl` 配合 backdrop-blur
- **动效**: 克制精致 —— hover 用背景色微变 + 轻微上移；消息流式输出用字符渐入；弹层用 opacity + translateY 入场（150ms ease-out）；按钮点击微缩放；避免花哨动效干扰对话

## 7. 组件原则

- 按钮、输入框、下拉选择、菜单项必须具备 Default / Hover / Active / Focus-visible / Disabled 五态
- 发送按钮为 primary 填充；停止按钮为危险色 outline 变体；次级操作用 ghost + accent hover
- 消息气泡：用户消息右对齐、使用 primary 淡色底 + 白字；AI 消息左对齐、使用 card 底色 + 前景文字，左侧带 2px primary 竖条强化角色
- 代码块：深终端色底（比 card 更深 5-8%）、等宽字体、顶部带语言标签 + 复制按钮、圆角 `rounded-lg`
- 输入框：`bg-card` 底 + `border` 边界，focus 时 border 变为 primary + 轻微发光
- 加载打字动画：三个跳动圆点，颜色用 textMuted，位于 AI 消息气泡内

## 8. Image Direction

- **Image Role**: 无
- **Image Art Direction**: 无强制图片需求；视觉记忆点来自排版、毛玻璃层次、teal 主色与代码块终端质感
- **Image Prompt Keywords**: 无
- **Image Avoidance**: 避免通用 AI 大脑插图、机器人头像、无意义科技渐变背景；空态与引导用图标 + 文字解决

## 9. Anti-patterns

- **Split personality**: 深浅主题切换时改变圆角、间距或主色色相；只切换背景/文字/边界明度，primary 色相保持一致
- **Phantom tokens**: 编造不存在的 CSS 变量；所有颜色来自 9 个基础 token + 语义色三态
- **Default SaaS drift**: 回到默认蓝色按钮、紫色渐变、卡片堆叠；用 teal 主色 + 毛玻璃 + 终端代码块塑造独特身份
- **Invisible interaction**: hover 做了但 focus-visible 缺失；所有可交互元素必须有清晰的键盘焦点环（primary 色 2px outline）
- **Mono-hue tyranny**: teal 同时用于按钮、tab、icon、边框、链接、图表；primary 只保留给 CTA 与激活态，其余用 accent 和中性色
- **Status color drift**: 错误/警告色饱和度过高刺眼；语义色饱和度与 primary 对齐 ±15%，且都用深色底三态呈现
- **Chat bubble overload**: 气泡加厚重阴影、强渐变、夸张圆角；气泡保持克制，区分度来自对齐方向、左侧竖线和轻微底色差