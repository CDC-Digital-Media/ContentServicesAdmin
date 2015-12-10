(function ($) {
	var PLUGIN_NAME = 'titleBlock';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults: {
    		media: {}
    	}
    };

	// main funtion //////////////////////////
	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		var $target = options.target;
		var newMedia = $.isEmptyObject(options.media.id);
		var id = newMedia ? null : options.media.id;

		var _media;

		function main() {
			_media = options.media;
			loadMediaData();
		}

		function loadMediaData() {
			//$target.empty();
			var headerText = '';
			if (document.location.toString().toLowerCase().indexOf('capture') > -1) {
				if (_media && _media.id) {
					headerText = 'Editing ' + _media.id + ': ' + _media.title;
				}
				else {
					headerText = 'Adding New Media';
				}

				if ($target.find("#sourceHeader").length > 0) {
					// reuse existing:
					$target.find("#sourceHeader").html(headerText);
				}
				else {
					// add new objects:                
					var $headerDiv = $('<h4 class="subHeader" id="sourceHeader" style="display:block;">' + headerText + '</h4>');
					$target.append($headerDiv);

					var $generalError = $('<div class="help-inline" id="generalErrorLabel" style="display:hidden;"></div>')
					$target.append($generalError);

				}
			}
		}

		main();

		this.hide = function () { $(options.target).hide(); },
        this.show = function () { $(options.target).show(); },

        this.showMessage = function (msgText, className) {
        	var $error = $target.find("#generalErrorLabel");
        	$error.empty();
        	$error.removeClass();
        	$error.addClass(className);
        	$error.show();
        	$error.html(msgText);
        	$('html, body').animate({
        		scrollTop: $error.offset().top - 100
        	}, 10);
        },

        this.hideMessage = function (msgText, className) {
        	$target.find("#generalErrorLabel").hide();
        },


        this.updateControl = function (media) {
        	_media = media;
        	loadMediaData();
        },

        this.updateMediaObj = function (media) {
        	_media = media;
        	return _media;
        };

		return this;


	};

})(jQuery);