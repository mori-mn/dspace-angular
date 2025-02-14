import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, } from '@angular/core';

import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { isObject } from 'lodash';

import { Chips } from './models/chips.model';
import { ChipsItem } from './models/chips-item.model';
import { UploaderService } from '../uploader/uploader.service';
import { TranslateService } from '@ngx-translate/core';
import { Options } from 'sortablejs';
import { BehaviorSubject } from 'rxjs';
const TOOLTIP_TEXT_LIMIT = 21;
@Component({
  selector: 'ds-chips',
  styleUrls: ['./chips.component.scss'],
  templateUrl: './chips.component.html',
})
export class ChipsComponent implements OnChanges {
  @Input() chips: Chips;
  @Input() wrapperClass: string;
  @Input() editable = false;
  @Input() showIcons = false;
  @Input() clickable = true;

  @Output() selected: EventEmitter<number> = new EventEmitter<number>();
  @Output() remove: EventEmitter<number> = new EventEmitter<number>();
  @Output() change: EventEmitter<any> = new EventEmitter<any>();

  isDragging: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  options: Options;
  dragged = -1;
  tipText: string[];
  isShowToolTip = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private uploaderService: UploaderService,
    private translate: TranslateService) {

    this.options = {
      animation: 300,
      chosenClass: 'm-0',
      dragClass: 'm-0',
      filter: '.chips-sort-ignore',
      ghostClass: 'm-0',
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.chips && !changes.chips.isFirstChange()) {
      this.chips = changes.chips.currentValue;
    }
  }

  chipsSelected(event: Event, index: number) {
    event.preventDefault();
    this.selected.emit(index);
  }

  removeChips(event: Event, index: number) {
    event.preventDefault();
    event.stopPropagation();
    // Can't remove if this element is in editMode
    if (!this.chips.getChipByIndex(index).editMode) {
      this.chips.remove(this.chips.getChipByIndex(index));
    }
  }

  onDragStart(index) {
    this.isDragging.next(true);
    this.uploaderService.overrideDragOverPage();
    this.dragged = index;
  }

  onDragEnd(event) {
    this.uploaderService.allowDragOverPage();
    this.dragged = -1;
    this.chips.updateOrder();
    this.isDragging.next(false);
  }

  showTooltip(tooltip: NgbTooltip, index, field?) {
    tooltip.close();
    this.isShowToolTip = false;
    const chipsItem = this.chips.getChipByIndex(index);
    const textToDisplay: string[] = [];
    if (!chipsItem.editMode && this.dragged === -1) {
      if (field) {
        if (isObject(chipsItem.item[field])) {
          textToDisplay.push(chipsItem.item[field].display);
          this.toolTipVisibleCheck(chipsItem.item[field].display);
          if (chipsItem.item[field].hasOtherInformation()) {
            Object.keys(chipsItem.item[field].otherInformation)
              .forEach((otherField) => {
                this.translate.get('form.other-information.' + otherField)
                  .subscribe((label) => {
                    const otherInformationText = chipsItem.item[field].otherInformation[otherField].split('::')[0];
                    textToDisplay.push(label + ': ' + otherInformationText);
                    this.toolTipVisibleCheck(label + ': ' + otherInformationText);
                  });
            });
          }
          if (this.hasWillBeReferenced(chipsItem, field)) {
            textToDisplay.push(this.getWillBeReferencedContent(chipsItem, field));
          }
        } else {
          textToDisplay.push(chipsItem.item[field]);
          this.toolTipVisibleCheck(chipsItem.item[field]);
        }
      } else {
        textToDisplay.push(chipsItem.display);
        this.toolTipVisibleCheck(chipsItem.display);
      }
      this.cdr.detectChanges();
      if ((!chipsItem.hasIcons() || !chipsItem.hasVisibleIcons() || field ) && this.isShowToolTip) {
        this.tipText = textToDisplay;
        tooltip.open();
      }
    }
  }

  hasWillBeGenerated(chip: ChipsItem, metadata: string) {
    const metadataValue = chip.item[metadata];
    return metadataValue?.authority?.startsWith('will be generated::');
  }

  hasWillBeReferenced(chip: ChipsItem, metadata: string) {
    const metadataValue = chip.item[metadata];
    return metadataValue?.authority?.startsWith('will be referenced::');
  }

  getWillBeReferencedContent(chip: ChipsItem, metadata: string) {
    if (!this.hasWillBeReferenced(chip, metadata)) {
      return null;
    }
    const metadataValue = chip.item[metadata];
    return metadataValue?.authority?.substring(metadataValue?.authority.indexOf('::') + 2);
  }

  toolTipVisibleCheck(text: string) {
    if (!this.isShowToolTip) {
      this.isShowToolTip = text.length > TOOLTIP_TEXT_LIMIT;
    }
  }
  textTruncate(text: string): string {
    if (text.length >= TOOLTIP_TEXT_LIMIT) {
      text = `${text.substring(0,TOOLTIP_TEXT_LIMIT)}...`;
    }
    return text;
  }
}
