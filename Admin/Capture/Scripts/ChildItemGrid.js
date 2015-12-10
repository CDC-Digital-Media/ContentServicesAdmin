"use strict";  //ignore jslint
(function ($) {
    var PLUGIN_NAME = "childItemGrid";

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        media: '',
        defaults: {},
		onSortChange: ''
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);


        var handleSortChange = function (oMedia) {
        	var func = options.onSortChange; if (typeof func === 'function') {
        		func(oMedia);
        	}
        };

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

        function refreshMediaTable() {

            if (!_media.id) { return; }

            $(options.target).empty();
            $(options.target).addClass('dataTable');
            $(options.target).load("Templates/ChildItemGrid.htm", function () {

                $("#childItems").find("#addItems").click(function () {
                    _ctx.setSelectedCollection(_media.id, _media.title, _childItemIds);
                    document.location = urlRoot + "/Search/FilterMedia.htm";
                });

                buildChildItemTable();
            });
        }


        function buildChildItemTable() {

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
                        setupOrdinalEvents();
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
                            { "mDataProp": "mediaOrdinal" },
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
                                var out = "<input type='text' size='4' maxlength='3' class='txtOrd' value='" + row.mediaOrdinal + "' mediaId='" + row.mediaId + "' ordinal='" + row.mediaOrdinal + "'>";
                                return out;
                            },
                            "aTargets": [0]
                        },
                        {
                        	"mRender": function (data, type, row) {
                        		var $out = $("<div>");                        		
                        		var $a = $('<a class="aEdit span1" mediaId="' + row.mediaId + '" mediaType="' + row.mediaType + '" href="#">'+ row.title +'</a>');
                        		$out.append($a);
                        		return $out.html();
                        	},
                        	"aTargets": [3]
                        },
                        {
                            "mRender": function (data, type, row) {
                                var out = "";
                                if (data) {
                                    out = "<a href='#' onclick='javascript:showPopUp(\"" + data + "\"); return false;'>" + data.replace(/\//g, "&#8203;/") + "</a>";
                                }
                                return out;
                            },
                            "aTargets": [4]
                        },
                        {
                            "mRender": function (data, type, row) {//
                                var $out = $("<div>");
                                var $a = $('<a class="btn btn-small btn-danger btnRemove span1" mediaId="' + row.mediaId + '" style="color: white;" href="#">Remove</a>');
                                $out.append($a);
                                return $out.html();
                            },
                            "aTargets": [6]
                        },

                        { 'bSortable': false, 'aTargets': [0, 1, 2, 3, 4, 5, 6] }

                    ]
                });

                $("[id$='_length']").hide();
                $("[id$='_filter']").hide();
                $("[id$='_info']").hide();

            };

            bindDatatable();

            // ok! lets apply the drag and drop functionality:

            // here's the bit that's needed to keep column widths (since we're applying drag and drop to a table rather than a list of items)
            var fixHelper = function (e, ui) {
                ui.children().each(function () {
                    $(this).width($(this).width());
                });
                return ui;
            };


            $(options.target).find('table tbody').sortable({
                helper: fixHelper,
                placeholder: "dragAndDrop-highlight",
                cancel: "a,input",
                cursor: "move",
                opacity: 0.5,
                deactivate: function (event, ui) {

                    runSaveOperation();

                }
            }).disableSelection();

        }

        var setupButtonEvents = function () {

        	$("#childItems .aEdit").click(function () {
        		var mediaId = $(this).attr('mediaId');
        		var mediaType = $(this).attr('mediaType');
        		editMedia(mediaId, mediaType.toLowerCase());
        		return false;
        	});

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

        var setupOrdinalEvents = function () {
            $('.txtOrd').on("blur", function () {

                var isValid = true;
                var newOrdinalValue = $(this).val();
                var oldOrdinalValue = $(this).attr('ordinal');

                var row = $(this).parents("tr:first");
                var rows = $(this).parents("table:first").find('tbody tr');

                if (!$.isNumeric(newOrdinalValue)) {
                    $(this).val(oldOrdinalValue);
                    isValid = false;
                }
                // if new value in tbx did not pass validation it was returned to its original value 
                // - stop operation as we don't want to call an unnecessary postback.
                if (!isValid) { return false; }

                // if there was no change in list 
                if (newOrdinalValue == oldOrdinalValue) { return false;}


                // otherwise:
                // check value for max/min violations, adjust accordingly, ie. 999 goes to end of list, 0 goes to start
                newOrdinalValue = eval(newOrdinalValue);
                var min = 1;
                var max = rows.length;

                if (newOrdinalValue < min) newOrdinalValue = 1;
                if (newOrdinalValue > max) newOrdinalValue = max;

                if (newOrdinalValue == 1) {
                    row.insertBefore(rows[0]);
                }
                else if (newOrdinalValue == max) {
                    row.insertAfter(rows[newOrdinalValue - 1]);
                }
                else {
                    row.insertBefore(rows[newOrdinalValue - 1]);
                }

                runSaveOperation();

            });
        }

        refreshMediaTable();
        //////////////////////////////////

        var runSaveOperation = function () {
            $().showSpinner();

            CDC.Admin.Collection.saveRelationships(_media.id, getOrderedRelationshipArray(), function (oMedia) {
                $().hideSpinner();

                //stripe
                $(options.target).find('table tbody tr').css("background-color", "#e2e4ff");
                $(options.target).find('table tbody tr:odd').css("background-color", "#ffffff");


                handleSortChange(oMedia);

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