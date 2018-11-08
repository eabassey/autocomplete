import {Component,ElementRef,OnInit,OnDestroy,Input,Output,Renderer2,EventEmitter,
  ViewChild,forwardRef,ChangeDetectorRef,NgZone} from '@angular/core';
import {AnimationEvent} from '@angular/animations';
import {ObjectUtils} from '../utils/objectutils';
import {NG_VALUE_ACCESSOR, ControlValueAccessor} from '@angular/forms';
import { animationTrigger } from '../utils/animations';

export const DROPDOWN_VALUE_ACCESSOR: any = {
provide: NG_VALUE_ACCESSOR,
useExisting: forwardRef(() => DropdownComponent),
multi: true
};

@Component({
selector: 'fs-dropdown',
templateUrl: 'dropdown.component.html',
animations: [animationTrigger],
providers: [ObjectUtils,DROPDOWN_VALUE_ACCESSOR]
})
export class DropdownComponent implements OnInit,OnDestroy,ControlValueAccessor {


selectedItem: string;
showDropdownArea: boolean = false;

@Input() optionDisplayProperty = 'id';

@Input() selectList: string[] = [];

@Input() scrollHeight: string = '200px';

@Input() style: any;

@Input() panelStyle: any;

@Input() styleClass: string;

@Input() panelStyleClass: string;

@Input() disabled: boolean;

@Input() required: boolean;

@Input() tabindex: number;

@Input() filterPlaceholder: string;

@Input() dataKey: string;

@Input() filterBy: string = 'label';

@Input() autofocus: boolean;

@Input() dropdownIcon: string = 'pi pi-caret-down';

@Input() emptyFilterMessage: string = 'No results found';

@Input() showTransitionOptions: string = '225ms ease-out';

@Input() hideTransitionOptions: string = '195ms ease-in';

@Output() onChange: EventEmitter<any> = new EventEmitter();

@Output() onFocus: EventEmitter<any> = new EventEmitter();

@Output() onBlur: EventEmitter<any> = new EventEmitter();

@Output() onClick: EventEmitter<any> = new EventEmitter();

@Output() onShow: EventEmitter<any> = new EventEmitter();

@Output() onHide: EventEmitter<any> = new EventEmitter();

@ViewChild('container') containerViewChild: ElementRef;

@ViewChild('filter') filterViewChild: ElementRef;

@ViewChild('in') focusViewChild: ElementRef;

overlay: HTMLDivElement;

itemsWrapper: HTMLDivElement;

selectedOption: any;

_options: any[];

value: any;

onModelChange: Function = () => {};

onModelTouched: Function = () => {};

optionsToDisplay: any[];

focused: boolean;

filled: boolean;

overlayVisible: boolean;

documentClickListener: any;

optionsChanged: boolean;

selfClick: boolean;

itemClick: boolean;

clearClick: boolean;

selectedOptionUpdated: boolean;

filterValue: string;

searchValue: string;

searchIndex: number;

searchTimeout: any;

previousSearchChar: string;

currentSearchChar: string;

constructor(public el: ElementRef, public renderer: Renderer2, private cd: ChangeDetectorRef,
          public objectUtils: ObjectUtils, public zone: NgZone) {}


ngOnInit() {
  this.optionsToDisplay = this.options;
  this.updateSelectedOption(null);
}

@Input() get options(): any[] {
  return this._options;
}

set options(val: any[]) {
  this._options = val;
  this.optionsToDisplay = this._options;
  this.updateSelectedOption(this.value);
  this.optionsChanged = true;

  if (this.filterValue && this.filterValue.length) {
      this.activateFilter();
  }
}

onItemClick(event, option) {
  this.itemClick = true;

  if (!option.disabled) {
      this.selectItem(event, option);
      this.focusViewChild.nativeElement.focus();
      this.filled = true;
  }

  setTimeout(() => {
      this.hide();
  }, 150);
}

selectDropdownItem(event) {
    console.log(event.target.value);
    if (event.target.value !== 'None') {
        this.showDropdownArea = true;
    } else {
        this.showDropdownArea = false;
    }
}

selectItem(event, option) {
  if (this.selectedOption != option) {
      this.selectedOption = option;
      this.value = option.value;

      this.onModelChange(this.value);
      this.onChange.emit({
          originalEvent: event,
          value: this.value
      });
  }
}

writeValue(value: any): void {
    this.resetFilter();
  this.value = value;
  this.updateSelectedOption(value);
  this.updateFilledState();
  this.cd.markForCheck();
}

resetFilter(): void {
  if (this.filterViewChild && this.filterViewChild.nativeElement) {
      this.filterValue = null;
      this.filterViewChild.nativeElement.value = '';
  }

  this.optionsToDisplay = this.options;
}

updateSelectedOption(val: any): void {
  this.selectedOption = this.findOption(val, this.optionsToDisplay);
  if (!this.selectedOption && this.optionsToDisplay && this.optionsToDisplay.length) {
      this.selectedOption = this.optionsToDisplay[0];
  }
  this.selectedOptionUpdated = true;
}

registerOnChange(fn: Function): void {
  this.onModelChange = fn;
}

registerOnTouched(fn: Function): void {
  this.onModelTouched = fn;
}

setDisabledState(val: boolean): void {
  this.disabled = val;
}

onMouseclick(event) {
  if (this.disabled) {
      return;
  }

  this.onClick.emit(event);

  this.selfClick = true;

  if (!this.itemClick && !this.clearClick) {
      this.focusViewChild.nativeElement.focus();

      if (this.overlayVisible) {
          this.hide();
      }
      else {
          this.show();

          setTimeout(() => {
              if (this.filterViewChild != undefined) {
                  this.filterViewChild.nativeElement.focus();
              }
          }, 200);
      }
  }
}


show() {
  this.overlayVisible = true;
}

onOverlayAnimationStart(event: AnimationEvent) {
  switch (event.toState) {
      case 'visible':
          this.overlay = event.element;
          this.bindDocumentClickListener();
          this.onShow.emit(event);
      break;

      case 'void':
          this.onHide.emit(event);
          this.onOverlayHide();
      break;
  }
}


hide() {
  this.overlayVisible = false;
  this.resetFilter();

  this.cd.markForCheck();
}

onInputFocus(event) {
  this.focused = true;
  this.onFocus.emit(event);
}

onInputBlur(event) {
  this.focused = false;
  this.onModelTouched();
  this.onBlur.emit(event);
}

findPrevEnabledOption(index) {
  let prevEnabledOption;

  if (this.optionsToDisplay && this.optionsToDisplay.length) {
      for (let i = (index - 1); 0 <= i; i--) {
          let option = this.optionsToDisplay[i];
          if (option.disabled) {
              continue;
          }
          else {
              prevEnabledOption = option;
              break;
          }
      }

      if (!prevEnabledOption) {
          for (let i = this.optionsToDisplay.length - 1; i >= index ; i--) {
              let option = this.optionsToDisplay[i];
              if (option.disabled) {
                  continue;
              }
              else {
                  prevEnabledOption = option;
                  break;
              }
          }
      }
  }

  return prevEnabledOption;
}

findNextEnabledOption(index) {
  let nextEnabledOption;

  if (this.optionsToDisplay && this.optionsToDisplay.length) {
      for (let i = (index + 1); index < (this.optionsToDisplay.length - 1); i++) {
          let option = this.optionsToDisplay[i];
          if (option.disabled) {
              continue;
          }
          else {
              nextEnabledOption = option;
              break;
          }
      }

      if (!nextEnabledOption) {
          for (let i = 0; i < index; i++) {
              let option = this.optionsToDisplay[i];
              if (option.disabled) {
                  continue;
              }
              else {
                  nextEnabledOption = option;
                  break;
              }
          }
      }
  }

  return nextEnabledOption;
}

onKeydown(event: KeyboardEvent, search: boolean) {
  if (!this.optionsToDisplay || this.optionsToDisplay.length === null) {
      return;
  }

  switch(event.which) {
      //down
      case 40:
          if (!this.overlayVisible && event.altKey) {
              this.show();
          }
          else {
                  let selectedItemIndex = this.selectedOption ? this.findOptionIndex(this.selectedOption.value, this.optionsToDisplay) : -1;
                  let nextEnabledOption = this.findNextEnabledOption(selectedItemIndex);
                  if (nextEnabledOption) {
                      this.selectItem(event, nextEnabledOption);
                      this.selectedOptionUpdated = true;
                  }
          }

          event.preventDefault();

      break;

      //up
      case 38:
              let selectedItemIndex = this.selectedOption ? this.findOptionIndex(this.selectedOption.value, this.optionsToDisplay) : -1;
              let prevEnabledOption = this.findPrevEnabledOption(selectedItemIndex);
              if (prevEnabledOption) {
                  this.selectItem(event, prevEnabledOption);
                  this.selectedOptionUpdated = true;
              }

          event.preventDefault();
      break;

      //enter
      case 13:
          if (this.optionsToDisplay && this.optionsToDisplay.length > 0) {
              this.hide();
          }

          event.preventDefault();
      break;

      //escape and tab
      case 27:
      case 9:
          this.hide();
      break;

      //search item based on keyboard input
      default:
          if (search) {
              this.search(event);
          }
      break;
  }
}

search(event) {
  if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
  }

