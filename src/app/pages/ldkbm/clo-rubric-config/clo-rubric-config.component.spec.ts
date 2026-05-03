import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CloRubricConfigComponent } from './clo-rubric-config.component';

describe('CloRubricConfigComponent', () => {
  let component: CloRubricConfigComponent;
  let fixture: ComponentFixture<CloRubricConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CloRubricConfigComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CloRubricConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
