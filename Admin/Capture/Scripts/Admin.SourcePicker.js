"use strict"; //ignore jslint
(function ($) {
    var PLUGIN_NAME = "sourcePicker";

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = {
        defaults: {
            selectedValue : "Centers for Disease Control and Prevention",
            defaultText : "",
            owningOrgSelector: "#owningOrg", 
            maintainingOrgSelector: "#maintainingOrg",
            selectedOwningOrg : "",
            selectedMaintainingOrg : ""
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        function main() {

            $(options.target).empty();


            var url = APIRoot + "/adminapi/v1/resources/sources?max=0&callback=?";
            console.log(url);
                        
            $.ajax({
                url : url,
                dataType : "jsonp"
            }).done(function (response) {
                         
                buildSourceList(response.results);
                
            }).fail(function (xhr, ajaxOptions, thrownError) {
                console.debug(xhr.status);
                console.debug(thrownError);
                console.debug(xhr.responseText);
                $("#apiError").show();
            });

            
        }

        function buildSourceList(sources){

                $(options.target).children().remove();
                if (options.defaultText !== "") {
                	$(options.target).append($("<option value = ''>" + options.defaultText + "</option>"));
                }
                
                $(sources).each(function () {
                    var selected = options.selectedValue === $(this)[0].name;
                    var selectedText = selected ? "selected='" + selected + "'" : "";
                    $(options.target).append($("<option " + selectedText + ">" + $(this)[0].name + "</option>"));
                    setTimeout(function () {
                    	$(options.target).mouseover();
                    }, 100);
                });

                $(options.owningOrgSelector).orgPicker({sourceCode : options.selectedValue, selectedValue: options.selectedOwningOrg });
                $(options.maintainingOrgSelector).orgPicker({sourceCode : options.selectedValue, selectedValue: options.selectedMaintainingOrg });

                options.target.change(function () {
                    var source = $(this).val();
                    $(options.owningOrgSelector).orgPicker({ sourceCode: source });
                    $(options.maintainingOrgSelector).orgPicker({ sourceCode: source });
                });

        		//adding this because in some cases dynamically populated select lists will not display options unless touched.
                $(options.target).focus().blur();

        }

        main();

        this.clearSelected = function() {
            $(options.target).find("option").each(function() { this.selected = (this.text == options.defaultText); });                    
            $(options.owningOrgSelector).orgPicker({}); 
            $(options.maintainingOrgSelector).orgPicker({});                
        };

        return this;

    };

})(jQuery);