  const char = String.fromCharCode(event.keyCode);
  this.previousSearchChar = this.currentSearchChar;
  this.currentSearchChar = char;

  if (this.previousSearchChar === this.currentSearchChar)
      this.searchValue = this.currentSearchChar;
  else
      this.searchValue = this.searchValue ? this.searchValue + char : char;

  let newOption;
      let searchIndex = this.selectedOption ? this.findOptionIndex(this.selectedOption.value, this.optionsToDisplay) : -1;
      newOption = this.searchOption(++searchIndex);

  if (newOption) {
      this.selectItem(event, newOption);
      this.selectedOptionUpdated = true;
  }

  this.searchTimeout = setTimeout(() => {
      this.searchValue = null;
  }, 250);
}

searchOption(index) {
  let option;

  if (this.searchValue) {
      option = this.searchOptionInRange(index, this.optionsToDisplay.length);

      if (!option) {
          option = this.searchOptionInRange(0, index);
      }
  }

  return option;
}

searchOptionInRange(start, end) {
  for (let i = start; i < end; i++) {
      let opt = this.optionsToDisplay[i];
      if (opt[this.optionDisplayProperty].toLowerCase().startsWith(this.searchValue.toLowerCase())) {
          return opt;
      }
  }

  return null;
}

findOptionIndex(val: any, opts: any[]): number {
  let index: number = -1;
  if (opts) {
      for (let i = 0; i < opts.length; i++) {
          if ((val == null && opts[i].value == null) || this.objectUtils.equals(val, opts[i].value, this.dataKey)) {
              index = i;
              break;
          }
      }
  }

  return index;
}

