import type { Processor } from "../../@types";
import { CommentParser } from "../../obsidian/comment";

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
