import { Location } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostBinding,
    Inject,
    NgZone,
    OnDestroy,
    OnInit,
    ViewChild,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { startWith, take } from 'rxjs/operators';
import { DialogButton, RestHelper } from '../../../../core-module/core.module';
import { Toast, ToastType } from '../../../../core-ui-module/toast';
import { UIHelper } from '../../../../core-ui-module/ui-helper';
import { Node } from '../../../../core-module/rest/data-object';
import { MainNavService } from '../../../../main/navigation/main-nav.service';
import { CARD_DIALOG_DATA, Closable } from '../../card-dialog/card-dialog-config';
import { CardDialogRef } from '../../card-dialog/card-dialog-ref';
import { DialogsService } from '../../dialogs.service';

export interface NodeEmbedDialogData {
    node: Node;
}

/**
 * Dialog to generate an embed snippet for a node.
 */
@Component({
    selector: 'es-node-embed-dialog',
    templateUrl: './node-embed-dialog.component.html',
    styleUrls: ['./node-embed-dialog.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeEmbedDialogComponent implements OnInit, OnDestroy {
    @ViewChild('textarea') textareaRef: ElementRef<HTMLTextAreaElement>;

    readonly buttons = [new DialogButton('OPTIONS.COPY', { color: 'primary' }, () => this.copy())];

    readonly sizeConstraints = {
        width: { min: 300, max: 1200 },
        height: { min: 200, max: 1200 },
    };

    readonly form = new FormGroup({
        width: new FormControl(400, [
            Validators.min(this.sizeConstraints.width.min),
            Validators.max(this.sizeConstraints.width.max),
        ]),
        height: new FormControl(300, [
            Validators.min(this.sizeConstraints.height.min),
            Validators.max(this.sizeConstraints.height.max),
        ]),
        version: new FormControl('fixed'),
    });

    embedCode = '';
    showNotPublicWarning = false;

    private readonly destroyed$ = new Subject<void>();

    constructor(
        @Inject(CARD_DIALOG_DATA) public data: NodeEmbedDialogData,
        private dialogRef: CardDialogRef,
        private dialogs: DialogsService,
        private changeDetectorRef: ChangeDetectorRef,
        private location: Location,
        private mainNav: MainNavService,
        private ngZone: NgZone,
        private router: Router,
        private toast: Toast,
    ) {}

    ngOnInit(): void {
        this.dialogRef.patchConfig({ buttons: this.buttons });
        this.registerFormChanges();
        this.registerNotPublicWarning();
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    async openInviteDialog(): Promise<void> {
        const dialogRef = await this.dialogs.openShareDialog({ nodes: [this.data.node] });
        dialogRef.afterClosed().subscribe((result) => {
            // TODO: Update `isPublic` if necessary.
        });
    }

    private registerFormChanges(): void {
        this.form.valueChanges.pipe(startWith(this.form.value)).subscribe((values) => {
            if (this.form.valid) {
                this.embedCode = this.getEmbedCode(values);
                // Run a second change detection for `cdkTextareaAutosize` on the embed-code
                // textarea.
                this.ngZone.runOutsideAngular(() =>
                    setTimeout(() => this.changeDetectorRef.detectChanges()),
                );
            }
            this.buttons[0].disabled = !this.form.valid;
        });
        // The dialog is closable by backdrop click until any value has been changed.
        this.form.valueChanges.pipe(take(1)).subscribe(() => {
            this.dialogRef.patchConfig({ closable: Closable.Standard });
        });
    }

    private registerNotPublicWarning() {
        // TODO
        //
        // observeIsPublic(node)
        //     .pipe(takeUntil(this.destroyed$))
        //     .subscribe((isPublic) => (this.showNotPublicWarning = !isPublic));
    }

    private async copy(): Promise<void> {
        UIHelper.copyElementToClipboard(this.textareaRef.nativeElement);
        this.toast.show({
            message: 'EMBED.COPIED_TO_CLIPBOARD_NOTICE',
            type: 'info',
            subtype: ToastType.InfoSimple,
        });
    }

    private getEmbedCode(values: any): string {
        const node = this.data.node;
        // We use `createElement` to have attributes sanitized. Note that occurrences of `&` in the
        // attribute `src` are rightfully escaped to `&amp;`.
        const iFrame = document.createElement('iframe');
        iFrame.src = this.getEmbedLink(node, values.version);
        iFrame.title = RestHelper.getTitle(node);
        iFrame.width = values.width;
        iFrame.height = values.height;
        iFrame.frameBorder = '0';
        iFrame.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
        return iFrame.outerHTML;
    }

    private getEmbedLink(node: Node, version: 'fixed' | 'newest'): string {
        const routerLink = 'eduservlet/render';
        const queryParams = {
            node_id: node.ref.id,
            version: version === 'fixed' ? node.content.version : null,
            // Currently, `RenderingServlet` only supports local nodes. Uncomment, when other
            // repositories become supported.
            //
            // repository: node.ref.isHomeRepo ? null : node.ref.repo,
        };
        const urlTree = this.router.createUrlTree([routerLink], { queryParams });
        return location.origin + this.location.prepareExternalUrl(urlTree.toString());
    }
}
