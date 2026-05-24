import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button 
      (click)="onClick.emit($event)"
      [disabled]="disabled"
      [type]="type"
      class="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200"
      [ngClass]="{
        'bg-textPrimary text-appBg hover:bg-zinc-800': variant === 'primary',
        'bg-accent text-textPrimary hover:brightness-95': variant === 'accent',
        'bg-surface text-textPrimary hover:bg-borderLight': variant === 'secondary',
        'bg-transparent border border-borderLight text-textPrimary hover:bg-surface': variant === 'outline',
        'opacity-50 cursor-not-allowed': disabled,
        'w-full': fullWidth
      }">
      <i *ngIf="icon" [class]="icon"></i>
      <ng-content></ng-content>
    </button>
  `
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' | 'accent' = 'primary';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() icon?: string;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  
  @Output() onClick = new EventEmitter<Event>();
}
