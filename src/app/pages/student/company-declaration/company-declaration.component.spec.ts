import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyDeclarationComponent } from './company-declaration.component';

describe('CompanyDeclarationComponent', () => {
  let component: CompanyDeclarationComponent;
  let fixture: ComponentFixture<CompanyDeclarationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyDeclarationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyDeclarationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
