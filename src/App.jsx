import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Responsive hook ─────────────────────────────────────────────────────────
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const fn = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return isDesktop
}

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#0D0F14',
  surface: '#141922',
  surface2: '#1A2130',
  border: '#1E2535',
  border2: '#252D3D',
  lime: '#00E5B4',
  textPrimary: '#FFFFFF',
  textMuted: '#8899AA',
  textFaint: '#3D4A5C',
  green: '#00E5B4',
  red: '#FF4466',
}

const CATEGORY_COLORS = {
  DeFi: '#00E5B4',
  Trading: '#00E5B4',
  Content: '#00E5B4',
  Social: '#00E5B4',
  Analytics: '#00E5B4',
  Utility: '#00E5B4',
}

function catColor(cat) {
  return C.lime
}

// ─── Formatters ──────────────────────────────────────────────────────────────
function fmtMoney(n) {
  if (n == null) return '$—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

function fmtCount(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return `${n}`
}

function agentUrl(agent) {
  return `https://app.virtuals.io/acp/agent/${agent.id}`
}

function virtualUrl(agent) {
  return agent.virtualAgentId ? `https://app.virtuals.io/virtuals/${agent.virtualAgentId}` : null
}

// variant='block'  — side-by-side full-width buttons (swipe card / shortlist card)
// variant='stack'  — vertically stacked compact buttons (rows, mini cards)
function AgentLinks({ agent, variant = 'stack' }) {
  const acpUrl = agentUrl(agent)
  const vUrl = virtualUrl(agent)

  if (variant === 'block') {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <a href={acpUrl} target="_blank" rel="noopener noreferrer"
          style={{ flex: 1, display: 'block', padding: '12px 8px', background: C.lime, borderRadius: 8, textDecoration: 'none', textAlign: 'center', fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 13, color: '#0A0A0A', letterSpacing: 1, whiteSpace: 'nowrap' }}>
          ACP PAGE →
        </a>
        {vUrl && (
          <a href={vUrl} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, display: 'block', padding: '12px 8px', background: 'transparent', border: `1px solid ${C.lime}`, borderRadius: 8, textDecoration: 'none', textAlign: 'center', fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 13, color: C.lime, letterSpacing: 1, whiteSpace: 'nowrap' }}>
            VIRTUAL →
          </a>
        )}
      </div>
    )
  }

  // stack: vertically stacked small links — narrow horizontal footprint for rows & mini cards
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
      <a href={acpUrl} target="_blank" rel="noopener noreferrer"
        style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700, color: '#0A0A0A', background: C.lime, borderRadius: 5, padding: '4px 9px', textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center' }}>
        ACP →
      </a>
      {vUrl && (
        <a href={vUrl} target="_blank" rel="noopener noreferrer"
          style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700, color: C.lime, background: 'transparent', border: `1px solid ${C.lime}`, borderRadius: 5, padding: '4px 9px', textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center' }}>
          VIRTUAL →
        </a>
      )}
    </div>
  )
}

// ─── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ data, width = 80, height = 28 }) {
  if (!data || data.length < 2) return null
  const vals = data.map((d) => d.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })
  const trending = vals[vals.length - 1] >= vals[0]
  return (
    <svg width={width} height={height} style={{ display: 'block', width: '100%' }}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={trending ? C.green : C.red}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  )
}

// ─── Agent Modal ──────────────────────────────────────────────────────────────
function AgentModal({ agent, matchInfo, onClose }) {
  const [imgError, setImgError] = useState(false)
  const [profile, setProfile] = useState(null)
  const isDesktop = useIsDesktop()
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (MOCK) {
      // mock profile data so it works in dev without hitting the API
      setTimeout(() => {
        setProfile({
          description: 'This is a demo agent description. In production this is fetched live from the Virtuals ACP API and shows what the agent actually does, its capabilities, and supported operations.',
          symbol: 'DEMO',
          category: 'ON_CHAIN',
          role: 'HYBRID',
          twitterHandle: 'virtuals_io',
          hasGraduated: true,
          enabledChains: [{ id: 8453, name: 'BASE' }],
          offerings: [
            { id: 1, name: 'Token Swap', price: 0.5, priceUsd: 0.45, slaMinutes: 5 },
            { id: 2, name: 'Market Analysis', price: 1.0, priceUsd: 0.90, slaMinutes: 15 },
          ],
          metrics: { isOnline: agent.successRate > 90, rating: 4.5, minsFromLastOnlineTime: 12 },
        })
        setProfileLoading(false)
      }, 400)
      return
    }
    fetch(`https://acpx.virtuals.io/api/agents?filters[id][$eq]=${agent.id}`)
      .then((r) => r.json())
      .then((data) => {
        const item = Array.isArray(data) ? data[0] : data?.data?.[0] ?? data
        setProfile(item ?? null)
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false))
  }, [agent.id])

  const rich = profile ?? {}
  const metricsData = rich.metrics ?? {}
  const isOnline = metricsData.isOnline ?? false
  const rating = metricsData.rating ?? rich.rating ?? null
  const successDot = isOnline ? C.green : (agent.successRate > 95 ? C.green : agent.successRate > 80 ? '#FFB347' : C.red)

  const lastActive = (metricsData.lastActiveAt ?? agent.lastActiveAt)
    ? new Date(metricsData.lastActiveAt ?? agent.lastActiveAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  const perfMetrics = [
    { label: 'SUCCESS RATE', value: agent.successRate != null ? `${agent.successRate.toFixed(2)}%` : '—' },
    { label: 'TOTAL VOLUME', value: fmtMoney(agent.volume ?? agent.grossAgenticAmount) },
    { label: 'REVENUE', value: fmtMoney(agent.revenue) },
    { label: 'JOBS DONE', value: fmtCount(agent.successfulJobCount) },
    { label: 'UNIQUE BUYERS', value: fmtCount(agent.uniqueBuyerCount) },
    { label: 'MEMOS', value: fmtCount(agent.memoCount) },
    { label: 'TX COUNT', value: fmtCount(metricsData.transactionCount) },
    { label: '7D VOLUME', value: agent.past7dVolume?.length ? fmtMoney(agent.past7dVolume.reduce((s, d) => s + d.value, 0)) : '—' },
  ]

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: isDesktop ? 'center' : 'flex-end', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        padding: isDesktop ? '32px' : 0,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 520,
          background: C.surface,
          border: `1px solid ${C.border2}`,
          borderRadius: isDesktop ? 16 : '16px 16px 0 0',
          padding: '0 0 36px',
          maxHeight: isDesktop ? '88vh' : '92vh',
          overflowY: 'auto',
          animation: 'slideUp 0.25s ease',
        }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(${isDesktop ? '20px' : '60px'}); opacity:0 } to { transform: translateY(0); opacity:1 } }`}</style>

        {/* Handle — only on mobile */}
        {!isDesktop && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 6px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: C.border2 }} />
          </div>
        )}

        {/* ── Header ── */}
        <div style={{ padding: '10px 20px 18px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 72, height: 72, borderRadius: 12, border: `1px solid ${C.border2}`, background: C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {agent.profilePic && !imgError
                  ? <img src={agent.profilePic} alt={agent.name} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 30, color: C.textMuted }}>{agent.name?.[0] ?? '?'}</span>
                }
              </div>
              {/* Online indicator */}
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: isOnline ? C.green : C.textFaint, border: `2px solid ${C.surface}` }} />
            </div>

            {/* Name + badges */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 20, color: C.textPrimary }}>{agent.name}</span>
                {rich.symbol && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.lime, fontWeight: 700 }}>${rich.symbol}</span>}
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {/* Online/offline pill */}
                <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 600, color: isOnline ? C.green : C.textFaint, border: `1px solid ${isOnline ? C.green + '66' : C.border2}`, borderRadius: 4, padding: '2px 7px', letterSpacing: 1 }}>
                  {isOnline ? '● ONLINE' : '○ OFFLINE'}
                </span>
                {matchInfo?.category && (
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 600, color: C.lime, border: `1px solid ${C.lime}44`, borderRadius: 4, padding: '2px 7px', letterSpacing: 1 }}>
                    {matchInfo.category}
                  </span>
                )}
                {rich.category && (
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textMuted, border: `1px solid ${C.border2}`, borderRadius: 4, padding: '2px 7px', letterSpacing: 1 }}>
                    {rich.category}
                  </span>
                )}
                {rich.hasGraduated && (
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textMuted, border: `1px solid ${C.border2}`, borderRadius: 4, padding: '2px 7px', letterSpacing: 1 }}>
                    GRADUATED
                  </span>
                )}
                {agent.isVirtualAgent && (
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textMuted, border: `1px solid ${C.border2}`, borderRadius: 4, padding: '2px 7px', letterSpacing: 1 }}>
                    VIRTUAL
                  </span>
                )}
              </div>
            </div>

            <button onClick={onClose} style={{ background: 'none', border: `1px solid ${C.border2}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.textMuted, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✕</button>
          </div>

          {/* Description */}
          {profileLoading ? (
            <div style={{ marginTop: 14, padding: '12px 14px', background: C.surface2, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${C.border2}`, borderTop: `2px solid ${C.lime}`, animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textFaint }}>Loading agent profile...</span>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : rich.description ? (
            <div style={{ marginTop: 14, padding: '12px 14px', background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, marginBottom: 6 }}>DESCRIPTION</div>
              <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textMuted, lineHeight: 1.6 }}>{rich.description}</div>
            </div>
          ) : null}

          {/* Why it matches */}
          {matchInfo?.reason && (
            <div style={{ marginTop: 10, padding: '10px 14px', background: `${C.lime}0D`, border: `1px solid ${C.lime}22`, borderRadius: 8 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.lime, letterSpacing: 1, marginBottom: 4 }}>WHY IT MATCHES</div>
              <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textMuted, lineHeight: 1.5 }}>{matchInfo.reason}</div>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '16px 20px 0' }}>

          {/* Rating + chains + twitter row */}
          {!profileLoading && (rating || rich.enabledChains?.length || rich.twitterHandle) && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {rating != null && (
                <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>★</span>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.textPrimary, fontWeight: 700 }}>{Number(rating).toFixed(1)}</span>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint }}>RATING</span>
                </div>
              )}
              {rich.enabledChains?.map((c) => (
                <div key={c.id} style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '8px 12px' }}>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.textMuted, fontWeight: 600 }}>⛓ {c.name}</span>
                </div>
              ))}
              {rich.twitterHandle && (
                <a href={`https://twitter.com/${rich.twitterHandle}`} target="_blank" rel="noopener noreferrer" style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '8px 12px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.textMuted, fontWeight: 600 }}>𝕏 @{rich.twitterHandle}</span>
                </a>
              )}
            </div>
          )}

          {/* Metrics grid */}
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, marginBottom: 10 }}>PERFORMANCE METRICS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: C.border, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
            {perfMetrics.map(({ label, value }) => (
              <div key={label} style={{ background: C.surface2, padding: '12px 14px' }}>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 16, color: C.textPrimary, fontWeight: 700 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* 7-day chart */}
          {agent.past7dVolume?.length >= 2 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, marginBottom: 10 }}>7-DAY VOLUME TREND</div>
              <div style={{ background: C.surface2, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '12px 16px' }}>
                <Sparkline data={agent.past7dVolume} height={52} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint }}>{new Date(agent.past7dVolume[0].time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint }}>{new Date(agent.past7dVolume[agent.past7dVolume.length - 1].time).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>
          )}

          {/* Offerings */}
          {!profileLoading && rich.offerings?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, marginBottom: 10 }}>OFFERINGS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: C.border, borderRadius: 8, overflow: 'hidden' }}>
                {rich.offerings.slice(0, 6).map((o) => (
                  <div key={o.id} style={{ background: C.surface2, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textPrimary, marginBottom: 2 }}>{o.name}</div>
                      {o.slaMinutes && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint }}>SLA {o.slaMinutes < 60 ? `${o.slaMinutes}m` : `${Math.round(o.slaMinutes / 60)}h`}</div>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, color: C.lime, fontWeight: 700 }}>{o.price} $VIRTUAL</div>
                      {o.priceUsd != null && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint }}>≈ ${o.priceUsd.toFixed(2)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last active */}
          {lastActive && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '10px 14px', background: C.surface2, borderRadius: 8, border: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textFaint, letterSpacing: 1 }}>LAST ACTIVE</span>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.textMuted, fontWeight: 600 }}>{lastActive}</span>
            </div>
          )}

          {/* CTA */}
          <AgentLinks agent={agent} variant="block" />
        </div>
      </div>
    </div>
  )
}

