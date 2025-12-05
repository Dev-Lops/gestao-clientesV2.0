/**
 * Value Object: CNPJ
 * Representa um CNPJ válido
 */

export class CNPJ {
  private readonly _value: string

  constructor(value: string) {
    const cleaned = this.clean(value)
    if (!this.isValid(cleaned)) {
      throw new Error(`CNPJ inválido: ${value}`)
    }
    this._value = cleaned
  }

  get value(): string {
    return this._value
  }

  get formatted(): string {
    return this._value.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    )
  }

  private clean(cnpj: string): string {
    return cnpj.replace(/\D/g, '')
  }

  private isValid(cnpj: string): boolean {
    if (cnpj.length !== 14) return false
    if (/^(\d)\1{13}$/.test(cnpj)) return false

    // Validação dos dígitos verificadores
    let length = cnpj.length - 2
    let numbers = cnpj.substring(0, length)
    const digits = cnpj.substring(length)
    let sum = 0
    let pos = length - 7

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--
      if (pos < 2) pos = 9
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    if (result !== parseInt(digits.charAt(0))) return false

    length = length + 1
    numbers = cnpj.substring(0, length)
    sum = 0
    pos = length - 7

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--
      if (pos < 2) pos = 9
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    return result === parseInt(digits.charAt(1))
  }

  equals(other: CNPJ): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this.formatted
  }
}
