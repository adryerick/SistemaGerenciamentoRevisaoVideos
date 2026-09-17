import "dotenv/config";
import { backupData } from "../app/lib/data-backup";
backupData().then((target) => console.log(`Backup completo (banco, autenticação, vídeos e fila): ${target}`)).catch((error) => { console.error("Backup não concluído:", error.message); process.exitCode = 1; });
