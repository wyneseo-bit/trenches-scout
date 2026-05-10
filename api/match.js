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

Each agent below has a name and, where available, an "offers" field listing exactly what services it provides (this is the "What I Offer" section on its profile page). Use the offers field as the primary signal for matching — it is the ground truth of what the agent actually does.

Rules:
- Match on the "offers" field first. If an agent's offerings directly match the user's need, include it.
- If no "offers" field is present, infer from the name only — and only include it if you are confident.
- Never pick an agent whose offerings are clearly unrelated (e.g. DeFi swaps for a content request).
- When two agents match equally well on offerings, prefer the one where isActive is true or lastActive is more recent.
- Return up to 8 matches. Return fewer if fewer genuinely match — quality over quantity.

For the "reason" field you MUST:
- Name the specific offering(s) from the "offers" field that match the user's need, using the exact offering name as it appears.
- Explain in one sentence how that specific offering addresses the user's request.
- Format: "Offers '[exact offering name]' which [explains how it helps with the user's specific need]."
- If no "offers" data is available, state what the agent name suggests it can do.
- Never write a generic reason — always tie it directly back to a named offering.

Available agents:
${JSON.stringify(agents)}

Return ONLY a raw JSON array, no markdown:
[{"id":84,"category":"Content","reason":"Offers 'Tweet Scheduling' which automates posting content to X/Twitter to grow your account presence."},...]

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
