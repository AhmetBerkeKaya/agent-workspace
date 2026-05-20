import { streamText, tool } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { z } from "zod";
import { mcpClient } from "@/lib/mcp"; // Yeni MCP Köprümüz!

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const session: any = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json({ text: "Drive erişim izni bulunamadı." }, { status: 401 });
    }

    const { messages, workspaceId } = await req.json();

    // MCP Sunucusuna (NotebookLM) sessizce bağlanıyoruz
    await mcpClient.connect(workspaceId);

    const sources = await prisma.source.findMany({
      where: { workspaceId: workspaceId },
    });

    let fileContent = "Bu çalışma alanında henüz bir kaynak yok.";
    let sourceName = "Bilinmiyor";

    // Klasik RAG: Drive'dan okuma (Mevcut sistemimiz)
    if (sources.length > 0) {
      const targetSource = sources[0];
      sourceName = targetSource.name;

      try {
        const driveRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${targetSource.googleId}/export?mimeType=text/plain`,
          { headers: { Authorization: `Bearer ${session.accessToken}` } }
        );

        if (driveRes.ok) {
          fileContent = await driveRes.text();
        } else {
          fileContent = "[Dosya içeriği Google Drive'dan okunamadı.]";
        }
      } catch (error) {
        console.error("Drive fetch hatası:", error);
      }
    }

    const systemInstruction = `
      Sen Agent Workspace asistanısın. Üst düzey ve profesyonelsin.
      Şu an incelediğin kaynak dosya: ${sourceName}
      
      --- DOSYA İÇERİĞİ BAŞLANGICI ---
      ${fileContent}
      --- DOSYA İÇERİĞİ BİTİŞİ ---

      GÖREV VE ÖNCELİK KURALLARI (ÇOK KRİTİK):
      1. Eğer kullanıcının mesajında bir internet adresi (http/https) varsa, DOSYA İÇERİĞİ BOŞ OLSA BİLE BUNA ALDIRIŞ ETME! Hiçbir mazeret üretmeden, "dosya boş" veya "sadece metne dayanmalıyım" gibi bahaneler sunmadan DERHAL "scrape_web" aracını (tool) kullan! Bu kuralı çiğnemek KESİNLİKLE YASAKTIR.
      2. Aracı tetiklerken 'url' parametresine kullanıcının verdiği tam adresi yazmayı unutma.
      3. Aracı tetiklemeden hemen önce sadece şunu yaz ve aracı çalıştır: "Belirttiğiniz web sitesine bağlanıp içeriği analiz ediyorum..."
      4. Sadece kullanıcı link VERMEDİYSE dosya içeriğine bakarak cevap üret.

      KESİN FORMAT KURALLARI:
      1. Çoktan seçmeli sorular hazırlarken şıkları (A, B, C, D vb.) ASLA yan yana yazma, alt alta liste yap.
      2. Sorular ve paragraflar arasında mutlaka çift satır boşluk bırak.
      3. Önemli kavramları kalın (**kalın**) yaz.
    `;

    // Gemini 2.5 Flash ile Stream başlat
    const result = await streamText({
      model: google("gemini-2.5-flash"),
      system: systemInstruction,
      messages: messages,
      // MAKSİMUM ADIM: Ajanın aracı kullanıp, cevabı alıp tekrar düşünmesi için gerekli!
      maxSteps: 5,

      // İŞTE SİLAH BURADA: Ajanın kullanabileceği araçlar listesi
      // ... maxSteps: 5, satırından sonrasını şöyle güncelle:
      tools: {
        scrape_web: tool({
          description: "Kullanıcı bir internet sitesi linki verdiğinde veya dış dünyadan bir web verisi okuman gerektiğinde kullanılır.",
          parameters: z.object({
            url: z.string().describe("Okunacak internet sitesinin tam adresi."),
          }),
          execute: async (args) => {
            console.log(`\n[Tool] Web Kazıyıcı Tetiklendi. Gelen Argümanlar:`, args);
            
            let targetUrl = args.url;
            
            // DEFANSİF PROGRAMLAMA: Ajan adresi almayı unutursa, biz kullanıcının mesajından zorla çekip alıyoruz!
            if (!targetUrl || targetUrl.trim() === "") {
              console.log("[SİHİR] Ajan URL'yi unuttu, kullanıcının mesajından Regex ile aranıyor...");
              
              // Kullanıcının son mesajını alıyoruz
              const lastUserMessage = messages[messages.length - 1].content;
              
              // Mesajın içindeki http veya https ile başlayan linki buluyoruz
              const urlMatch = lastUserMessage.match(/(https?:\/\/[^\s]+)/);
              
              if (urlMatch) {
                targetUrl = urlMatch[0];
                console.log("[SİHİR] URL başarıyla yakalandı:", targetUrl);
              } else {
                return "Kullanıcının mesajında geçerli bir link (http/https) bulunamadı.";
              }
            }

            try {
              // Yakaladığımız (veya ajanın verdiği) URL ile MCP sunucumuza gidiyoruz
              const mcpResponse = await mcpClient.client.callTool({
                name: "scrape_web",
                arguments: { url: targetUrl }
              });
              
              const textContent = (mcpResponse as any).content?.find((c: any) => c.type === "text")?.text || "Metin bulunamadı.";
              
              // Ajanın susmaması için net bir emirle veriyi veriyoruz:
              return "İŞTE WEB SİTESİNDEN GELEN CANLI VERİ (Lütfen bu veriyi okuyup kullanıcıya detaylıca özetle ve sessiz kalma):\n\n" + textContent;
              
            } catch (error) {
              console.error("MCP Tool Hatası:", error);
              return "Site okunamadı veya erişim engellendi.";
            }
          },
        }),
      },
    });

    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error("AI Motoru Hatası:", error);
    return new NextResponse("Sistem hatası oluştu.", { status: 500 });
  }
}