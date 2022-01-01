import { APP_BASE_HREF } from '@angular/common';
import { NgZone } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

import { DragEventCallbackOptions, jsPlumbInstance } from 'jsplumb';
import { PanZoom } from 'panzoom';

import { IModalButton, ModalComponent } from '../core-ui/components/modal.component';
import { CoreUIModule } from '../core-ui/core-ui.module';
import { CoreModule } from '../core/core.module';
import { NotificationService } from '../core/services/notification.service';
import { NotificationServiceMock } from '../mocks/notification.service.mock';

import { CanvasComponent } from './canvas.component';
import { InteractiveExperiment } from './experiment-interactive-session.class';
import { PipelineOperatorPositioningService } from './operator-positioning.service';
import { Pipeline } from './pipeline.interfaces';
import { PipelineService } from './pipeline.service';

class MockPipelineService {
  listOperatorCategories() {}
  canConnectIOs() {}
  defaultOperatorParameters() {}
}

class MockNgZone extends NgZone {
}

describe('Functionalities of Pipeline Canvas Component', () => {
  let fixture: ComponentFixture<CanvasComponent>,
    component: CanvasComponent,
    pipelineService = new MockPipelineService(),
    zone = new MockNgZone({}),
    operatorPositioningService = new PipelineOperatorPositioningService();
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PipelineService, useValue: pipelineService },
        { provide: NotificationService, useValue: NotificationServiceMock },
        { provide: NgZone, useValue: zone },
        { provide: PipelineOperatorPositioningService, useValue: operatorPositioningService },
        { provide: APP_BASE_HREF, useValue: '/' },
      ],
      imports: [
        RouterModule.forRoot([]),
        BrowserModule,
        FormsModule,
        CoreUIModule.forRoot(),
        ReactiveFormsModule,
        CoreModule.forRoot(),
      ],
      declarations: [
        CanvasComponent,
      ],
    });
    TestBed.overrideComponent(CanvasComponent, {set: {template: ''}});
    fixture = TestBed.createComponent(CanvasComponent);
    component = fixture.debugElement.componentInstance;
  });

  describe('Operator Renaming Functionalities', () => {
    beforeEach(() => {
      let pipelineOperator = {
        id: '123',
        name: 'name',
        className: 'class',
        moduleName: 'module',
        packageName: 'package.name',
        category: 'classifier',
        inputs: [],
        outputs: [],
        params: [],
      };

      let pipelineStep = {
        id: '123',
        operator: '123',
        inputs: {},
        params: {},
        customName: 'Operator A',
      };

      let stepElement = component['_createStepElement'](pipelineOperator, pipelineStep);

      component['_steps'] = [Object.assign(pipelineStep, {
        canvasOperator: {
          el: stepElement,
          operator: pipelineOperator,
          inputs: [],
          outputs: [],
          stepId: '123',
        },
        interactiveStatus: InteractiveExperiment.StepStatus.IDLE,
        interactiveWaitingForStatus: false,
        interactiveLastError: '',
        interactiveLastResult: {
          assets: [],
          summaries: [],
          outputValues: { },
          executionTime: 123,
        },
        pipelineParameters: {},
      })];

      component['selectedStep'] = component['_steps'][0];
    });

    describe('perhapsUpdateCanvasOperatorName function', () => {
      it('should update custom name', () => {
        let newName = 'Sample operator';
        component['selectedCustomName'] = newName;
        component['selectedStep'].customName = 'some name';

        component['perhapsUpdateCanvasOperatorName']();

        expect(component['selectedStep'].customName).toEqual(newName);
      });

      it('should trim the input value before setting the custom name', () => {
        let newName = '                              Sample operator                ';
        component['selectedCustomName'] = newName;
        component['selectedStep'].customName = 'some name';

        component['perhapsUpdateCanvasOperatorName']();

        expect(component['selectedStep'].customName).toEqual(newName.trim());
      });

      it('should use custom name as operator name in HTML if custom name is not empty', () => {
        let newName = 'custom name';
        component['selectedCustomName'] = newName;
        component['selectedStep'].customName = 'some name';

        component['perhapsUpdateCanvasOperatorName']();

        expect(component['selectedStep'].canvasOperator.el.querySelector('div.operator-name').innerHTML).toEqual(newName);
      });

      it('should use step name as operator name in HTML if custom name is empty', () => {
        let name = 'step name';
        component['selectedCustomName'] = '';
        component['selectedStep'].customName = 'old custom name';
        component['selectedStep'].name = name;

        component['perhapsUpdateCanvasOperatorName']();

        expect(component['selectedStep'].canvasOperator.el.querySelector('div.operator-name').innerHTML).toEqual(name);
      });

      it('should use original operator name as operator name in HTML if both step name and custom name are empty', () => {
        let name = 'opeartor name';
        component['selectedCustomName'] = '';
        component['selectedStep'].customName = 'old custom name';
        component['selectedStep'].name = '';
        component['selectedStep'].canvasOperator.operator.name = name;

        component['perhapsUpdateCanvasOperatorName']();

        expect(component['selectedStep'].canvasOperator.el.querySelector('div.operator-name').innerHTML).toEqual(name);
      });
    });

    describe('_emitCanvasUpdate function', () => {
      it('should emit canvasUpdated event', () => {
        spyOn(component.canvasUpdated, 'emit');

        component['_emitCanvasUpdate']();

        expect(component.canvasUpdated.emit).toHaveBeenCalled();
      });

      it('should pass pipeline.StepInfo type object', () => {
        let typeObject: Pipeline.StepInfo[];
        spyOn(component.canvasUpdated, 'emit').and.callFake((arr) => {
          expect(typeof(arr)).toEqual(typeof(typeObject));
        }).and.callThrough();

        component['_emitCanvasUpdate']();
      });

      it('should include customName property in StepInfo', () => {
        spyOn(component.canvasUpdated, 'emit').and.callFake((arr) => {
          expect('customName' in arr[0]).toBeTruthy();
        }).and.callThrough();

        component['_emitCanvasUpdate']();
      });
    });

    describe('onStepParamsModalClick function', () => {
      beforeEach(() => {
        component['_stepParamsModal'] = <ModalComponent> {
          hide() {},
        };
      });

      describe('if ok button is clicked', () => {
        let okButton: IModalButton = {
          id: 'ok',
          title: 'OK',
        };

        beforeEach(() => {
          component.isEditMode = true;
        });

        it('should call the perhapsUpdateCanvasOperatorName function', () => {
          component['perhapsUpdateCanvasOperatorName'] = jasmine.createSpy('perhapsUpdateCanvasOperatorName');

          component['onStepParamsModalClick'](okButton);

          expect(component['perhapsUpdateCanvasOperatorName']).toHaveBeenCalled();
        });

        it('should call the _emitCanvasUpdate function', () => {
          component['_emitCanvasUpdate'] = jasmine.createSpy('_emitCanvasUpdate');

          component['onStepParamsModalClick'](okButton);

          expect(component['_emitCanvasUpdate']).toHaveBeenCalled();
        });

        it('should not be executed if the current mode is not edit mode', () => {
          component.isEditMode = false;
          component['_emitCanvasUpdate'] = jasmine.createSpy('_emitCanvasUpdate');
          component['perhapsUpdateCanvasOperatorName'] = jasmine.createSpy('perhapsUpdateCanvasOperatorName');

          component['onStepParamsModalClick'](okButton);

          expect(component['_emitCanvasUpdate']).not.toHaveBeenCalled();
          expect(component['perhapsUpdateCanvasOperatorName']).not.toHaveBeenCalled();
        });
      });

      describe('if stop button is clicked it', () => {
        let stopButton: IModalButton = {
          id: 'stop',
          title: 'Stop',
        };

        it('should not call the perhapsUpdateCanvasOperatorName function', () => {
          component['perhapsUpdateCanvasOperatorName'] = jasmine.createSpy('perhapsUpdateCanvasOperatorName');

          component['onStepParamsModalClick'](stopButton);

          expect(component['perhapsUpdateCanvasOperatorName']).not.toHaveBeenCalled();
        });

        it('should not call the _emitCanvasUpdate function', () => {
          component['_emitCanvasUpdate'] = jasmine.createSpy('_emitCanvasUpdate');

          component['onStepParamsModalClick'](stopButton);

          expect(component['_emitCanvasUpdate']).not.toHaveBeenCalled();
        });
      });

      describe('if execute button is clicked', () => {
        let stopButton: IModalButton = {
          id: 'execute',
          title: 'execute',
        };

        it('should call the perhapsUpdateCanvasOperatorName function', () => {
          component['perhapsUpdateCanvasOperatorName'] = jasmine.createSpy('perhapsUpdateCanvasOperatorName');

          component['onStepParamsModalClick'](stopButton);

          expect(component['perhapsUpdateCanvasOperatorName']).toHaveBeenCalled();
        });

        it('should call the _emitCanvasUpdate function', () => {
          component['_emitCanvasUpdate'] = jasmine.createSpy('_emitCanvasUpdate');

          component['onStepParamsModalClick'](stopButton);

          expect(component['_emitCanvasUpdate']).toHaveBeenCalled();
        });
      });

      it('should clear the selected variables afterwards', () => {
        component['selectedCustomName'] = 'some name';
        component['selectedStepParams'] = {};
        component['selectedStepPipelineParams'] = {};
        component['selectedStepInputsFanIn'] = {
          someInput: true,
          anotherInput: false,
        };

        component['onStepParamsModalClick']({ id: '', title: '' });

        expect(component['selectedCustomName']).toEqual('');
        expect(component['selectedStepParams']).toEqual(null);
        expect(component['selectedStepPipelineParams']).toEqual(null);
        expect(component['selectedStepInputsFanIn']).toEqual({});

      });
    });
  });

  describe('Canvas Zooming functionalities', () => {
    let panZoom: PanZoom;
    beforeEach(() => {
      panZoom = <PanZoom> {
        getTransform: () => {
          return {
            x: 0,
            y: 0,
            scale: 0.5,
          };
        },
        resume: () => { },
      };
      component['_panZoom'] = panZoom;
    });

    describe('onStepMoved function', () => {
      let callbackEvent: DragEventCallbackOptions,
        renderer: jsPlumbInstance,
        stepElementSpy: jasmine.Spy;
      beforeEach(() => {
        let element: HTMLElement = document.createElement('div');
        callbackEvent = <DragEventCallbackOptions> {el: element};
        renderer = <jsPlumbInstance> {
          revalidate: (el) => {},
        };
        spyOn(renderer, 'revalidate');
        component['renderer'] = renderer;
        stepElementSpy = jasmine.createSpy('_getStepByElement');
        component['_getStepByElement'] = stepElementSpy;
      });

      it('should call _getStepByElement function to fetch the step', () => {
        stepElementSpy.and.returnValue({ coordinates: {} });

        component['onStepMoved'](callbackEvent);

        expect(component['_getStepByElement']).toHaveBeenCalledWith(callbackEvent.el);
      });

      it('should call \'rescalePositionWithRespectToZoomLevel\' to calculate the current position according to zoom level', () => {
        stepElementSpy.and.returnValue({ coordinates: {} });
        component['rescalePositionWithRespectToZoomLevel'] = jasmine.createSpy('rescalePositionWithRespectToZoomLevel');

        component['onStepMoved'](callbackEvent);

        expect(component['rescalePositionWithRespectToZoomLevel']).toHaveBeenCalled();
      });

      it('should call resumePanningAndZooming function', () => {
        stepElementSpy.and.returnValue({ coordinates: {} });
        spyOn(panZoom, 'resume');

        component['onStepMoved'](callbackEvent);

        expect(panZoom.resume).toHaveBeenCalled();
      });

      it('should call _emitCanvasUpdate function', () => {
        stepElementSpy.and.returnValue({ coordinates: {} });
        component['_emitCanvasUpdate'] = jasmine.createSpy('_emitCanvasUpdate');

        component['onStepMoved'](callbackEvent);

        expect(component['_emitCanvasUpdate']).toHaveBeenCalled();
      });
    });
  });
});
