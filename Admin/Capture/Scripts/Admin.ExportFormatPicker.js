"use strict";  //ignore jslint
(function ($) {
	var PLUGIN_NAME = "exportFormatPicker";

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults:
        {
        	selectedValue: "",
        	defaultText: ""
        }
    };

	// main funtion //////////////////////////
	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		main();

		function main() {

			$(options.target).empty();

			//https://.....[devReportingApplicationServer2]...../adminapi/v1/resources/feedformats
			var url = APIRoot + "/adminapi/v1/resources/feedformats.json?callback=?";
			console.log(url);

			$.ajax({
				url: url,
				dataType: "jsonp"
			}).done(function (response) {

				buildFormatList(response.results);

			}).fail(function (xhr, ajaxOptions, thrownError) {
				console.debug(xhr.status);
				console.debug(thrownError);
				console.debug(xhr.responseText);
				$("#apiError").show();
			});

		}

		function buildFormatList(formats) {
			$(options.target).children().remove();
			if (options.defaultText !== "") {
				$(options.target).append($("<option value = ''>" + options.defaultText + "</option>"));
			}

			$(formats).each(function () {
				var selected = options.selectedValue === $(this)[0].name;
				var selectedText = selected ? "selected='" + selected + "'" : "";
				$(options.target).append($("<option value='" + $(this)[0].name + "' " + selectedText + ">" + $(this)[0].name + "</option>"));
			});
		}

		this.setSelected = function (format) {
			$(options.target).find("option").each(function () { this.selected = (this.text == format); });
		};

		return this;

	};

})(jQuery);
