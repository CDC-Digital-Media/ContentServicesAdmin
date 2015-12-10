"use strict";  //ignore jslint
(function ($) {
    var PLUGIN_NAME = "valuesGrid";

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        defaults: {
            valueSet: '',
            termSelectHandler: '',
            updateHandler: '',
            hideHandler: '',
            callback: ''
        }
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);

        options.Url = APIRoot + '/adminapi/v1/resources/valuesets.json/?id=' + options.valueSet.id;

        function handleTermSelection(termData, detailTermSelectHander) {
            var term = {};
            if (termData != '') {
                // lets do a little data mapping since the grid term data and the treeview term data don't seem to match.
                // should run this down to the root problem, but not today!
                term = $.parseJSON(termData);
                term.valueName = term.name;
                term.isActive = term.active;
                term.valueId = term.id;
            }
            else {
                term.valueName = '';
                term.isActive = '';
                term.valueId = -1;
            }

            var func = options.termSelectHandler;
            if (typeof func === 'function') {
                func(term, detailTermSelectHander, options.updateHandler, options.hideHandler);
            }
        }

        function handleCallback() {
            if (typeof options.callback === 'function') {
                options.callback();
            }
        }

        var oTable;

        var _totalPages = 0;
        var _pageNum = 1;
        var _pageSize = 10;
        var _sortIndex = '';
        var _sortDirection = '';
        var _sortProperty = '';
        var _search = '';

        function refreshValueSetsTable() {
            $().showSpinner();
            $(options.target).empty();
            $(options.target).load("Templates/valuesGrid.htm", function () {
                buildValueSetsTable();
                setupNewValueEvent();
            });
        }


        function buildValueSetsTable() {

            var getSort = function () {
                if (_sortProperty === '') { return [[0, "desc"]]; }
                var strSort = _sortDirection === '-' ? "desc" : "asc";
                return [[_sortIndex, strSort]];
            };

            var getUrl = function () {

                var url = options.Url;

                //have we stored paging parameters?
                if (_ctx.Filter.PageData) {
                    _pageSize = _ctx.Filter.PageData._pageSize;
                    _pageNum = _ctx.Filter.PageData._pageNum;
                    _sortDirection = _ctx.Filter.PageData._sortDirection;
                    _sortProperty = _ctx.Filter.PageData._sortProperty;
                    _sortIndex = _ctx.Filter.PageData._sortIndex;
                    _ctx.setPageData(null);
                }


                if (_sortProperty !== '') {
                    url += "&sort=";
                    url += _sortDirection;
                    url += _sortProperty;
                }

                if (_search !== '') url += "&q=" + _search;

                url += "&max=" + _pageSize + "&pagenum=" + _pageNum;

                return url;
            };

            var processResponse = function (response) {

                //_ctx.setPageData(response.meta.pagination);

                $(".dataTables_paginate").hide();
                $(".pagination").pager({
                    count: response.meta.pagination.total,
                    displayCount: response.results.length,
                    totalPages: response.meta.pagination.totalPages,
                    currentPageNum: _pageNum,
                    pagingHandler: function (newPageNumber) {
                        _pageNum = newPageNumber;
                        refreshValueSetsTable();
                        return false;
                    }
                });

                var dtData = {
                    aaData: []
                };

                dtData.iTotalRecords = response.meta.pagination.total;
                dtData.iTotalDisplayRecords = response.meta.pagination.count;
                dtData.sEcho = response.meta.pagination.count;

                for (var i = 0; i < response.results.length; i++) {
                    var itm = response.results[i];

                    var jItm = {
                        id: itm.valueId,
                        name: itm.valueName,
                        description: itm.description,
                        active: itm.isActive,
                        ordinal: itm.displayOrdinal,
                        relationships: itm.relationships
                    };

                    dtData.aaData.push(jItm);
                }

                return dtData;
            };

            var bindDatatable = function () {

                oTable = $("#valuesGrid").dataTable({
                    "bServerSide": true,
                    "sAjaxSource": getUrl(),
                    "aaSorting": getSort(),
                    "fnInitComplete": function (oSettings, json) {
                        setupButtonEvents();
                        handleCallback();
                        $().hideSpinner();
                    },
                    "fnServerData": function (sSource, aoData, fnCallback, oSettings) {
                        oSettings.jqXHR = $.ajax({
                            'url': getUrl(),
                            'dataType': 'jsonp',
                            'data': ''
                        }).done(function (response) {
                            var tmpData = processResponse(response);
                            if (response.meta.pagination.count == 0) {
                                $("#valuesGrid").replaceWith("<div style='clear:both; font-style:italic; border-top:1px solid black; border-bottom:1px solid black; padding:10px; margin:15px 0 15px 0;'>No results we found matching your search criteria.</div>");
                            }
                            else {
                                fnCallback(tmpData);
                            }
                            $().hideSpinner();
                        }).fail(function (xhr, ajaxOptions, thrownError) {
                            alert("error");
                        });
                    },
                    "aoColumns": [
                            { "mDataProp": "id" },
                            { "mDataProp": "name" },
                            { "mDataProp": "description" },
                            { "mDataProp": "active" },
                            { "mDataProp": "ordinal" },
                            { "mDataProp": "id" }
                    ],
                    "aoColumnDefs": [
                         {
                             "mRender": function (data, type, row) {
                                 var $out = $("<div>");
                                 var $a;
                                 $a = $("<a class='btn btn-small btn-primary btnEdit span1' mediaId='" + row.valueId + "' data='" + JSON.stringify(row) + "' style='color: white;' href='#'>Edit</a>");
                                 $out.append($a);
                                 return $out.html();
                             },
                             "aTargets": [5]
                         }                        
                    ]
                });

                $("[name='valuesGrid_length']")
                    .unbind()
                    .val(_pageSize)
                    .change(function () {
                        _pageNum = 1;
                        _pageSize = $(this).val();
                        refreshValueSetsTable();
                    });

                $("#valuesGrid th").unbind('click.DT');
                $("#valuesGrid th").not(".sorting_disabled").click(function () {
                    _pageNum = 1;
                    if ($(this).hasClass('sorting_asc') || $(this).hasClass('sorting_desc')) {
                        _sortDirection = $(this).hasClass('sorting_desc') ? '' : '-';
                    }
                    else {
                        _sortDirection = '';
                    }
                    _sortProperty = $(this).attr('sort');
                    _sortIndex = $('#valuesGrid th').filter(
                        function () {
                            return $(this).attr('sort') == _sortProperty;
                        }).index();
                    refreshValueSetsTable();
                });


                $("#valuesGrid_info").hide();
                $("#valuesGrid_filter").hide();


            };

            bindDatatable();
        }

        var setupNewValueEvent = function () {
            $("#newValue").click(function () {
                handleTermSelection('','')
                return false;
            });
        }

        var setupButtonEvents = function () {
            $("#valuesGrid .btnEdit").click(function () {
                _ctx.setPageData({
                    "_pageSize": _pageSize,
                    "_pageNum": _pageNum,
                    "_sortDirection": _sortDirection,
                    "_sortProperty": _sortProperty,
                    "_sortIndex": _sortIndex
                });

                var valueSetData = $(this).attr('data');
                handleTermSelection(valueSetData, '');
                return false;
            });

            $("#valuesGrid .btnDetail").click(function () {
                var valueSetData = $(this).attr('data');
                showDetail(valueSetData);
                return false;
            });

            $("#valuesGrid .btnAdd").click(function () {
                var mediaId = $(this).attr('mediaId');
                var btn = $(this);
                $().showSpinner();
                CDC.Admin.Collection.addMedia(_ctx.SelectedCollection.Id, mediaId, function () { swapToRemove(btn); $().hideSpinner(); });
                return false;
            });

            $("#valuesGrid .btnRemove").click(function () {
                var mediaId = $(this).attr('mediaId');
                var btn = $(this);
                $().showSpinner();
                CDC.Admin.Collection.removeMedia(_ctx.SelectedCollection.Id, mediaId, function () { swapToAdd(btn); $().hideSpinner(); });
                return false;
            });
        };

        this.refresh = function (aValues) {
            refreshValueSetsTable();
        };

        var swapToAdd = function (btn) {
            var mediaId = $(btn).attr("mediaId");
            var $a = $('<a class="btn btn-small btn-primary btnAdd span1" mediaId="' + mediaId + '" style="color: white;" href="#" onclick="CDC.Admin.Collection.addMedia(' + _ctx.SelectedCollection.Id + ', ' + mediaId + ', swapToRemove(this));"><i class="glyphicon glyphicon-plus"></i> Add</a>');
            $(btn).parent().empty().append($a);
        };

        var swapToRemove = function (btn) {
            var mediaId = $(btn).attr("mediaId");
            var $a = $('<a class="btn btn-small btn-warning btnRemove span1" mediaId="' + mediaId + '" style="color: white;" href="#" onclick="CDC.Admin.Collection.removeMedia(' + _ctx.SelectedCollection.Id + ', ' + mediaId + ', swapToAdd(this));">Remove</a>');
            $(btn).parent().empty().append($a);
        };

        refreshValueSetsTable();

        return this;

    };

})(jQuery);