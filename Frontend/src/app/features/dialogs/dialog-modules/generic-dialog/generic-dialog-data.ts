import { ButtonConfig } from '../../../../core-module/ui/dialog-button';
import { CardDialogConfig } from '../../card-dialog/card-dialog-config';

export type GenericDialogConfig<R extends string> = Pick<CardDialogConfig, 'title'> &
    GenericDialogData<R>;

export interface GenericDialogData<R extends string> {
    /** Message text to show in the dialog body. Will be translated. */
    messageText?: string;
    /** Translation parameters for the given message text. */
    messageParameters?: { [key: string]: string };
    /**
     * Buttons to include in the bottom bar of the dialog.
     *
     * Each button closes the dialog when clicked and passes its label to the `after_closed`
     * observable.
     */
    buttons?: GenericDialogButton<R>[];
}

interface GenericDialogButton<R> {
    label: R;
    config: ButtonConfig;
}

export const DELETE_OR_CANCEL: GenericDialogButton<'YES_DELETE' | 'CANCEL'>[] = [
    { label: 'CANCEL', config: { color: 'standard' } },
    { label: 'YES_DELETE', config: { color: 'danger' } },
];

export const YES_OR_NO: GenericDialogButton<'YES' | 'NO'>[] = [
    { label: 'NO', config: { color: 'standard' } },
    { label: 'YES', config: { color: 'primary' } },
];

export const DISCARD_OR_BACK: GenericDialogButton<'DISCARD' | 'BACK'>[] = [
    { label: 'BACK', config: { color: 'standard' } },
    { label: 'DISCARD', config: { color: 'primary' } },
];
