(function ($) {
	var PLUGIN_NAME = 'feedDetail';

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

			$t.load("Templates/feedDetail.htm", function () {

				//hide sidebar modules until data is loaded.
				$('.feedPreview, .importOptions, .exportOptions').hide();

				$().showSpinner();
				if (options.mediaId) {
					CDC.Admin.Media.getMedia(options.mediaId, loadPage);
				}
				else {
					$('#feedModal').modal();
					$('#feedModal').feedModal({
						page: 6,
						saveHandler: function (media) {
							document.location = urlRoot + "/Feeds/Feeds.htm?view=detail&id=" + media.mediaId;
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

			$t.find(".aggregateData").hide();

			//if (_m.mediaType === "Feed - Proxy") {
			//	$t.find(".catLabel").text("Proxy Information");
			//	$t.find(".proxyData").show();
			//	s("#proxyUrl", _m.sourceUrl);
			//}

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
				var imgSrc = "<img src='" + ai.url + (ai.url.indexOf('?') > -1 ? "&" : "?") + "ts=" + n + "' class='feedImage'>";
				$t.find(".feedThumbnailContainer").empty().append(imgSrc);
			}

			if (_m.feed) {

				if (_m.feed.imageSource && _m.feed.imageSource !== '') {

					var imgSrc = "<img src='" + _m.feed.imageSource + (_m.feed.imageSource.indexOf('?') > -1 ? "&" : "?") + "ts=" + n + "' class='feedImage' width='" + _m.feed.imageWidth + "' height='" + _m.feed.imageHeight + "'>";

					if (_m.feed.imageLink !== '')
						$t.find(".feedImageContainer").empty().html("<a href='#' onclick='javascript:showPopUp(\"" + _m.feed.imageLink + "\"); return false;' class='source_url breakUrl'>" + imgSrc + "</a>");
					else
						$t.find(".feedImageContainer").empty().append(imgSrc);

				}
				else {
					$t.find(".feedImageDetails").hide();
				}



				s("#copyright", htmlDecode(_m.feed.copyright));
				s("#editorialManager", htmlDecode(_m.feed.editorialManager));
				s("#webMasterEmail", _m.feed.webMasterEmail);
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

			if (topics.length > 0) {
				s("#topics", topics.join(", "));
			} else {
				if (_m.status == "Published") {
					s("#topics", "<span style='color:red;' class='importInvalid'>At least one Topic is required.</span>");
				}
			}

			if (_m.mediaType === "Feed") { // managed

				$t.find(".catLabel").text("Categorization");
				$t.find('.feedPreview, .exportOptions').show();
				loadPreviewInfo(true, true, true);

			}
			else if (_m.mediaType === "Feed - Proxy") {
				$t.find(".catLabel").text("Proxy Information");
				$t.find(".proxyData").show();
				s("#proxyUrl", _m.sourceUrl);

				$t.find(".contentGroupData").hide();
				$t.find(".feedItemContainer").hide();
				$t.find('.feedPreview, .exportOptions').show();
				loadPreviewInfo(false, false, true);

			} else if (_m.mediaType === "Feed - Aggregate") {
				var feedAggregates = [];
				$(_m.feedAggregates).each(function () { feedAggregates.push("<div>" + this.queryString + "</div>"); });
				s("#aggregateSources", feedAggregates.join(""));

				$t.find(".catLabel").text("Aggregate");
				$t.find(".aggregateData").show();
				$t.find(".contentGroupData").hide();
				$t.find(".feedItemContainer").hide();
				$t.find('.feedPreview, .exportOptions').show();
				loadPreviewInfo(false, false, true);

			} else if (_m.mediaType === "Feed - Import") {
				$t.find(".catLabel").text("Import Information");
				$t.find(".importData").show();
				s("#importUrl", _m.sourceUrl);
				$t.find("#newFeedItem").hide();
				$t.find("#importFeedItems").off().on("click", function () {

					var url = APIRoot + "/adminapi/v1/resources/media/" + _m.id + "/importfeeditems";

					if ($t.find("#cbxArchiveMissing").is(':checked')) {
						url += "?deactivatemissingitems=true";
					}

					CDC.Admin.Capture.updateImportFeed(url, _m.mediaId,
						function (msg) {
							$t.find(".importCount").text("  " + msg);
							loadFeedItems();
							$().hideSpinner();
						},
						function (msg) {
							$t.find(".importCount").text("  " + msg);
						}
					);
					$().showSpinner();
				});

				$t.find('.feedPreview, .importOptions, .exportOptions').show();
				loadPreviewInfo(true, true, true);
			}

			// preview
			if (_m.status === "Published" || _m.status === "Hidden") {
				$t.find(".feedPreview ul").show();
				$t.find(".feedPreview .pubWarning").hide();
			}
			else {
				$t.find(".feedPreview ul").hide();
				$t.find(".feedPreview .pubWarning").show();
			}


			// export options
			if (!$.isEmptyObject(_m.feed.exportSettings)) {

				$(_m.feed.exportSettings).each(function (idx, obj) {
					var row = $t.find(".exportOptions li.existing").first().clone();
					row.find('div.path').text(obj.filePath);
					row.find('div.format').text(obj.feedFormat);
					row.find('.btnExportEdit, .btnExport, .btnExportDelete').attr('data-id', obj.feedExportId);
					$t.find(".exportOptions li.existing").first().after(row);
				});

				$t.find(".exportOptions li.existing").first().hide();
			} else {
				$t.find(".exportOptions li.existing").hide();
			}

			$t.find(".btnExportEdit").off().on('click', function () {
				$('#exportModal').modal();
				$('#exportModal').exportModal({
					media: _m,
					saveHandler: function () {
						main();
					},
					settingId: $(this).attr('data-id')
				});
			});

			$t.find(".btnExportNew").off().on('click', function () {
				$('#exportModal').modal();
				$('#exportModal').exportModal({
					media: _m,
					saveHandler: function () {
						main();
					}
				});
			});

			$t.find(".btnExportDelete").off().on('click', function () {
				if (confirm("Are you sure you want to delete this export setting?")) {
					var deleteId = $(this).attr('data-id');
					$().showSpinner();
					_m.feed.exportSettings = $.grep(_m.feed.exportSettings, function (itm) {
						return itm.feedExportId.toString() !== deleteId;
					});

					CDC.Admin.Capture.saveMediaData(_m,
						function () { main(); },
						function () { $().hideSpinner(); alert('An error occurred deleting this export option.'); return false; }
						);
				}
			});

			$t.find(".btnExport").off().on('click', function () {
				//https://.....[devReportingApplicationServer2]...../adminapi/v1/resources/exports/8/performexport 
				var url = APIRoot + "/adminapi/v1/resources/exports/" + $(this).attr('data-id') + "/performexport";

				CDC.Admin.Capture.exportFeed(url,
					function () {
						loadFeedItems();
						$().hideSpinner();
					});
				$().showSpinner();

			});

			$t.find(".pubOnlytoggle input").click(function () {
				// maintain height
				var $feedsWrap = $t.find('.feedItems_Wrap');
				var currentHeight = $feedsWrap.height();
				$feedsWrap.attr('style', 'min-height:' + currentHeight + 'px');

				loadFeedItems();
			});


			setEditLinks();
			$().hideSpinner();


			loadFeedItems();

			if (selectedMediaId != "null") {
				CDC.Admin.Media.getMedia(selectedMediaId, function (itm) {
					$('#feedItemModal').modal();
					$('#feedItemModal').feedItemModal({
						feed: _m,
						feedItem: itm,
						page: 0,
						saveHandler: function () {
							if (selectedMediaId != "null") {
								document.location = document.location.toString().replace("&selectedMediaId=" + selectedMediaId, "");
							} else {
								loadFeedItems();
							}
						}
					});

				});
			}

		};

		function s(selector, value) {
			if (value === null) { return; }
			else if (isValidUrlFormat(value)) {
				$t.find(selector).html("<a href='#' onclick='javascript:showPopUp(\"" + value + "\"); return false;' class='source_url breakUrl'>" + value + "</a>");
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

				$('#feedModal').modal();
				$('#feedModal').feedModal({
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

		function loadFeedItems() {

			$t.find("#newFeedItem").off().click(function () {
				$('#feedItemModal').modal();
				$('#feedItemModal').feedItemModal({
					feed: _m,
					page: 6,
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

			$t.find(".feedItem:visible").remove();
			var url = getUrl();

			CDC.Admin.Capture.loadChildItems(url, function (response) {
				bindFeeditemData(response.results);
				$(".pagination").pager({
					count: response.meta.pagination.total,
					displayCount: response.results.length,
					totalPages: response.meta.pagination.totalPages,
					currentPageNum: _pageNum,
					pagingHandler: function (newPageNumber) {
						_pageNum = newPageNumber;
						loadFeedItems();
						return false;
					}
				});
			});

		}

		var bindFeeditemData = function (results) {

			$t.find(".feedItem").not(':first').remove();

			$(results).each(function () {
				var $li = $t.find(".feedItem").first().clone();
				var itm = this;
				var idClass = "itm_" + itm.id;
				var pubStatus = (itm.status === 'Published') ? '' : ' - Unpublished';

				$li.addClass(idClass);
				$(".feedItems_Wrap ul.feedItem_Wraplist").append($li);

				s("." + idClass + " #itm_title", itm.id + ": " + itm.title + pubStatus);
				s("." + idClass + " #itm_description", itm.description);
				s("." + idClass + " #itm_sourceUrl", itm.sourceUrl);
				//s("." + idClass + " #itm_targetUrl", itm.targetUrl);
				s("." + idClass + " #itm_language", itm.language);
				s("." + idClass + " #itm_status", getPublishStatus(itm.status, itm.datePublished));

				if (itm.feed) {
					s("." + idClass + " #itm_imgsrc", itm.feed.imageSource);
					s("." + idClass + " #itm_imgwidth", itm.feed.imageWidth);
					s("." + idClass + " #itm_imgheight", itm.feed.imageHeight);
					s("." + idClass + " #itm_imgtitle", itm.feed.imageTitle);
					s("." + idClass + " #itm_imgdesc", itm.feed.imageDescription);
					s("." + idClass + " #itm_feedimglink", itm.feed.imageLink);
				}

				//s("." + idClass + " #itm_omniture", itm.omnitureChannel);

				var topics = [];
				$(itm.tags.topic).each(function () {
					topics.push(this.name);
				});
				if (topics.length > 0) {
					s("." + idClass + " #itm_topics", topics.join(", "));
				}

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
					$thisFeedItem = $this.parents('.feedItem');

				$thisFeedItem.find('.feedItem_detail').slideToggle(function () {
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
			$li.find(".feedItem_enclosure").empty();

			$li.find('.actionEdit').off().on('click', function (e) {
				$('#feedItemModal').modal();
				$('#feedItemModal').feedItemModal({
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

				var $liEnc = $("<li><div class='row'><div class='col-md-9'><a href='#' onclick='javascript:showPopUp(\"" + enc.resourceUrl + "\"); return false;' class='source_url breakUrl' style='display:inline-block;'><span id='fileIcon' class='fa " + getIconClass(enc.resourceUrl) + "'></span>" + enc.resourceUrl + "</a></div> <div class='col-md-3 enclosureUtilBtns text-right'></div></div></li>");
				var $editLink = $("<a tabindex='-1' href='#' class='btn btn-default btn-xs'>Edit</a>");
				var $deleteLink = $("<a tabindex='-1' href='#' class='btn btn-default btn-xs'>Delete</a>");

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


				$liEnc.find(".enclosureUtilBtns").append($editLink);
				$liEnc.find(".enclosureUtilBtns").append($deleteLink);


				$li.find(".feedItem_enclosure").append($liEnc);
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


		function loadPreviewInfo(blnRss, blnAtom, blnJson) {
			if (blnRss) {
				var rssUrl = publicAPIRoot + "/v2/resources/media/" + options.mediaId + ".rss";
				rssUrl = rssUrl.replace("https", "http");
				$t.find(".showRssPreview")
					.click(function () { showPopUp(rssUrl); })
					.parent().find("input").val(rssUrl);
			} else {
				$t.find(".showRssPreview").parent().hide()
			}
			if (blnAtom) {
				var atomUrl = publicAPIRoot + "/v2/resources/media/" + options.mediaId + ".atom";
				atomUrl = atomUrl.replace("https", "http");
				$t.find(".showAtomPreview")
					.click(function () { showPopUp(atomUrl); })
					.parent().find("input").val(atomUrl);
			} else {
				$t.find(".showAtomPreview").parent().hide()
			}
			if (blnJson) {

				if (_m.mediaType === "Feed - Aggregate") {
					var jsonUrl = publicAPIRoot + "/v2/resources/media?parentId=" + options.mediaId;
				}
				else if (_m.mediaType === "Feed - Proxy") {
					var jsonUrl = publicAPIRoot + "/v2/resources/media/" + options.mediaId + ".rss";
				}
				else {
					var jsonUrl = publicAPIRoot + "/v2/resources/media/" + options.mediaId + "?showchildlevel=1";
				}

				jsonUrl = jsonUrl.replace("https", "http");
				jsonUrl = encodeURI(jsonUrl);

				$t.find(".showJsonPreview")
					.click(function () {
						showPopUp("jsonPreview.htm?url=" + jsonUrl);
					})
					.parent().find("input").val(jsonUrl);
			} else {
				$t.find(".showJsonPreview").parent().hide()
			}
		}

		main();

	};

})(jQuery);
