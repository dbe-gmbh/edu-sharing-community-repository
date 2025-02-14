import { Component, Input } from '@angular/core';

@Component({
    selector: 'es-info-message',
    templateUrl: 'info-message.component.html',
    styleUrls: ['info-message.component.scss'],
})
export class InfoMessageComponent {
    /**
     * the message to display
     */
    @Input() message: string;
    @Input() mode: 'info' | 'warning' | 'error' = 'info';

    ICONS: any = {
        info: 'info_outline',
        warning: 'warning_outline',
        error: 'error_outline',
    };
    constructor() {}
    getIcon() {
        return this.ICONS[this.mode];
    }
}
