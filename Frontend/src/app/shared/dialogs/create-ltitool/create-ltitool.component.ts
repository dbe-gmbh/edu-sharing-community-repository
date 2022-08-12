import {
    ApplicationRef,
    Component,
    EventEmitter,
    Input,
    NgZone,
    OnInit,
    Output,
} from '@angular/core';
import { Tool } from 'ngx-edu-sharing-api';
import { DialogButton } from '../../../core-module/ui/dialog-button';
import {
    Node,
    NodeWrapper,
    RestConstants,
    RestHelper,
    RestNodeService,
} from '../../../core-module/core.module';
import { NodeHelperService } from '../../../core-ui-module/node-helper.service';

@Component({
    selector: 'es-create-ltitool',
    templateUrl: './create-ltitool.component.html',
    styleUrls: ['./create-ltitool.component.scss'],
})
export class CreateLtitoolComponent implements OnInit {
    public _tool: Tool;
    public _parent: Node;
    buttons: DialogButton[];
    @Output() onCancel = new EventEmitter();
    @Output() onCreate = new EventEmitter();
    public _name = '';
    public _nodeIds: string[];
    public _titles: string[];
    nodes: Node[] = [];

    constructor(
        private ngZone: NgZone,
        private nodeService: RestNodeService,
        private nodeHelper: NodeHelperService,
    ) {
        this.buttons = [
            new DialogButton('CANCEL', { color: 'standard' }, () => this.cancel()),
            new DialogButton('CREATE', { color: 'primary' }, () => this.create()),
        ];
        (window as any)['angularComponentReference'] = {
            component: this,
            zone: this.ngZone,
            loadAngularFunction: (nodeIds: string[], titles: string[]) =>
                this.angularFunctionCalled(nodeIds, titles),
        };
    }

    ngOnInit(): void {}

    @Input() set tool(tool: Tool) {
        this._tool = tool;
    }

    @Input() set parent(parent: Node) {
        this._parent = parent;
    }

    public cancel() {
        this.onCancel.emit({ nodes: this.nodes });
    }

    public create() {
        if (!this.nodes) {
            return;
        }
        this.onCreate.emit({ nodes: this.nodes });
    }

    public open() {
        /*window.open(
            '/edu-sharing/rest/ltiplatform/v13/generateLoginInitiationForm?appId=' +
                this._tool.appId +
                '&parentId=' +
                this._parent.ref.id,
            '_blank',
        );*/

        this.angularFunctionCalled(
            ['c6a08ed2-3962-41e7-81d5-a5a6fa691aae', '8b8b4d14-7b35-4de9-8ff2-a67336f63f92'],
            ['citroen-e-berlingo-xl-siebensitzer2.jpg', 'Diff_ProtokollJob_Stadt Wesel.png'],
        );
    }

    public angularFunctionCalled(nodeIds: string[], titles: string[]) {
        console.log('js function called ' + nodeIds + ' titles:' + titles + ' test');
        this._name = titles[0];

        let idx = 0;
        nodeIds.forEach((nodeId) => {
            let node = new Node();
            node.ref.id = nodeId;
            node.name = titles[idx];
            this.nodes[idx] = node;
            idx++;
        });
        console.log(this.nodes);
    }
}