// ─── Agent Card ──────────────────────────────────────────────────────────────
function AgentCard({ agent, matchInfo, index, total, onSwipe, isTop, onExpand }) {
  const dragRef = useRef({ active: false, startX: 0, deltaX: 0 })
  const cardRef = useRef(null)
  const [deltaX, setDeltaX] = useState(0)
  const [leaving, setLeaving] = useState(null) // 'left' | 'right' | null
  const [imgError, setImgError] = useState(false)

  const color = catColor(matchInfo?.category)

  const stackOffset = index * 9
  const stackScale = 1 - index * 0.045
  const zIndex = total - index

  const handlePointerDown = useCallback((e) => {
    if (!isTop) return
    dragRef.current = { active: true, startX: e.clientX, deltaX: 0 }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [isTop])

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current.active) return
    const dx = e.clientX - dragRef.current.startX
    dragRef.current.deltaX = dx
    setDeltaX(dx)
  }, [])

  const handlePointerUp = useCallback(() => {
    if (!dragRef.current.active) return
    dragRef.current.active = false
    const dx = dragRef.current.deltaX
    if (Math.abs(dx) >= 90) {
      const dir = dx > 0 ? 'right' : 'left'
      setLeaving(dir)
      setTimeout(() => onSwipe(dir), 300)
    } else {
      setDeltaX(0)
      if (isTop && Math.abs(dx) < 8) onExpand()
    }
  }, [onSwipe, onExpand, isTop])

  const rotation = isTop ? deltaX / 22 : 0
  const opacity = leaving ? 0 : 1
  const tx = leaving === 'right' ? 500 : leaving === 'left' ? -500 : 0

  const successDot = agent.successRate > 95 ? C.green : agent.successRate > 80 ? '#FFB347' : C.red

  const saveOpacity = isTop && deltaX > 45 ? Math.min((deltaX - 45) / 90, 1) : 0
  const skipOpacity = isTop && deltaX < -45 ? Math.min((-deltaX - 45) / 90, 1) : 0

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: 'absolute',
        width: '100%',
        background: C.surface,
        border: `1px solid ${C.border2}`,
        borderRadius: 12,
        padding: '20px 20px 16px',
        cursor: isTop ? 'grab' : 'default',
        userSelect: 'none',
        touchAction: 'none',
        zIndex,
        transform: `translateY(${stackOffset}px) scale(${stackScale}) translateX(${tx}px) rotate(${rotation}deg)`,
        transformOrigin: 'bottom center',
        transition: leaving
          ? 'transform 0.3s ease, opacity 0.3s ease'
          : isTop && dragRef.current.active
          ? 'none'
          : `transform 0.45s cubic-bezier(0.34,1.56,0.64,1)`,
        opacity,
        overflow: 'hidden',
      }}
    >
      {/* SAVE overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 12,
        background: `${C.lime}12`,
        border: `2px solid ${C.lime}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: saveOpacity, pointerEvents: 'none', transition: 'opacity 0.1s',
        zIndex: 10,
      }}>
        <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 800, fontSize: 30, color: C.lime, letterSpacing: 6 }}>SAVE</span>
      </div>

      {/* SKIP overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 12,
        background: `${C.red}12`,
        border: `2px solid ${C.red}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: skipOpacity, pointerEvents: 'none', transition: 'opacity 0.1s',
        zIndex: 10,
      }}>
        <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 800, fontSize: 30, color: C.red, letterSpacing: 6 }}>SKIP</span>
      </div>

      {/* Counter */}
      <div style={{
        position: 'absolute', top: 16, right: 20,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: C.textFaint, fontWeight: 600,
      }}>
        {index === 0 ? `${total - index} / ${total}` : ''}
      </div>

      {/* Header */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 16 }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8,
            border: `1px solid ${C.border2}`,
            background: C.surface2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
          }}>
            {agent.profilePic && !imgError ? (
              <img
                src={agent.profilePic}
                alt={agent.name}
                onError={() => setImgError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 22, color: C.textMuted }}>
                {agent.name?.[0] ?? '?'}
              </span>
            )}
          </div>
          <div style={{
            position: 'absolute', bottom: -3, right: -3,
            width: 10, height: 10, borderRadius: '50%',
            background: successDot, border: `2px solid ${C.surface}`,
          }} />
        </div>

        {/* Name + badge + reason */}
        <div style={{ flex: 1, minWidth: 0, paddingRight: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 5 }}>
            <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 16, color: C.textPrimary }}>
              {agent.name}
            </span>
            {matchInfo?.category && (
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 600,
                color: C.textMuted,
                border: `1px solid ${C.border2}`,
                borderRadius: 4, padding: '2px 6px', letterSpacing: 1, textTransform: 'uppercase',
              }}>
                {matchInfo.category}
              </span>
            )}
          </div>
          {matchInfo?.reason && (
            <p style={{ fontFamily: 'system-ui,sans-serif', fontSize: 13, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>
              {matchInfo.reason}
            </p>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: 1, background: C.border, borderRadius: 8, overflow: 'hidden',
        marginBottom: 14,
      }}>
        {[
          { label: 'SUCCESS', value: agent.successRate != null ? `${agent.successRate.toFixed(1)}%` : '—' },
          { label: 'REVENUE', value: fmtMoney(agent.revenue) },
          { label: 'JOBS', value: fmtCount(agent.successfulJobCount) },
          { label: 'BUYERS', value: fmtCount(agent.uniqueBuyerCount) },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: C.surface2, padding: '10px 8px', textAlign: 'center',
          }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, color: C.textPrimary, fontWeight: 700 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: sparkline + expand hint */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          {agent.past7dVolume && agent.past7dVolume.length >= 2
            ? <Sparkline data={agent.past7dVolume} />
            : <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textFaint }}>NO CHART DATA</span>
          }
        </div>
        {isTop && (
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, flexShrink: 0, marginLeft: 12, cursor: 'default' }}>
            TAP FOR MORE
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Loading screen ───────────────────────────────────────────────────────────
function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0)
  const msgs = ['Scanning ACP network...', 'Matching agents to your query...']

  useEffect(() => {
    const t = setTimeout(() => setMsgIndex(1), 2200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 24 }}>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        border: `2px solid ${C.border2}`,
        borderTop: `2px solid ${C.lime}`,
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, color: C.textMuted, letterSpacing: 1 }}>
        {msgs[msgIndex]}
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Search screen ────────────────────────────────────────────────────────────
function SearchScreen({ onSearch, onHistory }) {
  const [query, setQuery] = useState('')
  const isDesktop = useIsDesktop()
  const chips = [
    'Automate my DeFi trades',
    'Create content for my token',
    'Analyze market signals',
    'Manage my social presence',
  ]
  const submit = () => { if (query.trim()) onSearch(query.trim()) }

  const searchForm = (
    <div style={{ width: '100%' }}>
      {!isDesktop && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#0A0A0A' }}>⬡</div>
            <div>
              <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 15, color: C.textPrimary, letterSpacing: 1 }}>TRENCHES SCOUT</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1 }}>ACP EXPLORER · LIVE DATA</div>
            </div>
          </div>
          <button onClick={onHistory} style={{ background: 'none', border: `1px solid ${C.border2}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textMuted, letterSpacing: 1 }}>HISTORY</button>
        </div>
      )}

      <h1 style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 800, fontSize: isDesktop ? 44 : 36, lineHeight: 1.1, marginBottom: 14, color: C.textPrimary, letterSpacing: -1 }}>
        Find your <span style={{ color: C.lime }}>perfect</span><br />ACP agent
      </h1>
      <p style={{ fontFamily: 'system-ui,sans-serif', fontSize: 16, color: C.textMuted, marginBottom: 32, lineHeight: 1.65 }}>
        Describe what you need in plain English. Scout scans 1,800+ live agents and matches the best ones — no filters, no guessing.
      </p>

      <textarea
        rows={3}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
        placeholder="e.g. I need an agent that automates my DeFi trades..."
        style={{
          width: '100%', background: C.surface, border: `1px solid ${query ? C.lime + 'AA' : C.border2}`,
          borderRadius: 8, padding: '14px 16px',
          fontFamily: 'system-ui,sans-serif', fontSize: 16, color: C.textPrimary,
          resize: 'none', outline: 'none', lineHeight: 1.6,
          boxShadow: query ? `0 0 0 3px ${C.lime}18` : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      />

      <button
        onClick={submit}
        disabled={!query.trim()}
        style={{
          width: '100%', marginTop: 10, padding: '14px',
          background: query.trim() ? C.lime : C.surface2,
          border: 'none', borderRadius: 8, cursor: query.trim() ? 'pointer' : 'not-allowed',
          fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 15,
          color: query.trim() ? '#0A0A0A' : C.textFaint, letterSpacing: 2,
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        SCOUT AGENTS
      </button>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
        {chips.map((chip) => (
          <button
            key={chip}
            onClick={() => setQuery(chip)}
            style={{ background: 'none', border: `1px solid ${C.border2}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: 'system-ui,sans-serif', fontSize: 13, color: C.textMuted, transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.lime; e.currentTarget.style.color = C.lime }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textMuted }}
          >{chip}</button>
        ))}
      </div>
    </div>
  )

  const howItWorks = (
    <div style={{ width: '100%' }}>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textFaint, letterSpacing: 2, marginBottom: 24 }}>HOW IT WORKS</div>
      {[
        { step: '01', title: 'Describe your need', body: 'Type what you want in plain English — no filters, no categories to pick from.' },
        { step: '02', title: 'AI scans 1,800+ agents', body: 'We fetch live data from the ACP network and match agents by their actual offerings.' },
        { step: '03', title: 'Swipe to shortlist', body: 'Swipe right to save an agent, left to skip. Your shortlist builds as you go.' },
        { step: '04', title: 'Compare & hire', body: 'Compare shortlisted agents side by side, then jump straight to their Virtuals page.' },
      ].map(({ step, title, body }) => (
        <div key={step} style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.lime, fontWeight: 700, flexShrink: 0, width: 24, paddingTop: 2 }}>{step}</div>
          <div>
            <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 600, fontSize: 15, color: C.textPrimary, marginBottom: 4 }}>{title}</div>
            <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textMuted, lineHeight: 1.55 }}>{body}</div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 8, padding: '14px 16px', background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 10 }}>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, marginBottom: 8 }}>POWERED BY</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[['1,800+', 'Live Agents'], ['3 Sort Keys', 'Volume · Revenue · Success'], ['AI Match', 'GPT-4o mini']].map(([val, label]) => (
            <div key={label}>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 14, color: C.lime, fontWeight: 700 }}>{val}</div>
              <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 13, color: C.textFaint, marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 32px 40px' }}>
        <div style={{ width: '100%', maxWidth: 1000, display: 'flex', gap: 80, alignItems: 'center' }}>
          <div style={{ flex: '0 0 460px' }}>{searchForm}</div>
          <div style={{ flex: 1, minWidth: 0 }}>{howItWorks}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', paddingBottom: 100 }}>
      <div style={{ width: '100%', maxWidth: 460 }}>{searchForm}</div>
    </div>
  )
}

