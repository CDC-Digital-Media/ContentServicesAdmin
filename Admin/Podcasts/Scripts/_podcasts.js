_ctx.setNavTarget('Podcasts');
var feedCategories = null;
var feedCatHTML = null;
$(document).ready(function () {
	loadConfigValues(function () {
		
			initalize();
			var header = $(".head").header({
				selectedValue: _ctx.NavTarget,
				navigationHandler: '',
				webFolder: getWebFolder(),
				callback: function () {
					if ($.isEmptyObject(_ctx.UserInfo)) {
						document.location = "../Index.htm";
					} else {
						header.setUser(_ctx.UserInfo);
					}
				}
			});
	
	});
});

function loadFeedCategories(postProcess) {
	var apiURL = APIRoot + '/adminapi/v1/resources/valuesets.json/?id=' + FeedCategoryValueSetId;
	var call = JSON.stringify({
		"apiURL": apiURL
	});
	$.ajax({
		type: "POST",
		url: urlRoot + "/Secure.aspx/GetFeedCategories",
		data: call,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (response) {
			var obj = JSON.parse(response.d);
			feedCategories = obj.results;
			feedCatHTML = obj.html;
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
}

function initalize() {
	_ctx.setMediaType("podcast series");
	$("#newSeries").click(function () {
		document.location = urlRoot + "/Podcasts/Podcasts.htm?view=detail";
	});

	var view = getURLParameter('view');
	var id = getURLParameter('id');
	switch (view) {
		case "detail":
			//load podcast detail page
			$('.util-buttons, h3').hide();
			$('#seriesDetail').seriesDetail({
				mediaId: eval(id) !== null ? id : ''
			});
			break;
		default:
			// load default grid
			$('#filterPanel, .filterBlock, #content').show();
			$('#seriesModal, .trail').hide();
			var filter = $("#filterPanel").mediaFilter({
				searchHandler: search,
				mediaType: "Podcast Series"
			});
			break;
	}
}

function search(url) {
	$("#seriesList").seriesGrid({
		url: url
	});
}

function loadGeneralInfo(_m, $t) {
	if (_m.id) {
		$t.find("#title").val(htmlDecode(_m.title));
		$t.find("#description").val(htmlDecode(_m.description));
		$t.find("#sourceUrl").val(_m.sourceUrl);
		$t.find("#targetUrl").val(_m.targetUrl);
		$t.find("#language").languagePicker({
			selectedValue: _m.language
		});
		if (_m.status === "Published") {
			$t.find("input[value=Published]").attr("checked", true);
			$t.find("#publishDateTime").show();
			if (!$.isEmptyObject(_m.datePublished)) {
				var d = new Date(_m.datePublished);
				$t.find("#publishDate").datepicker("setValue", d);
				$t.find(".icon-calendar").parent().css("cursor", "pointer").click(function () {
					$("#publishDate").focus();
				});
				$t.find('#timepicker1').timepicker({
					defaultTime: formatAMPM(d)
				});
			} else {
				$t.find("#publishDate").datepicker("setValue", new Date());
				$t.find('#timepicker1').timepicker({
					defaultTime: formatAMPM(new Date())
				});
			}
		} else {
			$t.find("#publishDate").datepicker("setValue", new Date());
			$t.find('#timepicker1').timepicker({
				defaultTime: formatAMPM(new Date())
			});
		}
		if (_m.status === "Hidden") {
			$t.find("input[value=Hidden]").attr("checked", true);
		}
		if (_m.status === "Archived") {
			$t.find("input[value=Archived]").attr("checked", true);
		}
		if (_m.status === "Staged") {
			$t.find("input[value=Staged]").attr("checked", true);
		}
	} else {
		$t.find("#publishDate").datepicker("setValue", new Date());
		$t.find('#timepicker1').timepicker({
			defaultTime: formatAMPM(new Date())
		});
		$t.find("#language").languagePicker();
	}
}

function loadRelatedImageInfo(_m, $t) {

	function loadData() {
		if (_m.feed) {
			$t.find("#imgTitle").val(htmlDecode(_m.feed.imageTitle));
			$t.find("#imgDescription").val(htmlDecode(_m.feed.imageDescription));
			$t.find("#imgSrc").val(_m.feed.imageSource);
			$t.find("#width").val(_m.feed.imageWidth);
			$t.find("#height").val(_m.feed.imageHeight);
			$t.find("#imgLink").val(_m.feed.imageLink);
		}
	}

	$t.find("#cbxCopyThumb").off().on("click", function () {
		if ($t.find("#cbxCopyThumb").is(':checked')) {
			$t.find("input:visible, textarea:visible").val('');
			$t.find(".feedImageForm").find(".form-control").attr("readonly", "");
		} else {
			$t.find(".feedImageForm").find(".form-control").not("#width, #height").removeAttr("readonly");
			loadData();
		}
	});
	
	if (_m.feed && _m.feed.imageTitle !== "") {
		loadData();
		$t.find("#cbxCopyThumb").removeAttr("checked");
		$t.find(".feedImageForm").find(".form-control").not("#width, #height").removeAttr("readonly");
	}
	else {
		$t.find(".feedImageForm").find(".form-control").attr("readonly", "");
	}
	


}

function loadAltImageInfo(_m, $t) {
	$t.find("#feedItmThumbImg").hide();
	// add fileselect event handler:
	$(document).on('change', '.btn-file :file', function () {
		var input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            path = input.val().replace(/\\/g, '/');
		input.trigger('fileselect', [numFiles, path]);
	});
	$t.find('.imgRow .btn-file :file').on('fileselect', function (event, numFiles, path) {
		// validate file extension
		var extension = path.split('.').pop().toUpperCase();
		if (extension !== "PNG" && extension !== "JPG" && extension !== "GIF" && extension !== "JPEG") {
			alert('Only *.png, *.gif and *.jpg files can be selected as an alternate image.');
			return false;
		}
		if (path !== '') {

			$t.find(".txtWidth").removeAttr("readonly");
			$t.find(".txtHeight").removeAttr("readonly");
			$t.find(".txtTitle").removeAttr("readonly");

			CDC.Admin.Capture.testAltImage($t.find('.filePicker'), path, function (response) {
				$t.find('.txtFilePath').val(path);
				var r = $.parseJSON(response);
				$t.find(".txtWidth").val(r.width);
				$t.find(".txtHeight").val(r.height);
				$t.find("#feedItmThumbImg")
					.attr("src", "data:image/png;base64," + r.byteString)
					.attr('width', r.width)
					.attr('height', r.height)
					.show();				
			});
		}
	});
}

function loadSourceInfo(_m, $t) {
	if (_m.id) {
		$t.find("#source").sourcePicker({
			selectedValue: $("<div/>").html(_m.sourceCode).text(),
			owningOrgSelector: $t.selector + " #owningOrg",
			maintainingOrgSelector: $t.selector + " #maintainingOrg",
			selectedOwningOrg: _m.owningOrgId,
			selectedMaintainingOrg: _m.maintainingOrgId
		});
	} else {
		$t.find("#source").sourcePicker({
			owningOrgSelector: $t.selector + " #owningOrg",
			maintainingOrgSelector: $t.selector + " #maintainingOrg"
		});
	}
}

function loadTopicInfo(_m, $t) {
	var selectedValueData = [];
	var topicCount = 0;
	var $tree = $t.find('.treeViewContainer');
	$tree.load(urlRoot + "/Capture/Templates/TreeView.htm", function () {
		$tree.find(".topicListContainer").showSpinner();
		$.ajax({
			url: APIRoot + "/adminapi/v1/resources/values?valueset=topics&max=0&sort=ValueName&language=english",
			dataType: "jsonp"
		}).done(function (response) {
			// filter out inactive items:
			response.results = $.grep(response.results, function (value) {
				return value.isActive;
			});
			$tree.valueTreeView({
				dataUrl: APIRoot + "/adminapi/v1/resources/values?valueset=topics&max=0&sort=ValueName&language=english",
				resizeContainer: false,
				postProcess: setupTreeviewEvents
			});
		}).fail(function (xhr, ajaxOptions, thrownError) {
			console.debug(xhr.status);
			console.debug(thrownError);
			console.debug(xhr.responseText);
		});
	});
	var setupTreeviewEvents = function (treeData) {
		// clear existing bindings
		$tree.find("li > a.btn").unbind("click");
		// flag selected
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
				$t.find(".modalSelectedValues").find("span").hide();
			});
		}
		$tree.find(".treeRootNode>.btn").addClass("inactive");
		// add add/remove handlers to tree items
		$tree.find(".topicListContainer .btn").not(".treeRootNode>.btn").click(function () {
			if ($(this).hasClass('inactiveTerm')) {
				return;
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
				$tree.find("[termId = '" + termId + "' ]").removeClass('btn-info').addClass('btn-default');
				deselectMe(termData);
			} else {
				$tree.find("[termId = '" + termId + "' ]").addClass('btn-info').removeClass('btn-default');
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
	};
	var selectMe = function (termData) {
		if (termData === undefined) {
			return;
		}
		var termName = $('<div/>').html(termData.valueName).text();
		var $pillLi = $("<li class='btn btn-gray btn-sm' termId='" + termData.valueId + "'>" + termName + " <i class='glyphicon glyphicon-remove icon-white'></i></li>");
		$pillLi.click(function () {
			deselectMe(termData);
		});
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
		$t.find('.treeViewContainer').find("[termId = '" + termData.valueId + "' ]").removeClass('btn-info').addClass('btn-default');
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

function getGeneralInfo(_m, $t) {
	_m.title = replaceWordChars($t.find("#title").val());
	_m.description = replaceWordChars($t.find("#description").val());

	if (_m.mediaType === "Feed" || _m.mediaType === "Feed Item") {
		if ($t.find("#targetUrl").length > 0) {
			_m.sourceUrl = $t.find("#targetUrl").val();
			_m.targetUrl = $t.find("#targetUrl").val();
		}
		else if ($t.find("#sourceUrl").length > 0) {
			_m.sourceUrl = $t.find("#sourceUrl").val();
			_m.targetUrl = $t.find("#sourceUrl").val();
		}
	} else {
		// source set by proxy or import page.
		_m.targetUrl = $t.find("#targetUrl").val();
	}

	_m.language = $t.find("#language option:selected").text();
	_m.status = $t.find("input[name=mediaStatus]:checked").val();
	_m.datePublished = combineDateTime($t.find("#publishDate").val(), $t.find("#timepicker1").val());
	if (_m.status === "Published") {
		_m.datePublished = convertToZDate($t.find("#publishDate").val(), $t.find("#timepicker1").val());
	}
}

function getRelatedImageInfo(_m, $t) {
	_m.feed = {};
	_m.feed.imageTitle = replaceWordChars($t.find("#imgTitle").val().trim());
	_m.feed.imageDescription = replaceWordChars($t.find("#imgDescription").val().trim());
	_m.feed.imageSource = $t.find("#imgSrc").val();
	_m.feed.imageWidth = $t.find("#width").val();
	_m.feed.imageHeight = $t.find("#height").val();
	_m.feed.imageLink = $t.find("#imgLink").val();
}

function getSourceInfo(_m, $t) {
	_m.sourceCode = replaceWordChars($t.find("#source option:selected").val());
	_m.owningOrgId = $t.find("#owningOrg option:selected").val();
	_m.maintainingOrgId = $t.find("#maintainingOrg option:selected").val();
}

function getTopicInfo(_m, $t) {
	if ($t.find('.treeview').length > 0) { // check to see if tree has loaded otherwise topics will not have changed.
		var selected = [];
		$t.find('.modalSelectedValues li').each(function () {
			selected.push($(this).attr('termid'));
		});
		if (!_m.tags) { _m.tags = {}; }
		_m.tags.topic = {};
		_m.topics = selected;
	}
}

function getGeotagInfo(_m, $t) {
	var geoIds = [];
	$t.find('.selectedLocations tr').each(function (idx, itm) {
		var id = $(this).attr("location-data");
		geoIds.push({ geoNameId: id });
	});
	_m.geoTags = geoIds;
}

function getContentGroupInfo(_m, $t) {

	var selectedContentGroups = [];
	$t.find('.selectedContentGroups tr').each(function (idx, itm) {
		var cat = $.parseJSON($(this).attr("contentGroup-data"));
		selectedContentGroups.push(cat.valueId);
	});
	if (!_m.tags) { _m.tags = {}; }
	_m.tags["contentgroup"] = [];
	$(selectedContentGroups).each(function (idx, itm) {
		_m.tags["contentgroup"].push({ "id": itm });
	});
}

function getFeedCategoryInfo(_m, $t) {
	var selectedCategories = [];
	$t.find('.selectedCategories tr').each(function (idx, itm) {
		var cat = $.parseJSON($(this).attr("category-data"));
		selectedCategories.push(cat.valueId);
	});
	if (!_m.tags) { _m.tags = {}; }
	_m.tags["feed item category"] = [];
	$(selectedCategories).each(function (idx, itm) {
		_m.tags["feed item category"].push({ "id": itm });
	});
}

function generalInfoEvents($t) {
	$t.find('input:radio[name="mediaStatus"]').off().change(function () {
		if ($(this).is(':checked') && $(this).val() === 'Published') {
			$t.find("#publishDateTime").show();
			return false;
		} else {
			$("#publishDateTime").hide();
			return false;
		}
	});
	$t.find(".glyphicon-calendar").parent().click(function () {
		$t.find("#publishDate").focus();
	});
	$t.find(".glyphicon-time").parent().click(function () {
		$t.find("#timepicker1").focus();
	});
	// handle tabbing - bootstrap is eating tab event.
	$t.find("#publishDate").focus(function () {
		cleanupTimePicker();
	});
	$t.find("#timepicker1").focus(function () {
		cleanupDatePicker();
	});
	$(".datepicker").find(".prev, .next, .day").css("cursor", "hand");
	$("body").off().on("keypress", function (e) {
		if (e.keyCode === 13) { // enter key
			cleanupDatePicker();
			cleanupTimePicker();
			return false;
		}
	});

	function cleanupDatePicker() {
		if ($(".datepicker").is(":visible")) {
			// setting async call - directly chaining hide event to enter is failing.
			setTimeout(function () {
				$(".datepicker").hide();
				$t.find("#publishDate").blur();
			}, 100);
		}
	}

	function cleanupTimePicker() {
		if ($(".bootstrap-timepicker-widget").is(":visible")) {
			// setting async call - directly chaining hide event to enter is failing.
			setTimeout(function () {
				$(".bootstrap-timepicker-widget").removeClass('open').addClass('closed');
				$t.find("#timepicker1").blur();
			}, 100);
		}
	}
	var characters = 200;
	$t.find("#description, #imgDescription").off().on({
		keyup: (function () {
			if ($(this).val().length > characters) {
				$(this).val($(this).val().substr(0, characters));
			}
		}),
		blur: (function () {
			if ($(this).val().length > characters) {
				$(this).val($(this).val().substr(0, characters));
			}
		})
	});
}

function relatedImageEvents($t) {
	var setImageFieldsRequired = function () {
		var t = $t.find("#imgTitle").val().trim().length;
		var d = $t.find("#imgDescription").val().trim().length;
		var s = $t.find("#imgSrc").val().trim().length;
		var l = $t.find("#imgLink").val().trim().length;
		var $o = $t.find("#imgTitle, #imgSrc, #width, #height, #imgLink");
		if (t > 0 || d > 0 || s > 0 || l > 0) {
			$o.parents('.form-group').find("label").addClass('required');
		} else {
			$o.parents('.form-group').find("label").removeClass('required');
		}
	};
	$t.find("#imgTitle, #imgDescription, #imgSrc, #imgLink").off().on({
		keyup: setImageFieldsRequired,
		blur: setImageFieldsRequired,
	});
	setImageFieldsRequired();
	$t.find("#btnActualSize").off().click(function () {
		var url = $t.find('#imgSrc').val();
		if (url.length > 0) {
			$t.find('#width').val(0);
			$t.find('#height').val(0);
			$t.find('#width').parents('.form-group').find('.validationMsg').hide();
			setDimensions($t, url);
		} else {
			$t.find('#width').val(0);
			$t.find('#height').val(0);
		}
		return false;
	});
	$t.find("#btnDefaultSize").off().click(function () {
		var url = $t.find('#imgSrc').val();
		if (url.length > 0) {
			$t.find('#width').parents('.form-group').find('.validationMsg').hide();
			$t.find('#width').val(144);
			$t.find('#height').val(400);
		} else {
			$t.find('#width').val(0);
			$t.find('#height').val(0);
		}
		return false;
	});
}

function feedItemThumbEvents($t) {
	var setImageFieldsRequired = function () {
		var fp = $t.find(".txtFilePath").val().trim().length;
		var w = $t.find(".txtWidth").val();
		var h = $t.find(".txtHeight").val();
		var t = $t.find(".txtTitle").val().trim().length;
		var $o = $t.find(".thumbLabel");
		if (fp > 0 || w !== 0 || h !== 0 || t > 0) {
			$o.addClass('required');
		} else {
			$o.removeClass('required');
		}
	};
	$t.find(".txtWidth, .txtHeight, .txtTitle").on({
		keyup: setImageFieldsRequired,
		blur: setImageFieldsRequired,
	});
	var resizeImage = function () {
		var w = $t.find(".txtWidth").val();
		var h = $t.find(".txtHeight").val();
		if ($.isNumeric(w) && w > 0) {
			$t.find("#feedItmThumbImg").width(w);
		}
		if ($.isNumeric(h) && h > 0) {
			$t.find("#feedItmThumbImg").height(h);
		}
	};
	$t.find(".txtWidth, .txtHeight").on({
		keyup: resizeImage,
		blur: resizeImage,
	});
	$t.find('.imgRow .btn-file :file').on('fileselect', function () {
		setTimeout(function () {
			resizeImage();
			setImageFieldsRequired();
		}, 1500);
	});
	setImageFieldsRequired();
}

function setDimensions($t, imgUrl, next) {
	function handleNext(isValid) {
		var func = next;
		if (typeof func === 'function') {
			func(isValid);
		}
	}
	var isValid = true;
	var img = new Image();
	img.onload = function () {
		var maxHeight = 400,
            maxWidth = 144;
		var recommendHeight = 400,
            recommendedWidth = 144;
		if ($t.find('#width').val() === recommendedWidth.toString()) {
			this.width = recommendedWidth;
		} else {
			$t.find('#width').val(this.width);
		}
		if ($t.find('#height').val() === recommendHeight.toString()) {
			this.height = recommendHeight;
		} else {
			$t.find('#height').val(this.height);
		}
		if (this.height > maxHeight || this.width > maxWidth) {
			$t.find('#width').parents('.form-group').find('.warningMsg').show().text('The width of the feed image can allow up to 144 pixels. The height of the feed image can allow up to 400 pixels.');
			isValid = true;
		}
		return handleNext(isValid);
	};
	img.src = imgUrl;
}

function displayCurrentStep($t, lastStep, currentStep) {

	var $progressbar = $t.find(".modal .progress-bar");
	if (lastStep < currentStep) {
		$progressbar.hide();
	} else {
		$progressbar.show();
		var percent = 100 / lastStep;
		$progressbar.attr("aria-valuenow", percent * currentStep);
		$progressbar.css("width", (percent * currentStep) + '%');
		$progressbar.find('span').text((percent * currentStep) + '% Complete');
	}


	$t.find("[class^=page_]").hide();
	$t.find('.page_' + currentStep).show();
	var $prev = $t.find("#prev");
	var $next = $t.find("#next");
	$t.find(".btn, .close").prop("disabled", false);

	$prev.prop("disabled", currentStep === 0 ? true : false);
	$next.prop("disabled", currentStep === lastStep ? true : false);
}

function validateUrlForType($field, isValid, type, next) {
	function handleNext(isValid) {
		var func = next;
		if (typeof func === 'function') {
			func(isValid);
		}
	}
	// empty === valid
	if ($.trim($field.val()).length === 0) {
		handleNext(true);
		return;
	}
	var url = [];
	url.push({
		"url": $field.val(),
		"resourceType": type
	});
	urlExists(url, function (exists, aMsg) {
		if (aMsg.length > 0) {
			//alert(JSON.stringify(aMsg));
			$.each(aMsg, function (index, msg) {
				//code = resource[1]
				var i = msg.code.replace("Resource[", "");
				i = i.replace("]", "");
				i = eval(i);
				//exclude empty fields
				if (msg.userMessage.indexOf("Exception") !== 0) {
					if (i === 0) {
						$field.parents('.form-group').find('.validationMsg').show().text('A valid ' + type + ' resource could not be found at ' + $field.val() + '.');
						isValid = false;
					}
				}
			});
		}
		handleNext(isValid);
	});
}


function getAltImgThumbnail(_m) {
	var ai = {};
	$(_m.alternateImages).each(function () {
		if (this.type.toUpperCase() === 'THUMBNAIL') {
			ai = this;
		}
	});
	return !$.isEmptyObject(ai) ? ai : null;
}

function loadFeedThumbnailInfo(_m, $t) {
	var ai = getAltImgThumbnail(_m);
	if (ai) {
		$t.find('.txtFilePath').val(ai.url);
		$t.find('.txtWidth').val(ai.width);
		$t.find('.txtHeight').val(ai.height);
		$t.find('.txtTitle').val(ai.name);
		$t.find('.feedItemThumb')
			.attr('src', ai.url)
			.attr('width', ai.width)
			.attr('height', ai.height)
			.show();
	}

}

var selectedContentGroups = [];
function loadContentGroupInfo(_m, $t) {
	
	$.ajax({
		url: APIRoot + "/adminapi/v1/resources/values?valueset=ContentGroup&max=0&sort=ValueName&language=english",
		dataType: "jsonp"
	}).done(function (response) {
		response.results = $.grep(response.results, function (value) {
			return value.isActive;
		});

		if (_m.tags && _m.tags["contentgroup"]) {
			selectedContentGroups = $.map(_m.tags["contentgroup"], function (itm, idx) {
				return itm.id;
			});
		}

		$t.find("#contentGroup").append("<option value=''>Select a Content Group</option>");
		$(response.results).each(function () {
			if (selectedContentGroups.indexOf(this.valueId) == -1) {
				$t.find("#contentGroup").append($("<option contentGroup-data='" + JSON.stringify(this) + "' value='" + this.valueId + "'>" + this.valueName + "</option>"));
			}
			else {
				buildRow(this);
			}
		});
		$t.find("#contentGroup").off().change(function () {
			var cg = $.parseJSON($(this).find(":selected").attr("contentGroup-data"));
			if (cg) {
				buildRow(cg);
				selectedContentGroups.push(cg.valueId);
				$(this).find(":selected").remove();
			}
		});


	}).fail(function (xhr, ajaxOptions, thrownError) {
		console.debug(xhr.status);
		console.debug(thrownError);
		console.debug(xhr.responseText);
	});


	function applyDeleteEvent() {
		$t.find('.selectedContentGroups .glyphicon-remove').off().click(function () {
			var cg = $.parseJSON($(this).parents('tr').attr("contentGroup-data"));
			buildOption(cg);
			selectedContentGroups.splice(selectedContentGroups.indexOf(cg.valueId), 1);
			$(this).parents('tr').remove();
			return false;
		});
	}

	function buildOption(item) {
		$t.find("#contentGroup").append($("<option contentGroup-data='" + JSON.stringify(item) + "' value='" + item.valueId + "'>" + item.valueName + "</option>"));
	}

	function buildRow(item) {
		var strRow = '';
		var catId = item.valueId;
		strRow += "<tr contentGroup-data='" + JSON.stringify(item) + "'>";
		strRow += '<td>' + item.valueName + '</td>';
		strRow += '<td><a href="#" class="pull-right" title="Remove this Content Group"><span class="glyphicon glyphicon-remove"></span></a></td>';
		strRow += '</tr>';
		$t.find('.selectedContentGroups > tbody').append(strRow);
		applyDeleteEvent();
	}

}


var selectedCategories = [];
function loadFeedCategoryInfo(_m, $t) {
	$.ajax({
		url: APIRoot + "/adminapi/v1/resources/values?valueset=feed item category&max=0&sort=ValueName&language=english",
		dataType: "jsonp"
	}).done(function (response) {
		//#category
		//#subcategory
		// filter out inactive items:
		response.results = $.grep(response.results, function (value) {
			return value.isActive;
		});
		var top = $.grep(response.results, function (itm, idx) {
			return $.grep(itm.relationships, function (rel, idx) {
				return rel.type === 'NT';
			}).length === 0 || itm.relationships.length === 0;
		});

		if (_m.tags && _m.tags["feed item category"]) {
			selectedCategories = $.map(_m.tags["feed item category"], function (itm, idx) {
				return itm.id;
			});
		}

		//_m.tags["feed item category"].length		

		$t.find("#category").append("<option value=''>Select a Category</option>");

		$(top).each(function () {						
			if (selectedCategories.indexOf(this.valueId) == -1) {
				$t.find("#category").append($("<option category-data='" + JSON.stringify(this) + "' value='" + this.valueId + "'>" + this.valueName + "</option>"));
			}
			else {
				buildRow(this);
			}
		});
		$t.find("#category").off().change(function () {
			var cat = $.parseJSON($(this).find(":selected").attr("category-data"));
			if (cat) {
				buildRow(cat);
				selectedCategories.push(cat.valueId);
				$(this).find(":selected").remove();
			}
		});

	}).fail(function (xhr, ajaxOptions, thrownError) {
		console.debug(xhr.status);
		console.debug(thrownError);
		console.debug(xhr.responseText);
	});

	function applyDeleteEvent() {
		$t.find('.selectedCategories .glyphicon-remove').off().click(function () {
			var cat = $.parseJSON($(this).parents('tr').attr("category-data"));
			buildOption(cat);
			selectedCategories.splice(selectedCategories.indexOf(cat.valueId), 1);
			$(this).parents('tr').remove();
			return false;
		});
	}

	function buildOption(item) {
		$t.find("#category").append($("<option category-data='" + JSON.stringify(item) + "' value='" + item.valueId + "'>" + item.valueName + "</option>"));
	}

	function buildRow(item) {
		var strRow = '';
		var catId = item.valueId;
		strRow += "<tr category-data='" + JSON.stringify(item) + "'>";
		strRow += '<td>' + item.valueName + '</td>';
		strRow += '<td><a href="#" class="pull-right" title="Remove this Category"><span class="glyphicon glyphicon-remove"></span></a></td>';
		strRow += '</tr>';
		$t.find('.selectedCategories > tbody').append(strRow);
		applyDeleteEvent();
	}

}

function loadGeoTagInfo(_m, $t) {
	var $locFields = $t.find('.location');
	$locFields.attr('disabled', 'disabled');
	// set defaults -
	getPlaces('', $locFields[0], 6255149); //6295630 - root
	getPlaces(6255149, $locFields[1], 6252001); //6255149 - North America
	getPlaces(6252001, $locFields[2]); //6252001 - USA                    
	setupEvents();
	addExisting();
	$locFields.change(function () {
		var placeID = $(this).find(':selected')[0].value,
            idx = $locFields.index($(this));
		if (placeID) {
			idx++;
			if (idx < $locFields.length) {
				getPlaces($(this).find(':selected')[0].value, $locFields[idx]);
			}
		}
		$t.find('.location:gt(' + (idx) + ')').each(function () {
			$(this).attr('disabled', 'disabled').children('option:not(:first)').remove();
		});
		if (placeID === '6255149') { //North America
			getPlaces(6255149, $locFields[1], 6252001); //Select U.S. if North America
			getPlaces(6252001, $locFields[2]); //6252001 - USA
		}
	});

	function getPlaces(gId, o, selectedId) {
		getLocations(gId, function (err, data) {
			var $o = $(o),
                idx = $locFields.index($o),
                locRows = $locFields.parents('.control-group');
			if (data && data.length > 0) {
				$o.children('option:not(:first)').remove();
				$.each(data, function (index, value) {
					var option = $('<option value="' + value.geoNameId + '">' + value.name + '</option>');
					if (value.geoNameId === selectedId) option.attr('selected', true);
					$o.append(option);
				});
				$o.removeAttr('disabled').addClass('active');
				locRows.show();
			} else {
				$locFields.parents('.control-group:gt(' + --idx + ')').hide();
			}
		});
	}

	function getLocations(gId, next) {
		var url = publicAPIRoot + "/v2/resources/locations/" + gId + "?max=0&callback=?";
		$.ajax({
			url: url,
			dataType: "jsonp"
		}).done(function (response) {
			return next(null, response.results);
		}).fail(function (xhr, ajaxOptions, thrownError) {
			return next(thrownError);
		});
	}

	function setupEvents() {
		$t.find("#addLocation").click(function () {
			addToSelected();
		});
	}

	function addExisting() {
		$(_m.geoTags).each(function () {
			var strLocation = this.countryCode + " , " + this.admin1Code + " , " + this.name;
			var strRow = '';
			var geoId = this.geoNameId;
			strRow += '<tr location-data="' + geoId + '">';
			strRow += '<td>' + strLocation + '</td>';
			strRow += '<td><a href="#" class="pull-right" title="Remove this location"><span class="glyphicon glyphicon-remove"></span></a></td>';
			strRow += '</tr>';
			$t.find('.selectedLocations > tbody').append(strRow);
		});
		$t.find('.selectedLocations tr .glyphicon-remove').unbind().click(function () {
			$(this).parents('tr').remove();
			toggleSelectedTableVisibility();
			return false;
		});
	}

	function addToSelected() {
		var strLocation = '';
		var strRow = '';
		var geoId = '';
		$locFields.each(function (itm, idx) {
			var $selected = $(this).find("option:selected");
			if ($selected.val() !== '') {
				strLocation = strLocation === '' ? '' : strLocation += ", ";
				strLocation += $selected.text() + " ";
				geoId = $selected.val();
			}
		});
		// check to see if row exists.
		if ($t.find('[location-data="' + geoId + '"]').length > 0) {
			alert('Location has already been selected');
			return;
		} else {
			// add row
			strRow += '<tr location-data="' + geoId + '">';
			strRow += '<td>' + strLocation + '</td>';
			strRow += '<td><a href="#" class="pull-right" title="Remove this location"><span class="glyphicon glyphicon-remove"></span></a></td>';
			strRow += '</tr>';
			$t.find('.selectedLocations > tbody').append(strRow);
		}
		$t.find('.selectedLocations tr .glyphicon-remove').unbind().click(function () {
			$(this).parents('tr').remove();
			toggleSelectedTableVisibility();
			return false;
		});
		toggleSelectedTableVisibility();
	}

	function toggleSelectedTableVisibility() {
		if ($t.find('.selectedLocations tr').length > 0) {
			$t.find('.selectedLocations').show();
			$t.find('.currentLocations').show();
		} else {
			$t.find('.selectedLocations').hide();
			$t.find('.currentLocations').hide();
		}
	}
}

function validateResourceExists($field, isValid, next) {
	function handleNext(isValid, contentType, contentLength) {
		var func = next;
		if (typeof func === 'function') {
			func(isValid, contentType, contentLength);
		}
	}
	// empty === valid
	if ($.trim($field.val()).length === 0) {
		handleNext(true);
		return;
	}
	$.ajax({
		type: "POST",
		url: urlRoot + "/Secure.aspx/ValidateUrlExists",
		data: JSON.stringify({
			"url": $field.val()
		}),
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function (response) {
			var obj = $.parseJSON(response.d);
			isValid = obj.status === "OK";
			if (!isValid) {
				$field.parents('.form-group').find('.validationMsg').show().text('A valid resource could not be found at ' + $field.val());
			}
			handleNext(isValid, obj.contentType, obj.contentLength);
		}
	}).fail(function (xhr, ajaxOptions, thrownError) {
		isValid = xhr.status === 200;
		if (!isValid) {
			$field.parents('.form-group').find('.validationMsg').show().text('A valid resource could not be found at ' + $field.val());
		}
		handleNext(isValid);
	});
}
// validation

function isProxyUrlValid($t) {	
	var $this = $t.find('#proxyUrl');
	if (!$.trim($this.val()).length) {
		$this.parents('.form-group').find('.validationMsg').show().text('Proxy Source is a required field.');
		isValid = false;
	} 
	return isValid;
}

function isImportUrlValid($t) {
	var $this = $t.find('#importUrl');
	if (!$.trim($this.val()).length) {
		$this.parents('.form-group').find('.validationMsg').show().text('Import Source is a required field.');
		isValid = false;
	}
	return isValid;
}

function isTitleValid($t) {
	var isValid = true;
	var $this = $t.find('#title');
	if (!$.trim($this.val()).length) {
		$this.parents('.form-group').find('.validationMsg').show().text('Title is a required field.');
		isValid = false;
	} else if ($.trim($this.val()).length > 200) {
		$this.parents('.form-group').find('.validationMsg').show().text('Title must be less than 200 characters.');
		isValid = false;
	}
	return isValid;
}

function isDescriptionValid($t) {
	var isValid = true;
	var $this = $t.find('#description');
	if (!$.trim($this.val()).length) {
		$this.parents('.form-group').find('.validationMsg').show().text('Description is a required field.');
		isValid = false;
	}
	return isValid;
}

function isMoreInfoUrlFormatValid($t) {
	var isValid = true;
	var $this = $t.find('#targetUrl');
	if (!$.trim($this.val()).length) {
		$this.parents('.form-group').find('.validationMsg').show().text('More Info URL is a required field.');
		isValid = false;
	} else if (!isValidUrlFormat($this.val())) {
		$this.parents('.form-group').find('.validationMsg').show().text('More Info URL is not in a valid URL format.');
		isValid = false;
	}
	return isValid;
}

function isSourceUrlFormatValid($t) {
	var isValid = true;
	var $this = $t.find('#sourceUrl');
	if (!$.trim($this.val()).length) {
		$this.parents('.form-group').find('.validationMsg').show().text('Source URL is a required field.');
		isValid = false;
	} else if (!isValidUrlFormat($this.val().trim())) {
		$this.parents('.form-group').find('.validationMsg').show().text('Source URL is not in a valid URL format.');
		isValid = false;
	}
	return isValid;
}

function isResourceUrlFormatValid($t) {
	var isValid = true;
	var $this = $t.find('#sourceUrl');
	if (!$.trim($this.val()).length) {
		$this.parents('.form-group').find('.validationMsg').show().text('Resource URL is a required field.');
		isValid = false;
	} else if (!isValidUrlFormat($this.val().trim())) {
		$this.parents('.form-group').find('.validationMsg').show().text('Resource URL is not in a valid URL format.');
		isValid = false;
	}
	return isValid;
}


function isTargetUrlFormatValid($t) {
	var isValid = true;
	var $this = $t.find('#targetUrl');
	if ($.trim($this.val()).length && !isValidUrlFormat($this.val())) {
		$this.parents('.form-group').find('.validationMsg').show().text('Target URL is not in a valid URL format.');
		isValid = false;
	}
	return isValid;
}

function isStatusValid($t) {
	var isValid = true;
	var $this = $t.find("input:radio[name ='mediaStatus']:checked");
	if ($this.length === 0) {
		$t.find("input:radio[name ='mediaStatus']").first().parents('.control-group').find('.validationMsg').show().text('Media Status is a required field.');
		isValid = false;
	}
	return isValid;
}

function isPubDateTimeValid($t) {
	// only validate if status is 'published
	if ($t.find("input:radio[name ='mediaStatus']:checked").val() !== 'Published') {
		return true;
	}
	$thisDate = $t.find("#publishDate");
	$thisTime = $t.find("#timepicker1");
	var isValid = true;
	var datePublished = $thisDate.val();
	var timePublished = $thisTime.val();
	// using form fields for this validation because media property is a combination of date and time fields.
	if (!datePublished) {
		$thisDate.parents('.form-group').first().find('.validationMsg').show().text('Publish Date is a required field.');
		isValid = false;
	}
	if (!timePublished) {
		$thisTime.parents('.form-group').first().find('.validationMsg').show().text('Publish Time is a required field.');
		isValid = false;
	}
	if (datePublished && timePublished) {
		var dateStr = "";
		var timeStr = "";
		var dUtc;
		var time = timePublished.split(" ")[0];
		var hours = time.split(":")[0];
		var minutes = time.split(":")[1];
		// Calendar validation
		if (!isDate(datePublished, "/", 1, 0, 2)) {
			$thisDate.parents('.form-group').first().find('.validationMsg').show().text('Date Published is a required field.');
			isValid = false;
		}
		// end Calendar validation
		// time validation
		if (!hours || !minutes) {
			$thisTime.parents('.form-group').first().find('.validationMsg').show().text('Time Published is a required field.');
			isValid = false;
		}
		// end time validation
	}
	return isValid;
}

function isImgTitleValid($t) {
	var isValid = true;
	var $this = $t.find('#imgTitle');
	if (!$.trim($this.val()).length) {
		$this.parents('.form-group').find('.validationMsg').show().text('Feed Image Title is a required field.');
		isValid = false;
	} else if ($.trim($this.val()).length > 200) {
		$this.parents('.form-group').find('.validationMsg').show().text('Feed Image Title must be less than 200 characters.');
		isValid = false;
	}
	return isValid;
}

function isImgSrcUrlFormatValid($t) {
	var isValid = true;
	var $this = $t.find('#imgSrc');
	if (!$.trim($this.val()).length) {
		$this.parents('.form-group').find('.validationMsg').show().text('Source URL is a required field.');
		isValid = false;
	} else if (!isValidUrlFormat($this.val())) {
		$this.parents('.form-group').find('.validationMsg').show().text('Source URL is not in a valid URL format.');
		isValid = false;
	}
	return isValid;
}

function isImgLinkUrlFormatValid($t) {
	var isValid = true;
	var $this = $t.find('#imgLink');
	if (!$.trim($this.val()).length) {
		$this.parents('.form-group').find('.validationMsg').show().text('Link URL is a required field.');
		isValid = false;
	} else if (!isValidUrlFormat($this.val())) {
		$this.parents('.form-group').find('.validationMsg').show().text('Link URL is not in a valid URL format.');
		isValid = false;
	}
	return isValid;
}

function isThumbPathValid($t) {
	var isValid = true;
	var $this = $t.find('.txtFilePath');
	if (!$.trim($this.val()).length) {
		$this.parent().find('.validationMsg').show().text('File path is a required field.');
		isValid = false;
	}
	return isValid;
}

function isThumbWidthValid($t) {
	//jQuery.isNumeric( value )
	var isValid = true;
	var $this = $t.find('.txtWidth');
	if (!$.trim($this.val()).length) {
		$this.parent().find('.validationMsg').show().text('Width is Required.');
		isValid = false;
	} else if (!$.isNumeric($this.val())) {
		$this.parent().find('.validationMsg').show().text('Width must be a numeric value.');
		isValid = false;
	}
	return isValid;
}

function isThumbHeightValid($t) {
	var isValid = true;
	var $this = $t.find('.txtHeight');
	if (!$.trim($this.val()).length) {
		$this.parent().find('.validationMsg').show().text('Height is Required.');
		isValid = false;
	} else if (!$.isNumeric($this.val())) {
		$this.parent().find('.validationMsg').show().text('Height must be a numeric value.');
		isValid = false;
	}
	return isValid;
}

function isThumbTitleValid($t) {
	var isValid = true;
	var $this = $t.find('.txtTitle');
	if (!$.trim($this.val()).length) {
		$this.parent().find('.validationMsg').show().text('Title is a required field.');
		isValid = false;
	}
	return isValid;
}

function isTopicSelectionValid($t, _m) {
	var isValid = true;
	if ($t.find("input:radio[name ='mediaStatus']:checked").val() !== 'Published') {
		isValid = true;
	} else {
		if ($t.find('.treeview').length > 0) {
			var count = $t.find('.modalSelectedValues ul li').length;
			if (count === 0) {
				$t.find('.modalSelectedValues .validationMsg').show().text('A published feed must be associated with one or more topics.');
				isValid = false;
			} else if (count > 15) {
				$t.find('.modalSelectedValues .validationMsg').show().text('A feed cannot be associated with more than 15 topics.');
				isValid = false;
			}
		} else {
			// check this if tree has not completed loading
			if (_m.tags.topic.length === 0) {
				$t.find('.modalSelectedValues .validationMsg').show().text('A published feed must be associated with one or more topics.');
				isValid = false;
			}
		}
	}
	return isValid;
}


function isContentGroupSelectionValid($t) {
	var isValid = true;

	if ($t.find('.selectedContentGroups tr').length === 0) {
		$t.find('.selectedContentGroups').parent().find('.validationMsg').show().text('A proxy feed must be associated with one or more Content Groups.');
		isValid = false;
	}
	
	return isValid;
}
function isEnclosureExtensionValid($t) {
	var isValid = true;
	var extensions = ["mp3", "mp4", "m3p", "m4p", "mpg", "mpeg", "wav", "wmv", "avi", "qt", "jpg", "jpeg", "gif", "tif", "png", "bmp", "ico", "xml", "pdf", "rtf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "zip", "gz", "swf", "txt", "htm", "html"];
	var path = $t.find("#sourceUrl").val().split('.');
	var ext;
	if (path.length > 1) {
		ext = path.pop();
		var parts = ext.split('?');
		if (parts.length > 1) { ext = parts[0]; }
		isValid = $.inArray(ext.toLowerCase(), extensions) > -1;		
	} else {
		isValid = true;
	}
	if (!isValid) {
		$t.find("#sourceUrl").parents('.form-group').find('.validationMsg').show().text('The file extension for this resource is not valid.');
	}
	return isValid;
}

function isOmnitureValid($t) {
	var isValid = true;
	var $this = $t.find('#omniture');
	if (!$.trim($this.val()).length) {
		$this.parents('.form-group').find('.validationMsg').show().text('Omniture Channel is a required field.');
		isValid = false;
	} 
	return isValid;
}

///////////

function getIconClass(fileName) {
	//*.mp3, *.mp4, *.m3p, *.m4p, *.mpg, *.mpeg, *.wav, *.wmv, *.avi, *.qt, *.jpg, *.jpeg, *.gif, *.tif, 
	//*.png, *.bmp, *.ico, *.xml, *.pdf, *.rtf, *.doc, *.docx, *.ppt, *.pptx, *.xls, *.xlsx, *.zip, *.gz, 
	//*.swf, *.txt, *.htm, *.html 

	var path = fileName.split('.');
	var ext;

	if (path.length > 1) {
		ext = path.pop().toLowerCase();
		switch (ext) {
			case "mp3":
			case "m3p":
			case "m4p":
			case "wav":
				return "fa-file-audio-o";
			case "mp4":
			case "mpg":
			case "mpeg":
			case "wmv":
			case "avi":
			case "qt":
			case "swf":
				return "fa-file-video-o";
			case "jpg":
			case "jpeg":
			case "gif":
			case "tif":
			case "png":
			case "bmp":
			case "ico":
				return "fa-file-picture-o";
			case "xml":
			case "htm":
			case "html":
				return "fa-file-code-o";
			case "pdf":
				return "fa-file-pdf-o";
			case "txt":
			case "rtf":
				return "fa-file-text-o";
			case "doc":
			case "docx":
				return "fa-file-word-o";
			case "ppt":
			case "pptx":
				return "fa-file-powerpoint-o";
			case "zip":
			case "gz":
				return "fa-file-zip-o";
			case "xls":
			case "xlsx":
				return "fa-file-excel-o";
			default: return "fa-file-o";
		}
	}
	else {
		return "fa-file";
	}
}