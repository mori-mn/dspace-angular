import { AbstractListableElementComponent } from '../../../../../shared/object-collection/shared/object-collection-element/abstract-listable-element.component';
import { ExternalSourceEntry } from '../../../../../core/shared/external-source-entry.model';
import { listableObjectComponent } from '../../../../../shared/object-collection/shared/listable-object/listable-object.decorator';
import { ViewMode } from '../../../../../core/shared/view-mode.model';
import { Context } from '../../../../../core/shared/context.model';
import { Component, OnInit } from '@angular/core';
import { Metadata } from '../../../../../core/shared/metadata.utils';
import { MetadataValue } from '../../../../../core/shared/metadata.models';

@listableObjectComponent(ExternalSourceEntry, ViewMode.ListElement, Context.EntitySearchModal)
@listableObjectComponent(ExternalSourceEntry, ViewMode.ListElement, Context.EntitySearchModalWithNameVariants)
@Component({
  selector: 'ds-external-source-entry-list-submission-element',
  styleUrls: ['./external-source-entry-list-submission-element.component.scss'],
  templateUrl: './external-source-entry-list-submission-element.component.html'
})
/**
 * The component for displaying a list element of an external source entry
 */
export class ExternalSourceEntryListSubmissionElementComponent extends AbstractListableElementComponent<ExternalSourceEntry> implements OnInit {
  /**
   * The metadata value for the object's uri
   */
  uri: MetadataValue;
  issued: MetadataValue;
  abstract: MetadataValue;
  contributors: string[];
  identifiers: string[];

  ngOnInit(): void {
    this.uri = Metadata.first(this.object.metadata, 'dc.identifier.uri');
    this.issued = Metadata.first(this.object.metadata, 'dc.date.issued');
    this.contributors = Metadata.allValues(this.object.metadata, 'dc.contributor.*');
    this.abstract = Metadata.first(this.object.metadata, 'dc.description.abstract');
    this.identifiers = Metadata.allValues(this.object.metadata, 'dc.identifier.*');
  }
}
