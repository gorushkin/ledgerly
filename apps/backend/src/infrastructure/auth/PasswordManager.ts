import bcrypt from 'bcryptjs';

export class PasswordManager {
  private readonly rounds: number;

  constructor(rounds = 10) {
    this.rounds = rounds;
  }

  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.rounds);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  verify(hashedPassword: string): boolean {
    return hashedPassword.startsWith('$2');
  }

  async rehash(hashedPassword: string): Promise<string | null> {
    try {
      if (!this.verify(hashedPassword)) {
        return null;
      }

      const currentRounds = bcrypt.getRounds(hashedPassword);

      if (currentRounds !== this.rounds) {
        return this.hash(hashedPassword);
      }

      return hashedPassword;
    } catch {
      return null;
    }
  }
}
