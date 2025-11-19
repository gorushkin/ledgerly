import { UUID } from '@ledgerly/shared/types';
import { UserResponseDTO } from 'src/application';
import { UserDbInsert, UserDbRow } from 'src/db/schema';

import {
  EntityIdentity,
  EntityTimestamps,
  Name,
  Email,
  Id,
  Password,
  Timestamp,
} from '../domain-core';

export class User {
  private readonly identity: EntityIdentity;
  private readonly timestamps: EntityTimestamps;
  private constructor(
    identity: EntityIdentity,
    timestamps: EntityTimestamps,
    private _email: Email,
    private _name: Name,
    private _password: Password,
  ) {
    this.identity = identity;
    this.timestamps = timestamps;
    this._name = _name;
    this._email = _email;
  }

  static create(name: Name, email: Email, password: Password): User {
    const identity = EntityIdentity.create();
    const timestamps = EntityTimestamps.create();
    return new User(identity, timestamps, email, name, password);
  }

  static fromPersistence(data: UserDbRow): User {
    const identity = EntityIdentity.create(Id.fromPersistence(data.id));

    const timestamps = EntityTimestamps.fromPersistence(
      Timestamp.restore(data.createdAt),
      Timestamp.restore(data.updatedAt),
    );

    const email = Email.create(data.email);
    const name = Name.create(data.name);
    const password = Password.fromPersistence(data.password);

    return new User(identity, timestamps, email, name, password);
  }

  toPersistence(): UserDbInsert {
    return {
      createdAt: this.timestamps.getCreatedAt().valueOf(),
      email: this._email.valueOf(),
      id: this.identity.getId().valueOf(),
      name: this._name.valueOf(),
      password: this._password.valueOf(),
      updatedAt: this.timestamps.getUpdatedAt().valueOf(),
    };
  }

  getId(): Id {
    return this.identity.getId();
  }

  get id(): UUID {
    return this.identity.getId().valueOf();
  }

  // Public getters for read access
  get email(): Email {
    return this._email;
  }

  get name(): Name {
    return this._name;
  }

  // Domain methods for controlled updates
  changeEmail(newEmail: Email): void {
    // Business logic validation could go here
    this._email = newEmail;
    this.timestamps.touch(); // Update timestamps
  }

  changeName(newName: Name): void {
    // Business logic validation could go here
    this._name = newName;
    this.timestamps.touch(); // Update timestamps
  }

  validatePassword(password: string): Promise<boolean> {
    return this._password.compare(password);
  }

  // TODO: move this method to userMapper if it needed
  toResponseDTO(): UserResponseDTO {
    return {
      email: this.email.valueOf(),
      id: this.getId().valueOf(),
      name: this.name.valueOf(),
    };
  }

  verifyOwnership(userId: UUID): boolean {
    return this.getId().valueOf() === userId;
  }

  validateUserOwnership(userId: UUID): void {
    const isUserOwner = this.getId().valueOf() === userId;

    if (!isUserOwner) {
      // TODO: Replace with proper error handling
      // throw new UnauthorizedAccessError();
      throw new Error('User ID mismatch: unauthorized access');
    }
  }
}
