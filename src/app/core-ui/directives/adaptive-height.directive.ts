import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

export interface AdaptiveHeightDirectiveOptions {
  minHeight?: number;
  targetHeight?: number;
  pageMargin?: number;
  property?: string;
  keepOnScreen?: boolean;
  trigger?: any; // changing this value just triggers recalculation
}

const defaultOptions: AdaptiveHeightDirectiveOptions = {
  minHeight: 0,
  pageMargin: 15,
  property: 'max-height',
};

@Directive({ selector: '[adaptiveHeight]' })
export class AdaptiveHeightDirective implements OnChanges, OnInit, OnDestroy {
  @Input('adaptiveHeight') options: AdaptiveHeightDirectiveOptions;
  @Output() onHeightUpdate: EventEmitter<number> = new EventEmitter();
  private el: any;

  constructor(
    el: ElementRef,
    private zone: NgZone,
  ) {
    this.el = el.nativeElement;
  }

  ngOnInit() {
    this.zone.runOutsideAngular(() => {
      window.addEventListener('scroll', this._updateHeightBound);
      window.addEventListener('resize', this._updateHeightBound);
    });
    this._updateHeight();
  }

  ngOnChanges(): void {
    this.options = Object.assign({}, defaultOptions, this.options);
    this._updateHeight();
    this.zone.runOutsideAngular(() => {
      window.setTimeout(() => this._updateHeight());
    });
  }

  ngOnDestroy(): void {
    this.zone.runOutsideAngular(() => {
      window.removeEventListener('scroll', this._updateHeightBound);
      window.removeEventListener('resize', this._updateHeightBound);
    });
  }

  private _updateHeightBound = () => this._updateHeight();

  private _updateHeight(): void {
    const $el = $(this.el);
    if ($el.is(':visible')) {
      const windowHeight = $(window).height();
      const windowTop = $(window).scrollTop();
      const windowBottom = windowHeight + windowTop;

      if (this.options.keepOnScreen) {
        const elementPlaceOffset =
          $el.offset().top - parseInt($el.css('marginTop'), 10) - this.options.pageMargin;
        const topMargin = Math.min(
          Math.max(0, windowTop - elementPlaceOffset),
          Math.max(0, windowBottom - elementPlaceOffset - this.options.minHeight - 2 * this.options.pageMargin),
        );
        $el.css('margin-top', `${topMargin}px`);
      }

      const elementOffset = $el.offset().top;

      const height = Math.max(this.options.minHeight, windowBottom - elementOffset - this.options.pageMargin);
      $el.css(this.options.property, `${height}px`);
      if ('targetHeight' in this.options) {
        const bottomMargin = Math.max(this.options.targetHeight - height, 0);
        $el.css('margin-bottom', `${bottomMargin}px`);
      }
      this.onHeightUpdate.emit(height);
    }
  }
}
