define(['knockout', 
				'text!./ir-analysis-manager.html', 
				'webapi/IRAnalysisAPI',
				'webapi/SourceAPI',
				'webapi/CohortDefinitionAPI',
				'iranalysis/IRAnalysisDefinition', 
				'ohdsi.util',
				'iranalysis', 
				'databindings', 
				'conceptsetbuilder/components', 
				'circe'
], function (ko, template, iraAPI, sourceAPI, cohortAPI, IRAnalysisDefinition, ohdsiUtil) {
	function IRAnalysisManager(params) {
		
		
		resolveCohortId = function(cohortId) {
			var cohortDef = self.cohortDefs().filter(function(def) { 
				return def.id == cohortId;
			})[0];
			return (cohortDef && cohortDef.name) || "Unknown Cohort";	
		}
		
		var self = this;
		self.model = params.model;
		self.loading = ko.observable(false);
		self.analysisList = ko.observableArray();
		self.selectedAnalysis = ko.observable();
		
		self.dirtyFlag = ko.observable(new ohdsiUtil.dirtyFlag(self.selectedAnalysis));
		self.isRunning = ko.observable(false);
		self.activeTab = ko.observable('definition');
		self.conceptSetEditor = ko.observable(); // stores a refrence to the concept set editor
		self.sources = ko.observableArray();
		self.filteredSources = ko.pureComputed(function () {
			return self.sources().filter(function (source) {
				return source.info();
			});
		});
		
		self.cohortDefs = ko.observableArray();
		self.analysisCohorts = ko.pureComputed(function() {
			var analysisCohorts = { targetCohorts: ko.observableArray(), outcomeCohorts: ko.observableArray() };
			if (self.selectedAnalysis())
			{
				analysisCohorts.targetCohorts(self.selectedAnalysis().expression().targetIds().map(function(targetId) {
					return ({ id: targetId, name: resolveCohortId(targetId) });
				}));
				
				analysisCohorts.outcomeCohorts(self.selectedAnalysis().expression().outcomeIds().map(function(outcomeId) {
					return ({ id: outcomeId, name: resolveCohortId(outcomeId) });
				}));
			}
			return analysisCohorts;
		});
		
		self.showConceptSetBrowser = ko.observable(false);
		self.criteriaContext = ko.observable();
		self.generateActionsSettings = {
			selectText: "Generate...",
			width: 100,
			actionOptions: null,  // initalized in the startup actions
			onAction: function (data) {
				data.selectedData.action();
			}
		};		
		
		// model behaviors

		self.refresh = function() {
			self.loading(true);
			iraAPI.getAnalysisList().then(function(result) {
				self.analysisList(result);
				self.loading(false);
			}).then(function(result) {
				// load cohort definition lookup
				cohortAPI.getCohortDefinitionList().then(function(list) {
					self.cohortDefs(list);
				});	
			})
		}
		
		self.onAnalysisSelected = function (analysis) {
			self.loading(true);
			self.refresh();
			iraAPI.getAnalysis(analysis.id).then(function (analysis) {
				self.selectedAnalysis(new IRAnalysisDefinition(analysis));
				self.dirtyFlag().reset();
				self.activeTab('definition');
				self.loading(false);
				pollForInfo();
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
				self.activeTab('conceptsets');
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
			self.sources().forEach(function(source) {
				source.info(null);
			});
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
		
		self.removeResult = function(analysisResult) {
			iraAPI.deleteInfo(self.selectedAnalysis().id(),analysisResult.source.sourceKey).then(function(result) {
				var source = self.sources().filter(function (s) { return s.source.sourceId == analysisResult.source.sourceId })[0];
				source.info(null);
			});
		}
		
		self.newAnalysis = function() {
			self.selectedAnalysis(new IRAnalysisDefinition());
			self.dirtyFlag().reset();
		};
		
		self.onExecuteClick = function(sourceItem) {
			var executePromise = iraAPI.execute(self.selectedAnalysis().id(), sourceItem.source.sourceKey);
			executePromise.then(function (result) {
				pollForInfo();
			});			
		}
		
		
		// polling support
		
		var pollTimeout = null;

		function pollForInfo() {
			iraAPI.getInfo(self.selectedAnalysis().id()).then(function(infoList) {
				var hasPending = false;
				infoList.forEach(function(info){
					var source = self.sources().filter(function (s) { return s.source.sourceId == info.executionInfo.id.sourceId })[0];
					source.info(info);
					if (info.executionInfo.status != "COMPLETE")
						hasPending = true;
				});

				if (hasPending)
				{
					pollTimeout = setTimeout(function () {
						pollForInfo();
					},10000);
				}
			});
		}
		
		// startup actions
		// refresh when instantiated
		self.refresh();

		sourceAPI.getSources().then(function(sources) {
			var sourceList = [];
			sources.forEach(function(source) {
				if (source.daimons.filter(function (daimon) { return daimon.daimonType == "CDM"; }).length > 0
						&& source.daimons.filter(function (daimon) { return daimon.daimonType == "Results"; }).length > 0)
				{
					sourceList.push({
						source: source,
						info: ko.observable()
					});
				}
			});
			self.sources(sourceList);
			self.generateActionsSettings.actionOptions = sourceList.map(function (sourceItem) {
				return {
					text: sourceItem.source.sourceName,
					selected: false,
					description: "Perform Study on source: " + sourceItem.source.sourceName,
					action: function() {
						if (sourceItem.info()) {
							sourceItem.info().executionInfo.status = "PENDING";
							sourceItem.info.notifySubscribers();
						} 
						else {
							// creating 'fake' temporary source info makes the UI respond to the generate action.
							tempInfo = { 
								source: sourceItem,
								executionInfo : {
									id : { sourceId: sourceItem.source.sourceId }
								}, 
								summaryList: []
							};
							sourceItem.info(tempInfo);
						}
						var executePromise = iraAPI.execute(self.selectedAnalysis().id(), sourceItem.source.sourceKey);
						executePromise.then(function (result) {
							pollForInfo();
						});
					}
				}
			});				
		});		

	}

	var component = {
		viewModel: IRAnalysisManager,
		template: template
	};

	ko.components.register('ir-analysis-manager', component);
	return component;
});