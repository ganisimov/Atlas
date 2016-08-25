define(function (require, exports) {

	var ko = require('knockout');
	var StudyWindow = require('./inputTypes/StudyWindow');
	var ConceptSet = require('conceptsetbuilder/InputTypes/ConceptSet');
	var StratifyRule = require('./StratifyRule');
	
	function IRAnalysisExpression(data) {
		var self = this;
		var data = data || {};

		
		self.ConceptSets = ko.observableArray(data.ConceptSets && data.ConceptSets.map(function(d) { return new ConceptSet(d) }));
		self.targetIds = ko.observableArray(data.targetIds);
		self.outcomeIds = ko.observableArray(data.outcomeIds);
		self.studyWindow =  ko.observable(data.studyWindow && new StudyWindow(data.studyWindow));
		self.strata = ko.observableArray(data.strata && data.strata.map(function (rule) {
			return new StratifyRule(rule, self.ConceptSets);	
		}));
		
	}
	return IRAnalysisExpression;
});