findOption(val: any, opts: any[], inGroup?: boolean) {
  if (!inGroup) {
      let opt;
      if (opts && opts.length) {
          for (let optgroup of opts) {
              opt = this.findOption(val, optgroup.items, true);
              if (opt) {
                  break;
              }
          }
      }
      return opt;
  }
  else {
      let index: number = this.findOptionIndex(val, opts);
      return (index != -1) ? opts[index] : null;
  }
}

onFilter(event): void {
  let inputValue = event.target.value.toLowerCase();
  if (inputValue && inputValue.length) {
      this.filterValue = inputValue;
      this.activateFilter();
  }
  else {
      this.filterValue = null;
      this.optionsToDisplay = this.options;
  }

  this.optionsChanged = true;
}

activateFilter() {
  let searchFields: string[] = this.filterBy.split(',');
  if (this.options && this.options.length) {
      this.optionsToDisplay = this.objectUtils.filter(this.options, searchFields, this.filterValue);
      this.optionsChanged = true;
  }
}

bindDocumentClickListener() {
  if (!this.documentClickListener) {
      this.documentClickListener = this.renderer.listen('document', 'click', () => {
          if (!this.selfClick && !this.itemClick) {
              this.hide();
              this.unbindDocumentClickListener();
          }

          this.clearClickState();
          this.cd.markForCheck();
      });
  }
}

clearClickState() {
  this.selfClick = false;
  this.itemClick = false;
}

unbindDocumentClickListener() {
  if (this.documentClickListener) {
      this.documentClickListener();
      this.documentClickListener = null;
  }
}

updateFilledState() {
  this.filled = (this.selectedOption != null);
}

clear(event: Event) {
  this.clearClick = true;
  this.value = null;
  this.onModelChange(this.value);
  this.onChange.emit({
      originalEvent: event,
      value: this.value
  });
  this.updateSelectedOption(this.value);
  this.updateFilledState();
}

onOverlayHide() {
  this.unbindDocumentClickListener();
  this.overlay = null;
  this.itemsWrapper = null;
}

ngOnDestroy() {
  this.onOverlayHide();
}
}
