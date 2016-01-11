(function ($) {
	var PLUGIN_NAME = 'topSyndicatedChart';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults: {
    		url: '',
    		postProcess: ''
    	}
    };

	// main funtion //////////////////////////
	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		var $t = options.target;
		var data;
		var newData;

		function main() {
			_getJsonP("https://.....[Data Server]...../resource/rppv-wbiv.json", doSomething);
		}

		var doSomething = function (response) {
			var items = response.clean({}).sort(compare);

			//urldata = items;

			urldata = $.grep(items, function (o, i) {
				return (o.content_source_urls == options.url);
			}).sort(compare);

			var views = $(urldata).map(function () { return eval(this.page_views); })

			var x = d3.scale.linear()
				.domain([0, d3.max(views)])
				.range([0, $t.parent().width()-100]);

			var chart = d3.select($t.selector);
			var bar = chart.selectAll("div");
			var barUpdate = bar.data(urldata);

			var row = barUpdate.enter().append("div");

			var week = row.append("div")
				.classed('lbl', true)
				.style("width", "80px")
				.text(function (d) {
					return new Date(d.date).toLocaleDateString();
				});

			var views = row.append("div")
				.classed('bar', true)
				.style("width", function (d) { return x(d.page_views) + "px"; })
				.text(function (d) {
					return d.page_views;
				});

			if (options.postProcess) {
				window.setTimeout(function () { options.postProcess(); }, 1000);
			}

		}

		function _getJsonP(url, callback) {
			function handleCallback(response) { var func = callback; if (typeof func === 'function') { func(response); } }
			$.ajax({
				url: url,
				dataType: 'json'
			}).done(function (response) {
				handleCallback(response);
			}).fail(function (xhr, ajaxOptions, thrownError) {
				console.debug(xhr.status);
				console.debug(xhr.responseText);
				console.debug(thrownError);
			});
		}


		Array.prototype.clean = function () {
			for (var i = 0; i < this.length; i++) {
				if (isEmpty(this[i])) {
					this.splice(i, 1);
					i--;
				}
			}
			return this;
		};

		function compare(a, b) {
			if (a.date > b.date)
				return -1;
			if (a.date < b.date)
				return 1;
			return 0;
		}

		function isEmpty(obj) {
			if (obj == null) return true;
			if (obj.length > 0) return false;
			if (obj.length === 0) return true;
			for (var key in obj) {
				if (hasOwnProperty.call(obj, key)) return false;
			}
			return true;
		}

		main();

		return this;

	};

})(jQuery);
