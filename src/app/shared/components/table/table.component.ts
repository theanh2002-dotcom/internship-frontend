import { Component, Input, ContentChildren, QueryList, TemplateRef, AfterContentInit } from '@angular/core';
import { TableCellDirective } from './table-cell.directive';

@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements AfterContentInit {
  @Input() data: any[] = [];
  @Input() columns: { key: string; label: string; align?: 'left'|'center'|string; width?: string }[] = [];
  @Input() isLoading = false;
  @Input() emptyMessage = 'Không tìm thấy dữ liệu';

  @ContentChildren(TableCellDirective) cellTemplates!: QueryList<TableCellDirective>;

  customTemplates: { [key: string]: TemplateRef<any> } = {};

  ngAfterContentInit() {
    this.updateTemplates();
    this.cellTemplates.changes.subscribe(() => this.updateTemplates());
  }

  private updateTemplates() {
    this.customTemplates = {};
    if (this.cellTemplates) {
      this.cellTemplates.forEach(item => {
        if (item.colKey) {
          this.customTemplates[item.colKey] = item.templateRef;
        }
      });
    }
  }

  getValue(item: any, key: string, index: number): any {
    if (key === 'STT') {
      return index + 1;
    }
    if (key.includes('.')) {
      return key.split('.').reduce((obj, part) => obj && obj[part], item);
    }
    return item[key];
  }
}
