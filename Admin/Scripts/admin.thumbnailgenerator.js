"use strict"; //ignore jslint

(function ($) {
	var PLUGIN_NAME = 'thumbnailGen';
	// plugin signature ///////////////////////
	$[PLUGIN_NAME] = {
		defaults: {
			media: null,
			autoRun: true
		}
	};

	// main function //////////////////////////    
	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		var _staticThumbUrl = APIRoot + "/adminapi/v1/resources/media/" + options.media.id + "/thumbnail/?nochache=true";
		var _mtype = options.media.mediaType.toLowerCase();

		var $modal;

		//#region Default params

		var staticImageDefault = {
			pauselength: "1000",
			w: "700",
			h: "380",
			bw: "700",
			bh: "700",
			cw: "0",
			ch: "0",
			cx: "0",
			cy: "0"
		},
        buttonDefault = {
        	pauselength: "250",
        	w: "155",
        	h: "84",
        	bw: "450",
        	bh: "252",
        	cw: "0",
        	ch: "0",
        	cx: "0",
        	cy: "0"
        },
        eCardDefault = {
        	pauselength: "4000",
        	w: "155",
        	h: "84",
        	bw: "580",
        	bh: "400",
        	cw: "470",
        	ch: "266",
        	cx: "53",
        	cy: "75"
        },
        htmlDefault = {
        	pauselength: "2500",
        	w: "700",
        	h: "380",
        	bw: "700",
        	bh: "700",
        	cw: "0",
        	ch: "0",
        	cx: "0",
        	cy: "0"
        },
        pdfDefault = {
        	pauselength: "4000",
        	w: "155",
        	h: "84",
        	bw: "700",
        	bh: "400",
        	cw: "0",
        	ch: "0",
        	cx: "0",
        	cy: "0"
        },
        podcastSeriesDefault = {
        	pauselength: "250",
        	w: "155",
        	h: "84",
        	bw: "950",
        	bh: "600",
        	cw: "0",
        	ch: "0",
        	cx: "0",
        	cy: "0"
        },
        widgetDefault = {
        	pauselength: "5000",
        	w: "700",
        	h: "380",
        	bw: "700",
        	bh: "700",
        	cw: "0",
        	ch: "0",
        	cx: "0",
        	cy: "0"
        },
        videoDefault = {
        	pauselength: "4000",
        	w: "700",
        	h: "380",
        	bw: "700",
        	bh: "700",
        	cw: "0",
        	ch: "0",
        	cx: "0",
        	cy: "0"
        };

		//#endregion

		var defaults;
		switch (_mtype.toLowerCase()) {
			case 'image':
			case 'infographic':
			case 'badge':
			case 'button':
				defaults = staticImageDefault;
				break;
			case 'ecard':
				defaults = eCardDefault;
				break;
			case 'pdf':
				defaults = pdfDefault;
				break;
			case 'html':
				defaults = htmlDefault;
				break;
			case 'podcastseries':
				defaults = podcastSeriesDefault;
				break;
			case 'widget':
				defaults = widgetDefault;
				break;
			case 'video':
				defaults = videoDefault;
				break;
			case 'collection':
				defaults = htmlDefault; // temporary
				break;

		}

		var cropVals = { w: defaults.w, h: defaults.h, x: 0, x2: defaults.w, y: 0, y2: defaults.h };

		var $img;
		var previewSrc;
		var croppedImgSrc;
		var existingAltImgUrl = "";


		$(window).resize(function () {
			centerModal();
		});

		var self = this;

		var closeUp = function () {
			$modal.find('.actions').hide();
			$modal.modal({ show: false });
			$("body").removeClass("modal-open");
			$().hideSpinner();
		};

		function main() {

			if (defaults === undefined) { return; }
			$(options.target).empty();
			$(options.target).load(urlRoot + "/Templates/ThumbnailGenerator.htm", function () {

				$modal = $(options.target).find('.thumbnailModal');

				$modal.find('#preview').click(function () { thumbnailCallback(false); });
				$modal.find(".close").click(function () { closeUp(); });
				$modal.find("#uploadImage").click(function () {
					$modal.find("#srcImgContainer").hide();
					$modal.find(".uploadForm").show();
					$modal.find(".actions").hide();
					$modal.find(".modal-content").height(400);
				});
				$modal.find("#uploadCancel").click(function () {
					$modal.find("#srcImgContainer").show();
					$modal.find(".uploadForm").hide();
					$modal.find(".actions").show();
					$modal.find(".modal-content").height($modal.find("#srcImgContainer img").height() + 50);
				});

				$modal.find('.imgRow .btn-file :file').on('fileselect', function (event, numFiles, path) {

					// validate file extension
					var extension = path.split('.').pop().toUpperCase();
					if (extension != "PNG" && extension != "JPG" && extension != "GIF" && extension != "JPEG") {
						alert('Only *.png, *.gif and *.jpg files can be selected as a thumbnail.');
						return false;
					}

					$(this).parents('.imgRow').find('.txtFilePath').val(path);
				});

				$modal.find("#uploadSave").off().click(function () {
					if ($modal.find('.txtFilePath').val().trim() === "") {
						alert('Please choose a thumbnail image file before saving.')
					}
					else {

						var $showUploadImage = $modal.find('.showUploadImage');

						$showUploadImage.parent().showSpinner();

						var row = $modal.find('.imgRow');

						var $filePicker = row.find('.filePicker');
						var filePath = row.find('.txtFilePath').val();
						var height = 84;
						var width = 155;
						var name = 'StorefrontThumbnail';
						var type = 'StorefrontThumbnail';

						if (filePath !== '' && name !== '') {
							CDC.Admin.Capture.saveAltImage($filePicker, filePath, options.media.id, height, width, name, type, function () {
								CDC.Admin.Capture.loadAltImageData(options.media.id, function (altImages) {
									$(altImages).each(function () {
										if (this.type.toUpperCase() === 'STOREFRONTTHUMBNAIL') {

											existingAltImgUrl = this.url;

											$showUploadImage.parent().hideSpinner();
											$showUploadImage.attr('src', this.url).off().load(function () {
												if (Math.floor($(this).width()) !== 155 || Math.floor($(this).height()) !== 84) {
													$modal.find('.uploadSizeWarning').show();
												}
												else {
													$modal.find('.uploadSizeWarning').hide();
												}
												$(this).width(155).height(84).show();

												$modal.find('#existingAltImg').attr('src', existingAltImgUrl);
												$modal.find('#existingAltImgDiv').show();
												options.target.find(".thumbContainerDiv").empty().showSpinner();
												self.loadAnyAltImageThumb();
											});



										}
									});
								});
							});
						}

					}
				});

				/// this block loads the initial image.
				$(options.target).showSpinner();


				self.loadAnyAltImageThumb(function () {
					self.thumbNailExists(function (boolExists) {
						if (boolExists) {
							self.loadThumbnail(function () {
								options.target.hideSpinner();
								addEditLink();
							});
						}
						else {

							previewSrc = publicAPIRoot + '/v1/resources/media/' + options.media.id + '/thumbnail?webroot=' + publicWebRoot + '&w=155&h=84&bw=700&bh=400&cx=' + defaults.cx + '&cy=' + defaults.cy + '&cw=' + defaults.cw + '&ch=' + defaults.ch + '&pause=' + defaults.pauselength;

							self.createThumbnail(function (completed, apiURL) {
								if (completed) {
									self.loadThumbnail(function () {
										options.target.hideSpinner();
										addEditLink();
									});
								}
								else {
									options.target.find('.thumbContainerDiv').html("<i style='color:red; padding:10px; display:block;'>create operation did not complete: " + apiURL + "</i>");
									options.target.hideSpinner();
									addEditLink();
								}

							});
						}
					});
				});

				///////////////////////////////
			});

		}

		var thumbnailCallback = function (doSave) {

			previewSrc = publicAPIRoot + '/v1/resources/media/' + options.media.id + '/thumbnail?webroot=' + publicWebRoot + '&w=155&h=84&bw=' + defaults.bw + '&bh=' + defaults.bh + '&cx=' + cropVals.x + '&cy=' + cropVals.y + '&cw=' + (cropVals.x2 - cropVals.x) + '&ch=' + (cropVals.y2 - cropVals.y) + '&pause=' + defaults.pauselength;

			$modal.find('#previewImg').hide();
			$modal.find('#savethisthumb').hide();

			if ($modal.find(".progressIndicator").length == 0) {
				$modal.find('#previewImg').parent().showSpinner();
			}

			setTimeout(function () {
				$modal.find('#previewImg').attr('src', previewSrc + '&unq=' + getUniqueInt()).load(function () {
					$modal.find('#previewImg').show();
					$modal.find('#savethisthumb').show();
					$modal.hideSpinner();
				});
			}, 250);
		}

		var centerModal = function () {
			$modal.css({
				top: ($(window).height() - $modal.height()) / 2,
				left: ($(window).width() - $modal.width()) / 2,
				marginLeft: 0
			});
		};

		function getUniqueInt() {
			var d = new Date();
			var n = d.getMilliseconds();
			return n;
		}

		var addEditLink = function () {
			//modal launcher
			if (options.target.find('.launchModal').length === 0) {
				var $linkDiv = $("<div style='text-align:center;'>");
				var $launchLink = $("<a href='#' style='display:block;' class='launchModal'>Edit Thumbnail</a>");

				$launchLink.click(function () {

					//image WidthxHeight needs to equal browser WidthxHeight for croppable iamge to appear normal.
					var croppableImgSrc = publicAPIRoot + '/v1/resources/media/' + options.media.id + '/thumbnail?webroot=' + publicWebRoot + '&w=700&h=700&bw=700&bh=700&cx=' + defaults.cx + '&cy=' + defaults.cy + '&cw=' + defaults.cw + '&ch=' + defaults.ch + '&pause=' + defaults.pauselength;

					$modal.modal({ show: true });

					$modal.find(".uploadForm").hide();
					$modal.find('#srcImgContainer').show();

					$modal.find('.actions').hide();
					$modal.find('#srcImgContainer').empty();
					$modal.find('#srcImgContainer').showSpinner();

					if (existingAltImgUrl != '') {
						$modal.find('#existingAltImg').attr('src', existingAltImgUrl);
						$modal.find('#existingAltImgDiv').show();
					}
					else {
						$modal.find('#existingAltImg').attr('src', existingAltImgUrl);
						$modal.find('#existingAltImgDiv').hide();
					}

					var $croppablePreview = $('<img>');

					$croppablePreview.attr("src", croppableImgSrc + "&unq=" + getUniqueInt()).load(function () {
						$modal.find('#srcImgContainer').append($croppablePreview);
						$modal.find('#srcImgContainer').hideSpinner();
						$modal.find(".modal-content").height($croppablePreview.height() + 50);

						$croppablePreview.Jcrop({
							aspectRatio: 155 / 84,
							setSelect: [0, 0, 700, 400],
							onSelect: function (c) {
								cropVals.h = Math.floor(c.h);
								cropVals.w = Math.floor(c.w);
								cropVals.x = Math.floor(c.x);
								cropVals.x2 = Math.floor(c.x2);
								cropVals.y = Math.floor(c.y);
								cropVals.y2 = Math.floor(c.y2);
							}
						});

						$modal.find('.actions').show();
						$modal.find('#savethisthumb').hide();
					});

					$modal.find('#savethisthumb').unbind().click(function () {

						options.target.empty().showSpinner();

						self.createThumbnail(function (completed, apiURL) {
							if (completed) {
								self.loadThumbnail(function () {
									closeUp();
									main();
									options.target.hideSpinner();
								});
							}
							else {
								options.target.find('.thumbContainerDiv').html("<i style='color:red; padding:10px; display:block;'>create operation did not complete: " + apiURL + "</i>");
								closeUp();
								options.target.hideSpinner();
							}
						});



					});



					return false;
				});
				//$linkDiv.append($launchLink);
				//$(options.target).append($linkDiv);
			}
		};

		this.loadThumbnail = function (callback) {

			function handleCallback() {
				if (typeof callback === 'function') {
					callback();
				}
			}

			var $div = options.target.find('.thumbContainerDiv');
			// create container if we don't have it.
			if ($div.length === 0) {
				$div = $("<div style='text-align:center;' class='thumbContainerDiv'>");
				$(options.target).append($div);
			}

			if ($div.find('img').length === 0) {
				var $img = $("<img style='border:1px solid #ddd; width:155px; height:84px; clear:both;'>");
				$div.append($img);
				$img.hide();				

				$img.bind('error', function (e) {
					$div.find('img')
                      .css({ border: "1px solid #ddd", width: "155px", height: "84px", clear: "both" })
                      .show();
					handleCallback();
				});

				$img.attr('src', _staticThumbUrl + "&unq=" + getUniqueInt()).load(function () {
					$img.show();
					handleCallback();
				});
			}
			else {
				$div.find('img')
					.attr('src', src)
                    .css({ border: "1px solid #ddd", width: "155px", height: "84px", clear: "both" })
                    .show();
				handleCallback();
			}

		};

		this.createThumbnail = function (callback) {

			function handleCallback(completed, apiURL) {
				if (apiURL === undefined) {
					console.log(apiUrl);
					apiURL = $img.attr('src');
				}
				if (typeof callback === 'function') {
					callback(completed, apiURL);
				}
			}


			if (previewSrc === undefined) {
				previewSrc = publicAPIRoot + '/v1/resources/media/' + options.media.id + '/thumbnail?webroot=' + publicWebRoot + '&w=155&h=84&bw=' + defaults.bw + '&bh=' + defaults.bh + '&cx=' + cropVals.x + '&cy=' + cropVals.y + '&cw=' + (cropVals.x2 - cropVals.x) + '&ch=' + (cropVals.y2 - cropVals.y) + '&pause=' + defaults.pauselength;
			}


			$.ajax({
				type: "POST",
				url: "../Secure.aspx/SaveThumbnail",
				data: "{'data': '', 'apiURL': '" + previewSrc + "'}",
				contentType: "application/json; charset=utf-8",
				dataType: "json",
				success: function (response) {
					var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;

					if (obj.meta.status != 200 && obj.meta.message.length > 0) {
						options.target.append("<i style='color:red; padding:10px;'>" + obj.meta.message[0].userMessage + "</i>");
						handleCallback(false, previewSrc);
						return;
					}

					handleCallback(true, previewSrc);
				},
				error: function (xhr, ajaxOptions, thrownError) {
					console.debug(xhr.status);
					console.debug(thrownError);
					console.debug(xhr.responseText);
					options.target.append("<i style='color:red; padding:10px;'>Error code: '" + xhr.status + '\n\n' + thrownError + '\n\n' + xhr.responseText + "</i>");
					handleCallback(false, previewSrc);
				}
			});
		};

		this.loadAnyAltImageThumb = function (callback) {
			function handleCallback() {
				if (typeof callback === 'function') {
					callback();
				}
			}


			var altThumbUrl = "";
			$(options.media.alternateImages).each(function () {
				if (this.type.toUpperCase() === 'STOREFRONTTHUMBNAIL') {
					existingAltImgUrl = this.url;
				}
			});

			if (existingAltImgUrl == '') {
				handleCallback();
				return;
			}
			else {
				var $div = options.target.find('.thumbContainerDiv');
				// create container if we don't have it.
				if ($div.length === 0) {
					$div = $("<div style='text-align:center;' class='thumbContainerDiv'>");
					$(options.target).append($div);
				}

				var $altImgThmb = $("<img style='border:1px solid #ddd; width:155px; height:84px; clear:both;' src='" + existingAltImgUrl + "'>");
				$div.append($altImgThmb);
				options.target.hideSpinner();
				addEditLink();



			}


		}

		this.thumbNailExists = function (callback) {

			function handleCallback(boolExists) {
				if (typeof callback === 'function') {
					callback(boolExists);
				}
			}

			var $testImg = $("<img>");
			var found = false;

			$testImg.hide();
			$testImg.attr('src', _staticThumbUrl + "&unq=" + getUniqueInt()).load(function () {
				found = true;
				handleCallback(true);
			});

			setTimeout(function () {
				if (!found) {
					handleCallback($testImg[0].naturalHeight !== 0);
				}
			}, 5000);
		};


		if (options.autoRun) {
			main();
		}

		return this;

	};

})(jQuery);