# MelodyBox 桌面外壳（Tauri 2 + SMTC）

这个目录不是 PakePlus 的替代品，而是**另一条构建路线**：外壳只做三件事——

1. 用 `tauri-plugin-media` 注册 Windows SMTC（系统媒体卡片 / 蓝牙耳机线控）
2. 用 `dialog` + `fs` 插件保住现有的「引用本地文件夹」功能
3. 加载你项目根目录下的网页（`../index.html`），网页本身一行不用改

网页端的桥接在 `js/native-media.js`，它检测不到插件时会自动退出，所以在 PakePlus / 浏览器里也完全无害。

---

## 一、本地构建（推荐先跑通这个）

### 1. 装工具链（只装一次）

| 组件 | 说明 |
|---|---|
| Rust | ≥ 1.90（`tauri-plugin-fs` 的硬要求）。<https://rustup.rs> 默认即可 |
| MSVC 生成工具 | 装 Rust 时选 `x86_64-pc-windows-msvc`；要装 **Visual Studio Build Tools** 的「使用 C++ 的桌面开发」 |
| Tauri CLI | `cargo install tauri-cli --version "^2" --locked` |
| WebView2 | Win10/11 自带，一般不用管 |

### 2. 同步网页到外壳

**双击 `desktop\sync-web.cmd` 即可**（它会用 `-ExecutionPolicy Bypass` 调起 PowerShell，绕开系统的脚本执行策略——本机默认策略会直接拦掉 .ps1）。

命令行等价写法：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\desktop\sync-web.ps1
```

它会把根目录的 `index.html`、`style.css`、`*.min.js`、`js\` 复制到 `desktop\web\`。
**每次改完网页都要重跑一次**，否则打包的是旧页面。

### 3. 构建

```powershell
cd desktop
cargo tauri build --no-bundle
```

产物：`desktop\target\release\melodybox.exe`，双击即可（便携版）。

想要安装包就把 `tauri.conf.json` 里的 `bundle.active` 改成 `true`，再用 `cargo tauri build`（首次会联网下 NSIS）。

### 4. 开发调试

```powershell
cd desktop
cargo tauri dev
```

改了 `js/` 里的文件后，`cargo tauri dev` 的热重载不会自动同步，重跑 `sync-web.ps1` 再刷新窗口即可。

---

## 二、云构建（本机不想装 Rust 时）

如果你把项目推到 GitHub，`.github/workflows/build-desktop.yml` 会在 `windows-latest` 上自动编译，产物在 Actions 页面的 Artifacts 里（`MelodyBox.exe`）。

流程：`git push` → 打开仓库的 **Actions** → 等 `Build MelodyBox desktop` 跑完（约 6–10 分钟）→ 下载 `melodybox-windows` 压缩包 → 解压运行。

---

## 三、怎么验证 SMTC 真的通了

1. 播一首歌；
2. `Win + A` 打开快捷设置，顶部应该出现带封面、歌名、进度条的卡片；
3. 按蓝牙耳机 / 键盘的 ⏯ ⏭ ⏮，应该能控制播放、切歌；
4. 锁屏界面也应该显示当前曲目。

如果卡片出现了但按键没反应，看 `js/native-media.js` 里 `media-control-event` 那段的控制台输出。

---

## 四、第一次构建大概率要改的地方（重要）

这套 Rust 配置我是**照源码 API 写的，但没在这台机器上编译过**（本机没有 Rust 工具链）。第一次跑 `cargo tauri build` 如果报错，按下面这张表处理，然后把报错发我：

| 报错关键词 | 原因 | 改法 |
|---|---|---|
| `permission 'media:default' not found` | 插件没定义 default 权限集 | 把 `capabilities/default.json` 里的 `"media:default"` 换成逐个命令：`"media:allow-initialize-session"`, `"media:allow-set-metadata"`, `"media:allow-set-playback-info"`, `"media:allow-set-playback-status"`, `"media:allow-set-position"`, `"media:allow-clear-metadata"`, `"media:allow-is-enabled"` |
| `unknown permission 'fs:scope'` | 内联 scope 写法不被接受 | 删掉 `{ "identifier": "fs:scope", ... }` 整行，改用 `"fs:scope-home-recursive"` 等预置权限 |
| `forbidden path` / `not allowed to read` | fs scope 没覆盖到你的音乐目录 | 确认内联 scope 的 `"path": "**"` 存在；或把你的盘符加进去，如 `{ "path": "D:/**" }` |
| `error: linker 'link.exe' not found` | 没装 MSVC 生成工具 | 装 VS Build Tools 的「使用 C++ 的桌面开发」 |
| `failed to run custom build command for tauri-build` | 缺图标 / 缺 `web` 目录 | 先跑 `sync-web.ps1`；确认 `src-tauri/icons/` 里 5 个文件都在 |

---

## 五、和 PakePlus 的关系

两条线互不影响：

- 继续用 PakePlus 出的包 → 没有 SMTC 卡片，但其他一切照旧（网页里会走 `navigator.mediaSession`，浏览器会显示卡片，WebView2 不确定）；
- 用这个外壳出的包 → 有 SMTC 卡片 + 耳机线控，功能与 PakePlus 版对齐（文件夹引用、通知、标题栏都在）。

**验证通过后建议只用这个外壳**，省得两份配置漂移。

---

## 六、目录结构

```
desktop/
├── sync-web.ps1              # 把根目录网页同步进 desktop/web
├── src-tauri/
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json       # 窗口、assetProtocol、bundle 配置
│   ├── capabilities/
│   │   └── default.json      # 权限：core / dialog / fs / media
│   ├── icons/                # 5 个图标（自动生成）
│   └── src/
│       └── main.rs           # 注册 4 个插件，仅此而已
└── web/                      # 构建时生成的网页副本（不要手改）
```

## 七、安全说明

`tauri.conf.json` 里 assetProtocol 的 scope 和 fs 的 scope 都开到了 `**`（允许读整机路径），因为你的「引用本地文件夹」是让用户任意选目录。这是本地播放器的常规做法，但如果以后要分发给别人，建议收窄到 `$HOME/**` + 用户实测的盘符。