// ─── Results screen ───────────────────────────────────────────────────────────
function ResultsScreen({ matches, agents, onNewSearch, onDone }) {
  const [deck, setDeck] = useState(matches)
  const [saved, setSaved] = useState([])
  const [expandedAgent, setExpandedAgent] = useState(null)
  const isDesktop = useIsDesktop()
  const VISIBLE = 3

  const agentMap = Object.fromEntries(agents.map((a) => [a.id, a]))

  const handleSwipe = useCallback((dir) => {
    setDeck((prev) => {
      const [top, ...rest] = prev
      if (dir === 'right') {
        const agent = agentMap[top.id]
        if (agent) setSaved((s) => [...s, { ...agent, matchInfo: top }])
      }
      if (rest.length === 0) {
        setTimeout(() => onDone([...saved, ...(dir === 'right' && agentMap[top.id] ? [{ ...agentMap[top.id], matchInfo: top }] : [])]), 350)
      }
      return rest
    })
  }, [agentMap, saved, onDone])

  const visibleDeck = deck.slice(0, VISIBLE)

  const cardArea = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {!isDesktop && (
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <button onClick={onNewSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.textMuted, fontWeight: 600, letterSpacing: 1 }}>← NEW SEARCH</button>
          <div style={{ background: C.lime, borderRadius: 6, padding: '4px 12px', fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: '#0A0A0A', fontWeight: 700 }}>{saved.length} SAVED</div>
        </div>
      )}

      <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textFaint, letterSpacing: 1, marginBottom: 20 }}>
        {isDesktop ? 'CLICK ✕ TO SKIP · ✓ TO SAVE — OR DRAG THE CARD' : 'SWIPE RIGHT TO SAVE · LEFT TO SKIP'}
      </p>

      <div style={{ position: 'relative', width: '100%', maxWidth: 420, height: 380 }}>
        {deck.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 18, color: C.textMuted }}>No matches found</div>
            <button onClick={onNewSearch} style={{ background: C.lime, border: 'none', borderRadius: 8, padding: '10px 20px', fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 14, color: '#0A0A0A', cursor: 'pointer', letterSpacing: 1 }}>TRY AGAIN</button>
          </div>
        ) : visibleDeck.map((match, i) => {
          const agent = agentMap[match.id]
          if (!agent) return null
          return (
            <AgentCard
              key={match.id}
              agent={agent}
              matchInfo={match}
              index={i}
              total={deck.length}
              isTop={i === 0}
              onSwipe={handleSwipe}
              onExpand={() => setExpandedAgent({ agent, matchInfo: match })}
            />
          )
        })}
      </div>

      {deck.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 28 }}>
          <button
            onClick={() => handleSwipe('left')}
            style={{ width: 56, height: 56, borderRadius: 8, background: 'none', border: `1px solid ${C.border2}`, cursor: 'pointer', fontSize: 22, color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textMuted }}
          >✕</button>
          <button
            onClick={() => handleSwipe('right')}
            style={{ width: 56, height: 56, borderRadius: 8, background: C.lime, border: 'none', cursor: 'pointer', fontSize: 22, color: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
          >✓</button>
        </div>
      )}
    </div>
  )

  const savedPanel = (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 18, color: C.textPrimary }}>Saved Agents</div>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, marginTop: 2 }}>{saved.length} OF {matches.length} SAVED</div>
        </div>
        <button onClick={onNewSearch} style={{ background: 'none', border: `1px solid ${C.border2}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textMuted, letterSpacing: 1 }}>← NEW SEARCH</button>
      </div>

      {saved.length === 0 ? (
        <div style={{ padding: '32px 20px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, textAlign: 'center' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 26, color: C.textFaint, marginBottom: 10 }}>◌</div>
          <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textFaint }}>Swipe right or click ✓ to save agents here</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {saved.map((agent) => (
            <div key={agent.id} style={{ background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 8, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: C.surface2, border: `1px solid ${C.border2}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {agent.profilePic
                  ? <img src={agent.profilePic} alt={agent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
                  : <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 15, color: C.textMuted }}>{agent.name?.[0]}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 600, fontSize: 14, color: C.textPrimary }}>{agent.name}</div>
                <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 13, color: C.textMuted, lineHeight: 1.3, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.matchInfo?.reason}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.lime, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      {deck.length === 0 && saved.length > 0 && (
        <button
          onClick={() => onDone(saved)}
          style={{ width: '100%', marginTop: 16, padding: '13px', background: C.lime, border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 15, color: '#0A0A0A', letterSpacing: 2 }}
        >
          VIEW SHORTLIST →
        </button>
      )}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: isDesktop ? 'center' : 'flex-start', padding: isDesktop ? '80px 32px 40px' : '20px 16px' }}>
      {isDesktop ? (
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', gap: 60, alignItems: 'flex-start' }}>
          <div style={{ flex: '0 0 440px' }}>{cardArea}</div>
          <div style={{ flex: 1, minWidth: 0, paddingTop: 44 }}>{savedPanel}</div>
        </div>
      ) : (
        cardArea
      )}

      {expandedAgent && (
        <AgentModal
          agent={expandedAgent.agent}
          matchInfo={expandedAgent.matchInfo}
          onClose={() => setExpandedAgent(null)}
        />
      )}
    </div>
  )
}

