/*
GLOBAL VARIABLES
*/


/*
OPEN LAYERS MAP PANEL ************************************************************************************
*/

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

function initializeMapPanel() {
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
		}]
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
function initializeLayersGrid() {
	var sm = new Ext.grid.CheckboxSelectionModel({checkOnly: true});
	
	var cm = new Ext.grid.ColumnModel({
		defaults: {sortable: true},
		columns: [sm, {
			id: 'name',
			header: 'Name',
			dataIndex: 'name',
			width: 250
		}]
	});
	
	var store = new Ext.data.ArrayStore({
		fields: [
			{name: 'name'}
		]
	});
	
	var dummyData = [
		['<span class="layer_item">Test Layer 1<div>status:<span>No change</span></div></span>'],
		['<span class="layer_item layer_item_modified">Test Layer 2<div>status:<span>Modified</span></div></span>'],
		['<span class="layer_item">Test Layer 3<div>status:<span>Saved on 12:14 AM</span></div></span>']
	];
	
	store.loadData(dummyData);
	
	// create the editor grid
	var grid = new Ext.grid.GridPanel({
		region: 'center',
		layout: 'fit',
		store: store,
		cm: cm,
		border: true,
		frame: false,
		selModel: sm,
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
	
	return grid;
}

/*
DATA GRID **********************************************************************************************************
*/
function initializeDataTabPanel() {
	var tabs = new Ext.TabPanel({
		activeTab: 0,
		region: 'south',
		border: true,
		frame: false,
		margins: '5 0 0 0',
		height:200,
		items:[
			{title: 'Test Layer 1', layout: 'fit', items: [initializeDataGrid()]},
			{title: 'Test Layer 2'},
			{title: 'Test Layer 3'}
		]
	});
	
	return tabs;
}

function initializeDataGrid() {
	var sm = new Ext.grid.CheckboxSelectionModel();
	
	var cm = new Ext.grid.ColumnModel({
		defaults: {sortable: true},
		columns: [sm, {
			id: 'name',
			header: 'Name',
			dataIndex: 'name',
			width: 250
		},{
			id: 'something',
			header: 'Something',
			dataIndex: 'something',
			width: 450
		}]
	});
	
	var store = new Ext.data.ArrayStore({
		fields: [
			{name: 'name'},
			{name: 'something'}
		]
	});
	
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




/*
VIEW WORKSPACE VIEWPORT **************************************************************************************************
*/
function initializeWorkspaceViewport1() {
	
	var dataGrid = initializeDataGrid();
	
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
			items: []
		},{
			/* CENTER */
			region: 'center',
			layout: 'border',
			contentEl: 'center',
			split: false,
			border: false,
			margins: '0 5 5 0'
		}]
		
	});
}

function initializeWorkspaceViewport() {
	var dataGrid = initializeDataGrid();
	
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
			items: [initializeModeSelectionButtons(), initializeLayersGrid()]
		},{
			/* CENTER */
			region: 'center',
			layout: 'border',
			contentEl: 'center',
			split: false,
			border: false,
			margins: '0 5 5 0',
			items: [initializeMapPanel(), initializeDataTabPanel()]
		}]
	});
}


