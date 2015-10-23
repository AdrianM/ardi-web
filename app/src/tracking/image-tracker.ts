import {TrackedImage} from './tracked-image.ts';

declare var tracking: any;

export class ImageTracker extends tracking.Tracker {
    private imagesToTrack: Array<TrackedImage> = [];
    private fastThreshold: number = 60;
    private blur: number = 3;

    constructor() {
    }

    public setTemplate(trackedImages: Array<TrackedImage>, width, height) {
        this.imagesToTrack = trackedImages;

        this.imagesToTrack.forEach(function (imageToTrack: TrackedImage) {
            let blur = tracking.Image.blur(imageToTrack.pixels, width, height, this.blur);
            let grayscale = tracking.Image.grayscale(blur, width, height);
            imageToTrack.templateKeypoints = tracking.Fast.findCorners(grayscale, width, height);
            imageToTrack.templateDescriptors = tracking.Brief.getDescriptors(grayscale, width, imageToTrack.templateKeypoints);//TODO AMO do it inside
        }, this);
    }

    public track(pixels, width, height) {
        let blur = tracking.Image.blur(pixels, width, height, this.blur);
        let grayscale = tracking.Image.grayscale(blur, width, height);
        let keypoints = tracking.Fast.findCorners(grayscale, width, height, this.fastThreshold);
        let descriptors = tracking.Brief.getDescriptors(grayscale, width, keypoints);

        this.imagesToTrack.forEach(function (imageToTrack: TrackedImage) {
            imageToTrack.match = tracking.Brief.reciprocalMatch(imageToTrack.templateKeypoints, imageToTrack.templateDescriptors, keypoints, descriptors);
        }, this);

        this.emit('track', {
            matchingResults: this.imagesToTrack
        });
    }
}