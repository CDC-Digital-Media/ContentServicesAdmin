(function ($) {
	var PLUGIN_NAME = 'seriesDetail';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults:
        {
        	mediaId: ''
        }
    };

	"use strict"; //ignore jslint

	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		var $t = options.target;
		var _m = {};
		var step = 1;
		var selectedValueData = [];
		var topicCount = 0;

		// paging variable - not using all of these right now, but copying whole block of paging logic for completeness and possible future upgrade.
		var _totalPages = 0;
		var _pageNum = 1;
		var _pageSize = 10;
		var _sortIndex = '';
		var _sortDirection = '';
		var _sortProperty = '';
		var _search = '';

		var selectedMediaId = getURLParameter('selectedMediaId');

		var main = function () {

			$t.load("Templates/seriesDetail.htm", function () {
				$().showSpinner();
				if (options.mediaId) {
					CDC.Admin.Media.getMedia(options.mediaId, loadPage);
				}
				else {
					$('#seriesModal').modal();
					$('#seriesModal').seriesModal({
						page: 0,
						saveHandler: function (media) {
							document.location = urlRoot + "/Podcasts/Podcasts.htm?view=detail&id=" + media.mediaId;
							return false;
						}
					});
				}

			});

		};

		var loadPage = function (media) {

			if (!media) {
				CDC.Admin.Media.getMedia(options.mediaId, loadPage);
				return;
			}

			_m = media;

			var contentGroups = [];
			$(_m.tags.contentgroup).each(function () { contentGroups.push(this.name); });
			s("#contentGroups", contentGroups.join(", "));

			s("#title, .mediaTitle", htmlDecode(_m.title));
			s("#description", htmlDecode(_m.description));
			s("#targetUrl", _m.targetUrl);
			s("#language", _m.language);

			s("#mediaStatus", getPublishStatus(_m.status, _m.datePublished));

			// lets get a timestamp to add to image urls to defeat the caching:
			var d = new Date();
			var n = d.getMilliseconds();

			var ai = getAltImgThumbnail(_m);
			if (ai) {
				var imgSrc = "<img src='" + ai.url + (ai.url.indexOf('?') > -1 ? "&" : "?") + "ts=" + n + "' class='seriesImage' width='" + ai.width + "' height='" + ai.height + "'>";
				$t.find(".seriesThumbnailContainer").empty().append(imgSrc);
			}

			if (_m.series) {

				if (_m.series.imageSource && _m.series.imageSource !== '') {

					var imgSrc = "<img src='" + _m.series.imageSource + (_m.series.imageSource.indexOf('?') > -1 ? "&" : "?") + "ts=" + n + "' class='feedImage' width='" + _m.series.imageWidth + "' height='" + _m.series.imageHeight + "'>";

					if (_m.series.imageLink !== '')
						$t.find(".seriesImageContainer").empty().html("<a href='#' onclick='javascript:showPopUp(\"" + _m.series.imageLink + "\"); return false;' class='source_url'>" + imgSrc + "</a>");
					else
						$t.find(".seriesImageContainer").empty().append(imgSrc);

				}
				else {
					$t.find(".seriesImageDetails").hide();
				}



				s("#copyright", htmlDecode(_m.series.copyright));
				s("#editorialManager", htmlDecode(_m.series.editorialManager));
				s("#webMasterEmail", _m.series.webMasterEmail);
			}

			s("#author", htmlDecode(_m.author));

			s("#det_source", _m.sourceCode);
			s("#det_owningOrg", _m.owningOrgName === null ? "" : _m.owningOrgName);
			s("#det_maintainingOrg", _m.maintainingOrgName === null ? "" : _m.maintainingOrgName);
			s("#det_omniture", _m.omnitureChannel === null ? "" : htmlDecode(_m.omnitureChannel));

			var topics = [];
			$(_m.tags.topic).each(function () {
				topics.push(this.name);
			});

			s("#topics", topics.join(", "));

			// preview
			if (_m.status === "Published") {
				$t.find(".seriesPreview ul").show();
				$t.find(".seriesPreview .pubWarning").hide();
			}
			else {
				$t.find(".seriesPreview ul").hide();
				$t.find(".seriesPreview .pubWarning").show();
			}

			var rssUrl = APIRoot + "/adminapi/v1/resources/media/" + options.mediaId + ".rss";
			rssUrl = rssUrl.replace("https", "http");
			$t.find(".showRssPreview")
				.click(function () { showPopUp(rssUrl); })
				.parent().find("input").val(rssUrl);

			var atomUrl = APIRoot + "/adminapi/v1/resources/media/" + options.mediaId + ".atom";
			atomUrl = atomUrl.replace("https", "http");
			$t.find(".showAtomPreview")
				.click(function () { showPopUp(atomUrl); })
				.parent().find("input").val(atomUrl);

			$t.find(".showJsonPreview")
				.click(function () { showPopUp("jsonPreview.htm?id=" + options.mediaId + ".json&showchildlevel=1"); })
				.parent().find("input").val(APIRoot + "/adminapi/v1/resources/media/" + options.mediaId + ".json?showchildlevel=1");


			$t.find(".pubOnlytoggle input").click(function () {
				// maintain height
				var $feedsWrap = $t.find('.seriesItems_Wrap');
				var currentHeight = $feedsWrap.height();
				$feedsWrap.attr('style', 'min-height:' + currentHeight + 'px');

				loadPodcasts();
			});

			setEditLinks();
			$().hideSpinner();


			loadPodcasts();

			if (selectedMediaId != "null") {
				CDC.Admin.Media.getMedia(selectedMediaId, function (itm) {
					$('#podcastModal').modal();
					$('#podcastModal').podcastModal({
						feed: _m,
						feedItem: itm,
						page: 0,
						saveHandler: function () {
							if (selectedMediaId != "null") {
								document.location = document.location.toString().replace("&selectedMediaId=" + selectedMediaId, "");
							} else {
								loadPodcasts();
							}
						}
					});

				});
			}

		};

		function s(selector, value) {
			if (value === null) { return; }
			else if (isValidUrlFormat(value)) {
				$t.find(selector).html("<a href='#' onclick='javascript:showPopUp(\"" + value + "\"); return false;' class='source_url'>" + value + "</a>");
			}
			else if (isValidEmailFormat(value)) {
				$t.find(selector).html("<a href='mailto:" + value + "'>" + value + "</a>");
			}
			else {
				$t.find(selector).html(value);
			}
		}

		function setEditLinks() {
			$t.find(".sectionEdit").click(function () {
				var $lnk = $(this);
				var p = $lnk.attr("data-page");

				$('#seriesModal').modal();
				$('#seriesModal').seriesModal({
					media: _m,
					page: p,
					saveHandler: function () {
						main();
					}
				});
				return false;
			})
		}

		var getUrl = function () {

			var url = APIRoot + "/adminapi/v1/resources/media?sort=-datepublished&parentid=" + _m.id;

			//have we stored paging parameters?
			if (_ctx.Filter.PageData) {
				_pageSize = _ctx.Filter.PageData._pageSize;
				_pageNum = _ctx.Filter.PageData._pageNum;
				_sortDirection = _ctx.Filter.PageData._sortDirection;
				_sortProperty = _ctx.Filter.PageData._sortProperty;
				_sortIndex = _ctx.Filter.PageData._sortIndex;
				_ctx.setPageData(null);
			}

			if (_sortProperty !== '') {
				url += "&sort=";
				url += _sortDirection;
				url += _sortProperty;
			}

			if (_search !== '') url += "&q=" + _search;
			if ($(".pubOnlytoggle input").prop('checked')) {
				url += "&status=published";
			}
			url += "&max=" + _pageSize + "&pagenum=" + _pageNum + "&callback=?";

			return url;
		};

		function loadPodcasts() {

			$t.find("#newSeries").off().click(function () {
				$('#podcastModal').modal();
				$('#podcastModal').podcastModal({
					feed: _m,
					page: 0,
					saveHandler: function () {
						if (selectedMediaId != "null") {
							document.location = document.location.toString().replace("&selectedMediaId=" + selectedMediaId, "");
						} else {
							loadPage();
						}
					}

				});
				return false;
			})

			$t.find(".seriesItem:visible").remove();
			var url = getUrl();

			CDC.Admin.Capture.loadChildItems(url, function (response) {
				bindPodcastData(response.results);
				$(".pagination").pager({
					count: response.meta.pagination.total,
					displayCount: response.results.length,
					totalPages: response.meta.pagination.totalPages,
					currentPageNum: _pageNum,
					pagingHandler: function (newPageNumber) {
						_pageNum = newPageNumber;
						loadPodcasts();
						return false;
					}
				});
			});

		}

		var bindPodcastData = function (results) {

			$t.find(".seriesItem").not(':first').remove();

			$(results).each(function () {
				var $li = $t.find(".seriesItem").first().clone();
				var itm = this;
				var idClass = "itm_" + itm.id;
				var pubStatus = (itm.status === 'Published') ? '' : ' - Unpublished';

				$li.addClass(idClass);
				$(".seriesItems_Wrap ul.seriesItem_Wraplist").append($li);

				s("." + idClass + " #itm_title", itm.id + ": " + itm.title + pubStatus);
				s("." + idClass + " #itm_description", itm.description);
				s("." + idClass + " #itm_sourceUrl", itm.sourceUrl);
				//s("." + idClass + " #itm_targetUrl", itm.targetUrl);
				s("." + idClass + " #itm_language", itm.language);
				s("." + idClass + " #itm_status", getPublishStatus(itm.status, itm.datePublished));

				if (itm.series) {
					s("." + idClass + " #itm_imgsrc", itm.series.imageSource);
					s("." + idClass + " #itm_imgwidth", itm.series.imageWidth);
					s("." + idClass + " #itm_imgheight", itm.series.imageHeight);
					s("." + idClass + " #itm_imgtitle", itm.series.imageTitle);
					s("." + idClass + " #itm_imgdesc", itm.series.imageDescription);
					s("." + idClass + " #itm_feedimglink", itm.series.imageLink);
				}

				//s("." + idClass + " #itm_omniture", itm.omnitureChannel);

				var topics = [];
				$(itm.tags.topic).each(function () {
					topics.push(this.name);
				});
				s("." + idClass + " #itm_topics", topics.join(", "));

				var fiCategory = [];
				$(itm.tags["feed item category"]).each(function () {
					fiCategory.push(this.name);
				});
				s("." + idClass + " #itm_category", fiCategory.join(", "));


				var locs = []
				$(itm.geoTags).each(function () {
					locs.push(this.name + ", " + this.admin1Code + " " + this.countryCode);
				});
				s("." + idClass + " #itm_locations", locs.join("<br>"));

				var ai = {};
				$(itm.alternateImages).each(function () {
					if (this.type.toUpperCase() === 'THUMBNAIL') {
						ai = this;
					}
				});
				if (!$.isEmptyObject(ai)) {
					s("." + idClass + " #itm_thumbsrc", ai.url);
					s("." + idClass + " #itm_thumbwidth", ai.width);
					s("." + idClass + " #itm_thumbheight", ai.height);
					s("." + idClass + " #itm_thumbtitle", ai.name);
				}

				loadEnclosures(itm);

				$li.show();

			});

			// Feed Item Open
			$t.find('.toggleShowDetail').on('click', function (e) {
				e.preventDefault();
				var $this = $(this),
					$thisFeedItem = $this.parents('.seriesItem');

				$thisFeedItem.find('.seriesItem_detail').slideToggle(function () {
					if ($this.hasClass('fa-angle-up')) {
						// CLOSED
						$thisFeedItem.removeClass('selected');
						$this.removeClass('fa-angle-up').addClass('fa-angle-down');
					} else {
						// OPEN
						$thisFeedItem.addClass('selected');
						$this.removeClass('fa-angle-down').addClass('fa-angle-up');
					}
				});
			});

		}

		var loadEnclosures = function (itm) {

			var $li = $t.find(".itm_" + itm.id);
			$li.find(".seriesItem_enclosure").empty();

			$li.find('.actionEdit').off().on('click', function (e) {
				$('#podcastModal').modal();
				$('#podcastModal').podcastModal({
					feed: _m,
					feedItem: itm,
					page: 0,
					saveHandler: function () {
						if (selectedMediaId != "null") {
							document.location = document.location.toString().replace("&selectedMediaId=" + selectedMediaId, "");
						} else {
							loadPage();
						}
					}
				});
				return false;
			});

			$li.find('.actionAttach').off().on('click', function (e) {
				$('#enclosureModal').modal();
				$('#enclosureModal').enclosureModal({
					feed: _m,
					feedItem: itm,
					saveHandler: loadEnclosures
				});
				return false;
			});

			$(itm.enclosures).each(function () {

				var enc = this;

				var $liEnc = $("<li><span id='fileIcon' class='fa " + getIconClass(enc.resourceUrl) + "'></span> &nbsp; &nbsp; <div class='feedItem_util text-right'></div><a href='#' onclick='javascript:showPopUp(\"" + enc.resourceUrl + "\"); return false;' class='source_url'>" + enc.resourceUrl + "</a></li>");
				var $editLink = $("<a tabindex='-1' href='#' class='btn btn-secondary btn-sm'><span class='fa fa-pencil'></span> Edit</a>");
				var $deleteLink = $("<a tabindex='-1' href='#' class='btn btn-secondary btn-sm'><span class='fa fa-times'></span> Delete</a>");

				$editLink.off().on('click', function (e) {

					$('#enclosureModal').modal();
					$('#enclosureModal').enclosureModal({
						feed: _m,
						feedItem: itm,
						enclosure: enc,
						saveHandler: loadEnclosures
					});
					return false;
				});

				$deleteLink.off().on('click', function (e) {
					if (confirm("Are you sure you want to delete this resource?")) {

						var onSuccessfulSave = function (oMedia, runThumbnail) {
							$t.find(".btn, .close").prop("disabled", false);
							$t.find('.close').click();
							$t.find('.modal-body').hideSpinner();
							loadEnclosures(oMedia);
						};

						var onFailedSave = function (oMsg) {
							if (oMsg.length > 0) {

								var msgHandled = false;

								$(oMsg).each(function () { });

								if (!msgHandled) {
									var messages = "<ul>";
									$(oMsg).each(function () {
										messages = messages + "<li>" + $(this)[0].userMessage + "</li>";
									});
									messages = messages + "</ul>";
									alert(messages);
								}
							}
							$t.find('.modal-body').hideSpinner();
							$t.find(".btn, .close").prop("disabled", false);
						};

						var encs = $.grep(itm.enclosures, function (e) {
							return e.id != enc.id;
						});
						itm.enclosures = encs;
						itm.parentRelationships = [{ relatedMediaId: _m.id }];
						CDC.Admin.Capture.saveMediaData(itm, onSuccessfulSave, onFailedSave)

					}
					return false;

				})


				$liEnc.find("div").append($editLink);
				$liEnc.find("div").append($deleteLink);


				$li.find(".seriesItem_enclosure").append($liEnc);
			})
		}


		function getPublishStatus(status, date) {
			if (!$.isEmptyObject(date) && status === 'Published') {
				var d = new Date(date);

				var currDate = d.getDate();
				var currMonth = d.getMonth() + 1;
				var currYear = d.getFullYear();

				var dateStr = currMonth + "/" + currDate + "/" + currYear;

				return status + ' ' + dateStr + ' ' + formatAMPM(d);
			}
			else {
				return status;
			}
		}

		main();

	};

})(jQuery);