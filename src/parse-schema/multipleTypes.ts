import type { M } from "ts-algebra";

import type { JSONSchema, JSONSchemaType } from "~/definitions";

import type { ParseSchema, ParseSchemaOptions } from "./index";

/**
 * JSON schemas of type unions
 * @example
 * const typeUnionSchema = {
 *  type: ["number", "string"]
 * }
 */
export type MultipleTypesSchema = JSONSchema &
  Readonly<{ type: readonly JSONSchemaType[] }>;

/**
 * Recursively parses a multiple type JSON schema to a meta-type.
 *
 * Check the [ts-algebra documentation](https://github.com/ThomasAribart/ts-algebra) for more informations on how meta-types work.
 * @param MULTI_TYPE_SCHEMA JSONSchema (single type)
 * @param OPTIONS Parsing options
 * @returns Meta-type
 */
export type ParseMultipleTypesSchema<
  MULTI_TYPE_SCHEMA extends MultipleTypesSchema,
  OPTIONS extends ParseSchemaOptions,
  // Pre-compute schema without type once
  ROOT_WITHOUT_TYPE = Omit<MULTI_TYPE_SCHEMA, "type">,
> = M.$Union<
  RecurseOnMixedSchema<MULTI_TYPE_SCHEMA["type"], ROOT_WITHOUT_TYPE, OPTIONS>
>;

/**
 * Recursively parses a multiple type JSON schema to the union of its types (merged with root schema).
 * @param TYPES JSONSchemaType[]
 * @param ROOT_WITHOUT_TYPE Root JSONSchema without type key
 * @param OPTIONS Parsing options
 * @param RESULT Accumulated result
 * @returns Meta-type
 */
type RecurseOnMixedSchema<
  TYPES extends readonly JSONSchemaType[],
  ROOT_WITHOUT_TYPE,
  OPTIONS extends ParseSchemaOptions,
  RESULT = never,
> = TYPES extends readonly [
  infer TYPES_HEAD extends JSONSchemaType,
  ...infer TYPES_TAIL extends readonly JSONSchemaType[],
]
  ? RecurseOnMixedSchema<
      TYPES_TAIL,
      ROOT_WITHOUT_TYPE,
      OPTIONS,
      RESULT | ParseSchema<ROOT_WITHOUT_TYPE & { type: TYPES_HEAD }, OPTIONS>
    >
  : RESULT;
