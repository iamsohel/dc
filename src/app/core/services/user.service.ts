import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import * as _ from 'lodash';
import 'rxjs/add/observable/interval';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/share';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';

import config from '../../config';
import { UserRole } from '../../users/user.interfaces';
import { IEmailConfirmationRequest, IUser, IUserStats } from '../interfaces/user.interface';

import { EventService, IEvent } from './event.service';
import { AppHttp } from './http.service';
import { NotificationService } from './notification.service';
import { StorageService } from './storage.service';

@Injectable()
export class UserService {

  get user(): Observable<IUser> {
    return this._user$.asObservable();
  }

  private readonly _user$ = new ReplaySubject<IUser>(1);
  private _user: IUser = null;

  constructor(
    private router: Router,
    private http: AppHttp,
    private storage: StorageService,
    private notifications: NotificationService,
    protected events: EventService,
  ) {
    // init token expiration
    Observable.interval(10 * 60 * 1000).subscribe(() => { // 10 minutes
      const token = this.storage.get(config.storage.token);
      if (token && token.expires < Date.now() / 1000) {
        this.router.navigate([config.routes.signout]);
      }
    });

    this._user$.subscribe(_ => {
      this._user = _;
    });

    http.httpErrors.subscribe(error => {
      if (error.status === 401 && this.isAuthenticated()) {
        this.updateSessionState();
      }
    });

    this.events.filter(
      event => event.type === IEvent.Type.SESSION_CLEARED,
    ).subscribe(event => {
      this.router.navigate([config.routes.signoutRedirect]);
    });

    this.updateSessionStatePme(true);
  }

  token(): string {
    // fetch token from storage
    const token = this.storage.get(config.storage.token);
    return token ? token.access_token : null;
  }

  isAuthenticated(): boolean {
    // true, false or null (if authentication is not completed yet)
    return !!this._user;
  }

  /* RESERVED
  hasPermission(permissions) {
    // permissions: example - ['admin', 'superuser'] or 'admin'
    if (!permissions || permissions && !permissions.length) return true;

    var permissions = Array.isArray(permissions) ? permissions : [permissions];
    var groups = this._data.view && Array.isArray(this._data.view.groups) ? this._data.view.groups : [];

    // transform aliases to keys
    var configGroups = config.user.groups.values
    permissions = permissions.map(function(permission) {
        return config.user.groups.values[permission] ? permission : config.user.groups.aliases[permission];
      });

    var permissionsInGroups = permissions.filter(function(permission) {
        return groups.indexOf(permission) > -1;
      });

    return !!permissionsInGroups.length;
  }
  */

  getUser(): IUser {
    return this._user;
  }

  updateSessionState(initial: boolean = false): Observable<IUser> {
    const token = this.storage.get(config.storage.token);

    const observable: Observable<IUser> = (() => {
      if (token && token.expires > Date.now() / 1000) {
        return this.http.get('me', {}, {noNotifications: true});
      } else {
        return Observable.throw('No user');
      }
    })();

    return AppHttp.execute(observable,
      newUser => {
        const currentUser = this._user;
        if (!_.isEqual(currentUser, newUser)) {
          this._user$.next(newUser);
          if (currentUser) {
            // Session updated, redirect to login
            this.router.navigate([config.routes.signinRedirect]);
          }
        }
      },
      () => {
        this.cleanSessionState(!initial);
      },
    );
  }

  updateSessionStatePme(initial: boolean = false): Observable<any> {
    const pmeToken = this.storage.get(config.storage.pmeToken);

    const observable: Observable<any> = (() => {
      if (pmeToken && pmeToken.expires > Date.now() / 1000) {
        return this.http.postpme('auth/', {
          remember: null,
          username: pmeToken.email,
        });
      } else {
        return Observable.throw('No user');
      }
    })();

    return AppHttp.execute(observable,
      newUser => {
        const currentUser = this._user;
        if (!_.isEqual(currentUser, newUser)) {

          const loginUser: IUser = {
            id: '001',
            firstName: newUser.full_name.split(' ')[0],
            lastName: newUser.full_name.split(' ')[1],
            role: UserRole.SALES_REP,
            email: pmeToken.email,
          };

          switch (newUser.role) {
            case 'SalesResp' : loginUser.role = UserRole.SALES_REP;
            break;
            case 'SalesManager' : loginUser.role = UserRole.SALES_MANAGER;
            break;
            case 'CD' : loginUser.role = UserRole.CD;
            break;
            case 'GMM' : loginUser.role = UserRole.GMM;
            break;
            case 'GPO_Analyst' : loginUser.role = UserRole.GPO_ANALYST;
            break;
            case 'Key_User' : loginUser.role = UserRole.KEY_USER;
            break;
            case 'Sales_Support' : loginUser.role = UserRole.SALES_SUPPORT;
            break;
            case 'Reader' : loginUser.role = UserRole.READER;
            break;
          }

          this._user$.next(loginUser);
          if (currentUser) {
            // Session updated, redirect to login
            this.router.navigate([config.routes.signinRedirect]);
          }
        }
      },
      () => {
        this.cleanSessionState(!initial);
      },
    );
  }

