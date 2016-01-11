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
        
        var $t = $(options.target);
        
        function main() {
            
            $t.empty();

            CDC.Admin.Lookup.getLanguages(function (results) {
            	buildLanguageList(results);
            });
            
        }

        function buildLanguageList(languages){
            $t.children().remove();
            if (options.defaultText !== "") {
                $t.append($("<option value = ''>" + options.defaultText + "</option>"));               
            }
                
            $(languages).each(function () {
                var selected = options.selectedValue === $(this)[0].name;
                var selectedText = selected ? "selected='" + selected + "'" : "";
                $t.append($("<option value='" + $(this)[0].name + "' " + selectedText + ">" + $(this)[0].name + "</option>"));
            });
        }

        this.setSelected = function(language) {
            $t.find("option").each(function() { this.selected = (this.text == language); });                  
        };

        main();

        return this;

    };
    
})(jQuery);