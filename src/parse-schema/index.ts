import type { M } from "ts-algebra";

import type { DeserializationPattern, JSONSchema } from "~/definitions";

import type { AllOfSchema, ParseAllOfSchema } from "./allOf";
import type { AnyOfSchema, ParseAnyOfSchema } from "./anyOf";
import type { ConstSchema, ParseConstSchema } from "./const";
import type { DeserializeSchema } from "./deserialize";
import type { EnumSchema, ParseEnumSchema } from "./enum";
import type { IfThenElseSchema, ParseIfThenElseSchema } from "./ifThenElse";
import type {
  MultipleTypesSchema,
  ParseMultipleTypesSchema,
} from "./multipleTypes";
import type { NotSchema, ParseNotSchema } from "./not";
import type { NullableSchema, ParseNullableSchema } from "./nullable";
import type { OneOfSchema, ParseOneOfSchema } from "./oneOf";
import type { ParseReferenceSchema, ReferencingSchema } from "./references";
import type { ParseSingleTypeSchema, SingleTypeSchema } from "./singleType";

/**
 * Type constraint for the ParseSchema options
 */
export type ParseSchemaOptions = {
  /**
   * Wether to parse negated schemas or not (false by default)
   */
  parseNotKeyword: boolean;
  /**
   * Wether to parse ifThenElse schemas or not (false by default)
   */
  parseIfThenElseKeywords: boolean;
  /**
   * Wether to keep object defaulted properties optional or not (false by default)
   */
  keepDefaultedPropertiesOptional: boolean;
  /**
   * The initial schema provided to `ParseSchema`
   */
  rootSchema: JSONSchema;
  /**
   * To refer external schemas by ids
   */
  references: Record<string, JSONSchema>;
  /**
   * To override inferred types if some pattern is matched
   */
  deserialize: DeserializationPattern[] | false;
};

/**
 * Core schema parsing - dispatches to appropriate parser based on schema shape.
 * Order matters: if/then/else and not must be checked before composition keywords.
 */
type ParseSchemaCore<
  SCHEMA extends JSONSchema,
  OPTIONS extends ParseSchemaOptions,
> =
  // Fast path: wide JSONSchema type - return Any immediately
  JSONSchema extends SCHEMA
    ? M.Any
    : // Fast path: boolean schemas
      SCHEMA extends true | string
      ? M.Any
      : SCHEMA extends false
        ? M.Never
        : // Nullable check (OpenAPI 3.0 style)
          SCHEMA extends NullableSchema
          ? ParseNullableSchema<SCHEMA, OPTIONS>
          : // Reference resolution - check early as refs are common
            SCHEMA extends ReferencingSchema
            ? ParseReferenceSchema<SCHEMA, OPTIONS>
            : // Conditional keywords MUST be checked before composition keywords
              // (a schema can have both type:"object" AND if/then/else)
              ParseConditionalThenRest<SCHEMA, OPTIONS>;

/**
 * Check if/then/else and not keywords (when enabled), then fall through to composition/type keywords.
 */
type ParseConditionalThenRest<
  SCHEMA extends JSONSchema,
  OPTIONS extends ParseSchemaOptions,
> =
  // Check if/then/else when enabled
  OPTIONS["parseIfThenElseKeywords"] extends true
    ? SCHEMA extends IfThenElseSchema
      ? ParseIfThenElseSchema<SCHEMA, OPTIONS>
      : ParseNotThenRest<SCHEMA, OPTIONS>
    : ParseNotThenRest<SCHEMA, OPTIONS>;

/**
 * Check not keyword (when enabled), then fall through to composition/type keywords.
 */
type ParseNotThenRest<
  SCHEMA extends JSONSchema,
  OPTIONS extends ParseSchemaOptions,
> = OPTIONS["parseNotKeyword"] extends true
  ? SCHEMA extends NotSchema
    ? ParseNotSchema<SCHEMA, OPTIONS>
    : ParseCompositionAndTypes<SCHEMA, OPTIONS>
  : ParseCompositionAndTypes<SCHEMA, OPTIONS>;

/**
 * Parse composition keywords (allOf, oneOf, anyOf) and type-based schemas.
 */
type ParseCompositionAndTypes<
  SCHEMA extends JSONSchema,
  OPTIONS extends ParseSchemaOptions,
> = SCHEMA extends AllOfSchema
  ? ParseAllOfSchema<SCHEMA, OPTIONS>
  : SCHEMA extends OneOfSchema
    ? ParseOneOfSchema<SCHEMA, OPTIONS>
    : SCHEMA extends AnyOfSchema
      ? ParseAnyOfSchema<SCHEMA, OPTIONS>
      : SCHEMA extends EnumSchema
        ? ParseEnumSchema<SCHEMA, OPTIONS>
        : SCHEMA extends ConstSchema
          ? ParseConstSchema<SCHEMA, OPTIONS>
          : SCHEMA extends MultipleTypesSchema
            ? ParseMultipleTypesSchema<SCHEMA, OPTIONS>
            : SCHEMA extends SingleTypeSchema
              ? ParseSingleTypeSchema<SCHEMA, OPTIONS>
              : M.Any;

/**
 * Helper to apply deserialization when deserialize option is an array
 */
type ApplyDeserialization<
  SCHEMA extends JSONSchema,
  OPTIONS extends ParseSchemaOptions,
  RESULT,
  DESERIALIZE_PATTERNS extends DeserializationPattern[],
> = M.$Intersect<
  DeserializeSchema<
    SCHEMA,
    Omit<OPTIONS, "deserialize"> & { deserialize: DESERIALIZE_PATTERNS }
  >,
  RESULT
>;

/**
 * Recursively parses a JSON schema to a meta-type. Check the [ts-algebra documentation](https://github.com/ThomasAribart/ts-algebra) for more informations on how meta-types work.
 * @param SCHEMA JSON schema
 * @param OPTIONS Parsing options
 * @returns Meta-type
 */
export type ParseSchema<
  SCHEMA extends JSONSchema,
  OPTIONS extends ParseSchemaOptions,
  RESULT = ParseSchemaCore<SCHEMA, OPTIONS>,
> = OPTIONS["deserialize"] extends DeserializationPattern[]
  ? ApplyDeserialization<SCHEMA, OPTIONS, RESULT, OPTIONS["deserialize"]>
  : RESULT;
