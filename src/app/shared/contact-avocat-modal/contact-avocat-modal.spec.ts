import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactAvocatModal } from './contact-avocat-modal';

describe('ContactAvocatModal', () => {
  let component: ContactAvocatModal;
  let fixture: ComponentFixture<ContactAvocatModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactAvocatModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactAvocatModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
