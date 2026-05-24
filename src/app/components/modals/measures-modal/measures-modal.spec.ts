import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MeasuresModal } from './measures-modal';

describe('MeasuresModal', () => {
  let component: MeasuresModal;
  let fixture: ComponentFixture<MeasuresModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MeasuresModal],
    }).compileComponents();

    fixture = TestBed.createComponent(MeasuresModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
