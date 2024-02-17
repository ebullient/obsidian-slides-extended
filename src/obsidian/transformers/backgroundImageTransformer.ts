import { AttributeTransformer, Properties } from './index';
import { getImageCollector } from '../obsidianUtils';

export class BackgroundImageTransformer implements AttributeTransformer {
    transform(element: Properties) {
        const value = element.getAttribute('data-background-image');
        if (value != undefined) {
            if (getImageCollector().shouldCollect()) {
                getImageCollector().addImage(value);
            }
        }
    }
}
