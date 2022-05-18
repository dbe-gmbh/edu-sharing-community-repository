import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type CardAvatar = { kind: 'image'; url: string } | { kind: 'icon'; icon: string };

@Component({
    selector: 'es-card-header',
    templateUrl: './card-header.component.html',
    styleUrls: ['./card-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHeaderComponent {
    /** DOM-ID suffix for elements of this dialog. */
    @Input() id: number;
    @Input() title: string;
    @Input() subtitle?: string;
    @Input() avatar?: CardAvatar;
    @Input() disableClose: boolean = false;
    @Output() triggerClose: EventEmitter<void> = new EventEmitter();

    getIconImageUrl(): string {
        if (this.avatar?.kind === 'image') {
            return this.avatar.url;
        } else {
            return null;
        }
    }

    getIcon(): string {
        if (this.avatar?.kind === 'icon') {
            return this.avatar.icon;
        } else {
            return null;
        }
    }

    onClose(): void {
        this.triggerClose.emit();
    }
}