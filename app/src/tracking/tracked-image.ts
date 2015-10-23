export default class TrackedImage {
    private _confidenceOfMatch: number = 0;
    private confidenceOfMatchMaximum: number = 0;
    public templateKeypoints: Array<any> = [];
    public templateDescriptors: Array<any> = [];
    public match: any = [];

    constructor(public element: any, public pixels: any) {
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

    public static createFromDomElement(element, context, templateWidth, templateHeight): TrackedImage {
        context.drawImage(element, 0, 0, templateWidth, templateHeight);
        let pixels = context.getImageData(0, 0, templateWidth, templateHeight).data;
        return new TrackedImage(element, pixels);
    }
}