import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Ctx, Limit } from '../types'
import { bandSvg } from './bandSvg'
import type { BandIcon } from './bandSvg'

const limits = atom({ plugin: 'usage-band', key: 'limits' } as const, [] as Limit[])
const ctx = atom({ plugin: 'usage-band', key: 'ctx' } as const, null as Ctx | null)
const startedAt = atom({ plugin: 'usage-band', key: 'startedAt' } as const, 0)

function countdown(ms: number): string {
  const m = Math.floor(ms / 60000)
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60)
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m % 60}m` : `${m}m`
}

function hm(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60000))
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`
}

const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage'
const POLL_MS = 5 * 60 * 1000

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Nhãn tiếng Anh giống ô "Plan usage limits" của app.
function label(kind: string): string {
  if (kind === 'five_hour') return 'Current session'
  if (kind === 'seven_day') return 'Weekly · all models'
  if (kind === 'spend_limit') return 'Spend limit'
  const m = /^seven_day_(.+)$/.exec(kind)
  if (m) return 'Weekly · ' + (m[1] ?? '').split('_').map(cap).join(' ')
  return kind
}

function order(kind: string): number {
  return kind === 'five_hour' ? 0 : kind === 'seven_day' ? 1 : 2
}

// "Resets 21:00 17/11": giờ 24h + ngày/tháng theo giờ máy.
function resets(resetsAt: string | undefined, _now: number): string {
  if (!resetsAt) return ''
  const t = Math.round(Date.parse(resetsAt) / 60000) * 60000
  if (!(t > 0)) return ''
  const d = new Date(t)
  const p2 = (n: number) => String(n).padStart(2, '0')
  return `Resets ${p2(d.getHours())}:${p2(d.getMinutes())} ${p2(d.getDate())}/${p2(d.getMonth() + 1)}`
}

const CELLS = 10

function filled(p: number): number {
  return Math.max(0, Math.min(CELLS, Math.round((p / 100) * CELLS)))
}

// Màu có alpha 50% để cả dải mờ, không lấn át ô nhập.
function color(p: number): string {
  return p >= 90 ? '#ef444480' : p >= 70 ? '#eab30880' : '#3b82f680'
}

const TRACK = '#80808030'

// Lấy mọi cửa sổ { utilization, resets_at } trong phản hồi, kể cả theo từng model.
function parse(body: unknown): Limit[] {
  const out: Limit[] = []
  if (!body || typeof body !== 'object') return out
  const rec = body as Record<string, unknown>
  // Danh sách `limits` là thứ ô "Plan usage limits" của app vẽ, có cả mức theo model.
  if (Array.isArray(rec.limits)) {
    for (const it of rec.limits as Record<string, unknown>[]) {
      if (!it || typeof it.percent !== 'number') continue
      const scope = it.scope as { model?: { display_name?: string } | null; surface?: unknown } | null
      const model = scope?.model?.display_name
      const group = typeof it.group === 'string' ? it.group : ''
      let name = String(it.kind)
      if (model) name = `${cap(group || 'weekly')} · ${model}`
      else if (it.kind === 'weekly_all') name = 'Weekly · all models'
      else if (group === 'session' || it.kind === 'session') name = 'Current session'
      out.push({
        kind: name,
        percentUsed: it.percent,
        resetsAt: typeof it.resets_at === 'string' ? it.resets_at : undefined,
      })
    }
    if (out.length) return out
  }
  for (const [kind, v] of Object.entries(rec)) {
    if (kind === 'extra_usage' || !v || typeof v !== 'object') continue
    const w = v as Record<string, unknown>
    if (typeof w.utilization !== 'number') continue
    out.push({
      kind,
      percentUsed: Math.round(w.utilization * 10) / 10,
      resetsAt: typeof w.resets_at === 'string' ? w.resets_at : undefined,
    })
  }
  return out.sort((a, b) => order(a.kind) - order(b.kind) || a.kind.localeCompare(b.kind))
}

let lastFetch = 0
const PX_PER_COL = 7.57 // đo 13/11: 99 cột = 750px bên trong khung

async function refresh($: EngineInterface, force = false) {
  const now = await $.clock.now()
  if (!force && now - lastFetch < 60_000) return
  lastFetch = now
  try {
    const auth = await $.session.authorize()
    if (!auth) return
    const r = await $.http.fetch(USAGE_URL, {
      auth: auth.handle,
      headers: { 'anthropic-beta': 'oauth-2025-04-20' },
    })
    if (!r.ok) {
      await $.fs.write(`${$.plugin.root}/last-error.txt`, `${r.status}\n${r.text.slice(0, 2000)}`)
      return
    }
    const list = parse(JSON.parse(r.text))
    if (list.length) await update($, limits, () => list)
  } catch (err) {
    await $.fs.write(`${$.plugin.root}/last-error.txt`, String(err)).catch(() => {})
  }
}

