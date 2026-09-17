import { withEditor } from "../../lib/auth";
import { getDemoEditor } from "../../lib/demo-editor";
import { toProjectDto } from "../../lib/presenters";
import { prisma } from "../../lib/prisma";

async function handleGET() {
  const editor = await getDemoEditor();
  const projects = await prisma.project.findMany({
    where: { editorId: editor.id },
    include: {
      client: { select: { name: true } },
      _count: { select: { changeRequests: true } },
      changeRequests: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(projects.map(toProjectDto));
}

async function handlePOST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Dados do projeto inválidos." }, { status: 400 });
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const clientName = typeof body.client === "string" ? body.client.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  const clientId = body.clientId;
  if (!name || name.length > 120 || description.length > 2000) {
    return Response.json(
      { error: "Informe um nome de até 120 caracteres e descrição de até 2.000 caracteres." },
      { status: 400 },
    );
  }
  if (clientId !== undefined ? !Number.isSafeInteger(clientId) || clientId <= 0 : !clientName) return Response.json({ error: "Selecione um cliente cadastrado." }, { status: 400 });

  const editor = await getDemoEditor();
  const matches = await prisma.client.findMany({
    where: { editorId: editor.id, ...(clientId !== undefined ? { id: clientId } : { name: clientName }) },
    select: { id: true, name: true },
    take: 2,
  });
  if (matches.length > 1) return Response.json({ error: "Há clientes com o mesmo nome. Atualize a página e selecione pelo cadastro." }, { status: 409 });
  const client = matches[0];

  if (!client) {
    return Response.json({ error: "Cliente não encontrado." }, { status: 404 });
  }

  const project = await prisma.project.create({
    data: {
      name,
      description: description || null,
      editorId: editor.id,
      clientId: client.id,
    },
    include: {
      client: { select: { name: true } },
      _count: { select: { changeRequests: true } },
    },
  });

  return Response.json(toProjectDto(project), { status: 201 });
}

export const GET = withEditor(handleGET);
export const POST = withEditor(handlePOST);
