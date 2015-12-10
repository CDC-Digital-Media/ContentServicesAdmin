"use strict"; //ignore jslint

(function ($) {
	var PLUGIN_NAME = 'bymediasets';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] = {
		defaults: {}
	};

	// main funtion //////////////////////////
	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		main();

		function main() {
			$(options.target).load('Templates/mediaSets.htm', function () {
				// do stuff

				setEvents();
			});

		}


		function setEvents() {

			$(options.target.selector + ' .btnAddMediaSet').on('click', function () {
				$('.newUserContainer').load("Templates/newMediaSet.htm", function (data) {
					$('.newUserContainer').slideDown();

					$('#cancelNewCollection').on('click', function (e) {
						e.preventDefault();
						$('.newUserContainer').hide();
					});
				});
			});

			

		}

	};

})(jQuery);