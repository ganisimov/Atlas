define(['knockout', 'text!./browser.html'
], function (ko, template) {
	function IRAnalysisBrowserModel(params) {
		var self = this;

		self.analysisList = params.analysisList;
		self.loading = ko.observable(false);

	}

	var component = {
		viewModel: IRAnalysisBrowserModel,
		template: template
	};

	return component;
});