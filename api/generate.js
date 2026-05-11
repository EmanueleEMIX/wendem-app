export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let prompt = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    prompt = body?.prompt || '';
  } catch (e) {
    return res.status(400).json({ error: 'Richiesta non valida' });
  }

  if (!prompt) return res.status(400).json({ error: 'Prompt mancante' });

  const SYSTEM_PROMPT = `Sei il motore AI di Wendem, app per motociclisti italiani. Rispondi SOLO con JSON valido, senza markdown, senza backtick, senza testo aggiuntivo.

Struttura:
{"nome":"max 6 parole","sottotitolo":"max 12 parole","km":"numero","durata":"es. 3h 10m","soste":"numero","difficolta":"Facile|Media|Tecnica","waypoints":[{"emoji":"emoji","nome":"luogo reale","dettaglio":"orario e descrizione max 12 parole","tag":"Partenza|Caffe|Panorama|Pranzo|Benzina|Arrivo|Sosta","tagColore":"verde|arancio|blu|grigio"}]}

Crea 4-6 waypoints con luoghi italiani reali. Primo=Partenza, ultimo=Arrivo. SOLO JSON.`;

  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error('Anthropic error:', errText);
      return res.status(500).json({ error: 'Errore API: ' + apiResponse.status });
    }

    const data = await apiResponse.json();
    const raw = data?.content?.find(b => b.type === 'text')?.text || '';
    if (!raw) return res.status(500).json({ error: 'Risposta vuota' });

    const clean = raw.replace(/```json|```/g, '').trim();
    const route = JSON.parse(clean);
    return res.status(200).json(route);

  } catch (error) {
    console.error('Errore:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
