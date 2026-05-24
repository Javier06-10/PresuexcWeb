import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiState } from '../../services/ui-state';
import { ConfigService } from '../../services/config';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  uiState = inject(UiState);
  configService = inject(ConfigService);
  supabase = inject(SupabaseService);
  
  openConfig() {
    this.uiState.isConfigModalOpen.set(true);
  }

  async logout() {
    await this.supabase.signOut();
  }
}
