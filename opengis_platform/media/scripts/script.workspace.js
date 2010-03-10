/*
GLOBAL VARIABLES
*/

/*
OPEN LAYERS MAP PANEL ************************************************************************************
*/

OpenLayerMapPanel = Ext.extend(Ext.Panel, {
	initComponent : function(){
		var defConfig = {
			centerLat: 20,
			centerLng: 110,
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
		
		this.vectors = new OpenLayers.Layer.Vector("Editing");
		this.map.addLayer(this.vectors);
		
		// Load map data
		var layer_string = '';
		for(var i=0; i<this.preloaded_layers.length; i++) {
			if(this.preloaded_layers[i][2]) {
				if(layer_string != '') layer_string = layer_string + '&';
				layer_string = layer_string + 'layer=' + this.preloaded_layers[i][0];
			}
		}
		
		Ext.Ajax.request({
			url: '/workspace/ajax/layers/map/',
			method: 'GET',
			success: function(response, opts) {
				var obj = Ext.decode(response.responseText);
				
				for(var i=0; i<obj.layers.length; i++) {
					for(var j=0; j<obj.layers[i].rows.length; j++) {
						for(var k=0; k<obj.layers[i].rows[j].spacial.length; k++) {
							this.addWKTFeature(obj.layers[i].rows[j].spacial[k]);
						}
					}
				}
				
				Ext.getCmp('workspace-map-panel').adjustCenterAndZoom();
			},
			failure: function(response, opts) {},
			params: layer_string
		});
		
		//this.control = new OpenLayers.Control.ModifyFeature(this.vectors, {clickout:false, toggle:false});
		//this.map.addControl(this.control);
		
		this.map.setCenter(new OpenLayers.LonLat(this.centerLng, this.centerLat), 7);
	},
	addWKTFeature: function(wkt) {
		var wktParser = new OpenLayers.Format.WKT();
		var feature = wktParser.read(wkt);
		
		this.vectors.addFeatures(feature);
	},
	adjustCenterAndZoom: function() {
		var bounds = this.vectors.getDataExtent();
		this.map.setCenter(bounds.getCenterLonLat(), 7);
		this.map.zoomToExtent(bounds);
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




LayerDataGrid = Ext.extend(Ext.grid.GridPanel, {
	initComponent : function(){
		var store = new Ext.data.Store({
			autoDestroy: true,
			url: '/workspace/ajax/layer/data/extjs/?id=' + this.layer_id,
			reader: new Ext.data.JsonReader()
		});
		
		var defConfig = {
			store: store,
			region: 'south',
			border: false,
			frame: false,
			height:200,
			cm: new Ext.grid.ColumnModel({columns:[]}),
			sm: new Ext.grid.CheckboxSelectionModel({selectSingle:false, checkOnly:true}),
			loadMask: true,
			tbar: [{
				text: 'Add new row'
			},{
				text: 'Zoom to'
			},{
				text: 'Delete row'
			}],
			margins: '5 0 0 0'
		};
		Ext.apply(this, defConfig);
		
		LayerDataGrid.superclass.initComponent.call(this);
	},
	afterRender : function(){
		var grid = this;
		
		this.store.on('load', function() {
			var columns = [];
			var sm = new Ext.grid.CheckboxSelectionModel({selectSingle:false, checkOnly:true});
			columns.push(sm);
			
			Ext.each(grid.store.reader.jsonData.columns, function(column) {
				columns.push(column);
			});
			
			grid.getColumnModel().setConfig(columns);
		});
		
		this.store.load();
		LayerDataGrid.superclass.afterRender.call(this);
	}
});
Ext.reg('layer_data_grid', LayerDataGrid);





function initializeMapPanel(preloaded_layers) {
	return {
		id: 'workspace-map-panel',
		xtype:'openlayer_mappanel',
		region:'center',
		tbar: [{
			text: 'View All',
			cls: 'view-mode'
		},{
			text: 'Zoom In',
			cls: 'view-mode'
		},{
			text: 'Modify Shape',
			cls: 'edit-mode',
			hidden: true
		}],
		preloaded_layers: preloaded_layers
	};
}

function getMapToolbarByMode(mode) {
	if(mode == 'view') {
		return new Ext.Toolbar({
			items: [{
				text: 'View All'
			}, {
				text: 'Zoom In'
			}, {
				text: 'Zoom Out'
			}]
		});
		
	} else 	if(mode == 'edit') {
		return new Ext.Toolbar({
			items: [{
				text: 'Modify Shape'
			}, {
				text: 'Rotate and Resize'
			}, {
				text: 'Move'
			}]
		});
	}
}

/*
MODE SELECTION BUTTONS **************************************************************************************************
*/
function changeMapToolbarMode(mode) {
	var mapPanel = Ext.getCmp('workspace-map-panel');
	
	mapPanel.getTopToolbar().items.each(function(item, index, length) {
		item.setVisible(item.initialConfig.cls == mode);
	});
}

function initializeModeSelectionButtons() {
	return {
		region: 'north',
		layout: 'vbox',
		width: 274,
		height: 80,
		layoutConfig: {
			align:'stretch',
			padding: '5 5 0 5'
		},
		defaults: {margins:'0 0 5 0'},
		items: [{
			xtype: 'button',
			text: 'View Mode',
			flex: 1,
			enableToggle: true,
			pressed: true,
			toggleGroup: 'map_mode',
			handler: function(b, e) {
				changeMapToolbarMode('view-mode');
			}
		},{
			xtype: 'button',
			text: 'Edit Mode',
			flex: 1,
			enableToggle: true,
			toggleGroup: 'map_mode',
			handler: function(b, e) {
				changeMapToolbarMode('edit-mode');
			}
		}],
		margins: '0 0 5 0'
	};
}

/*
LAYERS GRID ********************************************************************************************************
*/


function initializeLayersGrid(preloaded_layers) {
	var store = new Ext.data.ArrayStore({
		fields: [
			{name: 'id'},
			{name: 'name'},
			{name: 'show_map', type: 'boolean'},
			{name: 'show_data', type: 'boolean'}
		]
	});
	
	store.loadData(preloaded_layers);
	
	var tpl = new Ext.XTemplate(
		'<tpl for=".">',
			'<div class="layer_item">',
				'<h3>{name}</h3><div class="status">status: <span>No change</span></div>',
				'<div class="actions">',
					'<label><input type="checkbox" class="show_map_checkbox" name="show-map" <tpl if="show_map">checked="checked"</tpl>/> Show Map</label>',
					'<label><input type="checkbox" class="show_data_checkbox" name="show-data" <tpl if="show_data">checked="checked"</tpl>/> Show Data</label>',
				'</div>',
			'</div>',
		'</tpl>'
	);
	
	var panel = new Ext.Panel({
		region: 'center',
		layout:'fit',
		title:'Layers',
		border: true,
		frame: false,
		items: new Ext.DataView({
			store: store,
			tpl: tpl,
			autoHeight:true,
			itemSelector:'div.layer_item',
			listeners: {
				click: function(t, index, node, e) {
					if(e.getTarget(".show_map_checkbox", node)) {
						console.log(e.getTarget().checked);
						console.log(t.store.getAt(index).get('id'));
						
					}
					
					if(e.getTarget(".show_data_checkbox", node)) {
						
					}
				}
			}
		}),
		tbar: [
			new Ext.Toolbar.SplitButton({
				text: 'Add Layer',
				menu: [
					{text: 'Add Layer from existing table'},
					{text: 'Add Layer from new table'}
				]
			}),'-',{
				text: 'Save'
			},{
				text:'Layer Actions',
				menu: new Ext.menu.Menu({
					text: 'Layer Actions',
					items: [
						{text: 'Discard modification'},
						'-',
						{text: 'Remove layer'}
					]
				})
			}
		]
	});
	
	return panel;
}

/*
DATA GRID **********************************************************************************************************
*/
function initializeDataTabPanel(preloaded_layers) {
	var tabItems = new Array();
	
	for(var i=0; i<preloaded_layers.length; i++) {
		if(preloaded_layers[i][3] == true) {
			tabItems.push({title:preloaded_layers[i][1], layout:'fit', items:[{xtype:'layer_data_grid', layer_id:preloaded_layers[i][0]}]});
		}
	}
	
	var tabs = new Ext.TabPanel({
		activeTab: 0,
		region: 'south',
		border: true,
		split: true,
		collapseMode: 'mini',
		frame: false,
		height:200,
		items: tabItems
	});
	
	return tabs;
}

/*
function initializeDataGrid() {
	var sm = new Ext.grid.CheckboxSelectionModel();
	
	var cm = new Ext.grid.ColumnModel({
		defaults: {sortable: true},
		columns: [sm, {
			id: 'name',
			header: 'Name',
			dataIndex: 'name'
		},{
			id: 'something',
			header: 'Something',
			dataIndex: 'something'
		}]
	});
	
	var store = new Ext.data.ArrayStore({
		fields: [
			{name: 'name'},
			{name: 'something'}
		]
	});
	
	// this.store.on('load', function(){
	
	store.loadData([
		['Name1', 'Something1'],
		['Name2', 'Something2']
	]);
	
	// create the editor grid
	var grid = new Ext.grid.GridPanel({
		store: store,
		region: 'south',
		cm: cm,
		border: false,
		frame: false,
		height:200,
		tbar: [{
			text: 'Add new row'
		},{
			text: 'Zoom to'
		},{
			text: 'Delete row'
		}],
		margins: '5 0 0 0',
		selModel: sm
	});
	
	return grid
}
*/

/*
VIEW WORKSPACE VIEWPORT **************************************************************************************************
*/

function initializeWorkspaceViewport() {
	
	var preloaded_layers = new Array();
	Ext.get('workspace-layers').select('li').each(function(el, c, idx) {
		var is_show_map = false;
		if(el.select('.show_map').first().dom.innerHTML == 'True') is_show_map = true;
		
		var is_show_data = false;
		if(el.select('.show_data').first().dom.innerHTML == 'True') is_show_data = true;
		
		preloaded_layers.push([
			el.select('.layer_id').first().dom.innerHTML,
			el.select('.layer_name').first().dom.innerHTML,
			is_show_map,
			is_show_data
		]);
	});
	
	var viewport = new Ext.Viewport({
		layout:'border',
		cls: 'view_workspace_page',
		items: [{
			/* NORTH */
			region: 'north',
			xtype: 'box',
			applyTo: 'header',
			height: 30
		},{
			/* WEST */
			region: 'west',
			contentEl: 'west',
			layout: 'border',
			border: false,
			split: true,
			width: 274,
			minSize: 250,
			margins: '0 0 5 5',
			items: [initializeModeSelectionButtons(), initializeLayersGrid(preloaded_layers)]
		},{
			/* CENTER */
			region: 'center',
			layout: 'border',
			contentEl: 'center',
			split: false,
			border: false,
			margins: '0 5 5 0',
			items: [initializeMapPanel(preloaded_layers), initializeDataTabPanel(preloaded_layers)]
		}]
	});
}
