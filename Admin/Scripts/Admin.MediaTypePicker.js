"use strict"; //ignore jslint
(function ($) {
    var PLUGIN_NAME = "mediaTypePicker";
    
    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = 
    {
        defaults : 
        {
        	selectedValue: "",
        	postProcess: ""
        }
    };
    
    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {
        
        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);
        
        main();
        
        function main() {
            
        	function handlePostProcess() {
        		var func = options.postProcess;
        		if (typeof func === 'function') {
        			func();
        		}
        	}

            $(options.target).empty();


            // used cached version if available.
            if(!$.isEmptyObject(CDC.Admin.Global.cache.mediaTypes)){
                buildmediaTypeList(CDC.Admin.Global.cache.mediaTypes);
                return;
            }

            var url = APIRoot + "/adminapi/v1/resources/mediatypes?callback=?";
            console.log(url);
            
            $.ajax({
                url : url,
                dataType : "json"
            }).done(function (response) {
            
                CDC.Admin.Global.cache.setMediaTypes(response.results);
                buildmediaTypeList(response.results);
                
            }).fail(function(xhr, ajaxOptions, thrownError) {
                console.debug(xhr.status);
                console.debug(thrownError);
                console.debug(xhr.responseText);
                $("#apiError").show();
            });
            

            function buildmediaTypeList(mediaTypes){
                $(options.target).children().remove();
                $(options.target).append($("<option value = ''>All Media</option>"));
                
                $(mediaTypes).each(function () {
                    var selected = options.selectedValue === $(this)[0].name;
                    var selectedText = selected ? "selected='" + selected + "'" : "";
                    if ($(this)[0].displayOrdinal !== 0) {
                        $(options.target).append($("<option value='" + $(this)[0].name + "' " + selectedText + ">" + $(this)[0].description + "</option>"));
                    }
                });

                handlePostProcess();
            }

        }

        this.setSelected = function(mediaType) {
            $(options.target).find("option").each(function() { this.selected = (this.text == mediaType); });                  
        };

        return this;

    };
    
})(jQuery);