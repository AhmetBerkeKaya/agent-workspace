import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

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

    const sources = await prisma.source.findMany({
      where: { workspaceId: workspaceId },
    });

    let fileContent = "Bu çalışma alanında henüz bir kaynak yok.";
    let sourceName = "Bilinmiyor";

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

      Görevin: Kullanıcının sorularını SADECE bu metne dayanarak yanıtla.
    `;

    // Gemini 2.5 Flash ile Stream başlat
    const result = await streamText({
      model: google("gemini-2.5-flash"),
      system: systemInstruction,
      messages: messages, 
    });

    // DİKKAT: toDataStreamResponse yerine toTextStreamResponse kullanıyoruz!
    return result.toTextStreamResponse();

  } catch (error: any) {
    console.error("AI Motoru Hatası:", error);
    return new NextResponse("Sistem hatası oluştu.", { status: 500 });
  }
}