export const register: Register = on => {
  let tick: { cancel: () => void } | undefined

  on('session.start', async ($, e, next) => {
    const r = await next(e)
    tick?.cancel()
    const u = await $.session.usage()
    await update($, startedAt, () => u.startedAt)
    await update($, ctx, () => ({ tokens: u.context.tokens, window: u.context.window, percent: u.context.percent }))
    await refresh($, true)
    tick = $.clock.every(POLL_MS, () => refresh($, true))
    return r
  })

  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context')) {
      await update($, ctx, () => ({ tokens: e.context.tokens, window: e.context.window, percent: e.context.percent }))
    }
    if (e.changed.includes('rateLimits')) await refresh($)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const list = await read($, limits)
    if (e.props.hasSurvey || list.length === 0) return next(e)
    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)
    // Terminal (không vẽ SVG): lưới chữ tên | thanh | % | giờ reset ... context + thời lượng phiên.
    const c = await read($, ctx)
    const since = await read($, startedAt)
    const full_ = list.map(l => (l.kind.includes(' ') ? l.kind : label(l.kind)))
    const short = full_.map(n => (n.includes(' · ') ? n.split(' · ')[1] ?? n : n))
    const nameOf = (i: number) => {
      const n = short[i] ?? ''
      return n === 'all models' ? 'All models' : n
    }
    // Desktop: vẽ cả dải thành một SVG (thanh mảnh giãn hết bề ngang, cột thẳng).
    const table = $.ui.resolve(e)
    if ('Svg' in table) {
      const Svg = table.Svg
      const rows = list.map((l, i) => {
        const full = full_[i] ?? ''
        const [g, nm] = full.includes(' · ') ? (full.split(' · ') as [string, string]) : ['Session', '5 hours']
        const icon: BandIcon = full.includes(' · ') ? (nm === 'all models' ? 'rocket' : 'crown') : 'clock'
        return { group: g, name: nm === 'all models' ? 'All models' : nm, p: l.percentUsed, note: resets(l.resetsAt, now), icon }
      })
      // Ô "Resets in": mốc reset gần nhất.
      const soonest = Math.min(...list.map(l => (l.resetsAt ? Date.parse(l.resetsAt) : Infinity)))
      const pill = Number.isFinite(soonest) && soonest > now ? { label: "Resets in", value: countdown(soonest - now) } : null
      // Bề ngang band tính bằng ô ký tự -> px (ước lượng, tinh chỉnh bằng PX_PER_COL).
      const cols = e.props.bodyColumns
      const W = Math.round(Math.max(380, Math.min(1600, cols * PX_PER_COL)))
      const source = bandSvg({ rows, pill, W })
      const alt = rows.map(r => `${r.group} ${r.name} ${Math.round(r.p)}% ${r.note}`).join('; ')
      return <Svg source={source} alt={alt} />
    }

    const T = { wrap: 'truncate-end' } as const
    return (
      <Box flexDirection="row" gap={2}>
        <Box flexDirection="column" flexShrink={0}>
          {list.map((l, i) => (
            <Text key={l.kind} dimColor {...T}>{nameOf(i)}</Text>
          ))}
        </Box>
        <Box flexDirection="column" flexShrink={0}>
          {list.map(l => {
            const n = filled(l.percentUsed)
            return (
              <Text key={l.kind} {...T}>
                <Text color={color(l.percentUsed)}>{'▄'.repeat(n)}</Text>
                <Text color={TRACK}>{'▄'.repeat(CELLS - n)}</Text>
              </Text>
            )
          })}
        </Box>
        <Box flexDirection="column" alignItems="flex-end" flexShrink={0}>
          {list.map(l => (
            <Text key={l.kind} dimColor bold {...T}>{Math.round(l.percentUsed)}%</Text>
          ))}
        </Box>
        <Box flexDirection="column" flexShrink={1}>
          {list.map(l => {
            return <Text key={l.kind} dimColor {...T}>{resets(l.resetsAt, now)}</Text>
          })}
        </Box>
        <Box flexGrow={1} />
        <Box flexDirection="column" alignItems="flex-end" flexShrink={0}>
          <Text dimColor {...T}>{c && c.percent !== undefined ? `Context ${c.percent}%` : 'Context –'}</Text>
          <Text dimColor {...T}>{since > 0 ? `Session ${hm(now - since)}` : ' '}</Text>
        </Box>
      </Box>
    )
  })
}
