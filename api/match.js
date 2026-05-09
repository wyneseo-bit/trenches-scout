// Vercel serverless function
// POST /api/match
// Body: { query: string, agents: array }
// Returns: { matches: array }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query, agents } = req.body

  if (!query || !agents) {
    return res.status(400).json({ error: 'Missing query or agents' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' })
  }

  const prompt = `You are an AI agent matchmaker for Virtuals Protocol's ACP (Agent Commerce Protocol).

User wants: "${query}"

Agents (infer function from name + metrics. e.g. "Trade Execution"=DeFi, "Luna"=entertainment, "Director"=content, "Nox"=utility):
${JSON.stringify(agents)}

Return the 5 best matches. ONLY valid JSON array, no markdown:
[{"id":number,"category":"DeFi|Content|Analytics|Social|Utility|Trading","reason":"one sentence why this matches the user need"}]`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(502).json({ error: 'Anthropic API error', detail: err })
    }

    const data = await response.json()
    const text = data.content[0].text.trim()

    let matches
    try {
      matches = JSON.parse(text)
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('No JSON array found in response')
      matches = JSON.parse(jsonMatch[0])
    }

    return res.status(200).json({ matches })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
