import {Component,View, bootstrap, NgFor} from 'angular2/angular2';
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
    templateUrl: 'src/tracking/tracking.tpl.html',
    directives: [NgFor]
})
class TrackingComponent {
    private canvas: any;
    private context: any;
    private video: any
    private trackerTask: any;
    private tracker: any;

    private notificationHeight: number = 30;
    private matchingRectangleSize: number = 4;
    private videoWidth: number = 786;
    private videoHeight: number = 590;
    private templateWidth: number = 500;
    private templateHeight: number = 524;

    private recognizeLimitInPercent: number = 85;

    public trackingImages: Array<TrackedImage> = [];

    constructor() {
        this.getDomComponents();
        this.createTrackingImages();
        this.startVideoFrame();
        this.createAndStartTracker();
        this.intializeGuiControls();
    }

    private getDomComponents() {
        this.canvas = $('#canvas')[0];
        this.context = this.canvas.getContext('2d');
        this.video = $('#video')[0];

        window.descriptorLength = 256;
        window.matchesShown = 30;
        window.blurRadius = 3;

        this.canvas.width = this.videoWidth;
    }

    private createTrackingImages() {
        let decetionImage = $('#detectionImages').children();
        for (let i = 0; i < decetionImage.length; i++) {
            let successNotificationPosition = { x: 0, y: i * this.notificationHeight };
            let trackedImage = TrackedImage.createFromDomElement(decetionImage[i], this.context, this.templateWidth, this.templateHeight, successNotificationPosition);
            this.trackingImages.push(trackedImage);
        }
    }

    private createAndStartTracker() {
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
                let blur = tracking.Image.blur(imageToTrack.pixels, width, height, this.blur);
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
        this.tracker.on('track', this.onTrack.bind(this));
        this.trackerTask = tracking.track(this.video, this.tracker, { camera: true });
        this.trackerTask.stop();// Waits for the user to accept the camera.
        this.tracker.setTemplate(this.trackingImages, this.templateWidth, this.templateHeight);
        this.trackerTask.run();
    }

    private onTrack(event) {
        event.matchingResults.forEach((imageToTrack: TrackedImage) => {
            this.drawBestMatchesAndSetConfidence(imageToTrack);
            if (imageToTrack.confidenceOfMatch > this.recognizeLimitInPercent) {
                this.addIdentifiedNotification(imageToTrack);
            }
        }, this);
    }

    private drawBestMatchesAndSetConfidence(imageToTrack: TrackedImage) {
        let highestConfidenceOfMatch = 0;

        for (let j = 0; j < Math.min(10, imageToTrack.match.length); j++) {
            let frame = imageToTrack.match[j].keypoint2;
            this.context.fillStyle = "#FF0000";
            this.context.fillRect(frame[0], frame[1], this.matchingRectangleSize, this.matchingRectangleSize);

            let confidence = imageToTrack.match[j].confidence * 100;
            if (confidence > highestConfidenceOfMatch) {
                highestConfidenceOfMatch = confidence;
            }
        }

        imageToTrack.confidenceOfMatch = highestConfidenceOfMatch;
    }

    private addIdentifiedNotification(imageToTrack: TrackedImage) {
        let position = imageToTrack.successNotificationPosition;
        this.context.font = "30px Verdana";
        this.context.fillStyle = "#FF0000";
        this.context.fillRect(position.x, position.y, this.videoWidth, 30);
        this.context.fillStyle = "#FFFFFF";
        this.context.fillText("Identified: " + imageToTrack.title, position.x + 10, position.y + 30);
    }

    private intializeGuiControls() {
        var gui = new dat.GUI();
        gui.add(this.tracker, 'fastThreshold', 20, 100).step(5);
        gui.add(this.tracker, 'blur', 1.1, 5.0).step(0.1);
    }

    private startVideoFrame() {
        window.requestAnimationFrame(()  => {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                try {
                    this.context.drawImage(this.video, 0, 0, this.videoWidth, this.videoHeight);
                } catch (err) {
                }
            }
            this.startVideoFrame();
        });
    }
}

bootstrap(TrackingComponent);