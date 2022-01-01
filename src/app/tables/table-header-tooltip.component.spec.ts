import { APP_BASE_HREF } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableHeaderTooltipComponent } from './table-header-tooltip.component';

describe('Table Header Tooltip Component Functionalities', () => {
  let fixture: ComponentFixture<TableHeaderTooltipComponent>,
    component: TableHeaderTooltipComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: APP_BASE_HREF, useValue: '/' },
      ],
      declarations: [
        TableHeaderTooltipComponent,
      ],
    });

    fixture = TestBed.createComponent(TableHeaderTooltipComponent);
    component = fixture.debugElement.componentInstance;
  });

  describe('Functionalities of \'getValueForHeader\'', () => {
    it('should return a json object if json string is provided', () => {
      let sampleObject = {
        firstProperty: 'abc',
        lastProperty: true,
      };
      let sampleJsonString = JSON.stringify(sampleObject);

      let result = component.getValueForHeader(sampleJsonString);

      expect(result).toEqual(sampleObject);
    });
  });

  it('should return the provided value if it is not a json string', () => {
    let providedValue = 'abcd';

    let result = component.getValueForHeader(providedValue);

    expect(result).toEqual(providedValue);
  });

  describe('Functionalities of \'AgInit\' function', () => {
    let params: any;
    beforeEach(() => {
      params = {
        rowIndex: undefined,
        colDef: {
          id: 'something',
        },
        value: '{"name": "some name"}',
      };
    });

    it('should set \'isHeader\' if there is no row index in params', () => {
      component['isHeader'] = false;
      params.rowIndex = undefined;

      component.agInit(params);

      expect(component['isHeader']).toBeTruthy();
    });

    it('should unset \'isHeader\' if there is a row index in params', () => {
      component['isHeader'] = true;
      params.rowIndex = 0;

      component.agInit(params);

      expect(component['isHeader']).toBeFalsy();
    });

    it('should call \'getValueForHeader\' to get the valueToDisplay if it is a header row', () => {
      params.rowIndex = undefined;
      params.value = 'some Value';
      let valueToReturn = 'new value';
      spyOn(component, 'getValueForHeader').and.returnValue(valueToReturn);

      component.agInit(params);

      expect(component.getValueForHeader).toHaveBeenCalledWith(params.value);
      expect(component['_valueToDisplay']).toEqual(valueToReturn);
    });

    it('should not call \'getValueForHeader\' to get the valueToDisplay if it is not a header row', () => {
      params.rowIndex = 0;
      params.value = 'some Value';
      let valueToReturn = 'new value';
      spyOn(component, 'getValueForHeader').and.returnValue(valueToReturn);

      component.agInit(params);

      expect(component.getValueForHeader).not.toHaveBeenCalled();
      expect(component['_valueToDisplay']).toEqual(params.value);
    });

    it('should set \'_isGroupedHeader\' if the colDef in params has childrens', () => {
      params.colDef['children'] = [ 'some value'];
      component['_isGroupedHeader'] = false;

      component.agInit(params);

      expect(component['_isGroupedHeader']).toBeTruthy();
    });

    it('should unset \'_isGroupedHeader\' if the colDef in params has childrens', () => {
      params.colDef['children'] = null;
      component['_isGroupedHeader'] = true;

      component.agInit(params);

      expect(component['_isGroupedHeader']).toBeFalsy();
    });

    it('should unset the \'isHeader\' if the value to display is a string', () => {
      params.rowIndex = undefined;
      params.value = 'some Value';

      component.agInit(params);

      expect(component['isHeader']).toBeFalsy();
    });

    it('should unset the \'isHeader\' if the value to display is not a string', () => {
      params.rowIndex = undefined;
      params.value = '{"value": 234}';

      component.agInit(params);

      expect(component['isHeader']).toBeTruthy();
    });
  });
});
