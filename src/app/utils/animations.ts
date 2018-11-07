import { state, animate, transition, trigger, style } from "@angular/animations";

 export const animationTrigger = trigger('overlayAnimation', [
    state('void', style({
        transform: 'translateY(5%)',
        opacity: 0
    })),
    state('visible', style({
        transform: 'translateY(0)',
        opacity: 1
    })),
    transition('void => visible', animate('{{showTransitionParams}}')),
    transition('visible => void', animate('{{hideTransitionParams}}'))
]);