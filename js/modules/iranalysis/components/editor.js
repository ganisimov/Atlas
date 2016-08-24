define(['knockout', 'text!./browser.html',
], function (ko, template) {
	function IRAnalysisEditorModel(params) {
		var self = this;

		self.loading = ko.observable(false);

	}

	var component = {
		viewModel: IRAnalysisEditorModel,
		template: template
	};

	return component;
});