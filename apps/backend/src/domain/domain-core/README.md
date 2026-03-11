# Domain Core Architecture

This folder contains the core building blocks for domain entities, organized according to Domain-Driven Design (DDD) principles.

## Structure

### 📁 `behaviors/`
Behavioral components for composition in domain entities. Each component encapsulates specific behavior and can be reused across different entities.

- **`EntityIdentity`** - manages entity identity (ID)
- **`EntityTimestamps`** - manages timestamps (createdAt, updatedAt)
- **`SoftDelete`** - manages soft deletion (isTombstone)

### 📁 `value-objects/`
Value Objects - immutable objects that are described by their attributes, not by identity.

- **`Id`** - unique identifier
- **`Timestamp`** - timestamp
- **`Amount`** - monetary amount
- **`Money`** - money with currency
- **`Currency`** - currency
- **`DateValue`** - date value
- **`Name`** - name/title
- **`Email`** - email address with validation
- **`Password`** - hashed password wrapper
- **`ParentChildRelation`** - parent-child relationship between entities (e.g. user → account)

## Usage Principles

### ✅ Composition over Inheritance

```typescript
// ❌ Old approach (inheritance)
class Account extends BaseEntity {
  // Tight coupling with BaseEntity
}

// ✅ New approach (composition)
class Account {
  private readonly identity: EntityIdentity;
  private readonly timestamps: EntityTimestamps;
  private readonly softDelete: SoftDelete;
  private readonly ownership: ParentChildRelation;
  
  // Explicit method delegation
  getId(): Id {
    return this.identity.getId();
  }
}
```

### 🎯 Benefits

1. **Flexibility** - can combine any behaviors
2. **Reusability** - behaviors can be used across different entities
3. **Testability** - each component is tested in isolation
4. **Clarity** - explicitly shows what capabilities an entity has
5. **Extensibility** - easy to add new behaviors

### 💎 Value Objects Principles

1. **Immutability** - cannot be changed after creation
2. **Equality by value** - compared by content, not by reference
3. **No identity** - do not have unique ID
4. **Validation at creation** - invariants are checked at creation time
5. **Replacement instead of modification** - create new object for "changes"

```typescript
// ✅ Correct Value Objects usage
class User {
  constructor(private email: Email) {}
  
  // Email replacement creates new object
  changeEmail(newEmailString: string): void {
    this.email = Email.create(newEmailString); // Create new Email
  }
}

// ❌ Wrong - attempt to modify Value Object
// email.value = 'new@email.com'; // Error! Value Object is immutable
```

### 📋 Usage Examples

#### Behavior Composition in Entities

```typescript
// Create entity with full set of behaviors
class Account {
  constructor(
    private identity: EntityIdentity,      // ID management
    private timestamps: EntityTimestamps,  // Timestamps
    private softDelete: SoftDelete,        // Soft deletion
    private ownership: ParentChildRelation, // User ownership
  ) {}
  
  static create(userId: Id, name: string): Account {
    const identity = EntityIdentity.create();
    return new Account(
      identity,
      EntityTimestamps.create(),
      SoftDelete.create(),
      ParentChildRelation.create(userId, identity.getId()),
    );
  }
}

// Simple entity with ID only (no timestamps and deletion)
class SimpleEntity {
  constructor(private identity: EntityIdentity) {}
  
  getId(): Id {
    return this.identity.getId();
  }
}
```

#### Value Objects Usage

```typescript
// Email with automatic validation
const email = Email.create('user@example.com');  // Validates
console.log(email.toString()); // 'user@example.com'

// Name with whitespace trimming
const name = Name.create('  John Doe  ');
console.log(name.valueOf()); // 'John Doe'

// Amount for monetary operations
const amount = Amount.create('100.50');
const currency = Currency.create('USD');

// Value Objects comparison
const email1 = Email.create('TEST@example.com');
const email2 = Email.create('test@example.com');
console.log(email1.isEqualTo(email2)); // true (lowercase normalization)
```

#### Usage in User Entity

```typescript
class User {
  constructor(
    private identity: EntityIdentity,
    private timestamps: EntityTimestamps,
    private email: Email,           // Value Object
    private name: Name,            // Value Object
  ) {}
  
  static create(email: string, name: string): User {
    return new User(
      EntityIdentity.create(),
      EntityTimestamps.create(),
      Email.create(email),    // Automatic validation
      Name.create(name),      // Automatic trimming
    );
  }
  
  changeEmail(newEmail: string): void {
    this.email = Email.create(newEmail); // Validation on change
    this.timestamps.touch();
  }
}
```

## 📋 Usage Guidelines

### ✅ Do:

1. **Use composition** instead of inheriting from `BaseEntity`
2. **Create Value Objects** for primitives with business rules (email, money, etc.)
3. **Validate at creation time** - don't allow invalid states
4. **Follow YAGNI principle** - don't add methods "just in case"
5. **Test each component in isolation**

### ❌ Don't:

1. **Don't inherit from `BaseEntity`** - it's marked as deprecated
2. **Don't modify Value Objects** after creation
3. **Don't add methods without real need**
4. **Don't make Value Objects with identity** (ID)
5. **Don't skip validation** when creating Value Objects

### 🔄 Migration from Inheritance to Composition:

```typescript
// Before (inheritance)
class Account extends BaseEntity {
  constructor(public userId: Id, private name: string) {
    super(Id.create(), Timestamp.create(), Timestamp.create());
  }
}

// After (composition)
class Account {
  constructor(
    private identity: EntityIdentity,
    private timestamps: EntityTimestamps,
    private softDelete: SoftDelete,
    private ownership: ParentChildRelation,
    private name: Name,
  ) {}
  
  // Method delegation
  getId(): Id { return this.identity.getId(); }
  markAsDeleted(): void { this.softDelete.markAsDeleted(); }
  belongsToUser(userId: Id): boolean { return this.ownership.belongsToParent(userId); }
}
```