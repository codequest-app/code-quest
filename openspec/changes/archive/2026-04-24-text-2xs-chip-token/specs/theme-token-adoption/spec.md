## ADDED Requirements

### Requirement: `text-2xs` (10 px) is the sanctioned token for chip-style and section-heading text

`@theme` SHALL declare `--text-2xs: 0.625rem` (10 px). The corresponding `text-2xs` utility is the **only** legitimate way for component code to use 10 px font size. Two use-categories qualify:

1. Uppercase tracked chip / badge labels (e.g. SpecPane `Ready`, `Archive`, task pill).
2. Section-heading utilities such as `section-label` (consolidated from the previously hardcoded `font-size: 10px`).

Body text, links, hints, and dialog descriptions continue to use `text-xs` (12 px). The arbitrary `text-[10px]` ban from `text-arbitrary-cleanup` stays in force; `text-2xs` is the proper replacement, not the arbitrary.

#### Scenario: Chip badge needs sub-12 px text
- **WHEN** an uppercase tracked chip needs less visual weight than its surrounding body text
- **THEN** the className uses `text-2xs`, not `text-[10px]`

#### Scenario: Section heading utility
- **WHEN** an `@utility` defines a section-heading style (uppercase tracked label)
- **THEN** its `font-size` is `var(--text-2xs)`, not a hardcoded `10px`

#### Scenario: Body text remains text-xs
- **WHEN** a paragraph, dialog body, or hint needs "small" text
- **THEN** the className uses `text-xs` (12 px) — `text-2xs` is reserved for chip / heading scale
