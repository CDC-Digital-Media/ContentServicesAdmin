(function ($) {
	var PLUGIN_NAME = 'exportModal';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults:
        {
        	media: {},
        	saveHandler: '',
			settingId: ''
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

		var $t = options.target;
		var _m = options.media

		var main = function () {

			$t.load("Templates/exportModal.htm", function () {

				loadExportData();
				setupEvents();

			});

		};

		function loadExportData() {

			if (_m.feed.exportSettings.length > 0 && options.settingId != '') {
				var setting = $.grep(_m.feed.exportSettings, function (itm) {
					return itm.feedExportId == options.settingId;
				})[0];

				$t.find("#filePath").val(setting.filePath);

				$t.find("#formatPicker").exportFormatPicker({
					selectedValue: setting.feedFormat,
					defaultText: "Choose a format"
				});

			}
			else {
				$t.find("#formatPicker").exportFormatPicker({					
					defaultText: "Choose a format"
				});
			}
		}

		function validateExport(handleValidation) {

			function validationHandler(isValid) {
				var func = handleValidation; if (typeof func === 'function') {
					func(isValid);
				}
			}

			$t.find('.validationMsg').hide(); // reset
			var isValid = true;

			if (!isFilePathValid($t)) isValid = false;
			if (!isExportFormatValid($t)) isValid = false;

			if (isValid) {
				validationHandler(true);
			}
			else {
				validationHandler(false);
			}

		}

		function saveExport() {

			// create new setting (or replacement for existing)
			var setting = {
				feedExportId: options.settingId != '' ? options.settingId : "0",
				filePath: $t.find("#filePath").val(),
				feedFormat: $t.find("#formatPicker").val()
			};
			
			// drop existing setting if we need to
			if (_m.feed.exportSettings.length > 0 && options.settingId != '') {
				_m.feed.exportSettings = $.grep(_m.feed.exportSettings, function (itm) {
					return itm.feedExportId != options.settingId;
				});
			}

			_m.feed.exportSettings.push(setting);

			var onSuccessfulSave = function (oMedia, runThumbnail) {
				$t.find(".btn, .close").prop("disabled", false);
				$t.find('.close').click();
				$t.find('.modal-body').hideSpinner();
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
				$t.find('.modal-body').hideSpinner();
				$t.find(".btn, .close").prop("disabled", false);
			};

			$t.find('.modal-body').showSpinner();

			validateExport(function (isValid) {
				if (isValid) {
					CDC.Admin.Capture.saveMediaData(_m, onSuccessfulSave, onFailedSave);
				} else {
					$t.find('.modal-body').hideSpinner();
				}
			});

		}

		function setupEvents() {

			$t.find('.validationMsg').hide();

			$t.find("#clear").off().click(function () {
				$t.find("#filePath").val('');
				return false;
			});

			$t.find("#saveExport").off().click(function () {			
				saveExport();

				return false;
			});
		}

		function isFilePathValid($t) {
			var isValid = true;
			var $this = $t.find('#filePath');
			if (!$.trim($this.val()).length) {
				$this.parents('.form-group').find('.validationMsg').show().text('File Path is a required field.');
				isValid = false;
			}
			return isValid;
		}

		function isExportFormatValid($t) {
			var isValid = true;
			var $this = $t.find('#formatPicker');
			if ($this.val() == "") {
				$this.parents('.form-group').find('.validationMsg').show().text('Export Format is a required field.');
				isValid = false;
			}
			return isValid;
		}


		main();

	};

})(jQuery);