(function ($) {
	var PLUGIN_NAME = 'podcastModal';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults:
        {
        	series: {},
        	podcast: {},
        	page: 1,
        	saveHandler: ''
        }
    };

	"use strict"; //ignore jslint

	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		function handleSave() {
			var func = options.saveHandler; if (typeof func === 'function') {
				func();
			}
		}

		var $t = options.target;
		var _itm = options.podcast;
		var _s = options.series;
		var _step = eval(options.page);
		var _isCopied = false;

		function updateDisplay() {
			displayCurrentStep($t, 5, _step);
		}

		var main = function () {

			$t.load("Templates/podcastModal.htm", function () {

				if (_step == 6) {
					$t.find(".modal-title").text("New Feed Item");
					$t.find(".progress-bar, #prev, #next, #saveFeed").hide();
					// choose new or existing media -

					$t.find("#createNew").off().click(function () {
						_step = 0;
						main();
					});

					$t.find("#chooseExisting").off().click(function () {
						_ctx.setSelectedFeed(_s.id, _s.title);
						document.location = urlRoot + "/Search/FilterMedia.htm";
					});

				}
				else {
					$t.find(".progress-bar, #prev, #next, #saveFeed").show();

					if (_itm.id) {
						$(".modal-title").text("Edit Feed Item");
					}
					else {
						$(".modal-title").text("Add Feed Item");
					}

					loadMediaData();
					setupEvents();
				}

				updateDisplay();
			});

		};


		function loadMediaData() {
			loadGeneralInfo(_itm, $t);
			loadAltImageInfo(_itm, $t);
			loadFeedThumbnailInfo(_itm, $t);
			loadRelatedImageInfo(_itm, $t);
			loadTopicInfo(_itm, $t);
			loadSourceInfo(_itm, $t);
			loadFeedCategoryInfo(_itm, $t);
			loadGeoTagInfo(_itm, $t);
		}

		function saveFeedItem() {

			if (_itm.mediaType === undefined || _itm.mediaType !== "Feed Item") {
				// copying from existing media or creating new
				_isCopied = _itm.mediaType !== undefined;
				
				_itm.id = "";
				_itm.mediaType = "Feed Item";
				_itm.mimeType = "text/xml";
				_itm.encoding = "UTF-8";
			}

			// have to set this as it's not populated when requesting media
			_itm.parentRelationships = [{ relatedMediaId: _s.id }];

			getGeneralInfo(_itm, $t);
			getRelatedImageInfo(_itm, $t);
			getTopicInfo(_itm, $t);
			getSourceInfo(_itm, $t);			
			getGeotagInfo(_itm, $t);			
			getFeedCategoryInfo(_itm, $t);


			var closeAndCompete = function () {
				$t.find(".btn, .close").prop("disabled", false);
				$t.find('.close').click();
				$t.find('.modal-body').hideSpinner();
				handleSave();
			};

			var onSuccessfulSave = function (oMedia, runThumbnail) {

				var $filePicker = $t.find('.filePicker');
				var filePath = $t.find('.txtFilePath').val();
				var height = $t.find('.txtHeight').val();
				var width = $t.find('.txtWidth').val();
				var name = $t.find('.txtTitle').val().split(' ').join('_');
				var type = "thumbnail";

				if (filePath !== '' && name !== '') { // i've got something to save. perhaps.

					// if i'm a url rather than a file path, ignore me - i've been loaded from existing 
					// data UNLESS i've been copied from an existing media in which case, i need to process
					// the url to get the byte stream for the thumbnail.
					if (isValidUrlFormat(filePath)) {
						if (_isCopied) {
							// parse image from url and save
							CDC.Admin.Capture.saveAltImageFromUrl(filePath, oMedia.id, height, width, name, type, function (response) {
								
								if ($t.find("#cbxCopyThumb").is(':checked')) {
									// copy url thumbnail to feed image
									saveFeedImageFromThumb(oMedia, APIRoot + "/adminapi/v1/resources/links/" + JSON.parse(response).results[0].storageId + ".png");
								}
								else {
									closeAndCompete();
								}
							});
						} else if ($t.find("#cbxCopyThumb").is(':checked')) {
							var ai = getAltImgThumbnail(oMedia);
							if (ai) {
								// copy existing alt image thumbnail to feed image
								saveFeedImageFromThumb(oMedia, ai.url);
							} else {
								closeAndCompete();
							}

						} else {
							closeAndCompete();
						}
					} else {
						CDC.Admin.Capture.saveAltImage($filePicker, filePath, oMedia.id, height, width, name, type, function (response) {
							
							if ($t.find("#cbxCopyThumb").is(':checked')) {
								// copy new thumbnail to alt image
								saveFeedImageFromThumb(oMedia, APIRoot + "/adminapi/v1/resources/links/" + JSON.parse(response).results[0].storageId + ".png");
							}
							else {
								closeAndCompete();
							}

						});
												
					}




				}
				else {
					closeAndCompete();
				}

			};

			var onFailedSave = function (oMsg) {
				if (oMsg.length > 0) {

					var msgHandled = false;

					$(oMsg).each(function () {
						if ($(this)[0].userMessage == "Title already exists") {
							$t.find('#title').parents('.form-group').find('.validationMsg').show().text('This title is already being used by another feed.');
							_step = 0; updateDisplay(); msgHandled = true;
						}
					});

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

			function saveFeedImageFromThumb(oMedia, imgSrc) {
				oMedia.parentRelationships = [{ relatedMediaId: _s.id }];
				oMedia.feed = {};
				oMedia.feed.imageTitle = oMedia.title;
				oMedia.feed.imageDescription = oMedia.description;
				oMedia.feed.imageSource = imgSrc;
				oMedia.feed.imageWidth = 155;
				oMedia.feed.imageHeight = 84;
				oMedia.feed.imageLink = oMedia.sourceUrl;
				CDC.Admin.Capture.saveMediaData(oMedia, closeAndCompete, onFailedSave);
			}

			$t.find('.modal-body').showSpinner();

			CDC.Admin.Capture.saveMediaData(_itm, onSuccessfulSave, onFailedSave);

		}

		function setupEvents() {

			$t.find('.validationMsg').hide();

			generalInfoEvents($t);
			relatedImageEvents($t);
			feedItemThumbEvents($t);

			$t.find("#prev").off().click(function () { _step -= 1; updateDisplay(); });
			$t.find("#next").off().click(function () { _step += 1; updateDisplay(); });

			$t.find("#saveFeed").off().click(function () {
				$t.find(".btn, .close").prop("disabled", true);

				validateFeedItem(function () {
					saveFeedItem();
				});

				return false;
			});

			$t.find("#clear").off().click(function () {

				$t.find("input:visible, textarea:visible").not('input:radio').val("");
				$t.find("select:visible").prop('selectedIndex', 0);
				$t.find(".modalSelectedValues:visible .btn[termId]").click();

				return false;
			});

		}


		//validation code
		function validateFeedItem(next) {

			function completeHandler() {
				var func = next; if (typeof func === 'function') {func();}
			}

			var valid = true;
			$t.find('.validationMsg').hide();

			function validatePage1(next) {
				isValid = true;
				function handleNext(isValid) {
					if (!isValid) { _step = 0; updateDisplay(); return; }
					var func = next; if (typeof func === 'function') {
						func(isValid);
					}
				}

				if (!isTitleValid($t)) isValid = false;
				if (!isDescriptionValid($t)) isValid = false;
				if (!isSourceUrlFormatValid($t)) isValid = false;
				if (!isTargetUrlFormatValid($t)) isValid = false;
				if (!isStatusValid($t)) { isValid = false; }
				else {
					if (!isPubDateTimeValid($t)) isValid = false;
				}

				if (!isValid) { _step = 0; updateDisplay(); return; }
				else {

					var sourceUrlComplete = false;
					var targetUrlComplete = false;
					var sourceValid = false;
					var targetValid = false;

					var complete = function () {
						if (sourceUrlComplete && targetUrlComplete) {
							handleNext(sourceValid && targetValid);
						}
					}

					// everything is valid up to this point - async callout to validate url
					var $sfield = $t.find('#sourceUrl');
					validateResourceExists($sfield, isValid, function (isValid) {
						sourceUrlComplete = true;
						sourceValid = isValid;
						complete();
					});

					var $tfield = $t.find('#targetUrl');
					validateUrlForType($tfield, isValid, "WebPage", function (isValid) {
						targetUrlComplete = true;
						targetValid = isValid;
						complete();
					});
				}

			}

			function validatePage2(next) {
				isValid = true;
				function handleNext(isValid) {
					if (!isValid) { _step = 1; updateDisplay(); return; }
					var func = next; if (typeof func === 'function') { func(isValid); }
				}

				var fp = $t.find(".txtFilePath").val().trim().length;
				var w = $t.find(".txtWidth").val();
				var h = $t.find(".txtHeight").val();
				var t = $t.find(".txtTitle").val().trim().length;

				// is valid if nothing is entered
				if (fp == 0 && (w === "" || eval(w) == 0) && (h === "" || eval(h) == 0) && t == 0) {
					handleNext(true);
					return;
				}

				// is valid if image is currently saved image
				var ai = {};
				$(_itm.alternateImages).each(function () {
					if (this.type.toUpperCase() === 'THUMBNAIL') {
						ai = this;
					}
				});
				if (!$.isEmptyObject(ai)) {
					if ($t.find('.feedItemThumb').attr('src') === ai.url) {
						handleNext(true);
						return;
					}
				}

				if (!isThumbPathValid($t)) isValid = false;
				if (!isThumbWidthValid($t)) isValid = false;
				if (!isThumbHeightValid($t)) isValid = false;
				if (!isThumbTitleValid($t)) isValid = false;

				handleNext(isValid);
			}

			function validatePage3(next) {
				isValid = true;
				function handleNext(isValid) {
					if (!isValid) { _step = 2; updateDisplay(); return; }
					var func = next; if (typeof func === 'function') { func(isValid); }
				}

				var t = $t.find("#imgTitle").val().trim().length;
				var d = $t.find("#imgDescription").val().trim().length;
				var s = $t.find("#imgSrc").val().trim().length;
				var l = $t.find("#imgLink").val().trim().length;

				if (t == 0 && d == 0 && s == 0 && l == 0) {
					handleNext(true);
					return;
				}

				if (!isImgTitleValid($t)) isValid = false;
				if (!isImgSrcUrlFormatValid($t)) isValid = false;
				if (!isImgLinkUrlFormatValid($t)) isValid = false;

				if (!isValid) { _step = 2; updateDisplay(); return; }
				else {

					var $field = $t.find('#imgSrc');
					validateUrlForType($field, isValid, "Image", function (isValid) {

						if (!isValid) { _step = 2; updateDisplay(); return; }

						var url = $t.find('#imgSrc').val();
						if (url.length > 0) {
							setDimensions($t, url, function (isValid) {

								if (!isValid) { _step = 2; updateDisplay(); return; }

								var $field = $t.find('#imgLink');
								validateUrlForType($field, isValid, "WebPage", function (isValid) {

									if (!isValid) { _step = 2; updateDisplay(); return; }

									handleNext(isValid);
								});

							});
						}
						else {
							$t.find('#width').val(0);
							$t.find('#height').val(0);
							handleNext(isValid);
						}

					});
				}
			}

			function validatePage4(next) {
				isValid = true;
				function handleNext(isValid) {
					if (!isValid) { _step = 3; updateDisplay(); return; }
					var func = next; if (typeof func === 'function') {
						func(isValid);
					}
				}

				if (!isTopicSelectionValid($t, _itm)) isValid = false;

				handleNext(isValid);
			}


			validatePage1(function () {
				validatePage2(function () {
					validatePage3(function () {
						validatePage4(function () {
							completeHandler();
							return false;
						});
					});
				});
			});
		}


		function handleTermSelection(termData) {
			var func = options.termSelectHandler;
			if (typeof func === 'function') {
				func(termData);
			}
		}


		main();

	};

})(jQuery);