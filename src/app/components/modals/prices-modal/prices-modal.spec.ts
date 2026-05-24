import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricesModal } from './prices-modal';

describe('PricesModal', () => {
  let component: PricesModal;
  let fixture: ComponentFixture<PricesModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricesModal],
    }).compileComponents();

    fixture = TestBed.createComponent(PricesModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
