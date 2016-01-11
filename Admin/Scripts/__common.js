"use strict"; //ignore jslint
var CDC = CDC || {};
CDC.Admin = CDC.Admin || {};

var APIRoot = '',
    publicAPIRoot = '',
    webFolder = '',
    publicWebRoot = '',
    formAuthentication = '',
    FeedCategoryValueSetId = '',
    FeedSubCategoryValueSetId = '',
    _ctx = null, _cache = null, urlRoot = '', features = {};

var getWebFolder = function () {
	var webFolder = '';

	if (
    document.location.toString().toLowerCase().indexOf('//.....[productionAdminServer].....') > -1 ||
		document.location.toString().toLowerCase().indexOf('//.....[devReportingApplicationServer2].....') > -1 ||
		document.location.toString().toLowerCase().indexOf('//.....[testReportingApplicationServer2].....') > -1 ||
		document.location.toString().toLowerCase().indexOf('//oadc-dmb-stage-.....[productionAdminServer].....') > -1){
		webFolder = 'medialibraryadmin';
	}
	else if (document.location.toString().toLowerCase().indexOf('test_admin') > -1) {
		webFolder = 'test_Admin';
	}
	else if (document.location.toString().toLowerCase().indexOf('dev_admin') > -1) {
		webFolder = 'dev_Admin';
	}
	else {
		webFolder = '';
	}

	return webFolder;
};

var loadConfigValues = function (postProcess) {

	webFolder = getWebFolder();
	urlRoot = location.protocol + '//' + location.hostname + (location.port ? ':' + location.port : '');
	if (webFolder && webFolder !== '') {
		urlRoot += "/" + webFolder;
	}

	//feature toggles
	features.auth0 = true;

	var loadConfigValues = function () {
		$.ajax({
			type: "POST",
			url: urlRoot + "/Secure.aspx/GetConfigValues",
			data: "",
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function (response) {
				var obj = JSON.parse(response.d);
				APIRoot = obj.APIRoot;
				publicAPIRoot = obj.PublicAPIRoot;
				publicWebRoot = obj.PublicWebRoot;
				formAuthentication = obj.FormAuthentication;
				FeedCategoryValueSetId = obj.FeedCategoryValueSetId;
				FeedSubCategoryValueSetId = obj.FeedSubCategoryValueSetId;
				if (typeof postProcess === 'function') {
					postProcess();
				}
			},
			error: function (xhr, ajaxOptions, thrownError) {
				console.debug(xhr.status);
				console.debug(thrownError);
				console.debug(xhr.responseText);
			}
		});
	};

	loadConfigValues();

}


// start context code ///////////////////////////////////
CDC.Admin.Global = CDC.Admin.Global || {};
CDC.Admin.Global = {
	context: {

		NavTarget: "",
		SelectedMediaId: "",
		SelectedCollection: {
			Id: "",
			Name: "",
			aValues: []
		},
		SelectedFeed: {
			Id: "",
			Name: ""
		},
		MediaType: "",
		FilterLoaded: false,
		Filter: {
			MediaId: "",
			Title: "",
			MediaType: "",
			Language: "",
			Url: "",
			StatusSearch: "",
			PersistentUrlKey: "",
			Topic: "",
			TopicId: "",
			Audience: "",
			Source: "",
			MaintainingOrganization: "",
			OwningOrganization: "",
			FromDate: "",
			ToDate: "",
			DateType: "",
			PageData: ""
		},
		UserInfo: {},

		setUserInfo: function (userInfo) {
			this.UserInfo = userInfo;
			this.updateContext();
		},

		setNavTarget: function (navTarget) {
			this.NavTarget = navTarget;
			this.updateContext();
		},

		setSelectedMediaId: function (SelectedMediaId) {
			this.SelectedMediaId = SelectedMediaId;
			this.updateContext();
		},

		setSelectedCollection: function (CollectionId, CollectionName, aCollectionValues) {
			this.SelectedMediaId = "";
			this.SelectedCollection.Id = CollectionId;
			this.SelectedCollection.Name = CollectionName;
			this.SelectedCollection.aValues = aCollectionValues;
			this.updateContext();
		},

		setSelectedFeed: function (FeedId, FeedName) {
			this.SelectedMediaId = "";
			this.SelectedFeed.Id = FeedId;
			this.SelectedFeed.Name = FeedName;
			this.updateContext();
		},

		setMediaType: function (MediaType) {
			this.MediaType = MediaType;
			this.updateContext();
		},

		// filter parms ////////////////////
		setFilterMediaId: function (FilterMediaId) {
			if (FilterMediaId !== '') {
				this.FilterLoaded = true;
			}
			this.Filter.MediaId = FilterMediaId;
			this.updateContext();
		},

		setFilterTitle: function (FilterTitle) {
			this.Filter.Title = FilterTitle;
			this.updateContext();
		},

		setFilterMediaType: function (FilterMediaType) {
			this.Filter.MediaType = FilterMediaType;
			this.updateContext();
		},

		setFilterLanguage: function (FilterLanguage) {
			if (FilterLanguage !== '') {
				this.FilterLoaded = true;
			}
			this.Filter.Language = FilterLanguage;
			this.updateContext();
		},

		setFilterUrl: function (FilterUrl) {
			if (FilterUrl !== '') {
				this.FilterLoaded = true;
			}
			this.Filter.Url = FilterUrl;
			this.updateContext();
		},

		setFilterStatusSearch: function (FilterStatusSearch) {
			if (FilterStatusSearch !== 'published') {
				this.FilterLoaded = true;
			}
			this.Filter.StatusSearch = FilterStatusSearch;
			this.updateContext();
		},

		setFilterPersistentUrlKey: function (FilterPersistentUrlKey) {
			if (FilterPersistentUrlKey !== '') {
				this.FilterLoaded = true;
			}
			this.Filter.PersistentUrlKey = FilterPersistentUrlKey;
			this.updateContext();
		},

		setFilterTopic: function (FilterTopic, TopicId) {
			this.Filter.Topic = FilterTopic;
			this.Filter.TopicId = TopicId;
			this.updateContext();
		},

		setFilterAudience: function (FilterAudience) {
			if (FilterAudience !== '') {
				this.FilterLoaded = true;
			}
			this.Filter.Audience = FilterAudience;
			this.updateContext();
		},

		setFilterSource: function (FilterSource) {
			if (FilterSource !== '') {
				this.FilterLoaded = true;
			}
			this.Filter.Source = FilterSource;
			this.updateContext();
		},

		setFilterMaintainingOrganization: function (FilterMaintainingOrganization) {
			if (FilterMaintainingOrganization !== '') {
				this.FilterLoaded = true;
			}
			this.Filter.MaintainingOrganization = FilterMaintainingOrganization;
			this.updateContext();
		},

		setFilterOwningOrganization: function (FilterOwningOrganization) {
			if (FilterOwningOrganization !== '') {
				this.FilterLoaded = true;
			}
			this.Filter.OwningOrganization = FilterOwningOrganization;
			this.updateContext();
		},

		setFilterFromDate: function (FilterFromDate) {
			if (FilterFromDate && FilterFromDate !== '') {
				this.FilterLoaded = true;
			}
			this.Filter.FromDate = FilterFromDate;
			this.updateContext();
		},

		setFilterToDate: function (FilterToDate) {
			if (FilterToDate && FilterToDate !== '') {
				this.FilterLoaded = true;
			}
			this.Filter.ToDate = FilterToDate;
			this.updateContext();
		},

		setFilterDateType: function (FilterDateType) {
			if (FilterDateType !== "publishDate") {
				this.FilterLoaded = true;
			}
			this.Filter.DateType = FilterDateType;
			this.updateContext();
		},

		setPageData: function (PageData) {

			this.Filter.PageData = PageData;
			this.updateContext();
		},

		// end filter parms

		clearFilterParms: function () {
			this.FilterLoaded = false;
			this.Filter = {
				MediaId: "",
				Title: "",
				MediaType: "",
				Language: "",
				Url: "",
				StatusSearch: "",
				PersistentUrlKey: "",
				Topic: "",
				TopicId: "",
				Audience: "",
				Source: "",
				MaintainingOrganization: "",
				OwningOrganization: "",
				FromDate: "",
				ToDate: "",
				DateType: "",
				PageData: ""
			};
			this.updateContext();
		},

		updateContext: function () {

			// drop full context into cookie;
			$.cookie("ContentServicesAdminContext", JSON.stringify(this), { path: '/' + webFolder });
			_ctx = getCurrentContext(this);

		}
	},

	cache: {

		languages: {},
		sources: {},
		businessOrgs: {},
		mediaTypes: {},

		setLanguages: function (languages) {
			this.languages = languages;
			this.updateCache();
		},

		setSources: function (sources) {
			this.sources = sources;
			this.updateCache();
		},

		setBusinessOrgs: function (businessOrgs) {
			this.businessOrgs = businessOrgs;
			//this.updateCache();
		},

		setMediaTypes: function (mediaTypes) {
			this.mediaTypes = mediaTypes;
			this.updateCache();
		},

		updateCache: function () {

			// drop full context into cookie;
			$.cookie("ContentServicesAdminCache", JSON.stringify(this), { path: '/' });
			_cache = getCurrentCache(this);

		}

	}
};

