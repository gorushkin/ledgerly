export class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
    Object.freeze(this);
  }

  static create(raw: string): Email {
    const trimmed = raw.trim().toLowerCase();

    if (!Email.isValidEmail(trimmed)) {
      throw new Error('Invalid email format');
    }

    return new Email(trimmed);
  }

  static fromPersistence(value: string): Email {
    return new Email(value);
  }

  private static isValidEmail(email: string): boolean {
    // Базовые проверки
    if (email.length === 0 || email.length > 320) {
      return false;
    }

    // Должен содержать ровно один символ @
    const atCount = (email.match(/@/g) ?? []).length;
    if (atCount !== 1) {
      return false;
    }

    const [localPart, domainPart] = email.split('@');

    // Проверка локальной части
    if (!localPart || localPart.length === 0 || localPart.length > 64) {
      return false;
    }

    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return false;
    }

    if (localPart.includes('..')) {
      return false;
    }

    // Проверка доменной части
    if (!domainPart || domainPart.length === 0 || domainPart.length > 255) {
      return false;
    }

    if (domainPart.startsWith('.') || domainPart.endsWith('.')) {
      return false;
    }

    if (domainPart.includes('..')) {
      return false;
    }

    // Должен содержать хотя бы одну точку в домене
    if (!domainPart.includes('.')) {
      return false;
    }

    // RFC 5322 compliant email regex (упрощенная версия)
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

    return emailRegex.test(email);
  }

  isEqualTo(other: Email): boolean {
    return this.value === other.value;
  }

  valueOf(): string {
    return this.value;
  }

  toPersistence(): string {
    return this.value;
  }

  toString(): string {
    return this.value;
  }
}
