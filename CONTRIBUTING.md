# Contributing to Slides Extended

Thank you for your interest in contributing to Slides Extended! This guide will help you get started with development.

## Know where your change belongs

This repository has a few distinct codebases with a hard boundary between them:

| Codebase | Branch | What lives there |
|---|---|---|
| `src/`, `test/`, `se-test-vault/` | `main` | Obsidian plugin — runs inside Obsidian as a Node.js/Electron process |
| [`reveal-dist/`](reveal-dist/) submodule | `reveal-dist` | reveal.js assets — rendered only by a browser (iframe or exported HTML) |
| docs source | `docs` | Documentation site (Hugo-based SSG; some translation required for edits) |

- **Plugin code** (UI, settings, markdown processors, the preview panel): `src/` on `main`
- **Browser-rendered presentation content** (reveal.js plugins, themes, layout CSS, HTML templates): `reveal-dist` submodule
- **Documentation updates**: `docs` branch (Ex-hugo SSG, now mostly markdown; some translation of content is required for hosting)

## Getting Started

### Prerequisites

- **Node.js** (version 18 or higher recommended)
- **pnpm** - This project uses pnpm as its package manager

### Setup

1. Clone the repository with submodules:

   ```bash
   git clone --recurse-submodules git@github.com:ebullient/obsidian-slides-extended.git
   ```

   Or, if you already cloned without submodules:

   ```bash
   git submodule update --init
   ```

2. Install dependencies for the main plugin:

   ```bash
   pnpm install
   ```

3. Build the reveal.js distribution assets (required for the plugin to serve presentations):

   ```bash
   cd reveal-dist && pnpm install && pnpm build && cd ..
   ```

   This populates `reveal-dist/build/` with `css/`, `dist/`, `plugin/`, and `template/`
   which the plugin's HTTP server serves at runtime.

## Development Workflow

### Development Commands

```bash
# Start development mode (watch mode with hot reload)
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm coverage

# Run a single test file
jest test/basicSyntax.unit.test.ts

# Lint and format check
pnpm lint

# Auto-fix linting and formatting issues
pnpm fix

# Production build (runs tests and biome check first)
pnpm build
```

### Development Setup with Obsidian

For testing the plugin in Obsidian during development:

1. Set the `OUTDIR` environment variable to your Obsidian vault's plugin directory:

   ```bash
   export OUTDIR="/path/to/your/vault/.obsidian/plugins/slides-extended"
   ```

2. Run `pnpm dev` to watch and build automatically
3. The plugin will hot-reload in Obsidian (requires the `.hotreload` file which is created automatically)

## Code Quality

