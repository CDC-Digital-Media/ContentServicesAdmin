"use strict";  //ignore jslint
(function ($) {
    var PLUGIN_NAME = "valueSetsGrid";

    // plugin signature ///////////////////////
    $[PLUGIN_NAME] =
    {
        url: '',
        defaults: {},
        onEdit: '',
        onNew: '',
        onDetail: '',
        callback: ''
    };

    // main funtion //////////////////////////
    $.fn[PLUGIN_NAME] = function (options) {

        $[PLUGIN_NAME].defaults.target = this;
        options = $.extend({}, $[PLUGIN_NAME].defaults, options);


        function handleCallback() {
            if (typeof options.callback === 'function') {
                options.callback();
            }
        }

        function handleEdit(valueSet) {
            var func = options.onEdit;
            if (typeof func === 'function') {
                func(valueSet);
            }
        }

        function handleNew() {
            var func = options.onNew;
            if (typeof func === 'function') {
                func();
            }
        }

        function showDetail(valueSet) {
            var func = options.onDetail;
            if (typeof func === 'function') {
                func(valueSet);
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
            $(".trail").hide();
            $(options.target).empty();
            $(options.target).load("Templates/valueSetsGrid.htm", function () {
                buildValueSetsTable();
                setupNewValueSetEvent();
            });
        }


        function buildValueSetsTable() {

            var getSort = function () {
                if (_sortProperty === '') { return [[0, "asc"]]; }
                var strSort = _sortDirection === '-' ? "desc" : "asc";
                return [[_sortIndex, strSort]];
            };

            var url;

            var getUrl = function () {

                if (url) { return url; }
                url = options.url;

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
                        id: itm.id,
                        name: htmlEncode(itm.name),
                        description: htmlEncode(itm.description),
                        language: htmlEncode(itm.languageCode),
                        active: itm.isActive,
                        orderable: itm.isOrderable,
                        defaultable: itm.isDefaultable,
                        hierarchical: itm.isHierachical
                    };

                    dtData.aaData.push(jItm);
                }

                return dtData;
            };

            var bindDatatable = function () {

                oTable = $("#valueSetsGrid").dataTable({
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
                                $("#valueSetsGrid").replaceWith("<div style='clear:both; font-style:italic; border-top:1px solid black; border-bottom:1px solid black; padding:10px; margin:15px 0 15px 0;'>No results we found matching your search criteria.</div>");
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
							{ "mDataProp": "language" },
                            { "mDataProp": "active" },
                            { "mDataProp": "orderable" },
                            { "mDataProp": "defaultable" },
                            { "mDataProp": "hierarchical" },
                            { "mDataProp": "id" },
                            { "mDataProp": "id" }
                    ],
                    "aoColumnDefs": [
                         {
                             "mRender": function (data, type, row) {
                                 var $out = $("<div>");
                                 var $a;
                                 $a = $("<a class='btn btn-small btn-default btnDetail span1' mediaId='" + row.id + "' data='"+ JSON.stringify(row) +"' href='#'>Manage Values</a>");
                                 $out.append($a);
                                 return $out.html();
                             },
                             "aTargets": [8]
                         },
                         {
                             "mRender": function (data, type, row) {
                                 var $out = $("<div>");
                                 var $a;
                                 $a = $("<a class='btn btn-small btn-primary btnEdit span1' mediaId='" + row.id + "' data='" + JSON.stringify(row) + "' style='color: white;' href='#'>Edit Defintion</a>");
                                 $out.append($a);
                                 return $out.html();
                             },
                             "aTargets": [9]
                         },

                        { 'bSortable': false, 'aTargets': [5, 6, 7, 8, 9] }
                    ]
                });

                $("[name='valueSetsGrid_length']")
                    .unbind()
                    .val(_pageSize)
                    .change(function () {
                        _pageNum = 1;
                        _pageSize = $(this).val();
                        refreshValueSetsTable();
                    });

                $("#valueSetsGrid th").unbind('click.DT');
                $("#valueSetsGrid th").not(".sorting_disabled").click(function () {
                    _pageNum = 1;
                    if ($(this).hasClass('sorting_asc') || $(this).hasClass('sorting_desc')) {
                        _sortDirection = $(this).hasClass('sorting_desc') ? '' : '-';
                    }
                    else {
                        _sortDirection = '';
                    }
                    _sortProperty = $(this).attr('sort');
                    _sortIndex = $('#valueSetsGrid th').filter(
                        function () {
                            return $(this).attr('sort') == _sortProperty;
                        }).index();
                    refreshValueSetsTable();
                });


                $(".pagination").css("height", "18px");
                $("#valueSetsGrid_info").hide();
                $("#valueSetsGrid_filter").hide();


            };

            bindDatatable();
        }

        var setupNewValueSetEvent = function(){
            $("#newValueSet").click(function () {
                handleNew();
                return false;
            });
        }

        var setupButtonEvents = function () {
            $("#valueSetsGrid .btnEdit").click(function () {
                _ctx.setPageData({
                    "_pageSize": _pageSize,
                    "_pageNum": _pageNum,
                    "_sortDirection": _sortDirection,
                    "_sortProperty": _sortProperty,
                    "_sortIndex": _sortIndex
                });

                var valueSetData = $(this).attr('data');
                var valueSet = $.parseJSON(valueSetData)
                handleEdit(valueSet);
                return false;
            });

            $("#valueSetsGrid .btnDetail").click(function () {
                var valueSetData = $(this).attr('data');
                var valueSet = $.parseJSON(valueSetData)
                showDetail(valueSet);
                return false;
            });

            $("#valueSetsGrid .btnAdd").click(function () {
                var mediaId = $(this).attr('mediaId');
                var btn = $(this);
                $().showSpinner();
                CDC.Admin.Collection.addMedia(_ctx.SelectedCollection.Id, mediaId, function () { swapToRemove(btn); $().hideSpinner(); });
                return false;
            });

            $("#valueSetsGrid .btnRemove").click(function () {
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

        refreshValueSetsTable();

        return this;

    };

})(jQuery);