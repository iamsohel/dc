import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Subscription } from 'rxjs/Subscription';

import config from '../config';
import { UserService } from '../core/services/user.service';
import { AppValidators } from '../utils/validators';

@Component({
  selector: 'app-signin-password-confirmation',
  template: `
    <app-layout-splash>
      <div class="row">
        <div class="col-sm-10 col-md-8 col-lg-7">
            <h3 class="text-center">Password reset</h3>
            <form [formGroup]="passwordResetConfirmationForm">
              <div class="card aligned-inputs">
                <ul class="list-group list-group-flush form-table">
                  <li class="list-group-item form-group">
                    <app-fake-control label="e-mail" [value]="passwordResetConfirmationForm.controls['email'].value"
                    ></app-fake-control>
                  </li>
                  <li class="list-group-item fixed-width-inputs">
                    <app-input label="New Password"
                      type="password"
                      [control]="passwordResetConfirmationForm.controls['newPassword']"
                      [iconAfter]="'glyphicon-asterisk'"
                      autocompleteMode="off"
                    ></app-input>
                    <app-input label="Confirm Password"
                      type="password"
                      [control]="passwordResetConfirmationForm.controls['newPassword2']"
                      [iconAfter]="'glyphicon-asterisk'"
                      autocompleteMode="off"
                    ></app-input>
                  </li>
                </ul>
              </div>
              <div style="margin-top: -15px; padding-left: 215px;">
                Password should be minimum 10 characters and meet all following rules:
                <ul><li>at least 1 upper case character</li><li>at least 1 lower case character</li><li>at least 1 special character</li><li>at least 1 digit</li></ul>
              </div>
              <button
                type="button"
                (click)="onSubmit()"
                [disabled]="!passwordResetConfirmationForm.valid"
                class="btn btn-block btn-primary-outline">Update password</button>
            </form>
            <!--
            <div class="m-t-3 text-center">
              <a [routerLink]="[config.routes.signin]">Back to signin</a>.
            </div>
            -->
        </div>
      </div>
    </app-layout-splash>
  `,
})
export class SigninPasswordConfirmationComponent implements OnDestroy {
  passwordResetConfirmationForm: FormGroup;
  config = config;

  private _formSubscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private user: UserService,
  ) {

    this.passwordResetConfirmationForm = new FormGroup({
      secretCode: new FormControl(this.route.snapshot.queryParams['secretCode']),
      email: new FormControl(this.route.snapshot.queryParams['email'], [Validators.required, AppValidators.email]),
      newPassword: new FormControl('', [Validators.required, AppValidators.password]),
      newPassword2: new FormControl('', [Validators.required, AppValidators.password, AppValidators.equal('newPassword')]),
    });

    /* Getting existing password and confirm password controls from signup form to crossvalidate */
    const password = this.passwordResetConfirmationForm.controls['newPassword'];
    const password2 = this.passwordResetConfirmationForm.controls['newPassword2'];
    this._formSubscriptions.push(
      AppValidators.crossValidate(
        password,
        [password2],
        (password) => Validators.compose([
          AppValidators.equals(password, 'Passwords don\'t match'),
          Validators.required,
          AppValidators.password,
        ]),
      ),
    );
  }

  onSubmit() {
    this.user.passwordResetConfirmation(this.passwordResetConfirmationForm.value).subscribe(() => {
      this.router.navigate([config.routes.signin]);
    });
  }

  ngOnDestroy(): void {
    this._formSubscriptions.forEach(_ => _.unsubscribe());
  }

}