  cleanSessionState(emitEvent = true): void {
    this._user$.next(null);
    this.storage.clear();
    if (emitEvent) {
      this.events.emit(IEvent.Type.SESSION_CLEARED);
    }
  }

  signup(credentials: any): Observable<any> {
    // POST '/signup'
    const observable = this.http.post('signup', credentials);
    const message: string = config.REQUIRE_EMAIL_CONFIRMATION ? 'Please, check your mail for activation link' : 'Successfully signed up';
    return AppHttp.execute(observable,
      () => {
        this.notifications.create(message);
      },
    );
  }

  confirmEmail(confirmationData: IEmailConfirmationRequest): Observable<void> {
    const observable = this.http.post('emailconfirmation', confirmationData, {}, { noNotifications: true });
    return AppHttp.execute(observable,
      _ => {
        this.notifications.create('Email successfully confirmed', config.notification.level.values.SUCCESS);
      },
    );
  }

  signin(credentials: any): Observable<any> {
    // POST '/signin'
    const observable = this.http.post('signin', credentials);

    return AppHttp.execute(observable,
      data => {
        const token = <any> data;

        // TEMP TEMP TEMP
        token.expires = Date.now() / 1000 + token.expires_in - 60 * 60; // lets subtract something just to be sure we are "safe"

        this.storage.set(config.storage.token, token);
      },
    );
  }

  authPme(user: any): Observable<any> {
    // TEMP TEMP
    const observableAuth = this.http.postpme('auth/', {
      remember: null,
      username: user.email,
    });

    let resultData = {
      access_token: 'tokenId6',
      expires: 9999999999999,
      expires_in: 86400,
      email: user.email,
    };

    return AppHttp.execute(observableAuth,
      data => {
        resultData.access_token = data.token ? data.token : data.access_token;
        const token = <any> resultData;

        // TEMP TEMP TEMP
        token.expires = Date.now() / 1000 + token.expires_in - 60 * 60; // lets subtract something just to be sure we are "safe"

        this.storage.set(config.storage.pmeToken, token);

        const newUser: IUser = {
          id: '001',
          firstName: data.full_name.split(' ')[0],
          lastName: data.full_name.split(' ')[0],
          role: UserRole.SALES_REP,
          email: user.email,
        };

        switch (data.role) {
          case 'SalesResp' : newUser.role = UserRole.SALES_REP;
          break;
          case 'SalesManager' : newUser.role = UserRole.SALES_MANAGER;
          break;
          case 'CD' : newUser.role = UserRole.CD;
          break;
          case 'GMM' : newUser.role = UserRole.GMM;
          break;
          case 'GPO_Analyst' : newUser.role = UserRole.GPO_ANALYST;
          break;
          case 'Key_User' : newUser.role = UserRole.KEY_USER;
          break;
          case 'Sales_Support' : newUser.role = UserRole.SALES_SUPPORT;
          break;
          case 'Reader' : newUser.role = UserRole.READER;
          break;
        }

        const currentUser = this._user;
        if (!_.isEqual(currentUser, newUser)) {
          this._user$.next(newUser);
        }

      },
    );
  }

  signout(): void {
    this.cleanSessionState();
  }

  password(credentials: any): Observable<any> {
    // POST 'api/me/password'
    const observable = this.http.post('me/password', credentials);

    return AppHttp.execute(observable,
      () => {
        this.notifications.create('Your password has been updated successfully.');
      },
    );
  }

  // TODO: get rid of it as soon as possible (and drop the endpoint)
  usernameRemind(email: string): Observable<any> {
    // POST 'api/me/username/remind'
    const observable = this.http.post('me/username/remind', {email});

    return AppHttp.execute(observable,
      () => {
        this.notifications.create('Please, check your email for details');
      },
    );
  }

  passwordReset(email: string): Observable<any> {
    // POST 'api/me/password/reset'
    const observable = this.http.post('me/password/reset', {email});

    return AppHttp.execute(observable,
      () => {
        this.notifications.create('Please, check your email for details');
      },
    );
  }

  passwordResetConfirmation(data: any): Observable<any> {
    // POST 'api/me/password/resetcomplete'
    // TODO: ask to rename to ..../password/reset/confirmation
    const observable = this.http.post('me/password/resetcomplete', data);

    return AppHttp.execute(observable,
      () => {
        this.notifications.create('Your password has been updated successfully. Please Log in with your new credentials. Redirecting to login page...');
      },
    );
  }

  getStats(scope?: string): Observable<IUserStats> {
    // GET '/api/me/stats'
    return this.http.get('me/stats', {scope});
  }
}

declare module './event.service' {
  export namespace IEvent {
    export const enum Type {
      SESSION_CLEARED = 'SESSION_CLEARED',
    }
  }
}
