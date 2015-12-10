"use strict";  //ignore jslint
(function ($) {
    var PLUGIN_NAME = "topicPicker";
    
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
        
        _m = options.media;
        $t = $(options.target);

        function main() {
            
            var url = APIRoot + "/adminapi/v1/resources/values?max=0&valueset=topics&language=english";
            console.log(url);
            
            var selectMe = function (value, v1, v2, v3) {
                $("#selectedTopics").find("ul").append("<li>" + value.valueName + "</li>");
                var values = [];
                if ($("#selectedTopics").data("values")) {
                    values = $("#selectedTopics").data("values");
                }
                $( "#selectedTopics" ).data( "values", values );
                values.push( value.valueId );
            };
            
            $.ajax({
                url : url,
                dataType : "jsonp"
            }).done(function (response) {
                
                 $(options.target).valueTreeView({
                    data : response.results,
                    selectedtermname : "",
                    termSelectHandler : selectMe,
                    updatehandler : "",
                    hidehandler : "",
                    resizeContainer: false,
                    postProcess: setupTreeviewEvents
                });
                
            }).fail(function (xhr, ajaxOptions, thrownError) {
                console.debug(xhr.status);
                console.debug(thrownError);
                console.debug(xhr.responseText);
                $("#apiError").show();
            });
            
            
        }

        var setupTreeviewEvents = function (treeData) {
        	// clear existing bindings
        	$tree.find("li > a.btn").unbind("click");

        	// flag selected and deal with pills.
        	if (_m.tags) {
        		$(_m.tags.topic).each(function () {
        			selectedValueData.push({
        				id: this.id,
        				name: this.name
        			});
        			// select in tree
        			var termId = this.id;
        			var $aTerm = $tree.find("[termId = '" + termId + "' ]");
        			$aTerm.addClass('btn-info').removeClass('btn-default');
        			// create pill
        			var termData = $.grep(treeData, function (e, i) {
        				return e.valueId === termId;
        			})[0];
        			if (termData !== undefined) {
        				var $pillLi = $("<li class='btn btn-gray btn-sm' termId='" + termData.valueId + "'>" + termData.valueName + " <i class='glyphicon glyphicon-remove icon-white'></i></li>");
        				$t.find(".modalSelectedValues").find("ul").append($pillLi);
        				$pillLi.click(function () {
        					$tree.find("[termId = '" + termId + "' ]").removeClass('btn-info').addClass('btn-default');
        					deselectMe(termData);
        				});
        			}
        		});
        		if ($t.find(".modalSelectedValues").find("ul li").length === 0) {
        			$t.find(".modalSelectedValues").find("span").show();
        		}
        	}
        	else {
        		$t.find(".modalSelectedValues").find("span").show();
        	}

        	// add add/remove handlers to tree items
        	$tree.find(".treeRootNode>.btn").addClass("inactive").click(function () { alert('Topics cannot be assigned at the root level. Please narrow your selection to a child item.'); });

        	$tree.find(".topicListContainer .btn").not(".treeRootNode>.btn").click(function () {
        		if ($(this).parents().hasClass('inactive')) {
        			alert('This topic is inactive and cannot be assigned.');
        			return false;
        		}
        		// add back in these tree handlers for any button click event:
        		$tree.find('.topicListContainer').unhighlight();
        		$t.find('.btnSearch').show();
        		$t.find('.btnRemove').hide();
        		var termId = $(this).attr("termId");
        		var termData = $.grep(treeData, function (e, i) {
        			return e.valueId === eval(termId);
        		})[0];
        		if ($(this).hasClass('btn-info')) {
        			$tree.find("[termId = '" + termId + "' ]").removeClass('btn-info').addClass('btn-default');
        			deselectMe(termData);
        		} else {
        			$tree.find("[termId = '" + termId + "' ]").not(".inactive").addClass('btn-info').removeClass('btn-default');
        			selectMe(termData);
        		}
        		if (topicCount > 15) {
        			$('#tooManyTopics').show();
        			return;
        		}
        		if (topicCount <= 15) {
        			$('#tooManyTopics').hide();
        		}
        	});
        	// hide spinner
        	$('.topicListContainer').hideSpinner();
        };
        var selectMe = function (termData) {
        	if (termData === undefined) {
        		return;
        	}
        	var termName = $('<div/>').html(termData.valueName).text();
        	var $pillLi = $("<li class='btn btn-gray btn-sm' termId='" + termData.valueId + "'>" + termName + " <i class='glyphicon glyphicon-remove icon-white'></i></li>");
        	$pillLi.click(function () {
        		deselectMe(termData);
        	});
        	$t.find(".selectedValues, .modalSelectedValues").find("ul").append($pillLi);
        	var o = {
        		id: termData.valueId,
        		name: termData.valueName
        	};
        	selectedValueData.push(o);
        	var values = [];
        	values = $.map(selectedValueData, function (value) {
        		return value.id;
        	});
        	$t.find(".modalSelectedValues").find("ul").show();
        	$t.find(".modalSelectedValues").find("span").hide();
        	topicCount++;
        	$t.data("values", jQuery.unique(values));
        };
        var deselectMe = function (termData) {
        	$t.find(".selectedValues, .modalSelectedValues").find('[termId="' + htmlDecode(termData.valueId) + '"]').remove();
        	$t.find('.treeViewContainer').find("[termId = '" + termData.valueId + "' ]").removeClass('btn-info').addClass('btn-default');
        	var values = [];
        	selectedValueData = $.grep(selectedValueData, function (value) {
        		return value.id !== termData.valueId;
        	});
        	values = $.map(selectedValueData, function (value) {
        		return value.id;
        	});
        	if (values.length === 0) {
        		$t.find(".modalSelectedValues").find("ul").hide();
        		$t.find(".modalSelectedValues").find("span").show();
        	}
        	topicCount--;
        	$t.data("values", jQuery.unique(values));
        };

        main();

    };
    
})(jQuery);