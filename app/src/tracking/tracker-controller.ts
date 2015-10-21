import {Component,View, bootstrap} from 'angular2/angular2';

@Component({
    selector: 'tracking-app'
})
@View({
    templateUrl: 'src/tracking/tracker.tpl.html'
})
class TrackerComponent {

}

//TODO AMO maybe deactivate typescript compiler

bootstrap(TrackerComponent);