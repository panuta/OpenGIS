MapEditorField = Ext.extend(Ext.form.TriggerField, {
	
	is_map_editor: true,
	parentGrid: null,
	editingColumn: null,
	editingRow: null,
	
	mapEditorWindow:null,
	
	initComponent: function() {
		var defaultConfig = {
			editable: false,
			triggerClass:'x-form-search-trigger'
		};
		Ext.applyIf(this, defaultConfig);
		
		MapEditorField.superclass.initComponent.call(this);
	},
	onTriggerClick : function(e) {
		this.parentGrid.stopEditing(false);
		
		if(!this.mapEditorWindow) {
			var mapEditorWindow = new Ext.Window({
				layout:'fit',
				width:700,
				modal:true,
				height:400,
				closeAction:'hide',
				plain: true,
				title: 'Map Editor',
				items: {
					xtype: 'openlayer_mappanel'
				},
				buttons: [{
					text:'Submit',
					handler: function(button, e) {
						mapEditorWindow.hide();
					}
				},{
					text: 'Close',
					handler: function() {
						mapEditorWindow.hide();
					}
				}],
				onsubmit: function(wkt) {}
			});
			
			this.mapEditorWindow = mapEditorWindow;
		}
		
		this.mapEditorWindow.show(this);
		
		this.mapEditorWindow.on('hide', function(e) {
			var wkt = this.mapEditorWindow.items.first().retrieveWKT();
			MapEditorField.superclass.setValue.call(this, wkt);
			
			var column_id = this.parentGrid.getColumnModel().getColumnId(this.editingColumn);
			this.parentGrid.getStore().getAt(this.editingRow).set(column_id, wkt);
		}, this);
		
		this.mapEditorWindow.items.first().editWKT(this.getValue());
	}
});

OpenLayerMapPanel = Ext.extend(Ext.Panel, {
	initComponent : function(){
		var defConfig = {
			zoomLevel: 8
		};
		
		Ext.applyIf(this,defConfig);
		OpenLayerMapPanel.superclass.initComponent.call(this);
	},
	
	afterRender : function(){
		var wh = this.ownerCt.getSize();
		Ext.applyIf(this, wh);
		
		OpenLayerMapPanel.superclass.afterRender.call(this);
		
		this.map = new OpenLayers.Map(this.body.dom.id);
		this.map.addControl(new OpenLayers.Control.MousePosition());
		
		var wms = new OpenLayers.Layer.WMS("OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0", {layers: 'basic'} );
		this.map.addLayer(wms);
		
		this.vectors = new OpenLayers.Layer.Vector("Editing Layer");
		this.map.addLayer(this.vectors);
		
		this.control = new OpenLayers.Control.ModifyFeature(this.vectors, {clickout:false, toggle:false});
		this.map.addControl(this.control);
	},
	editWKT: function(wkt) {
		var wktParser = new OpenLayers.Format.WKT();
		var feature = wktParser.read(wkt);
		
		this.vectors.destroyFeatures();
		this.vectors.addFeatures(feature);
		
		var bounds = this.vectors.getDataExtent();
		
		this.map.setCenter(bounds.getCenterLonLat(), 7);
		
		if(!(feature.geometry instanceof OpenLayers.Geometry.Point)) {
			this.map.zoomToExtent(bounds);
		}
		
		this.control.selectFeature(feature);
	},
	retrieveWKT: function() {
		this.control.deactivate();
		this.control.activate();
		
		var wktParser = new OpenLayers.Format.WKT();
		var wktString = wktParser.write(this.vectors.features);
		return wktString.substring(19, wktString.length-1); // Remove GEOMETRYCOLLECTION
	}
});

Ext.reg('openlayer_mappanel', OpenLayerMapPanel);
