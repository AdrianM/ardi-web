import {TrackedImage} from './tracked-image.ts';

declare var tracking: any;

//AMO until Tracking.js is migrated to typescript, this is the easiest way to inherit her Tracker
export class ImageTracker extends tracking.Tracker {
    private imagesToTrack: Array<TrackedImage> = [];
    private fastThreshold: number = 60;
    private blur: number = 3;

    constructor() {
    }

    public setTemplate(trackedImages: Array<TrackedImage>, width, height) {
        this.imagesToTrack = trackedImages;
        this.imagesToTrack.forEach(function (imageToTrack: TrackedImage) {
            imageToTrack.algorithmResults = this.calculateKeypointsAndDescriptorsFromPixels(imageToTrack.pixels, width, height);
        }, this);
    }

    public track(pixels, width, height) {
        let algorithmResults = this.calculateKeypointsAndDescriptorsFromPixels(pixels, width, height);

        this.imagesToTrack.forEach(function (imageToTrack: TrackedImage) {
            imageToTrack.match = tracking.Brief.reciprocalMatch(
                imageToTrack.algorithmResults.keypoints,
                imageToTrack.algorithmResults.descriptors,
                algorithmResults.keypoints,
                algorithmResults.descriptors);
        }, this);

        this.emit('track', {
            matchingResults: this.imagesToTrack
        });
    }

    private calculateKeypointsAndDescriptorsFromPixels(pixels, width, height): AlgorithmResults {
        let blur = tracking.Image.blur(pixels, width, height, this.blur);
        let grayscale = tracking.Image.grayscale(blur, width, height);
        let keypoints = tracking.Fast.findCorners(grayscale, width, height, this.fastThreshold);
        let descriptors = tracking.Brief.getDescriptors(grayscale, width, keypoints);
        return new AlgorithmResults(keypoints, descriptors);
    }
}

export class AlgorithmResults {
    constructor(public keypoints: Array<any>, public descriptors: Array<any>) {
    }
}