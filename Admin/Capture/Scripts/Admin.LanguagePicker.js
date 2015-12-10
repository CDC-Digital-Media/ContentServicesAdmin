"use strict";  //ignore jslint
(function ($) {
    var PLUGIN_NAME = "languagePicker";
    
    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = 
    {
        defaults : 
        {
            selectedValue : "",
            defaultText : ""
        }
    };
    
    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {
        
        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);
        
        main();
        
        function main() {
            
            $(options.target).empty();

            CDC.Admin.Lookup.GetLanguages(function (results) {            	
            	buildLanguageList(results);
            });
            
        }

        function buildLanguageList(languages){
            $(options.target).children().remove();
            if (options.defaultText !== "") {
                $(options.target).append($("<option value = ''>" + options.defaultText + "</option>"));               
            }
                
            $(languages).each(function () {
                var selected = options.selectedValue === $(this)[0].name;
                var selectedText = selected ? "selected='" + selected + "'" : "";
                $(options.target).append($("<option value='" + $(this)[0].name + "' " + selectedText + ">" + $(this)[0].name + "</option>"));
            });
        }

        this.setSelected = function(language) {
            $(options.target).find("option").each(function() { this.selected = (this.text == language); });                  
        };

        return this;

    };
    
})(jQuery);