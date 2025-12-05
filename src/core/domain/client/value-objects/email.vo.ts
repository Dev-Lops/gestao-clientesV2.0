/**
 * Value Object: Email
 * Representa um endereço de email válido
 */

export class Email {
  private readonly _value: string

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Email inválido: ${value}`)
    }
    this._value = value.toLowerCase().trim()
  }

  get value(): string {
    return this._value
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  equals(other: Email): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }
}
