import { Directive, Input, TemplateRef } from '@angular/core';

@Directive({
  selector: '[appTableCell]'
})
export class TableCellDirective {
  @Input('appTableCell') colKey!: string;

  constructor(public templateRef: TemplateRef<any>) {}
}
