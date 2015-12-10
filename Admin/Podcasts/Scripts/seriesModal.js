(function ($) {
	var PLUGIN_NAME = 'seriesModal';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults:
        {
        	media: {},
        	page: 1,
        	saveHandler: ''
        }
    };

	"use strict"; //ignore jslint

	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		function handleSave(oMedia) {
			var func = options.saveHandler; if (typeof func === 'function') {
				func(oMedia);
			}
		}

		var $t = options.target;
		var _m = options.media;
		var _step = eval(options.page);		
		var _type = "Podcast Series";

		function updateDisplay() {
			displayCurrentStep($t, 5, _step);
		}

		var main = function () {

			$t.empty();

			$t.load("Templates/seriesModal.htm", function () {

				if (_m.id) { $(".modal-title").text("Edit Podcast Series"); }
				else { $(".modal-title").text("Add Podcast Series"); }

				loadMediaData();
				setupEvents();
				updateDisplay();
			});

		};

		function loadMediaData() {

			$t.find("#proxyUrl").val(_m.sourceUrl);
			$t.find("#importUrl").val(_m.sourceUrl);

			loadContentGroupInfo(_m, $t);
			loadGeneralInfo(_m, $t);
			loadAltImageInfo(_m, $t);
			loadFeedThumbnailInfo(_m, $t);
			loadRelatedImageInfo(_m, $t);
			loadSourceInfo(_m, $t);

			if (_m.feed) {
				$t.find("#editorialManager").val(htmlDecode(_m.feed.editorialManager));
				$t.find("#webMasterEmail").val(_m.feed.webMasterEmail);
				$t.find("#copyright").val(htmlDecode(_m.feed.copyright));
			}
			$t.find("#author").val(htmlDecode(_m.author));
			$t.find("#omniture").val(htmlDecode(_m.omnitureChannel));

			loadTopicInfo(_m, $t);
		}

		function saveSeries() {
			_m.mediaType = _type;
			_m.mimeType = "text/xml";
			_m.encoding = "UTF-8";
			_m.children = [];

			getContentGroupInfo(_m, $t);
			getGeneralInfo(_m, $t);
			getRelatedImageInfo(_m, $t);

			_m.feed.copyright = replaceWordChars($t.find("#copyright").val());
			_m.author = replaceWordChars($t.find("#author").val());
			_m.feed.editorialManager = replaceWordChars($t.find("#editorialManager").val());
			_m.feed.webMasterEmail = $t.find("#webMasterEmail").val();
			_m.omnitureChannel = replaceWordChars($t.find("#omniture").val());

			getSourceInfo(_m, $t);
			getTopicInfo(_m, $t);

			var closeAndCompete = function (oMedia) {
				$t.find(".btn, .close").prop("disabled", false);
				$t.find('.close').click();
				$t.find('.modal-body').hideSpinner();
				handleSave(oMedia);
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
						if ($t.find("#cbxCopyThumb").is(':checked')) {
							var ai = getAltImgThumbnail(oMedia);
							if (ai) {
								// copy existing alt image thumbnail to feed image
								saveSeriesImageFromThumb(oMedia, ai.url);
							} else {
								closeAndCompete(oMedia);
							}

						} else {
							closeAndCompete(oMedia);
						}
					} else {
						CDC.Admin.Capture.saveAltImage($filePicker, filePath, oMedia.id, height, width, name, type, function (response) {

							if ($t.find("#cbxCopyThumb").is(':checked')) {
								// copy new thumbnail to alt image
								saveSeriesImageFromThumb(oMedia, APIRoot + "/adminapi/v1/resources/links/" + JSON.parse(response).results[0].storageId + ".png");
							}
							else {
								closeAndCompete(oMedia);
							}

						});

					}
				}
				else {
					closeAndCompete(oMedia);
				}

			};

			var onFailedSave = function (oMsg) {
				if (oMsg.length > 0) {

					var msgHandled = false;

					$(oMsg).each(function () {
						if ($(this)[0].userMessage == "Title already exists") {
							$t.find('#title').parents('.form-group').find('.validationMsg').show().text('This title is already being used by another feed.');
							_step = 1; updateDisplay(); msgHandled = true;
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

			function saveSeriesImageFromThumb(oMedia, imgSrc) {
				if (!oMedia.feed) { oMedia.feed = {}; }
				oMedia.feed.imageTitle = oMedia.title;
				oMedia.feed.imageDescription = oMedia.description;
				oMedia.feed.imageSource = imgSrc;
				oMedia.feed.imageWidth = "0";
				oMedia.feed.imageHeight = "0";
				oMedia.feed.imageLink = oMedia.sourceUrl;
				CDC.Admin.Capture.saveMediaData(oMedia, closeAndCompete, onFailedSave);
			}

			$t.find('.modal-body').showSpinner();

			CDC.Admin.Capture.saveMediaData(_m, onSuccessfulSave, onFailedSave);

		}

		function setupEvents() {

			if (!_m.id) { // if no id (new feed) then close and cancel should take use back to feed list
				$t.find('.close, #cancel, #createCancel').off().click(function () {
					document.location = urlRoot + "/Feeds/Feeds.htm";
					return false;
				})
			}

			$t.find('.validationMsg').hide();

			generalInfoEvents($t);
			relatedImageEvents($t);

			var setSourceFieldsRequired = function () {

				var c = $t.find("#copyright").val().trim().length;
				var e = $t.find("#editorialManager").val().trim().length;
				var w = $t.find("#webMasterEmail").val().trim().length;

				var $o = $t.find("#copyright, #editorialManager, #webMasterEmail");

				if (c > 0 || e > 0 || w > 0) {
					$o.parents('.form-group').find("label").addClass('required');
				}
				else {
					$o.parents('.form-group').find("label").removeClass('required');
				}

			};

			$t.find("#copyright, #editorialManager, #webMasterEmail").off().on(
				{
					keyup: setSourceFieldsRequired,
					blur: setSourceFieldsRequired
				}
			);
			setSourceFieldsRequired();

			$t.find("#prev").off().click(function () { _step -= 1; updateDisplay(); });
			$t.find("#next").off().click(function () { _step += 1; updateDisplay(); });

			$t.find("#saveSeries").off().click(function () {
				$t.find(".btn, .close").prop("disabled", true);

				validateFeed(function () {
					saveSeries();
				})

				return false;
			});

			$t.find("#clear").off().click(function () {

				generalInfoEvents($t)

				$t.find("input:visible, textarea:visible").not('input:radio').val("");
				$t.find("select:visible").prop('selectedIndex', 0);
				$t.find(".modalSelectedValues:visible .btn[termId]").click();

				return false;
			});

			// aggregate add line
			$t.find("#addAggSource").off().click(function () {
				var row = $t.find(".aggSourceRow").first().clone();
				row.find(".control-label").text("");
				row.find("#aggSource").val("");
				$t.find(".aggSourceBtnRow").before(row);

				applyAggSrcRowDelete();
			});

			function applyAggSrcRowDelete() {
				// aggregate delete line
				$t.find(".aggSourceDelete").off().click(function () {
					$(this).parents(".aggSourceRow").remove();

					if ($t.find(".aggSourceRow").length <= 1) {
						$t.find(".aggSourceDelete").hide();
					} else {
						$t.find(".aggSourceDelete").show();
					}
				});

				if ($t.find(".aggSourceRow").length <= 1) {
					$t.find(".aggSourceDelete").hide();
				} else {
					$t.find(".aggSourceDelete").show();
				}

			}

			applyAggSrcRowDelete();

		}

		//validation code
		function validateFeed(saveHandler) {

			function handleSave() {
				var func = saveHandler; if (typeof func === 'function') {
					func();
				}
			}

			var valid = true;
			$t.find('.validationMsg').hide();

			function validatePage0(next) {
				isValid = true;
				function handleNext(isValid) {
					if (!isValid) { _step = 0; updateDisplay(); return; }
					var func = next; if (typeof func === 'function') {
						func(isValid);
					}
				}
				
				if (_type == "Feed - Import") {
					if (!isImportUrlValid($t)) isValid = false;
				} else if (_type == "Feed - Proxy") {
					if (!isProxyUrlValid($t)) isValid = false;
				}
				//if (!isContentGroupSelectionValid($t)) isValid = false;
				
				handleNext(isValid);
			}

			function validatePage1(next) {
				isValid = true;
				function handleNext(isValid) {
					if (!isValid) { _step = 1; updateDisplay(); return; }
					var func = next; if (typeof func === 'function') {
						func(isValid);
					}
				}

				if (!isTitleValid($t)) isValid = false;
				if (!isDescriptionValid($t)) isValid = false;
				if (!isMoreInfoUrlFormatValid($t)) isValid = false;
				if (!isStatusValid($t)) { isValid = false; }
				else {
					if (!isPubDateTimeValid($t)) isValid = false;
				}

				if (!isValid) { _step = 1; updateDisplay(); return; }
				else {
					// everything is valid up to this point - async callout to validate targetUrl url
					var $field = $t.find('#targetUrl');
					validateUrlForType($field, isValid, "WebPage", handleNext)
				}

			}

			function validatePage2(next) {
				isValid = true;
				function handleNext(isValid) {
					if (!isValid) { _step = 2; updateDisplay(); return; }
					var func = next; if (typeof func === 'function') {
						func(isValid);
					}
				}
				if (!areSourceFieldsValid()) isValid = false;
				if (!isWebMasterEmailFormatValid()) isValid = false;
				if (!isOmnitureValid($t)) isValid = false;
				handleNext(isValid);
			}

			function validatePage3(next) {
				isValid = true;
				function handleNext(isValid) {
					if (!isValid) { _step = 3; updateDisplay(); return; }
					var func = next; if (typeof func === 'function') {
						func(isValid);
					}
				}

				if (!isTopicSelectionValid($t, _m)) isValid = false;

				handleNext(isValid);
			}

			function validatePage4(next) {
				isValid = true;
				function handleNext(isValid) {
					if (!isValid) { _step = 4; updateDisplay(); return; }
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
				var ai = getAltImgThumbnail(_m);
				if (ai) {
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

			function validatePage5(next) {
				isValid = true;
				function handleNext(isValid) {
					if (!isValid) { _step = 5; updateDisplay(); return; }
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

				if (!isValid) { _step = 5; updateDisplay(); return; }
				else {

					var $field = $t.find('#imgSrc');
					validateUrlForType($field, isValid, "Image", function (isValid) {

						if (!isValid) { _step = 5; updateDisplay(); return; }

						var url = $t.find('#imgSrc').val();
						if (url.length > 0) {
							setDimensions($t, url, function (isValid) {

								if (!isValid) { _step = 5; updateDisplay(); return; }

								var $field = $t.find('#imgLink');
								validateUrlForType($field, isValid, "WebPage", function (isValid) {

									if (!isValid) { _step = 5; updateDisplay(); return; }

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


			validatePage0(function () {
				validatePage1(function () {
					validatePage2(function () {
						validatePage3(function () {
							validatePage4(function () {
								validatePage5(function () {
									handleSave();
									return false;
								});
							});
						});
					});
				});
			});
		}

		// page 1 / general info




		// page 2 / author/copyright
		function isWebMasterEmailFormatValid() {
			var isValid = true;
			var $this = $t.find('#webMasterEmail');
			if ($.trim($this.val()).length && !isValidEmailFormat($this.val())) {
				$this.parents('.form-group').find('.validationMsg').show().text('Web Master Email is not in a valid email format.');
				isValid = false;
			}
			return isValid;
		}

		function areSourceFieldsValid() {
			var isValid = true;

			var c = $t.find("#copyright").val().trim().length;
			var e = $t.find("#editorialManager").val().trim().length;
			var w = $t.find("#webMasterEmail").val().trim().length;

			var $o = $t.find("#copyright, #editorialManager, #webMasterEmail");
			var msg = "Copyright, Editorial Manager and Web Master Email are all required if any of these fields are filled in."

			if (c > 0 || e > 0 || w > 0) {
				if (c == 0) { $t.find("#copyright").parents('.form-group').find('.validationMsg').show().text(msg); isValid = false; }
				if (e == 0) { $t.find("#editorialManager").parents('.form-group').find('.validationMsg').show().text(msg); isValid = false; }
				if (w == 0) { $t.find("#webMasterEmail").parents('.form-group').find('.validationMsg').show().text(msg); isValid = false; }
			}
			return isValid;
		}

		// page 4 / feed image

		main();

	};

})(jQuery);