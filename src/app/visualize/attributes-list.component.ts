import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

import { IColumnInfo } from './dashboard-edit-state';

@Component({
  //tslint:disable-next-line:component-selector
  selector: 'li[attributes-list-submenu]',
  template: `
    <a (click)="collapsed = !collapsed">
      <i class="glyphicon glyphicon-tags"></i>
      <span>Attributes</span>
    </a>
    <ul class="nav nav-pills submenu with-dropdown tiny">
      <li *ngFor="let item of attributes"
        [ngClass]="{'active': item.isActive}"
        (click)="onAttributeToggle.emit({name: item.name, active: !item.isActive})">
          <span class="dropdown pull-right">
            <a>
              <i [ngClass]="{'glyphicon glyphicon-ok': item.isActive}"></i>
            </a>
          </span>
        <a [title]="item.displayName">
          {{item.displayName}}
        </a>
      </li>
      <li *ngIf="!attributes.length"><a>No Attributes</a></li>
    </ul>
  `,
})
export class AttributesListComponent {
  @Input() attributes: (IColumnInfo & { isActive: boolean })[];
  @HostBinding('class') get class() { return 'has-submenu' + (this.collapsed ? '' : ' open'); }
  @Output() onAttributeToggle = new EventEmitter<{name: string, active: boolean}>();
  collapsed: boolean = false;
}
