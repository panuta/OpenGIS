/*
GLOBAL VARIABLES
*/

/*
OPEN LAYERS MAP PANEL ************************************************************************************
*/

OpenLayersMapPanel = Ext.extend(Ext.Panel, {
	initComponent : function(){
		var defConfig = {
			centerLat: 20,
			centerLng: 110,
			zoomLevel: 8
		};
		
		Ext.applyIf(this,defConfig);
		OpenLayersMapPanel.superclass.initComponent.call(this);
	},
	
	afterRender : function(){
		var thisMapPanel = this;
		var wh = this.ownerCt.getSize();
		Ext.applyIf(this, wh);
		
		OpenLayersMapPanel.superclass.afterRender.call(this);
		
		this.loaded_layers = new Array();
		this.map = new OpenLayers.Map(this.body.dom.id);
		this.map.addControl(new OpenLayers.Control.MousePosition());
		
		var wms = new OpenLayers.Layer.WMS("OpenLayers WMS", "http://labs.metacarta.com/wms/vmap0", {layers: 'basic'} );
		this.map.addLayer(wms);
		
		// Load map data
		var url_string = '';
		for(var i=0; i<this.preloaded_layers.length; i++) {
			if(this.preloaded_layers[i][2]) {
				if(url_string != '') url_string = url_string + '&';
				url_string = url_string + 'layer=' + this.preloaded_layers[i][0];
			}
		}
		
		if(url_string != '') {
			this._loadLayerData(url_string, true);
		} else {
			this.map.setCenter(new OpenLayers.LonLat(this.centerLng, this.centerLat), 7);
		}
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
	adjust: function(bounds) {
		this.map.setCenter(bounds.getCenterLonLat());
		this.map.zoomToExtent(bounds);
	},
	_loadLayerData: function(url_string, is_adjust) {
		var _this = this;
		Ext.Ajax.request({
			url: '/workspace/ajax/layers/map/',
			method: 'GET',
			success: function(response, opts) {
				var obj = Ext.decode(response.responseText);
				var wktParser = new OpenLayers.Format.WKT();
				var bounds = new OpenLayers.Bounds();
				
				for(var i=0; i<obj.layers.length; i++) {
					var layer = obj.layers[i];
					
					// Remove existing layer
					var existing_layer = _this.map.getLayer(layer.id);
					if(existing_layer != null) _this.map.removeLayer(existing_layer);
					
					var vector = new OpenLayers.Layer.Vector(layer.name);
					vector.id = layer.id;
					
					for(var j=0; j<layer.rows.length; j++) {
						for(var k=0; k<layer.rows[j].spacial.length; k++) {
							var feature = wktParser.read(layer.rows[j].spacial[k]);
							vector.addFeatures(feature);
							if(is_adjust) bounds.extend(feature.geometry.getBounds());
						}
					}
					
					_this.loaded_layers.push({'id':layer.id, 'name':layer.name});
					_this.map.addLayer(vector);
				}
				
				if(is_adjust) _this.adjust(bounds);
			},
			failure: function(response, opts) {},
			params: url_string
		});
	},
	startModifyShape: function() {
		for(var i=0; i<this.loaded_layers.length; i++) {
			console.log('start modify ' + this.loaded_layers[i]['id']);
			var layer = this.map.getLayer(this.loaded_layers[i]['id']);
			
			var control = new OpenLayers.Control.ModifyFeature(layer, {clickout:true, toggle:false});
			this.map.addControl(control);
			control.activate();
		}
	}
});
Ext.reg('openlayers_mappanel', OpenLayersMapPanel);

LayerDataPanel = Ext.extend(Ext.TabPanel, {
	initComponent : function() {
		var tabItems = new Array();
		
		for(var i=0; i<this.preloaded_layers.length; i++) {
			if(this.preloaded_layers[i][3] == true) {
				tabItems.push({
					id:'data-panel-tab-' + this.preloaded_layers[i][0],
					title:this.preloaded_layers[i][1],
					layout:'fit',
					layer_id:this.preloaded_layers[i][0],
					items:[{
						xtype:'layer_data_grid',
						layer_id:this.preloaded_layers[i][0]
					}]
				});
			}
		}
		
		var defConfig = {
			activeTab: 0,
			region: 'center',
			border: false,
			items: tabItems
		};
		
		Ext.applyIf(this,defConfig);
		LayerDataPanel.superclass.initComponent.call(this);
	},
	afterRender : function() {
		LayerDataPanel.superclass.afterRender.call(this);
	},
	showLayer: function(layer_id, layer_name) {
		var _this = this;
		var item = Ext.getCmp('data-panel-tab-' + layer_id);
		
		if(item == null) {
			item = _this.add({
				id:'data-panel-tab-' + layer_id,
				title:layer_name,
				layout:'fit',
				layer_id:layer_id,
				items:[{
					xtype:'layer_data_grid',
					layer_id:layer_id
				}]
			});
		} else {
			_this.unhideTabStripItem(item);
			item.show();
		}
		
		_this.setActiveTab(item);
		
		if(Ext.getCmp('workspace-data-panel-container').hidden) {
			Ext.getCmp('workspace-data-panel-container').show();
			Ext.getCmp('workspace-data-panel-container').ownerCt.doLayout();
		}
	},
	hideLayer: function(layer_id) {
		var _this = this;
		var item = Ext.getCmp('data-panel-tab-' + layer_id);
		
		_this.hideTabStripItem(item);
		item.hide();
		
		var visibleItems = 0;
		Ext.each(this.items.items, function(item) {
			var el = _this.getTabEl(item);
			if(el.style.display != 'none') {
				visibleItems = visibleItems + 1;
				_this.setActiveTab(item);
			}
		});
		
		if(visibleItems == 0) {
			Ext.getCmp('workspace-data-panel-container').hide();
			Ext.getCmp('workspace-data-panel-container').ownerCt.doLayout();
		}
	}
});
Ext.reg('layer_data_panel', LayerDataPanel);

LayerDataGrid = Ext.extend(Ext.grid.GridPanel, {
	initComponent : function(){
		var store = new Ext.data.Store({
			autoDestroy: true,
			url: '/workspace/ajax/layer/data/extjs/?id=' + this.layer_id,
			reader: new Ext.data.JsonReader()
		});
		
		var defConfig = {
			store: store,
			border: false,
			cm: new Ext.grid.ColumnModel({columns:[]}),
			sm: new Ext.grid.CheckboxSelectionModel({selectSingle:true}),
			loadMask: true
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
		xtype:'openlayers_mappanel',
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
			hidden: true,
			handler: function(b, e) {
				var mapPanel = Ext.getCmp('workspace-map-panel');
				mapPanel.startModifyShape();
			}
		},{
			text: 'Rotate and Resize',
			cls: 'edit-mode',
			hidden: true
		},{
			text: 'Move',
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
					'<label><input type="checkbox" class="show_map_checkbox" name="show-map" <tpl if="show_map">checked="checked"</tpl>/> Show in Map</label>',
					'<label><input type="checkbox" class="show_data_checkbox" name="show-data" <tpl if="show_data">checked="checked"</tpl>/> Data List</label>',
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
						var mapPanel = Ext.getCmp('workspace-map-panel');
						
						if(e.getTarget().checked) {
							mapPanel.showLayer(t.store.getAt(index).get('id'));
						} else {
							mapPanel.hideLayer(t.store.getAt(index).get('id'));
						}
					}
					
					if(e.getTarget(".show_data_checkbox", node)) {
						var dataPanel = Ext.getCmp('workspace-data-panel');
						
						if(e.getTarget().checked) {
							dataPanel.showLayer(t.store.getAt(index).get('id'), t.store.getAt(index).get('name'));
						} else {
							dataPanel.hideLayer(t.store.getAt(index).get('id'));
						}
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
	return {
		id:'workspace-data-panel-container',
		layout:'border',
		region:'south',
		split: true,
		collapseMode: 'mini',
		height:200,
		items: [{
			xtype:'layer_data_panel',
			id: 'workspace-data-panel',
			region:'center',
			preloaded_layers: preloaded_layers
		}],
		tbar: [{
			text: 'Add new row'
		},{
			text: 'Zoom to'
		},{
			text: 'Delete row'
		}]
	}
	
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
