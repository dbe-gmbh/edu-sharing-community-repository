import { SelectionModel } from '@angular/cdk/collections';
import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import {
    FetchEvent,
    GridConfig,
    InteractionType,
    ListDragGropConfig,
    ListEventInterface,
    ListOptions,
    ListSortConfig,
    NodeClickEvent,
    NodeEntriesDataType,
    NodeEntriesDisplayType,
} from '../node-entries/entries-model';
import { NodeDataSource } from '../node-entries/node-data-source';
import {
    NodeEntriesGlobalService,
    PaginationStrategy,
} from '../node-entries/node-entries-global.service';

import { OptionItem, Scope } from '../types/option-item';
import { ListItem } from '../types/list-item';
import { UIService } from './ui.service';
import { NodeDataSourceRemote } from '../node-entries/node-data-source-remote';

@Injectable()
export class NodeEntriesService<T extends NodeEntriesDataType> {
    list: ListEventInterface<T>;
    readonly dataSource$ = new BehaviorSubject<NodeDataSource<T> | null>(null);
    /**
     * scope the current list is in, e.g. workspace
     * This is used for additional config injection based on the scope
     */
    scope: Scope;
    get dataSource(): NodeDataSource<T> {
        return this.dataSource$.value;
    }
    set dataSource(value: NodeDataSource<T>) {
        this.dataSource$.next(value);
    }
    get paginationStrategy(): PaginationStrategy {
        return this.entriesGlobal.getPaginationStrategy(this.scope);
    }
    /**
     * Subject that reflects the current columns configuration.
     *
     * Updated when loading configuration and through user interaction.
     */
    columnsSubject = new BehaviorSubject<ListItem[]>(null);
    get columns(): ListItem[] {
        return this.columnsSubject.value;
    }
    set columns(value: ListItem[]) {
        this.columnsSubject.next(value);
    }
    configureColumns: boolean;
    /** Emits when the columns configuration changes through user interaction. */
    columnsChange: EventEmitter<ListItem[]>;
    displayType: NodeEntriesDisplayType;
    selection = new SelectionModel<T>(true, []);
    elementInteractionType: InteractionType;
    options$ = new BehaviorSubject<ListOptions>(null);
    get options() {
        return this.options$.value;
    }
    set options(options: ListOptions) {
        this.options$.next(options);
    }
    checkbox: boolean;
    globalOptions: OptionItem[];
    sortSubject = new BehaviorSubject<ListSortConfig>(void 0);
    get sort(): ListSortConfig {
        return this.sortSubject.value;
    }
    set sort(value: ListSortConfig) {
        this.sortSubject.next(value);
    }
    sortChange: EventEmitter<ListSortConfig>;
    dragDrop: ListDragGropConfig<T>;
    clickItem: EventEmitter<NodeClickEvent<T>>;
    dblClickItem: EventEmitter<NodeClickEvent<T>>;
    fetchData: EventEmitter<FetchEvent>;
    readonly gridConfig$ = new BehaviorSubject<GridConfig | null>(null);
    get gridConfig(): GridConfig {
        return this.gridConfig$.value;
    }
    set gridConfig(value: GridConfig) {
        this.gridConfig$.next(value);
    }
    primaryInstance: boolean;
    singleClickHint: 'dynamic' | 'static';
    disableInfiniteScroll: boolean;

    constructor(private uiService: UIService, private entriesGlobal: NodeEntriesGlobalService) {}

    onClicked({ event, ...data }: NodeClickEvent<T> & { event: MouseEvent }) {
        if (event.ctrlKey || event.metaKey) {
            this.selection.toggle(data.element);
        } else if (event.shiftKey) {
            this.expandSelectionTo(data.element);
        } else {
            this.clickItem.emit(data);
        }
    }

    onCheckboxChanged(node: T, checked: boolean) {
        console.log(node, checked, this.uiService.shiftKeyPressed);
        if (this.uiService.shiftKeyPressed) {
            this.expandSelectionTo(node);
        }

        if (checked !== this.selection.isSelected(node)) {
            this.selection.toggle(node);
        }
    }

    toggleSelectAll() {
        if (this.isAllSelected()) {
            this.selection.clear();
        } else {
            this.selectAll();
        }
    }

    loadMore(source: 'button' | 'scroll'): boolean {
        if (this.paginationStrategy !== 'infinite-scroll') {
            return false;
        }
        if (source === 'scroll' && this.disableInfiniteScroll) {
            return false;
        }
        // TODO: focus next item when triggered via button.
        if (this.dataSource instanceof NodeDataSourceRemote) {
            return (this.dataSource as NodeDataSourceRemote).loadMore();
        } else {
            if (this.dataSource.hasMore()) {
                this.fetchData.emit({
                    offset: this.dataSource.getData().length,
                    reset: false,
                });
                return true;
            } else {
                return false;
            }
        }
    }

    private selectAll() {
        this.selection.select(...this.dataSource.getData());
    }

    private isAllSelected(): boolean {
        return this.dataSource.getData().every((node) => this.selection.isSelected(node));
    }

    private expandSelectionTo(node: T) {
        const nodeIndex = this.dataSource.getData().indexOf(node);
        const selectionIndexes = this.selection.selected
            .map((node) => this.dataSource.getData().indexOf(node))
            .filter((index) => index >= 0);
        if (Math.min(...selectionIndexes) < nodeIndex) {
            for (let i = Math.min(...selectionIndexes) + 1; i <= nodeIndex; i++) {
                this.selection.select(this.dataSource.getData()[i]);
            }
        } else if (Math.max(...selectionIndexes) > nodeIndex) {
            for (let i = nodeIndex; i < Math.max(...selectionIndexes); i++) {
                this.selection.select(this.dataSource.getData()[i]);
            }
        }
    }
}