// ─── Compare Modal ─────────────────────────────────────────────────────────────
function CompareModal({ agents, matchInfoMap = {}, onClose }) {
  const [profiles, setProfiles] = useState({})
  const isDesktop = useIsDesktop()
  // On desktop fill the viewport width; on mobile use a fixed min per column
  const colWidth = isDesktop ? Math.floor((Math.min(window.innerWidth, 1200) - 64) / agents.length) : 200

  useEffect(() => {
    if (MOCK) {
      const map = {}
      agents.forEach((a) => {
        map[a.id] = {
          description: 'Demo agent description showing capabilities and supported operations in the ACP network.',
          symbol: 'DEMO',
          category: 'ON_CHAIN',
          twitterHandle: 'virtuals_io',
          hasGraduated: true,
          enabledChains: [{ id: 8453, name: 'BASE' }],
          offerings: [
            { id: 1, name: 'Token Swap', price: 0.5, priceUsd: 0.45, slaMinutes: 5 },
            { id: 2, name: 'Market Analysis', price: 1.0, priceUsd: 0.90, slaMinutes: 15 },
          ],
          metrics: { isOnline: a.successRate > 90, rating: 4.5 },
        }
      })
      setProfiles(map)
      return
    }
    agents.forEach((agent) => {
      fetch(`https://acpx.virtuals.io/api/agents?filters[id][$eq]=${agent.id}`)
        .then((r) => r.json())
        .then((data) => {
          const item = Array.isArray(data) ? data[0] : data?.data?.[0] ?? data
          setProfiles((prev) => ({ ...prev, [agent.id]: item ?? {} }))
        })
        .catch(() => setProfiles((prev) => ({ ...prev, [agent.id]: {} })))
    })
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: isDesktop ? 'center' : 'stretch', justifyContent: 'center',
        padding: isDesktop ? '24px' : 0,
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(40px); opacity:0 } to { transform: translateY(0); opacity:1 } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex', flexDirection: 'column',
          background: C.bg, animation: 'slideUp 0.22s ease',
          width: '100%', maxWidth: isDesktop ? 1200 : '100%',
          maxHeight: isDesktop ? '92vh' : '100vh',
          borderRadius: isDesktop ? 16 : 0,
          border: isDesktop ? `1px solid ${C.border2}` : 'none',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 18, color: C.textPrimary }}>Compare Agents</div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, marginTop: 2 }}>
              {agents.length} SELECTED{!isDesktop ? ' · SCROLL HORIZONTALLY' : ''}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: `1px solid ${C.border2}`, borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.textMuted, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >✕</button>
        </div>

        {/* Comparison columns */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: isDesktop ? 'hidden' : 'auto' }}>
          <div style={{ display: 'flex', justifyContent: isDesktop ? 'center' : 'flex-start', minWidth: isDesktop ? 'unset' : agents.length * colWidth, paddingBottom: 40 }}>
            {agents.map((agent, idx) => {
              const rich = profiles[agent.id] ?? {}
              const metricsData = rich.metrics ?? {}
              const isOnline = metricsData.isOnline ?? false
              const rating = metricsData.rating ?? null
              const loaded = agent.id in profiles
              const matchInfo = matchInfoMap[agent.id]

              return (
                <div
                  key={agent.id}
                  style={{
                    flex: `0 0 ${isDesktop ? Math.min(320, Math.floor((Math.min(window.innerWidth, 1200) - 64) / agents.length)) : colWidth}px`,
                    borderRight: idx < agents.length - 1 ? `1px solid ${C.border}` : 'none',
                    padding: isDesktop ? '24px 20px' : '20px 14px',
                  }}
                >
                  {/* Avatar + name */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 16, gap: 6 }}>
                    <div style={{ position: 'relative' }}>
                      <div style={{ width: 56, height: 56, borderRadius: 10, border: `1px solid ${C.border2}`, background: C.surface2, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {agent.profilePic
                          ? <img src={agent.profilePic} alt={agent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
                          : <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 24, color: C.textMuted }}>{agent.name?.[0]}</span>}
                      </div>
                      <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderRadius: '50%', background: isOnline ? C.green : C.textFaint, border: `2px solid ${C.bg}` }} />
                    </div>
                    <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 14, color: C.textPrimary, lineHeight: 1.3 }}>{agent.name}</div>
                    {rich.symbol && <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.lime, fontWeight: 700 }}>${rich.symbol}</div>}
                    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: isOnline ? C.green : C.textFaint, border: `1px solid ${isOnline ? C.green + '55' : C.border2}`, borderRadius: 3, padding: '2px 5px', letterSpacing: 0.5 }}>
                        {isOnline ? '● ONLINE' : '○ OFFLINE'}
                      </span>
                      {matchInfo?.category && (
                        <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.lime, border: `1px solid ${C.lime}44`, borderRadius: 3, padding: '2px 5px', letterSpacing: 0.5 }}>
                          {matchInfo.category}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint, letterSpacing: 1, marginBottom: 6 }}>METRICS</div>
                  {[
                    { label: 'SUCCESS', value: agent.successRate != null ? `${agent.successRate.toFixed(1)}%` : '—' },
                    { label: 'VOLUME', value: fmtMoney(agent.volume ?? agent.grossAgenticAmount) },
                    { label: 'REVENUE', value: fmtMoney(agent.revenue) },
                    { label: 'JOBS', value: fmtCount(agent.successfulJobCount) },
                    { label: 'BUYERS', value: fmtCount(agent.uniqueBuyerCount) },
                    { label: 'MEMOS', value: fmtCount(agent.memoCount) },
                    ...(rating != null ? [{ label: 'RATING', value: `★ ${rating.toFixed(1)}`, highlight: true }] : []),
                  ].map(({ label, value, highlight }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint }}>{label}</span>
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: highlight ? C.lime : C.textPrimary, fontWeight: 600 }}>{value}</span>
                    </div>
                  ))}

                  {/* Description */}
                  {!loaded ? (
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', border: `2px solid ${C.border2}`, borderTop: `2px solid ${C.lime}`, animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint }}>Loading...</span>
                    </div>
                  ) : rich.description ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint, letterSpacing: 1, marginBottom: 5 }}>ABOUT</div>
                      <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 13, color: C.textMuted, lineHeight: 1.5 }}>{rich.description}</div>
                    </div>
                  ) : null}

                  {/* Why matched */}
                  {matchInfo?.reason && (
                    <div style={{ marginTop: 12, padding: '8px 10px', background: `${C.lime}0D`, border: `1px solid ${C.lime}22`, borderRadius: 7 }}>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.lime, letterSpacing: 1, marginBottom: 4 }}>WHY MATCHED</div>
                      <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 13, color: C.textMuted, lineHeight: 1.4 }}>{matchInfo.reason}</div>
                    </div>
                  )}

                  {/* Offerings */}
                  {rich.offerings?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint, letterSpacing: 1, marginBottom: 6 }}>OFFERINGS ({rich.offerings.length})</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {rich.offerings.slice(0, 3).map((o) => (
                          <div key={o.id} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 8px' }}>
                            <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 13, color: C.textPrimary, fontWeight: 500, marginBottom: 2 }}>{o.name}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.lime }}>{o.price != null ? `${o.price} VIRTUAL` : '—'}</span>
                              {o.slaMinutes && <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint }}>{o.slaMinutes}min SLA</span>}
                            </div>
                          </div>
                        ))}
                        {rich.offerings.length > 3 && (
                          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint, textAlign: 'center', paddingTop: 2 }}>+{rich.offerings.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chains */}
                  {rich.enabledChains?.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint, letterSpacing: 1, marginBottom: 5 }}>CHAINS</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {rich.enabledChains.map((c) => (
                          <span key={c.id} style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textMuted, border: `1px solid ${C.border2}`, borderRadius: 3, padding: '2px 5px' }}>{c.name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Twitter */}
                  {rich.twitterHandle && (
                    <div style={{ marginTop: 12 }}>
                      <a href={`https://twitter.com/${rich.twitterHandle}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textMuted, textDecoration: 'none' }}>
                        @{rich.twitterHandle} ↗
                      </a>
                    </div>
                  )}

                  {/* View link */}
                  <div style={{ marginTop: 16 }}>
                    <AgentLinks agent={agent} variant="block" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Done screen ──────────────────────────────────────────────────────────────
function DoneScreen({ saved, query, onRestart, onHistory }) {
  const [selected, setSelected] = useState(new Set())
  const [comparing, setComparing] = useState(false)

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 4) next.add(id)
      return next
    })
  }

  const selectedAgents = saved.filter((a) => selected.has(a.id))
  const matchInfoMap = Object.fromEntries(saved.map((a) => [a.id, a.matchInfo]))
  const showCompareBar = selected.size >= 2

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', paddingBottom: showCompareBar ? 120 : 32 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: C.lime,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#0A0A0A',
          }}>⬡</div>
          <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 15, color: C.textPrimary, letterSpacing: 1 }}>
            TRENCHES SCOUT
          </span>
        </div>

        <h2 style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 800, fontSize: 30, color: C.textPrimary, marginBottom: 10, letterSpacing: -0.5 }}>
          Your shortlist
        </h2>

        {/* Query pill */}
        {query && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: C.surface2, border: `1px solid ${C.border2}`,
            borderRadius: 8, padding: '8px 12px', marginBottom: 16,
          }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1 }}>QUERY</span>
            <span style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textMuted, fontStyle: 'italic' }}>"{query}"</span>
          </div>
        )}

        <p style={{ fontFamily: 'system-ui,sans-serif', fontSize: 15, color: C.textMuted, marginBottom: saved.length > 1 ? 10 : 20 }}>
          {saved.length === 0
            ? 'No agents saved this round. Try a new search!'
            : `${saved.length} agent${saved.length > 1 ? 's' : ''} saved. Ready to hire.`}
        </p>

        {saved.length > 1 && (
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, marginBottom: 14 }}>
            TAP TO SELECT · COMPARE UP TO 4
          </div>
        )}

        {/* Saved list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {saved.map((agent) => {
            const isSel = selected.has(agent.id)
            const maxed = selected.size >= 4 && !isSel
            return (
              <div
                key={agent.id}
                onClick={() => !maxed && toggleSelect(agent.id)}
                style={{
                  background: C.surface, border: `1px solid ${isSel ? C.lime : C.border2}`,
                  boxShadow: isSel ? `0 0 0 1px ${C.lime}33` : 'none',
                  borderRadius: 8, padding: '14px 16px',
                  display: 'flex', gap: 12, alignItems: 'center',
                  cursor: maxed ? 'default' : 'pointer',
                  opacity: maxed ? 0.45 : 1,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${isSel ? C.lime : C.border2}`,
                  background: isSel ? C.lime : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}>
                  {isSel && <span style={{ fontSize: 12, color: '#0A0A0A', lineHeight: 1, fontWeight: 700 }}>✓</span>}
                </div>

                <div style={{
                  width: 40, height: 40, borderRadius: 6,
                  border: `1px solid ${C.border2}`, background: C.surface2,
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {agent.profilePic ? (
                    <img src={agent.profilePic} alt={agent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
                  ) : (
                    <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 18, color: C.textMuted }}>{agent.name?.[0]}</span>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 600, fontSize: 15, color: C.textPrimary, marginBottom: 2 }}>
                    {agent.name}
                  </div>
                  <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 13, color: C.textMuted, lineHeight: 1.4 }}>
                    {agent.matchInfo?.reason}
                  </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <AgentLinks agent={agent} />
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onRestart}
            style={{
              flex: 1, padding: '14px',
              background: C.lime,
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 15,
              color: '#0A0A0A', letterSpacing: 2,
            }}
          >
            SCOUT AGAIN
          </button>
          <button
            onClick={onHistory}
            style={{
              padding: '14px 18px',
              background: 'none', border: `1px solid ${C.border2}`, borderRadius: 8, cursor: 'pointer',
              fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.textMuted, letterSpacing: 1,
            }}
          >
            HISTORY
          </button>
        </div>
      </div>

      {/* Sticky compare bar */}
      {showCompareBar && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
          background: C.surface, borderTop: `1px solid ${C.border2}`,
          padding: '12px 16px 24px',
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{ width: '100%', maxWidth: 420, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textMuted, flex: 1 }}>
              {selected.size} SELECTED
            </span>
            <button
              onClick={() => setComparing(true)}
              style={{
                background: C.lime, border: 'none', borderRadius: 8,
                padding: '12px 24px', cursor: 'pointer',
                fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 14,
                color: '#0A0A0A', letterSpacing: 1,
              }}
            >
              COMPARE {selected.size}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              style={{
                background: 'none', border: `1px solid ${C.border2}`, borderRadius: 8,
                padding: '12px 14px', cursor: 'pointer',
                fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textMuted,
              }}
            >
              CLEAR
            </button>
          </div>
        </div>
      )}

      {comparing && (
        <CompareModal agents={selectedAgents} matchInfoMap={matchInfoMap} onClose={() => setComparing(false)} />
      )}
    </div>
  )
}

