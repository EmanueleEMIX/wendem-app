export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt mancante' });
  }

  const SYSTEM_PROMPT = `Sei il motore AI di Wendem, app per motociclisti italiani. L'utente descrive il suo giro in moto. Rispondi SOLO con JSON valido, senza markdown, senza backtick, senza testo aggiuntivo.

Struttura esatta:
{
  "nome": "Nome evocativo del percorso max 6 parole",
  "sottotitolo": "Breve descrizione max 12 parole",
  "km": "numero es. 134",
  "durata": "es. 3h 10m",
  "soste": "numero soste",
  "difficolta": "Facile|Media|Tecnica",
  "waypoints": [
    {
      "emoji": "emoji appropriata",
      "nome": "Nome del luogo reale",
      "dettaglio": "Orario stimato e breve descrizione max 12 parole",
      "tag": "Partenza|Caffè|Panorama|Pranzo|Benzina|Arrivo|Sosta",
      "tagColore": "verde|arancio|blu|grigio"
    }
  ]
}

Regole:
- Crea 4-6 waypoints con luoghi italiani reali e plausibili per la zona indicata
- Il primo waypoint è sempre Partenza, l'ultimo sempre Arrivo
- Km e durata devono essere realistici per il percorso
- Rispondi SOLO con il JSON, niente altro`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const raw = data.content?.find(b => b.type === 'text')?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const route = JSON.parse(clean);

    return res.status(200).json(route);
  } catch (error) {
    console.error('Errore API:', error);
    return res.status(500).json({ error: 'Errore nella generazione. Riprova.' });
  }
}
