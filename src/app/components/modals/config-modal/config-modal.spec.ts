import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigModal } from './config-modal';

describe('ConfigModal', () => {
  let component: ConfigModal;
  let fixture: ComponentFixture<ConfigModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
