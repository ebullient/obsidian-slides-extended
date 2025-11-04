# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**For complete build commands, architecture details, and development guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).**

## Your Role

Act as a pair programming partner for this Obsidian plugin with these responsibilities:

- **REVIEW THOROUGHLY**: Read [CONTRIBUTING.md](CONTRIBUTING.md) to understand the processing pipeline architecture
- **ASK FOR CLARIFICATION**: If processor order or phase placement is unclear
- **BE EFFICIENT**: Be succinct and concise
- **NO SPECULATION**: Never make up markdown syntax or processor behavior

## Essential Commands

- Development: `pnpm dev` (watch mode, outputs to `./build` or `$OUTDIR`)
- Tests: `pnpm test` or `jest test/specific.unit.test.ts`
- Lint/fix: `pnpm fix` (auto-fixes with Biome)
- Build: `pnpm build` (runs tests + biome check first)

**Note**: This project uses **pnpm** (enforced), **Biome** (not ESLint/Prettier), and **Jest** for testing.

## Critical Architecture Concepts

### Processing Pipeline (Read CONTRIBUTING.md for details)

The codebase uses a **3-phase processor pipeline** in [src/obsidian/markdownProcessor.ts](src/obsidian/markdownProcessor.ts):

1. **Template Processing** - Iterative with circuit breaker (max 10 loops)
2. **Slide Structure** - Establishes slide framework
3. **Content Processing** - 15+ processors in **critical order**

**KEY RULE**: Processor order matters. `LatexProcessor` must run before `MediaProcessor`, etc. See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete ordered list.

### Adding a New Processor

1. Read the complete processor list in [CONTRIBUTING.md](CONTRIBUTING.md) to understand similar processors
2. Create in [src/obsidian/processors/](src/obsidian/processors/) implementing `Processor` interface
3. Import and instantiate in [MarkdownProcessor](src/obsidian/markdownProcessor.ts) constructor
4. Add to the correct phase in the **correct order** (consult existing processors)
5. Write tests in [test/](test/) with snapshot tests for complex transformations
6. Mock `ObsidianUtils` if needed (see [test/__mocks__/](test/__mocks__/))

## Key Development Principles

- **Follow existing patterns**: Find similar processors and emulate their structure
- **Respect processor order**: Understand why each processor runs when it does
- **Use the Processor interface**: All processors implement `process(markdown: string, options: Options): string`
- **Pure transformations**: Processors should be side-effect free (input markdown → output markdown)
- **Test with snapshots**: Complex HTML transformations should have snapshot tests
- **Enable logging for debugging**: Set `options.log = true` to see processor transformations

## Code Quality Requirements

### Biome Formatting (Required)

- Run `pnpm fix` before committing
- Biome will auto-format and organize imports
- 4-space indentation, double quotes
- Configuration: [biome.json](biome.json)

### Testing Requirements

- All new processors need unit tests in [test/](test/)
- Use snapshot testing for HTML output
- Mock `ObsidianUtils` (it's excluded from coverage)
- Tests must pass before build: `pnpm build` runs tests first

## Common Patterns to Follow

### Processor Template
```typescript
import type { Options, Processor } from '../../@types';

export class MyProcessor implements Processor {
    process(markdown: string, options: Options): string {
        // Pure transformation logic
        return transformedMarkdown;
    }
}
```

### Test Template
```typescript
import { MarkdownProcessor } from '../src/obsidian/markdownProcessor';
import { mockObsidianUtils } from './__mocks__/mockObsidianUtils';

describe('MyFeature', () => {
    let processor: MarkdownProcessor;

    beforeEach(() => {
        processor = new MarkdownProcessor(mockObsidianUtils);
    });

    it('should transform correctly', () => {
        const input = '...';
        const result = processor.process(input, options);
        expect(result).toMatchSnapshot();
    });
});
```

## Important Gotchas

1. **Processor Order**: Never add processors without understanding their place in the sequence. Read [CONTRIBUTING.md](CONTRIBUTING.md) first.

2. **Template Circuit Breaker**: The template processor stops after 10 iterations. Don't create infinite template loops.

3. **Options Mutation**: `options.defaultTemplate` is nulled after first template pass. Don't rely on it persisting.

4. **YamlStore Singleton**: `YamlStore.getInstance()` maintains global state. Be aware of side effects.

5. **Asset Copying**: Adding reveal.js plugins requires updating [esbuild.config.mjs](esbuild.config.mjs) copy sections.

6. **Hot Reload**: Requires `.hotreload` file in build dir (auto-created in dev mode).

## When Working on This Codebase

### First Steps
1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for architecture overview
2. Review the processor list to understand transformation order
3. Look at similar existing processors for patterns
4. Check [test/](test/) for testing patterns

### Before Making Changes
- Understand which phase your processor belongs in
- Identify any processors that might conflict with yours
- Consider whether order matters for your transformation

### Before Committing
- Run `pnpm fix` to format code
- Run `pnpm test` to ensure tests pass
- Update snapshots if needed: `jest -u`

## Resources

- Architecture and processor list: [CONTRIBUTING.md](CONTRIBUTING.md)
- Processor implementations: [src/obsidian/processors/](src/obsidian/processors/)
- Test examples: [test/](test/)
- Dependencies: [package.json](package.json)
