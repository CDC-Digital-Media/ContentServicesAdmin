"use strict";  //ignore jslint
(function ($) {
    var PLUGIN_NAME = "feedItemGrid";

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        media: '',
        defaults: {}
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);


        /////////////////////////////////////

        var oTable;

        var _totalPages = 0;
        var _pageNum = 1;
        var _pageSize = 10;
        var _sortIndex = '';
        var _sortDirection = '';
        var _sortProperty = '';
        var _search = '';

        var _media = options.media;

        var _childItemIds = [];
        _childItemIds = $.map(_media.childRelationships, function (child) {
            return child.relatedMediaId;
        });


        function handleShowForm() {
            var func = options.showForm;
            if (typeof func === 'function') {
                func();
            }
        }

        function refreshMediaTable() {

            if (!_media.id) { return; }

            $(options.target).empty();
            $(options.target).addClass('dataTable');
            $(options.target).load("Templates/FeedItemGrid.htm", function () {

                $("#childItems").find("#chooseItem").click(function () {
                    _ctx.setSelectedFeed(_media.id, _media.title);
                    document.location = urlRoot + "/Search/FilterMedia.htm";
                });

                $("#childItems").find("#newItem").click(function () {
                    handleShowForm();
                    return false;
                });

                buildFeedItemTable();
            });
        }


        function buildFeedItemTable() {

            var processResponse = function (response) {

                if ($.isEmptyObject(response.results)) { return; }

                $(".dataTables_paginate").hide();

                var dtData = {
                    aaData: []
                };

                dtData.iTotalRecords = response.results.childCount;
                dtData.iTotalDisplayRecords = response.results.childCount;
                dtData.sEcho = response.results.childCount;

                var ordinalInfo = response.results[0].childRelationships

                for (var i = 0; i < response.results[0].children.length; i++) {
                    var itm = response.results[0].children[i];

                    var myOrdinal = $.grep(ordinalInfo, function (element, index) {
                        return element.relatedMediaId == itm.id;
                    })[0].displayOrdinal;

                    var jItm = {
                        mediaOrdinal: myOrdinal,
                        mediaId: itm.id,
                        mediaType: itm.mediaType,
                        title: itm.title,
                        sourceUrl: itm.sourceUrl,
                        status: itm.status
                    };

                    dtData.aaData.push(jItm);
                }

                return dtData;
            };

            var getUrl = function () {
                return APIRoot + "/adminApi/v1/resources/media/" + _media.id + "/?showchildlevel=2";
            };

            var bindDatatable = function () {

                oTable = $(options.target).find("#childItemGrid").dataTable({
                    "bServerSide": true,
                    "sAjaxSource": getUrl(),
                    "aaSorting": "",
                    "fnInitComplete": function (oSettings, json) {
                        setupButtonEvents();
                    },
                    "fnServerData": function (sSource, aoData, fnCallback, oSettings) {
                        oSettings.jqXHR = $.ajax({
                            'url': getUrl(),
                            'dataType': 'jsonp',
                            'data': ''
                        }).done(function (response) {
                            var tmpData = processResponse(response);
                            if (tmpData) { fnCallback(tmpData); }
                        }).fail(function (xhr, ajaxOptions, thrownError) {
                            alert("error");
                        });
                    },
                    "aoColumns": [
                            { "mDataProp": "mediaId" },
                            { "mDataProp": "mediaType" },
                            { "mDataProp": "title" },
                            { "mDataProp": "sourceUrl" },
                            { "mDataProp": "status" },
                            { "mDataProp": "mediaId" }
                    ],
                    "aoColumnDefs": [
                        {
                            "mRender": function (data, type, row) {
                                var out = "";
                                if (data) {
                                    out = "<a href='#' onclick='javascript:showPopUp(\"" + data + "\"); return false;'>" + data.replace(/\//g, "&#8203;/") + "</a>";
                                }
                                return out;
                            },
                            "aTargets": [3]
                        },
                        {
                            "mRender": function (data, type, row) {//
                                var $out = $("<div>");
                                var $a = $('<a class="btn btn-small btn-danger btnRemove span1" mediaId="' + row.mediaId + '" style="color: white;" href="#">Remove</a>');
                                $out.append($a);
                                return $out.html();
                            },
                            "aTargets": [5]
                        },

                        { 'bSortable': false, 'aTargets': [0, 1, 2, 3, 4, 5] }

                    ]
                });

                $("[id$='_length']").hide();
                $("[id$='_filter']").hide();
                $("[id$='_info']").hide();

            };

            bindDatatable();

        }

        var setupButtonEvents = function () {
            $("#childItems .btnRemove").click(function () {
                var mediaId = $(this).attr('mediaId');
                $(this).parents('tr').remove();

                // _childItemIds get passed to search page to show what's already been selected. Must update with deletions
                // to keep everything in sync between collection child item page and search page.
                _childItemIds = jQuery.grep(_childItemIds, function (value) {
                    return value != mediaId;
                });


                runSaveOperation();

                return false;
            });

        };

        refreshMediaTable();
        //////////////////////////////////

        var runSaveOperation = function () {
            $().showSpinner();

            CDC.Admin.Collection.saveRelationships(_media.id, getOrderedRelationshipArray(), function () {
                $().hideSpinner();

                //stripe
                $(options.target).find('table tbody tr').css("background-color", "#e2e4ff");
                $(options.target).find('table tbody tr:odd').css("background-color", "#ffffff");
            });
        }

        var getOrderedRelationshipArray = function () {
            var intOrd = 0;
            var aRelationships = [];
            $('.txtOrd').each(function () {
                intOrd += 1;
                $(this).val(intOrd);

                //collect new ordinal values
                aRelationships.push({
                    relatedMediaId: $(this).attr('mediaId'),
                    displayOrdinal: intOrd
                });
            })

            return aRelationships;
        }

        this.hide = function () { $(options.target).hide(); },
        this.show = function () { $(options.target).show(); },
        this.updateControl = function () {
            refreshMediaTable();
        },

        this.updateMediaObj = function (media) {
            _media = media;
            return _media;
        };

        return this;

    };

})(jQuery); /* File Created: March 11, 2014 */