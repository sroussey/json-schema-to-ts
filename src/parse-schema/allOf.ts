import type { M } from "ts-algebra";

import type { JSONSchema } from "~/definitions";

import type { ParseSchema, ParseSchemaOptions } from "./index";
import type { MergeSubSchema } from "./utils";

/**
 * JSON schemas of JSON schema intersections
 * @example
 * const intersectionSchema = {
 *  allOf: [
 *    { type: "number" },
 *    { enum: [1, 2, "foo"] }
 *  ]
 * }
 */
export type AllOfSchema = JSONSchema &
  Readonly<{ allOf: readonly JSONSchema[] }>;

/**
 * Recursively parses a JSON schema intersection to a meta-type.
 *
 * Check the [ts-algebra documentation](https://github.com/ThomasAribart/ts-algebra) for more informations on how meta-types work.
 * @param ALL_OF_SCHEMA JSONSchema (exclusive schema union)
 * @param OPTIONS Parsing options
 * @returns Meta-type
 */
export type ParseAllOfSchema<
  ALL_OF_SCHEMA extends AllOfSchema,
  OPTIONS extends ParseSchemaOptions,
  // Pre-compute the root schema without allOf once
  ROOT_WITHOUT_ALLOF extends JSONSchema = Omit<ALL_OF_SCHEMA, "allOf">,
  PARSED_ROOT = ParseSchema<ROOT_WITHOUT_ALLOF, OPTIONS>,
> = RecurseOnAllOfSchema<
  ALL_OF_SCHEMA["allOf"],
  ROOT_WITHOUT_ALLOF,
  OPTIONS,
  PARSED_ROOT
>;

/**
 * Recursively parses a tuple of JSON schemas to the intersection of its parsed meta-types (merged with root schema).
 * @param SUB_SCHEMAS JSONSchema[]
 * @param ROOT_WITHOUT_ALLOF Root JSONSchema without allOf key
 * @param OPTIONS Parsing options
 * @param PARSED_ROOT_ALL_OF_SCHEMA Accumulated intersection result
 * @returns Meta-type
 */
type RecurseOnAllOfSchema<
  SUB_SCHEMAS extends readonly JSONSchema[],
  ROOT_WITHOUT_ALLOF extends JSONSchema,
  OPTIONS extends ParseSchemaOptions,
  PARSED_ROOT_ALL_OF_SCHEMA,
> = SUB_SCHEMAS extends readonly [
  infer SUB_SCHEMAS_HEAD extends JSONSchema,
  ...infer SUB_SCHEMAS_TAIL extends readonly JSONSchema[],
]
  ? RecurseOnAllOfSchema<
      SUB_SCHEMAS_TAIL,
      ROOT_WITHOUT_ALLOF,
      OPTIONS,
      M.$Intersect<
        ParseSchema<
          MergeSubSchema<ROOT_WITHOUT_ALLOF, SUB_SCHEMAS_HEAD>,
          OPTIONS
        >,
        PARSED_ROOT_ALL_OF_SCHEMA
      >
    >
  : PARSED_ROOT_ALL_OF_SCHEMA;
