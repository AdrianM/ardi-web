import {Component,View, bootstrap} from 'angular2/angular2';

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
    private detectionImages: any;
    private video: any;
    private boundingBox: any;
    private confidenceElement: any;
    private confidenceOverallElement: any;
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
        this.detectionImages = $('#detectionImages').children();
        this.video = $('#video')[0];
        this.boundingBox = $('#boundingBox')[0];
        this.confidenceElement = $('#confidence');
        this.confidenceOverallElement = $('#confidenceOverall');

        window.descriptorLength = 256;
        window.matchesShown = 30;
        window.blurRadius = 3;

        this.canvas.width = this.videoWidth;
    }

    private createTracker() {
        let BoundingBoxTracker = function () {
            BoundingBoxTracker.base(this, 'constructor');
        };
        tracking.inherits(BoundingBoxTracker, tracking.Tracker);

        BoundingBoxTracker.prototype.templateDescriptors_ = [];
        BoundingBoxTracker.prototype.templateKeypoints_ = [];
        BoundingBoxTracker.prototype.fastThreshold = 60;
        BoundingBoxTracker.prototype.blur = 3;

        BoundingBoxTracker.prototype.setTemplate = function (imagePixels, width, height) {
            this.templateKeypoints_ = [];
            this.templateDescriptors_ = [];

            imagePixels.forEach(function (imagePixel) {
                let blur = tracking.Image.blur(imagePixel, width, height, 3);
                let grayscale = tracking.Image.grayscale(blur, width, height);
                this.templateKeypoints_.push(tracking.Fast.findCorners(grayscale, width, height));
                this.templateDescriptors_.push(tracking.Brief.getDescriptors(grayscale, width, this.templateKeypoints_));
            }, this);
        };

        BoundingBoxTracker.prototype.track = function (pixels, width, height) {
            let blur = tracking.Image.blur(pixels, width, height, this.blur);
            let grayscale = tracking.Image.grayscale(blur, width, height);
            let keypoints = tracking.Fast.findCorners(grayscale, width, height, this.fastThreshold);
            let descriptors = tracking.Brief.getDescriptors(grayscale, width, keypoints);

            let matchingResults = [];
            for (let i = 0; i < this.templateKeypoints_.length; i++) {
                matchingResults.push(tracking.Brief.reciprocalMatch(this.templateKeypoints_[i], this.templateDescriptors_[i], keypoints, descriptors));
            }

            this.emit('track', {
                matchingResults: matchingResults
            });
        };
        this.tracker = new BoundingBoxTracker();
    }

    private initializeTracker() {
        let actualOveralConfidenceMax = [];

        //TODO AMO nicer
        this.tracker.on('track', (event) => {

            let confidenceMax = [];
            this.confidenceElement.empty();

            for (let i = 0; i < event.matchingResults.length; i++) {
                let result = event.matchingResults[i];
                result.sort((a, b)  => {
                    return b.confidence - a.confidence;
                });

                for (let j = 0; j < Math.min(10, result.length); j++) {
                    let frame = result[j].keypoint2;
                    this.context.fillStyle = "#FF0000";
                    this.context.fillRect(frame[0], frame[1], 4, 4);

                    if (result[j].confidence > confidenceMax[i] || !confidenceMax[i]) {
                        confidenceMax[i] = result[j].confidence * 100;
                    }
                }
                this.confidenceElement.append('<div>'+i + ': '+confidenceMax[i]+'</div>');

                if (confidenceMax[i] > actualOveralConfidenceMax[i] || !actualOveralConfidenceMax[i]) {
                    actualOveralConfidenceMax[i] = confidenceMax[i];
                    this.confidenceOverallElement.textContent = actualOveralConfidenceMax;//TODO AMO do it the angular way
                }

                if (confidenceMax[i] > this.recognizeLimitInPercent) {
                    this.addIdentifiedNotification(result);
                }
            }
        });

        this.trackerTask = tracking.track(this.video, this.tracker, { camera: true });
        this.trackerTask.stop();// Waits for the user to accept the camera.
    }

    private addIdentifiedNotification(result) {
        this.context.font = "30px Verdana";
        this.context.fillStyle = "#FF0000";
        this.context.fillRect(0, 5, this.videoWidth, 30);
        this.context.fillStyle = "#FFFFFF";
        this.context.fillText("identified ", 10, 30);
        console.log('matched' + result);
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
        let imagePixels = [];
        for (let i = 0; i < this.detectionImages.length; i++) {
            this.context.drawImage(this.detectionImages[i], 0, 0, this.templateWidth, this.templateHeight);
            let templateImageData = this.context.getImageData(0, 0, this.templateWidth, this.templateHeight).data;
            imagePixels.push(templateImageData);
        }

        this.trackerTask.stop();
        this.tracker.setTemplate(imagePixels, this.templateWidth, this.templateHeight);
        this.trackerTask.run();
    }

    private intializeGuiControls() {
        var gui = new dat.GUI();
        gui.add(this.tracker, 'fastThreshold', 20, 100).step(5);
        gui.add(this.tracker, 'blur', 1.1, 5.0).step(0.1);
    }
}

bootstrap(TrackerComponent);