// ─── Mock data (set MOCK = true to skip all API calls during UI dev) ──────────
const MOCK = false

const MOCK_AGENTS = [
  { id: 84,   name: 'Ethy AI',                          isVirtualAgent: true,  virtualAgentId: '19520', profilePic: null, successRate: 99.23, volume: 218099220, revenue: 572787, successfulJobCount: 1139030, uniqueBuyerCount: 7496,  memoCount: 3420469, offeringsCount: 10, grossAgenticAmount: 218099220, lastActiveAt: '2026-04-08T09:22:25.980Z', tag: null,           past7dVolume: [{ time: '2026-05-03T08:00:00.000Z', value: 100000 }, { time: '2026-05-04T08:00:00.000Z', value: 130000 }, { time: '2026-05-05T08:00:00.000Z', value: 120000 }, { time: '2026-05-06T08:00:00.000Z', value: 160000 }, { time: '2026-05-07T08:00:00.000Z', value: 210000 }] },
  { id: 129,  name: 'Axelrod',                          isVirtualAgent: true,  virtualAgentId: '22564', profilePic: null, successRate: 94.84, volume: 88000000,  revenue: 320000, successfulJobCount: 450000,  uniqueBuyerCount: 4791,  memoCount: 980000,  offeringsCount: 6,  grossAgenticAmount: 88000000,  lastActiveAt: '2026-05-01T14:10:00.000Z', tag: 'defi',        past7dVolume: [{ time: '2026-05-03T08:00:00.000Z', value: 80000 }, { time: '2026-05-04T08:00:00.000Z', value: 75000 }, { time: '2026-05-05T08:00:00.000Z', value: 60000 }, { time: '2026-05-06T08:00:00.000Z', value: 55000 }, { time: '2026-05-07T08:00:00.000Z', value: 50000 }] },
  { id: 74,   name: 'Luna',                             isVirtualAgent: true,  virtualAgentId: '68',    profilePic: null, successRate: 88.10, volume: 22000000,  revenue: 95000,  successfulJobCount: 210000,  uniqueBuyerCount: 1800,  memoCount: 430000,  offeringsCount: 4,  grossAgenticAmount: 22000000,  lastActiveAt: '2026-05-07T09:00:00.000Z', tag: 'entertainment', past7dVolume: [{ time: '2026-05-03T08:00:00.000Z', value: 20000 }, { time: '2026-05-04T08:00:00.000Z', value: 22000 }, { time: '2026-05-05T08:00:00.000Z', value: 25000 }, { time: '2026-05-06T08:00:00.000Z', value: 28000 }, { time: '2026-05-07T08:00:00.000Z', value: 30000 }] },
  { id: 1048, name: 'Wasabot',                          isVirtualAgent: true,  virtualAgentId: '42579', profilePic: null, successRate: 91.40, volume: 45000000,  revenue: 180000, successfulJobCount: 320000,  uniqueBuyerCount: 2400,  memoCount: 760000,  offeringsCount: 8,  grossAgenticAmount: 45000000,  lastActiveAt: '2026-04-28T11:30:00.000Z', tag: null,           past7dVolume: null },
  { id: 788,  name: 'Otto AI - Trade Execution Agent',  isVirtualAgent: false, virtualAgentId: null,    profilePic: null, successRate: 97.80, volume: 134000000, revenue: 410000, successfulJobCount: 780000,  uniqueBuyerCount: 5100,  memoCount: 2100000, offeringsCount: 12, grossAgenticAmount: 134000000, lastActiveAt: '2026-05-09T07:45:00.000Z', tag: null,           past7dVolume: [{ time: '2026-05-03T08:00:00.000Z', value: 60000 }, { time: '2026-05-04T08:00:00.000Z', value: 65000 }, { time: '2026-05-05T08:00:00.000Z', value: 72000 }, { time: '2026-05-06T08:00:00.000Z', value: 80000 }, { time: '2026-05-07T08:00:00.000Z', value: 95000 }] },
]

const MOCK_MATCHES = [
  { id: 84,   category: 'DeFi',     reason: 'Highest volume DeFi agent with 99%+ success rate and 1M+ completed jobs.' },
  { id: 129,  category: 'Trading',  reason: 'Specialises in automated trade execution across multiple DeFi protocols.' },
  { id: 74,   category: 'Social',   reason: 'Manages social presence and community engagement for token projects.' },
  { id: 1048, category: 'Content',  reason: 'Produces and distributes content for token launches and campaigns.' },
  { id: 788,  category: 'Analytics',reason: 'Provides real-time on-chain analytics and market signal alerts.' },
]

// ─── History helpers ──────────────────────────────────────────────────────────
const HISTORY_KEY = 'trenches_scout_history'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) ?? [] } catch { return [] }
}

function saveToHistory(entry) {
  const history = loadHistory()
  history.unshift(entry)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 20)))
}

