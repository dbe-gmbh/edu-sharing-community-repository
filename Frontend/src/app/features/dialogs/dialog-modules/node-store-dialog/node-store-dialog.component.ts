import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Node, NodeListService, SortPolicy } from 'ngx-edu-sharing-api';
import { BehaviorSubject, Subject } from 'rxjs';
import { switchMap, takeUntil } from 'rxjs/operators';
import {
    ListItem,
    ListItemSort,
    RestConstants,
    UIConstants,
    UIService,
} from '../../../../core-module/core.module';
import { CustomOptions, DefaultGroups, OptionItem } from '../../../../core-ui-module/option-item';
import { Toast } from '../../../../core-ui-module/toast';
import { ActionbarComponent } from '../../../../shared/components/actionbar/actionbar.component';
import {
    InteractionType,
    ListSortConfig,
    NodeEntriesDisplayType,
} from '../../../node-entries/entries-model';
import { NodeDataSource } from '../../../node-entries/node-data-source';
import { NodeEntriesWrapperComponent } from '../../../node-entries/node-entries-wrapper.component';
import { configForNodes } from '../../card-dialog/card-dialog-config';
import { CardDialogRef } from '../../card-dialog/card-dialog-ref';

@Component({
    selector: 'es-search-node-store-dialog',
    templateUrl: 'node-store-dialog.component.html',
    styleUrls: ['node-store-dialog.component.scss'],
})
export class SearchNodeStoreDialogComponent implements OnInit, AfterViewInit, OnDestroy {
    readonly NodeEntriesDisplayType = NodeEntriesDisplayType;
    readonly InteractionType = InteractionType;

    @ViewChild(NodeEntriesWrapperComponent) nodeEntries: NodeEntriesWrapperComponent<Node>;
    @ViewChild(ActionbarComponent) actionBar: ActionbarComponent;

    columns: ListItem[] = [];
    // buttons = DialogButton.getSingleButton('CLOSE', () => this.cancel(), 'standard');
    list = new NodeDataSource<Node>();

    readonly sortPolicySubject = new BehaviorSubject<ListSortConfig & SortPolicy>({
        allowed: true,
        active: RestConstants.LOM_PROP_TITLE,
        direction: 'asc',
        columns: [new ListItemSort('NODE', RestConstants.LOM_PROP_TITLE)],
    });
    private options: CustomOptions = {
        useDefaultOptions: true,
        supportedOptions: ['OPTIONS.DOWNLOAD'],
        addOptions: this.getAdditionalOptions(),
    };
    private selected: Node[] = [];
    private readonly destroyed = new Subject<void>();

    constructor(
        private dialogRef: CardDialogRef,
        private toast: Toast,
        private router: Router,
        private nodeList: NodeListService,
        private translate: TranslateService,
        private ui: UIService,
    ) {
        this.columns.push(new ListItem('NODE', RestConstants.LOM_PROP_TITLE));
    }

    ngOnInit(): void {
        this.dialogRef.patchState({ isLoading: true });
        this.registerNodeList();
    }

    ngAfterViewInit(): void {
        this.nodeEntries.initOptionsGenerator({
            actionbar: this.actionBar,
            customOptions: this.options,
        });
        this.nodeEntries
            .getSelection()
            .changed.pipe(takeUntil(this.destroyed))
            .subscribe((selectionChange) => this.onSelection(selectionChange.source.selected));
    }

    ngOnDestroy(): void {
        this.destroyed.next();
        this.destroyed.complete();
    }

    private setSelection(node: Node): void {
        const selection = this.nodeEntries.getSelection();
        selection.clear();
        selection.select(node);
    }

    onClick(node: Node): void {
        if (this.ui.isMobile()) {
            this.openNode(node);
        } else {
            this.setSelection(node);
        }
    }

    openNode(node: Node) {
        this.router.navigate([UIConstants.ROUTER_PREFIX + 'render', node.ref.id], {
            state: {
                nodes: this.list.getData(),
                scope: 'node-store',
            },
        });
    }

    onSelection(data: Node[]) {
        this.selected = data;
    }

    changeSort(config: ListSortConfig) {
        this.sortPolicySubject.next({ ...config, direction: config.direction || 'asc' });
    }

    private getAdditionalOptions() {
        const remove = new OptionItem('SEARCH.NODE_STORE.REMOVE_ITEM', 'delete', () => {
            this.deleteSelection();
        });
        remove.group = DefaultGroups.FileOperations;
        return [remove];
    }

    private deleteSelection() {
        this.dialogRef.patchState({ isLoading: true });
        this.nodeList
            .removeFromNodeList(
                RestConstants.NODE_STORE_LIST,
                this.selected.map((node) => node.ref.id),
            )
            .subscribe(() => {
                this.toast.toast('SEARCH.NODE_STORE.REMOVED_ITEMS', {
                    count: this.selected.length,
                });
                this.nodeEntries.getSelection().clear();
            });
    }

    private registerNodeList(): void {
        this.sortPolicySubject
            .pipe(
                switchMap((sortPolicy) =>
                    this.nodeList.observeNodeList(RestConstants.NODE_STORE_LIST, {
                        propertyFilter: [RestConstants.ALL],
                        sortPolicies: [sortPolicy],
                    }),
                ),
            )
            .subscribe({
                next: (nodes) => {
                    this.list.setData(nodes.nodes);
                    configForNodes(nodes.nodes, this.translate).subscribe((config) =>
                        this.dialogRef.patchConfig(config),
                    );
                    this.dialogRef.patchState({ isLoading: false });
                },
                error: () => {
                    this.dialogRef.patchState({ isLoading: false });
                },
            });
    }
}
