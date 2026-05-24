import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorService } from '../../../services/error.service';
import { ButtonComponent } from '../../ui/button.component';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div *ngIf="errorService.currentError() as error" class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
      <div class="bg-surface border border-borderLight rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        
        <div class="px-6 py-5 border-b border-borderLight flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <i class="ph ph-warning-circle text-red-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-textPrimary">{{ error.title }}</h3>
            <p class="text-sm text-textSecondary mt-1">{{ error.message }}</p>
            <p *ngIf="error.code" class="text-xs text-textSecondary font-mono mt-2 bg-appBg px-2 py-1 rounded inline-block">Código: {{ error.code }}</p>
          </div>
        </div>

        <div class="px-6 py-4 bg-appBg flex justify-end gap-3">
          <app-button variant="primary" (onClick)="handleAction(error)">
            {{ error.actionText || 'Entendido' }}
          </app-button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in-up {
      animation: fadeInUp 0.3s ease-out forwards;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class ErrorModalComponent {
  errorService = inject(ErrorService);

  handleAction(error: any) {
    if (error.onAction) {
      error.onAction();
    }
    this.errorService.clearError();
  }
}
