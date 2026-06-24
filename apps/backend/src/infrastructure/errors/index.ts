/**
 * Public error contracts exposed by the infrastructure layer.
 *
 * Keep implementation files organized by subsystem, but import infrastructure
 * errors through this module from other layers.
 */
export * from '../db/DatabaseErrors';
export * from '../infrastructure.errors';
