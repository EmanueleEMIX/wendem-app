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

Cre
