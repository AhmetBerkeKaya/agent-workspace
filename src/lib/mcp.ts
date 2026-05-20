import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

// Bu sınıf, uygulamamız ile NotebookLM MCP sunucusu arasındaki tek ve resmi köprüdür.
class NotebookLMMCPClient {
  public client: Client;
  private isConnected: boolean = false;

  constructor() {
    // 1. MCP İstemcisini (Client) tanımlıyoruz
    this.client = new Client(
      {
        name: "agent-workspace-client",
        version: "4.0.0",
      },
      {
        capabilities: {
          tools: {}, // Ajanın araçları (ask_question vb.) kullanabilmesi için yetki
        },
      }
    );
  }

  // 2. NotebookLM MCP Sunucusuna Bağlantıyı Başlatan Fonksiyon
  async connect(sessionId: string) {
    if (this.isConnected) return;

    try {
      console.log(`[MCP] NotebookLM sunucusuna bağlanılıyor... (Session: ${sessionId})`);
      
      // Not: Buradaki URL, ilerleyen adımlarda ayağa kaldıracağımız yerel veya uzak 
      // NotebookLM MCP sunucusunun (python veya node ile yazılmış) adresi olacak.
      const transport = new SSEClientTransport(new URL("http://localhost:8000/sse"));
      
      await this.client.connect(transport);
      this.isConnected = true;
      console.log("[MCP] NotebookLM bağlantısı başarıyla kuruldu!");
      
    } catch (error) {
      console.error("[MCP] Bağlantı Hatası:", error);
      throw new Error("NotebookLM MCP sunucusuna ulaşılamadı.");
    }
  }

  // 3. Ajanımızın kullanacağı aracı (Tool) tetikleyen fonksiyon 
  async askQuestion(notebookId: string, query: string) {
    if (!this.isConnected) {
      throw new Error("Önce MCP bağlantısı kurulmalı!");
    }

    try {
      console.log(`[MCP] Notebook ID: ${notebookId} için soru soruluyor...`);
      const result = await this.client.callTool({
        name: "ask_question",
        arguments: {
          notebookId: notebookId, // <--- BURASI DÜZELDİ (Alt çizgi kaldırıldı)
          query: query
        }
      });
      return result;
    } catch (error) {
      console.error("[MCP] Tool Çağırma Hatası:", error);
      throw error;
    }
  }
}

// Singleton: Uygulamanın her yerinde aynı instance'ı (tek bir köprüyü) kullanacağız
export const mcpClient = new NotebookLMMCPClient();