import { Injectable } from '@angular/core';
import { CanDeactivate, NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CardDialogService } from './card-dialog/card-dialog.service';

@Injectable({
    providedIn: 'root',
})
export class DialogsNavigationGuard implements CanDeactivate<unknown> {
    private restoreState: NavigationStart['restoredState'] | null;

    constructor(private cardDialog: CardDialogService, router: Router) {
        router.events
            .pipe(filter((event): event is NavigationStart => event instanceof NavigationStart))
            .subscribe((event) => {
                this.restoreState = event.restoredState;
            });
    }

    /**
     * Handles dialogs when navigating to other pages or changing query parameters.
     *
     * @returns `false` when navigation should be canceled so we stay on the old page.
     */
    canDeactivate(): boolean {
        const openDialogs = this.cardDialog.openDialogs;
        if (this.restoreState) {
            // The user tried to navigate back or forward.
            //
            // Try to close the top-most open dialog.
            const topMostDialog = openDialogs[openDialogs.length - 1];
            topMostDialog?.tryCancel('navigation');
            // Return `true` if there are no open dialogs.
            return !topMostDialog;
        } else {
            // We are navigating to a new page. Dialogs should not provide any options to navigate
            // to other pages. This should currently only happen when the user was auto logged out
            // and is directed to the login page.
            //
            // Force-close all dialogs.
            for (const dialog of openDialogs.slice().reverse()) {
                dialog.close(null);
            }
            return true;
        }
    }
}