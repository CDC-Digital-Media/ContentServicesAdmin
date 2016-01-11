"use strict"; //ignore jslint

(function ($) {
    var PLUGIN_NAME = "attributeTreePicker";

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults: {            
            attributeDisplayName: '',
            dataUrl: '',
            selectedValueData: [],
            assignAtRoot: true,
            termSelectHandler: '',
            media: {}
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

    	/*
		At this point, this is a big stinking mess of a mix of the more refined code in feeds and the original code here in media capture.
		Need to clean and refactor.
		*/

        var $t = options.target;
        var _m = options.media;
        var $attributeHeader;
        var $launchLink;
        var $tree;
        var selectedValueData = [];
        var topicCount = 0;

        main();

        $(window).resize(function() {
            centerModal();
        });


        function handleTermSelection(termData) {
        	var func = options.termSelectHandler;
        	if (typeof func === 'function') {
        		func(termData);
        	}
        }

        window.setInterval( function () {
        	topicCount = $('div.pillbox.modalSelectedValues ul.nav li').length;
        }, 300 );

        function setupHeader(displayName) {
            $t.find(".termName").html(displayName);

            $attributeHeader = $("<span style='display:inline-block; padding-right:50px;'></span>");
            $attributeHeader.html(displayName);
            $t.append($attributeHeader);

            $launchLink = $('<a data-toggle="modal" class="btn btn-default"></a>');
            $launchLink.html('<i class="glyphicon glyphicon-wrench"></i> Choose ' + displayName)
            $t.append($launchLink);

        }

        function main() {
                       
        	$t.load(urlRoot + "/Capture/Templates/modalTreePicker.htm", function () {
                $t.find(".hide").hide().removeClass('hide');
                
                setupHeader(options.attributeDisplayName);
               
                $launchLink.click(function() {

                    //hack - need a prelauch handler :( :( :( :( :( :( :( :( :( :( :( :(
                    if(options.target.selector.indexOf("topicContainer")>-1){ 
                        $("#topicContainerLabel").parent('div').removeClass('error');
                        $("#topicContainerLabel").empty().hide();
                    }
                    //:( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :( :(
                                        
                    $t.find('.treePickerModal').modal({show: false});
                    $t.find(".modalSelectedValues").find("ul").empty();

                    $t.find('.treeViewContainer').load(urlRoot + "/Capture/Templates/TreeView.htm", function () {                        
                        loadData();
                        $t.find('.treePickerModal').modal({show: true});
                        centerModal();
                        $('.topicListContainer').showSpinner({ location: 'prepend' });
                    });
                    return false;
                });

                var $pillbox = $("<div class='selectedValues'><ul class='nav'></ul></div>");
                $t.append($pillbox);

                //buildExistingPills
                $(options.selectedValueData).each(function() {
                    var termData = this;
                    var termName = $('<div/>').html(this.name).text();
                    var $pillLi = $("<li class='btn btn-gray btn-sm' termId='"+  termData.id +"'>" + termName + " <i class='glyphicon glyphicon-remove icon-white'></i></li>");
                                      
                    $pillLi.click(function() { 
                        var o = {valueId: termData.id, valueName: termData.name};                     
                        deselectMe(o);
                    }); 
                    $pillbox.find("ul").append($pillLi);

                    var values = [];
                    if ($t.data("values")) {
                        values = $t.data("values");
                    }
                    values.push(this.id);
                    $t.data("values", values);
                });

            });


        }

        function loadData() {            

            $.ajax({
                url: options.dataUrl,
                dataType: "jsonp"
            }).done(function (response) {

                // filter out inactive items:
                response.results = $.grep(response.results, function(value) {
                    return value.isActive;
                });

                // if assign at root is false, set root elements to inactive before display
                if (!options.assignAtRoot) {
                    $(response.results).each(function() {
                        var NTFound = false;      
                        NTFound = $.grep(this.relationships, function(e, i) {
                            return e.type=='NT';
                        }).length>0;
                        if (!NTFound) this.isActive = false;
                    });
                }

                $tree = $t.find('.treeViewContainer');
               
                $tree.valueTreeView({
                    dataUrl: options.dataUrl,
                    selectedtermname: "",
                    termSelectHandler: "",
                    updatehandler: "",
                    hidehandler: "",
                    resizeContainer: false,
                    postProcess: function (treeData) { setupTreeviewEvents(_m, $t, treeData, selectedValueData); }
                });

            }).fail(function (xhr, ajaxOptions, thrownError) {
                console.debug(xhr.status);
                console.debug(thrownError);
                console.debug(xhr.responseText);
                $("#apiError").show();
            });
        }

        var centerModal = function() {            
            var $modal = $t.find('.treePickerModal');
            var windowHeight = $(document).height();
            var windowWidth = $(document).width();

            $modal.css({
                top : 20,
                left : (windowWidth / 2) - ($modal.width() / 2)
            });
        };


        this.updateHeader = function (newValue) {
            $t.find(".termName").html(newValue);
            $attributeHeader.html(newValue);
            $launchLink.html('<i class="glyphicon glyphicon-wrench"></i> Choose ' + newValue);
        }

        return this;

    };

})(jQuery);