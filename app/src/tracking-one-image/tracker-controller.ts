import {Component,View, bootstrap} from 'angular2/angular2';

declare var window: any;
declare var tracking: any;
declare var dat: any;
declare var BoundingBoxTracker: any;

@Component({
    selector: 'tracking-app'
})
@View({
    templateUrl: 'src/tracking-one-image/tracker.tpl.html'
})
class TrackerComponent {
    private canvas: any;
    private context: any;
    private image1: any;
    private image2: any;
    private video: any;
    private boundingBox: any;
    private confidenceElement: any;
    private confidenceOverallElement: any;
    private trackerTask: any;
    private tracker: any;
    private templateImageData: any;

    private width: number = 393;
    private height: number = 295;
    private boxLeft: number = 403;
    private videoHeight: number = 295;
    private videoWidth: number = 393;

    private templateWidth: number = 300;
    private templateHeight: number = 169;
    private recognizeLimitInPercent: number = 85;

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
        this.image1 = $('#image1')[0];
        this.image2 = $('#image2')[0];
        this.video = $('#video')[0];
        this.boundingBox = $('#boundingBox')[0];
        this.confidenceElement = $('#confidence')[0];
        this.confidenceOverallElement = $('#confidenceOverall')[0];

        window.descriptorLength = 256;
        window.matchesShown = 30;
        window.blurRadius = 3;
    }

    private createTracker() {
        let BoundingBoxTracker = function () {
            BoundingBoxTracker.base(this, 'constructor');
        };
        tracking.inherits(BoundingBoxTracker, tracking.Tracker);

        BoundingBoxTracker.prototype.templateDescriptors_ = null;
        BoundingBoxTracker.prototype.templateKeypoints_ = null;
        BoundingBoxTracker.prototype.fastThreshold = 60;
        BoundingBoxTracker.prototype.blur = 3;

        BoundingBoxTracker.prototype.setTemplate = function (pixels, width, height) {
            let blur = tracking.Image.blur(pixels, width, height, 3);
            let grayscale = tracking.Image.grayscale(blur, width, height);
            this.templateKeypoints_ = tracking.Fast.findCorners(grayscale, width, height);
            this.templateDescriptors_ = tracking.Brief.getDescriptors(grayscale, width, this.templateKeypoints_);
        };


        BoundingBoxTracker.prototype.track = function (pixels, width, height) {
            let blur = tracking.Image.blur(pixels, width, height, this.blur);
            let grayscale = tracking.Image.grayscale(blur, width, height);
            let keypoints = tracking.Fast.findCorners(grayscale, width, height, this.fastThreshold);
            let descriptors = tracking.Brief.getDescriptors(grayscale, width, keypoints);
            this.emit('track', {
                data: tracking.Brief.reciprocalMatch(this.templateKeypoints_, this.templateDescriptors_, keypoints, descriptors)
            });
        };
        this.tracker = new BoundingBoxTracker();
    }

    private initializeTracker() {
        let actualOveralConfidenceMax = 0;

        this.tracker.on('track', (event) => {
            event.data.sort((a, b)  => {
                return b.confidence - a.confidence;
            });
            this.context.putImageData(this.templateImageData, this.boxLeft, 0);

            let confidenceMax = 0;

            for (let i = 0; i < Math.min(10, event.data.length); i++) {
                let template = event.data[i].keypoint1;
                let frame = event.data[i].keypoint2;
                this.context.beginPath();
                this.context.strokeStyle = 'magenta';
                this.context.moveTo(frame[0], frame[1]);
                this.context.lineTo(this.boxLeft + template[0], template[1]);
                this.context.stroke();

                if (event.data[i].confidence > confidenceMax) {
                    confidenceMax = event.data[i].confidence * 100;
                }
            }
            this.confidenceElement.textContent = confidenceMax;

            if (confidenceMax > actualOveralConfidenceMax) {
                actualOveralConfidenceMax = confidenceMax;
                this.confidenceOverallElement.textContent = actualOveralConfidenceMax;
            }

            if (confidenceMax > this.recognizeLimitInPercent) {
                this.addIdentifiedNotification();
            }
        });

        this.trackerTask = tracking.track(this.video, this.tracker, { camera: true });
        this.trackerTask.stop();// Waits for the user to accept the camera.
    }

    private addIdentifiedNotification() {
        this.context.font = "30px Verdana";
        this.context.fillStyle = "#FF0000";
        this.context.fillRect(0, 5, this.videoWidth, 30);
        this.context.fillStyle = "#FFFFFF";
        this.context.fillText("identified ", 10, 30);
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
        this.templateImageData = this.getGreyscaledImageFromContainer();
        this.canvas.width = this.boxLeft + this.templateWidth;
        this.context.putImageData(this.templateImageData, this.boxLeft, 0);
        this.trackerTask.stop();
        this.tracker.setTemplate(this.templateImageData.data, this.templateWidth, this.templateHeight);
        this.trackerTask.run();
    }

    private getGreyscaledImageFromContainer() {
        this.context.drawImage(this.image1, 0, 0, this.templateWidth, this.templateHeight);
        return this.context.getImageData(0, 0, this.templateWidth, this.templateHeight);
    }

    private intializeGuiControls() {
        var gui = new dat.GUI();
        gui.add(this.tracker, 'fastThreshold', 20, 100).step(5);
        gui.add(this.tracker, 'blur', 1.1, 5.0).step(0.1);
    }
}

bootstrap(TrackerComponent);