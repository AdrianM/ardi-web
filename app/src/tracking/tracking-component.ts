import {Component,View, bootstrap, NgFor} from 'angular2/angular2';
import {TrackedImage} from './tracked-image.ts';
import {ImageTracker} from './image-tracker.ts';
import {TrackingConfig} from './tracking-config.ts';

declare var window: any;
declare var tracking: any;
declare var dat: any;
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
    private video: any;
    private trackerTask: any;
    private tracker: any;

    public trackingImages: Array<TrackedImage> = [];
    private currentNotificationTimestamp: Map<string, number> = new Map<string, number>();

    constructor() {
        this.getDomComponents();
        this.createTrackingImages();
        this.startVideoFrame();
        this.createAndStartTracker();
        this.createDevGuiControls();
    }

    private getDomComponents() {
        this.canvas = $('#canvas')[0];
        this.canvas.width = TrackingConfig.videoWidth;
        this.context = this.canvas.getContext('2d');
        this.video = $('#video')[0];

        window.descriptorLength = TrackingConfig.defaultDescriptorLength;
        window.matchesShown = TrackingConfig.defaultMatchesShown;
        window.blurRadius = TrackingConfig.defaultBlurRadius;
    }

    private createTrackingImages() {
        let decetionImage = $('#detectionImages').children();
        for (let i = 0; i < decetionImage.length; i++) {
            let trackedImage = TrackedImage.createFromDomElement(decetionImage[i], this.context);
            this.trackingImages.push(trackedImage);
        }
    }

    private startVideoFrame() {
        window.requestAnimationFrame(()  => {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
            if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
                try {
                    this.context.drawImage(this.video, 0, 0, TrackingConfig.videoWidth, TrackingConfig.videoHeight);
                } catch (err) {
                    console.error(err);
                }
            }
            this.startVideoFrame();
        });
    }

    private createAndStartTracker() {
        this.tracker = new ImageTracker();
        this.tracker.on('track', this.onTrack.bind(this));
        this.trackerTask = tracking.track(this.video, this.tracker, { camera: true });
        this.trackerTask.stop();// Waits for the user to accept the camera.
        this.tracker.setTemplate(this.trackingImages, TrackingConfig.templateWidth, TrackingConfig.templateHeight);
        this.trackerTask.run();
    }

    private onTrack(event) {
        event.matchingResults.forEach((imageToTrack: TrackedImage) => {
            this.drawBestMatchesAndSetConfidence(imageToTrack);
        }, this);
        this.showNotifications();
    }

    private drawBestMatchesAndSetConfidence(imageToTrack: TrackedImage) {
        let highestConfidenceOfMatch = 0;

        for (let j = 0; j < Math.min(10, imageToTrack.match.length); j++) {
            let frame = imageToTrack.match[j].keypoint2;
            this.context.fillStyle = "#FF0000";
            this.context.fillRect(frame[0], frame[1], TrackingConfig.matchingRectangleSize, TrackingConfig.matchingRectangleSize);

            let confidence = imageToTrack.match[j].confidence * 100;
            if (confidence > highestConfidenceOfMatch) {
                highestConfidenceOfMatch = confidence;
            }
        }

        if (highestConfidenceOfMatch > TrackingConfig.recognizeLimitInPercent) {
            this.currentNotificationTimestamp.set(imageToTrack.group, Date.now());
        }

        imageToTrack.confidenceOfMatch = highestConfidenceOfMatch;
    }

    private showNotifications() {
        let notificationGroups = [];

        this.currentNotificationTimestamp.forEach((timestamp, group) => {
            if ((Date.now() - timestamp) < TrackingConfig.notificationDuration) {
                notificationGroups.push(group);
            } else {
                this.currentNotificationTimestamp.delete(group);
            }
        });

        if (notificationGroups.length > 0) {
            let text = 'Identified: ' + notificationGroups.join(', ');
            this.context.font = "30px Verdana";
            this.context.fillStyle = "rgba(255, 0, 0, 0.6)";
            this.context.fillRect(0, 5, TrackingConfig.videoWidth, TrackingConfig.notificationHeight);
            this.context.fillStyle = "#FFFFFF";
            this.context.fillText(text, 20, TrackingConfig.notificationHeight - 12);
        }
    }

    private createDevGuiControls() {
        var gui = new dat.GUI();
        gui.add(this.tracker, 'fastThreshold', 20, 100).step(5);
        gui.add(this.tracker, 'blur', 1.1, 5.0).step(0.1);
    }
}

bootstrap(TrackingComponent);