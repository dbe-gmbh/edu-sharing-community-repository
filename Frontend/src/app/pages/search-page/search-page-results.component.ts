import { Component, OnInit, ViewChild } from '@angular/core';
import { Scope } from '../../core-ui-module/option-item';
import { NodeEntriesDisplayType } from '../../features/node-entries/entries-model';
import { ActionbarComponent } from '../../shared/components/actionbar/actionbar.component';
import { SearchPageResultsService } from './search-page-results.service';
import { SearchPageService } from './search-page.service';

@Component({
    selector: 'es-search-page-results',
    templateUrl: './search-page-results.component.html',
    styleUrls: ['./search-page-results.component.scss'],
    providers: [SearchPageResultsService],
})
export class SearchPageResultsComponent implements OnInit {
    readonly Scope = Scope;
    readonly NodeEntriesDisplayType = NodeEntriesDisplayType;

    @ViewChild(ActionbarComponent)
    set _actionbar(value: ActionbarComponent) {
        // Avoid changed-after-checked error.
        setTimeout(() => (this.actionbar = value));
    }
    actionbar: ActionbarComponent;

    readonly resultsDataSource = this.results.resultsDataSource;
    readonly collectionsDataSource = this.results.collectionsDataSource;
    readonly resultColumns = this.results.resultColumns;
    readonly collectionColumns = this.results.collectionColumns;
    readonly sortConfig = this.results.sortConfig;
    readonly addToCollectionMode = this.searchPage.addToCollectionMode;

    constructor(private searchPage: SearchPageService, private results: SearchPageResultsService) {}

    ngOnInit(): void {
        setTimeout(() => {
            this.searchPage.results = this.results;
            this.searchPage.showingAllRepositories.next(false);
        });
    }
}
