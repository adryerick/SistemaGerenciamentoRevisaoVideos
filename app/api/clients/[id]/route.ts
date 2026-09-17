import { withEditor } from "../../../lib/auth";
import { getDemoEditor } from "../../../lib/demo-editor";
import { toClientDto } from "../../../lib/presenters";
import { prisma } from "../../../lib/prisma";

function readClientData(body: unknown) {
  const data = body as { name?: unknown; email?: unknown };
  return {
    name: typeof data.name === "string" ? data.name.trim() : "",
    email: typeof data.email === "string" ? data.email.trim().toLowerCase() : "",
  };
}

async function handlePATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clientId = Number(id);
  const { name, email } = readClientData(await request.json());

  if (!Number.isInteger(clientId) || !name || !email) {
    return Response.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 });
  }

  const editor = await getDemoEditor();
  const client = await prisma.client.findFirst({
    where: { id: clientId, editorId: editor.id },
    select: { id: true },
  });

  if (!client) {
    return Response.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  try {
    const updatedClient = await prisma.client.update({
      where: { id: client.id },
      data: { name, email },
      include: { _count: { select: { projects: true } } },
    });
    return Response.json(toClientDto(updatedClient));
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return Response.json({ error: "Já existe um cliente com este e-mail." }, { status: 409 });
    }
    return Response.json({ error: "Não foi possível atualizar o cliente." }, { status: 500 });
  }
}

async function handleDELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clientId = Number(id);

  if (!Number.isInteger(clientId)) {
    return Response.json({ error: "Cliente inválido." }, { status: 400 });
  }

  const editor = await getDemoEditor();
  const client = await prisma.client.findFirst({
    where: { id: clientId, editorId: editor.id },
    include: { _count: { select: { projects: true } } },
  });

  if (!client) {
    return Response.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  if (client._count.projects > 0) {
    return Response.json(
      { error: "Exclua ou transfira os projetos deste cliente antes de removê-lo." },
      { status: 409 },
    );
  }

  await prisma.client.delete({ where: { id: client.id } });
  return Response.json({ success: true });
}

export const PATCH = withEditor(handlePATCH);
export const DELETE = withEditor(handleDELETE);
