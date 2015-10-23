import {Component,View, bootstrap} from 'angular2/angular2';
import {TrackedImage} from './tracked-image.ts';

declare var window: any;
declare var tracking: any;
declare var dat: any;
declare var BoundingBoxTracker: any;
declare var $: any;

@Component({
    selector: 'tracking-app'
})
@View({
    templateUrl: 'src/tracking/tracker.tpl.html'
})
class TrackerComponent {
    private canvas: any;
    private context: any;
    private video: any;
    private boundingBox: any;
    private trackerTask: any;
    private tracker: any;

    private width: number = 393;
    private height: number = 295;
    private videoHeight: number = 295;
    private videoWidth: number = 393;
    private videoWidth: number = 786;
    private videoHeight: number = 590;

    private templateWidth: number = 500;
    private templateHeight: number = 524;
    private recognizeLimitInPercent: number = 75;

    public trackedImages: Array<TrackedImage> = [];

    constructor() {
        this.initialize();
        this.createTracker();
        this.initializeTracker();
        this.requestFrame();
        this.setTackerTemplate();
        this.intializeGuiControls();
    }

    private initialize() {
        this.canvas = $('#canvas')[0];
        this.context = this.canvas.getContext('2d');
        this.video = $('#video')[0];
        this.boundingBox = $('#boundingBox')[0];//TODO AMO remove

        window.descriptorLength = 256;
        window.matchesShown = 30;
        window.blurRadius = 3;

        this.canvas.width = this.videoWidth;


        let decetionImage = $('#detectionImages').children();
        //TODO AMO remove magic number
        for (let i = 0; i < decetionImage.length; i++) {
            let successNotificationPosition = { x: 0, y: i * 30 + 1 };
            let trackedImage = TrackedImage.createFromDomElement(decetionImage[i], this.context, this.templateWidth, this.templateHeight, successNotificationPosition);
            this.trackedImages.push(trackedImage);
        }
    }

    private createTracker() {
        let BoundingBoxTracker = function () {
            BoundingBoxTracker.base(this, 'constructor');
        };
        tracking.inherits(BoundingBoxTracker, tracking.Tracker);

        BoundingBoxTracker.prototype.imagesToTrack = [];
        BoundingBoxTracker.prototype.fastThreshold = 60;
        BoundingBoxTracker.prototype.blur = 3;

        BoundingBoxTracker.prototype.setTemplate = function (trackedImages: Array<TrackedImage>, width, height) {
            this.imagesToTrack = trackedImages;

            this.imagesToTrack.forEach(function (imageToTrack: TrackedImage) {
                let blur = tracking.Image.blur(imageToTrack.pixels, width, height, 3);
                let grayscale = tracking.Image.grayscale(blur, width, height);
                imageToTrack.templateKeypoints = tracking.Fast.findCorners(grayscale, width, height);
                imageToTrack.templateDescriptors = tracking.Brief.getDescriptors(grayscale, width, imageToTrack.templateKeypoints);//TODO AMO do it inside
            }, this);
        };

        BoundingBoxTracker.prototype.track = function (pixels, width, height) {
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
        };
        this.tracker = new BoundingBoxTracker();
    }

    private initializeTracker() {
        //TODO AMO nicer
        this.tracker.on('track', (event) => {
            event.matchingResults.forEach(function (imageToTrack: TrackedImage) {
                imageToTrack.match.sort((a, b)  => {
                    return b.confidence - a.confidence;
                });

                for (let j = 0; j < Math.min(10, imageToTrack.match.length); j++) {
                    let frame = imageToTrack.match[j].keypoint2;
                    this.context.fillStyle = "#FF0000";
                    this.context.fillRect(frame[0], frame[1], 4, 4);

                    if (imageToTrack.match[j].confidence > imageToTrack.confidenceOfMatch) {
                        imageToTrack.confidenceOfMatch = imageToTrack.match[j].confidence * 100;
                    }
                }

                if (imageToTrack.confidenceOfMatch > this.recognizeLimitInPercent) {
                    this.addIdentifiedNotification(imageToTrack);
                }
            }, this);
        });

        this.trackerTask = tracking.track(this.video, this.tracker, { camera: true });
        this.trackerTask.stop();// Waits for the user to accept the camera.
    }

    private addIdentifiedNotification(imageToTrack: TrackedImage) {
        let position = imageToTrack.successNotificationPosition;
        this.context.font = "30px Verdana";
        this.context.fillStyle = "#FF0000";
        this.context.fillRect(position.x, position.y, this.videoWidth, 30);
        this.context.fillStyle = "#FFFFFF";
        this.context.fillText("Identified: " + imageToTrack.title, position.x + 10, position.y + 30);
    }

    private requestFrame() {
        window.requestAnimationFrame(()  => {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                try {
                    this.context.drawImage(this.video, 0, 0, this.videoWidth, this.videoHeight);
                } catch (err) {
                }
            }
            this.requestFrame();
        });
    }

    private setTackerTemplate() {
        this.trackerTask.stop();
        this.tracker.setTemplate(this.trackedImages, this.templateWidth, this.templateHeight);
        this.trackerTask.run();
    }

    private intializeGuiControls() {
        var gui = new dat.GUI();
        gui.add(this.tracker, 'fastThreshold', 20, 100).step(5);
        gui.add(this.tracker, 'blur', 1.1, 5.0).step(0.1);
    }
}

bootstrap(TrackerComponent);