import {Component,View, bootstrap} from 'angular2/angular2';

@Component({
    selector: 'tracking-app'
})
@View({
    templateUrl: 'src/tracking-one-image/tracker.tpl.html'
})
class TrackerComponent {
    private canvas:any;
    private context:any;
    private image1:any;
    private image2:any;
    private video:any;
    private boundingBox:any;
    private confidenceElement:any;
    private confidenceOverallElement:any;
    private trackerTask: any;
    private tracker: any;
    private templateImageData: any;
    private BoundingBoxTracker : any;

    private width:number = 393;
    private height:number = 295;
    private boxLeft:number = 403;
    private videoHeight: number = 295;
    private videoWidth: number = 393;

    private actualOveralConfidenceMax = 0;
    private capturing:boolean = false;

    constructor() {
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

        this.createBoundingBoxTracker();
        this.intializeTracker();
        this.requestFrame();
        this.setTackerTemplate();
    }

    private createBoundingBoxTracker(){
        this.BoundingBoxTracker = () => {
            this.BoundingBoxTracker.base(this, 'constructor');
        };
        tracking.inherits(this.BoundingBoxTracker, tracking.Tracker);

        this.BoundingBoxTracker.prototype.templateDescriptors_ = null;
        this.BoundingBoxTracker.prototype.templateKeypoints_ = null;
        this.BoundingBoxTracker.prototype.fastThreshold = 60;
        this.BoundingBoxTracker.prototype.blur = 3;

        this.BoundingBoxTracker.prototype.setTemplate = function (pixels, width, height) {
            let blur = tracking.Image.blur(pixels, width, height, 3);
            let grayscale = tracking.Image.grayscale(blur, width, height);
            this.templateKeypoints_ = tracking.Fast.findCorners(grayscale, width, height);
            this.templateDescriptors_ = tracking.Brief.getDescriptors(grayscale, width, this.templateKeypoints_);
        };


        this.BoundingBoxTracker.prototype.track = function (pixels, width, height) {
            let blur = tracking.Image.blur(pixels, width, height, this.blur);
            let grayscale = tracking.Image.grayscale(blur, width, height);
            let keypoints = tracking.Fast.findCorners(grayscale, width, height, this.fastThreshold);
            let descriptors = tracking.Brief.getDescriptors(grayscale, width, keypoints);
            this.emit('track', {
                data: tracking.Brief.reciprocalMatch(this.templateKeypoints_, this.templateDescriptors_, keypoints, descriptors)
            });
        };
    }

    private intializeTracker(){
        this.tracker = new this.BoundingBoxTracker();
        this.tracker.on('track', (event) => {
            if (this.capturing) {
                return;
            }
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
                    confidenceMax = event.data[i].confidence;
                }
            }
            this.confidenceElement.textContent = confidenceMax * 100;

            if (confidenceMax > this.actualOveralConfidenceMax) {
                this.actualOveralConfidenceMax = confidenceMax;
                this.confidenceOverallElement.textContent = this.actualOveralConfidenceMax * 100;
            }
        });

        this.trackerTask = tracking.track(this.video, this.tracker, {camera: true});
        this.trackerTask.stop();// Waits for the user to accept the camera.
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
        let width = 300;
        let height = 378;
        this.templateImageData = this.getGreyscaledImageFromContainer();
        this.canvas.width = this.boxLeft + width;
        this.context.putImageData(this.templateImageData, this.boxLeft, 0);
        this.trackerTask.stop();
        this.tracker.setTemplate(this.templateImageData.data, width, height);
        this.trackerTask.run();
    }

    private getGreyscaledImageFromContainer() {
        let width = 300;
        let height = 378;
        this.context.drawImage(this.image1, 0, 0, width, height);
        return this.context.getImageData(0, 0, width, height);
    }
}

bootstrap(TrackerComponent);