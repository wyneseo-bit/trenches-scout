import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  bg: '#0A0A0A',
  surface: '#111111',
  surface2: '#1A1A1A',
  border: '#222222',
  border2: '#2A2A2A',
  lime: '#C3FF50',
  textPrimary: '#FFFFFF',
  textMuted: '#888888',
  textFaint: '#444444',
  green: '#C3FF50',
  red: '#FF4444',
}

const CATEGORY_COLORS = {
  DeFi: '#C3FF50',
  Trading: '#C3FF50',
  Content: '#C3FF50',
  Social: '#C3FF50',
  Analytics: '#C3FF50',
  Utility: '#C3FF50',
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
  if (agent.virtualAgentId) return `https://app.virtuals.io/virtuals/${agent.virtualAgentId}`
  return 'https://app.virtuals.io/acp/scan/agents'
}

// ─── Sparkline ───────────────────────────────────────────────────────────────
function Sparkline({ data }) {
  if (!data || data.length < 2) return null
  const vals = data.map((d) => d.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const range = max - min || 1
  const W = 80, H = 28
  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * W
    const y = H - ((v - min) / range) * H
    return `${x},${y}`
  })
  const trending = vals[vals.length - 1] >= vals[0]
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
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

// ─── Agent Card ──────────────────────────────────────────────────────────────
function AgentCard({ agent, matchInfo, index, total, onSwipe, isTop }) {
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
    }
  }, [onSwipe])

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
        <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 800, fontSize: 28, color: C.lime, letterSpacing: 6 }}>SAVE</span>
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
        <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 800, fontSize: 28, color: C.red, letterSpacing: 6 }}>SKIP</span>
      </div>

      {/* Counter */}
      <div style={{
        position: 'absolute', top: 16, right: 20,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: C.textFaint, fontWeight: 600,
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
              <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 20, color: C.textMuted }}>
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
            <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 15, color: C.textPrimary }}>
              {agent.name}
            </span>
            {matchInfo?.category && (
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600,
                color: C.textMuted,
                border: `1px solid ${C.border2}`,
                borderRadius: 4, padding: '2px 6px', letterSpacing: 1, textTransform: 'uppercase',
              }}>
                {matchInfo.category}
              </span>
            )}
          </div>
          {matchInfo?.reason && (
            <p style={{ fontFamily: 'system-ui,sans-serif', fontSize: 12, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>
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
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: C.textFaint, fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>
              {label}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.textPrimary, fontWeight: 700 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Footer: sparkline + view button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          {agent.past7dVolume && agent.past7dVolume.length >= 2
            ? <Sparkline data={agent.past7dVolume} />
            : <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint }}>NO CHART DATA</span>
          }
        </div>
        <a
          href={agentUrl(agent)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fontWeight: 700,
            color: '#0A0A0A', background: C.lime,
            borderRadius: 6, padding: '6px 14px', textDecoration: 'none', letterSpacing: 1,
            border: 'none',
          }}
        >
          VIEW →
        </a>
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
      <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, color: C.textMuted, letterSpacing: 1 }}>
        {msgs[msgIndex]}
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Search screen ────────────────────────────────────────────────────────────
function SearchScreen({ onSearch }) {
  const [query, setQuery] = useState('')
  const chips = [
    'Automate my DeFi trades',
    'Create content for my token',
    'Analyze market signals',
    'Manage my social presence',
  ]

  const submit = () => { if (query.trim()) onSearch(query.trim()) }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: C.lime,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#0A0A0A',
            fontFamily: 'Inter,system-ui,sans-serif',
          }}>⬡</div>
          <div>
            <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 14, color: C.textPrimary, letterSpacing: 1 }}>
              TRENCHES SCOUT
            </div>
            <div style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 9, color: C.textFaint, letterSpacing: 1 }}>
              ACP EXPLORER · LIVE DATA
            </div>
          </div>
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 800, fontSize: 38,
          lineHeight: 1.1, marginBottom: 14, color: C.textPrimary, letterSpacing: -1,
        }}>
          Find your <span style={{ color: C.lime }}>perfect</span> agent
        </h1>
        <p style={{ fontFamily: 'system-ui,sans-serif', fontSize: 15, color: C.textMuted, marginBottom: 32, lineHeight: 1.65 }}>
          Describe what you need in plain English. Scout matches you with the best live ACP agents — no filters, no guessing.
        </p>

        {/* Textarea */}
        <textarea
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
          placeholder="e.g. I need an agent that automates my DeFi trades..."
          style={{
            width: '100%', background: C.surface, border: `1px solid ${query ? C.lime + 'AA' : C.border2}`,
            borderRadius: 8, padding: '14px 16px',
            fontFamily: 'system-ui,sans-serif', fontSize: 15, color: C.textPrimary,
            resize: 'none', outline: 'none', lineHeight: 1.6,
            boxShadow: query ? `0 0 0 3px ${C.lime}18` : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        />

        {/* Submit button */}
        <button
          onClick={submit}
          disabled={!query.trim()}
          style={{
            width: '100%', marginTop: 10, padding: '14px',
            background: query.trim() ? C.lime : C.surface2,
            border: 'none', borderRadius: 8, cursor: query.trim() ? 'pointer' : 'not-allowed',
            fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 14,
            color: query.trim() ? '#0A0A0A' : C.textFaint, letterSpacing: 2,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          SCOUT AGENTS
        </button>

        {/* Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => setQuery(chip)}
              style={{
                background: 'none', border: `1px solid ${C.border2}`,
                borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
                fontFamily: 'system-ui,sans-serif', fontSize: 12, color: C.textMuted,
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.lime; e.currentTarget.style.color = C.lime }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textMuted }}
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Results screen ───────────────────────────────────────────────────────────
function ResultsScreen({ matches, agents, onNewSearch, onDone }) {
  const [deck, setDeck] = useState(matches)
  const [saved, setSaved] = useState([])
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 16px' }}>
      {/* Top bar */}
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button onClick={onNewSearch} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: C.textMuted, fontWeight: 600, letterSpacing: 1,
        }}>← NEW SEARCH</button>
        <div style={{
          background: C.lime, borderRadius: 6, padding: '4px 12px',
          fontFamily: 'JetBrains Mono,monospace', fontSize: 11, color: '#0A0A0A', fontWeight: 700,
        }}>
          {saved.length} SAVED
        </div>
      </div>

      {/* Hint */}
      <p style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 10, color: C.textFaint, letterSpacing: 1, marginBottom: 20 }}>
        SWIPE RIGHT TO SAVE · LEFT TO SKIP
      </p>

      {/* Card stack */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, height: 370 }}>
        {deck.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
            <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontSize: 16, color: C.textMuted }}>No matches found</div>
            <button onClick={onNewSearch} style={{
              background: C.lime, border: 'none', borderRadius: 8, padding: '10px 20px',
              fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 13,
              color: '#0A0A0A', cursor: 'pointer', letterSpacing: 1,
            }}>TRY AGAIN</button>
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
            />
          )
        })}
      </div>

      {/* Action buttons */}
      {deck.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginTop: 32 }}>
          <button
            onClick={() => handleSwipe('left')}
            style={{
              width: 56, height: 56, borderRadius: 8,
              background: 'none', border: `1px solid ${C.border2}`,
              cursor: 'pointer', fontSize: 20, color: C.textMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.color = C.red }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border2; e.currentTarget.style.color = C.textMuted }}
          >✕</button>
          <button
            onClick={() => handleSwipe('right')}
            style={{
              width: 56, height: 56, borderRadius: 8,
              background: C.lime, border: 'none',
              cursor: 'pointer', fontSize: 20, color: '#0A0A0A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700,
            }}
          >✓</button>
        </div>
      )}
    </div>
  )
}

