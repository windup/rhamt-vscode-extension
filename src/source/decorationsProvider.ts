
// import {
//   Range,
//   TextEditor,
//   ThemeColor,
//   window,
// } from 'vscode';
// import { ModelService } from '../model/modelService';
// import { StatusBar } from './statusBar';

// export class DecorationsProvider {
  
//   private modelService: ModelService;
//   private statusBar: StatusBar;
//   public fixedHintLines: Range[];
//   public unfixedHintLines: Range[];

//   private unfixedHintDecorationType = window.createTextEditorDecorationType({
//       backgroundColor: new ThemeColor('editor.stackFrameHighlightBackground')
//   });

//   private fixedHintDecorationType = window.createTextEditorDecorationType({
//     backgroundColor: new ThemeColor("$(testing.iconPassed)")
//   });

//   constructor(modelService: ModelService, statusBar: StatusBar) {
//     this.modelService = modelService;
//     this.statusBar = statusBar;
//     this.fixedHintLines = Array<Range>();
//     this.unfixedHintLines = Array<Range>();

//     window.onDidChangeActiveTextEditor(this.onDidChangeActiveTextEditor, this);
//     this.onDidChangeActiveTextEditor(window.activeTextEditor);
//   }

//   public onDidChangeActiveTextEditor(editor?: TextEditor) {
//     if (editor && this.statusBar.isDecorationsEnabled) {
//       this.decorate(editor);
//     }
//   }

//   public toggleHints() {
//     if (this.statusBar.isDecorationsEnabled) {
//       this.statusBar.toggle(false);
//       this.fixedHintLines = [];
//       this.unfixedHintLines = [];
//       const editor = window.activeTextEditor;
//       if (editor) {
//         editor.setDecorations(this.unfixedHintDecorationType, this.unfixedHintLines);
//         editor.setDecorations(this.fixedHintDecorationType, this.fixedHintLines);
//       }
//     } else {
//       this.decorate(window.activeTextEditor);
//       this.statusBar.toggle(true);
//     }
//   }

//   public decorate(editor?: TextEditor) {
//     try {
//       this.unfixedHintLines = [];
//       this.fixedHintLines = [];
//       if (editor) {
//         const doc = editor.document;
//         this.modelService.getActiveHints().filter(issue => doc.uri.fsPath === issue.file).forEach(issue => {
//           const lineNumber = issue.lineNumber-1;
//           const lineOfText = doc.lineAt(lineNumber);
//           if (lineOfText.isEmptyOrWhitespace || (issue.originalLineSource && lineOfText.text !== issue.originalLineSource)) {
//               return undefined;
//           }
//           const range = new Range(lineNumber, issue.column, lineNumber, issue.length+issue.column);
//           this.unfixedHintLines.push(range);
//         });
//         editor.setDecorations(this.unfixedHintDecorationType, this.unfixedHintLines);
//       }
//     } catch (e) {
//       // telemetry
//       window.showWarningMessage(e.message);
//     }
//   }
// }
