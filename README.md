# QAU Schedule App (青岛农业大学课表)

**Stable Version: v0.1.0**
*说明：这是第一个已经验证“在线导入 + 本地保存 + PWA 离线使用”完整可用的版本。*

一个专注于解析青岛农业大学教务系统“学期理论课表”的离线前端应用。

## 项目用途

帮助青岛农业大学的学生将教务系统导出的课表网页（HTML）直接解析并本地保存。
- **纯前端解析**：所有解析工作在浏览器本地使用 `DOMParser` 完成，无需经过任何第三方服务器。
- **本地存储**：基于 IndexedDB 本地保存所有的课程信息（无需账号密码，完全离线运行）。
- **极简风格**：适配移动端及高密度显示，呈现清晰直观的周课表视图。

## HTML 导入方法

1. 登录青岛农业大学教务系统。
2. 导航至“学期理论课表”页面。
3. 在页面空白处点击右键，选择“网页另存为...” (Save as...)，保存格式选择 `HTML` 或 `网页，仅 HTML`。
4. 在此应用中，点击“导入课表”，选择刚刚保存的 `.html` 文件即可。

## QAU HTML Parser 原理

`src/parser/qau/index.ts` 实现了非侵入式的精准解析：
1. **DOM 隔离提取**：只从 `#kbtable` 提取 DOM 信息，屏蔽页面导航与其他元素的干扰。
2. **多模态清洗**：兼容不同的 `<font>` 标签、空白符（`&nbsp;`）以及内联分隔符，并精准提取 `(必修)` 和周次信息。
3. **坐标映射表**：忽略表格合并差异，严格依据 `tr` 行号（节次）和 `td` 列号（星期）建立课程与时间轴的映射。

## 开发与部署

本应用使用 Vite + React + TypeScript 搭建。

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建打包

```bash
# 构建静态产物，生成在 dist/ 目录下
npm run build
```

### GitHub Pages 自动化部署

本项目已经配置了完整的 GitHub Actions 工作流，支持零配置一键部署到 GitHub Pages。

1. **创建 GitHub 仓库**：在 GitHub 上创建一个新的仓库（例如 `qau-timetable`）。
2. **推送代码**：将本项目的代码推送至该 `main` 分支。
3. **开启 GitHub Pages**：
   - 进入仓库的 **Settings** -> **Pages** 选项卡。
   - 在 **Build and deployment** (Source) 下，将来源修改为 **GitHub Actions**。
4. **自动部署**：
   - 提交代码后，`.github/workflows/deploy.yml` 会自动触发，执行静态打包与部署。
   - 等待 Workflow 运行完成，你将在页面上看到生成的 Pages URL。
   - 最终访问地址类似于：`https://USERNAME.github.io/REPOSITORY/`。

**提示：**
- 部署脚本中会自动提取当前的仓库名称并注入到 Vite 的 `base` 路径配置中，你**不需要**在源码中硬编码 `qau-timetable` 等仓库名称。
- 编译期间会自动将 `index.html` 复制为 `404.html`，完美解决了 GitHub Pages 在刷新 SPA 子路由时发生 404 错误的问题。
- 自动生成的 `manifest` 和 `service worker` 的 `start_url`、`scope` 均自动动态支持了仓库子路径，保证了 PWA 能够正确安装和离线启动。
