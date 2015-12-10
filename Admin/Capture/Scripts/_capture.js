/* File Created: May 15, 2013 */
"use strict"; //ignore jslint

CDC.Admin.Capture = CDC.Admin.Capture || {};

_ctx.setNavTarget("Capture");

var firstLoad = true;

$(document).ready(function () {

	loadConfigValues(function () {
		var header = $(".head").header({
			selectedValue: _ctx.NavTarget,
			navigationHandler: function (navTarget) {
				_ctx.setSelectedMediaId("");
				captureNavHandler();
			},
			webFolder: getWebFolder(),
			callback: function () {
				if (!$.isEmptyObject(_ctx.UserInfo)) {
					header.setUser(_ctx.UserInfo);
				}
			}
		});

		if (document.location.toString().toLowerCase().indexOf("index.htm") > -1) {
			// the index page does its own instanciation of the htmlcapture screen
			firstLoad = false;
		}

		if (firstLoad) {
			captureNavHandler();
			firstLoad = false;
		}
	});

	if (document.referrer.toLowerCase().indexOf("filtermedia.htm") > -1) {
		// /Search/FilterMedia.htm //Search Results
		var path = urlRoot + "/Search/FilterMedia.htm";
		$(".trail a").first().attr("href", path);
		$(".trail a").first().text("Search Results");
		$(".trail").show();
	}
	else if (document.referrer.toLowerCase().indexOf("collections.htm") > -1) {
		// /Search/FilterMedia.htm //Search Results
		var path = urlRoot + "/Collections/Collections.htm";
		$(".trail a").first().attr("href", path);
		$(".trail a").first().text("Collections");
		$(".trail").show();
	}
	else if (document.referrer.toLowerCase().indexOf("feeds.htm") > -1) {
		// /Search/FilterMedia.htm //Search Results
		var path = urlRoot + "/Feeds/Feeds.htm";
		$(".trail a").first().attr("href", path);
		$(".trail a").first().text("Feeds");
		$(".trail").show();
	}
	else {
		$(".trail").hide();
	}

});

function captureNavHandler() {

	switch (_ctx.MediaType.toLowerCase()) {
		case 'html':
			$("#content").captureHTML({ mediaId: _ctx.SelectedMediaId, mediaType: _ctx.MediaType.toUpperCase() });
			break;
		case 'ecard':
			$("#content").captureEcard({ mediaId: _ctx.SelectedMediaId, mediaType: "eCard" });
			break;
		case 'video':
			$("#content").captureVideo({ mediaId: _ctx.SelectedMediaId, mediaType: toTitleCase(_ctx.MediaType) });
			break;
		case 'image':
		case 'infographic':
		case 'button':
		case 'badge':
			$("#content").captureStaticImage({ mediaId: _ctx.SelectedMediaId, mediaType: toTitleCase(_ctx.MediaType) });
			break;

		case 'pdf':
			$("#content").capturePdf({ mediaId: _ctx.SelectedMediaId, mediaType: toTitleCase(_ctx.MediaType) });
			break;

		case 'widget':
			$("#content").captureWidget({ mediaId: _ctx.SelectedMediaId, mediaType: toTitleCase(_ctx.MediaType) });
			break;


		case 'collection':
			$("#content").captureCollection({ mediaId: _ctx.SelectedMediaId, mediaType: toTitleCase(_ctx.MediaType) });
			break;

		default: break;
	}
}

function addOrUpdateThumb(runThumbnail, _initialSourceUrl, _media, APIRoot, $target) {
	if (runThumbnail) {
		// new item
		$(".thumbnailPreview").thumbnailGen({ media: _media });
	}
	else if (_initialSourceUrl !== _media.sourceUrl) {
		var gen = $target.find(".thumbnailPreview").thumbnailGen({ media: _media, autoRun: false });
		gen.createThumbnail(function (completed, src) {
			if (completed) {
				$('.thumbContainerDiv img').attr('src', APIRoot + "/adminapi/v1/resources/media/" + _media.id + "/thumbnail/?nochache=true");
			}
		});
	}
}

function toTitleCase(str) {
	return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}


function processNewEmbedCodeFormat(media) {

	media.description = media.description || "";
	media.title = media.title || "";

	var updatedTitle = media.description === '' ? media.title : media.title + ": " + media.description;

	var type = media.mediaType.toUpperCase();
	var start = media.embedcode.substr(media.embedcode.indexOf('<!-- Markup for ' + type + ' ('), ('<!-- Markup for ' + type + ' (').length);
	var end = media.embedcode.substr(media.embedcode.indexOf(') -->'));

	var out = start + updatedTitle + end;

	// data-w='' data-h='' 
	if (media.height != '' && media.width != '') {
		start = out.substr(0, out.indexOf("data-w='") + ("data-w='").length);
		end = out.substr(out.indexOf("'", out.indexOf("data-w='") + ("data-w='").length));

		if (start != '' && end != '') {
			out = start + media.width + end;
		}

		start = out.substr(0, out.indexOf("data-h='") + ("data-h='").length);
		end = out.substr(out.indexOf("'", out.indexOf("data-h='") + ("data-h='").length));

		if (start != '' && end != '') {
			out = start + media.height + end;
		}

	}

	return out;
}

function showError($target, msg) {
	$target.addClass('alert alert-danger');
	$target.empty().append(msg).show();
}

function clearError($target) {
	$target.removeClass('alert alert-danger');
	$target.empty().hide();
}