function getCurrentContext(c) {
	var o;
	var stored = $.cookie("ContentServicesAdminContext");
	if (stored !== null && stored !== '') {
		o = jQuery.parseJSON(stored);

		c.NavTarget = o.NavTarget;
		c.SelectedMediaId = o.SelectedMediaId;
		c.SelectedCollection.Id = o.SelectedCollection === undefined ? '' : o.SelectedCollection.Id;
		c.SelectedCollection.Name = o.SelectedCollection === undefined ? '' : o.SelectedCollection.Name;
		c.SelectedCollection.aValues = o.SelectedCollection === undefined ? '' : o.SelectedCollection.aValues;

		c.SelectedFeed.Id = o.SelectedFeed === undefined ? '' : o.SelectedFeed.Id;
		c.SelectedFeed.Name = o.SelectedFeed === undefined ? '' : o.SelectedFeed.Name;

		c.MediaType = o.MediaType; c.Filter.MediaId = o.Filter === undefined ? '' : o.Filter.MediaId;

		c.FilterLoaded = o.FilterLoaded === undefined ? '' : o.FilterLoaded;
		c.Filter.MediaId = o.Filter === undefined ? '' : o.Filter.MediaId;
		c.Filter.Title = o.Filter === undefined ? '' : o.Filter.Title;
		c.Filter.MediaType = o.Filter === undefined ? '' : o.Filter.MediaType;
		c.Filter.Language = o.Filter === undefined ? '' : o.Filter.Language;
		c.Filter.Url = o.Filter === undefined ? '' : o.Filter.Url;
		c.Filter.StatusSearch = o.Filter === undefined ? '' : o.Filter.StatusSearch;
		c.Filter.PersistentUrlKey = o.Filter === undefined ? '' : o.Filter.PersistentUrlKey;
		c.Filter.Topic = o.Filter === undefined ? '' : o.Filter.Topic;
		c.Filter.TopicId = o.Filter === undefined ? '' : o.Filter.TopicId;
		c.Filter.Audience = o.Filter === undefined ? '' : o.Filter.Audience;
		c.Filter.Source = o.Filter === undefined ? '' : o.Filter.Source;
		c.Filter.MaintainingOrganization = o.Filter === undefined ? '' : o.Filter.MaintainingOrganization;
		c.Filter.OwningOrganization = o.Filter === undefined ? '' : o.Filter.OwningOrganization;
		c.Filter.FromDate = o.Filter === undefined ? '' : o.Filter.FromDate;
		c.Filter.ToDate = o.Filter === undefined ? '' : o.Filter.ToDate;
		c.Filter.DateType = o.Filter === undefined ? '' : o.Filter.DateType;
		c.Filter.PageData = o.Filter === undefined ? '' : o.Filter.PageData;

		c.UserInfo = o.UserInfo;
	}

	return c;
}

CDC.Admin.Global.ctx = getCurrentContext(CDC.Admin.Global.context);
_ctx = CDC.Admin.Global.ctx;

function getCurrentCache(c) {
	var o;
	var stored = $.cookie("ContentServicesAdminCache");
	if (stored !== null && stored !== '') {
		o = jQuery.parseJSON(stored);
		c.languages = o.languages;
		c.sources = o.sources;
		c.businessOrgs = o.businessOrgs;
		c.mediaTypes = o.mediaTypes;
	}

	return c;
}

CDC.Admin.Global.cache = getCurrentCache(CDC.Admin.Global.cache);
_cache = CDC.Admin.Global.cache;

// end context code ////////////////////////////

CDC.Admin.Collection = CDC.Admin.Collection || {};
CDC.Admin.Collection = {

	addMedia: function (collectionId, mediaId, callBack) {
		var handleCallback = function (oMedia) {
			_ctx.SelectedCollection.aValues.push(eval(mediaId));
			var func = callBack; if (typeof func === 'function') {
				func(oMedia);
			}
		};

		CDC.Admin.Media.getMedia(collectionId, function (oMedia) {			
			if (oMedia.childRelationships !== null && oMedia.childRelationships instanceof Array) {
				oMedia.childRelationships.push({ relatedMediaId: mediaId, displayOrdinal: 0 });
				CDC.Admin.Media.saveMedia(oMedia, handleCallback);
			} else {
				handleCallback(oMedia);
			}
		});
	},

	removeMedia: function (collectionId, mediaId, callBack) {

		var handleCallback = function (oMedia) {
			_ctx.SelectedCollection.aValues = jQuery.grep(_ctx.SelectedCollection.aValues, function (value) {
				return value !== eval(mediaId);
			});
			var func = callBack;
			if (typeof func === 'function') { func(oMedia); }
		};

		CDC.Admin.Media.getMedia(collectionId, function (oMedia) {
			if (oMedia.childRelationships !== null && oMedia.childRelationships instanceof Array) {

				var child = $.grep(oMedia.childRelationships, function (itm, idx) { return itm.relatedMediaId == mediaId; })[0];

				var index = oMedia.childRelationships.indexOf(child);
				oMedia.childRelationships.splice(index, 1);
				CDC.Admin.Media.saveMedia(oMedia, handleCallback);
			} else {
				handleCallback(oMedia);
			}

		});
	},

	saveRelationships: function (collectionId, aRelationships, callBack) {
		var handleCallback = function (oMedia) {
			_ctx.SelectedCollection.aValues.push(eval(mediaId));
			var func = callBack; if (typeof func === 'function') {
				func(oMedia);
			}
		};

		CDC.Admin.Media.getMedia(collectionId, function (oMedia) {
			if (oMedia.childRelationships !== null && oMedia.childRelationships instanceof Array) {
				oMedia.childRelationships = aRelationships;
				CDC.Admin.Media.saveMedia(oMedia, handleCallback);
			} else {
				handleCallback(oMedia);
			}
		});
	}

};

