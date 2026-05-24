import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SteelModal } from './steel-modal';

describe('SteelModal', () => {
  let component: SteelModal;
  let fixture: ComponentFixture<SteelModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SteelModal],
    }).compileComponents();

    fixture = TestBed.createComponent(SteelModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
