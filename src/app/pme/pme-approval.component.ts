import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';


import { IPriceRecord } from './pme.interfaces';

@Component({
  selector: 'pme-approval',
  template: `
  <!-- <iframe [src]="url" class="iframe-trusted-src" title="description" style="width: 100%;"></iframe> -->
  <a (click)="openC4C()" class="link">Approve/Reject</a>
  `,
})
export class PmeApprovalComponent implements OnInit, OnDestroy {
  @Input() pmeData: IPriceRecord;
  url: string = '';
  win: Window = null;

  constructor() {
  }

  ngOnInit(): void {
    const pmeUrl = this.pmeData.c4c_price_record_url !== null ? this.pmeData.c4c_price_record_url : 'https://www.facebook.com/';
    //this.url = this.dom.bypassSecurityTrustResourceUrl(pmeUrl);
    this.url = pmeUrl;
    this.win && this.win.close();
  }

  ngOnDestroy(): void {
    this.win && this.win.close();
  }

  @HostListener('window:beforeunload', ['$event'])
  public onPageUnload($event: BeforeUnloadEvent) {
    this.win && this.win.close();
  }

  openC4C() {
    const width = 1070;
    const height = 620;
    const y = window.top.outerHeight / 2 + window.top.screenY - ( height / 2);
    const x = window.top.outerWidth / 2 + window.top.screenX - ( width / 2);

    // let strWindowFeatures = 'location=yes,height=570,width=520,scrollbars=yes,status=yes';
    let strWindowFeatures = 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=yes, copyhistory=no, width=' + width + ', height=' + height + ', top=' + y + ', left=' + x;
    this.win = window.open(this.url, '_blank', strWindowFeatures);
  }


}