CDC.Admin.Media = CDC.Admin.Media || {};
CDC.Admin.Media = {
	getMedia: function (id, postProcess) {

		function handlePostProcess(response) { var func = postProcess; if (typeof func === 'function') { func(response); } }

		var url = APIRoot + "/adminapi/v1/resources/media/" + id;
		_getJsonP(url, {}, function (response) {
			var results = response.results;
			if (results.length !== 1) {
				alert("Expected single media item, received " + results.length);
				return;
			}
			handlePostProcess(response.results[0]);
		});
	},
	saveMedia: function (oMedia, callBack) {

		function handleCallback(oMedia) {
			var func = callBack;
			if (typeof func === 'function') { func(oMedia); }
		}

		// clearing attribution and tag name values in order to
		// hack around issue saving media object that migh potentially
		// have special (spanish) characters in these fields.
		// -- fails validation on api side.
		oMedia.attribution = "";
		oMedia.children = [];
		oMedia.title = replaceWordChars(oMedia.title);
		oMedia.description = replaceWordChars(oMedia.description);

		for (var prop in oMedia.tags) {
			if (oMedia.tags.hasOwnProperty(prop) && $.isArray(oMedia.tags[prop])) {
				$(oMedia.tags[prop]).each(function (i, o) {
					o.name = '';
				});
			}
		}

		var localUrl = urlRoot + "/Secure.aspx/" + (oMedia.id ? 'UpdateMedia' : 'SaveMedia');
		var apiURL = APIRoot + "/adminapi/v1/resources/media";
		if (oMedia.id) { apiURL = apiURL + "/" + oMedia.id; }

		var call = JSON.stringify({ "data": JSON.stringify(oMedia), "apiUrl": apiURL });
		//"{data: '" + JSON.stringify(oMedia) + "', apiUrl: '" + apiURL + "'}";

		$.ajax({
			type: "POST",
			url: localUrl,
			data: call,
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function (response) {
			handleCallback(JSON.parse(response.d).results[0]);
		}).fail(function (xhr, ajaxOptions, thrownError) {
			console.debug(xhr.status);
			console.debug(xhr.responseText);
			console.debug(thrownError);
		});

	}
};

CDC.Admin.User = CDC.Admin.User || {};
CDC.Admin.User = {
	getNetworkUser: function (callback) {

		function handleCallback(user) {var func = callback; if (typeof func === 'function') { func(user); }}

		if (!$.isEmptyObject(_ctx.UserInfo)) {
			handleCallback(_ctx.UserInfo); return;
		} else {
			$().showSpinner();
		}

		var data = "{'apiURL': '" + APIRoot + "/adminapi/v1/resources/adminusers/'}";
		var url = urlRoot + "/Secure.aspx/GetCurrentUserInfo";

		_getSecureJsonP(url, data,
			function (response) {
				var obj = $.parseJSON(response.d).results[0];
				_ctx.setUserInfo(obj);
				handleCallback(obj);
				$().hideSpinner();
			},
			function(){
				$().hideSpinner();
			}
		)
	}
};

CDC.Admin.Lookup = CDC.Admin.Lookup || {};
CDC.Admin.Lookup = {
	getValuesForValueSet: function (valueSetId, postProcess) {

		var url = APIRoot + '/adminapi/v1/resources/valuesets/' + valueSetId + '.json/?max=0&callback=?';
		_getJsonP(url, {}, postProcess);

	},
	getValueSets: function (postProcess) {

		var url = APIRoot + "/adminapi/v1/resources/valuesets.json?max=0&callback=?";
		_getJsonP(url, {}, postProcess);

	},
	getLanguages: function (postProcess) {
		if (!$.isEmptyObject(CDC.Admin.Global.cache.languages)) {
			postProcess(CDC.Admin.Global.cache.languages);
			return;
		}
		var url = APIRoot + "/adminapi/v1/resources/languages.json?callback=?";
		_getJsonP(url, {}, function (response) {
			CDC.Admin.Global.cache.setLanguages(response.results);
			postProcess(response.results);
		});
	},
	addValueRelationship: function (termId, oRel, onSuccess, onError) {
		function handleSuccess(termData) {
			var func = onSuccess;
			if (typeof func === 'function') { func(termData); }
		}

		function handleError(response) {
			var func = onError;
			if (typeof func === 'function') { func(response); }
		}

		var url = APIRoot + '/adminapi/v1/resources/values/';
		url += termId;
		url += '/addRelationships';

		var localUrl = urlRoot + "/Secure.aspx/UpdateTerm";
		var call = JSON.stringify({ "data": JSON.stringify(oRel), "apiUrl": url });

		$.ajax({
			type: "POST",
			url: localUrl,
			data: call,
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function (response) {
			handleSuccess(JSON.parse(response.d).results[0]);
		}).fail(function (xhr, ajaxOptions, thrownError) {
			console.debug(xhr.status);
			console.debug(xhr.responseText);
			console.debug(thrownError);
			handleError(response);
		});
	},
	deleteValueRelationship: function (termId, oRel, onSuccess, onError) {
		function handleSuccess(termData) {
			var func = onSuccess;
			if (typeof func === 'function') { func(termData); }
		}

		function handleError(response) {
			var func = onError;
			if (typeof func === 'function') { func(response); }
		}

		var url = APIRoot + '/adminapi/v1/resources/values/';
		url += termId;
		url += '/deleteRelationships';

		var localUrl = urlRoot + "/Secure.aspx/UpdateTerm";
		var call = JSON.stringify({ "data": JSON.stringify(oRel), "apiUrl": url });

		$.ajax({
			type: "POST",
			url: localUrl,
			data: call,
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function (response) {
			handleSuccess(JSON.parse(response.d).results[0]);
		}).fail(function (xhr, ajaxOptions, thrownError) {
			console.debug(xhr.status);
			console.debug(xhr.responseText);
			console.debug(thrownError);
			handleError(response);
		});
	}
};

CDC.Admin.Capture = CDC.Admin.Capture || {};
CDC.Admin.Capture = {

	saveMediaData: function (media, onSuccess, onError) {

		// lets clean up some stuff -
		media.title = replaceWordChars(media.title);
		media.description = replaceWordChars(media.description);

		function successHandler(oMedia, blnRunThumbnail) {
			var func = onSuccess;
			if (typeof func === 'function') {
				func(oMedia, blnRunThumbnail);
			}
		}

		function errorHandler(oMsg) {
			var func = onError;
			if (typeof func === 'function') {
				func(oMsg);
			}
		}

		var url = urlRoot + "/Secure.aspx/" + (media.id ? 'UpdateMedia' : 'SaveMedia');
		var apiURL = APIRoot + "/adminapi/v1/resources/media";
		if (media.id) { apiURL = apiURL + "/" + media.id; }

		var call = JSON.stringify({ "data": JSON.stringify(media), "apiUrl": apiURL });

		console.debug(call);

		$.ajax({
			type: "POST",
			url: url,
			data: call,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			xhrFields: {
				withCredentials: true
			},
			success: function (response) {
				var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
				if (obj.meta.status !== 200) {
					errorHandler(obj.meta.message);
				}
				else {
					var result = obj.results[0];
					successHandler(result, !media.id);
				}

			}
		}).fail(function (xhr, ajaxOptions, thrownError) {
			var response = $.parseJSON(xhr.responseText);
			var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
			errorHandler(obj.meta.message);
		});
	},
	saveAltImageFromUrl: function (imageUrl, mediaid, height, width, name, type, postProcess) {
		function handleCallback(response) { var func = postProcess; if (typeof func === 'function') { func(response); } }

		var url = urlRoot + '/Capture/Upload.ashx';
		var formData = new window.FormData();
		formData.append("mediaId", mediaid);
		formData.append("height", height);
		formData.append("width", width);
		formData.append("name", name);
		formData.append("type", type);
		formData.append("apiUrl", APIRoot + "/adminapi/v1/resources/links");
		formData.append("filePath", imageUrl);

		_postToWebMethod(url, formData,
			function (response) {
				if (response.d == "File size too large") { alert('File size cannot be greater than .5 MB : ' + filePath); }
				if (response.toLowerCase().indexOf('error:') > -1) { alert(response) }
				else { handleCallback(response); }
			}
		);
	},
	saveAltImage: function ($filePicker, filePath, mediaid, height, width, name, type, postProcess) {

		function handleCallback(response) { var func = postProcess; if (typeof func === 'function') { func(response); } }

		var url = urlRoot + '/Capture/Upload.ashx';
		var fileInput = $filePicker
		var fileData = fileInput.prop("files")[0];  // Getting the properties of file from file field
		var formData = new window.FormData();       // Creating object of FormData class
		formData.append("file", fileData);			// Appending parameter named file with properties of file_field to form_data
		formData.append("mediaId", mediaid);
		formData.append("height", height);
		formData.append("width", width);
		formData.append("name", name);
		formData.append("type", type);
		formData.append("apiUrl", APIRoot + "/adminapi/v1/resources/links");
		formData.append("filePath", filePath);

		_postToWebMethod(url, formData,
			function (response) {
				if (response.d == "File size too large") { alert('File size cannot be greater than .5 MB : ' + filePath); }
				if (response.toLowerCase().indexOf('error:') > -1) { alert(response) }
				else { handleCallback(response); }
			}
		);

	},
	testAltImage: function ($filePicker, filePath, postProcess) {

		function handleCallback(response) { var func = postProcess; if (typeof func === 'function') { func(response); } }

		var url = urlRoot + '/Feeds/FileTest.ashx';
		var fileInput = $filePicker;
		var fileData = fileInput.prop("files")[0];  // Getting the properties of file from file field
		var formData = new window.FormData();       // Creating object of FormData class
		formData.append("file", fileData);			// Appending parameter named file with properties of file_field to form_data

		_postToWebMethod(url, formData,
			function (response) {
				if (response.d == "File size too large") { alert('File size cannot be greater than .5 MB : ' + filePath); }
				if (response.toLowerCase().indexOf('error:') > -1) { alert(response) }
				else { handleCallback(response); }
			}
		);

	},
	loadAltImageData: function (id, postProcess) {
		var url = APIRoot + "/adminapi/v1/resources/media/" + id;
		_getJsonP(url, {}, function (response) {
			postProcess(response.results[0].alternateImages);
		});
	},
	getFileSize: function (url, postProcess) {

		var j = { "url": url };
		var data = JSON.stringify(j);

		$.ajax({
			type: "POST",
			url: urlRoot + "/Secure.aspx/GetFileSize",
			data: call,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function (response) {
				var length = eval(response.d);
				if (typeof postProcess === 'function') { postProcess(length); }
			},
			error: function (xhr, ajaxOptions, thrownError) {
				console.debug(xhr.status);
				console.debug(thrownError);
				console.debug(xhr.responseText);
			}
		});
	},
	getPageCount: function (url, postProcess) {

		var j = { "url": url };
		var call = JSON.stringify(j);

		$.ajax({
			type: "POST",
			url: urlRoot + "/Secure.aspx/GetPDFPageCount",
			data: call,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function (response) {
				var length = eval(response.d);
				if (typeof postProcess === 'function') { postProcess(length); }
			},
			error: function (xhr, ajaxOptions, thrownError) {
				console.debug(xhr.status);
				console.debug(thrownError);
				console.debug(xhr.responseText);
			}
		});
	},
	loadChildItems: function (url, postProcess) { //temp

		function handlePostProcess(results) {
			var func = postProcess;
			if (typeof func === 'function') {
				func(results);
			}
		}

		$.ajax({
			url: url,
			dataType: 'jsonp'
		}).done(function (response) {
			handlePostProcess(response);
		})
        .fail(function (xhr, ajaxOptions, thrownError) {
        	console.debug(xhr.status);
        	console.debug(thrownError);
        	console.debug(xhr.responseText);
        });

	},
	updateImportFeed: function (url, mediaId, postProcess, interimProcess) { //temp

		function handlePostProcess(count) {
			var func = postProcess;
			if (typeof func === 'function') {
				func(count);
			}
		}

		function handleInterim(current, total) {
			var func = interimProcess;
			if (typeof func === 'function') {
				func(current, total);
			}
		}

		var timestamp = new Date().getTime();
		url += url.indexOf("?") == -1 ? "?timestamp=" + timestamp : "&timestamp=" + timestamp;

		var j = { "apiUrl": url };
		var call = JSON.stringify(j);
		var feedItemUrl = APIRoot + "/adminapi/v1/resources/media?parentid=" + mediaId + "&max=0&callback=?";

		$.ajax({
			type: "POST",
			url: urlRoot + "/Secure.aspx/UpdateImportFeed",
			data: call,
			contentType: "application/json; charset=utf-8",
			dataType: "json"
		}).done(function (response) {
			if ($.parseJSON(response.d).meta.status == 408) {
				interim();
			} else {
				// get currently processed count
				var out = $.grep(response.results, function (itm) { return itm.extendedAttributes.LastImport == timestamp });
				if (out && out.length > 0) {
					if (out[0].extendedAttributes && out[0].extendedAttributes.ImportCount) {
						var countString = out[0].extendedAttributes.ImportCount;
						var countArr = countString.split(" of ");
						if (countArr.length > 0) {
							var current = countArr[0];
							var count = countArr[1];
							handlePostProcess(count + " items processed.");
						}
					}					
				}
			}
		})
        .fail(function (xhr, ajaxOptions, thrownError) {
        	console.debug(xhr.status);
        	console.debug(thrownError);
        	console.debug(xhr.responseText);
        	handlePostProcess(0);
        });

		function interim() {
			CDC.Admin.Capture.loadChildItems(feedItemUrl, function (response) {				

				var out = $.grep(response.results, function (itm) { return itm.extendedAttributes.LastImport == timestamp });
				if (out && out.length > 0) {
					if (out[0].extendedAttributes && out[0].extendedAttributes.ImportCount) {
						var countString = out[0].extendedAttributes.ImportCount;
						var countArr = countString.split(" of ");
						if (countArr.length > 0) {
							var current = parseInt(countArr[0]);
							var count = parseInt(countArr[1]);
							if (current >= count) {
								console.log('current:' + current + " total:" + count);
								handlePostProcess(count + " items processed.");
							} else {
								console.log('current:' + current + " total:" + count);
								handleInterim(current + " of " + count + " items processed.");
								setTimeout(interim, 3000);
							}
						} else {
							handlePostProcess("No new items found");
						}
					} else {
						handlePostProcess("No new items found");
					}
				} else {
					handlePostProcess("No new items found");
				}
			});
		}

	},
	exportFeed: function (url, postProcess) { //temp

		function handlePostProcess() {
			var func = postProcess;
			if (typeof func === 'function') {
				func();
			}
		}

		$.ajax({
			url: url,
			dataType: 'jsonp'
		}).done(function (response) {
			handlePostProcess();
		})
		.fail(function (xhr, ajaxOptions, thrownError) {
			console.debug(xhr.status);
			console.debug(thrownError);
			console.debug(xhr.responseText);
			handlePostProcess();
		});

	}
}



// function to process API and webmethod calls
function _getJsonP(url, params, callback) {
	function handleCallback(response) { var func = callback; if (typeof func === 'function') { func(response); } }
	$.ajax({
		url: url,
		dataType: 'jsonp'
	}).done(function (response) {
		handleCallback(response);
	}).fail(function (xhr, ajaxOptions, thrownError) {
		console.debug(xhr.status);
		console.debug(xhr.responseText);
		console.debug(thrownError);
	});
}

// function to process API and webmethod calls
function _getSecureJsonP(url, data, onSuccess, onError) {

	function handleSuccess(response) { var func = onSuccess; if (typeof func === 'function') { func(response); } }
	function handleError() { var func = onError; if (typeof func === 'function') { func(); } }

	$.ajax({
		type: "POST",
		url: url,		
		data: data,
		contentType: "application/json; charset=utf-8",
		dataType: "json"
	}).done(function (response) {
		handleSuccess(response);
	}).fail(function (xhr, ajaxOptions, thrownError) {
		console.debug(xhr.status);
		console.debug(xhr.responseText);
		console.debug(thrownError);
		handleError();
	});
}

function _postToWebMethod(url, data, onSuccess) {
	function handleSuccess(response) { var func = onSuccess; if (typeof func === 'function') { func(response); } }
	$.ajax({
		url: url,
		data: data,
		processData: false,
		contentType: false,
		type: 'POST',
		success: function (response) {
			handleSuccess(response);
		},
		error: function (xhr, ajaxOptions, thrownError) {
			console.debug(xhr.status);
			console.debug(thrownError);
			console.debug(xhr.responseText);
		}
	});
}



CDC.Admin.scrolltoFirstError = function () {
	$('html, body').animate({
		scrollTop: $('.alert-danger:visible').first().offset().top - 200
	}, 50);
}

if (!window.console) console = {};
console.log = console.log || function () { };
console.warn = console.warn || function () { };
console.error = console.error || function () { };
console.info = console.info || function () { };
console.debug = console.debug || console.log;

(function ($) {
	var PLUGIN_NAME = 'showSpinner';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults: {
    		location: 'append'
    	}
    };

	// main funtion //////////////////////////
	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		main();

		function main() {
			if (options.target.length === 0) {
				var $spinMask = $('.modal-backdrop');
				// remove
				if ($spinMask.length > 0) { $spinMask.remove(); }

				// add new back
				$('body').append('<div class="modal-backdrop"></div>');
				$('body').append('<div class="globalSpin_progressIndicator"></div>');
				$('.globalSpin_mask').show();
			}
			else {
				if (options.location === 'prepend') {
					options.target.prepend('<div class="progressIndicator"></div>');
				} else {
					options.target.append('<div class="progressIndicator"></div>');
				}
			}

		}
	};

})(jQuery);

(function ($) {
	var PLUGIN_NAME = 'hideSpinner';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults: {}
    };

	// main funtion //////////////////////////
	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		main();

		function main() {
			if (options.target.length === 0)
			{ $('.modal-backdrop, .globalSpin_progressIndicator').remove(); }
			else {
				options.target.find(".progressIndicator").remove();
			}
		}
	};

})(jQuery);

