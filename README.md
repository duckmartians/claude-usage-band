# usage-band

A Claude Code mod that keeps your Claude plan usage limits on screen, right above the prompt box. No more opening the usage popup to check how much is left.

![usage-band above the prompt box](assets/normal.png)

## What it shows

- One bar per limit window: the weekly limit for all models, plus each per-model weekly limit your plan has (for example Fable), and the 5-hour session limit when your plan has one.
- The percentage used. Bars turn red at 90%.
- A countdown to the nearest reset.

The bars stretch with the window width. When the window gets narrow, the decorations hide first, then the reset countdown, so the bars stay readable.

In the Claude desktop app (Code tab) the band is drawn as a single glowing card. In a terminal session it falls back to a plain text grid.

## Screenshots

These are rendered from the mod's own drawing code with sample numbers, shown above the prompt box the way the app places the band.

**Near the limit.** A bar turns red at 90%.

![A limit at 94% shows a red bar](assets/high.png)

**Plan with a 5-hour session limit.** Each limit gets its own bar, and the countdown keeps only the time.

![Three limits: 5 hours, All models and Fable](assets/session.png)

**Narrow window.** The decorations hide first, then the reset countdown, so the bars stay readable.

![The band in a narrow window, without decorations or countdown](assets/narrow.png)

**Terminal session.** A plain text grid with the reset time of each limit, plus the context used and the session length.

![The text version in a terminal](assets/terminal.png)

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
