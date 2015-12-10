(function ($) {
	var PLUGIN_NAME = 'altImageBlock';

	// plugin signature ///////////////////////
	$[PLUGIN_NAME] =
    {
    	defaults: {
    		media: {}
    	}
    };

	// main funtion //////////////////////////
	$.fn[PLUGIN_NAME] = function (options) {

		$[PLUGIN_NAME].defaults.target = this;
		options = $.extend({}, $[PLUGIN_NAME].defaults, options);

		// add fileselect event handler:
		$(document).on('change', '.btn-file :file', function () {
			var input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            path = input.val().replace(/\\/g, '/')//
			input.trigger('fileselect', [numFiles, path]);
		});

		var $target = options.target;
		var newMedia = $.isEmptyObject(options.media.id);
		var id = newMedia ? null : options.media.id;

		var _media;
		var self = this;

		/*
        store.name = name;
        store.height = height;
        store.width = width;
        store.data = ImageToByteArray(file);
        store.fileExtension = Path.GetExtension(file).Trim('.');
        store.mediaId = mediaid;
        */

		function main() {

			_media = options.media;

			$target.load("Templates/AltImageBlock.htm", function () {

				if (id) {
					$target.showSpinner();
					CDC.Admin.Capture.loadAltImageData(id, function (altImages) {
						loadGallery(altImages)
						$target.hideSpinner();
					});
				}

				$target.find('.txtWidth, .txtHeight').focus(function () {
					if ($(this).val() == 0) {
						$(this).val('');
					}
				}).blur(function () {
					if ($(this).val() == '') {
						$(this).val(0);
					}
				});

				$target.find('.imgRow .btn-file :file').on('fileselect', function (event, numFiles, path) {

					$row = $(this).parents('.imgRow');

					// validate file extension
					var extension = path.split('.').pop().toUpperCase();
					if (extension != "PNG" && extension != "JPG" && extension != "GIF" && extension != "JPEG") {
						alert('Only *.png, *.gif and *.jpg files can be selected as an alternate image.');
						return false;
					}

					if (path !== '') {
						CDC.Admin.Capture.testAltImage($row.find('.filePicker'), path, function (response) {
							$row.find('.txtFilePath').val(path);
							var r = $.parseJSON(response);
							$row.find(".txtWidth").val(r.width);
							$row.find(".txtHeight").val(r.height);
						});
					}

				});

				$target.find('.addAltImage').on('click', function () {

					if ($target.find('.txtFilePath').last().val().trim() === '' || $target.find('.txtType').last().val().trim() === '') {
						// empty row exists - don't add a new one.
						alert('Please use or complete existing empty row.')
						return;
					}

					var row = createNewRow();
					setupDelete();
				});

				setupDelete();

			});
		}

		function loadGallery(altImages) {
			$target.find('.gallery').empty();

			if ($(altImages).length > 0) {
				$(altImages).each(function () {
					var $div = $("<div class='form-group col-md-6'>")

					var $itm = $(this)[0];
					var $img = $("<img src='" + $itm.url + "?guid=" + $.guid++ + "' style='width:200px; border:1px solid #999999; float:left; margin:5px;'>")
					$div.append($img);

					var $name = $("<div class='altImgName'>" + $itm.type + ": " + $itm.name + "</div>")
					$div.append($name);
					var $dims = $("<div class='altImgDims'>w: " + $itm.width + "px h: " + $itm.height + "px</div>")
					$div.append($dims);

					var $deleteAltImage = $("<div style='position:absolute; bottom:0px; left:52%;'>" +
                        "<a id='" + $itm.id + "' href='javascript:void(0)' class='deleteAltImage_" + $itm.id + "' title='Remove this alternate image'>" +
                        "<span class='glyphicon glyphicon-remove' style='font-size:20px;'></span></a>" +
                        "</div>");
					$div.append($deleteAltImage);

					$target.find('.gallery').append($div);
				});

				// delete click events
				setupAltImageDelete();
			}
		}

		function setupAltImageDelete() {
			$target.find("a[class*='deleteAltImage_']").off().on('click', function () {
				$().showSpinner();

				var url = urlRoot + "/Secure.aspx/DeleteAlternateImage";
				var altId = $(this).attr('id');

				var data = JSON.stringify({ "id": altId });

				$.ajax({
					type: "POST",
					url: url,
					data: data,
					contentType: "application/json; charset=utf-8",
					dataType: "json",
					xhrFields: {
						withCredentials: true
					},
					success: function (response) {
						var obj = (typeof response.d) === 'string' ? eval('(' + response.d + ')') : response.d;
						if (obj.meta.status != 200) {
							alert('An error has occurred.');
						} else {
							$(".deleteAltImage_" + altId).parent().parent().remove();

							_media.alternateImages = $.grep(_media.alternateImages, function (obj) {
								return obj.id != altId;
							});

							updateMediaThumbnailDisplay(_media.alternateImages);

						}

						$().hideSpinner();
					}
				}).fail(function (xhr, ajaxOptions, thrownError) {
					alert(xhr.responseText);
					$().hideSpinner();
				});

				//end
			});
		}

		function createNewRow() {
			var row = $target.find('.imgRow').first().clone();
			row.find('.txtFilePath').val('');
			row.find('.txtFilePath').attr('guid', $.guid++);

			row.find('.txtWidth').val('0');
			row.find('.txtWidth').attr('guid', $.guid++);

			row.find('.txtHeight').val('0');
			row.find('.txtHeight').attr('guid', $.guid++);

			row.find('.txtType').val('');
			row.find('.txtType').attr('guid', $.guid++);

			row.find('.txtName').val('');
			row.find('.txtName').attr('guid', $.guid++);

			row.insertAfter($target.find('.imgRow').last());

			row.find('.btn-file :file').on('fileselect', function (event, numFiles, path) {

				$row = $(this).parents('.imgRow');

				// validate file extension
				var extension = path.split('.').pop().toUpperCase();
				if (extension != "PNG" && extension != "JPG" && extension != "JPEG") {
					alert('Only *.png and *.jpg files can be selected as an alternate image.');
					return false;
				}

				if (path !== '') {
					CDC.Admin.Capture.testAltImage($row.find('.filePicker'), path, function (response) {
						$row.find('.txtFilePath').val(path);
						var r = $.parseJSON(response);
						$row.find(".txtWidth").val(r.width);
						$row.find(".txtHeight").val(r.height);
					});
				}
			});

			return row;
		}

		var setupDelete = function () {
			$target.find('.removeImage').off().on('click', function () {
				$(this).parents('.imgRow').remove();

				setupDelete();
				return false;
			});

			if ($target.find('.imgRow').length === 1) {
				$target.find('.removeImage').hide();
			}
			else {
				$target.find('.removeImage').show();
			}
		}


		main();

		this.hide = function () { $(options.target).hide(); },
        this.show = function () { $(options.target).show(); },

        this.validate = function (returnResult) {

        	clearError($target.find('#altImageLabel'));

        	var isValid = true;
        	//mapValuesToMedia();

        	$target.find('.imgRow').each(function () {
        		var $row = $(this);

        		if ($row.find('.txtFilePath').val().trim() === '') {
        			$row.remove();
        		}

        		if ($row.find('.txtFilePath').val().trim() !== '' && $row.find('.txtName').val().trim() === '') {
        			showError($target.find('#altImgLabel'), 'Each Alternate Image must have a type that indicates its intended use.');
        			isValid = false;
        		}

        		var w = $row.find('.txtWidth').val();
        		var h = $row.find('.txtHeight').val();
        		if (!$.isNumeric(w) || !$.isNumeric(h)) {
        			showError($target.find('#altImgLabel'), 'All width and height values must be numeric.');
        			isValid = false;
        		}
        	})

        	$target.find('.txtFilePath').each(function () {
        		var $current = $(this);
        		$('.txtFilePath').each(function () {
        			if ($(this).val() == $current.val() && $(this).attr('guid') != $current.attr('guid')) {
        				showError($target.find('#altImgLabel'), 'File paths must be unique.');
        				$(this).focus()
        				isValid = false;
        			}
        		});
        	});

        	$target.find('.txtType').each(function () {
        		var $current = $(this);
        		$('.txtType').each(function () {
        			if ($(this).val() == $current.val() && $(this).attr('guid') != $current.attr('guid')) {
        				showError($target.find('#altImgLabel'), 'Alternate Image types must be unique.');
        				$(this).focus()
        				isValid = false;
        			}
        		});
        	});

        	returnResult(isValid);
        },

        this.save = function (media) {
        	_media = media;

        	var row = $target.find('.imgRow').first();

        	if (row.length > 0) {

        		var $filePicker = row.find('.filePicker');
        		var filePath = row.find('.txtFilePath').val();
        		var height = row.find('.txtHeight').val();
        		var width = row.find('.txtWidth').val();
        		var name = row.find('.txtName').val().split(' ').join('_');
        		var type = $('.txtType :selected').val();

        		if (filePath !== '' && name !== '') {
        			$().showSpinner();
        			CDC.Admin.Capture.saveAltImage($filePicker, filePath, media.id, height, width, name, type, function () {
        				row.remove();

						// update media object
        				CDC.Admin.Media.getMedia(media.id, function (response) {
        					media = response;
        					self.save(media)
        				})
        				
        			});
        		}
        	} else {
        		CDC.Admin.Capture.loadAltImageData(media.id, function (altImages) {
        			loadGallery(altImages);

        			updateMediaThumbnailDisplay(altImages);

        			$().hideSpinner();
        		});
        		main();
        	}
        }

		this.updateMediaObj = function (media) {
			_media = media;
			return _media;
		};

		function updateMediaThumbnailDisplay(altImages) {
			var found = false;
			if (!found) {
				$(altImages).each(function () {
					if (this.type.toUpperCase() === 'STOREFRONTTHUMBNAIL') {
						$("#sidebar .thumbnailPreview img").attr('src', this.url);
						found = true;
					}
				});
			}
			if (!found) {
				$(altImages).each(function () {
					if (this.type.toUpperCase() === 'THUMBNAIL') {
						$("#sidebar .thumbnailPreview img").attr('src', this.url);
						found = true;
					}
				});
			}
			if (!found) {
				$("#sidebar .thumbnailPreview img").attr('src', _media.thumbnailUrl);
			}
		}


		return this;


	};

})(jQuery);
