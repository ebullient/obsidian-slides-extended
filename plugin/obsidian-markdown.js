window.ObsidianMarkdown = window.ObsidianMarkdown || {
    id: "ObsidianMarkdown",

    init: (deck) => {
        // Create the markdown plugin (this is confusing with binds)
        const self = window.ObsidianMarkdown;
        const revealMarkdownPlugin = RevealMarkdown();
        const marked = revealMarkdownPlugin.marked;

        // Special Obsidian markdown parsing that should be done
        // when reveal.js is rendering slides
        marked.use({
            walkTokens(token) {
                if (token.type === "blockquote") {
                    return self.processCallout(this, self, token);
                }
            },
            extensions: [
                {
                    name: "callout",
                    level: "block",
                    renderer({ meta, tokens = [] }) {
                        // Parse the title as inline markdown (for bold, italic, etc.)
                        const parsedTitle = marked.parseInline(meta.title);

                        let tmpl = `<div class="callout ${meta.color}" data-type="${meta.type}">\n`;

                        tmpl += '<div class="callout-title">';
                        tmpl += `<div class="callout-icon">${meta.icon}</div>`;
                        tmpl += `<div class="callout-title-inner">${parsedTitle}</div>`;
                        tmpl += "</div>\n";

                        if (tokens.length > 0) {
                            tmpl += '<div class="callout-content">';
                            tmpl += this.parser.parse(tokens);
                            tmpl += "</div>\n";
                        }

                        tmpl += "</div>\n";
                        return tmpl;
                    },
                },
            ],
        });

        // Delegate to the patched markdown plugin
        return revealMarkdownPlugin.init(deck);
    },

    calloutRegex: /^\[!([^\]]+)\]([+-])?\s*([^\n]*)\n?/,

    processCallout: (marked, self, token) => {
        const regex = self.calloutRegex;
        const firstToken = token.tokens?.[0];
        if (!firstToken || firstToken.type !== "paragraph") {
            return;
        }
        const match = firstToken.raw.match(regex);
        if (!match) {
            return; // Not a callout
        }
        const type = match[1];
        const foldable = match[2];
        const color = self.colorFrom(type);
        const icon = self.iconFrom(type);
        const title = self.titleFrom(type, match[3]);

        const remainingContent = firstToken.raw.replace(regex, "").trim();
        if (remainingContent) {
            // Update the paragraph with remaining content
            firstToken.raw = firstToken.raw.replace(regex, "");
            firstToken.text = firstToken.text.replace(regex, "");

            // Re-parse inner content
            firstToken.tokens = marked.Lexer.lexInline(remainingContent);
        } else {
            // No content after marker, remove the paragraph entirely
            token.tokens.shift();
        }

        token.type = "callout";
        token.meta = {
            color,
            icon,
            title,
            type,
            foldable,
        };
        return token;
    },

    colorFrom: (type) => {
        const input = type.toLowerCase();

        switch (input) {
            case "abstract":
            case "summary":
            case "tldr":
            case "info":
                return "callout-color1";
            case "todo":
            case "tip":
            case "hint":
            case "important":
                return "callout-color2";
            case "success":
            case "check":
            case "done":
                return "callout-color3";
            case "question":
            case "help":
            case "faq":
                return "callout-color4";
            case "warning":
            case "caution":
            case "attention":
                return "callout-color5";
            case "failure":
            case "fail":
            case "missing":
                return "callout-color6";
            case "danger":
            case "error":
            case "bug":
                return "callout-color7";
            case "example":
                return "callout-color8";
            case "quote":
            case "cite":
                return "callout-color9";
            default:
                return "callout-color-default";
        }
    },

    titleFrom: (type, titleLine) => {
        if (titleLine) {
            return titleLine;
        }
        return type[0].toUpperCase() + type.substring(1).toLowerCase();
    },

    iconFrom: (type) => {
        const input = type.toLowerCase();

        switch (input) {
            case "abstract":
            case "summary":
            case "tldr":
                return '<i class="fas fa-clipboard-list"></i>';
            case "info":
                return '<i class="fas fa-info-circle"></i>';
            case "todo":
                return '<i class="fas fa-check-circle"></i>';
            case "tip":
            case "hint":
            case "important":
                return '<i class="fas fa-fire-alt"></i>';
            case "success":
            case "check":
            case "done":
                return '<i class="fas fa-check"></i>';
            case "question":
            case "help":
            case "faq":
                return '<i class="fas fa-question-circle"></i>';
            case "warning":
            case "caution":
            case "attention":
                return '<i class="fas fa-exclamation-triangle"></i>';
            case "failure":
            case "fail":
            case "missing":
                return '<i class="fas fa-times"></i>';
            case "danger":
            case "error":
                return '<i class="fas fa-bolt"></i>';
            case "bug":
                return '<i class="fas fa-bug"></i>';
            case "example":
                return '<i class="fas fa-list"></i>';
            case "quote":
            case "cite":
                return '<i class="fas fa-quote-left"></i>';
            default:
                return '<i class="fas fa-pencil-alt"></i>';
        }
    },
};
