import * as AngularCommon from '@angular/common';
import { ComponentFactoryResolver } from '@angular/core';
import * as AngularCore from '@angular/core';
import { Compiler, ComponentFactory, Injectable, Injector, NgModuleRef, Type } from '@angular/core';
import * as BrowserAnimations from '@angular/platform-browser/animations';
import * as AngularRouter from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { empty } from 'rxjs/observable/empty';
import { of } from 'rxjs/observable/of';

import config from '../../config';
import { AppHttp } from '../../core/services/http.service';
import { NotificationService } from '../../core/services/notification.service';

export const CUSTOM_COMPONENTS_INJECTOR_TOKEN = 'CUSTOM_COMPONENTS';


@Injectable()
export class CustomComponentService {
  private modules: {[path: string]: Observable<NgModuleRef<{}>>} = {};
  constructor(
    private http: AppHttp,
    private injector: Injector,
    private compiler: Compiler,
    private componentFactoryResolver: ComponentFactoryResolver,
    private notifications: NotificationService,
  ) {}

  public get<T>(modulePath: string, componentName: string): Observable<ComponentFactory<T>> {
    if (modulePath) {
      return this.getModule(modulePath).map(
        (moduleRef) => {
          const providedComponentsData: { name: string, component: Type<T> }[] =
            moduleRef.injector.get(CUSTOM_COMPONENTS_INJECTOR_TOKEN);
          const componentData = providedComponentsData.find(_ => _.name === componentName);
          if (componentData) {
            const resolver = moduleRef.componentFactoryResolver;
            return resolver.resolveComponentFactory(componentData.component);
          }
          return null;  // TODO: Return error component factory
        },
      );
    } else {
      const providedComponentsData: { name: string, component: Type<T> }[] =
        this.injector.get(CUSTOM_COMPONENTS_INJECTOR_TOKEN);
      const componentData = providedComponentsData.find(_ => _.name === componentName);
      if (componentData) {
        return of(this.componentFactoryResolver.resolveComponentFactory(componentData.component));
      }
    }
  }

  private getModule(path: string): Observable<NgModuleRef<{}>> {
    if (!(path in this.modules)) {
      this.modules[path] = this.http.get(path + '/index.js', {}, {responseType: 'text'}).flatMap(
        (source) => {
          const exports: any = {}; // this will hold module exports
          const modules = {   // this is the list of modules accessible by plugins
            '@angular/core': AngularCore,
            '@angular/common': AngularCommon,
            '@angular/router': AngularRouter,
            '@angular/platform-browser/animations': BrowserAnimations,
          };

          try {
            // shim 'require' and eval
            //tslint:disable-next-line:no-unused-variable
            (<any> window).require = (module) => modules[module];
            //tslint:disable-next-line:no-eval
            eval(source);
            // Need to check if there is another solution for eval as this is described as 'Evil'
            const moduleFactory = this.compiler.compileModuleSync(exports.default);
            return of(moduleFactory.create(this.injector));
          } catch (e) {
            console.error(e);
            this.notifications.create(
              'Failed to initialize custom UI module',
              config.notification.level.values.WARNING,
            );
            return empty<any>();
          }
        },
      ).shareReplay(1);
    }
    return this.modules[path];
  }
}
