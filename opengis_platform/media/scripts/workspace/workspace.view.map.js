function initializeMapPanel(preloaded_layers) {
	return {
		id: 'workspace-map-panel',
		xtype:'openlayers_mappanel',
		region:'center',
		preloaded_layers: preloaded_layers,
		tbar: [
		/* VIEW MODE */
		{
			text: 'View All',
			cls: 'view-mode',
			handler: function(b, e) {
			}
		},{
			text: 'Zoom In',
			cls: 'view-mode',
			handler: function(b, e) {
			}
		},
		/* POINT TOOLBARS */
		{
			id: 'mappanel-add-point-button',
			text: 'Add New Point',
			cls: 'edit-point-mode',
			hidden: true,
			enableToggle: true,
			handler: function(b, e) {
				var mapPanel = Ext.getCmp('workspace-map-panel');
				var layer = mapPanel._get_layer(mapPanel._active_layer_id);
				
				layer.controls['modify'].deactivate();
				layer.controls['draw'].activate();
			}
		},
		/* POLYGON TOOLBARS */
		{
			text: 'Add New Polygon',
			cls: 'edit-polygon-mode',
			hidden: true,
			handler: function(b, e) {
			}
		},{
			id: 'mappanel-edit-polygon-mode',
			text: 'Choose Edit Mode',
			cls: 'edit-polygon-mode',
			hidden: true,
			menu: {
				items: [{
					text: 'Move Position',
					checked: true,
					group: 'polygon',
					action_type: 'move',
					checkHandler: function(item, checked) {
						var mapPanel = Ext.getCmp('workspace-map-panel');
						mapPanel._active_controls.deactivate();
						mapPanel._active_controls.mode = OpenLayers.Control.ModifyFeature.DRAG;
						mapPanel._active_controls.activate();
					}
				},{
					text: 'Reshape',
					checked: false,
					group: 'polygon',
					action_type: 'reshape',
					checkHandler: function(item, checked) {
						var mapPanel = Ext.getCmp('workspace-map-panel');
						mapPanel._active_controls.deactivate();
						mapPanel._active_controls.mode = OpenLayers.Control.ModifyFeature.RESHAPE;
						mapPanel._active_controls.activate();
					}
				},{
					text: 'Resize and Rotate',
					checked: false,
					group: 'polygon',
					action_type: 'resize_rotate',
					checkHandler: function(item, checked) {
						var mapPanel = Ext.getCmp('workspace-map-panel');
						mapPanel._active_controls.deactivate();
						mapPanel._active_controls.mode = OpenLayers.Control.ModifyFeature.ROTATE;
						mapPanel._active_controls.mode |= OpenLayers.Control.ModifyFeature.RESIZE;
						mapPanel._active_controls.activate();
					}
				}]
			}
		}],
		enterEditMode: function(layer_id, spatial_type, dirty_callback) {
			this._dirty_callback = dirty_callback;
			
			// Switch toolbar to edit mode
			this.getTopToolbar().items.each(function(item, index, length) {
				item.setVisible(item.initialConfig.cls == 'edit-'+spatial_type+'-mode');
			});
			
			// Deactivate all controls
			for(var i=0; i<this.loaded_layers.length; i++) {
				for(var key in this.loaded_layers[i]['controls']) {
					this.loaded_layers[i]['controls'][key].deactivate();
				}
			}
			
			// Set edit mode to first item
			var editModeToolbarButton = Ext.getCmp('mappanel-edit-' + spatial_type + '-mode');
			if(editModeToolbarButton) editModeToolbarButton.menu.items.items[0].setChecked(true);
			
			var control = this._get_layer(layer_id)['controls']['modify'];
			control.mode = OpenLayers.Control.ModifyFeature.DRAG;
			
			this._active_layer_id = layer_id;
			control.activate();
		},
		enterViewMode: function() {
			// Switch toolbar to view mode
			this.getTopToolbar().items.each(function(item, index, length) {
				item.setVisible(item.initialConfig.cls == 'view-mode');
			});
			
			for(var i=0; i<this.loaded_layers.length; i++) {
				for(var key in this.loaded_layers[i]['controls']) {
					this.loaded_layers[i]['controls'][key].deactivate();
				}
			}
		}
	};
}

