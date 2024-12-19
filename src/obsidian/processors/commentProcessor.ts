import { CommentParser } from "src/obsidian/comment";

export class CommentProcessor {
    private parser: CommentParser = new CommentParser();

    process(markdown: string) {
        return markdown
            .split("\n")
            .map((line) => {
                const comment = this.parser.parseLine(line);
                if (comment) {
                    return this.parser.replace(line, comment);
                }
                return line;
            })
            .join("\n");
    }
}
