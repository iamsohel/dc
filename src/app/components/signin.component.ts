import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterStateSnapshot } from '@angular/router';

import config from '../config';
import { EventService, IEvent } from '../core/services/event.service';
import { UserService } from '../core/services/user.service';
import { ActivityObserver } from '../utils/activity-observer';

const RETURN_TO_PARAM = 'return_to';

@Component({
  selector: 'app-default-signin',
  template: `
    <app-layout-splash>
      <div class="row">
        <div class="col-sm-8 col-md-7 col-lg-6">
          <h3 class="text-center">Sign in to your account</h3>
          <div class="card aligned-inputs">
            <ul class="list-group list-group-flush form-table">
              <li class="list-group-item fixed-width-inputs">
                <form [formGroup]="signinForm" (ngSubmit)="signinForm.valid && onSubmitPme()">
                  <app-input [control]="signinForm.controls['username']" [type]="'text'" [label]="'Username'"
                    [iconAfter]="'glyphicon-user'" [showErrors]="false" autocompleteMode="username"></app-input>
                  <app-input [control]="signinForm.controls['password']" [type]="'password'" [label]="'Password'"
                    [iconAfter]="'glyphicon-asterisk'" [showErrors]="false" autocompleteMode="current-password"
                  ></app-input>
                  <button class="btn btn-block"
                    [disabled]="_loginObserver.active | async"
                    (click)="signinForm.updateValueAndValidity();"
                    type="submit"
                    >Login</button>
                </form>
              </li>
              <li class="list-group-item text-center">
                <a [routerLink]="['/signup']">Sign up here</a>
                &#8226;
                <a [routerLink]="['/signin/password']">Trouble logging in?</a>
                <ng-container *mocksOnly="true">
                  &#8226;
                  <a (click)="cleanMocks()" class="link">Reset fixtures</a>
                </ng-container>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </app-layout-splash>
  `,
})
export class SigninComponent implements OnInit {
  signinForm: FormGroup;
  readonly _loginObserver = new ActivityObserver();
  private returnTo: string = config.routes.signinRedirect;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private events: EventService,
  ) {
    this.signinForm = new FormGroup({
      username: new FormControl('', Validators.required), // or username?
      password: new FormControl('', Validators.required),
      remember: new FormControl(),
    });
  }

  ngOnInit(): void {
    this.route.queryParams.forEach((params) => {
      if (params[RETURN_TO_PARAM]) {
        this.returnTo = params[RETURN_TO_PARAM];
      }
    });

    if (this.userService.isAuthenticated()) {
      this._navigateToApp();
    }
  }

  onSubmit() {
    this._loginObserver.observe(this.userService.signin(this.signinForm.value).flatMap(() => {
      return this.userService.updateSessionState();
    })).subscribe((user: any) => {
      if (user) {
        this._navigateToApp();
      }
    });
  }

  onSubmitPme() {
    this._loginObserver.observe(this.userService.signin(this.signinForm.value).flatMap(() => {
      return this.userService.updateSessionState();
    })).subscribe((user: any) => {
      if (user) {
        this._loginObserver.observe(this.userService.authPme(user)).subscribe((data: any) => {
          if (data) {
            this._navigateToApp();
          }
        });
      }
    });
  }

  cleanMocks() {
    this.events.emit(IEvent.Type.CLEAN_MOCKS_REQUEST);
  }

  private _navigateToApp() {
    this.router.navigateByUrl(this.returnTo, {replaceUrl: true});
  }

  static prepareReturnTo(state: RouterStateSnapshot): Params {
    return {
      [RETURN_TO_PARAM]: state.url,
    };
  }
}

