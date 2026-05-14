import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

// Tüm Workspace'leri listele
export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.email) return new NextResponse("Yetkisiz", { status: 401 });

  const workspaces = await prisma.workspace.findMany({
    where: { user: { email: session.user.email } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workspaces);
}

// Yeni Workspace oluştur
export async function POST(req: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) return new NextResponse("Yetkisiz", { status: 401 });

  const { name } = await req.json();

  const workspace = await prisma.workspace.create({
    data: {
      name,
      user: { connect: { email: session.user.email } },
    },
  });

  return NextResponse.json(workspace);
}