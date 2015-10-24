import {TrackingConfig} from './tracking-config.ts';

export class ImageGroup {
    public lastMatchTimestamp: number = 0;
    public averageConfidence: number = 0;
    private confidenceRates: Array<number> = [];

    constructor(public name: string) {
    }

    public addConfidenceRate(confidence) {
        this.confidenceRates.push(confidence);
    }

    public resetConfidenceRates() {
        this.confidenceRates = [];
    }

    public hasMatch() {
        this.evaluateIfThereIsAMatch();

        if (!this.lastMatchTimestamp) {
            return false;
        }

        if ((Date.now() - this.lastMatchTimestamp) < TrackingConfig.notificationDuration) {
            return true;
        } else {
            this.lastMatchTimestamp = null;
            return false;
        }
    }

    private evaluateIfThereIsAMatch() {
        this.averageConfidence = this.calculateAverage(this.confidenceRates);
        if (this.averageConfidence > TrackingConfig.recognitionThreshold) {
            this.lastMatchTimestamp = Date.now();
        }
    }

    //TODO AMO use lodash
    private calculateAverage(values: Array<number>) {
        let total: number = 0
        values.forEach((value) => {
            total += value;
        });
        return total / values.length;
    }
}