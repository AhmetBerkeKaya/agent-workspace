import express from "express";
import cors from "cors";
import axios from "axios";
import * as cheerio from "cheerio";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const app = express();
app.use(cors());

const server = new Server(
  { name: "agent-workspace-mcp", version: "4.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "scrape_web",
        description: "İnternetteki herhangi bir URL'ye gidip oradaki metinleri (makale, haber vb.) okuyup ajana getirmek için kullanılır.",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "Okunacak web sitesinin tam adresi (https://...)" },
          },
          required: ["url"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "scrape_web") {
    const { url } = request.params.arguments;
    
    console.log(`\n[📡 MCP SERVER] Ajan canlı web'e çıkıyor! Hedef: ${url}`);
    
    try {
      // 1. Web sitesine gidiyoruz
      const response = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7"
        }
      });
      
      // 2. Cheerio ile HTML'i temizleyip sadece metni alıyoruz
      const $ = cheerio.load(response.data);
      $('script, style, nav, footer, header').remove(); // Gereksiz yerleri çöpe at
      const cleanText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000); // İlk 5000 karakteri al
      
      console.log(`[✅ MCP SERVER] Veri başarıyla çekildi! (${cleanText.length} karakter)`);

      return {
        content: [{ type: "text", text: cleanText }]
      };
    } catch (error) {
      console.log(`[❌ MCP SERVER] Web çekim hatası: ${error.message}`);
      return {
        content: [{ type: "text", text: `Web sitesine ulaşılamadı. Hata: ${error.message}` }]
      };
    }
  }
  throw new Error("Bilinmeyen araç (tool)");
});

let transport;
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});
app.post("/messages", async (req, res) => {
  if (transport) await transport.handlePostMessage(req, res);
});

app.listen(8000, () => {
  console.log(`\n🚀 Web Kazıyıcı (Scraper) MCP Sunucusu 8000 portunda çalışıyor...`);
});