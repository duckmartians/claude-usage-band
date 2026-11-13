# usage-band

A Claude Code mod that keeps your Claude plan usage limits on screen, right above the prompt box. No more opening the usage popup to check how much is left.

![usage-band above the prompt box](assets/band.png)

## What it shows

- One bar per limit window: the weekly limit for all models, plus each per-model weekly limit your plan has (for example Fable), and the 5-hour session limit when your plan has one.
- The percentage used. Bars turn red at 90%.
- A countdown to the nearest reset.

<img width="744" height="138" alt="image" src="https://github.com/user-attachments/assets/4c3e83b5-e896-49eb-a632-f4185c517f83" />

The bars stretch with the window width. When the window gets narrow, the decorations hide first, then the reset countdown, so the bars stay readable.

In the Claude desktop app (Code tab) the band is drawn as a single glowing card. In a terminal session it falls back to a plain text grid.

## How it works

- The numbers come from the same usage endpoint the Claude app uses for its own usage popup, fetched through the session's own sign-in. The mod never sees your token: Claude Code attaches the credential itself.
- It refreshes when a session starts, every 5 minutes, and whenever a limit moves.
- It only works with a Claude subscription (Pro, Max, Team, and so on). With an API key there are no plan limits to show, so the band stays hidden.
- If a fetch fails, the reason is written to `last-error.txt` in the plugin folder.

Note: the usage endpoint is not a documented public API, so a future change on Anthropic's side may break the mod until it is updated.

## Install

At the prompt of a terminal session:

```
/plugin install usage-band --marketplace duckmartians/claude-usage-band
```

From a shell:

```
claude plugin install usage-band --marketplace duckmartians/claude-usage-band
```

In the Claude desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `duckmartians/claude-usage-band`, then **Add plugin**.

The band appears in every new session.

## Tiếng Việt

Mod cho Claude Code: luôn hiện giới hạn gói Claude ngay trên ô nhập (mức tuần cho tất cả model, mức tuần theo từng model như Fable, đồng hồ đếm ngược tới lần reset). Số liệu lấy qua đăng nhập của phiên, mod không đọc token. Cài bằng lệnh ở mục **Install** phía trên.

## Contact

- Website: [duckspace.net](https://duckspace.net)
- Email: [support@duckspace.net](mailto:support@duckspace.net)
- Telegram: [@duckmartians](https://t.me/duckmartians)
- Profile: [duckmartians.info](https://duckmartians.info)
- Source and releases: [github.com/duckmartians](https://github.com/duckmartians)

## License

MIT
