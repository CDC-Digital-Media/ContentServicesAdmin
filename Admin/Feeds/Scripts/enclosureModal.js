(function ($) {
	var PLUGIN_NAME = 'enclosureModal';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults:
        {
        	feed: {},
        	feedItem: {},
        	enclosure: {},
        	saveHandler: ''
        }
    };

	"use strict"; //ignore jslint

	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		function handleSave(media) {
			var func = options.saveHandler; if (typeof func === 'function') {
				func(media);
			}
		}

		var $target = options.target;
		var _itm = options.feedItem;
		var _f = options.feed

		var main = function () {

			$target.load("Templates/enclosureModal.htm", function () {

				loadMediaData();
				setupEvents();

				$target.find("#saveEnclosure").prop("disabled", true);

			});

		};

		function loadMediaData() {
			if (!$.isEmptyObject(options.enclosure)) {				
				$target.find("#sourceUrl").val(options.enclosure.resourceUrl);
				$target.find("#contentType").val(options.enclosure.contentType);
				$target.find("#contentLength").val(options.enclosure.size);
			}
		}

		function saveEnclosure() {

			var onSuccessfulSave = function (oMedia, runThumbnail) {
				$target.find(".btn, .close").prop("disabled", false);
				$target.find('.close').click();
				$target.find('.modal-body').hideSpinner();
				handleSave(oMedia);
			};

			var onFailedSave = function (oMsg) {
				if (oMsg.length > 0) {

					var msgHandled = false;

					$(oMsg).each(function () {

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
				$target.find('.modal-body').hideSpinner();
				$target.find(".btn, .close").prop("disabled", false);
			};

			$target.find('.modal-body').showSpinner();

			var enclosure = {};

			//drop any existing record for this resource
			var encs;
			if (!$.isEmptyObject(options.enclosure)) {
				encs = $.grep(_itm.enclosures, function (e) {
					return e.id != options.enclosure.id;
				});
			} else {
				encs = _itm.enclosures;
			}

			enclosure.resourceUrl = $target.find("#sourceUrl").val().trim();
			enclosure.contentType = $target.find("#contentType").val();
			enclosure.size = $target.find("#contentLength").val()

			encs.push(enclosure);

			_itm.enclosures = encs;

			//parent info			
			_itm.parentRelationships = [{ relatedMediaId: _f.id }];


			CDC.Admin.Capture.saveMediaData(_itm, onSuccessfulSave, onFailedSave)

		}

		function setupEvents() {

			$target.find('.validationMsg').hide();

			$target.find("#clear").off().click(function () {
				$target.find("input:visible, textarea:visible").val("");
				$target.find("select:visible").prop('selectedIndex', 0);				
				return false;
			});

			$target.find("#btnValidate").click(function () {
				validateEnclosure()
				return false;
			});

			$target.find("#saveEnclosure").off().click(function () {
				$target.find(".btn, .close").prop("disabled", true);

				validateEnclosure(function (isValid) {
					if (isValid) { saveEnclosure() };
				})

				return false;
			});

		}

		function validateEnclosure(handleValidation) {

			$target.find("#sourceUrl").val($target.find("#sourceUrl").val().trim());

			function validationHandler(isValid) {
				var func = handleValidation; if (typeof func === 'function') {
					func(isValid);
				}
			}

			$target.find('.validationMsg').hide(); // reset
			var isValid = true;

			if (!isResourceUrlFormatValid($target)) isValid = false;
			if (!isEnclosureExtensionValid($target)) isValid = false;

			if (isValid) {
				var $field = $target.find("#sourceUrl");
				validateResourceExists($field, isValid, function (isValid, contentType, contentLength) {
					if (isValid) {

						contentLength = contentLength <= 0 ? 0 : contentLength;

						$target.find("#contentType").val(contentType);
						$target.find("#contentLength").val(contentLength);
						$target.find("#saveEnclosure").prop("disabled", false);
						$target.find("#fileIcon").removeClass().addClass("fa " + getIconClass($field.val()));

					}
					else {
						$target.find("#contentType").val("");
						$target.find("#contentLength").val("");
						$target.find("#saveEnclosure").prop("disabled", true);
						$target.find("#fileIcon").removeClass().addClass("fa fa-file");
					}

				});

				validationHandler(true);
			}
			else {
				validationHandler(false);
			}

			$target.find("#saveEnclosure").prop("disabled", false);
		}

		main();

	};

})(jQuery);