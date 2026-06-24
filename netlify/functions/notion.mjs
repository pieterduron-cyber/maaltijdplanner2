const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_VERSION = "2022-06-28";

async function notionRequest(path, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      "Authorization": `Bearer ${NOTION_TOKEN}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.notion.com/v1${path}`, opts);
  return res.json();
}

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };

  try {
    const { action, payload } = JSON.parse(event.body || "{}");

    // ── Debug ──
    if (action === "debug") {
      const tokenPreview = NOTION_TOKEN ? NOTION_TOKEN.slice(0,10) + "..." : "MISSING";
      const data = await notionRequest("/users/me");
      return { statusCode: 200, headers, body: JSON.stringify({ tokenPreview, notionResponse: data }) };
    }

    // ── Gerechten ophalen ──
    if (action === "getGerechten") {
      const dbId = "0f430c9c19544cb5b9e796ecdcbba65e";
      let results = [], cursor = undefined, hasMore = true;
      while (hasMore) {
        const body = { page_size: 100, sorts: [{ property: "Naam", direction: "ascending" }] };
        if (cursor) body.start_cursor = cursor;
        const data = await notionRequest(`/databases/${dbId}/query`, "POST", body);
        if (data.object === "error") return { statusCode: 200, headers, body: JSON.stringify({ error: data.message, code: data.code }) };
        results = results.concat(data.results || []);
        hasMore = data.has_more;
        cursor = data.next_cursor;
      }
      const gerechten = results.map(p => ({
        id: p.id,
        naam: p.properties?.Naam?.title?.[0]?.plain_text || "",
        categorie: p.properties?.Categorie?.select?.name || "",
        kooktijd: p.properties?.Kooktijd?.select?.name || "",
        ingredienten: p.properties?.Ingredienten?.rich_text?.map(r => r.plain_text).join("") || "",
      })).filter(g => g.naam);
      return { statusCode: 200, headers, body: JSON.stringify(gerechten) };
    }

    // ── Dagmenu ophalen ──
    if (action === "getDagmenu") {
      const dbId = "3ad6b3be60314267950a1540a90991c9";
      const { week } = payload;
      const data = await notionRequest(`/databases/${dbId}/query`, "POST", {
        page_size: 100,
        filter: { property: "Week", rich_text: { equals: week } }
      });
      if (data.object === "error") return { statusCode: 200, headers, body: JSON.stringify({ error: data.message }) };
      const result = {};
      for (const p of data.results || []) {
        const dag = p.properties?.Datum?.title?.[0]?.plain_text || "";
        const gerecht = p.properties?.Gerecht?.rich_text?.map(r => r.plain_text).join("") || "";
        const notities = p.properties?.Notities?.rich_text?.map(r => r.plain_text).join("") || "";
        const personen = parseInt(notities) || 4;
        if (dag) {
          if (!result[dag]) result[dag] = [];
          result[dag].push({ id: p.id, gerecht, personen });
        }
      }
      return { statusCode: 200, headers, body: JSON.stringify(result) };
    }

    // ── Dagmenu item toevoegen ──
    if (action === "addDagmenu") {
      const { dag, gerecht, week, personen } = payload;
      const data = await notionRequest("/pages", "POST", {
        parent: { database_id: "3ad6b3be60314267950a1540a90991c9" },
        properties: {
          Datum: { title: [{ text: { content: dag } }] },
          Gerecht: { rich_text: [{ text: { content: gerecht } }] },
          Week: { rich_text: [{ text: { content: week } }] },
          Status: { select: { name: "Gepland" } },
          Notities: { rich_text: [{ text: { content: `${personen} personen` } }] },
        }
      });
      return { statusCode: 200, headers, body: JSON.stringify({ success: !data.object?.includes("error"), id: data.id }) };
    }

    // ── Dagmenu item verwijderen ──
    if (action === "deleteDagmenu") {
      const { id } = payload;
      await notionRequest(`/pages/${id}`, "PATCH", { archived: true });
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ── Shopping ophalen — geen weekfilter ──
    if (action === "getShopping") {
      const dbId = "79ca6249b21e43af8bee9b70c2227070";
      let results = [], cursor = undefined, hasMore = true;
      while (hasMore) {
        const body = { page_size: 100 };
        if (cursor) body.start_cursor = cursor;
        const data = await notionRequest(`/databases/${dbId}/query`, "POST", body);
        if (data.object === "error") return { statusCode: 200, headers, body: JSON.stringify({ error: data.message }) };
        results = results.concat(data.results || []);
        hasMore = data.has_more;
        cursor = data.next_cursor;
      }
      const items = results.map((p, i) => ({
        id: p.id,
        product: p.properties?.Product?.title?.[0]?.plain_text || "",
        hoeveelheid: p.properties?.Hoeveelheid?.rich_text?.map(r => r.plain_text).join("") || "",
        volgorde: i,
      })).filter(i => i.product).sort((a, b) => a.volgorde - b.volgorde);
      return { statusCode: 200, headers, body: JSON.stringify(items) };
    }

    // ── Shopping item toevoegen — geen week ──
    if (action === "addShopping") {
      const { product, hoeveelheid, volgorde } = payload;
      const data = await notionRequest("/pages", "POST", {
        parent: { database_id: "79ca6249b21e43af8bee9b70c2227070" },
        properties: {
          Product: { title: [{ text: { content: product } }] },
          Hoeveelheid: { rich_text: [{ text: { content: hoeveelheid || "" } }] },
        }
      });
      return { statusCode: 200, headers, body: JSON.stringify({ success: data.object !== "error", id: data.id, error: data.message }) };
    }

    // ── Shopping item verwijderen ──
    if (action === "deleteShopping") {
      const { id } = payload;
      await notionRequest(`/pages/${id}`, "PATCH", { archived: true });
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ── Shopping volgorde opslaan ──
    if (action === "updateVolgorde") {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // ── Bereidingsstappen ophalen ──
    if (action === "getBereidingsstappen") {
      const { id } = payload;
      const data = await notionRequest(`/blocks/${id}/children?page_size=100`);
      if (data.object === "error") return { statusCode: 200, headers, body: JSON.stringify({ error: data.message }) };
      const tekst = (data.results || []).map(block => {
        const type = block.type;
        const richText = block[type]?.rich_text || [];
        const text = richText.map(r => r.plain_text).join("");
        if (!text) return "";
        if (type === "numbered_list_item") return `${text}`;
        if (type === "bulleted_list_item") return `- ${text}`;
        if (type === "heading_1" || type === "heading_2" || type === "heading_3") return `\n**${text}**`;
        return text;
      }).filter(Boolean).join("\n");
      return { statusCode: 200, headers, body: JSON.stringify({ tekst }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
