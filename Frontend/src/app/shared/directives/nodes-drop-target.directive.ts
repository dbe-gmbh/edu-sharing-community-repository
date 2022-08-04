import { Directive, ElementRef, EventEmitter, Input, NgZone, Output } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { DragData, DropAction, NodesDragDropService } from '../../services/nodes-drag-drop.service';

interface DropTargetState {
    action: DropAction;
    canDrop: CanDrop;
}

export interface CanDrop {
    /** Whether the target is a valid drop target for the dragged nodes and the given action. */
    accept: boolean;
    /** When denied, whether to explicitly mark the target when hovered. */
    denyExplicit?: boolean;
    /** A message to show when tried to drop on a denied target. */
    denyReason?: string;
}

const ACTIVE_DROP_TARGET_ACCEPT_CLASS = 'es-nodes-active-drop-target-accept';
const ACTIVE_DROP_TARGET_DENY_CLASS = 'es-nodes-active-drop-target-deny';

@Directive({
    selector: '[esNodesDropTarget]',
    exportAs: 'esNodesDropTarget',
})
export class NodesDropTargetDirective<T = unknown> {
    @Input('esNodesDropTarget') target: T;
    @Input() canDropNodes: (dragData: DragData<T>) => CanDrop;
    @Output() nodeDropped = new EventEmitter<DragData<T>>();

    get active() {
        return this.activeDropTargetSubject.value;
    }

    private activeDropTargetSubject = new BehaviorSubject<DropTargetState | null>(null);

    constructor(
        private ngZone: NgZone,
        private elementRef: ElementRef<HTMLElement>,
        private nodesDragDrop: NodesDragDropService,
    ) {
        this.registerMouseEnterLeave();
        this.registerActiveDropTarget();
    }

    _setActiveDropTarget(value: DropTargetState | null) {
        this.activeDropTargetSubject.next(value);
    }

    private registerMouseEnterLeave() {
        this.ngZone.runOutsideAngular(() => {
            this.elementRef.nativeElement.addEventListener('mouseenter', () =>
                this.nodesDragDrop.onMouseEnter(this),
            );
            this.elementRef.nativeElement.addEventListener('mouseleave', () =>
                this.nodesDragDrop.onMouseLeave(this),
            );
            // Firefox does not fire a mouseleave event when the element is removed from the DOM
            // while being hovered. When an element is dragged, it will be replaced with a
            // placeholder. If the element was also a drop target, we would think that we are still
            // hovering the element.
            observeRemovedFromParent(this.elementRef.nativeElement).subscribe(() =>
                this.nodesDragDrop.onMouseLeave(this),
            );
        });
    }

    private registerActiveDropTarget() {
        this.activeDropTargetSubject.subscribe((dropTargetState) => {
            const canDrop = dropTargetState?.canDrop;
            const classList = this.elementRef.nativeElement.classList;
            classList.remove(ACTIVE_DROP_TARGET_ACCEPT_CLASS, ACTIVE_DROP_TARGET_DENY_CLASS);
            if (canDrop?.accept) {
                classList.add(ACTIVE_DROP_TARGET_ACCEPT_CLASS);
            } else if (canDrop?.denyExplicit) {
                classList.add(ACTIVE_DROP_TARGET_DENY_CLASS);
            }
        });
    }
}

function observeRemovedFromParent(element: HTMLElement): Observable<void> {
    return new Observable((subscriber) => {
        const observer = new MutationObserver((event) => {
            for (const mutation of event) {
                if ([...mutation.removedNodes].includes(element)) {
                    subscriber.next();
                }
            }
        });
        // Wait for `element` to be attached to the DOM.
        setTimeout(() => {
            observer.observe(element.parentNode, { childList: true, subtree: false });
        });
        return () => {
            observer.disconnect();
        };
    });
}
