_ctx.setNavTarget('Feeds');
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



function initalize() {
	_ctx.setMediaType("feed");
	loadFeedList(loadContentGroupInfo);
}

var feedList = [];
function loadFeedList(postProcess) {	

	$.ajax({
		url: APIRoot + "/adminapi/v1/resources/media/?mediatype=Feed%2CFeed%20-%20Proxy%2CFeed%20-%20Import&status=published&max=0&pagenum=1",
		dataType: "jsonp"
	}).done(function (response) {

		feedList = response.results;
		if (typeof postProcess === 'function') { postProcess(); }

	}).fail(function (xhr, ajaxOptions, thrownError) {
		console.debug(xhr.status);
		console.debug(thrownError);
		console.debug(xhr.responseText);
	});

}

function loadContentGroupInfo() {

	$.ajax({
		url: APIRoot + "/adminapi/v1/resources/values?valueset=ContentGroup&max=0&sort=ValueName&language=english",
		dataType: "jsonp"
	}).done(function (response) {
		response.results = $.grep(response.results, function (value) {
			return value.isActive;
		});

		//•	https://.....[devApiServer]...../api/v2/resources/media.json?contentgroup=Newsroom
		// var url = publicAPIRoot + "/v2/resources/media.json?contentgroup=Newsroom";
		//•	Admin: http://.....[testReportingApplicationServer2]...../adminapi/v1/resources/clearcache 
		//	Storefront: http://.....[testApiServer]...../api/v2/resources/clearcache


		$(response.results).each(function (idx, o) {

			var publicUrl = publicAPIRoot + "/v2/resources/media.json?contentgroup=" + encodeURIComponent(o.valueName) + "&fields=id,name,description,mediaType,thumbnailUrl,syndicateUrl,embedUrl,contentUrl,alternateImages,tags,sourceUrl,targetUrl,status,enclosures";


			var $tr = $("<tr style='margin-top:10px;'>");
			var $td1 = $("<td><b>" + o.valueName + "</b></td>");
			$tr.append($td1);
			var $td2 = $("<td>")
			var $a = $("<a href='#' class='small' style='padding-left:20px; padding-right:50px;'>Preview JSON</a>");
			$td1.append($a);
			//$tr.append($td2);
			var $td3 = $("<td nowrap width='500px;'>API Call: <input type='text' value='" + publicUrl + "' style='width:80%;'></td>")
			$tr.append($td3);

			$a.click(function () {
				showPopUp("ContentGroupPreview.htm?contentgroup=" + encodeURIComponent(o.valueName));
				return false;
			});

			$(".cgList").append($tr);

			var thisList = $.grep(feedList, function (value) {
				if (!value.tags.contentgroup) { value.tags.contentgroup = [] }
				var exists = $.grep(value.tags.contentgroup, function (itm) {
					return itm.name == o.valueName;
				}).length > 0;
				if (exists) { return value;}
			});

			if (thisList.length > 0) {
				var $tr = $("<tr style='background-color: #fafafa;'>");
				var $td = $("<td colspan=2>");

				$tr.append($td);

				$ul = $("<ul style='margin-top:-5px; margin-bottom:-5px;'>");
				$td.append($ul);
				$(thisList).each(function (idx, o) {
					var $li = $("<li style='list-style-type: none;'>" + getFeedTypePill(o.mediaType) + "<a href='Feeds.htm?view=detail&id=" + o.mediaId + "'>" + o.title + "</a></li>");
					$ul.append($li);
				});

				$(".cgList").append($tr);
			}
			else {
				var $tr = $("<tr style='background-color: #fafafa;'>");
				var $td = $("<td colspan=2><em>There are no feeds assigned to this content group</em></td>");
				$tr.append($td);
				$(".cgList").append($tr);
			}

			var $tr3 = $("<tr><td>&nbsp;</td></tr>");
			$(".cgList").append($tr3);

		});


	}).fail(function (xhr, ajaxOptions, thrownError) {
		console.debug(xhr.status);
		console.debug(thrownError);
		console.debug(xhr.responseText);
	});

}
