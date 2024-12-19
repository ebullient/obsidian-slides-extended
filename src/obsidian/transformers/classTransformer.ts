import type { AttributeTransformer, Properties } from "./index";

export class ClassTransformer implements AttributeTransformer {
    transform(element: Properties) {
        const clazz = element.getAttribute('class');

        if (clazz !== undefined) {
            for (const value of clazz.split(" ")) {
                if (value.trim().length > 0) {
                    element.addClass(value.trim());
                }
            }
            element.deleteAttribute("class");
        }
    }
}
