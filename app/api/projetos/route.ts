import { getDemoEditor } from "../../lib/demo-editor";
import { toProjectDto } from "../../lib/presenters";
import { prisma } from "../../lib/prisma";

export async function GET() {
  const editor = await getDemoEditor();
  const projects = await prisma.project.findMany({
    where: { editorId: editor.id },
    include: {
      client: { select: { name: true } },
      _count: { select: { changeRequests: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(projects.map(toProjectDto));
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const clientName = typeof body.client === "string" ? body.client.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";

  if (!name || !clientName) {
    return Response.json(
      { error: "Nome do projeto e cliente são obrigatórios." },
      { status: 400 },
    );
  }

  const editor = await getDemoEditor();
  const client = await prisma.client.findFirst({
    where: { editorId: editor.id, name: clientName },
    select: { id: true, name: true },
  });

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
