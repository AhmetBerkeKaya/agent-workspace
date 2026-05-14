import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // params artık bir Promise
) {
  const session = await getServerSession();
  if (!session?.user?.email) return new NextResponse("Yetkisiz", { status: 401 });

  // params'ı bekleyerek (await) çözüyoruz
  const { id } = await params;
  const { fileId, fileName, fileUrl, mimeType } = await req.json();

  try {
    const source = await prisma.source.create({
      data: {
        name: fileName,
        type: mimeType,
        contentUrl: fileUrl,
        // Workspace ile ilişkiyi güvenli şekilde kuruyoruz
        workspace: { connect: { id: id } }
      },
    });

    return NextResponse.json(source);
  } catch (error) {
    console.error("Kaynak kaydetme hatası:", error);
    return new NextResponse("Veritabanı hatası", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // params burada da Promise
) {
  try {
    const { id } = await params;
    
    const sources = await prisma.source.findMany({
      where: { workspaceId: id },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(sources);
  } catch (error) {
    console.error("Liste hatası:", error);
    return new NextResponse("Hata", { status: 500 });
  }
}