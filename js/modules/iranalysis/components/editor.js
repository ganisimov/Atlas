define(['knockout', 'text!./editor.html','../inputTypes/StudyWindow', '../StratifyRule','webapi/CohortDefinitionAPI', 
				'conceptsetbuilder/components','cohort-definition-browser', 
				'databindings', 'cohortbuilder/components'
], function (ko, template, StudyWindow, StratifyRule, cohortAPI) {
	function IRAnalysisEditorModel(params) {
		var self = this;
		self.analysis = params.analysis;
		self.loading = ko.observable(false);
		self.cohortDefs = ko.observableArray();
		self.showCohortDefinitionBrowser = ko.observable(false);
		self.selectedCohortList = null;
		self.selectedStrataRule = ko.observable();
		
		self.resolveCohortId = function(cohortId) {
			var cohortDef = self.cohortDefs().filter(function(def) { 
				return def.id == cohortId;
			})[0];
			return (cohortDef && cohortDef.name) || "Unknown Cohort";	
		}
		
		self.addStudyWindow = function() {
			self.analysis().studyWindow(new StudyWindow());
		}
		
		self.addTargetCohort = function() {
			self.selectedCohortList = self.analysis().targetIds;
			self.showCohortDefinitionBrowser(true);
		}

		self.addOutcomeCohort = function() {
			self.selectedCohortList = self.analysis().outcomeIds;
			self.showCohortDefinitionBrowser(true);
		}
		
		self.deleteTargetCohort = function(cohortId) {
			self.analysis().targetIds.remove(cohortId);	
		}

		self.deleteOutcomeCohort = function(cohortId) {
			self.analysis().outcomeIds.remove(cohortId);	
		}
		
		self.cohortSelected = function(cohortId) {
			self.selectedCohortList.push(cohortId);
		}

		self.copyStrataRule = function(rule) {
			console.log(rule);
		}
		
		self.deleteStrataRule = function(rule) {
			self.selectedStrataRule(null);
			self.analysis().strata.remove(rule);
		}
	
		self.selectStrataRule = function(rule) {
			self.selectedStrataRule(rule);	
		}
		
		self.addStrataRule = function() {
			var newStratifyRule = new StratifyRule(null, self.analysis().ConceptSets);
			self.analysis().strata.push(newStratifyRule);
			self.selectedStrataRule(newStratifyRule);			
		}
		
		
		// Init actions
		self.cohortDefinitions = cohortAPI.getCohortDefinitionList().then(function(list) {
			self.cohortDefs(list);
		})
	}

	var component = {
		viewModel: IRAnalysisEditorModel,
		template: template
	};

	return component;
});