import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.email) return new NextResponse("Yetkisiz", { status: 401 });

  const { id } = await params;
  const { fileId, fileName, fileUrl, mimeType } = await req.json();

  try {
    const source = await prisma.source.create({
      data: {
        name: fileName,
        type: mimeType,
        contentUrl: fileUrl,
        googleId: fileId, // <-- İŞTE EKSİK OLAN KAHRAMAN SATIR BURASI
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
  { params }: { params: Promise<{ id: string }> }
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