// ─── History screen ───────────────────────────────────────────────────────────
function AgentRow({ agent, isSel, maxed, onToggle }) {
  return (
    <div
      onClick={() => !maxed && onToggle(agent)}
      style={{
        display: 'flex', gap: 10, alignItems: 'center',
        padding: '10px 12px', borderRadius: 8,
        border: `1px solid ${isSel ? C.lime : C.border}`,
        boxShadow: isSel ? `0 0 0 1px ${C.lime}33` : 'none',
        background: isSel ? `${C.lime}08` : 'transparent',
        cursor: maxed ? 'default' : 'pointer',
        opacity: maxed ? 0.4 : 1,
        transition: 'border-color 0.15s, background 0.15s',
      }}
    >
      <div style={{
        width: 16, height: 16, borderRadius: 3, flexShrink: 0,
        border: `1.5px solid ${isSel ? C.lime : C.border2}`,
        background: isSel ? C.lime : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {isSel && <span style={{ fontSize: 11, color: '#0A0A0A', lineHeight: 1, fontWeight: 700 }}>✓</span>}
      </div>
      <div style={{ width: 36, height: 36, borderRadius: 7, background: C.surface2, border: `1px solid ${C.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
        {agent.profilePic
          ? <img src={agent.profilePic} alt={agent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
          : <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 15, color: C.textMuted }}>{agent.name?.[0]}</span>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{agent.name}</div>
        <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 13, color: C.textMuted, lineHeight: 1.35, marginTop: 2 }}>{agent.matchInfo?.reason}</div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        <AgentLinks agent={agent} />
      </div>
    </div>
  )
}

function HistoryScreen({ onBack }) {
  const isDesktop = useIsDesktop()
  const [history, setHistory] = useState(loadHistory)
  const [expanded, setExpanded] = useState(() => {
    const h = loadHistory()
    return h.length > 0 ? h[0].id : null
  })
  const [selected, setSelected] = useState(new Map())
  const [comparing, setComparing] = useState(false)

  function clearAll() {
    localStorage.removeItem(HISTORY_KEY)
    setHistory([])
    setExpanded(null)
    setSelected(new Map())
  }

  function handleExpand(sessionId) {
    setExpanded((prev) => {
      const next = prev === sessionId ? null : sessionId
      setSelected(new Map())
      return next
    })
  }

  function toggleSelect(agent) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(agent.id)) next.delete(agent.id)
      else if (next.size < 4) next.set(agent.id, agent)
      return next
    })
  }

  const selectedAgents = Array.from(selected.values())
  const matchInfoMap = Object.fromEntries(selectedAgents.map((a) => [a.id, a.matchInfo]))
  const showCompareBar = selected.size >= 2
  const activeSession = history.find((s) => s.id === expanded)

  if (history.length === 0) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 36, color: C.textFaint, marginBottom: 16 }}>◌</div>
          <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 600, fontSize: 18, color: C.textMuted, marginBottom: 8 }}>No history yet</div>
          <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textFaint, marginBottom: 28 }}>Your shortlists will appear here after each scout session.</div>
          <button onClick={onBack} style={{ background: 'none', border: `1px solid ${C.border2}`, borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.textMuted, letterSpacing: 1 }}>← BACK</button>
        </div>
      </div>
    )
  }

  // ── Shared header ──────────────────────────────────────────────────────────
  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.textMuted, fontWeight: 600, letterSpacing: 1 }}>← BACK</button>
      <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 20, color: C.textPrimary }}>Search History</span>
      <button onClick={clearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.red, letterSpacing: 1 }}>CLEAR ALL</button>
    </div>
  )

  // ── Session list (shared between layouts) ──────────────────────────────────
  const sessionList = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {history.map((session) => {
        const isActive = expanded === session.id
        return (
          <button
            key={session.id}
            onClick={() => handleExpand(session.id)}
            style={{
              width: '100%', background: isActive ? `${C.lime}0A` : C.surface,
              border: `1px solid ${isActive ? C.lime + '66' : C.border2}`,
              borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              padding: '14px 16px', transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textPrimary, fontWeight: 500, lineHeight: 1.4, marginBottom: 6 }}>
              "{session.query}"
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint }}>{session.date}</span>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: session.saved.length > 0 ? C.lime : C.textFaint }}>
                {session.saved.length} SAVED
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )

  // ── Agent list for the active session ─────────────────────────────────────
  const agentPanel = activeSession ? (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 16, fontWeight: 600, color: C.textPrimary, lineHeight: 1.4, marginBottom: 4 }}>
          "{activeSession.query}"
        </div>
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1 }}>
          {activeSession.date} · {activeSession.saved.length} SAVED · SELECT UP TO 4 TO COMPARE
        </div>
      </div>
      {activeSession.saved.length === 0 ? (
        <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textFaint, padding: '32px 0', textAlign: 'center' }}>Nothing shortlisted this session</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeSession.saved.map((agent) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              isSel={selected.has(agent.id)}
              maxed={selected.size >= 4 && !selected.has(agent.id)}
              onToggle={toggleSelect}
            />
          ))}
        </div>
      )}
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
      <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.textFaint, letterSpacing: 1 }}>← SELECT A SESSION</div>
    </div>
  )

  // ── Compare bar ───────────────────────────────────────────────────────────
  const compareBar = showCompareBar && (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: C.surface, borderTop: `1px solid ${C.border2}`,
      padding: '12px 24px 24px',
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textMuted }}>{selected.size} SELECTED</div>
          <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 13, color: C.textFaint, marginTop: 1 }}>
            {selectedAgents.map((a) => a.name).join(', ')}
          </div>
        </div>
        <button
          onClick={() => setComparing(true)}
          style={{ background: C.lime, border: 'none', borderRadius: 8, padding: '12px 24px', cursor: 'pointer', fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 14, color: '#0A0A0A', letterSpacing: 1 }}
        >COMPARE {selected.size}</button>
        <button
          onClick={() => setSelected(new Map())}
          style={{ background: 'none', border: `1px solid ${C.border2}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textMuted }}
        >CLEAR</button>
      </div>
    </div>
  )

  // ── Desktop: two-column layout ────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div style={{ minHeight: '100vh', padding: '28px 32px', paddingBottom: showCompareBar ? 120 : 48, maxWidth: 1100, margin: '0 auto', boxSizing: 'border-box' }}>
        {header}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* Left: session list */}
          <div style={{ width: 320, flexShrink: 0 }}>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, marginBottom: 12 }}>
              {history.length} SESSION{history.length !== 1 ? 'S' : ''}
            </div>
            {sessionList}
          </div>
          {/* Right: active session agents */}
          <div style={{ flex: 1, minWidth: 0, background: C.surface, border: `1px solid ${C.border2}`, borderRadius: 12, padding: '20px 24px' }}>
            {agentPanel}
          </div>
        </div>
        {compareBar}
        {comparing && <CompareModal agents={selectedAgents} matchInfoMap={matchInfoMap} onClose={() => setComparing(false)} />}
      </div>
    )
  }

  // ── Mobile: accordion layout ──────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px', paddingBottom: showCompareBar ? 120 : 40 }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        {header}
        <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1, marginBottom: 16 }}>
          OPEN A SESSION · TAP AGENTS TO SELECT · COMPARE UP TO 4
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((session) => (
            <div key={session.id} style={{ background: C.surface, border: `1px solid ${expanded === session.id ? C.lime + '66' : C.border2}`, borderRadius: 10, overflow: 'hidden' }}>
              <button
                onClick={() => handleExpand(session.id)}
                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textPrimary, fontWeight: 500, lineHeight: 1.4, marginBottom: 5 }}>"{session.query}"</div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textFaint }}>{session.date}</span>
                    <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: session.saved.length > 0 ? C.lime : C.textFaint }}>{session.saved.length} SAVED</span>
                  </div>
                </div>
                <span style={{ color: C.textFaint, fontSize: 13, flexShrink: 0, marginTop: 2 }}>{expanded === session.id ? '▲' : '▼'}</span>
              </button>
              {expanded === session.id && (
                <div style={{ borderTop: `1px solid ${C.border}`, padding: '10px 16px 14px' }}>
                  {session.saved.length === 0 ? (
                    <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 13, color: C.textFaint, textAlign: 'center', padding: '8px 0' }}>Nothing shortlisted this session</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {session.saved.map((agent) => (
                        <AgentRow
                          key={agent.id}
                          agent={agent}
                          isSel={selected.has(agent.id)}
                          maxed={selected.size >= 4 && !selected.has(agent.id)}
                          onToggle={toggleSelect}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {compareBar}
      {comparing && <CompareModal agents={selectedAgents} matchInfoMap={matchInfoMap} onClose={() => setComparing(false)} />}
    </div>
  )
}

// ─── Tab nav — bottom on mobile, top bar on desktop ──────────────────────────
function BottomNav({ active, onChange, onHistory }) {
  const isDesktop = useIsDesktop()
  const tabs = [
    { id: 'search',   label: 'SCOUT',    icon: '⌕' },
    { id: 'discover', label: 'DISCOVER', icon: '✦' },
  ]

  if (isDesktop) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: `${C.bg}F0`, borderBottom: `1px solid ${C.border2}`,
        backdropFilter: 'blur(12px)',
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', width: '100%', maxWidth: 1100, padding: '0 32px', alignItems: 'center', height: 56, justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#0A0A0A', fontWeight: 800 }}>⬡</div>
            <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 14, color: C.textPrimary, letterSpacing: 1 }}>TRENCHES SCOUT</span>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map((tab) => {
              const isActive = active === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => onChange(tab.id)}
                  style={{
                    background: isActive ? `${C.lime}15` : 'none',
                    border: `1px solid ${isActive ? C.lime + '55' : 'transparent'}`,
                    borderRadius: 6, cursor: 'pointer',
                    padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 7,
                  }}
                >
                  <span style={{ fontSize: 15, color: isActive ? C.lime : C.textFaint }}>{tab.icon}</span>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, letterSpacing: 1, color: isActive ? C.lime : C.textFaint, fontWeight: isActive ? 700 : 400 }}>{tab.label}</span>
                </button>
              )
            })}
          </div>
          {/* Right slot — history */}
          <div style={{ width: 150, display: 'flex', justifyContent: 'flex-end' }}>
            {onHistory && (
              <button
                onClick={onHistory}
                style={{ background: 'none', border: `1px solid ${C.border2}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textMuted, letterSpacing: 1, transition: 'border-color 0.15s, color 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.lime; e.currentTarget.style.color = C.lime }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textMuted }}
              >HISTORY</button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: C.surface, borderTop: `1px solid ${C.border2}`,
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', width: '100%', maxWidth: 480 }}>
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                padding: '12px 0 16px', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 3,
              }}
            >
              <span style={{ fontSize: 20, color: isActive ? C.lime : C.textFaint, lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, letterSpacing: 1, color: isActive ? C.lime : C.textFaint, fontWeight: isActive ? 700 : 400 }}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Discovery mini agent card ────────────────────────────────────────────────
function MiniAgentCard({ agent, onExpand }) {
  const [imgError, setImgError] = useState(false)
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    if (MOCK) {
      setTimeout(() => {
        setProfile({
          description: 'Autonomous AI agent specialising in on-chain operations and market intelligence across the ACP network.',
          offerings: [
            { id: 1, name: 'Token Swap' },
            { id: 2, name: 'Market Analysis' },
            { id: 3, name: 'Portfolio Tracking' },
          ],
        })
        setProfileLoading(false)
      }, 300 + Math.random() * 400)
      return
    }
    fetch(`https://acpx.virtuals.io/api/agents?filters[id][$eq]=${agent.id}`)
      .then((r) => r.json())
      .then((data) => {
        const item = Array.isArray(data) ? data[0] : data?.data?.[0] ?? data
        setProfile(item ?? null)
      })
      .catch(() => setProfile(null))
      .finally(() => setProfileLoading(false))
  }, [agent.id])

  const trend = agent.past7dVolume?.length >= 2
    ? (agent.past7dVolume[agent.past7dVolume.length - 1].value >= agent.past7dVolume[0].value ? 'up' : 'down')
    : null
  const offerings = profile?.offerings?.slice(0, 3) ?? []
  const description = profile?.description ?? null

  return (
    <div
      onClick={() => onExpand(agent)}
      style={{
        flexShrink: 0, width: 220,
        background: C.surface, border: `1px solid ${C.border2}`,
        borderRadius: 12, padding: '16px 14px',
        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 10,
        transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.border2.replace('2A', '44') }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border2 }}
    >
      {/* Header row: avatar + name + online dot */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: C.surface2, border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {agent.profilePic && !imgError
              ? <img src={agent.profilePic} alt={agent.name} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 18, color: C.textMuted }}>{agent.name?.[0]}</span>
            }
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 14, color: C.textPrimary, lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {agent.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, fontWeight: 700, color: C.textPrimary }}>{fmtMoney(agent.volume ?? agent.grossAgenticAmount)}</span>
            {trend && <span style={{ fontSize: 12, color: trend === 'up' ? C.green : C.red }}>{trend === 'up' ? '↑' : '↓'}</span>}
          </div>
        </div>
      </div>

      {/* Description */}
      {profileLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: `1.5px solid ${C.border2}`, borderTop: `1.5px solid ${C.lime}`, animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint }}>Loading...</span>
        </div>
      ) : description ? (
        <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 13, color: C.textMuted, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {description}
        </div>
      ) : null}

      {/* Offerings pills */}
      {offerings.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {offerings.map((o) => (
            <span key={o.id} style={{
              fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.lime,
              border: `1px solid ${C.lime}33`, borderRadius: 4, padding: '2px 6px',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140,
            }}>
              {o.name}
            </span>
          ))}
          {(profile?.offerings?.length ?? 0) > 3 && (
            <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint, padding: '2px 4px' }}>
              +{profile.offerings.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer: success rate + view */}
      <div style={{ marginTop: 'auto' }}>
        {agent.successRate != null && (
          <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: agent.successRate > 90 ? C.lime : C.textMuted, marginBottom: 8 }}>
            {agent.successRate.toFixed(1)}% success
          </div>
        )}
        <div onClick={(e) => e.stopPropagation()}>
          <AgentLinks agent={agent} />
        </div>
      </div>
    </div>
  )
}