OpenLayersMapPanel = Ext.extend(Ext.Panel, {
	initComponent : function() {
		OpenLayersMapPanel.superclass.initComponent.call(this);
	},
	
	afterRender : function() {
		var thisMapPanel = this;
		var wh = this.ownerCt.getSize();
		Ext.applyIf(this, wh);
		
		OpenLayersMapPanel.superclass.afterRender.call(this);
		
		this.base_layers = new Object();
		this.loaded_layers = new Array();
		
		var options = {
			units: "m",
			maxResolution: 156543.0339,
			maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34)
		};
		this.map = new OpenLayers.Map(this.body.dom.id, options);
		
		this.map.addControl(new OpenLayers.Control.MousePosition());
		
		this.base_layers['google'] = new OpenLayers.Layer.Google("Google", {type:G_HYBRID_MAP, sphericalMercator:true});
		
		this.base_layers['osm'] = new OpenLayers.Layer.TMS(
			"OpenStreetMap", "http://tile.openstreetmap.org/",
			{
				type: 'png', getURL: osm_getTileURL,
				displayOutsideMaxExtent: false,
				attribution: '<a href="http://www.openstreetmap.org/">OpenStreetMap</a>'
			}
		);
		
		this.map.addLayers([this.base_layers['google'], this.base_layers['osm']]);
		
		// Load map data if 'preloaded_layers' variable is supplied
		var url_string = '';
		for(var i=0; i<this.preloaded_layers.length; i++) {
			if(this.preloaded_layers[i][2]) {
				if(url_string != '') url_string = url_string + '&';
				url_string = url_string + 'layer=' + this.preloaded_layers[i][0];
			}
		}
		
		this.map.zoomToMaxExtent();
		
		if(url_string != '') {
			this._loadLayerData(url_string, true);
		}
	},
	
	switchBaseLayer: function(layer_code) {
		this.map.setBaseLayer(this.base_layers[layer_code]);
	},
	
	showLayer: function(layer_id) {
		var layer = this.map.getLayer(layer_id);
		if(layer == null) {
			var url_string = 'layer=' + layer_id;
			this._loadLayerData(url_string, false);
		} else {
			layer.setVisibility(true);
		}
	},
	
	hideLayer: function(layer_id) {
		this.map.getLayer(layer_id).setVisibility(false);
	},
	
	getLayerFeatures: function(layer_id) {
		var wktParser = new OpenLayers.Format.WKT();
		var layer = this.map.getLayer(layer_id);
		
		var features = new Array();
		for(var i=0; i<layer.features.length; i++) {
			features.push({id:layer.features[i].id, wkt:wktParser.write(layer.features[i])});
		}
		
		return features;
	},
	
	focusLayerFeature: function(layer_id, feature_id, data) {
		var feature = this._get_layer(layer_id)['vector'].getFeatureById(feature_id);
		var point = feature.geometry.getCentroid();
		
		if(this.popup != undefined && this.popup != null) this.map.removePopup(this.popup);
		
		this.popup = new OpenLayers.Popup.FramedCloud(
			"feature_info",
			new OpenLayers.LonLat(point.x, point.y),
			new OpenLayers.Size(50,50),
			"example popup",
			null,
			true);
		
		this.map.addPopup(this.popup);
	},
	
	/*
	PRIVATE FUNCTIONS
	*/
	_adjustExtent: function(bounds) {
		this.map.setCenter(bounds.getCenterLonLat());
		this.map.zoomToExtent(bounds);
	},
	_loadLayerData: function(url_string, is_adjust) {
		var _this = this;
		Ext.Ajax.request({
			url: '/ajax/workspace/get-table-spatial-data/',
			method: 'GET',
			success: function(response, opts) {
				var obj = Ext.decode(response.responseText);
				var wktParser = new OpenLayers.Format.WKT();
				var bounds = new OpenLayers.Bounds();
				
				for(var i=0; i<obj.layers.length; i++) {
					var layer = obj.layers[i];
					
					// Remove existing layer (with the same layer id)
					var existing_layer = _this.map.getLayer(layer.id);
					if(existing_layer != null) _this.map.removeLayer(existing_layer);
					
					var vector = new OpenLayers.Layer.Vector(layer.name, {
						eventListeners: {
							"afterfeaturemodified":function(ev) {
								// TODO: Check if feature is dirty
								var mapPanel = Ext.getCmp('workspace-map-panel');
								if(mapPanel._dirty_callback) {
									mapPanel._dirty_callback();
								}
							}
						}
					});
					vector.id = layer.id;
					
					for(var j=0; j<layer.rows.length; j++) {
						var feature = wktParser.read(layer.rows[j].spatial);
						feature.id = layer.rows[j].id;
						vector.addFeatures(feature);
						if(is_adjust) bounds.extend(feature.geometry.getBounds());
					}
					
					_this.map.addLayer(vector);
					
					var controls;
					if(layer.spatial_type == 1) { // POINT
						controls = {
							draw: new OpenLayers.Control.DrawFeature(vector, OpenLayers.Handler.Point, {eventListeners: {"featureadded": onFeatureAdded}}),
							modify: new OpenLayers.Control.ModifyFeature(vector, {clickout:true, toggle:false})
						};
						
					} else if(layer.spatial_type == 2) { // LINESTRING
						
					} else if(layer.spatial_type == 3) { // POLYGON
						controls = {
							draw: new OpenLayers.Control.DrawFeature(vector, OpenLayers.Handler.Polygon, {eventListeners: {"featureadded": onFeatureAdded}}),
							modify: new OpenLayers.Control.ModifyFeature(vector, {clickout:true, toggle:false})
						};
						
					} else if(layer.spatial_type == 4) { // MULTIPOINT
						
					} else if(layer.spatial_type == 5) { // MULTILINESTRING
						
					} else if(layer.spatial_type == 6) { // MULTIPOLYGON
						
					}
					
					for(key in controls) {
						_this.map.addControl(controls[key]);
					}
					
					_this.loaded_layers.push({'id':layer.id, 'name':layer.name, 'vector':vector, 'controls':controls});
				}
				
				if(is_adjust) _this._adjustExtent(bounds);
			},
			failure: function(response, opts) {},
			params: url_string
		});
	},
	_get_layer: function(layer_id) {
		for(var i=0; i<this.loaded_layers.length; i++) {
			if(this.loaded_layers[i]['id'] == layer_id) return this.loaded_layers[i];
		}
		return null;
	}
});
Ext.reg('openlayers_mappanel', OpenLayersMapPanel);

