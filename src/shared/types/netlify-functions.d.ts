declare module '@netlify/functions' {
  export type Handler = (event: unknown, context: unknown) => Promise<unknown>
}
