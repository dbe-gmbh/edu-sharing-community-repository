import {Component, ContentChild, Input, OnChanges, SimpleChanges, TemplateRef} from '@angular/core';
import {NodeEntriesService} from '../../../node-entries.service';
import {Node} from '../../../../core-module/rest/data-object';
import {NodeHelperService} from '../../../node-helper.service';
import {ColorHelper, PreferredColor} from '../../../../core-module/ui/color-helper';
import {OptionItem, Target} from '../../../option-item';
import {ClickSource, InteractionType} from '../../node-entries-wrapper/entries-model';
import {NodeEntriesTemplatesService} from '../node-entries-templates.service';

@Component({
    selector: 'es-node-entries-card-small',
    templateUrl: 'node-entries-card-small.component.html',
    styleUrls: ['node-entries-card-small.component.scss']
})
export class NodeEntriesCardSmallComponent<T extends Node> implements OnChanges {
    readonly ClickSource = ClickSource;
    readonly InteractionType = InteractionType;
    readonly Target = Target;
    @Input() node: T;
    constructor(
        public entriesService: NodeEntriesService<T>,
        public nodeHelper: NodeHelperService,
        public templatesService: NodeEntriesTemplatesService,
    ) {
    }

    ngOnChanges(changes: SimpleChanges): void {
    }
    optionsOnCard() {
        const options = this.entriesService.options[Target.List];
        const always = options.filter((o) => o.showAlways);
        if (always.some((o) => o.showCallback(this.node))) {
           return always;
        }
        return options.filter((o) => o.showAsAction && o.showCallback(this.node)).slice(0, 3);
    }

    openContextmenu(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
    }
}