This project uses [Biome](https://biomejs.dev/) for linting and formatting (a modern alternative to ESLint/Prettier).

- Configuration is in [biome.json](biome.json)
- 4-space indentation
- Double quotes for JavaScript
- Auto-organize imports

Before submitting a PR, ensure:

```bash
pnpm fix    # Fix any auto-fixable issues
pnpm test   # All tests pass
pnpm build  # Production build succeeds
```

## Testing

### Test Structure

Tests are located in the [test/](test/) directory:

- `*.unit.test.ts` - Unit test files
- `__snapshots__/` - Jest snapshot files for regression testing
- `__mocks__/` - Mock implementations (e.g., Obsidian utilities)
- `fixtures/` - Test fixture files

### Writing Tests

When adding new features or processors:

1. Create a test file in `test/` (e.g., `myFeature.unit.test.ts`)
2. Test both the processor directly and end-to-end markdown transformation
3. Use snapshot tests for complex HTML transformations
4. Mock `ObsidianUtils` when needed (it's excluded from coverage as it depends on Obsidian APIs)

Example test structure:

```typescript
import { MarkdownProcessor } from '../src/obsidian/markdownProcessor';
import { mockObsidianUtils } from './__mocks__/mockObsidianUtils';

describe('MyFeature', () => {
    let processor: MarkdownProcessor;

    beforeEach(() => {
        processor = new MarkdownProcessor(mockObsidianUtils);
    });

    it('should transform markdown correctly', () => {
        const input = '...';
        const result = processor.process(input, options);
        expect(result).toMatchSnapshot();
    });
});
```

## Architecture Overview

### The Processing Pipeline

The core of Slides Extended is a multi-phase markdown processing pipeline in [src/obsidian/markdownProcessor.ts](src/obsidian/markdownProcessor.ts). Understanding this is key to contributing:

1. **Phase 1: Template Processing**

    - Runs iteratively with circuit breaker (max 10 iterations) to handle nested templates
    - `MultipleFileProcessor` - Handles file includes (`![[other-file]]`)
    - `TemplateProcessor` - Applies templates from YAML frontmatter

2. **Phase 2: Slide Structure**

    - `SkipSlideProcessor` - Removes slides marked to be hidden
    - `DebugViewProcessor` - Adds debug grid if enabled
    - `AutoClosingProcessor` - Auto-closes self-closing HTML tags
    - `DefaultBackgroundProcessor` - Applies default backgrounds

3. **Phase 3: Content Processing** (executed in this specific order)

    - `LatexProcessor` - LaTeX/MathJax equations
    - `EmojiProcessor` - Emoji shortcode conversion
    - `IconsProcessor` - FontAwesome icons
    - `FormatProcessor` - Text formatting
    - `MermaidProcessor` - Mermaid diagrams
    - `BlockProcessor` - Block-level transformations
    - `FootnoteProcessor` - Footnote handling
    - `ExcalidrawProcessor` - Excalidraw drawing embeds
    - `MediaProcessor` - Images/videos
    - `InternalLinkProcessor` - Obsidian wikilinks
    - `ReferenceProcessor` - Block references
    - `FragmentProcessor` - Reveal.js fragments (animations)
    - `DropProcessor` - Drop layouts
    - `GridProcessor` - Grid layouts
    - `CommentProcessor` - Slide comments
    - `ChartProcessor` - Chart.js integration

**Important**: The order of processors matters! For example, `LatexProcessor` must run before `MediaProcessor` to avoid conflicts. Each processor implements the `Processor` interface with a `process(markdown: string, options: Options): string` method.

### Adding a New Processor

1. Create your processor in [src/obsidian/processors/](src/obsidian/processors/):

   ```typescript
   import type { Options, Processor } from '../../@types';

   export class MyProcessor implements Processor {
       process(markdown: string, options: Options): string {
           // Your transformation logic
           return transformedMarkdown;
       }
   }
   ```

2. Register it in [src/obsidian/markdownProcessor.ts](src/obsidian/markdownProcessor.ts):
   - Import the processor
   - Instantiate it in the constructor
   - Add it to the appropriate phase in the correct order

3. Write tests in [test/](test/)

4. Update documentation if needed

### Adding Reveal.js Plugins or Assets

Reveal.js distribution assets live in the [`reveal-dist`](reveal-dist/) submodule
(branch `reveal-dist` on this repo). Changes to reveal assets go there, not in the
main plugin source.

1. `cd reveal-dist`
2. Add the npm package to `reveal-dist/package.json`
3. Update `reveal-dist/esbuild.config.mjs` to copy the necessary files:

   ```javascript
   copy({
       assets: {
           from: ['node_modules/your-plugin/**/*'],
           to: ['./plugin/your-plugin/'],
       }
   })
   ```

4. Run `pnpm install && pnpm build` inside `reveal-dist/` to verify the output

## Project Structure

```txt
reveal-dist/                     # git submodule (branch: reveal-dist)
├── plugin/                      # Custom reveal.js plugins (source)
├── template/                    # Mustache HTML templates (source)
├── package.json                 # Minimal deps: reveal.js ecosystem only
└── esbuild.config.mjs           # Builds css/, dist/, plugin/, template/ to build/

src/
├── main.ts                      # Plugin entry point
├── slidesExtended-Plugin.ts     # Core plugin class
├── reveal/                      # Reveal.js integration (plugin-side)
│   ├── revealPreviewView.ts     # Preview view
│   ├── revealServer.ts          # Fastify HTTP server
│   ├── revealRenderer.ts        # Markdown-to-HTML conversion
│   └── revealExporter.ts        # PDF/HTML export
├── obsidian/                    # Obsidian-specific processing
│   ├── markdownProcessor.ts     # Core pipeline orchestrator
│   ├── processors/              # 15+ processor modules
│   ├── transformers/            # Style/attribute transformers
│   └── suggesters/              # Editor autocompletion
├── yaml/                        # Configuration management
├── scss/                        # Styles and themes
└── @types/                      # TypeScript type definitions
```

## Common Issues

### Hot Reload Not Working

- Ensure `.hotreload` file exists in your build directory
- In dev mode, this is created automatically
- Restart Obsidian if hot reload stops working

### Tests Failing After Adding a Processor

- Check if you need to update snapshots: `jest -u`
- Ensure processors are added in the correct order
- Mock `ObsidianUtils` if your processor uses it

### Build Errors with Assets

- Make sure all required assets are listed in [esbuild.config.mjs](esbuild.config.mjs)
- Check that node_modules contains the expected files
- Try `rm -rf node_modules && pnpm install`

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Ensure tests pass and code is formatted (`pnpm fix && pnpm test`)
5. Commit your changes with a clear message
6. Push to your fork
7. Open a Pull Request

### Commit Message Guidelines

- Use clear, descriptive commit messages
- Focus on the "why" rather than the "what"
- Examples:
    - "Fix greedy embed pattern matching"
    - "Add support for custom chart colors"
    - "Improve error handling in media processor"

## Release Process

Releases are automated via GitHub Actions and are typically handled by maintainers:

1. Manual workflow trigger with version bump (major/minor/patch)
2. Runs tests and builds the plugin
3. Creates GitHub release with artifacts
4. Updates manifest.json and versions.json

## Questions or Need Help?

- Open an issue for bugs or feature requests
- Check existing issues before creating a new one
- Be respectful and provide clear descriptions

## License

This project is MIT licensed. By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Slides Extended! 🎉
