import type { Processor } from "src/@types";
import { CommentParser } from "src/obsidian/comment";

export class CommentProcessor implements Processor {
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
