import { Injectable, Injector, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MdsDefinition, MdsService, MetadataSetInfo, SearchService } from 'ngx-edu-sharing-api';
import * as rxjs from 'rxjs';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ListItem, Node, Repository, RestConstants } from '../../core-module/core.module';
import { MdsHelper } from '../../core-module/rest/mds-helper';
import {
    fromSearchResults,
    NodeDataSourceRemote,
    NodeRemote,
    NodeRequestParams,
} from '../../features/node-entries/node-data-source-remote';
import { SearchPageResults } from './search-page-results.service';
import { SearchPageService } from './search-page.service';

interface RepoData {
    title: string;
    id: string;
    dataSource: NodeDataSourceRemote;
    columns: Observable<ListItem[]>;
    loadingParams: Observable<boolean>;
    loadingContent: Observable<boolean>;
}

@Injectable()
export class SearchPageResultsAllService implements SearchPageResults, OnDestroy {
    readonly repoData = new BehaviorSubject<RepoData[]>(null);
    readonly loadingProgress = new BehaviorSubject<number>(0);

    private readonly _destroyed = new Subject<void>();

    constructor(
        private _injector: Injector,
        private _search: SearchService,
        private _searchPage: SearchPageService,
        private _mds: MdsService,
        private _translate: TranslateService,
    ) {
        this._initRepoData();
        this._registerLoadingProgress();
    }

    ngOnDestroy(): void {
        this._destroyed.next();
        this._destroyed.complete();
    }

    private _initRepoData() {
        this._searchPage.availableRepositories
            .pipe(takeUntil(this._destroyed))
            .subscribe((repositories) => {
                this.repoData.next(repositories.map((repository) => this._getRepoData(repository)));
            });
    }

    private _getRepoData(repository: Repository): RepoData {
        const loadingParams = new BehaviorSubject(true);
        const loadingContent = new BehaviorSubject(true);
        const dataSource = new NodeDataSourceRemote(this._injector);
        const metadataSet: Observable<MetadataSetInfo> = this._getMetadataSet(repository);
        const mdsDefinition: Observable<MdsDefinition> = metadataSet.pipe(
            switchMap((metadataSet) => this._getMdsDefinition(repository, metadataSet)),
        );
        const columns: Observable<ListItem[]> = mdsDefinition.pipe(
            switchMap((mdsDefinition) => this._getColumns(mdsDefinition)),
        );
        rxjs.combineLatest([metadataSet, this._searchPage.searchString.observeValue()])
            .pipe(
                tap(() => loadingParams.next(false)),
                takeUntil(this._destroyed),
            )
            .subscribe(([metadataSet, searchString]) => {
                dataSource.setRemote(
                    this._getSearchRemote(repository, metadataSet, searchString, loadingContent),
                );
            });
        return {
            title: repository.title,
            id: repository.id,
            dataSource,
            columns,
            loadingParams,
            loadingContent,
        };
    }

    private _getMetadataSet(repository: Repository): Observable<MetadataSetInfo> {
        return this._searchPage.getAvailableMetadataSets(repository).pipe(
            takeUntil(this._destroyed),
            map((availableMetadataSets) => availableMetadataSets[0]),
        );
    }

    private _getMdsDefinition(
        repository: Repository,
        metadataSet: MetadataSetInfo,
    ): Observable<MdsDefinition> {
        return this._mds.getMetadataSet({ repository: repository.id, metadataSet: metadataSet.id });
    }

    private _getColumns(mdsDefinition: MdsDefinition): Observable<ListItem[]> {
        return (
            this._translate
                // Make sure translations are initialized when MdsHelper calls `instant`.
                .get('dummy')
                .pipe(map(() => MdsHelper.getColumns(this._translate, mdsDefinition, 'search')))
        );
    }

    private _getSearchRemote(
        repository: Repository,
        metadataSet: MetadataSetInfo,
        searchString: string,
        loadingContent: Subject<boolean>,
    ): NodeRemote<Node> {
        const criteria = searchString ? [{ property: 'ngsearchword', values: [searchString] }] : [];
        return (request: NodeRequestParams) => {
            loadingContent.next(true);
            return this._search
                .search({
                    body: {
                        criteria,
                        // permissions: this.reUrl.value ? [RestConstants.ACCESS_CC_PUBLISH] : [],
                    },
                    maxItems: request.range.endIndex - request.range.startIndex,
                    skipCount: request.range.startIndex,
                    sortAscending: request.sort ? [request.sort.direction === 'asc'] : null,
                    sortProperties: request.sort ? [request.sort.active] : null,
                    contentType: 'FILES',
                    repository: repository.id,
                    metadataset: metadataSet.id,
                    query: RestConstants.DEFAULT_QUERY_NAME,
                    propertyFilter: [RestConstants.ALL],
                })
                .pipe(
                    map(fromSearchResults),
                    tap(() => loadingContent.next(false)),
                );
        };
    }

    private _registerLoadingProgress(): void {
        this.repoData
            .pipe(
                switchMap((repoData) =>
                    rxjs.combineLatest([
                        rxjs.combineLatest(repoData.map((r) => r.loadingParams)),
                        rxjs.combineLatest(repoData.map((r) => r.loadingContent)),
                    ]),
                ),
                map(([loadingParams, loadingContent]) => {
                    const loadingParamsFinished = loadingParams.filter(isFalse).length;
                    const loadingContentFinished = loadingContent.filter(isFalse).length;
                    if (loadingParamsFinished === 0) {
                        return 10;
                    } else if (loadingParamsFinished < loadingParams.length) {
                        return (loadingParamsFinished / loadingParams.length) * 30 + 10;
                    } else {
                        return (loadingContentFinished / loadingContent.length) * 60 + 40;
                    }
                }),
                distinctUntilChanged(),
                // tap((progress) => console.log('progress', progress)),
            )
            .subscribe(this.loadingProgress);
    }
}

function isFalse(value: boolean): boolean {
    return value === false;
}
