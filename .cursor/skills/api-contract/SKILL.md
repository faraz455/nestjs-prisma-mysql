---
name: api-contract
description: Keeps DTO validators, Swagger ApiProperty flags, entity classes, and service return values in agreement. Use when editing DTOs, entities, response decorators, or ValidationPipe behavior.
---

# API contract

The global pipe in `src/main.ts` uses `transform`, `whitelist`, and `forbidNonWhitelisted`. A field that is not on the DTO is rejected.

## Field rules

- Required string: `@ApiProperty({ required: true, type: String })` and `@IsCustomString()`.
- Optional string: `required: false`, `@IsCustomString({ required: false })`, and `field?: string`.
- Booleans use `@IsBoolean()` and `type: Boolean`.
- Nested object arrays use `@ValidateNested({ each: true })` and `@Type(() => NestedDto)`.
- Updates extend `PartialType(CreateDto)` from `@nestjs/swagger`.

`IsCustomString` treats an optional empty string as `null`.

## Entity

The entity class lists the fields the service `select` returns, with the same `required` flags. Response decorators on the controller use that entity or `IDDto`. The service's declared return type is the same class.

## Example

```typescript
@ApiProperty({ required: false, type: String })
@IsCustomString({ required: false })
description?: string;
```

Swagger UI exists only when `PRODUCTION=0`. Adding a DTO field still requires `@ApiProperty`, because the document is built from these classes.
