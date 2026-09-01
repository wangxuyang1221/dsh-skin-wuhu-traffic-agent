# 芜湖交管警用智能体皮肤原型

这是一个可加载到 DSH Desktop 的真实客户端皮肤，不是静态网页稿。

它回答一个具体问题：公安深蓝品牌视觉放进真实 DSH Desktop 后，是否清晰、稳重、可读，同时不干扰官方组件和其他插件？

## 落点

- 目标目录：`wuhu-traffic-agent/`
- 目标应用：DSH Desktop 2.0.4
- 插件形态：普通 DSH Web Client 皮肤
- 身份：`@wuhu-traffic/dsh-client-ui-skin`
- Loader 行：`ui-skin-wuhu-traffic-agent`
- Body 作用域：`data-dsh-wuhu-traffic-agent`

## 皮肤负责什么

皮肤只负责以下内容：

- 芜湖市公安交管品牌舞台和徽标占位素材
- 深蓝配色、直线边框、排版和装饰刻度
- 空态欢迎语
- 根据当前 DSH 会话状态显示“系统待命”“任务执行”等状态
- 卸载时完整撤销 DOM、属性、标题、favicon、观察器和样式变量

## 皮肤不负责什么

任务看板、SSH、技能中心、插件市场、工作区树、会话列表、模型选择器和消息发送都由 DSH 或其他插件实现。本皮肤只给这些现有组件换外观，不创建替代功能，也不绑定它们的业务逻辑。

## 本地验证

```sh
cd /absolute/path/to/wuhu-traffic-agent
pnpm install
pnpm check

dsh plugin --profile desktop add /absolute/path/to/wuhu-traffic-agent
```

安装后需要在 profile 和 DSH home 的补丁层中启用 `ui-skin-wuhu-traffic-agent`，并禁用其他皮肤。皮肤管理器也可以完成这一步。

`skin.json` 暂时沿用 ORCA LINK 构建链要求的 `0.1.1rc2` 兼容字段。2026-09-01 已在 DSH Desktop 2.0.4 所带的 `0.1.2-alpha.1` 运行时完成真实启动检查。Profile 组合结果为 ORCA LINK 禁用、本皮肤启用，Electron Renderer 正常显示后已关闭。验收截图见 `preview/dark.png`。

本地门禁结果：TypeScript 检查通过，4 个 Vitest 生命周期测试通过，`lib/index.js` 与 `lib/client.js` 构建成功。

## 素材和许可

整体沿用 ORCA LINK 的 CC BY-NC-SA 4.0 许可，仅限非商业使用。完整来源说明见 `NOTICE`。

`assets/police-emblem-hd.png` 是用户提供的 `1254 × 1254` 原图。运行时使用由它生成的 `512 × 512` 标准化版本，主体约占画布 90%，可避免替换后视觉尺寸突增。正式分发前仍需确认该徽标素材的使用授权。
