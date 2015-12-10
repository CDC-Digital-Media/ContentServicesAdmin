"use strict";  //ignore jslint
(function ($) {
    var PLUGIN_NAME = "valuePicker";
    
    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = 
    {
        defaults : 
        {
            valueSetId: "",
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

            var url = APIRoot + '/adminapi/v1/resources/valuesets.json/?id=' + options.valueSetId;
            console.log(url);
                        
            $.ajax({
                url : url,
                dataType : "jsonp"
            }).done(function (response) {
                buildList(response.results);                

            }).fail(function (xhr, ajaxOptions, thrownError) {
                console.debug(xhr.status);
                console.debug(thrownError);
                console.debug(xhr.responseText);               
            });
            
        }

        function buildList(items){
            $(options.target).children().remove();
            if (options.defaultText !== "") {
                $(options.target).append($("<option value = ''>" + options.defaultText + "</option>"));               
            }
                
            $(items).each(function () {
                var selected = options.selectedValue === $(this)[0].name;
                var selectedText = selected ? "selected='" + selected + "'" : "";
                $(options.target).append($("<option value='" + $(this)[0].valueId + "' " + selectedText + ">" + $(this)[0].valueName + "</option>"));
            });
        }

        this.setSelected = function (itemName) {
            $(options.target).find("option").each(function () { this.selected = (this.text == itemName); });
        };

        return this;

    };
    
})(jQuery);