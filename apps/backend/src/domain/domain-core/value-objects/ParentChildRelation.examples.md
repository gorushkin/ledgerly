# ParentChildRelation Usage Examples

## Overview

`ParentChildRelation` is a universal value object for representing parent-child relationships between entities in the domain. It provides semantic clarity for various domain relationships with a simple, consistent API.

## Usage Examples

### User-Entity Ownership
```typescript
// User owns a Transaction
const userTransactionRelation = ParentChildRelation.create(userId, transactionId);

// Check ownership
if (userTransactionRelation.belongsToParent(currentUserId)) {
  // User owns this transaction
}

// User owns an Account
const userAccountRelation = ParentChildRelation.create(userId, accountId);
```

### Transaction-Entry Relationship
```typescript
// Transaction contains Entry
const transactionEntryRelation = ParentChildRelation.create(transactionId, entryId);

// Check if entry belongs to transaction
if (transactionEntryRelation.belongsToParent(transactionId)) {
  // Entry belongs to this transaction
}

// Get transaction ID from entry relation
const transactionId = transactionEntryRelation.getParentId();
const entryId = transactionEntryRelation.getChildId();
```

### Category-Subcategory Hierarchy
```typescript
// Category has Subcategory
const categorySubcategoryRelation = ParentChildRelation.create(categoryId, subcategoryId);
```

## Benefits

1. **Simplicity**: No generic parameters - just two IDs representing parent-child relationship
2. **Semantic Clarity**: Clear parent-child relationship semantics
3. **Reusability**: Single class handles all parent-child relationships
4. **Consistency**: Uniform API across all domain relationships
5. **No Overhead**: No complex type annotations needed

## Integration in Entities

Entities use `ParentChildRelation` directly:

```typescript
export class Transaction {
  private readonly ownership: ParentChildRelation;
  
  belongsToUser(userId: Id): boolean {
    return this.ownership.belongsToParent(userId);
  }
  
  getUserId(): Id {
    return this.ownership.getParentId();
  }
}

export class Entry {
  private readonly ownership: ParentChildRelation;
  private readonly transactionRelation: ParentChildRelation;
  
  // Methods using the relations...
}
```

This approach eliminates the need for specialized wrapper classes like `UserOwnership` or `TransactionEntryRelation`, while maintaining semantic clarity through simple, consistent API.