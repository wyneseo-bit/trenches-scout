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

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' })
  }

  if (agents.length === 0) {
    return res.status(500).json({ error: 'No agents fetched from ACP API' })
  }

  const prompt = `You are a strict agent matchmaker for Virtuals Protocol's ACP (Agent Commerce Protocol).

User's need: "${query}"

Your ONLY job is to find agents whose name clearly suggests they can fulfil the user's specific need. Relevance is everything — do NOT pick an agent just because it sounds popular or has a cool name.

Rules:
- If the user needs content/social (posts, tweets, writing, X/Twitter growth) → look for agents with words like Content, Social, Tweet, Post, Write, Creator, Media, Marketing in their name. Skip DeFi/trading agents entirely.
- If the user needs DeFi/trading → look for Swap, Trade, Finance, DeFi, Yield, etc. Skip content agents.
- If an agent's name gives no clear signal of its function, skip it.
- Return fewer than 5 if fewer genuinely match — never pad with irrelevant agents.

Available agents (id + name only):
${JSON.stringify(agents)}

Return ONLY a raw JSON array, no markdown:
[{"id":84,"category":"Content","reason":"one sentence explaining exactly why this agent fits the user's need"},...]

Valid categories: DeFi, Trading, Content, Social, Analytics, Utility`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1024,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: 'You are a JSON-only API. You return only raw JSON arrays with no markdown, no code blocks, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return res.status(502).json({ error: 'OpenAI API error', detail: err })
    }

    const data = await response.json()
    const text = data.choices[0].message.content.trim()

    let matches
    try {
      const parsed = JSON.parse(text)
      matches = Array.isArray(parsed)
        ? parsed
        : parsed.matches ?? parsed.results ?? parsed.agents ?? Object.values(parsed)[0]
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*?\]/)
      if (!jsonMatch) throw new Error(`Could not parse AI response: ${text.slice(0, 200)}`)
      matches = JSON.parse(jsonMatch[0])
    }

    if (!Array.isArray(matches) || matches.length === 0) {
      throw new Error('AI returned no matches')
    }

    return res.status(200).json({ matches })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
