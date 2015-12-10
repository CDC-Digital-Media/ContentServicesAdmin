"use strict"; //ignore jslint
(function ($) {
    var PLUGIN_NAME = "orgPicker";

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = {
        defaults : 
        {
            selectedValue : "",
            sourceCode : ""
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        function main() {
            
            $(options.target).empty();

            // used cached version if available.
            //if(!$.isEmptyObject(CDC.Admin.Global.cache.businessOrgs)){
            //    buildOrgList(CDC.Admin.Global.cache.businessOrgs);
            //    return;
            //}

            var url = APIRoot + "/adminapi/v1/resources/businessorgs?max=0&callback=?";
            console.log(url);                                                

            $.ajax({
                url : url,
                dataType : "jsonp"
            }).done(function (response) {

                //CDC.Admin.Global.cache.setBusinessOrgs(response.results);
                buildOrgList(response.results);                
                
            }).fail(function (xhr, ajaxOptions, thrownError) {
                console.debug(xhr.status);
                console.debug(thrownError);
                console.debug(xhr.responseText);
                $("#apiError").show();
            });
            
        }

        function buildOrgList(businessOrgData){

                // filter org data:
                var filteredData;
                if(options.sourceCode !== ''){
                    filteredData = $.grep(businessOrgData, function (item) {
                        return item.sourceCode == options.sourceCode && item.parentId !== null;
                    });
                }else{
                    filteredData = businessOrgData;
                }

                $(options.target).children().remove();
                //TODO: Make strings file
                $(options.target).append($("<option value = ''>Select One</option>"));        
                
                $(filteredData).each(function () {
                    $(options.target).append($("<option value='" + $(this)[0].id + "'>" + $(this)[0].name + "</option>"));
                });

                $(options.target).find("option").filter(function() {                    
                    return $(this).val() == options.selectedValue; 
                }).prop('selected', true);

				//adding this because in some cases dynamically populated select lists will not display options unless touched.
                $(options.target).focus().blur();

        } 

        main();


    };

})(jQuery);