// ─── Discovery section row ────────────────────────────────────────────────────
function DiscoverSection({ title, subtitle, agents, loading, emptyMsg, onExpand, isDesktop }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <div style={{ padding: isDesktop ? '0 32px' : '0 16px', marginBottom: 14 }}>
        <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: isDesktop ? 18 : 16, color: C.textPrimary, marginBottom: 3 }}>{title}</div>
        <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textMuted }}>{subtitle}</div>
      </div>
      {loading ? (
        <div style={{ padding: isDesktop ? '20px 32px' : '20px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${C.border2}`, borderTop: `2px solid ${C.lime}`, animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.textFaint }}>Loading...</span>
        </div>
      ) : agents.length === 0 ? (
        <div style={{ padding: isDesktop ? '16px 32px' : '16px', fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textFaint }}>{emptyMsg}</div>
      ) : isDesktop ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: '4px 32px 8px' }}>
          {agents.map((agent) => (
            <MiniAgentCard key={agent.id} agent={agent} onExpand={onExpand} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 16px 8px', scrollbarWidth: 'none' }}>
          {agents.map((agent) => (
            <MiniAgentCard key={agent.id} agent={agent} onExpand={onExpand} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Discover screen ──────────────────────────────────────────────────────────
function DiscoverScreen() {
  const [recommended, setRecommended] = useState([])
  const [recQuery, setRecQuery]       = useState('')
  const [trending,    setTrending]    = useState([])
  const [newRising,   setNewRising]   = useState([])
  const [loadingRec,  setLoadingRec]  = useState(true)
  const [loadingTrend,setLoadingTrend]= useState(true)
  const [loadingNew,  setLoadingNew]  = useState(true)
  const [expandedAgent, setExpandedAgent] = useState(null)
  const isDesktop = useIsDesktop()

  // ── helpers ──
  function parseItems(res) {
    return Array.isArray(res) ? res : res.data ?? res.agents ?? res.results ?? res.items ?? []
  }
  function isTrendingUp(agent) {
    const v = agent.past7dVolume
    if (!v || v.length < 2) return true
    return v[v.length - 1].value >= v[0].value
  }

  // ── Recommended: pull from last history session's matched agents ──
  useEffect(() => {
    if (MOCK) {
      setTimeout(() => {
        setRecQuery('Automate my DeFi trades')
        setRecommended(MOCK_AGENTS.slice(0, 5))
        setLoadingRec(false)
      }, 500)
      return
    }
    const history = loadHistory()
    const last = history.find((h) => h.saved?.length > 0) ?? history[0]
    if (!last) { setLoadingRec(false); return }
    setRecQuery(last.query)
    // use saved agents from that session; supplement with all history matches up to 5
    const seen = new Set()
    const agents = []
    for (const session of history) {
      for (const a of session.saved ?? []) {
        if (!seen.has(a.id)) { seen.add(a.id); agents.push(a) }
        if (agents.length >= 5) break
      }
      if (agents.length >= 5) break
    }
    setRecommended(agents)
    setLoadingRec(false)
  }, [])

  // ── Trending: top by memoCount with positive 7d trend ──
  useEffect(() => {
    if (MOCK) {
      setTimeout(() => {
        setTrending([...MOCK_AGENTS].sort((a, b) => (b.memoCount ?? 0) - (a.memoCount ?? 0)))
        setLoadingTrend(false)
      }, 800)
      return
    }
    fetch('https://acpx.virtuals.io/api/metrics/agents?page=1&pageSize=20&sortBy=memoCount&sortOrder=desc')
      .then((r) => r.json())
      .then((data) => {
        const items = parseItems(data)
        setTrending(items.filter(isTrendingUp).slice(0, 8))
      })
      .catch(() => setTrending([]))
      .finally(() => setLoadingTrend(false))
  }, [])

  // ── New & Rising: recently created with increasing volume ──
  useEffect(() => {
    if (MOCK) {
      setTimeout(() => {
        // simulate "new" agents as the bottom of the mock list
        setNewRising([...MOCK_AGENTS].reverse())
        setLoadingNew(false)
      }, 1100)
      return
    }
    fetch('https://acpx.virtuals.io/api/agents?sort[0]=createdAt:desc&pagination[pageSize]=50')
      .then((r) => r.json())
      .then((data) => {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const items = parseItems(data)
        const recent = items
          .filter((a) => a.createdAt && new Date(a.createdAt) >= thirtyDaysAgo)
          .filter((a) => (a.metrics?.successfulJobCount ?? 0) > 0)
          .map((a) => ({
            // normalise fields from /api/agents to match metrics API shape
            id: a.id,
            name: a.name,
            profilePic: a.profilePic,
            isVirtualAgent: a.isVirtualAgent,
            virtualAgentId: a.virtualAgentId,
            successRate: a.metrics?.successRate ?? a.successRate,
            volume: a.metrics?.grossAgenticAmount ?? 0,
            grossAgenticAmount: a.metrics?.grossAgenticAmount ?? 0,
            revenue: a.metrics?.revenue,
            successfulJobCount: a.metrics?.successfulJobCount,
            uniqueBuyerCount: a.metrics?.uniqueBuyerCount,
            memoCount: null,
            lastActiveAt: a.metrics?.lastActiveAt ?? a.lastActiveAt,
            past7dVolume: null,
            tag: a.tag,
          }))
          .slice(0, 8)
        setNewRising(recent)
      })
      .catch(() => setNewRising([]))
      .finally(() => setLoadingNew(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 80, paddingTop: isDesktop ? 56 : 0 }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } ::-webkit-scrollbar { display: none; }`}</style>

      {/* Header */}
      <div style={{ padding: isDesktop ? '40px 32px 24px' : '24px 16px 16px', maxWidth: isDesktop ? 1100 : 480, margin: '0 auto' }}>
        {!isDesktop && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#0A0A0A' }}>⬡</div>
            <div>
              <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 15, color: C.textPrimary, letterSpacing: 1 }}>TRENCHES SCOUT</div>
              <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textFaint, letterSpacing: 1 }}>DISCOVER · LIVE DATA</div>
            </div>
          </div>
        )}
        <h2 style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 800, fontSize: isDesktop ? 32 : 24, color: C.textPrimary, letterSpacing: -0.5, marginBottom: 4 }}>
          Discover Agents
        </h2>
        <p style={{ fontFamily: 'system-ui,sans-serif', fontSize: 15, color: C.textMuted }}>
          Trending, new, and personalised picks from the ACP network.
        </p>
      </div>

      <div style={{ maxWidth: isDesktop ? 1100 : '100%', margin: '0 auto' }}>
      {/* Recommended */}
      <DiscoverSection
        title="Recommended for You"
        subtitle={recQuery ? `Based on: "${recQuery}"` : 'Search for something to get personalised picks'}
        agents={recommended}
        loading={loadingRec}
        emptyMsg="No history yet — run a search to get recommendations."
        onExpand={(agent) => setExpandedAgent({ agent, matchInfo: null })}
        isDesktop={isDesktop}
      />

      {/* Trending */}
      <DiscoverSection
        title="Top & Trending"
        subtitle="Highest interactions in the last 7 days with rising volume"
        agents={trending}
        loading={loadingTrend}
        emptyMsg="Could not load trending agents."
        onExpand={(agent) => setExpandedAgent({ agent, matchInfo: null })}
        isDesktop={isDesktop}
      />

      {/* New & Rising */}
      <DiscoverSection
        title="New & Rising"
        subtitle="Launched in the last 30 days with growing activity"
        agents={newRising}
        loading={loadingNew}
        emptyMsg="No new agents found in the last 30 days."
        onExpand={(agent) => setExpandedAgent({ agent, matchInfo: null })}
        isDesktop={isDesktop}
      />

      </div>

      {/* Agent detail modal */}
      {expandedAgent && (
        <AgentModal
          agent={expandedAgent.agent}
          matchInfo={expandedAgent.matchInfo}
          onClose={() => setExpandedAgent(null)}
        />
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('search') // search | loading | results | done | history | discover
  const [agents, setAgents] = useState([])
  const [matches, setMatches] = useState([])
  const [savedAgents, setSavedAgents] = useState([])
  const [currentQuery, setCurrentQuery] = useState('')
  const [error, setError] = useState(null)

  // Dismiss error on any click, keypress, or tab change
  useEffect(() => {
    if (!error) return
    const dismiss = () => setError(null)
    document.addEventListener('click', dismiss)
    document.addEventListener('keydown', dismiss)
    return () => {
      document.removeEventListener('click', dismiss)
      document.removeEventListener('keydown', dismiss)
    }
  }, [error])

  useEffect(() => { setError(null) }, [screen])

  async function fetchAgents() {
    const sortKeys = ['volume', 'revenue', 'successRate']
    const metricPages = Array.from({ length: 20 }, (_, i) => i + 1)
    const profilePages = Array.from({ length: 20 }, (_, i) => i + 1)

    // Fire metrics + rich profile fetches in parallel
    const [metricsResults, profileResults] = await Promise.all([
      Promise.allSettled(
        sortKeys.flatMap((sortBy) =>
          metricPages.map((page) =>
            fetch(
              `https://acpx.virtuals.io/api/metrics/agents?page=${page}&pageSize=30&sortBy=${sortBy}&sortOrder=desc`
            ).then((r) => {
              if (!r.ok) throw new Error(`ACP API error: ${r.status}`)
              return r.json()
            })
          )
        )
      ),
      Promise.allSettled(
        profilePages.map((page) =>
          fetch(
            `https://acpx.virtuals.io/api/agents?pagination[page]=${page}&pagination[pageSize]=100`
          ).then((r) => r.json())
        )
      ),
    ])

    // Build offerings map: id → "Offering A, Offering B, ..."
    // Falls back to jobs list if offerings array is empty, then description as last resort
    const offeringsMap = new Map()
    function extractOfferings(agent) {
      const parts = [
        ...(agent.offerings ?? []).map((o) => o.name).filter(Boolean),
        ...(agent.jobs ?? []).map((j) => j.name).filter(Boolean),
      ]
      if (parts.length) return [...new Set(parts)].join(', ')
      if (agent.description) return agent.description.slice(0, 200)
      if (agent.name) return agent.name
      return null
    }
    for (const result of profileResults) {
      if (result.status !== 'fulfilled') continue
      const items = result.value?.data ?? []
      for (const agent of items) {
        if (!agent?.id) continue
        const val = extractOfferings(agent)
        if (val) offeringsMap.set(agent.id, val)
      }
    }

    // Deduplicate metrics agents and attach offerings
    const seen = new Set()
    const all = []
    for (const result of metricsResults) {
      if (result.status !== 'fulfilled') continue
      const res = result.value
      const items = Array.isArray(res)
        ? res
        : res.data ?? res.agents ?? res.results ?? res.items ?? res.list ?? []
      for (const agent of items) {
        if (agent?.id != null && !seen.has(agent.id)) {
          seen.add(agent.id)
          if (offeringsMap.has(agent.id)) agent._offerings = offeringsMap.get(agent.id)
          all.push(agent)
        }
      }
    }

    if (all.length === 0) throw new Error('No agents returned from ACP API. The API may be down or blocking requests.')

    // Targeted fetch for any agent still missing offerings — look them up by ID
    const missingIds = all.filter((a) => !a._offerings).map((a) => a.id)
    if (missingIds.length > 0) {
      const chunks = []
      for (let i = 0; i < missingIds.length; i += 25) chunks.push(missingIds.slice(i, i + 25))
      const targeted = await Promise.allSettled(
        chunks.map((ids) =>
          fetch(
            `https://acpx.virtuals.io/api/agents?${ids.map((id) => `filters[id][$in][]=${id}`).join('&')}&pagination[pageSize]=100`
          ).then((r) => r.json())
        )
      )
      for (const result of targeted) {
        if (result.status !== 'fulfilled') continue
        const items = result.value?.data ?? []
        for (const agent of items) {
          if (!agent?.id) continue
          const val = extractOfferings(agent)
          if (val) offeringsMap.set(agent.id, val)
        }
      }
      // Attach newly fetched offerings
      for (const agent of all) {
        if (!agent._offerings && offeringsMap.has(agent.id)) {
          agent._offerings = offeringsMap.get(agent.id)
        }
      }
    }

    return all
  }

  function qualityFilter(agents) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    return agents.filter((a) =>
      ((a.revenue ?? 0) > 0 || (a.successfulJobCount ?? 0) > 0) &&
      (a.lastActiveAt == null || new Date(a.lastActiveAt) >= ninetyDaysAgo)
    )
  }

  function keywordPreFilter(agents, query) {
    const STOP = new Set(['the','a','an','i','to','for','my','that','can','and','or','is','in','on','of','with','help','need','want','me','so','get','use','make','have','do','an','be'])
    const words = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w))

    if (words.length === 0) return agents.slice(0, 200)

    const scored = agents.map((a) => {
      const text = `${a.name} ${a._offerings ?? ''}`.toLowerCase()
      const score = words.reduce((s, w) => s + (text.includes(w) ? 1 : 0), 0)
      return { a, score }
    })

    const matched = scored.filter((x) => x.score > 0).sort((x, y) => y.score - x.score)
    const result = matched.slice(0, 200).map((x) => x.a)

    // If fewer than 50 keyword matches, pad with top agents by successRate
    if (result.length < 50) {
      const usedIds = new Set(result.map((a) => a.id))
      const extras = agents
        .filter((a) => !usedIds.has(a.id))
        .sort((a, b) => (b.successRate ?? 0) - (a.successRate ?? 0))
        .slice(0, 200 - result.length)
      return [...result, ...extras]
    }
    return result
  }

  async function handleSearch(query) {
    setError(null)
    setCurrentQuery(query)
    setScreen('loading')
    try {
      if (MOCK) {
        await new Promise((r) => setTimeout(r, 1800)) // simulate loading
        setAgents(MOCK_AGENTS)
        setMatches(MOCK_MATCHES)
        setScreen('results')
        return
      }

      const allAgents = await fetchAgents()
      setAgents(allAgents)

      // 1. Quality gate — remove dead/inactive agents
      const qualified = qualityFilter(allAgents)

      // 2. Keyword pre-filter — narrow to top 200 most relevant candidates
      const candidates = keywordPreFilter(qualified, query)

      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      const summaries = candidates.map((a) => ({
        id: a.id,
        name: a.name,
        ...(a._offerings ? { offers: a._offerings } : {}),
        lastActive: a.lastActiveAt ? a.lastActiveAt.split('T')[0] : null,
        isActive: a.lastActiveAt ? new Date(a.lastActiveAt) >= ninetyDaysAgo : false,
      }))

      const res = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, agents: summaries }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Match API error: ${res.status}`)
      }

      const { matches: topMatches } = await res.json()
      setMatches(topMatches)
      setScreen('results')
    } catch (err) {
      setError(err.message)
      setScreen('search')
    }
  }

  function handleDone(saved) {
    setSavedAgents(saved)
    saveToHistory({
      id: Date.now(),
      query: currentQuery,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      saved,
    })
    setScreen('done')
  }

  function handleRestart() {
    setAgents([])
    setMatches([])
    setSavedAgents([])
    setCurrentQuery('')
    setError(null)
    setScreen('search')
  }

  const showBottomNav = screen === 'search' || screen === 'discover'
  const isDesktop = useIsDesktop()

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {error && (
        <div style={{
          position: 'fixed', top: 68, right: 20, zIndex: 999,
          background: `${C.red}18`, border: `1px solid ${C.red}55`,
          borderRadius: 10, padding: '10px 16px',
          fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.red,
          maxWidth: 320, textAlign: 'left', lineHeight: 1.5,
        }}>
          {error.includes('fetch') || error.includes('CORS') || error.includes('network')
            ? 'Could not reach ACP network. Check your connection and try again.'
            : error}
        </div>
      )}
      {screen === 'search' && <SearchScreen onSearch={handleSearch} onHistory={() => setScreen('history')} />}
      {screen === 'loading' && <LoadingScreen />}
      {screen === 'results' && (
        <ResultsScreen
          matches={matches}
          agents={agents}
          onNewSearch={handleRestart}
          onDone={handleDone}
        />
      )}
      {screen === 'done' && <DoneScreen saved={savedAgents} query={currentQuery} onRestart={handleRestart} onHistory={() => setScreen('history')} />}
      {screen === 'history' && <HistoryScreen onBack={() => setScreen('search')} />}
      {screen === 'discover' && <DiscoverScreen />}
      {showBottomNav && (
        <BottomNav
          active={screen === 'discover' ? 'discover' : 'search'}
          onChange={(tab) => setScreen(tab)}
          onHistory={() => setScreen('history')}
        />
      )}
    </div>
  )
}
