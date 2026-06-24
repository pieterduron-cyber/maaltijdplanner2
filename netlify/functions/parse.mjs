const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    const { gerechten } = JSON.parse(event.body);

    const prompt = `Hier zijn de gerechten van deze week met hun ingrediëntenlijst:

${gerechten.map(g => `## ${g.naam} (${g.personen} personen)\n${g.ingredienten}`).join("\n\n")}

Verwerk deze ingrediënten tot een boodschappenlijst:
1. Haal alleen echte ingrediënten eruit — negeer titelregels zoals "4 personen:", "Voor de saus:", sectietitels
2. Splits elk ingrediënt in "product" (naam zonder hoeveelheid) en "hoeveelheid"
3. Het basisrecept is voor 4 personen. Pas hoeveelheden aan als er meer of minder personen zijn
4. Combineer duplicaten over gerechten heen (bv. 2 gerechten vragen elk 1 ui → "2 uien")
5. Geef terug als JSON array: [{product: string, hoeveelheid: string}]

Alleen de JSON array, geen uitleg, geen markdown.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || "[]";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return { statusCode: 200, headers, body: JSON.stringify(parsed) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
