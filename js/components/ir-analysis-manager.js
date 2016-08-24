define(['knockout', 'text!./ir-analysis-manager.html', 'webapi/IRAnalysisAPI', 'iranalysis'
], function (ko, template, iraAPI) {
	function IRAnalysisManager(params) {
		var self = this;

		self.loading = ko.observable(false);
		self.analysisList = ko.observableArray();
		
		iraAPI.getAnalysisList().then(function(result) {
			self.analysisList(result);
		});
		

	}

	var component = {
		viewModel: IRAnalysisManager,
		template: template
	};

	ko.components.register('ir-analysis-manager', component);
	return component;
});