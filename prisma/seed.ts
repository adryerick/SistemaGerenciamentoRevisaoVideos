import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
const prisma = new PrismaClient({ adapter });

const clients = [
  { name: "Cliente Demo", email: "cliente@demo.com", status: "Ativo" },
  { name: "Studio X", email: "contato@studiox.com", status: "Ativo" },
  { name: "Marca Alpha", email: "marketing@alpha.com", status: "Concluído" },
];

const projects = [
  { name: "VSL — Curso Motion", clientEmail: "cliente@demo.com", currentVersion: "03", status: "Em revisão", progress: 72, description: "Projeto de VSL para curso de motion design." },
  { name: "Reel — Lançamento", clientEmail: "contato@studiox.com", currentVersion: "02", status: "Pendente", progress: 44, description: "Reel para campanha de lançamento." },
  { name: "Ad — Produto", clientEmail: "marketing@alpha.com", currentVersion: "05", status: "Resolvido", progress: 100, description: "Criativo para campanha de produto." },
  { name: "Institucional 2026", clientEmail: "cliente@demo.com", currentVersion: "01", status: "Aguardando cliente", progress: 88, description: "Vídeo institucional da empresa." },
  { name: "VSL — Black Friday", clientEmail: "contato@studiox.com", currentVersion: "04", status: "Em revisão", progress: 61, description: "VSL promocional de Black Friday." },
  { name: "Social Ads — Q4", clientEmail: "marketing@alpha.com", currentVersion: "02", status: "Pendente", progress: 33, description: "Pacote de anúncios para redes sociais." },
];

async function main() {
  const editor = await prisma.editor.upsert({
    where: { email: "adryerick@videoreview.local" },
    update: { name: "Adryerick" },
    create: { name: "Adryerick", email: "adryerick@videoreview.local" },
  });

  for (const clientData of clients) {
    await prisma.client.upsert({
      where: { editorId_email: { editorId: editor.id, email: clientData.email } },
      update: { name: clientData.name, status: clientData.status },
      create: { ...clientData, editorId: editor.id },
    });
  }

  for (const projectData of projects) {
    const client = await prisma.client.findUniqueOrThrow({
      where: { editorId_email: { editorId: editor.id, email: projectData.clientEmail } },
    });
    const project = {
      name: projectData.name,
      currentVersion: projectData.currentVersion,
      status: projectData.status,
      progress: projectData.progress,
      description: projectData.description,
    };
    const existingProject = await prisma.project.findFirst({
      where: { editorId: editor.id, name: project.name },
    });

    if (existingProject) {
      await prisma.project.update({ where: { id: existingProject.id }, data: project });
    } else {
      await prisma.project.create({
        data: { ...project, editorId: editor.id, clientId: client.id },
      });
    }
  }

  const persistedProjects = await prisma.project.findMany({
    where: { editorId: editor.id },
    include: { client: true },
  });

  for (const project of persistedProjects) {
    const versionNumber = Number(project.currentVersion);
    const fileName = `${project.name.toLowerCase().replaceAll(" ", "-")}-v${project.currentVersion}.mp4`;
    const videoVersion = await prisma.videoVersion.upsert({
      where: { projectId_number: { projectId: project.id, number: versionNumber } },
      update: { fileName },
      create: { projectId: project.id, number: versionNumber, fileName },
    });

    if (project.name === "VSL — Curso Motion") {
      const requests = [
        { comment: "Trocar o texto da oferta.", timestamp: "00:23", status: "Em andamento" },
        { comment: "Ajustar a velocidade da transição inicial.", timestamp: "00:41", status: "Pendente" },
      ];

      for (const request of requests) {
        const existingRequest = await prisma.changeRequest.findFirst({
          where: { projectId: project.id, comment: request.comment },
        });

        if (!existingRequest) {
          await prisma.changeRequest.create({
            data: {
              ...request,
              projectId: project.id,
              videoVersionId: videoVersion.id,
              clientId: project.clientId,
            },
          });
        }
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