(function ($) {
	var PLUGIN_NAME = 'BSPopoverExtender';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults:
        {
        	$contentSource: '',
        	cssClass: ''
        }
    };

	// main funtion //////////////////////////
	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		// Used in embed code form to wire up help content that's stored in HtmlEmbedForm.htm
		//
		// ... in the following sample, displayOptionHelpContent is used as the selector for the content of the BootStrap popover.
		//
		//  <div style='display: none;'>
		//      <div class='displayOptionHelpContent' title='Display Options'>
		//          <small>
		//              <table class='table'>[help content]
		//
		//  cssClass provides a means to add/override the default bootstrap popover styles.
		//
		//  There are some additional bits that shut down any other popover windows and handle event bubbling so tha the page location
		//  will not shift when the target is clicked.

		main();

		function main() {

			$(options.target).bind('click', function (e) {
				$('[data-original-title]').popover('hide');
				e.stopPropagation();
				return false;
			});

			$(options.target).popover({
				html: true,
				content: options.$contentSource.html(),
				template: '<div class="popover ' + options.cssClass + '"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>',
				title: '<span class="text-info"><strong>' + options.$contentSource.attr('title') + '</strong></span>' + '<button type="button" id="close" class="close" onclick="$(&quot;' + $(options.target).selector + '&quot;).popover(&quot;hide&quot;);">&times;</button>',
				placement: 'top'
			});

			$(document).bind('click', function (e) {
				$(options.target).popover('hide');
			});

			$('#timepicker1').keypress(function (event) {
				if (event.keyCode == 13) {
					event.preventDefault();
					// alert('hi');
				}
			});

		}
	};

})(jQuery);

