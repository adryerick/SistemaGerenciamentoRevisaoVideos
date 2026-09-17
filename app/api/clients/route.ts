import { withEditor } from "../../lib/auth";
import { getDemoEditor } from "../../lib/demo-editor";
import { toClientDto } from "../../lib/presenters";
import { prisma } from "../../lib/prisma";

async function handleGET() {
  const editor = await getDemoEditor();
  const clients = await prisma.client.findMany({
    where: { editorId: editor.id },
    include: { _count: { select: { projects: true } } },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(clients.map(toClientDto));
}

async function handlePOST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!name || !email) {
    return Response.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 });
  }

  const editor = await getDemoEditor();

  try {
    const client = await prisma.client.create({
      data: { name, email, editorId: editor.id },
      include: { _count: { select: { projects: true } } },
    });

    return Response.json(toClientDto(client), { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return Response.json(
        { error: "Já existe um cliente com este e-mail." },
        { status: 409 },
      );
    }

    return Response.json({ error: "Não foi possível criar o cliente." }, { status: 500 });
  }
}

export const GET = withEditor(handleGET);
export const POST = withEditor(handlePOST);
