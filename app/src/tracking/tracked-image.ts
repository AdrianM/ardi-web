declare var $: any;

export class TrackedImage {
    public title: string;
    public templateKeypoints: Array<any> = [];
    public templateDescriptors: Array<any> = [];
    public confidenceOfMatchMaximum: number = 0;
    private _match: any = [];
    private _confidenceOfMatch: number = 0;

    constructor(public element: any, public pixels: any, public successNotificationPosition: any) {
        this.title = $(element).attr('data-title');
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

    //TODO AMO remove width height
    public static createFromDomElement(element, context, templateWidth, templateHeight, successNotificationPosition): TrackedImage {
        context.drawImage(element, 0, 0, templateWidth, templateHeight);
        let pixels = context.getImageData(0, 0, templateWidth, templateHeight).data;
        return new TrackedImage(element, pixels, successNotificationPosition);
    }
}