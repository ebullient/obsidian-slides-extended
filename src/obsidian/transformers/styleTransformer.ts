import type { AttributeTransformer, Properties } from "./index";

export class StyleTransformer implements AttributeTransformer {
    transform(element: Properties) {
        const style = element.getAttribute("style");

        if (style !== undefined) {
            for (const value of style.split(";")) {
                const item = value.trim();
                if (item.length > 0) {
                    const [key, val] = item.split(":");
                    if (key && key.length > 0 && val) {
                        element.addStyle(key.trim(), val.trim());
                    }
                }
            }
            element.deleteAttribute("style");
        }
    }
}
