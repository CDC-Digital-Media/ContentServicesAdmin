"use strict"; //ignore jslint

(function ($) {
    var PLUGIN_NAME = 'valueTreeView';

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] = {
        defaults: {
            dataUrl: '',
            selectedTermName: '',
            termSelectHandler: '',
            updateHandler: '',
            hideHandler: '',
            resizeContainer: true,
            postProcess: ''
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        var _data;
        var _html;
        var $target = options.target;

        //var url = APIRoot + '/adminapi/v1/resources/valuesets.json/?id=' + options.valueSet.id + '&max=0&sort=ValueName';

        $.ajax({
            type: "POST",
            url: urlRoot + "/Secure.aspx/GetTopicList",
            data: "{'apiURL': '" + options.dataUrl + "'}",
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (response) {
                var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
                _data = obj.results;
                _html = obj.html;
                main();

            },
            error: function (xhr, ajaxOptions, thrownError) {
                console.debug(xhr.status);
                console.debug(thrownError);
                console.debug(xhr.responseText);
            }
        });


        function handleTermSelection(termData, detailTermSelectHander) {
            var func = options.termSelectHandler;
            if (typeof func === 'function') {
                func(termData, detailTermSelectHander, options.updateHandler, options.hideHandler);
            }
        }

        function handlePostProcess() {
            var func = options.postProcess;
            if (typeof func === 'function') {
                func(_data);
            }
        }

        var valueArray = []; // for typeahead functionality

        //main();

        // decode value names
        $(_data).map(function () {
            this.valueName = $('<div />').html(this.valueName).text();
        });

        function main() {
            $target.load("Templates/TreeView.htm", function () {

                if (options.resizeContainer) {
                    resizeTreeContainer();
                    $(window).resize(function () { resizeTreeContainer(); });
                }
                valueArray = $(_data).map(function () { return this.valueName; }).toArray();

                $target.find(".addValue").click(function () {
                    var termData = {
                        valueId: -1,
                        displayOrdinal: 0,
                        isActive: true,
                        relationships: []
                    };
                    handleTermSelection(termData, '');
                });


                setupTermSearch();

                buildListStructure();


                if (options.selectedTermName !== '') {
                    var termData = $.grep(_data, function (e, i) {
                        return e.valueName == options.selectedTermName;
                    })[0];

                    handleTermSelection(termData, '');
                    if (termData) { selectTerm(termData.valueId); }
                }

                handlePostProcess();

                applyWatermark();

            });
        }

        var resizeTreeContainer = function () {
            if ($target.find('.topicListContainer').length > 0) {
                $target.find('.topicListContainer').height($(window).height() - $target.find('.topicListContainer').position().top - 25);
            }
        };

        var setupTermSearch = function () {
            
            $target.find('.btnRemove')
                .click(function () { clearClick(); return false;})
                .hide();
            $target.find('.btnSearch')
                .click(function () { searchClick(); return false; });
            $target.find('.prevmatch').attr("disabled", "disabled");
            $target.find('.nextmatch').attr("disabled", "disabled");
            $target.find('.prevmatch').hide();
            $target.find('.nextmatch').hide();

            $target.find('.valueSearch').typeahead({
                source: valueArray,
                updater: function (term) {
                    var termTxt = $('<div/>').html(term).text();
                    $target.find('.valueSearch').focus();
                    searchTermSelected(term);
                    $target.find('.btnSearch').hide();
                    $target.find('.btnRemove').show();                    
                    return '';
                }
            });

            $target.find('.valueSearch').focus(function () {
                $target.find('.btnSearch').show();
                $target.find('.btnRemove').hide();
            });


        };

        var searchClick = function () {

            if ($target.find('.valueSearch').val() === '') { return false; }
            searchTermSelected($target.find('.valueSearch').val());
        };

        var clearClick = function () {

            $target.find('.btnSearch').show();
            $target.find('.btnRemove').hide();
            $target.find('.prevmatch').hide();
            $target.find('.nextmatch').hide();
            $target.find('.valueSearch').val('');
            $target.find('.prevmatch').attr("disabled", "disabled");
            $target.find('.nextmatch').attr("disabled", "disabled");
            $target.find('.topicListContainer').unhighlight();
        };

        var updateHandler = function (termName) {

        };

        var searchTermSelected = function (term) {

            $target.find('.topicListContainer').unhighlight();

            if (term === '') {
                $target.find('.prevmatch').hide();
                $target.find('.nextmatch').hide();
                return;
            }

            $target.find('.topicListContainer').highlight(term);

            var matchArray = [];
            matchArray = $target.find('.topicListContainer .highlight');

            if (matchArray.length > 1) {
                var matchIndex = 0;
                $target.find('.btnSearch').hide();
                $target.find('.btnRemove').show();
                $target.find('.prevmatch').show();
                $target.find('.nextmatch').show();

                scrollToMatch(matchIndex);

                if (matchArray.length > 1) {
                    $target.find('.prevmatch, .nextmatch').removeAttr("disabled");
                    $target.find('.prevmatch').unbind('click').click(function () {
                        matchIndex = matchIndex - 1 < 0 ? matchArray.length - 1 : matchIndex - 1;
                        scrollToMatch(matchIndex);
                        return false;
                    });
                    $target.find('.nextmatch').unbind('click').click(function () {
                        matchIndex = matchIndex + 1 > matchArray.length - 1 ? 0 : matchIndex + 1;
                        scrollToMatch(matchIndex);
                        return false;
                    });
                }
            }
            else if (matchArray.length == 1) {
                $target.find('.btnSearch').hide();
                $target.find('.btnRemove').show();
                $target.find('.nextmatch').hide();
                $target.find('.prevmatch').hide();
                scrollToMatch(0);

            }
            else {
                $target.find('.nextmatch').hide();
                $target.find('.prevmatch').hide();

            }

            function scrollToMatch(index) {

                $target.find('.highlight-selected').removeClass('highlight-selected');
                $(matchArray[index]).addClass('highlight-selected');

                var $targetTerm = $(matchArray[index]).parents('a');

                showIfHidden($targetTerm);

                $target.find('.topicListContainer').scrollTo($targetTerm, 200, { offset: -150 });
                $targetTerm[0].focus();

            }

        };

        var depth = 0;

        var buildListStructure = function () {
            var $ul = $target.find('.treeview-gray');

            $ul.parent().empty().html(_html).find("ul").first().addClass("treeview-gray");


            $target.find(".topicListContainer a").unbind('click').click(function () {

                var termId = eval($(this).attr("termid"));
                $target.find('.btn-info').removeClass('btn-info').addClass('btn-default');
                $(this).removeClass('btn-default').addClass('btn-info');
                var term = $.grep(_data, function (element, index) {
                    return element.valueId === termId;
                });
                handleTermSelection(term[0], selectTerm);
            });

            applyTreeView();

            $target.find(".treeview .btn").addClass("btn-xs");

        };

        function showIfHidden($target) {
            if (!$target.is(":visible")) {
                $target.parents().find(".expandable-hitarea").first().click();
            }
            if (!$target.is(":visible")) { showIfHidden($target); }
        }

        function selectTerm(termId) {
            var $targetTerm = $target.find("[termId = '" + termId + "' ]");

            $target.find('.treeview .btn').removeClass('btn-info').addClass('btn-default');
            $targetTerm.click();

            $targetTerm.each(function () {
                $(this).removeClass('btn-default').addClass('btn-info');
                showIfHidden($(this));
            });

            $('.topicListContainer').scrollTo($targetTerm[0], 200, { offset: -150 });
        }

        function applyTreeView() {
            $target.find(".treeview-gray").treeview({
                control: "#treecontrol",
                persist: "cookie",
                cookieId: "treeview-gray"
            });
        }
    };

})(jQuery);

