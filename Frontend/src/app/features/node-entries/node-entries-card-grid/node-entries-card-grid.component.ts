import { CdkDragEnter, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    Input,
    NgZone,
    OnChanges,
    OnInit,
    QueryList,
    SimpleChanges,
    ViewChild,
    ViewChildren,
} from '@angular/core';
import { Node } from 'ngx-edu-sharing-api';
import * as rxjs from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, map, switchMap, take } from 'rxjs/operators';
import { ListItemSort, RestConstants, UIService } from '../../../core-module/core.module';
import { NodeEntriesService } from '../../../core-ui-module/node-entries.service';
import { Target } from '../../../core-ui-module/option-item';
import { DragData } from '../../../services/nodes-drag-drop.service';
import { SortEvent } from '../../../shared/components/sort-dropdown/sort-dropdown.component';
import { NodeEntriesDisplayType } from '../entries-model';
import { NodeEntriesTemplatesService } from '../node-entries-templates.service';

@Component({
    selector: 'es-node-entries-card-grid',
    templateUrl: 'node-entries-card-grid.component.html',
    styleUrls: ['node-entries-card-grid.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodeEntriesCardGridComponent<T extends Node> implements OnInit, OnChanges {
    readonly NodeEntriesDisplayType = NodeEntriesDisplayType;
    readonly Target = Target;
    @ViewChildren(CdkDropList) dropListsQuery: QueryList<CdkDropList>;
    @ViewChild('grid') gridRef: ElementRef;
    @ViewChildren('item', { read: ElementRef }) itemRefs: QueryList<ElementRef<HTMLElement>>;
    @Input() displayType: NodeEntriesDisplayType;

    isDragging = false; // Drag-and-drop, not rearrange
    dropLists: CdkDropList[];
    /**
     * Whether the number of shown items is limited by `gridConfig.maxRows`.
     *
     * A value of `true` does not mean, that there would be more items available.
     */
    visibleItemsLimited = false;

    private readonly nodes$ = this.entriesService.dataSource$.pipe(
        switchMap((dataSource) => dataSource?.connect()),
    );
    private readonly maxRows$ = this.entriesService.gridConfig$.pipe(
        map((gridConfig) => gridConfig?.maxRows || null),
        distinctUntilChanged(),
    );
    private readonly itemsPerRowSubject = new BehaviorSubject<number | null>(null);
    readonly visibleNodes$ = rxjs
        .combineLatest([
            this.nodes$,
            this.itemsPerRowSubject.pipe(distinctUntilChanged()),
            this.maxRows$,
        ])
        .pipe(
            map(([nodes, itemsPerRow, maxRows]) =>
                this.getVisibleNodes(nodes, itemsPerRow, maxRows),
            ),
        );
    private globalCursorStyle: HTMLStyleElement;

    constructor(
        public entriesService: NodeEntriesService<T>,
        public templatesService: NodeEntriesTemplatesService,
        public ui: UIService,
        private ngZone: NgZone,
    ) {}

    ngOnInit(): void {
        this.registerVisibleItemsLimited();
    }

    ngOnChanges(changes: SimpleChanges): void {}

    changeSort(sort: SortEvent) {
        this.entriesService.sort.active = sort.name;
        this.entriesService.sort.direction = sort.ascending ? 'asc' : 'desc';
        this.entriesService.sortChange.emit(this.entriesService.sort);
    }

    loadData(byButtonClick = false) {
        // @TODO: Maybe this is better handled in a more centraled service
        if (!byButtonClick) {
            // check if there is a footer
            const elements = document.getElementsByTagName('footer');
            if (elements.length && elements.item(0).innerHTML.trim()) {
                return;
            }
        }
        if (this.entriesService.dataSource.hasMore()) {
            this.entriesService.fetchData.emit({
                offset: this.entriesService.dataSource.getData().length,
            });
        }
        if (byButtonClick) {
            this.focusFirstNewItemWhenLoaded();
        }
    }

    onCustomSortingInProgressChange() {
        this.entriesService.sortChange.emit(this.entriesService.sort);
        setTimeout(() => {
            this.refreshDropLists();
        });
    }

    onRearrangeDragEntered($event: CdkDragEnter) {
        moveItemInArray(
            this.entriesService.dataSource.getData(),
            $event.item.data,
            $event.container.data,
        );
        // `CdkDrag` doesn't really want us to rearrange the items while dragging. Its cached
        // element positions get out of sync unless we update them manually.
        this.ngZone.runOutsideAngular(() =>
            setTimeout(() => this.dropLists?.forEach((list) => list._dropListRef['_cacheItems']())),
        );
    }

    onRearrangeDragStarted() {
        this.globalCursorStyle = document.createElement('style');
        document.body.appendChild(this.globalCursorStyle);
        this.globalCursorStyle.innerHTML = `* {cursor: grabbing !important; }`;
    }

    onRearrangeDragEnded() {
        document.body.removeChild(this.globalCursorStyle);
        this.globalCursorStyle = null;
    }

    getDragStartDelay(): number {
        if (this.ui.isMobile()) {
            return 500;
        } else {
            return null;
        }
    }

    private registerVisibleItemsLimited() {
        this.maxRows$.subscribe((maxRows) => {
            this.visibleItemsLimited = maxRows > 0;
        });
    }

    private refreshDropLists() {
        this.dropLists = this.dropListsQuery.toArray();
    }

    private focusFirstNewItemWhenLoaded() {
        const oldLength = this.itemRefs.length;
        this.itemRefs.changes
            .pipe(take(1))
            .subscribe((items: NodeEntriesCardGridComponent<T>['itemRefs']) => {
                if (items.length > oldLength) {
                    this.focusOnce(items.get(oldLength).nativeElement);
                }
            });
    }

    private focusOnce(element: HTMLElement): void {
        element.setAttribute('tabindex', '-1');
        element.focus();
        element.addEventListener('blur', () => element.removeAttribute('tabindex'), { once: true });
    }

    onGridSizeChanges(): void {
        const itemsPerRow = this.getItemsPerRow();
        this.itemsPerRowSubject.next(itemsPerRow);
    }

    private getItemsPerRow(): number | null {
        if (!this.gridRef?.nativeElement) {
            return null;
        }
        return getComputedStyle(this.gridRef.nativeElement)
            .getPropertyValue('grid-template-columns')
            .split(' ').length;
    }

    private getVisibleNodes(nodes: T[], itemsPerRow: number | null, maxRows: number | null): T[] {
        if (maxRows > 0 && itemsPerRow !== null) {
            const count = itemsPerRow * maxRows;
            this.entriesService.dataSource.setDisplayCount(count);
            return nodes.slice(0, this.entriesService.dataSource.getDisplayCount());
        } else {
            this.entriesService.dataSource.setDisplayCount();
            return nodes;
        }
    }

    getSortColumns() {
        return this.entriesService.sort?.columns?.filter((c) => {
            const result = this.entriesService.columns
                .concat(
                    new ListItemSort('NODE', 'score'),
                    new ListItemSort('NODE', RestConstants.CCM_PROP_COLLECTION_ORDERED_POSITION),
                    new ListItemSort('NODE', RestConstants.CM_PROP_TITLE),
                    new ListItemSort('NODE', RestConstants.CM_NAME),
                    new ListItemSort('NODE', RestConstants.CM_MODIFIED_DATE),
                )
                .some((c2) => c2.name === c.name);
            if (!result) {
                console.warn(
                    'Sort field ' +
                        c.name +
                        ' was specified but is not present as a column. It will be ignored. Please also configure this field in the <lists> section',
                );
            }
            return result;
        });
    }

    canDropNodes = (dragData: DragData<T>) => this.entriesService.dragDrop.dropAllowed?.(dragData);

    onNodesDropped(dragData: DragData<Node>) {
        this.entriesService.dragDrop.dropped(dragData.target, {
            element: dragData.draggedNodes,
            mode: dragData.action,
        });
    }

    getDragEnabled(): boolean {
        return this.entriesService.dragDrop?.dragAllowed && !this.ui.isMobile();
    }

    getDragData(node: T): T[] {
        const selection = this.entriesService.selection;
        if (selection.isSelected(node)) {
            return selection.selected;
        } else {
            return [node];
        }
    }

    onDragStarted(node: T) {
        if (!this.entriesService.selection.isSelected(node)) {
            this.entriesService.selection.clear();
            this.entriesService.selection.select(node);
        }
        this.isDragging = true;
    }

    onDragEnded() {
        this.isDragging = false;
    }
}
