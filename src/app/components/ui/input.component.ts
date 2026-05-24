import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  template: `
    <div class="flex flex-col gap-1 w-full">
      <label *ngIf="label" class="text-[11px] font-semibold text-textSecondary uppercase tracking-wider">
        {{ label }}
      </label>
      <div class="relative w-full">
        <i *ngIf="icon" [class]="icon + ' absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary text-sm'"></i>
        <input 
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [(ngModel)]="value"
          (ngModelChange)="onModelChange($event)"
          (blur)="onTouched()"
          class="w-full bg-appBg border border-borderLight rounded-lg px-3 py-2 text-sm text-textPrimary focus:outline-none focus:border-textPrimary focus:ring-1 focus:ring-textPrimary transition-all duration-200"
          [ngClass]="{
            'pl-9': icon,
            'opacity-50 cursor-not-allowed': disabled,
            'border-red-400': error
          }"
        >
      </div>
      <span *ngIf="error" class="text-[10px] text-red-500 font-medium">{{ error }}</span>
    </div>
  `
})
export class InputComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() disabled = false;
  @Input() icon?: string;
  @Input() error?: string;

  value: any = '';

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(val: any): void {
    this.value = val;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onModelChange(val: any) {
    this.value = val;
    this.onChange(val);
  }
}
