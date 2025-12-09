import type { M } from "ts-algebra";

import type { JSONSchema } from "~/definitions";

import type { ParseSchema, ParseSchemaOptions } from "./index";
import type { MergeSubSchema } from "./utils";

/**
 * JSON schemas of exclusive JSON schema unions
 * @example
 * const exclusiveUnionSchema = {
 *  oneOf: [
 *    { type: "number" },
 *    { enum: [1, 2, "foo"] } // => 1 & 2 are not valid
 *  ]
 * }
 */
export type OneOfSchema = JSONSchema &
  Readonly<{ oneOf: readonly JSONSchema[] }>;

/**
 * Recursively parses an exclusive JSON schema union to a meta-type.
 *
 * Check the [ts-algebra documentation](https://github.com/ThomasAribart/ts-algebra) for more informations on how meta-types work.
 * @param ONE_OF_SCHEMA JSONSchema (exclusive schema union)
 * @param OPTIONS Parsing options
 * @returns Meta-type
 */
export type ParseOneOfSchema<
  ONE_OF_SCHEMA extends OneOfSchema,
  OPTIONS extends ParseSchemaOptions,
  // Pre-compute the root schema parse once, reuse in recursion
  ROOT_WITHOUT_ONEOF extends JSONSchema = Omit<ONE_OF_SCHEMA, "oneOf">,
  PARSED_ROOT = ParseSchema<ROOT_WITHOUT_ONEOF, OPTIONS>,
> = M.$Union<
  RecurseOnOneOfSchema<
    ONE_OF_SCHEMA["oneOf"],
    ROOT_WITHOUT_ONEOF,
    OPTIONS,
    PARSED_ROOT
  >
>;

/**
 * Recursively parses a tuple of JSON schemas to the union of its parsed meta-types (merged with root schema).
 * @param SUB_SCHEMAS JSONSchema[]
 * @param ROOT_WITHOUT_ONEOF Root JSONSchema without oneOf key
 * @param OPTIONS Parsing options
 * @param PARSED_ROOT Pre-computed parsed root schema (hoisted for performance)
 * @param RESULT Accumulated result
 * @returns Meta-type
 */
type RecurseOnOneOfSchema<
  SUB_SCHEMAS extends readonly JSONSchema[],
  ROOT_WITHOUT_ONEOF extends JSONSchema,
  OPTIONS extends ParseSchemaOptions,
  PARSED_ROOT,
  RESULT = never,
> = SUB_SCHEMAS extends readonly [
  infer SUB_SCHEMAS_HEAD extends JSONSchema,
  ...infer SUB_SCHEMAS_TAIL extends readonly JSONSchema[],
]
  ? RecurseOnOneOfSchema<
      SUB_SCHEMAS_TAIL,
      ROOT_WITHOUT_ONEOF,
      OPTIONS,
      PARSED_ROOT,
      | RESULT
      | M.$Intersect<
          PARSED_ROOT,
          ParseSchema<
            MergeSubSchema<ROOT_WITHOUT_ONEOF, SUB_SCHEMAS_HEAD>,
            OPTIONS
          >
        >
    >
  : RESULT;