function onFeatureAdded(e) {
	var mapPanel = Ext.getCmp('workspace-map-panel');
	var layer = mapPanel._get_layer(mapPanel._active_layer_id);
	layer.controls['draw'].deactivate();
	layer.controls['modify'].activate();
	
	var button = Ext.getCmp('mappanel-add-point-button');
	button.toggle(false);
	
	var wktParser = new OpenLayers.Format.WKT();
	
	_data_popup_windows.show_add(mapPanel._active_layer_id, wktParser.write(e.feature), function(action, row_id) {
		if(action == 'save') {
			e.feature.id = row_id;
		}
		
		if(action == 'cancel') {
			e.feature.layer.removeFeatures(e.feature);
		}
	});
}

function osm_getTileURL(bounds) {
	var res = this.map.getResolution();
	var x = Math.round((bounds.left - this.maxExtent.left) / (res * this.tileSize.w));
	var y = Math.round((this.maxExtent.top - bounds.top) / (res * this.tileSize.h));
	var z = this.map.getZoom();
	var limit = Math.pow(2, z);
	
	if (y < 0 || y >= limit) {
		return OpenLayers.Util.getImagesLocation() + "404.png";
	} else {
		x = ((x % limit) + limit) % limit;
		return this.url + z + "/" + x + "/" + y + "." + this.type;
	}
}
