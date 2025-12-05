/**
 * Money Value Object
 * Representa valores monetários com validações
 */

export class Money {
  private readonly _amount: number
  private readonly _currency: string

  constructor(amount: number, currency: string = 'BRL') {
    if (amount < 0) {
      throw new Error('Valor monetário não pode ser negativo')
    }

    if (!currency || currency.length !== 3) {
      throw new Error('Moeda deve ter 3 caracteres (ex: BRL, USD)')
    }

    this._amount = Number(amount.toFixed(2))
    this._currency = currency.toUpperCase()
  }

  get amount(): number {
    return this._amount
  }

  get currency(): string {
    return this._currency
  }

  /**
   * Adiciona um valor monetário
   */
  add(other: Money): Money {
    this.validateSameCurrency(other)
    return new Money(this._amount + other._amount, this._currency)
  }

  /**
   * Subtrai um valor monetário
   */
  subtract(other: Money): Money {
    this.validateSameCurrency(other)
    const result = this._amount - other._amount
    if (result < 0) {
      throw new Error('Resultado da subtração não pode ser negativo')
    }
    return new Money(result, this._currency)
  }

  /**
   * Multiplica por um fator
   */
  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Fator não pode ser negativo')
    }
    return new Money(this._amount * factor, this._currency)
  }

  /**
   * Calcula percentual
   */
  percentage(percent: number): Money {
    if (percent < 0 || percent > 100) {
      throw new Error('Percentual deve estar entre 0 e 100')
    }
    return new Money((this._amount * percent) / 100, this._currency)
  }

  /**
   * Verifica se é maior que outro valor
   */
  isGreaterThan(other: Money): boolean {
    this.validateSameCurrency(other)
    return this._amount > other._amount
  }

  /**
   * Verifica se é menor que outro valor
   */
  isLessThan(other: Money): boolean {
    this.validateSameCurrency(other)
    return this._amount < other._amount
  }

  /**
   * Verifica se é igual a outro valor
   */
  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency
  }

  /**
   * Verifica se é zero
   */
  isZero(): boolean {
    return this._amount === 0
  }

  /**
   * Valida se é da mesma moeda
   */
  private validateSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(
        `Moedas incompatíveis: ${this._currency} e ${other._currency}`
      )
    }
  }

  /**
   * Formata para exibição
   */
  format(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: this._currency,
    }).format(this._amount)
  }

  /**
   * Retorna valor como número
   */
  toNumber(): number {
    return this._amount
  }

  /**
   * Serializa para JSON
   */
  toJSON() {
    return {
      amount: this._amount,
      currency: this._currency,
    }
  }

  /**
   * Cria a partir de JSON
   */
  static fromJSON(data: { amount: number; currency: string }): Money {
    return new Money(data.amount, data.currency)
  }
}
