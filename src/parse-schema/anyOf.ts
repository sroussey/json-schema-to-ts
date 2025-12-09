import type { M } from "ts-algebra";

import type { JSONSchema } from "~/definitions";

import type { ParseSchema, ParseSchemaOptions } from "./index";
import type { MergeSubSchema } from "./utils";

/**
 * JSON schemas of JSON schema unions
 * @example
 * const unionSchema = {
 *  anyOf: [
 *    { type: "number" },
 *    { type: "string" }
 *  ]
 * }
 */
export type AnyOfSchema = JSONSchema &
  Readonly<{ anyOf: readonly JSONSchema[] }>;

/**
 * Recursively parses a JSON schema union to a meta-type.
 *
 * Check the [ts-algebra documentation](https://github.com/ThomasAribart/ts-algebra) for more informations on how meta-types work.
 * @param ANY_OF_SCHEMA JSONSchema (schema union)
 * @param OPTIONS Parsing options
 * @returns Meta-type
 */
export type ParseAnyOfSchema<
  ANY_OF_SCHEMA extends AnyOfSchema,
  OPTIONS extends ParseSchemaOptions,
  // Pre-compute the root schema parse once, reuse in recursion
  ROOT_WITHOUT_ANYOF extends JSONSchema = Omit<ANY_OF_SCHEMA, "anyOf">,
  PARSED_ROOT = ParseSchema<ROOT_WITHOUT_ANYOF, OPTIONS>,
> = M.$Union<
  RecurseOnAnyOfSchema<
    ANY_OF_SCHEMA["anyOf"],
    ROOT_WITHOUT_ANYOF,
    OPTIONS,
    PARSED_ROOT
  >
>;

/**
 * Recursively parses a tuple of JSON schemas to the union of its parsed meta-types (merged with root schema).
 * @param SUB_SCHEMAS JSONSchema[]
 * @param ROOT_WITHOUT_ANYOF Root JSONSchema without anyOf key
 * @param OPTIONS Parsing options
 * @param PARSED_ROOT Pre-computed parsed root schema (hoisted for performance)
 * @param RESULT Accumulated result
 * @returns Meta-type
 */
type RecurseOnAnyOfSchema<
  SUB_SCHEMAS extends readonly JSONSchema[],
  ROOT_WITHOUT_ANYOF extends JSONSchema,
  OPTIONS extends ParseSchemaOptions,
  PARSED_ROOT,
  RESULT = never,
> = SUB_SCHEMAS extends readonly [
  infer SUB_SCHEMAS_HEAD extends JSONSchema,
  ...infer SUB_SCHEMAS_TAIL extends readonly JSONSchema[],
]
  ? RecurseOnAnyOfSchema<
      SUB_SCHEMAS_TAIL,
      ROOT_WITHOUT_ANYOF,
      OPTIONS,
      PARSED_ROOT,
      | RESULT
      | M.$Intersect<
          PARSED_ROOT,
          ParseSchema<
            MergeSubSchema<ROOT_WITHOUT_ANYOF, SUB_SCHEMAS_HEAD>,
            OPTIONS
          >
        >
    >
  : RESULT;
