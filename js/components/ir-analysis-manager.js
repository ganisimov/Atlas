define(['knockout', 'text!./ir-analysis-manager.html', 'webapi/IRAnalysisAPI', 'iranalysis/IRAnalysisDefinition', 'ohdsi.util',
				'iranalysis', 'databindings', 'conceptsetbuilder/components', 'circe'
], function (ko, template, iraAPI, IRAnalysisDefinition, ohdsiUtil) {
	function IRAnalysisManager(params) {
		var self = this;
		self.model = params.model;
		self.loading = ko.observable(false);
		self.analysisList = ko.observableArray();
		self.selectedAnalysis = ko.observable();
		
		self.dirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(self.selectedAnalysis));
		self.isRunning = ko.observable(false);
		self.tabMode = ko.observable('definition');
		self.conceptSetEditor = ko.observable(); // stores a refrence to the concept set editor
		self.showConceptSetBrowser = ko.observable(false);
		self.criteriaContext = ko.observable();
		
		// model behaviors

		self.refresh = function() {
			self.loading(true);
			iraAPI.getAnalysisList().then(function(result) {
				self.analysisList(result);
				self.loading(false);
			});
		}
		
		self.onAnalysisSelected = function (analysis) {
			self.loading(true);
			iraAPI.getAnalysis(analysis.id).then(function (analysis) {
				self.selectedAnalysis(new IRAnalysisDefinition(analysis));
				self.dirtyFlag().reset();
				self.loading(false);
			});
		};
		
		self.handleConceptSetSelect = function (item) {
			self.criteriaContext(item);
			self.showConceptSetBrowser(true);
		}
		
		self.onConceptSetSelectAction = function(result, valueAccessor) {
			self.showConceptSetBrowser(false);

			if (result.action=='add') {
				var newConceptSet = self.conceptSetEditor().createConceptSet();
				self.criteriaContext() && self.criteriaContext().conceptSetId(newConceptSet.id);
				self.tabMode('conceptsets');
			}
			self.criteriaContext(null);
		}				

		self.copy = function() {
			self.loading(true);
			iraAPI.copyAnalysis(self.selectedAnalysis().id()).then(function (analysis) {
				self.selectedAnalysis(new IRAnalysisDefinition(analysis));
				self.dirtyFlag().reset();
				self.loading(false);
			});	
		}
		
		self.close = function() {
			if (self.dirtyFlag().isDirty() && !confirm("Incidence Rate Analysis changes are not saved. Would you like to continue?")) {
				return;
			}
			self.selectedAnalysis(null);
			self.refresh();
		}
		
		self.save = function() {
			self.loading(true);
			iraAPI.saveAnalysis(self.selectedAnalysis()).then(function (analysis) {
				self.selectedAnalysis(new IRAnalysisDefinition(analysis));
				self.dirtyFlag().reset();
				self.loading(false);
			});
		}
		
		self.delete = function() {
			if (!confirm("Delete incidence rate analysis? Warning: deletion can not be undone!"))
				return;
			
			// reset view after save
			iraAPI.deleteAnalysis(self.selectedAnalysis().id()).then(function (result) {
				self.selectedAnalysis(null);
				self.refresh();
			});
		}
		
		self.newAnalysis = function() {
			self.selectedAnalysis(new IRAnalysisDefinition());
			self.dirtyFlag().reset();
		};
		
		// refresh when instantiated
		self.refresh();
		

	}

	var component = {
		viewModel: IRAnalysisManager,
		template: template
	};

	ko.components.register('ir-analysis-manager', component);
	return component;
});