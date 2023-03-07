import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnChanges,
    OnInit,
    SimpleChanges,
} from '@angular/core';
import { ListItem, ProposalNode, RestConstants } from 'src/app/core-module/core.module';
import { NodeHelperService } from 'src/app/core-ui-module/node-helper.service';
import { ListWidget } from '../list-widget';
import { MdsService, Node, Organization } from 'ngx-edu-sharing-api';
import { MdsHelper } from '../../../core-module/rest/mds-helper';
import { BehaviorSubject, merge } from 'rxjs';
import { switchMap } from 'rxjs/internal/operators';

@Component({
    selector: 'es-list-text',
    templateUrl: './list-text.component.html',
    styleUrls: ['./list-text.component.scss'],
})
export class ListTextComponent extends ListWidget implements OnInit {
    static supportedItems = [
        new ListItem('NODE', '*'),
        new ListItem('NODE_PROPOSAL', '*'),
        new ListItem('COLLECTION', '*'),
        new ListItem('ORG', '*'),
        new ListItem('GROUP', '*'),
        new ListItem('USER', '*'),
    ];
    readonly DATE_FIELDS = RestConstants.DATE_FIELDS;
    readonly VCARD_FIELDS = RestConstants.getAllVCardFields();
    displayName$ = new BehaviorSubject<string>(null);

    constructor(
        private nodeHelper: NodeHelperService,
        private mds: MdsService,
        private changeDetectorRef: ChangeDetectorRef,
    ) {
        super();
    }

    async ngOnChanges(changes: SimpleChanges) {}

    async ngOnInit() {
        merge([this.nodeSubject, this.itemSubject])
            .pipe(switchMap(() => this.updateDisplayname()))
            .subscribe((displayName) => {});
    }
    getNode() {
        if (this.item.type === 'NODE_PROPOSAL') {
            return (this.node as ProposalNode).proposal;
        } else if ((this.node as Node).type === RestConstants.CCM_TYPE_COLLECTION_PROPOSAL) {
            return (this.node as Node).relations?.Original ?? this.node;
        }
        return this.node;
    }

    isUserProfileAttribute(attribute: string) {
        return (
            [
                RestConstants.AUTHORITY_FIRSTNAME,
                RestConstants.AUTHORITY_LASTNAME,
                RestConstants.AUTHORITY_EMAIL,
            ].indexOf(attribute) !== -1
        );
    }
    getWorkflowStatus() {
        return this.nodeHelper.getWorkflowStatus(this.node as Node).current;
    }

    getI18n(item: ListItem) {
        return (item.type === 'NODE_PROPOSAL' ? 'NODE_PROPOSAL' : 'NODE') + '.' + item.name;
    }

    isDangerousGroup() {
        return (
            (this.node as Organization).authorityName ===
            RestConstants.GROUP_ALFRESCO_ADMINISTRATORS
        );
    }

    private async updateDisplayname() {
        const node = this.getNode() as Node;
        if (!node.properties) {
            this.displayName$.next('');
            return;
        }
        this.displayName$.next(
            node.properties[this.item.name + '_DISPLAYNAME']?.length > 0
                ? node.properties[this.item.name + '_DISPLAYNAME'].join(', ')
                : node.properties[this.item.name]?.join(', '),
        );

        const mds = await this.mds
            .getMetadataSet({
                repository: node.ref.repo,
                metadataSet: node.metadataset || RestConstants.DEFAULT,
            })
            .toPromise();
        const widget = MdsHelper.getWidget(this.item.name, null, mds.widgets);
        if (widget?.values) {
            const i18n = node.properties[this.item.name]
                ?.map((prop) => widget.values.filter((v) => v.id === prop)?.[0]?.caption)
                .filter((cap) => !!cap);
            if (i18n) {
                this.displayName$.next(i18n.join(', '));
            }
        }
    }
}
