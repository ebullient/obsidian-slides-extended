import { AttributeTransformer, Properties } from './index';
import { getMediaCollector } from '../obsidianUtils';

export class BackgroundImageTransformer implements AttributeTransformer {
    transform(element: Properties) {
        const value = element.getAttribute('data-background-image');
        if (value != undefined) {
            if (getMediaCollector().shouldCollect()) {
                getMediaCollector().addMedia(value);
            }
        }
    }
}
