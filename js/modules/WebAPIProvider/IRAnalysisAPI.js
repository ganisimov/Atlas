define(function (require, exports) {

	var $ = require('jquery');
	var ko = require('knockout');
	var config = require('appConfig');
	
	function pruneJSON(key, value) {
		if (value === 0 || value) {
			return value;
		} else {
			return
		}
	}
	
	function getAnalysisList() {
		var promise = $.ajax({
			url: config.webAPIRoot + 'ir/'
		});
		return promise;
	}
	
	function getAnalysis(id) {
		var loadPromise = $.Deferred();
		$.ajax({
			url: config.webAPIRoot + 'ir/' + id,
			error: function (error) {
				console.log("Error: " + error);
			}
		}).then(function (result) {
			result.expression = JSON.parse(result.expression);
			loadPromise.resolve(result);
		});
		return loadPromise;	
	}
		
	function saveAnalysis(definition) {
		var definitionCopy = JSON.parse(ko.toJSON(definition))
		
		if (typeof definitionCopy.expression != 'string')
			definitionCopy.expression = JSON.stringify(definitionCopy.expression);
		
		var savePromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (definitionCopy.id || ""),
			method: 'PUT',
			contentType: 'application/json',
			data: JSON.stringify(definitionCopy),
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return savePromise;
	}
	
	function copyAnalysis(id) {
		var copyPromise = $.Deferred();
		$.ajax({
			url: config.webAPIRoot + 'ir/' + (id || "") +"/copy",
			method: 'GET',
			contentType: 'application/json',
			error: function (error) {
				console.log("Error: " + error);
			}
		}).then(function (result) {
			result.expression = JSON.parse(result.expression);
			copyPromise.resolve(result);
		});
		return copyPromise;	
	}	
	
	function deleteAnalysis(id) {
		var deletePromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (id || ""),
			method: 'DELETE',
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return deletePromise;
	}		
	
	function execute(analysisId, sourceKey) {
		var executePromise = $.ajax({
			url: config.webAPIRoot + 'cohortdefinition/' + (analysisId || '-1') + '/execute/' + sourceKey,
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return executePromise;
	}
	
	function getInfo(analysisId) {
		var infoPromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (AnalysisId || '-1') + '/info',
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return infoPromise;
	}
	
	function getReport(analysisId, sourceKey) {
		var reportPromise = $.ajax({
			url: config.webAPIRoot + 'ir/' + (analysisId || '-1') + '/report/' + sourceKey,
			error: function (error) {
				console.log("Error: " + error);
			}
		});
		return reportPromise;
	}	
	
	var api = {
		getAnalysisList: getAnalysisList,
		getAnalysis: getAnalysis,
		saveAnalysis: saveAnalysis,
		copyAnalysis: copyAnalysis,
		deleteAnalysis: deleteAnalysis,
		execute: execute,
		getInfo: getInfo,
		getReport: getReport
	}

	return api;
});