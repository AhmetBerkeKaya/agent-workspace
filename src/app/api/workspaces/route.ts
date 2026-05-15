import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Yetkisiz", { status: 401 });

  const workspaces = await prisma.workspace.findMany({
    where: { user: { email: session.user.email } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workspaces);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return new NextResponse("Yetkisiz", { status: 401 });

  const { name } = await req.json();

  try {
    const workspace = await prisma.workspace.create({
      data: {
        name,
        user: {
          // Eğer kullanıcı varsa bağlan (connect), yoksa önce yarat (create)
          connectOrCreate: {
            where: { email: session.user.email },
            create: {
              email: session.user.email,
              name: session.user.name || "Ahmet Berke",
            }
          }
        },
      },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error("Workspace oluşturma hatası:", error);
    return new NextResponse("Veritabanı hatası", { status: 500 });
  }
}