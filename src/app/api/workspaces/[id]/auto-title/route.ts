import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { firstMessage } = await req.json();

    if (!firstMessage) {
      return new NextResponse("Mesaj gerekli", { status: 400 });
    }

    // Gemini API çağrısını (generateText) KOTAYI YEMEMESİ İÇİN ŞİMDİLİK İPTAL ETTİK.
    // Bunun yerine ilk mesajın ilk 20 karakterini başlık yapıyoruz.
    const newTitle = firstMessage.substring(0, 20) + "...";

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