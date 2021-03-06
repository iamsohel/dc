import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import { Ace } from 'ace-builds';
import { Observable } from 'rxjs/Observable';

const ACE_THEME = 'ace/theme/chrome';

@Directive({
  selector: '[code]',
  exportAs: 'code',
})
export class CodeDirective implements OnInit, OnChanges, OnDestroy {
  @Input('code') mode: string;
  @Input('codeReadOnly') readOnly: boolean = false;
  @Input() filePath: string;
  @Input() codeValue: string;
  @Output() codeValueChange: EventEmitter<string> = new EventEmitter(false);

  private readonly el: HTMLElement;
  private instance: Ace.Editor;
  private session: Ace.EditSession;
  private _rendered: boolean = false;

  constructor(el: ElementRef) {
    this.el = el.nativeElement;
  }

  public resize(force?: boolean) {
    if (this.instance) {
      this.instance.resize(force);
    }
  }

  public ngOnInit() {
    this._render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('codeValue' in changes) {
      if (this.session) {
        const currentValue = this.session.getValue();
        if (this.codeValue !== currentValue) {
          this.session.setValue(this.codeValue);
        }
      } else if (this._rendered) {
        this._render();
      }
    }

    if (this._rendered && 'readOnly' in changes) {
      this._render();
    }
  }

  ngOnDestroy() {
    this._destroyInstance();
  }

  private _render() {
    this._destroyInstance();
    if (this.readOnly) {
      importAceEditor().then(({config: aceConfig}) => {
        aceConfig.loadModule('ace/ext/static_highlight', highlight => {
          aceConfig.loadModule('ace/lib/dom', dom => {
            this._getAceMode().subscribe(mode => {
              highlight.render(this.codeValue, mode, ACE_THEME, 1, false, highlighted => {
                dom.importCssString(highlighted.css, 'ace_highlight');
                this.el.innerHTML = highlighted.html;
              });
            });
          });
        });
      });
    } else {
      this._prepareInstance();
    }

    this._rendered = true;
  }

  private _prepareInstance() {
    importAceEditor().then(({edit, config: aceConfig, UndoManager, EditSession}) => {
      this.session = new EditSession(this.codeValue);
      this.session.setUndoManager(new UndoManager());

      this._getAceMode().subscribe(mode => {
        this.session.setMode(mode);
      });

      this.instance = edit(this.el, {
        session: this.session,
        readOnly: this.readOnly,
      });
      this.instance.setTheme(ACE_THEME);

      aceConfig.loadModule('ace/ext/language_tools', () => {
        this.instance.setOptions({
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: false,
          enableSnippets: true,
          maxLines: Infinity,
        });
      });

      // add command to lazy-load keybinding_menu extension (does not work now)
      this.instance.commands.addCommand({
        name: 'showKeyboardShortcuts',
        bindKey: {win: 'Ctrl-Alt-h', mac: 'Command-Alt-h'},
        exec: function(editor) {
          aceConfig.loadModule('ace/ext/keybinding_menu', function(module) {
            module.init(editor);
            (<any> editor).showKeyboardShortcuts();
          });
        },
      });
      this.instance.commands.addCommand({
        name: 'undo',
        bindKey: {win: 'Ctrl-h', mac: 'Command-h'},
        exec: function(editor) {
          aceConfig.loadModule('ace/ext/keybinding_menu', function(module) {
            module.init(editor);
            (<any> editor).showKeyboardShortcuts();
          });
        },
      });

      this.session.getDocument().on('change', () => {
        this.codeValue = this.session.getValue();
        this.codeValueChange.emit(this.codeValue);
      });
    });
  }

  private _destroyInstance() {
    if (this.session) {
      this.session.destroy();
      delete this.session;
    }
    if (this.instance) {
      this.instance.destroy();
      delete this.instance;
    }
  }

  private _getAceMode(): Observable<string> {
    return new Observable(subscriber => {
      if (this.mode) {
        subscriber.next(`ace/mode/${this.mode}`);
        subscriber.complete();
      } else if (this.filePath) {
        importAceEditor().then(({config: aceConfig}) => {
          aceConfig.loadModule('ace/ext/modelist', (modelist) => {
            const mode = modelist.getModeForPath(this.filePath).mode;
            subscriber.next(mode);
            subscriber.complete();
          });
        });
      }
    });
  }
}

