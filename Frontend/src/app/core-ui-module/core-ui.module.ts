import { A11yModule } from '@angular/cdk/a11y';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { NgxSliderModule } from 'ngx-slider-v2';
import { CollectionChooserComponent } from './components/collection-chooser/collection-chooser.component';
import { ListOptionItemComponent } from './components/list-option-item/list-option-item.component';
import { DurationPipe } from './components/video-controls/duration.pipe';
import { VideoControlsComponent } from './components/video-controls/video-controls.component';
import { DistinctClickDirective } from './directives/distinct-click.directive';
import { NodeHelperService } from './node-helper.service';
import { OptionsHelperService } from './options-helper.service';
import { UrlPipe } from './pipes/url.pipe';
import { Toast } from './toast';
import { ImageConfigDirective } from './directives/image-config.directive';
import { ErrorProcessingService } from './error.processing';
import { ToastMessageComponent } from './components/toast-message/toast-message.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NodeEntriesDragDirective } from './directives/node-entries-drag';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { OverlayModule } from '@angular/cdk/overlay';
import { SharedModule } from '../shared/shared.module';
import { MdsNodeRelationsWidgetComponent } from '../common/ui/node-render/node-relations/node-relations-widget.component';
import { ImprintPrivacyComponent } from '../common/ui/imprint-privacy-footer/imprint-privacy.component';

@NgModule({
    declarations: [
        CollectionChooserComponent,
        NodeEntriesDragDirective,
        VideoControlsComponent,
        MdsNodeRelationsWidgetComponent,
        ImprintPrivacyComponent,
        ToastMessageComponent,
        UrlPipe,
        ImageConfigDirective,
        ListOptionItemComponent,
        DistinctClickDirective,
        DurationPipe,
    ],
    imports: [
        SharedModule,
        A11yModule,
        BrowserModule,
        BrowserAnimationsModule,
        FormsModule,
        DragDropModule,
        MatButtonModule,
        MatCardModule,
        MatCheckboxModule,
        MatExpansionModule,
        MatInputModule,
        MatMenuModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatRadioModule,
        MatRippleModule,
        MatSnackBarModule,
        MatTabsModule,
        MatTooltipModule,
        NgxSliderModule,
        RouterModule,
        MatSlideToggleModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        OverlayModule,
    ],
    providers: [Toast, ErrorProcessingService, NodeHelperService, OptionsHelperService],
    exports: [
        SharedModule,
        ListOptionItemComponent,
        VideoControlsComponent,
        ImageConfigDirective,
        ImprintPrivacyComponent,
        CollectionChooserComponent,
        UrlPipe,
    ],
})
export class CoreUiModule {}
