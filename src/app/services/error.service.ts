import { Injectable, signal } from '@angular/core';

export interface AppError {
  title: string;
  message: string;
  code?: string;
  actionText?: string;
  onAction?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {
  currentError = signal<AppError | null>(null);

  showError(error: AppError) {
    this.currentError.set(error);
  }

  clearError() {
    this.currentError.set(null);
  }

  handleGenericError(err: any, customTitle = 'Error Inesperado') {
    console.error('App Error:', err);
    this.showError({
      title: customTitle,
      message: err?.message || 'Ha ocurrido un error en la aplicación. Por favor, intenta de nuevo.',
      code: err?.code
    });
  }
}
