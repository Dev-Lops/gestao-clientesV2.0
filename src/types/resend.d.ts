declare module 'resend' {
  export interface SendEmailInput {
    from: string
    to: string | string[]
    subject?: string
    html?: string
    text?: string
  }

  export type SendEmailResponse = { id?: string } | { data?: { id?: string } | null; error?: unknown }

  export class Resend {
    constructor(apiKey: string)
    emails: {
      send(input: SendEmailInput): Promise<SendEmailResponse>
    }
  }
}
