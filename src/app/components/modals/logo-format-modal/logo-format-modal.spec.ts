import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoFormatModal } from './logo-format-modal';

describe('LogoFormatModal', () => {
  let component: LogoFormatModal;
  let fixture: ComponentFixture<LogoFormatModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoFormatModal],
    }).compileComponents();

    fixture = TestBed.createComponent(LogoFormatModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
