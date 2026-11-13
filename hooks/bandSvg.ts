// Dải giới hạn kiểu "card phát sáng". Dùng chung cho bản mô phỏng và mod.
// rows: [{ group, name, p, note, icon }], pill: { label, value }, W: chiều rộng px
export type BandIcon = 'rocket' | 'crown' | 'clock'
export type BandRow = { group: string; name: string; p: number; note: string; icon: BandIcon }
export type BandData = { rows: BandRow[]; pill: { label: string; value: string } | null; W: number }

export function bandSvg({ rows, pill, W }: BandData): string {
  const F = "Segoe UI, system-ui, sans-serif"
  // Một hàng: [sao] | [icon tên ▬▬▬ 55%] [icon tên ▬▬▬ 81%] ... [⏰ Resets in 4d 10h] [sao]
  const H = 40
  const M = 4                                // chừa 4px để quầng sáng viền không bị cắt thẳng ở mép hình
  const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
  const mid = H / 2
  // Bớt dần khi hẹp: thanh mỗi cụm phải còn >= 50px, không thì bỏ sao phải, rồi bỏ ô reset.
  const compact = rows.length >= 3
  const SEG_GAP = compact ? 16 : 22
  const nameW = Math.ceil(Math.max(...rows.map(r => String(r.name).length)) * 6.9)
  const X = { spark: 24, div1: 44 }
  const segL = 58
  const PILL = { w: compact ? 82 : 150, h: 26, x: 0 }
  const layout = (deco: boolean, withPill: boolean) => {
    const edge = W - (deco ? 54 : 14)
    const segR = (withPill ? edge - PILL.w : edge) - 14
    const segW = (segR - segL - SEG_GAP * (rows.length - 1)) / rows.length
    return { deco, withPill, edge, segW, bar: segW - 40 - 21 - nameW - 10 }
  }
  let L = layout(W >= 640, !!pill)
  if (L.bar < 50 && L.deco) L = layout(false, L.withPill)
  if (L.bar < 50 && L.withPill) L = layout(false, false)
  const showDeco = L.deco, showPill = L.withPill, segW = L.segW
  PILL.x = L.edge - PILL.w
  const defs = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#1c2347"/><stop offset="0.55" stop-color="#1a1d3a"/><stop offset="1" stop-color="#2b1f5e"/>
    </linearGradient>
    <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#60a5fa"/><stop offset="0.5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#22d3ee"/>
    </linearGradient>
    <linearGradient id="star" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#67e8f9"/><stop offset="0.5" stop-color="#818cf8"/><stop offset="1" stop-color="#e879f9"/>
    </linearGradient>
    <linearGradient id="gBlue" x1="0" x2="1"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#38bdf8"/></linearGradient>
    <linearGradient id="gGold" x1="0" x2="1"><stop offset="0" stop-color="#f59e0b"/><stop offset="1" stop-color="#fde047"/></linearGradient>
    <linearGradient id="gRed" x1="0" x2="1"><stop offset="0" stop-color="#dc2626"/><stop offset="1" stop-color="#fb7185"/></linearGradient>
    <linearGradient id="gCyan" x1="0" x2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#67e8f9"/></linearGradient>
    <linearGradient id="wave" x1="0" x2="1"><stop offset="0" stop-color="#6366f1" stop-opacity="0"/><stop offset="1" stop-color="#8b5cf6" stop-opacity="0.55"/></linearGradient>
    <filter id="glow" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2"/></filter>
    <clipPath id="card"><rect x="${M}" y="${M}" width="${W - 2 * M}" height="${H - 2 * M}" rx="10"/></clipPath>
  </defs>`

  const star4 = (cx: number, cy: number, r: number, fill: string) =>
    `<path d="M${cx} ${cy - r} C${cx + r * 0.18} ${cy - r * 0.18} ${cx + r * 0.18} ${cy - r * 0.18} ${cx + r} ${cy} C${cx + r * 0.18} ${cy + r * 0.18} ${cx + r * 0.18} ${cy + r * 0.18} ${cx} ${cy + r} C${cx - r * 0.18} ${cy + r * 0.18} ${cx - r * 0.18} ${cy + r * 0.18} ${cx - r} ${cy} C${cx - r * 0.18} ${cy - r * 0.18} ${cx - r * 0.18} ${cy - r * 0.18} ${cx} ${cy - r}Z" fill="${fill}"/>`

  const icons: Record<BandIcon, (x: number, y: number) => string> = {
    rocket: (x: number, y: number) => `<g transform="translate(${x} ${y - 8})" fill="#60a5fa">
      <path d="M13.5 1.5c-3.2.3-6 2.4-7.6 5.5L4 8.3l3.7 3.7 1.3-1.9c3.1-1.6 5.2-4.4 5.5-7.6z"/>
      <circle cx="10.4" cy="5.6" r="1.3" fill="#1a1d3a"/>
      <path d="M4.6 6.2 1.5 7l2 2zM9.8 11.4 9 14.5l-2-2z" fill="#93c5fd"/>
      <path d="M3.3 11.2c-1 .4-1.6 1.8-1.8 3.3 1.5-.2 2.9-.8 3.3-1.8z" fill="#fbbf24"/></g>`,
    crown: (x: number, y: number) => `<g transform="translate(${x} ${y - 7})" fill="#fbbf24">
      <path d="M1 3.5 4.5 7 8 1.5 11.5 7 15 3.5 13.6 12H2.4z"/><rect x="2.4" y="12.6" width="11.2" height="1.8" rx=".9"/></g>`,
    clock: (x: number, y: number) => `<g transform="translate(${x} ${y - 7})" fill="none" stroke="#a5b4fc" stroke-width="1.6" stroke-linecap="round">
      <circle cx="7" cy="7.5" r="5.6"/><path d="M7 4.6v3l2 1.4"/></g>`,
  }

  let body = ''
  // Nền card + quầng sáng viền
  // Không vẽ nền riêng: card dùng nền của khung app, chỉ giữ viền bo tròn.
  body += `<g clip-path="url(#card)">
    <path d="M${W - 330} ${H} C${W - 250} ${H - 14} ${W - 170} ${H - 4} ${W - 90} ${H - 16} S${W} ${H - 26} ${W} ${H - 26} V${H}Z" fill="url(#wave)"/>
    <path d="M${W - 260} ${H} C${W - 190} ${H - 12} ${W - 120} ${H} ${W - 40} ${H - 18} S${W} ${H - 24} ${W} ${H - 24} V${H}Z" fill="#a78bfa" opacity="0.18"/>
  </g>`
  body += `<rect x="${M}" y="${M}" width="${W - 2 * M}" height="${H - 2 * M}" rx="10" fill="none" stroke="url(#edge)" stroke-width="3" filter="url(#glow)" opacity="0.6"/>`
  body += `<rect x="${M}" y="${M}" width="${W - 2 * M}" height="${H - 2 * M}" rx="10" fill="none" stroke="url(#edge)" stroke-width="1" opacity="0.85"/>`

  // Sao trái
  body += `<g filter="url(#soft)" opacity="0.7">${star4(X.spark, mid, 10, 'url(#star)')}</g>${star4(X.spark, mid, 8.5, 'url(#star)')}`
  body += star4(X.spark - 12, mid - 8, 2, '#93c5fd') + star4(X.spark + 11, mid + 8, 1.8, '#c4b5fd')
  body += `<line x1="${X.div1}" y1="10" x2="${X.div1}" y2="${H - 10}" stroke="#ffffff22"/>`

  // Các cụm nằm ngang, chia đều bề rộng; thanh trong mỗi cụm co giãn.
  rows.forEach((r, i) => {
    const x0 = segL + i * (segW + SEG_GAP)
    const cy = mid
    const f = Math.max(0, Math.min(1, r.p / 100))
    const grad = r.p >= 90 ? 'gRed' : r.icon === 'crown' ? 'gGold' : 'gBlue'
    if (i > 0) body += `<line x1="${x0 - SEG_GAP / 2}" y1="13" x2="${x0 - SEG_GAP / 2}" y2="${H - 13}" stroke="#ffffff1c"/>`
    const ownW = Math.ceil(String(r.name).length * 6.9)
    const nameEnd = x0 + 21 + nameW
    body += icons[r.icon](nameEnd - ownW - 21, cy)
    body += `<text x="${nameEnd}" y="${cy}" dominant-baseline="central" text-anchor="end" font-size="13" fill="#e2e8f0">${esc(r.name)}</text>`
    const barX = x0 + 21 + nameW + 10
    const pctX = x0 + segW
    const barW = Math.max(30, pctX - 40 - barX)
    body += `<rect x="${barX}" y="${cy - 4}" width="${barW}" height="8" rx="4" fill="#ffffff12" stroke="#ffffff10"/>`
    if (f > 0) {
      const w = Math.max(8, barW * f)
      body += `<rect x="${barX}" y="${cy - 4}" width="${w}" height="8" rx="4" fill="url(#${grad})" filter="url(#soft)" opacity="0.6"/>`
      body += `<rect x="${barX}" y="${cy - 4}" width="${w}" height="8" rx="4" fill="url(#${grad})"/>`
    }
    body += `<text x="${pctX}" y="${cy}" dominant-baseline="central" text-anchor="end" fill="#ffffff" font-size="14" font-weight="700">${Math.round(r.p)}%</text>`
  })

  // Ô "Resets in"
  if (showPill && pill) {
    const px = PILL.x, py = mid - PILL.h / 2
    body += `<rect x="${px}" y="${py}" width="${PILL.w}" height="${PILL.h}" rx="${PILL.h / 2}" fill="#141833" fill-opacity="0.75" stroke="url(#edge)" stroke-opacity="0.7"/>`
    body += `<g transform="translate(${px + 8} ${mid - 9}) scale(0.72)" fill="none" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round">
      <circle cx="11" cy="12.5" r="8.5" fill="#1e3a8a" fill-opacity="0.5"/><path d="M11 8V12.5h3.5"/><path d="M3.5 4.5 6 2.5M18.5 4.5 16 2.5"/></g>`
    body += `<text x="${px + 28}" y="${mid}" dominant-baseline="central" font-size="12">${compact ? '' : `<tspan fill="#cbd5e1">${esc(pill.label)} </tspan>`}<tspan fill="url(#gCyan)" font-weight="700" font-size="13.5">${esc(pill.value)}</tspan></text>`
  }

  if (showDeco) {
    // Sao trang trí phải
    const sx = W - 26, sy = mid - 2
    body += `<ellipse cx="${sx}" cy="${sy + 6}" rx="17" ry="5.5" fill="none" stroke="#a78bfa" stroke-opacity="0.55" stroke-width="1.4" transform="rotate(-18 ${sx} ${sy + 6})"/>`
    body += `<g filter="url(#soft)" opacity="0.8">${star4(sx, sy, 9, 'url(#star)')}</g>${star4(sx, sy, 8, 'url(#star)')}`
    body += star4(sx - 21, sy - 9, 2, '#93c5fd') + star4(sx + 15, sy + 10, 1.6, '#c4b5fd')
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${F}">${defs}${body}</svg>`
}
