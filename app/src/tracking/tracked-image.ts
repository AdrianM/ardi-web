import {TrackingConfig} from './tracking-config.ts';
import {AlgorithmResults} from './image-tracker.ts';

declare var $: any;

export class TrackedImage {
    public title: string;
    public group: string;
    public algorithmResults: AlgorithmResults;
    public confidenceOfMatchMaximum: number = 0;
    private _match: any = [];
    private _confidenceOfMatch: number = 0;

    constructor(public element: any, public pixels: any) {
        this.title = $(element).attr('data-title');
        this.group = $(element).attr('data-group');
    }

    get match(): any {
        return this._match;
    }

    set match(match: any) {
        this._match = match.sort((a, b)  => {
            return b.confidence - a.confidence;
        });
    }

    get confidenceOfMatch(): number {
        return this._confidenceOfMatch;
    }

    set confidenceOfMatch(confidenceOfMatch: number) {
        this._confidenceOfMatch = confidenceOfMatch;
        if (confidenceOfMatch > this.confidenceOfMatchMaximum) {
            this.confidenceOfMatchMaximum = confidenceOfMatch;
        }
    }

    public static createFromDomElement(element, context): TrackedImage {
        context.drawImage(element, 0, 0, TrackingConfig.templateWidth, TrackingConfig.templateHeight);
        let pixels = context.getImageData(0, 0, TrackingConfig.templateWidth, TrackingConfig.templateHeight).data;
        return new TrackedImage(element, pixels);
    }
}