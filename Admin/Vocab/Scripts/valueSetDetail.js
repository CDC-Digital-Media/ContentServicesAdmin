"use strict"; //ignore jslint

(function ($) {
    var PLUGIN_NAME = 'valueSetDetail';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = {
        defaults: {
            valueSet: '',
            returnClickHandler: ''
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        //local variables
        var selectedTermName = '';
        var selectedTerm = '';
        var $detailContent;

        // event handlers
        var termSelectHandler = function (term, relatedTermSelectHandler, updatehandler, hideHandler) {
            $('.detailContent').termDetail({
                valueSet: options.valueSet,
                term: term,
                relatedTermSelectHandler: relatedTermSelectHandler,
                updateHandler: updatehandler,
                hideHandler: hideHandler
            });
        };

        var handleReturnClick = function () {
            var func = options.returnClickHandler;
            if (typeof func === 'function') {
                func();
            }
        };
        // end event handlers


        var setupTrail = function (valueSet) {
            $('.trail').find('.crumb-valueSets').click(function () {
                handleReturnClick();
            });
            $('.trail').find('.crumb-valueSet').html(valueSet.name);
            $('.trail').show();
        };

        var showTreeView = function (data) {
            $('.trail').empty();
            $('.trail').load("Templates/CookieCrumb.htm", function () {
                setupTrail(options.valueSet);
            });
            

            var url = APIRoot + '/adminapi/v1/resources/valuesets.json/?id=' + options.valueSet.id + '&max=0&sort=ValueName';

            $('.detailContent').empty();
            $('.detailContent').showSpinner();
            $('.detailContent').valueTreeView({
                dataUrl: url,
                selectedTermName: selectedTermName,
                termSelectHandler: termSelectHandler,
                updateHandler: treeUpdatehandler,
                hideHandler: treeHideHandler
            });

            selectedTermName = '';

            $('.content').css('margin-bottom', '0px');
        };

        var showListView = function () {
            $('.trail').empty();
            $('.trail').load("Templates/CookieCrumb.htm", function () {
                setupTrail(options.valueSet);
            });
            $('.trail').show();

            $detailContent.valuesGrid(
                {
                    valueSet: options.valueSet,
                    termSelectHandler: termSelectHandler,
                    updateHandler: showListView,
                    hideHandler: ''
                }
            );

            $('.content').css('margin-bottom', '20px');
        };

        function main() {
            // little hacky 

            var $header = $('<h4 class="subHeader" id="valuesHeader">' + options.valueSet.name + '</h4>');
            options.target.append($header);

            var $small = $("<small>");

            if (options.valueSet.hierarchical) {
                var $ul = $("<ul class='nav nav-tabs'>");
                $ul.append("<li class='active'><a href='#' class='treeViewTab'>Tree View</a></li>");
                $ul.append("<li><a href='#' class='listViewTab'>List View</a></li>");
                $small.append($ul);
                options.target.append($small);

                $(".treeViewTab").click(function () {
                    $('.nav-tabs li.active').removeClass('active');
                    $(this).parent().addClass('active');
                    getDetailData(showTreeView);
                });
                $(".listViewTab").click(function () {
                    $('.nav-tabs li.active').removeClass('active');
                    $(this).parent().addClass('active');
                    showListView();
                });
            }            

            // container for content
            $detailContent = $("<div class='detailContent'>");
            options.target.append($detailContent);

            if (options.valueSet.hierarchical) {
                getDetailData(showTreeView);
            }
            else {
                getDetailData(showListView);
            }

        }

        var getDetailData = function (postProcess) {

            var url = APIRoot + '/adminapi/v1/resources/valuesets.json/?id=' + options.valueSet.id + '&max=0&sort=ValueName&callback=?';

            $.ajax({
                url: url,
                dataType: 'jsonp'
            })
            .done(function (response) {

                var data = doDataMapping(response.results);
                var func = postProcess;
                if (typeof func === 'function') {
                    func(data);
                }

            })
            .fail(function (xhr, ajaxOptions, thrownError) {
                alert(xhr.status);
                alert(thrownError);
            });

        };

        var treeUpdatehandler = function (oTerm) {
            selectedTermName = oTerm.valueName;
            getDetailData(showTreeView);
        };

        var treeHideHandler = function (target) {
            $('.detailContent').find('.btn-info').removeClass('btn-info');
        };

        var listUpdatehandler = function (oTerm) {
            selectedTerm = oTerm;
            showListView();
            selectedTerm = '';
        };

        main();

    };

})(jQuery);