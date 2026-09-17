export function publicOrigin(requestUrl: string): string {
  return new URL(process.env.APP_URL ?? process.env.RENDER_EXTERNAL_URL ?? requestUrl).origin;
}
