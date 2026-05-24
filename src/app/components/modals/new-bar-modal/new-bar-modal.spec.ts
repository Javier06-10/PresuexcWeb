import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewBarModal } from './new-bar-modal';

describe('NewBarModal', () => {
  let component: NewBarModal;
  let fixture: ComponentFixture<NewBarModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewBarModal],
    }).compileComponents();

    fixture = TestBed.createComponent(NewBarModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
