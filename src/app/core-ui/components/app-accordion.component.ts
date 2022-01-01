import { Component, Input, OnInit } from '@angular/core';
// import { v4 as uuidv4 } from 'uuid';
const { v4: uuidv4 } = require('uuid');

@Component({
  selector: 'app-accordian',
  preserveWhitespaces: false,
  template: `
    <div class="panel-group" *ngIf="label && colId">
      <div class="panel panel-default">
        <div
          class="panel-heading"
          data-toggle="collapse"
          [attr.href]="'#' + colId"
          role="button"
          (click)="onToggledIcon()"
        >
          <h4 class="panel-title">
            <strong>{{ label }} </strong>
            <i [class]=" !isOpened ? 'glyphicon glyphicon-chevron-down pull-right' : 'glyphicon glyphicon-chevron-up pull-right' "></i>
          </h4>
        </div>
        <div id="{{ colId }}" class="panel-collapse collapse" [ngClass]="isCollapsed ? 'in' : null" *ngIf="canToggled">
          <div class="panel-body">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AppAccordionComponent implements OnInit {
  @Input() label: string = null;
  // @Input() colId: string = null;
  @Input() isCollapsed?: boolean = true;
  @Input() canToggled?: boolean = true;
  isOpened: boolean = false;
  colId: string = uuidv4();

  constructor() {}

  ngOnInit() {
      this.isOpened = this.isCollapsed;
  }

  onToggledIcon() {
    this.isOpened = !this.isOpened;
  }
}