function importAceEditor() {
  return import('ace-builds').then(ace => {
    //require('ace-builds/webpack-resolver'); - see below

    ace.config.setModuleUrl('ace/ext/beautify', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-beautify.js'));
    ace.config.setModuleUrl('ace/ext/elastic_tabstops_lite', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-elastic_tabstops_lite.js'));
    ace.config.setModuleUrl('ace/ext/emmet', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-emmet.js'));
    ace.config.setModuleUrl('ace/ext/error_marker', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-error_marker.js'));
    ace.config.setModuleUrl('ace/ext/keyboard_menu', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-keybinding_menu.js'));
    ace.config.setModuleUrl('ace/ext/language_tools', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-language_tools.js'));
    ace.config.setModuleUrl('ace/ext/linking', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-linking.js'));
    ace.config.setModuleUrl('ace/ext/modelist', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-modelist.js'));
    ace.config.setModuleUrl('ace/ext/options', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-options.js'));
    ace.config.setModuleUrl('ace/ext/rtl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-rtl.js'));
    ace.config.setModuleUrl('ace/ext/searchbox', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-searchbox.js'));
    ace.config.setModuleUrl('ace/ext/settings_menu', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-settings_menu.js'));
    ace.config.setModuleUrl('ace/ext/spellcheck', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-spellcheck.js'));
    ace.config.setModuleUrl('ace/ext/split', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-split.js'));
    ace.config.setModuleUrl('ace/ext/static_highlight', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-static_highlight.js'));
    ace.config.setModuleUrl('ace/ext/statusbar', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-statusbar.js'));
    ace.config.setModuleUrl('ace/ext/textarea', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-textarea.js'));
    ace.config.setModuleUrl('ace/ext/themelist', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-themelist.js'));
    ace.config.setModuleUrl('ace/ext/whitespace', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/ext-whitespace.js'));
    ace.config.setModuleUrl('ace/keyboard/emacs', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/keybinding-emacs.js'));
    ace.config.setModuleUrl('ace/keyboard/vim', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/keybinding-vim.js'));
    ace.config.setModuleUrl('ace/mode/abap', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-abap.js'));
    ace.config.setModuleUrl('ace/mode/abc', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-abc.js'));
    ace.config.setModuleUrl('ace/mode/actionscript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-actionscript.js'));
    ace.config.setModuleUrl('ace/mode/ada', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-ada.js'));
    ace.config.setModuleUrl('ace/mode/apache_conf', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-apache_conf.js'));
    ace.config.setModuleUrl('ace/mode/apex', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-apex.js'));
    ace.config.setModuleUrl('ace/mode/applescript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-applescript.js'));
    ace.config.setModuleUrl('ace/mode/asciidoc', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-asciidoc.js'));
    ace.config.setModuleUrl('ace/mode/asl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-asl.js'));
    ace.config.setModuleUrl('ace/mode/assembly_x86', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-assembly_x86.js'));
    ace.config.setModuleUrl('ace/mode/autohotkey', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-autohotkey.js'));
    ace.config.setModuleUrl('ace/mode/batchfile', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-batchfile.js'));
    ace.config.setModuleUrl('ace/mode/bro', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-bro.js'));
    ace.config.setModuleUrl('ace/mode/c9search', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-c9search.js'));
    ace.config.setModuleUrl('ace/mode/cirru', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-cirru.js'));
    ace.config.setModuleUrl('ace/mode/clojure', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-clojure.js'));
    ace.config.setModuleUrl('ace/mode/cobol', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-cobol.js'));
    ace.config.setModuleUrl('ace/mode/coffee', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-coffee.js'));
    ace.config.setModuleUrl('ace/mode/coldfusion', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-coldfusion.js'));
    ace.config.setModuleUrl('ace/mode/csharp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-csharp.js'));
    ace.config.setModuleUrl('ace/mode/csound_document', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-csound_document.js'));
    ace.config.setModuleUrl('ace/mode/csound_orchestra', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-csound_orchestra.js'));
    ace.config.setModuleUrl('ace/mode/csound_score', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-csound_score.js'));
    ace.config.setModuleUrl('ace/mode/csp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-csp.js'));
    ace.config.setModuleUrl('ace/mode/css', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-css.js'));
    ace.config.setModuleUrl('ace/mode/curly', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-curly.js'));
    ace.config.setModuleUrl('ace/mode/c_cpp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-c_cpp.js'));
    ace.config.setModuleUrl('ace/mode/d', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-d.js'));
    ace.config.setModuleUrl('ace/mode/dart', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-dart.js'));
    ace.config.setModuleUrl('ace/mode/diff', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-diff.js'));
    ace.config.setModuleUrl('ace/mode/django', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-django.js'));
    ace.config.setModuleUrl('ace/mode/dockerfile', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-dockerfile.js'));
    ace.config.setModuleUrl('ace/mode/dot', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-dot.js'));
    ace.config.setModuleUrl('ace/mode/drools', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-drools.js'));
    ace.config.setModuleUrl('ace/mode/edifact', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-edifact.js'));
    ace.config.setModuleUrl('ace/mode/eiffel', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-eiffel.js'));
    ace.config.setModuleUrl('ace/mode/ejs', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-ejs.js'));
    ace.config.setModuleUrl('ace/mode/elixir', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-elixir.js'));
    ace.config.setModuleUrl('ace/mode/elm', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-elm.js'));
    ace.config.setModuleUrl('ace/mode/erlang', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-erlang.js'));
    ace.config.setModuleUrl('ace/mode/forth', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-forth.js'));
    ace.config.setModuleUrl('ace/mode/fortran', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-fortran.js'));
    ace.config.setModuleUrl('ace/mode/fsharp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-fsharp.js'));
    ace.config.setModuleUrl('ace/mode/fsl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-fsl.js'));
    ace.config.setModuleUrl('ace/mode/ftl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-ftl.js'));
    ace.config.setModuleUrl('ace/mode/gcode', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-gcode.js'));
    ace.config.setModuleUrl('ace/mode/gherkin', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-gherkin.js'));
    ace.config.setModuleUrl('ace/mode/gitignore', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-gitignore.js'));
    ace.config.setModuleUrl('ace/mode/glsl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-glsl.js'));
    ace.config.setModuleUrl('ace/mode/gobstones', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-gobstones.js'));
    ace.config.setModuleUrl('ace/mode/golang', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-golang.js'));
    ace.config.setModuleUrl('ace/mode/graphqlschema', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-graphqlschema.js'));
    ace.config.setModuleUrl('ace/mode/groovy', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-groovy.js'));
    ace.config.setModuleUrl('ace/mode/haml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-haml.js'));
    ace.config.setModuleUrl('ace/mode/handlebars', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-handlebars.js'));
    ace.config.setModuleUrl('ace/mode/haskell', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-haskell.js'));
    ace.config.setModuleUrl('ace/mode/haskell_cabal', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-haskell_cabal.js'));
    ace.config.setModuleUrl('ace/mode/haxe', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-haxe.js'));
    ace.config.setModuleUrl('ace/mode/hjson', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-hjson.js'));
    ace.config.setModuleUrl('ace/mode/html', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-html.js'));
    ace.config.setModuleUrl('ace/mode/html_elixir', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-html_elixir.js'));
    ace.config.setModuleUrl('ace/mode/html_ruby', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-html_ruby.js'));
    ace.config.setModuleUrl('ace/mode/ini', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-ini.js'));
    ace.config.setModuleUrl('ace/mode/io', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-io.js'));
    ace.config.setModuleUrl('ace/mode/jack', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-jack.js'));
    ace.config.setModuleUrl('ace/mode/jade', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-jade.js'));
    ace.config.setModuleUrl('ace/mode/java', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-java.js'));
    ace.config.setModuleUrl('ace/mode/javascript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-javascript.js'));
    ace.config.setModuleUrl('ace/mode/json', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-json.js'));
    ace.config.setModuleUrl('ace/mode/jsoniq', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-jsoniq.js'));
    ace.config.setModuleUrl('ace/mode/jsp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-jsp.js'));
    ace.config.setModuleUrl('ace/mode/jssm', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-jssm.js'));
    ace.config.setModuleUrl('ace/mode/jsx', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-jsx.js'));
    ace.config.setModuleUrl('ace/mode/julia', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-julia.js'));
    ace.config.setModuleUrl('ace/mode/kotlin', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-kotlin.js'));
    ace.config.setModuleUrl('ace/mode/latex', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-latex.js'));
    ace.config.setModuleUrl('ace/mode/less', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-less.js'));
    ace.config.setModuleUrl('ace/mode/liquid', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-liquid.js'));
    ace.config.setModuleUrl('ace/mode/lisp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-lisp.js'));
    ace.config.setModuleUrl('ace/mode/livescript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-livescript.js'));
    ace.config.setModuleUrl('ace/mode/logiql', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-logiql.js'));
    ace.config.setModuleUrl('ace/mode/logtalk', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-logtalk.js'));
    ace.config.setModuleUrl('ace/mode/lsl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-lsl.js'));
    ace.config.setModuleUrl('ace/mode/lua', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-lua.js'));
    ace.config.setModuleUrl('ace/mode/luapage', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-luapage.js'));
    ace.config.setModuleUrl('ace/mode/lucene', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-lucene.js'));
    ace.config.setModuleUrl('ace/mode/makefile', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-makefile.js'));
    ace.config.setModuleUrl('ace/mode/markdown', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-markdown.js'));
    ace.config.setModuleUrl('ace/mode/mask', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-mask.js'));
    ace.config.setModuleUrl('ace/mode/matlab', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-matlab.js'));
    ace.config.setModuleUrl('ace/mode/maze', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-maze.js'));
    ace.config.setModuleUrl('ace/mode/mel', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-mel.js'));
    ace.config.setModuleUrl('ace/mode/mixal', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-mixal.js'));
    ace.config.setModuleUrl('ace/mode/mushcode', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-mushcode.js'));
    ace.config.setModuleUrl('ace/mode/mysql', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-mysql.js'));
    ace.config.setModuleUrl('ace/mode/nix', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-nix.js'));
    ace.config.setModuleUrl('ace/mode/nsis', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-nsis.js'));
    ace.config.setModuleUrl('ace/mode/objectivec', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-objectivec.js'));
    ace.config.setModuleUrl('ace/mode/ocaml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-ocaml.js'));
    ace.config.setModuleUrl('ace/mode/pascal', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-pascal.js'));
    ace.config.setModuleUrl('ace/mode/perl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-perl.js'));
    ace.config.setModuleUrl('ace/mode/perl6', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-perl6.js'));
    ace.config.setModuleUrl('ace/mode/pgsql', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-pgsql.js'));
    ace.config.setModuleUrl('ace/mode/php', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-php.js'));
    ace.config.setModuleUrl('ace/mode/php_laravel_blade', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-php_laravel_blade.js'));
    ace.config.setModuleUrl('ace/mode/pig', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-pig.js'));
    ace.config.setModuleUrl('ace/mode/plain_text', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-plain_text.js'));
    ace.config.setModuleUrl('ace/mode/powershell', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-powershell.js'));
    ace.config.setModuleUrl('ace/mode/praat', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-praat.js'));
    ace.config.setModuleUrl('ace/mode/prolog', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-prolog.js'));
    ace.config.setModuleUrl('ace/mode/properties', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-properties.js'));
    ace.config.setModuleUrl('ace/mode/protobuf', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-protobuf.js'));
    ace.config.setModuleUrl('ace/mode/puppet', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-puppet.js'));
    ace.config.setModuleUrl('ace/mode/python', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-python.js'));
    ace.config.setModuleUrl('ace/mode/r', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-r.js'));
    ace.config.setModuleUrl('ace/mode/razor', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-razor.js'));
    ace.config.setModuleUrl('ace/mode/rdoc', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-rdoc.js'));
    ace.config.setModuleUrl('ace/mode/red', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-red.js'));
    ace.config.setModuleUrl('ace/mode/redshift', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-redshift.js'));
    ace.config.setModuleUrl('ace/mode/rhtml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-rhtml.js'));
    ace.config.setModuleUrl('ace/mode/rst', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-rst.js'));
    ace.config.setModuleUrl('ace/mode/ruby', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-ruby.js'));
    ace.config.setModuleUrl('ace/mode/rust', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-rust.js'));
    ace.config.setModuleUrl('ace/mode/sass', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-sass.js'));
    ace.config.setModuleUrl('ace/mode/scad', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-scad.js'));
    ace.config.setModuleUrl('ace/mode/scala', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-scala.js'));
    ace.config.setModuleUrl('ace/mode/scheme', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-scheme.js'));
    ace.config.setModuleUrl('ace/mode/scss', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-scss.js'));
    ace.config.setModuleUrl('ace/mode/sh', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-sh.js'));
    ace.config.setModuleUrl('ace/mode/sjs', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-sjs.js'));
    ace.config.setModuleUrl('ace/mode/slim', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-slim.js'));
    ace.config.setModuleUrl('ace/mode/smarty', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-smarty.js'));
    ace.config.setModuleUrl('ace/mode/snippets', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-snippets.js'));
    ace.config.setModuleUrl('ace/mode/soy_template', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-soy_template.js'));
    ace.config.setModuleUrl('ace/mode/space', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-space.js'));
    ace.config.setModuleUrl('ace/mode/sparql', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-sparql.js'));
    ace.config.setModuleUrl('ace/mode/sql', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-sql.js'));
    ace.config.setModuleUrl('ace/mode/sqlserver', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-sqlserver.js'));
    ace.config.setModuleUrl('ace/mode/stylus', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-stylus.js'));
    ace.config.setModuleUrl('ace/mode/svg', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-svg.js'));
    ace.config.setModuleUrl('ace/mode/swift', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-swift.js'));
    ace.config.setModuleUrl('ace/mode/tcl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-tcl.js'));
    ace.config.setModuleUrl('ace/mode/terraform', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-terraform.js'));
    ace.config.setModuleUrl('ace/mode/tex', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-tex.js'));
    ace.config.setModuleUrl('ace/mode/text', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-text.js'));
    ace.config.setModuleUrl('ace/mode/textile', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-textile.js'));
    ace.config.setModuleUrl('ace/mode/toml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-toml.js'));
    ace.config.setModuleUrl('ace/mode/tsx', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-tsx.js'));
    ace.config.setModuleUrl('ace/mode/turtle', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-turtle.js'));
    ace.config.setModuleUrl('ace/mode/twig', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-twig.js'));
    ace.config.setModuleUrl('ace/mode/typescript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-typescript.js'));
    ace.config.setModuleUrl('ace/mode/vala', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-vala.js'));
    ace.config.setModuleUrl('ace/mode/vbscript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-vbscript.js'));
    ace.config.setModuleUrl('ace/mode/velocity', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-velocity.js'));
    ace.config.setModuleUrl('ace/mode/verilog', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-verilog.js'));
    ace.config.setModuleUrl('ace/mode/vhdl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-vhdl.js'));
    ace.config.setModuleUrl('ace/mode/visualforce', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-visualforce.js'));
    ace.config.setModuleUrl('ace/mode/wollok', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-wollok.js'));
    ace.config.setModuleUrl('ace/mode/xml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-xml.js'));
    ace.config.setModuleUrl('ace/mode/xquery', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-xquery.js'));
    ace.config.setModuleUrl('ace/mode/yaml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/mode-yaml.js'));
    ace.config.setModuleUrl('ace/mode/coffee_worker', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/worker-coffee.js'));
    ace.config.setModuleUrl('ace/mode/css_worker', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/worker-css.js'));
    ace.config.setModuleUrl('ace/mode/html_worker', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/worker-html.js'));
    ace.config.setModuleUrl('ace/mode/javascript_worker', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/worker-javascript.js'));
    ace.config.setModuleUrl('ace/mode/json_worker', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/worker-json.js'));
    ace.config.setModuleUrl('ace/mode/lua_worker', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/worker-lua.js'));
    ace.config.setModuleUrl('ace/mode/php_worker', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/worker-php.js'));
    ace.config.setModuleUrl('ace/mode/xml_worker', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/worker-xml.js'));
    ace.config.setModuleUrl('ace/mode/xquery_worker', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/worker-xquery.js'));

    ace.config.setModuleUrl('ace/theme/chrome', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-chrome.js'));
    /*
    ace.config.setModuleUrl('ace/theme/ambiance', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-ambiance.js'));
    ace.config.setModuleUrl('ace/theme/chaos', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-chaos.js'));
    ace.config.setModuleUrl('ace/theme/chrome', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-chrome.js'));
    ace.config.setModuleUrl('ace/theme/clouds', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-clouds.js'));
    ace.config.setModuleUrl('ace/theme/clouds_midnight', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-clouds_midnight.js'));
    ace.config.setModuleUrl('ace/theme/cobalt', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-cobalt.js'));
    ace.config.setModuleUrl('ace/theme/crimson_editor', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-crimson_editor.js'));
    ace.config.setModuleUrl('ace/theme/dawn', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-dawn.js'));
    ace.config.setModuleUrl('ace/theme/dracula', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-dracula.js'));
    ace.config.setModuleUrl('ace/theme/dreamweaver', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-dreamweaver.js'));
    ace.config.setModuleUrl('ace/theme/eclipse', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-eclipse.js'));
    ace.config.setModuleUrl('ace/theme/github', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-github.js'));
    ace.config.setModuleUrl('ace/theme/gob', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-gob.js'));
    ace.config.setModuleUrl('ace/theme/gruvbox', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-gruvbox.js'));
    ace.config.setModuleUrl('ace/theme/idle_fingers', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-idle_fingers.js'));
    ace.config.setModuleUrl('ace/theme/iplastic', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-iplastic.js'));
    ace.config.setModuleUrl('ace/theme/katzenmilch', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-katzenmilch.js'));
    ace.config.setModuleUrl('ace/theme/kr_theme', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-kr_theme.js'));
    ace.config.setModuleUrl('ace/theme/kuroir', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-kuroir.js'));
    ace.config.setModuleUrl('ace/theme/merbivore', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-merbivore.js'));
    ace.config.setModuleUrl('ace/theme/merbivore_soft', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-merbivore_soft.js'));
    ace.config.setModuleUrl('ace/theme/monokai', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-monokai.js'));
    ace.config.setModuleUrl('ace/theme/mono_industrial', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-mono_industrial.js'));
    ace.config.setModuleUrl('ace/theme/pastel_on_dark', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-pastel_on_dark.js'));
    ace.config.setModuleUrl('ace/theme/solarized_dark', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-solarized_dark.js'));
    ace.config.setModuleUrl('ace/theme/solarized_light', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-solarized_light.js'));
    ace.config.setModuleUrl('ace/theme/sqlserver', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-sqlserver.js'));
    ace.config.setModuleUrl('ace/theme/terminal', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-terminal.js'));
    ace.config.setModuleUrl('ace/theme/textmate', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-textmate.js'));
    ace.config.setModuleUrl('ace/theme/tomorrow', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-tomorrow.js'));
    ace.config.setModuleUrl('ace/theme/tomorrow_night', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-tomorrow_night.js'));
    ace.config.setModuleUrl('ace/theme/tomorrow_night_blue', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-tomorrow_night_blue.js'));
    ace.config.setModuleUrl('ace/theme/tomorrow_night_bright', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-tomorrow_night_bright.js'));
    ace.config.setModuleUrl('ace/theme/tomorrow_night_eighties', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-tomorrow_night_eighties.js'));
    ace.config.setModuleUrl('ace/theme/twilight', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-twilight.js'));
    ace.config.setModuleUrl('ace/theme/vibrant_ink', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-vibrant_ink.js'));
    ace.config.setModuleUrl('ace/theme/xcode', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/theme-xcode.js'));
    */

    ace.config.setModuleUrl('ace/snippets/abap', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/abap.js'));
    ace.config.setModuleUrl('ace/snippets/abc', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/abc.js'));
    ace.config.setModuleUrl('ace/snippets/actionscript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/actionscript.js'));
    ace.config.setModuleUrl('ace/snippets/ada', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/ada.js'));
    ace.config.setModuleUrl('ace/snippets/apache_conf', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/apache_conf.js'));
    ace.config.setModuleUrl('ace/snippets/apex', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/apex.js'));
    ace.config.setModuleUrl('ace/snippets/applescript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/applescript.js'));
    ace.config.setModuleUrl('ace/snippets/asciidoc', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/asciidoc.js'));
    ace.config.setModuleUrl('ace/snippets/asl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/asl.js'));
    ace.config.setModuleUrl('ace/snippets/assembly_x86', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/assembly_x86.js'));
    ace.config.setModuleUrl('ace/snippets/autohotkey', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/autohotkey.js'));
    ace.config.setModuleUrl('ace/snippets/batchfile', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/batchfile.js'));
    ace.config.setModuleUrl('ace/snippets/bro', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/bro.js'));
    ace.config.setModuleUrl('ace/snippets/c9search', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/c9search.js'));
    ace.config.setModuleUrl('ace/snippets/cirru', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/cirru.js'));
    ace.config.setModuleUrl('ace/snippets/clojure', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/clojure.js'));
    ace.config.setModuleUrl('ace/snippets/cobol', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/cobol.js'));
    ace.config.setModuleUrl('ace/snippets/coffee', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/coffee.js'));
    ace.config.setModuleUrl('ace/snippets/coldfusion', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/coldfusion.js'));
    ace.config.setModuleUrl('ace/snippets/csharp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/csharp.js'));
    ace.config.setModuleUrl('ace/snippets/csound_document', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/csound_document.js'));
    ace.config.setModuleUrl('ace/snippets/csound_orchestra', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/csound_orchestra.js'));
    ace.config.setModuleUrl('ace/snippets/csound_score', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/csound_score.js'));
    ace.config.setModuleUrl('ace/snippets/csp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/csp.js'));
    ace.config.setModuleUrl('ace/snippets/css', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/css.js'));
    ace.config.setModuleUrl('ace/snippets/curly', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/curly.js'));
    ace.config.setModuleUrl('ace/snippets/c_cpp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/c_cpp.js'));
    ace.config.setModuleUrl('ace/snippets/d', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/d.js'));
    ace.config.setModuleUrl('ace/snippets/dart', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/dart.js'));
    ace.config.setModuleUrl('ace/snippets/diff', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/diff.js'));
    ace.config.setModuleUrl('ace/snippets/django', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/django.js'));
    ace.config.setModuleUrl('ace/snippets/dockerfile', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/dockerfile.js'));
    ace.config.setModuleUrl('ace/snippets/dot', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/dot.js'));
    ace.config.setModuleUrl('ace/snippets/drools', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/drools.js'));
    ace.config.setModuleUrl('ace/snippets/edifact', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/edifact.js'));
    ace.config.setModuleUrl('ace/snippets/eiffel', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/eiffel.js'));
    ace.config.setModuleUrl('ace/snippets/ejs', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/ejs.js'));
    ace.config.setModuleUrl('ace/snippets/elixir', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/elixir.js'));
    ace.config.setModuleUrl('ace/snippets/elm', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/elm.js'));
    ace.config.setModuleUrl('ace/snippets/erlang', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/erlang.js'));
    ace.config.setModuleUrl('ace/snippets/forth', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/forth.js'));
    ace.config.setModuleUrl('ace/snippets/fortran', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/fortran.js'));
    ace.config.setModuleUrl('ace/snippets/fsharp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/fsharp.js'));
    ace.config.setModuleUrl('ace/snippets/fsl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/fsl.js'));
    ace.config.setModuleUrl('ace/snippets/ftl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/ftl.js'));
    ace.config.setModuleUrl('ace/snippets/gcode', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/gcode.js'));
    ace.config.setModuleUrl('ace/snippets/gherkin', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/gherkin.js'));
    ace.config.setModuleUrl('ace/snippets/gitignore', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/gitignore.js'));
    ace.config.setModuleUrl('ace/snippets/glsl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/glsl.js'));
    ace.config.setModuleUrl('ace/snippets/gobstones', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/gobstones.js'));
    ace.config.setModuleUrl('ace/snippets/golang', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/golang.js'));
    ace.config.setModuleUrl('ace/snippets/graphqlschema', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/graphqlschema.js'));
    ace.config.setModuleUrl('ace/snippets/groovy', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/groovy.js'));
    ace.config.setModuleUrl('ace/snippets/haml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/haml.js'));
    ace.config.setModuleUrl('ace/snippets/handlebars', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/handlebars.js'));
    ace.config.setModuleUrl('ace/snippets/haskell', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/haskell.js'));
    ace.config.setModuleUrl('ace/snippets/haskell_cabal', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/haskell_cabal.js'));
    ace.config.setModuleUrl('ace/snippets/haxe', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/haxe.js'));
    ace.config.setModuleUrl('ace/snippets/hjson', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/hjson.js'));
    ace.config.setModuleUrl('ace/snippets/html', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/html.js'));
    ace.config.setModuleUrl('ace/snippets/html_elixir', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/html_elixir.js'));
    ace.config.setModuleUrl('ace/snippets/html_ruby', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/html_ruby.js'));
    ace.config.setModuleUrl('ace/snippets/ini', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/ini.js'));
    ace.config.setModuleUrl('ace/snippets/io', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/io.js'));
    ace.config.setModuleUrl('ace/snippets/jack', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/jack.js'));
    ace.config.setModuleUrl('ace/snippets/jade', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/jade.js'));
    ace.config.setModuleUrl('ace/snippets/java', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/java.js'));
    ace.config.setModuleUrl('ace/snippets/javascript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/javascript.js'));
    ace.config.setModuleUrl('ace/snippets/json', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/json.js'));
    ace.config.setModuleUrl('ace/snippets/jsoniq', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/jsoniq.js'));
    ace.config.setModuleUrl('ace/snippets/jsp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/jsp.js'));
    ace.config.setModuleUrl('ace/snippets/jssm', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/jssm.js'));
    ace.config.setModuleUrl('ace/snippets/jsx', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/jsx.js'));
    ace.config.setModuleUrl('ace/snippets/julia', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/julia.js'));
    ace.config.setModuleUrl('ace/snippets/kotlin', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/kotlin.js'));
    ace.config.setModuleUrl('ace/snippets/latex', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/latex.js'));
    ace.config.setModuleUrl('ace/snippets/less', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/less.js'));
    ace.config.setModuleUrl('ace/snippets/liquid', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/liquid.js'));
    ace.config.setModuleUrl('ace/snippets/lisp', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/lisp.js'));
    ace.config.setModuleUrl('ace/snippets/livescript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/livescript.js'));
    ace.config.setModuleUrl('ace/snippets/logiql', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/logiql.js'));
    ace.config.setModuleUrl('ace/snippets/logtalk', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/logtalk.js'));
    ace.config.setModuleUrl('ace/snippets/lsl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/lsl.js'));
    ace.config.setModuleUrl('ace/snippets/lua', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/lua.js'));
    ace.config.setModuleUrl('ace/snippets/luapage', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/luapage.js'));
    ace.config.setModuleUrl('ace/snippets/lucene', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/lucene.js'));
    ace.config.setModuleUrl('ace/snippets/makefile', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/makefile.js'));
    ace.config.setModuleUrl('ace/snippets/markdown', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/markdown.js'));
    ace.config.setModuleUrl('ace/snippets/mask', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/mask.js'));
    ace.config.setModuleUrl('ace/snippets/matlab', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/matlab.js'));
    ace.config.setModuleUrl('ace/snippets/maze', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/maze.js'));
    ace.config.setModuleUrl('ace/snippets/mel', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/mel.js'));
    ace.config.setModuleUrl('ace/snippets/mixal', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/mixal.js'));
    ace.config.setModuleUrl('ace/snippets/mushcode', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/mushcode.js'));
    ace.config.setModuleUrl('ace/snippets/mysql', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/mysql.js'));
    ace.config.setModuleUrl('ace/snippets/nix', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/nix.js'));
    ace.config.setModuleUrl('ace/snippets/nsis', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/nsis.js'));
    ace.config.setModuleUrl('ace/snippets/objectivec', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/objectivec.js'));
    ace.config.setModuleUrl('ace/snippets/ocaml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/ocaml.js'));
    ace.config.setModuleUrl('ace/snippets/pascal', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/pascal.js'));
    ace.config.setModuleUrl('ace/snippets/perl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/perl.js'));
    ace.config.setModuleUrl('ace/snippets/perl6', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/perl6.js'));
    ace.config.setModuleUrl('ace/snippets/pgsql', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/pgsql.js'));
    ace.config.setModuleUrl('ace/snippets/php', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/php.js'));
    ace.config.setModuleUrl('ace/snippets/php_laravel_blade', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/php_laravel_blade.js'));
    ace.config.setModuleUrl('ace/snippets/pig', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/pig.js'));
    ace.config.setModuleUrl('ace/snippets/plain_text', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/plain_text.js'));
    ace.config.setModuleUrl('ace/snippets/powershell', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/powershell.js'));
    ace.config.setModuleUrl('ace/snippets/praat', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/praat.js'));
    ace.config.setModuleUrl('ace/snippets/prolog', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/prolog.js'));
    ace.config.setModuleUrl('ace/snippets/properties', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/properties.js'));
    ace.config.setModuleUrl('ace/snippets/protobuf', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/protobuf.js'));
    ace.config.setModuleUrl('ace/snippets/puppet', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/puppet.js'));
    ace.config.setModuleUrl('ace/snippets/python', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/python.js'));
    ace.config.setModuleUrl('ace/snippets/r', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/r.js'));
    ace.config.setModuleUrl('ace/snippets/razor', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/razor.js'));
    ace.config.setModuleUrl('ace/snippets/rdoc', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/rdoc.js'));
    ace.config.setModuleUrl('ace/snippets/red', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/red.js'));
    ace.config.setModuleUrl('ace/snippets/redshift', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/redshift.js'));
    ace.config.setModuleUrl('ace/snippets/rhtml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/rhtml.js'));
    ace.config.setModuleUrl('ace/snippets/rst', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/rst.js'));
    ace.config.setModuleUrl('ace/snippets/ruby', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/ruby.js'));
    ace.config.setModuleUrl('ace/snippets/rust', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/rust.js'));
    ace.config.setModuleUrl('ace/snippets/sass', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/sass.js'));
    ace.config.setModuleUrl('ace/snippets/scad', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/scad.js'));
    ace.config.setModuleUrl('ace/snippets/scala', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/scala.js'));
    ace.config.setModuleUrl('ace/snippets/scheme', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/scheme.js'));
    ace.config.setModuleUrl('ace/snippets/scss', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/scss.js'));
    ace.config.setModuleUrl('ace/snippets/sh', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/sh.js'));
    ace.config.setModuleUrl('ace/snippets/sjs', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/sjs.js'));
    ace.config.setModuleUrl('ace/snippets/slim', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/slim.js'));
    ace.config.setModuleUrl('ace/snippets/smarty', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/smarty.js'));
    ace.config.setModuleUrl('ace/snippets/snippets', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/snippets.js'));
    ace.config.setModuleUrl('ace/snippets/soy_template', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/soy_template.js'));
    ace.config.setModuleUrl('ace/snippets/space', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/space.js'));
    ace.config.setModuleUrl('ace/snippets/sparql', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/sparql.js'));
    ace.config.setModuleUrl('ace/snippets/sql', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/sql.js'));
    ace.config.setModuleUrl('ace/snippets/sqlserver', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/sqlserver.js'));
    ace.config.setModuleUrl('ace/snippets/stylus', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/stylus.js'));
    ace.config.setModuleUrl('ace/snippets/svg', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/svg.js'));
    ace.config.setModuleUrl('ace/snippets/swift', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/swift.js'));
    ace.config.setModuleUrl('ace/snippets/tcl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/tcl.js'));
    ace.config.setModuleUrl('ace/snippets/terraform', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/terraform.js'));
    ace.config.setModuleUrl('ace/snippets/tex', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/tex.js'));
    ace.config.setModuleUrl('ace/snippets/text', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/text.js'));
    ace.config.setModuleUrl('ace/snippets/textile', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/textile.js'));
    ace.config.setModuleUrl('ace/snippets/toml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/toml.js'));
    ace.config.setModuleUrl('ace/snippets/tsx', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/tsx.js'));
    ace.config.setModuleUrl('ace/snippets/turtle', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/turtle.js'));
    ace.config.setModuleUrl('ace/snippets/twig', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/twig.js'));
    ace.config.setModuleUrl('ace/snippets/typescript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/typescript.js'));
    ace.config.setModuleUrl('ace/snippets/vala', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/vala.js'));
    ace.config.setModuleUrl('ace/snippets/vbscript', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/vbscript.js'));
    ace.config.setModuleUrl('ace/snippets/velocity', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/velocity.js'));
    ace.config.setModuleUrl('ace/snippets/verilog', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/verilog.js'));
    ace.config.setModuleUrl('ace/snippets/vhdl', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/vhdl.js'));
    ace.config.setModuleUrl('ace/snippets/visualforce', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/visualforce.js'));
    ace.config.setModuleUrl('ace/snippets/wollok', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/wollok.js'));
    ace.config.setModuleUrl('ace/snippets/xml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/xml.js'));
    ace.config.setModuleUrl('ace/snippets/xquery', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/xquery.js'));
    ace.config.setModuleUrl('ace/snippets/yaml', require('file-loader?name=js/ace-modules/[hash].js!ace-builds/src-noconflict/snippets/yaml.js'));

    return ace;
  });
}

