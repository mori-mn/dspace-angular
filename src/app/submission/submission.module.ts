import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';
import { SharedModule } from '../shared/shared.module';

import { SubmissionSectionFormComponent } from './sections/form/section-form.component';
import { SectionsDirective } from './sections/sections.directive';
import { SectionsService } from './sections/sections.service';
import { SubmissionFormCollectionComponent } from './form/collection/submission-form-collection.component';
import { SubmissionFormFooterComponent } from './form/footer/submission-form-footer.component';
import { SubmissionFormComponent } from './form/submission-form.component';
import { SubmissionFormSectionAddComponent } from './form/section-add/submission-form-section-add.component';
import { SubmissionSectionContainerComponent } from './sections/container/section-container.component';
import { CommonModule } from '@angular/common';
import { Action, StoreConfig, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { submissionReducers, SubmissionState } from './submission.reducers';
import { submissionEffects } from './submission.effects';
import { SubmissionSectionUploadComponent } from './sections/upload/section-upload.component';
import { SectionUploadService } from './sections/upload/section-upload.service';
import { SubmissionUploadFilesComponent } from './form/submission-upload-files/submission-upload-files.component';
import { SubmissionSectionLicenseComponent } from './sections/license/section-license.component';
import { SubmissionUploadsConfigService } from '../core/config/submission-uploads-config.service';
import { SubmissionEditComponent } from './edit/submission-edit.component';
import { SubmissionSectionUploadFileComponent } from './sections/upload/file/section-upload-file.component';
import {
  SubmissionSectionUploadFileEditComponent
} from './sections/upload/file/edit/section-upload-file-edit.component';
import {
  SubmissionSectionUploadFileViewComponent
} from './sections/upload/file/view/section-upload-file-view.component';
import {
  SubmissionSectionUploadAccessConditionsComponent
} from './sections/upload/accessConditions/submission-section-upload-access-conditions.component';
import { SubmissionSubmitComponent } from './submit/submission-submit.component';
import { storeModuleConfig } from '../app.reducer';
import { SubmissionImportExternalComponent } from './import-external/submission-import-external.component';
import {
  SubmissionImportExternalSearchbarComponent
} from './import-external/import-external-searchbar/submission-import-external-searchbar.component';
import {
  SubmissionImportExternalPreviewComponent
} from './import-external/import-external-preview/submission-import-external-preview.component';
import {
  SubmissionImportExternalCollectionComponent
} from './import-external/import-external-collection/submission-import-external-collection.component';
import { SubmissionSectionCcLicensesComponent } from './sections/cc-license/submission-section-cc-licenses.component';
import { JournalEntitiesModule } from '../entity-groups/journal-entities/journal-entities.module';
import { ResearchEntitiesModule } from '../entity-groups/research-entities/research-entities.module';
import { SubmissionSectionDetectDuplicateComponent } from './sections/detect-duplicate/section-detect-duplicate.component';
import { DuplicateMatchComponent } from './sections/detect-duplicate/duplicate-match/duplicate-match.component';
import { DetectDuplicateService } from './sections/detect-duplicate/detect-duplicate.service';
import { ThemedSubmissionEditComponent } from './edit/themed-submission-edit.component';
import { ThemedSubmissionSubmitComponent } from './submit/themed-submission-submit.component';
import { ThemedSubmissionImportExternalComponent } from './import-external/themed-submission-import-external.component';
import { SubmissionSectionCustomUrlComponent } from './sections/custom-url/submission-section-custom-url.component';
import { FormModule } from '../shared/form/form.module';
import { NgbAccordionModule, NgbCollapseModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { SubmissionSectionAccessesComponent } from './sections/accesses/section-accesses.component';
import { SubmissionAccessesConfigService } from '../core/config/submission-accesses-config.service';
import { SectionAccessesService } from './sections/accesses/section-accesses.service';
import { SubmissionSectionSherpaPoliciesComponent } from './sections/sherpa-policies/section-sherpa-policies.component';
import { ContentAccordionComponent } from './sections/sherpa-policies/content-accordion/content-accordion.component';
import { PublisherPolicyComponent } from './sections/sherpa-policies/publisher-policy/publisher-policy.component';
import {
  PublicationInformationComponent
} from './sections/sherpa-policies/publication-information/publication-information.component';
import {
  MetadataInformationComponent
} from './sections/sherpa-policies/metadata-information/metadata-information.component';
import { SubmissionSectionCorrectionComponent } from './sections/correction/section-correction.component';

const ENTRY_COMPONENTS = [
  // put only entry components that use custom decorator
  SubmissionSectionUploadComponent,
  SubmissionSectionFormComponent,
  SubmissionSectionLicenseComponent,
  SubmissionSectionCcLicensesComponent,
  SubmissionSectionAccessesComponent,
  SubmissionSectionSherpaPoliciesComponent,
  SubmissionSectionDetectDuplicateComponent,
  SubmissionSectionCustomUrlComponent,
  SubmissionSectionCorrectionComponent
];

const DECLARATIONS = [
  ...ENTRY_COMPONENTS,
  SectionsDirective,
  SubmissionEditComponent,
  ThemedSubmissionEditComponent,
  SubmissionFormSectionAddComponent,
  SubmissionFormCollectionComponent,
  SubmissionFormComponent,
  SubmissionFormFooterComponent,
  SubmissionSubmitComponent,
  ThemedSubmissionSubmitComponent,
  SubmissionUploadFilesComponent,
  SubmissionSectionContainerComponent,
  SubmissionSectionUploadAccessConditionsComponent,
  SubmissionSectionUploadFileComponent,
  SubmissionSectionUploadFileEditComponent,
  SubmissionSectionUploadFileViewComponent,
  SubmissionImportExternalComponent,
  ThemedSubmissionImportExternalComponent,
  SubmissionImportExternalSearchbarComponent,
  SubmissionImportExternalPreviewComponent,
  SubmissionImportExternalCollectionComponent,
  ContentAccordionComponent,
  PublisherPolicyComponent,
  PublicationInformationComponent,
  MetadataInformationComponent,
  DuplicateMatchComponent
];

@NgModule({
  imports: [
    CommonModule,
    CoreModule.forRoot(),
    SharedModule,
    StoreModule.forFeature('submission', submissionReducers, storeModuleConfig as StoreConfig<SubmissionState, Action>),
    EffectsModule.forFeature(submissionEffects),
    JournalEntitiesModule.withEntryComponents(),
    ResearchEntitiesModule.withEntryComponents(),
    FormModule,
    NgbModalModule,
    NgbCollapseModule,
    NgbAccordionModule
  ],
  declarations: DECLARATIONS,
  exports: DECLARATIONS,
  providers: [
    SectionUploadService,
    SectionsService,
    SubmissionUploadsConfigService,
    SubmissionAccessesConfigService,
    SectionAccessesService,
    DetectDuplicateService
  ]
})

/**
 * This module handles all components that are necessary for the submission process
 */
export class SubmissionModule {
  /**
   * NOTE: this method allows to resolve issue with components that using a custom decorator
   * which are not loaded during SSR otherwise
   */
  static withEntryComponents() {
    return {
      ngModule: SubmissionModule,
      providers: ENTRY_COMPONENTS.map((component) => ({ provide: component }))
    };
  }
}
