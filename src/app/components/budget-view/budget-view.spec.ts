import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BudgetView } from './budget-view';

describe('BudgetView', () => {
  let component: BudgetView;
  let fixture: ComponentFixture<BudgetView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetView],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
