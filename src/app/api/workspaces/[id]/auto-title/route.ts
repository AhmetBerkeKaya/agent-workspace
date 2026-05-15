import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

// DİKKAT: params artık bir Promise olarak tanımlanıyor
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // NEXT.JS KRİTİK DÜZELTME: params'ı await ile çözüyoruz
    const { id } = await params;
    const { firstMessage } = await req.json();

    if (!firstMessage) {
      return new NextResponse("Mesaj gerekli", { status: 400 });
    }

    // Kesinlikle sadece Gemini 2.5 Flash kullanıyoruz!
    const { text } = await generateText({
      model: google("gemini-2.5-flash"),
      system: "Sen bir başlık üreticisisin. Kullanıcının ilk mesajını okuyup bu sohbete en fazla 3-4 kelimelik çok kısa, öz ve profesyonel bir başlık ver. Sadece başlığı yaz, tırnak işareti veya nokta kullanma.",
      prompt: firstMessage,
    });

    const newTitle = text.trim();

    // Çözdüğümüz 'id' değişkenini kullanarak veritabanını güncelliyoruz
    const updatedWorkspace = await prisma.workspace.update({
      where: { id: id },
      data: { name: newTitle }
    });

    return NextResponse.json({ name: newTitle });
  } catch (error) {
    console.error("Auto-title hatası:", error);
    return new NextResponse("İsimlendirme başarısız", { status: 500 });
  }
}