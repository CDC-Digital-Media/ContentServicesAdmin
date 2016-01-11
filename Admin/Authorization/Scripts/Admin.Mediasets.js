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

			            $.ajax({
			                url: APIRoot + '/adminapi/v1/resources/mediasets'
                            , success: displayResponse  
			            }). error(function (xhr, ajaxOptions, thrownError) {
			                console.log(xhr.status);    
			                console.log(thrownError);
			                console.log(xhr.responseText);
			                $('#apiError').show();
                        });

				setEvents();
			});
                
		}

		function displayResponse(resp) {
		    console.log(resp);  
                //use response.d when/if it comes from an ASP.NET webmethod, otherwise, no d
		    var results = resp.results;
            var html = []
            resp.results.forEach(function (item) {
                console.log(item);
		        html.push('<tr>');
		        html.push('<td>' + item.name + '</td><td>&nbsp;</td>');
		        html.push('<td><select><option>Assigned Users</option></select></td>');
		        html.push('<td><a class="btn btn-primary btn-xs btnAssignUser">Assign User</a><div class="utilWrap" style="display:none;"></div></td>');
                html.push('</tr>');
		    });
            $("#mediaSetsBody").html(html.join(''));
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