import { prisma } from "./prisma";

export async function getDemoEditor() {
  return prisma.editor.upsert({
    where: { email: "adryerick@videoreview.local" },
    update: { name: "Adryerick" },
    create: { name: "Adryerick", email: "adryerick@videoreview.local" },
  });
}
