import { Component } from '@angular/core';

import { versionInfo } from '../version-info';

@Component({
  selector: 'app-layout-splash',
  template: `
    <div class="container container-splash">
      <div class="row">
        <div class="col-md-4 col-md-push-8">
          <div class="logo img-logo"></div>
          <div class="user-manual-link">
            <a
              href="https://deepcortex.ai/pme-user-manual/"
              target="_blank"
            >
              User Manual
            </a>
          </div>
        </div>
        <div class="col-md-8 col-md-pull-4">
          <h1 class="tagline">What breakthroughs will you discover today?</h1>
        </div>
        <div class="col-md-12 text-center" [hidden]="true">
          <span class="app-version">Version {{ appVersion }}</span>
        </div>
      </div>
      <ng-content></ng-content>
    </div>
    <div class="news-block">
      <iframe class="embed-responsive-item" src="assets/html/news.html" allowtransparency="true"></iframe>
    </div>
  `,
})
export class LayoutSplashComponent {
  readonly appVersion: string = versionInfo.semverString || versionInfo.tag;
}
