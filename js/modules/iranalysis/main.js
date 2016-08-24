define(function (require, exports) {
	
	var ko = require('knockout')
	
	var irAnalysisEditor = require('./components/editor');
	ko.components.register('ir-analysis-editor', irAnalysisEditor);
	
	var irAnalysisBrowser = require('./components/browser');
	ko.components.register('ir-analysis-browser', irAnalysisBrowser);
	
});