//TODO:  Convert to plugin syntax
function applyWatermark() {
	$("[placeholder]").each(function () {
		//$(this).watermark($(this).attr("placeholder"));
	});
}

function editMedia(id, mediaType, altLocation) {
	_ctx.setSelectedMediaId(id);
	_ctx.setMediaType(mediaType);

	if ($.type(altLocation) === "undefined") {

		switch (mediaType) {
			case 'feed':
			case 'feed - proxy':
			case 'feed - import':
				document.location = urlRoot + "/Feeds/Feeds.htm?view=detail&id=" + id;
				break;
			default:
				document.location = urlRoot + "/Capture/Capture.htm";
		}
	}
	else {
		document.location = altLocation;
	}
}

function htmlDecode(value) {
	return $('<div/>').html(value).text();
}

function getURLParameter(name) {
	return decodeURI((RegExp(name + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1]);
}

function getParensText(text) {
	var start = text.indexOf('(');
	var end = text.indexOf(')');
	return text.substr(start + 1, end - start - 1);
}

function showPopUp(url, width, height) {
	var w, h;
	w = width !== undefined ? width : 800;
	h = height !== undefined ? height : 600;

	var newwindow = window.open(url, 'popup', 'height=' + h + ',width=' + w + ',scrollbars=yes,resizable=yes,menubar=yes');
	if (newwindow && window.focus) { newwindow.focus(); }
	return false;
}

function showPreview(mediaId, width, height) {

	var w, h;
	w = width !== undefined ? width : 800;
	h = height !== undefined ? height : 600;

	var url = urlRoot + "/Preview.htm?mediaId=" + mediaId;

	var newwindow = window.open(url, 'preview', 'height=' + h + ',width=' + w + ',scrollbars=yes,resizable=yes');
	if (newwindow && window.focus) { newwindow.focus(); }
	return false;
}

if (!String.format) {
	String.format = function (format) {
		var args = Array.prototype.slice.call(arguments, 1);
		return format.replace(/{(\d+)}/g, function (match, number) {
			return typeof args[number] !== 'undefined' ? args[number] : match;
		});
	};
}

function showMessage(type, userMessage) {
	var $container = $('.showMessage');
	var messageBlock;
	switch (type) {
		case 'success':
			messageBlock = '<div class="alert alert-success" style="display:none;" role="alert"><span class="glyphicon glyphicon-ok"></span> ' + userMessage + '</div>';
			break;
		case 'fail':
			messageBlock = '<div class="alert alert-danger" style="display:none;" role="alert"><span class="glyphicon glyphicon-ok"></span> ' + userMessage + '</div>';
			break;
	}

	$container.html(messageBlock);
	$container.find('.alert').show().delay(5000).slideUp(function () {
		$container.empty();
	});
}

function formatFileSize(fileSizeInBytes) {
	var i = -1;
	var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
	do {
		fileSizeInBytes = fileSizeInBytes / 1024;
		i++;
	} while (fileSizeInBytes > 1024);

	return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
}

function combineDateTime(datePart, timePart) {
	var dUtc = "";
	if (datePart !== "" && timePart !== "") {
		var time = timePart.split(" ")[0];
		var hours = time.split(":")[0];
		var minutes = time.split(":")[1];

		if (timePart.split(" ")[1] === 'PM')
		{ hours = eval(hours) + 12; }

		if (datePart !== "") {
			try {
				var d = new Date(datePart);
				d.setHours(hours);
				d.setMinutes(minutes);
				dUtc = d.toISOString();
				return dUtc;
			}
			catch (error) {
				return dUtc;
			}
		}
	}
	return dUtc;
}

function formatAMPM(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0' + minutes : minutes;
	var strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
}

function convertToZDate(publishDate, publishTime) {
	var dUtc = "";
	if (publishDate !== "" && publishTime !== "") {
		var time = publishTime.split(" ")[0];
		var hours = time.split(":")[0];
		var minutes = time.split(":")[1];

		if (publishTime.split(" ")[1] === 'PM')
		{ hours = eval(hours) + 12; }

		if (publishDate !== "") {
			try {
				var d = new Date(publishDate);
				d.setHours(hours);
				d.setMinutes(minutes);
				dUtc = d.toISOString();
				return dUtc;
			}
			catch (error) {
				//
			}
		}
	}
}

function isValidUrlFormat(testString) {
	if (/^(ht|f)tps?:(\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?((\[(|(v[\da-f]{1,}\.(([a-z]|\d|-|\.|_|~)|[!\$&'\(\)\*\+,;=]|:)+))\])|((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=])*)(:\d*)?)(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*|(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)|((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)){0})(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(testString)) {
		return true;
	} else {
		return false;
	}
}

function isValidEmailFormat(email) {
	var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
	return re.test(email);
}


function isDate(e, t, r, n, a) { try { var i = void 0 !== r ? r : 1, l = void 0 !== n ? n : 0, g = void 0 !== a ? a : 2; e = e.replace(/-/g, "/").replace(/\./g, "/"); var v = e.split(t || "/"), h = !0; if (1 !== v[i].length && 2 !== v[i].length && (h = !1), h && 1 !== v[l].length && 2 !== v[l].length && (h = !1), h && 4 !== v[g].length && (h = !1), h) { var p = parseInt(v[i], 10), c = parseInt(v[l], 10), s = parseInt(v[g], 10); if ((h = s > 1900) && (h = 12 >= c && c > 0)) { var o = s % 4 == 0 && s % 100 !== 0 || s % 400 == 0; (h = p > 0) && (h = 2 == c ? o ? 29 >= p : 28 >= p : 4 == c || 6 == c || 9 == c || 11 == c ? 30 >= p : 31 >= p) } } return h } catch (d) { return !1 } }


function urlExists(data, existsCallback, msg) {

	var apiURL = APIRoot + "/adminapi/v1/resources/validations";
	var call = JSON.stringify({ "data": JSON.stringify(data), "apiURL": apiURL });
	//"{data: '" + JSON.stringify(data) + "', apiURL: '" + apiURL + "'}";

	$.ajax({
		type: "POST",
		url: urlRoot + "/Secure.aspx/validateUrlForType",
		data: call,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (response) {
			var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;

			if (obj.meta.message.length === 0) {
				existsCallback(true, obj.meta.message);
			}
			else {
				existsCallback(false, obj.meta.message);
			}
		}
	}).fail(function (xhr, ajaxOptions, thrownError) {
		console.debug(xhr.status);
		console.debug(xhr.responseText);
		console.debug(thrownError);
	});
}


function htmlUrlExists(htmlURL, postProcess) {
	//url=http://www......[domain]...../flu/invalidUrl&resourceType=WebPage

	function handlePostProcess(isValid, msg) {
		var func = postProcess;
		if (typeof func === 'function') {
			func(isValid, msg);
		}
	}

	var url = APIRoot + "/adminapi/v1/resources/validations?url=" + htmlURL + "&resourceType=WebPage";

	$.ajax({
		url: url,
		dataType: 'jsonp'
	}).done(function (response) {
		var results = response.results;
		if (response.meta.message.length > 0) {
			handlePostProcess(false, response.meta.message[0].userMessage);
		}
		else {
			handlePostProcess(true);
		}
	})
	.fail(function (xhr, ajaxOptions, thrownError) {
		console.debug(xhr.status);
		console.debug(thrownError);
		console.debug(xhr.responseText);
		$("#apiError").show();
	});

}

function replaceWordChars(text) {

	var s = text;

	//C&#243;mo reducir el sodio en la alimentaci&#243;n de los ni&#241;os

	s = s.replace(/&#8217;/g, "'")
	s = s.replace(/&#8220;|&#8221;/g, "\"")
	s = s.replace(/&#8212;|&#8211;|—/g, "-")

	s = s.replace(/&#160;/g, "&nbsp;");//
	s = s.replace(/&#161;/g, "&iexcl;");//¡
	s = s.replace(/&#162;/g, "&cent;");//¢
	s = s.replace(/&#163;/g, "&pound;");//£
	s = s.replace(/&#164;/g, "&curren;");//¤
	s = s.replace(/&#165;/g, "&yen;");//¥
	s = s.replace(/&#166;/g, "&brvbar;");//¦
	s = s.replace(/&#167;/g, "&sect;");//§
	s = s.replace(/&#168;/g, "&uml;");//¨
	s = s.replace(/&#169;/g, "&copy;");//©
	s = s.replace(/&#170;/g, "&ordf;");//ª
	s = s.replace(/&#171;/g, "&laquo;");//«
	s = s.replace(/&#172;/g, "&not;");//¬
	s = s.replace(/&#173;/g, "&shy;");//­
	s = s.replace(/&#174;/g, "&reg;");//®
	s = s.replace(/&#175;/g, "&macr;");//¯
	s = s.replace(/&#176;/g, "&deg;");//°
	s = s.replace(/&#177;/g, "&plusmn;");//±
	s = s.replace(/&#178;/g, "&sup2;");//²
	s = s.replace(/&#179;/g, "&sup3;");//³
	s = s.replace(/&#180;/g, "&acute;");//´
	s = s.replace(/&#181;/g, "&micro;");//µ
	s = s.replace(/&#182;/g, "&para;");//¶
	s = s.replace(/&#183;/g, "&middot;");//·
	s = s.replace(/&#184;/g, "&cedil;");//¸
	s = s.replace(/&#185;/g, "&sup1;");//¹
	s = s.replace(/&#186;/g, "&ordm;");//º
	s = s.replace(/&#187;/g, "&raquo;");//»
	s = s.replace(/&#188;/g, "&frac14;");//¼
	s = s.replace(/&#189;/g, "&frac12;");//½
	s = s.replace(/&#190;/g, "&frac34;");//¾
	s = s.replace(/&#191;/g, "&iquest;");//¿
	s = s.replace(/&#192;/g, "&Agrave;");//À
	s = s.replace(/&#193;/g, "&Aacute;");//Á
	s = s.replace(/&#194;/g, "&Acirc;");//Â
	s = s.replace(/&#195;/g, "&Atilde;");//Ã
	s = s.replace(/&#196;/g, "&Auml;");//Ä
	s = s.replace(/&#197;/g, "&Aring;");//Å
	s = s.replace(/&#198;/g, "&AElig;");//Æ
	s = s.replace(/&#199;/g, "&Ccedil;");//Ç
	s = s.replace(/&#200;/g, "&Egrave;");//È
	s = s.replace(/&#201;/g, "&Eacute;");//É
	s = s.replace(/&#202;/g, "&Ecirc;");//Ê
	s = s.replace(/&#203;/g, "&Euml;");//Ë
	s = s.replace(/&#204;/g, "&Igrave;");//Ì
	s = s.replace(/&#205;/g, "&Iacute;");//Í
	s = s.replace(/&#206;/g, "&Icirc;");//Î
	s = s.replace(/&#207;/g, "&Iuml;");//Ï
	s = s.replace(/&#208;/g, "&ETH;");//Ð
	s = s.replace(/&#209;/g, "&Ntilde;");//Ñ
	s = s.replace(/&#210;/g, "&Ograve;");//Ò
	s = s.replace(/&#211;/g, "&Oacute;");//Ó
	s = s.replace(/&#212;/g, "&Ocirc;");//Ô
	s = s.replace(/&#213;/g, "&Otilde;");//Õ
	s = s.replace(/&#214;/g, "&Ouml;");//Ö
	s = s.replace(/&#215;/g, "&times;");//×
	s = s.replace(/&#216;/g, "&Oslash;");//Ø
	s = s.replace(/&#217;/g, "&Ugrave;");//Ù
	s = s.replace(/&#218;/g, "&Uacute;");//Ú
	s = s.replace(/&#219;/g, "&Ucirc;");//Û
	s = s.replace(/&#220;/g, "&Uuml;");//Ü
	s = s.replace(/&#221;/g, "&Yacute;");//Ý
	s = s.replace(/&#222;/g, "&THORN;");//Þ
	s = s.replace(/&#223;/g, "&szlig;");//ß
	s = s.replace(/&#224;/g, "&agrave;");//à
	s = s.replace(/&#225;/g, "&aacute;");//á
	s = s.replace(/&#226;/g, "&acirc;");//â
	s = s.replace(/&#227;/g, "&atilde;");//ã
	s = s.replace(/&#228;/g, "&auml;");//ä
	s = s.replace(/&#229;/g, "&aring;");//å
	s = s.replace(/&#230;/g, "&aelig;");//æ
	s = s.replace(/&#231;/g, "&ccedil;");//ç
	s = s.replace(/&#232;/g, "&egrave;");//è
	s = s.replace(/&#233;/g, "&eacute;");//é
	s = s.replace(/&#234;/g, "&ecirc;");//ê
	s = s.replace(/&#235;/g, "&euml;");//ë
	s = s.replace(/&#236;/g, "&igrave;");//ì
	s = s.replace(/&#237;/g, "&iacute;");//í
	s = s.replace(/&#238;/g, "&icirc;");//î
	s = s.replace(/&#239;/g, "&iuml;");//ï
	s = s.replace(/&#240;/g, "&eth;");//ð
	s = s.replace(/&#241;/g, "&ntilde;");//ñ
	s = s.replace(/&#242;/g, "&ograve;");//ò
	s = s.replace(/&#243;/g, "&oacute;");//ó
	s = s.replace(/&#244;/g, "&ocirc;");//ô
	s = s.replace(/&#245;/g, "&otilde;");//õ
	s = s.replace(/&#246;/g, "&ouml;");//ö
	s = s.replace(/&#247;/g, "&divide;");//÷
	s = s.replace(/&#248;/g, "&oslash;");//ø
	s = s.replace(/&#249;/g, "&ugrave;");//ù
	s = s.replace(/&#250;/g, "&uacute;");//ú
	s = s.replace(/&#251;/g, "&ucirc;");//û
	s = s.replace(/&#252;/g, "&uuml;");//ü
	s = s.replace(/&#253;/g, "&yacute;");//ý
	s = s.replace(/&#254;/g, "&thorn;");//þ
	s = s.replace(/&#255;/g, "&yuml;");//ÿ

	s = htmlEncode(s);

	return s;

}

function isIE() {

	var ua = window.navigator.userAgent;
	var msie = ua.indexOf("MSIE ");

	if (msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./))      // If Internet Explorer, return version number
		return true;
	else                 // If another browser, return 0
		return false;

	return false;
}

function getFeedTypePill(type, source) {
	if (type === "Feed - Proxy") {
		return "<span class='label label-warning' style='display:inline-block; width:80px; margin-right:10px;'>Proxy</span>"
	}
	else if (type === "Feed - Import") {
		return "<span class='label label-info' style='display:inline-block; width:80px; margin-right:10px;' " + (source ? "title='" + source + "'" : '') + "'>Import</span>"
	}
	else if (type === "Feed - Aggregate") {
		return "<span class='label label-important' style='display:inline-block; width:80px; margin-right:10px;' " + (source ? "title='" + source + "'" : '') + "'>Aggregate</span>"
	}
	else {
		return "<span class='label label-success' style='display:inline-block; width:80px; margin-right:10px;'>Managed</span>"
	}
}


// common code to handle setup of treeview interface - treeview is shared by vocab, capture and feed/podcast setup.
// THIS code is used by the topic assignment functionality.
var setupTreeviewEvents = function (_m, $t, treeData, selectedValueData) {
	var $tree = $t.find('.treeViewContainer');
	var topicCount = _m.tags && _m.tags.topic ? _m.tags.topic.length : 0;

	// clear existing bindings
	$tree.find("li > a.btn").unbind("click");

	// flag selected and deal with pills.
	if (_m.tags) {
		$(_m.tags.topic).each(function () {
			selectedValueData.push({
				id: this.id,
				name: this.name
			});
			// select in tree
			var termId = this.id;
			var $aTerm = $tree.find("[termId = '" + termId + "' ]");
			$aTerm.addClass('btn-info').removeClass('btn-default');
			// create pill
			var termData = $.grep(treeData, function (e, i) {
				return e.valueId === termId;
			})[0];
			if (termData !== undefined) {
				var $pillLi = $("<li class='btn btn-gray btn-sm' termId='" + termData.valueId + "'>" + termData.valueName + " <i class='glyphicon glyphicon-remove icon-white'></i></li>");
				$t.find(".modalSelectedValues").find("ul").append($pillLi);
				$pillLi.click(function () {
					$tree.find("[termId = '" + termId + "' ]").removeClass('btn-info').addClass('btn-default');
					deselectMe(termData);
				});
			}
		});
		if ($t.find(".modalSelectedValues").find("ul li").length === 0) {
			$t.find(".modalSelectedValues").find("span").show();
		}

	}
	else {
		$t.find(".modalSelectedValues").find("span").show();
	}

	// add add/remove handlers to tree items
	$tree.find(".treeRootNode>.btn").addClass("inactive").click(function () { alert('Topics cannot be assigned at the root level. Please narrow your selection to a child item.'); });

	$tree.find(".topicListContainer .btn").not(".treeRootNode>.btn").click(function () {
		if ($(this).parents().hasClass('inactive')) {
			alert('This topic is inactive and cannot be assigned.');
			return false;
		}
		// add back in these tree handlers for any button click event:
		$tree.find('.topicListContainer').unhighlight();
		$t.find('.btnSearch').show();
		$t.find('.btnRemove').hide();
		var termId = $(this).attr("termId");
		var termData = $.grep(treeData, function (e, i) {
			return e.valueId === eval(termId);
		})[0];
		if ($(this).hasClass('btn-info')) {
			deselectMe(termData);
		} else {
			selectMe(termData);
		}
		if (topicCount > 15) {
			$('#tooManyTopics').show();
			return;
		}
		if (topicCount <= 15) {
			$('#tooManyTopics').hide();
		}
	});
	// hide spinner
	$('.topicListContainer').hideSpinner();


	var selectMe = function (termData) {
		if (topicCount >= 15) {
			alert('You cannot assign more than 15 topics to a media.');
			return;
		}
		if (termData === undefined) {
			return;
		}
		var termName = $('<div/>').html(termData.valueName).text();
		var $pillLi = $("<li class='btn btn-gray btn-sm' termId='" + termData.valueId + "'>" + termName + " <i class='glyphicon glyphicon-remove icon-white'></i></li>");
		$pillLi.click(function () {
			deselectMe(termData);
		});
		$t.find("[termId = '" + termData.valueId + "' ]").not(".inactive").addClass('btn-info').removeClass('btn-default');
		$t.find(".selectedValues, .modalSelectedValues").find("ul").append($pillLi);
		var o = {
			id: termData.valueId,
			name: termData.valueName
		};
		selectedValueData.push(o);
		var values = [];
		values = $.map(selectedValueData, function (value) {
			return value.id;
		});
		$t.find(".modalSelectedValues").find("ul").show();
		$t.find(".modalSelectedValues").find("span").hide();
		topicCount++;
		$t.data("values", jQuery.unique(values));
	};
	var deselectMe = function (termData) {
		$t.find(".selectedValues, .modalSelectedValues").find('[termId="' + htmlDecode(termData.valueId) + '"]').remove();
		$t.find("[termId = '" + termData.valueId + "' ]").removeClass('btn-info').addClass('btn-default');
		var values = [];
		selectedValueData = $.grep(selectedValueData, function (value) {
			return value.id !== termData.valueId;
		});
		values = $.map(selectedValueData, function (value) {
			return value.id;
		});
		if (values.length === 0) {
			$t.find(".modalSelectedValues").find("ul").hide();
			$t.find(".modalSelectedValues").find("span").show();
		}
		topicCount--;
		$t.data("values", jQuery.unique(values));
	};

}

CDC.Admin.Auth = CDC.Admin.Auth || {};
CDC.Admin.Auth = {
	hasRole: function (roleName) { return $.inArray(roleName, _ctx.UserInfo.roles) > -1; },
	canSearch: function () { return (this.hasRole("System Admin") || this.hasRole("Storefront Manager") || this.hasRole("Media Admin")); },
	canAddContent: function () { return (this.hasRole("System Admin") || this.hasRole("Media Admin")); },
	canAdministerVocab: function () { return (this.hasRole("System Admin") || this.hasRole("Vocabulary Admin")); },
	canManageCollections: function () { return (this.hasRole("System Admin") || this.hasRole("Storefront Manager")); },
	canManageFeeds: function () { return (this.hasRole("System Admin") || this.hasRole("Feeds Admin")); },
	canManagePodcasts: function () { return (this.hasRole("System Admin") || this.hasRole("Media Admin")); },
	canManageAuthorization: function () { return (this.hasRole("System Admin")); },
	canUseUtilities: function () { return (this.hasRole("System Admin")); },
	canUseData: function () { return (this.hasRole("System Admin")); }
}

function trimPrefix(string, prefix) {
	if (string === undefined) {
		return "";
	}
	if (string.slice(0, prefix.length) == prefix) {
		return string.substring(prefix.length);
	}
	return string;
}

/* originally based on https://gist.github.com/3782074 */
jQuery.fn.toCSV = function (eventSource) {
	var data = $(this).first(); //Only one table
	var csvData = [];
	var tmpArr = [];
	var tmpStr = '';
	var headersFound = false;

	data.find("tr").each(function () {
		if ($(this).find("th").length && !headersFound) {
			$(this).find("th").each(function () {
				tmpStr = $(this).text().replace(/"/g, '""');
				tmpArr.push('"' + tmpStr + '"');
			});
			headersFound = true;
			csvData.push(tmpArr);
		} else {
			tmpArr = [];
			$(this).find("td").each(function () {
				if ($(this).text().match(/^-{0,1}\d*\.{0,1}\d+$/)) {
					tmpArr.push(parseFloat($(this).text()));
				} else {
					tmpStr = $(this).text().replace(/"/g, '""').trim();
					tmpArr.push('"' + tmpStr + '"');
				}
			});
			csvData.push(tmpArr.join(','));
		}
	});
	var output = csvData.join('\n');
	var uri = 'data:application/csv;charset=UTF-8,' + encodeURIComponent(output);
	$(eventSource).after(' : <a id="table2csvlink" href="' + uri + '" download="' + document.title + '.csv">download .csv</a>');
	$(eventSource).off();
	/*window.open(uri);*/
}
/* example */
//$('.confluenceTable').toCSV();
