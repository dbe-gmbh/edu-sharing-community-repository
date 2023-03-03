import { Injectable } from '@angular/core';
import { SearchConfig } from 'ngx-edu-sharing-api';
import { BehaviorSubject } from 'rxjs';
import {
    ListSortConfig,
    NodeEntriesDisplayType,
} from 'src/app/features/node-entries/entries-model';
import { NodeDataSource } from 'src/app/features/node-entries/node-data-source';
import { SearchFieldService } from 'src/app/main/navigation/search-field/search-field.service';
import { ListItem, Node } from '../../core-module/core.module';
import { CombinedDataSource } from '../../features/node-entries/combined-data-source';
import { Values } from '../../features/mds/types/types';

/**
 * Session state for search.component.
 *
 * The service is provided by app.module. Member variables are almost exclusively used by
 * search.component with the exception of `reinit`, which is set by node-render.component.
 */
@Injectable()
export class SearchService {
    searchTermSubject = new BehaviorSubject<string>('');
    get searchTerm(): string {
        return this.searchTermSubject.value;
    }
    set searchTerm(value: string) {
        this.searchTermSubject.next(value);
    }
    values: Values;
    dataSourceSearchResultAll = new CombinedDataSource<Node>([]);
    dataSourceSearchResult: NodeDataSource<Node>;
    searchResultRepositories: Node[][] = [];
    dataSourceCollections = new NodeDataSource<Node>();
    columns: ListItem[] = [];
    collectionsColumns: ListItem[] = [];
    ignored: Array<string> = [];
    reurl: string;
    autocompleteData: any = [];
    numberofresults: number = 0;
    offset: number = 0;
    complete: boolean = false;
    mdsInitialized: boolean = false;
    showchosenfilters: boolean = false;
    displayType: NodeEntriesDisplayType = null;
    // Used by node-render.component
    reinit = true;
    sidenavSet = false;
    sidenavOpened$ = new BehaviorSubject(false);
    isFrontpage: boolean;
    set sidenavOpened(value: boolean) {
        this.sidenavOpened$.next(value);
    }
    get sidenavOpened(): boolean {
        return this.sidenavOpened$.value;
    }
    ex: boolean;
    sort: ListSortConfig;
    extendedSearchUsed = false;

    private readonly searchConfigSubject = new BehaviorSubject<Partial<SearchConfig>>({});

    constructor(private searchField: SearchFieldService) {
        this.searchConfigSubject.pipe().subscribe((config) => {
            const { repository, metadataSet } = config;
            if (repository && metadataSet) {
                // this.searchField.setMdsInfo({ repository, metadataSet });
            }
        });
    }

    clear() {
        this.searchTerm = '';
    }

    init() {
        if (!this.reinit) {
            return;
        }
        this.offset = 0;
        this.dataSourceSearchResult = new NodeDataSource<Node>();
        this.dataSourceSearchResult.isLoading = true;
        this.dataSourceCollections.reset();
        this.searchResultRepositories = [];
        this.complete = false;
    }

    setRepository(repository: string): void {
        if (this.searchConfigSubject.value.repository !== repository) {
            this.searchConfigSubject.next({ ...this.searchConfigSubject.value, repository });
        }
    }

    setMetadataSet(metadataSet: string): void {
        if (this.searchConfigSubject.value.metadataSet !== metadataSet) {
            this.searchConfigSubject.next({ ...this.searchConfigSubject.value, metadataSet });
        }
    }
}
