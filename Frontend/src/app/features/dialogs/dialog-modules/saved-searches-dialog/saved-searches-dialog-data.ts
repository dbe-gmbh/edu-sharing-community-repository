import { SavedSearch } from 'ngx-edu-sharing-api';
import { SaveSearchDialogData } from '../save-search-dialog/save-search-dialog-data';

export interface SavedSearchesDialogData {
    saveSearchData: SaveSearchDialogData;
    reUrl?: string;
}

export type SavedSearchesDialogResult = SavedSearch | null;