// ─── Done screen ──────────────────────────────────────────────────────────────
function DoneScreen({ saved, onRestart }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: C.lime,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: '#0A0A0A',
          }}>⬡</div>
          <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 14, color: C.textPrimary, letterSpacing: 1 }}>
            TRENCHES SCOUT
          </span>
        </div>

        <h2 style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 800, fontSize: 28, color: C.textPrimary, marginBottom: 8, letterSpacing: -0.5 }}>
          Your shortlist
        </h2>
        <p style={{ fontFamily: 'system-ui,sans-serif', fontSize: 14, color: C.textMuted, marginBottom: 24 }}>
          {saved.length === 0
            ? 'No agents saved this round. Try a new search!'
            : `${saved.length} agent${saved.length > 1 ? 's' : ''} saved. Ready to hire.`}
        </p>

        {/* Saved list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {saved.map((agent) => (
            <div key={agent.id} style={{
              background: C.surface, border: `1px solid ${C.border2}`,
              borderRadius: 8, padding: '14px 16px',
              display: 'flex', gap: 12, alignItems: 'center',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 6,
                border: `1px solid ${C.border2}`, background: C.surface2,
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {agent.profilePic ? (
                  <img src={agent.profilePic} alt={agent.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
                ) : (
                  <span style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 16, color: C.textMuted }}>{agent.name?.[0]}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 600, fontSize: 14, color: C.textPrimary, marginBottom: 2 }}>
                  {agent.name}
                </div>
                <div style={{ fontFamily: 'system-ui,sans-serif', fontSize: 12, color: C.textMuted, lineHeight: 1.4 }}>
                  {agent.matchInfo?.reason}
                </div>
              </div>
              <a
                href={agentUrl(agent)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'JetBrains Mono,monospace', fontSize: 10, fontWeight: 700,
                  color: '#0A0A0A', background: C.lime,
                  borderRadius: 6, padding: '6px 12px', textDecoration: 'none', flexShrink: 0,
                }}
              >
                VIEW →
              </a>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          style={{
            width: '100%', padding: '14px',
            background: C.lime,
            border: 'none', borderRadius: 8, cursor: 'pointer',
            fontFamily: 'Inter,system-ui,sans-serif', fontWeight: 700, fontSize: 14,
            color: '#0A0A0A', letterSpacing: 2,
          }}
        >
          SCOUT AGAIN
        </button>
      </div>
    </div>
  )
}

// ─── Mock data (set MOCK = true to skip all API calls during UI dev) ──────────
const MOCK = true

const MOCK_AGENTS = [
  { id: 1, name: 'Ethy AI', virtualAgentId: '19520', profilePic: null, successRate: 99.2, revenue: 572787, successfulJobCount: 1139030, uniqueBuyerCount: 7496, past7dVolume: [{ time: '2026-05-03', value: 100000 }, { time: '2026-05-04', value: 130000 }, { time: '2026-05-05', value: 120000 }, { time: '2026-05-06', value: 160000 }, { time: '2026-05-07', value: 210000 }] },
  { id: 2, name: 'Trade Executor', virtualAgentId: '20001', profilePic: null, successRate: 96.5, revenue: 320000, successfulJobCount: 450000, uniqueBuyerCount: 3200, past7dVolume: [{ time: '2026-05-03', value: 80000 }, { time: '2026-05-04', value: 75000 }, { time: '2026-05-05', value: 60000 }, { time: '2026-05-06', value: 55000 }, { time: '2026-05-07', value: 50000 }] },
  { id: 3, name: 'Luna', virtualAgentId: '18800', profilePic: null, successRate: 88.1, revenue: 95000, successfulJobCount: 210000, uniqueBuyerCount: 1800, past7dVolume: [{ time: '2026-05-03', value: 20000 }, { time: '2026-05-04', value: 22000 }, { time: '2026-05-05', value: 25000 }, { time: '2026-05-06', value: 28000 }, { time: '2026-05-07', value: 30000 }] },
  { id: 4, name: 'Director', virtualAgentId: '17500', profilePic: null, successRate: 91.4, revenue: 180000, successfulJobCount: 320000, uniqueBuyerCount: 2400, past7dVolume: null },
  { id: 5, name: 'Nox Analytics', virtualAgentId: '16200', profilePic: null, successRate: 97.8, revenue: 410000, successfulJobCount: 780000, uniqueBuyerCount: 5100, past7dVolume: [{ time: '2026-05-03', value: 60000 }, { time: '2026-05-04', value: 65000 }, { time: '2026-05-05', value: 72000 }, { time: '2026-05-06', value: 80000 }, { time: '2026-05-07', value: 95000 }] },
]

const MOCK_MATCHES = [
  { id: 1, category: 'DeFi', reason: 'Highest volume DeFi agent with 99%+ success rate and 1M+ completed jobs.' },
  { id: 2, category: 'Trading', reason: 'Specialises in automated trade execution across multiple DeFi protocols.' },
  { id: 3, category: 'Social', reason: 'Manages social presence and community engagement for token projects.' },
  { id: 4, category: 'Content', reason: 'Produces and distributes content for token launches and campaigns.' },
  { id: 5, category: 'Analytics', reason: 'Provides real-time on-chain analytics and market signal alerts.' },
]

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState('search') // search | loading | results | done
  const [agents, setAgents] = useState([])
  const [matches, setMatches] = useState([])
  const [savedAgents, setSavedAgents] = useState([])
  const [error, setError] = useState(null)

  async function fetchAgents() {
    const sortKeys = ['volume', 'revenue', 'successRate']
    const results = await Promise.allSettled(
      sortKeys.map((sortBy) =>
        fetch(
          `https://acpx.virtuals.io/api/metrics/agents?page=1&pageSize=30&sortBy=${sortBy}&sortOrder=desc`
        ).then((r) => {
          if (!r.ok) throw new Error(`ACP API error: ${r.status}`)
          return r.json()
        })
      )
    )
    const seen = new Set()
    const all = []
    for (const result of results) {
      if (result.status !== 'fulfilled') continue
      const res = result.value
      // handle various response shapes
      const items = Array.isArray(res)
        ? res
        : res.data ?? res.agents ?? res.results ?? res.items ?? res.list ?? []
      for (const agent of items) {
        if (agent?.id != null && !seen.has(agent.id)) {
          seen.add(agent.id)
          all.push(agent)
        }
      }
    }
    if (all.length === 0) throw new Error('No agents returned from ACP API. The API may be down or blocking requests.')
    return all
  }

  async function handleSearch(query) {
    setError(null)
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

      const summaries = allAgents.map((a) => ({
        id: a.id,
        name: a.name,
        successRate: a.successRate,
        revenue: a.revenue,
        jobs: a.successfulJobCount,
        buyers: a.uniqueBuyerCount,
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
    setScreen('done')
  }

  function handleRestart() {
    setAgents([])
    setMatches([])
    setSavedAgents([])
    setError(null)
    setScreen('search')
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {error && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: `${C.red}22`, border: `1px solid ${C.red}66`,
          borderRadius: 10, padding: '10px 18px', zIndex: 999,
          fontFamily: 'JetBrains Mono,monospace', fontSize: 12, color: C.red,
          maxWidth: 420, textAlign: 'center',
        }}>
          {error.includes('fetch') || error.includes('CORS') || error.includes('network')
            ? 'Could not reach ACP network. Check your connection and try again.'
            : error}
        </div>
      )}
      {screen === 'search' && <SearchScreen onSearch={handleSearch} />}
      {screen === 'loading' && <LoadingScreen />}
      {screen === 'results' && (
        <ResultsScreen
          matches={matches}
          agents={agents}
          onNewSearch={handleRestart}
          onDone={handleDone}
        />
      )}
      {screen === 'done' && <DoneScreen saved={savedAgents} onRestart={handleRestart} />}
    </div>
  )
}
