import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="bg-surface rounded-xl p-5 flex flex-col transition-all duration-200"
      [ngClass]="{
        'hover:shadow-md cursor-pointer border border-transparent hover:border-borderLight': interactive,
        'border border-borderLight': bordered
      }">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  @Input() interactive = false;
  @Input() bordered = true;
}
